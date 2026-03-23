## StatefulSet

A **StatefulSet** is a workload controller for pods that need a **stable, persistent identity**. Unlike a Deployment - where all replicas are identical and interchangeable - each pod in a StatefulSet has a unique, ordered identity (`myapp-0`, `myapp-1`, ...) that is preserved across restarts and rescheduling.

This distinction is crucial for applications that require stable network identities or persistent storage. A PostgreSQL replica, for example, must always come back as the **same** replica - same hostname, same storage. If that were not the case, from the application perspective, it would look like the replica lost all its data.

<details>

<summary>
Deep Dive: Why do applications like databases require stable identities and persistent storage?
</summary>

Modern applications are designed to be scalable and resilient, which often means they can run as multiple coordinated instances (replicas). For some applications, like stateless web servers, it doesn't matter which instance serves a request - any replica can handle it. For others, like databases, each instance has a specific role and state that must be preserved.

:::note
We will refer to a set of such instances as a **cluster**. Do not confuse this with a Kubernetes cluster.
:::

Let's take the example of a database cluster and see why preserving identities and storage is important:

1. **Data routing** - data is split into shards, each owned by a specific replica, so reads and writes can be routed directly to the right place. If a replica restarts with a different identity, the cluster treats it as a brand-new empty node and loses track of which shard it holds - requests for that data can no longer be routed, and read traffic can't be balanced across replicas either.
1. **Replication safety** - to guard against failures, each shard is copied to multiple replicas (typically 3). If a replica restarts with a different identity, the cluster sees an unknown member and starts re-replicating data *to* it, potentially overwriting data that was still valid on that node or dropping in-flight writes.
1. **Coordination** - replicas elect a leader that decides shard assignments, admission of new members, and failover. Leader election and role assignment are tied to stable identities. A replica that returns with a new identity looks like an unknown member joining the cluster, triggering unnecessary re-elections and shard rebalancing that cause downtime and churn.

Designing an application to be resilient to changing identities and storage is possible, but it adds significant complexity and overhead. StatefulSets provide a simple way to give applications the stable identities and persistent storage they need, without having to build that logic into the application itself.

</details>

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: myapp
spec:
  # How many replicas to create.
  replicas: 3

  # How to identify the pods that belong to this StatefulSet.
  selector:
    matchLabels:
      app: myapp

  # How to create the pods.
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
      - name: myapp
        image: busybox
        command: ["sh", "-c", "while true; do echo $(hostname): $(date) >> /data/log.txt; sleep 5; done"]

        # Mount the volume created from the volumeClaimTemplates.
        volumeMounts:
        - name: data
          mountPath: /data

  # How to provision storage for each pod.
  volumeClaimTemplates:
  - metadata:
      name: data
    spec:
      accessModes:
        - ReadWriteOnce
      storageClassName: standard
      resources:
        requests:
          storage: 1Gi
```

:::note
You might wonder whether you could achieve the same result by creating a Deployment and manually creating one PVC per replica. This is technically possible, falls apart quickly because Deployment names its pods with random hashes (`myapp-7d9f8b-xkz2p`), so after a restart there is no reliable way to know which pod should mount which PVC.
:::

Here is a quick comparison of the key differences between Deployments and StatefulSets:

| | Deployment | StatefulSet |
|---|---|---|
| Pod names | Random hash (`myapp-7d9f8b-xkz2p`) | Stable index (`myapp-0`, `myapp-1`) |
| Per-pod DNS | No | Yes (`myapp-0.myapp.svc.cluster.local`) |
| Storage | All replicas share one PVC | One PVC per pod via `volumeClaimTemplates` |
| Startup / shutdown order | Parallel, no guarantees | Sequential (0->1->2, teardown 2->1->0) |
| Pod replacement | New name, no PVC affinity | Same name, rebinds to original PVC |

### Exercise: StatefulSet with Shared Shards

Deploy a StatefulSet with 3 replicas, where each pod periodically writes its hostname and timestamp to a shared file. The problem is that all pods are writing to the same file, instead of each pod having its own shard. Your task is to investigate why this is happening and fix the issue.

1. Run the setup script to deploy the broken StatefulSet:
   ```shell-session
   student@lab-storage:~$ bash setup-shared-shards-statefulset.sh
   ```

1. Inspect the shard data across pods and observe the problem:
   ```shell-session
   student@lab-storage:~$ kubectl exec shared-shards-sts-0 -- cat /data/shard.txt
   student@lab-storage:~$ kubectl exec shared-shards-sts-1 -- cat /data/shard.txt
   ```

1. Investigate why all pods are writing to the same place. Check which PVC each pod is using:
   ```shell-session
   student@lab-storage:~$ kubectl describe pod shared-shards-sts-0
   ```

1. Get the StatefulSet manifest, edit it to fix the issue, and apply the fix:
   ```shell-session
   # You can use `kubectl get -o yaml` to see the manifest and `kubectl edit` to make changes.
   student@lab-storage:~$ kubectl get statefulset shared-shards-sts -o yaml
   student@lab-storage:~$ kubectl edit statefulset shared-shards-sts
   ```

   :::tip
   A StatefulSet with a `volumeClaimTemplates` section does not need to specify a `volumes` section in the pod template. The PVCs created from the `volumeClaimTemplates` are automatically made available to the pods as volumes, and can be mounted by name in the container spec.
   :::

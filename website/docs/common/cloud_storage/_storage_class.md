## Storage Class

A **Storage Class** is a way to define how storage is provisioned in the cluster. A cluster might have multiple Storage Classes, each representing a different type of storage (e.g., SSD, HDD, network storage) with different performance characteristics and costs. A typical Storage Class definition looks like this:

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: nvme-ssd

# The provisioner that will create the underlying storage resource.
# Each cloud provider has its own provisioner (e.g., AWS EBS, GCE PD, Azure Disk).
# Use "rancher.io/local-path" for local storage.
provisioner: rancher.io/local-path

# The policy for reclaiming the volume when the PVC is deleted. Available options are:
# - Retain: the volume will be retained when the claim is deleted
# - Delete: the volume will be deleted when the claim is deleted
reclaimPolicy: Delete

# Allow PVCs to expand the volume after creation.
allowVolumeExpansion: true

# When to bind a Persistent Volume to a Persistent Volume Claim. Available options are:
# - Immediate: the PV will be bound to the PVC as soon as it is created
# - WaitForFirstConsumer: the PV will be bound to the PVC only when a Pod that uses the PVC is scheduled.
volumeBindingMode: WaitForFirstConsumer
```

### Storage Provisioning in Kubernetes

![kubernetes-storage](./assets/storage-class.drawio.svg)

The above diagram illustrates the process of provisioning a Persistent Volume by a Storage Class and mounting it to a Pod:

1. The user creates a **Persistent Volume Claim (PVC)**
1. The **Storage Class** detects the PVC, requests the provisioner to allocate the storage, and creates a **Persistent Volume (PV)** that satisfies the claim
1. The PV is bound to the PVC, tying their lifecycle together
1. The user creates a Pod that references the PVC, and Kubernetes mounts the PV to the Pod
1. The Pod can now read/write data to the PV, and the data will persist

<details>

<summary>
Deep Dive: How is the filesystem from cloud storage provisioned and mounted to a Pod?
</summary>

The above diagram ommited some details due to its focus on the high-level flow and interactions between the components. This section explores the underlying mechanisms of how the filesystem from cloud storage is provisioned and mounted to a Pod.

![kubernetes-storage-deep-dive](./assets/cloud-storage-mounting.drawio.svg)

Once a Pod is scheduled to a node, the **kubelet** on that node detects that the Pod has a volume that needs to be mounted:

1. The kubelet learns from the Pod which Persistent Volume Claim (PVC) it needs to mount, and from the PVC it learns which Persistent Volume (PV) is bound to it.
1. The kubelet then interacts with the Container Storage Interface (CSI) driver associated with the PV's Storage Class to provision the storage if it hasn't been provisioned yet, and to mount the storage to the node. (upper part of the diagram)
1. The kubelet then mounts the storage from the node to the container's filesystem, making it available for the application running in the Pod to read/write data. (lower part of the diagram)

</details>

### Exercise: My Pod Won't Start

Investigate why a Pod is stuck in `Pending` state even though it has a PVC attached. Fix the issue and get the Pod running.

1. Run the setup script to create the broken resources:
   ```shell-session
   student@lab-storage:~$ bash setup-broken-storage-class.sh
   ```

1. Investigate the status of the Pod and the PVC:
   ```shell-session
   student@lab-storage:~$ kubectl describe pod -l app=broken-storage
   student@lab-storage:~$ kubectl describe pvc broken-pvc
   ```

1. List the available Storage Classes and identify the correct one:
   ```shell-session
   student@lab-storage:~$ kubectl get storageclass
   ```

:::tip
When working with local storage provisioners like `rancher.io/local-path` on a kind cluster, you must use the `WaitForFirstConsumer` volume binding mode.
:::

### Exercise: Sharing Storage Between Deployments

The goal of this exercise is to deploy a `writer` Deployment that writes to a volume, and a `reader` Deployment that reads from the same volume. There will be a single `writer` pod and multiple `reader` pods. The `writer` will append a timestamped message to a file every 5 seconds, while the `reader` pods will print the contents of that file.

1. Apply the provided manifests to create a PVC and a `writer` Deployment:
   ```shell-session
   student@lab-storage:~$ kubectl apply -f shared-pvc-manifests.yaml
   persistentvolumeclaim/read-write-pvc created
   deployment.apps/writer created
   student@lab-storage:~$ kubectl logs -l app=writer
   Wed Mar 18 07:40:45 UTC 2026: hello from the other side
   Wed Mar 18 07:40:50 UTC 2026: hello from the other side
   Wed Mar 18 07:40:55 UTC 2026: hello from the other side
   ```

1. Edit `shared-pvc-manifests.yaml` to add a `reader` Deployment with `2 replicas` that mounts the same PVC and prints the contents of the file every 5 seconds.

   :::tip
   To read the contents of the file where volume is mounted, you can use a `busybox` container with the command `sh -c "tail -f /data/messages.txt"`.
   :::

1. The `reader` pods are probably stuck in `Pending` state. Investigate the reason and fix the issue in `shared-pvc-manifests.yaml`.

   :::tip
   Some Kubernetes objects have immutable fields that **cannot be changed after creation**. If you need to change an immutable field, you must delete and recreate the object with the correct configuration.

   You can use `kubectl delete -f shared-pvc-manifests.yaml` to delete the existing resources, then `kubectl apply -f shared-pvc-manifests.yaml` to create them again with the updated configuration.
   :::
   
   <details>

   <summary>
   Hint: Why are the reader pods stuck in Pending state?
   </summary>

   `ReadWriteOnce` means the volume can be attached to **one node** at a time. Are the reader and writer pods scheduled on the same node?

   </details>

1. Ensure the `reader` pods are running and check their logs to see the messages written by the `writer` pod.

   ```shell-session
   student@lab-storage:~$ kubectl logs -l app=reader
   ```

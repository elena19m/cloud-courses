## Storage in Kubernetes

Kubernetes provides integration with various storage backends, abstracting them with the following concepts:

- **Persistent Volume Claim (PVC)**: a request for storage by a user. This request is fulfilled by finding a suitable Persistent Volume and binding it to the claim.
- **Persistent Volume (PV)**: a piece of storage in the cluster, that can be mounted by pods. It can be provisioned by an administrator **manually** or dynamically, using a Storage Class.
- **Storage Class**: it is configured to create **Persistent Volumes** on demand. It defines the provisioner (e.g., AWS EBS, GCE PD, Azure Disk) and parameters (e.g., type of disk, IOPS) for the PVs it creates.

This abstraction enables applications to use storage as they would with a local disk, while Kubernetes manages the underlying storage resources and their lifecycle. Changing the storage backend (e.g., switching from AWS EBS to Azure Disk) does not require changes to the application code, as long as the PVCs and PVs are properly configured.

### Persistent Volume Claim (PVC)

The **Persistent Volume Claim** is a request for storage by a user. It will be fulfilled by Kubernetes and bound to a suitable **Persistent Volume**.
A typical PVC definition looks like this:

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: my-pvc
spec:
  # How the volume will be mounted by the pod. Available options are:
  # - ReadWriteOnce: the volume can be mounted as read-write by a single node
  # - ReadOnlyMany: the volume can be mounted as read-only by many nodes
  # - ReadWriteMany: the volume can be mounted as read-write by many nodes
  accessModes:
    - ReadWriteOnce

  # The minimum amount of storage that the volume should have.
  resources:
    requests:
      storage: 8Gi

  # The policy for reclaiming the volume when it is released. Available options are:
  # - Retain: the volume will be retained when the claim is deleted
  # - Delete: the volume will be deleted when the claim is deleted
  persistentVolumeReclaimPolicy: Retain

  # Optional: the name of the Storage Class to use for dynamic provisioning.
  storageClassName: nvme-ssd

  # Alternatively, you can specify a specific PV to bind to by using the `volumeName` field.
  # This will block the claim until the specified PV is available and matches the claim's requirements.
  # volumeName: my-pv
```

:::note
The `accessModes` field in the PVC and PV definitions refers to **nodes**, not pods. This means that if a PV is created with `ReadWriteOnce`, it can only be mounted by **one node** at a time, but multiple pods on that node can access it simultaneously.
:::

To use a PVC you have to mount it in a pod. This is done in two steps:
- First, you specify the PVC in the `volumes` section of the pod spec, this makes the volume available to the containers in the pod.
- Then, you specify the `volumeMounts` in the container spec to mount the volume to a specific path inside the container.

A typical pod definition that uses a PVC looks like this:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: my-pod
spec:
  # The list of volumes that can be mounted by containers in this pod. Each volume must have a unique name.
  volumes:
  - name: my-volume
    # The source of the volume. In this case we are using a PVC, but there are other options like ConfigMap, Secret, etc.
    persistentVolumeClaim:
      claimName: my-pvc

  containers:
  - name: my-container
    image: nginx
    # The list of volumes mounted into the container. Each volumeMount must reference a volume defined in the .spec.volumes.
    volumeMounts:
    - name: my-volume
      mountPath: /usr/share/nginx/html
```

### Persistent Volume (PV)

:::info
A **Persistent Volume** is an extension of the concept of a **Volume** in Docker. Both are used to persist data beyond the lifecycle of a container.
In addition:

  - the **Persistent Volume** is not tied to a specific node, meaning that a pod can be rescheduled to another node without losing data
  - the **Persistent Volume** is not tied to a specific pod, meaning that multiple pods can mount it to share data
:::

The **Persistent Volume** is a piece of storage in the cluster, that can be mounted by pods. Unless there is a specific need to create PVs manually, it is recommended to use dynamic provisioning with Storage Classes, which simplifies the management of storage resources. A typical PV definition looks like this:

```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: my-pv
spec:
  # How the volume will be mounted by the pod. Available options are:
  # - ReadWriteOnce: the volume can be mounted as read-write by a single node
  # - ReadOnlyMany: the volume can be mounted as read-only by many nodes
  # - ReadWriteMany: the volume can be mounted as read-write by many nodes
  accessModes:
    - ReadWriteOnce
  
  # The capacity of the volume. This is the total amount of storage that the PV provides.
  capacity:
    storage: 8Gi

  # The policy for reclaiming the volume when it is released. Available options are:
  # - Retain: the volume will be retained when the claim is deleted
  # - Delete: the volume will be deleted when the claim is deleted
  persistentVolumeReclaimPolicy: Retain
```

### Exercise: Manual Provisioning

Storage Classes are the recommended way to manage storage in Kubernetes, but it is also possible to create Persistent Volumes manually. This exercise will help you understand how manual provisioning works and how to troubleshoot common issues.

An app was deployed but its pod is stuck in `Pending`. Figure out what is missing and fix it.

1. Run the setup script to create the broken resources:
   ```shell-session
   student@lab-storage:~$ bash setup-manual-pvc.sh
   ```

1. Investigate the status of the pod and the PVC:
   ```shell-session
   student@lab-storage:~$ kubectl describe pod manual-pv-pod
   student@lab-storage:~$ kubectl describe pvc manual-pvc
   ```

1. Create the missing resource so the pod reaches `Running`.

   :::tip
   When creating the **Persistent Volume** you have to setup its storage backend. For this exercise you can use `.spec.hostPath: /tmp/manual-pv-data` field, which will link the PV to a directory on the node.

   This is **not** recommended for production use, but it is useful for learning purposes.
   :::

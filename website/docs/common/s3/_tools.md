## What tools we will use?

In this lab, we'll use Kubernetes resources (Deployments, Services) and MinIO's client tools to interact with the object storage.

:::info
We'll access MinIO via its web UI (`localhost:9001`) or via the MinIO client (`mc`) installed in your VM.
:::

:::info
**Option 1: Web UI Access**

After deploying MinIO, you'll forward the service port to your machine:

```shell-session
student@lab-s3:~$ kubectl port-forward -n minio deployment/minio 9000:9000 9001:9001
```

Then, navigate to [http://localhost:9001](http://localhost:9001) in your browser.
:::

:::info
**Option 2: MinIO Client (mc)**

We'll install `mc` to interact with the storage via command line.
:::


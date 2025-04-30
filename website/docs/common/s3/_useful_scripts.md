## Useful scripts

We will automate several tasks using shell scripts provided in the lab archive. You will find YAML files to:
- Deploy the MinIO server
- Deploy a test application
- Configure access from inside Kubernetes

We'll also provide small snippets to quickly test upload and download functionality.

## MinIO Setup Step-by-Step

### Step 0: Deploy a Kubernetes Cluster

Create a local Kubernetes cluster using `kind create cluster`:

```shell-session
student@lab-kubernetes:~$ kind create cluster
Creating cluster "kind" ...
 ✓ Ensuring node image (kindest/node:v1.23.4) 🖼
 ✓ Preparing nodes 📦
 ✓ Writing configuration 📜
 ✓ Starting control-plane 🕹️
 ✓ Installing CNI 🔌
 ✓ Installing StorageClass 💾
Set kubectl context to "kind-kind"
You can now use your cluster with:

kubectl cluster-info --context kind-kind

Thanks for using kind! 😊
```

### Step 1: Deploy MinIO Server

Create the following file `minio-deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: minio
  namespace: minio
spec:
  replicas: 1
  selector:
    matchLabels:
      app: minio
  template:
    metadata:
      labels:
        app: minio
    spec:
      containers:
      - name: minio
        image: quay.io/minio/minio:latest
        args:
        - server
        - /data
        - --console-address
        - ":9001"
        env:
        - name: MINIO_ROOT_USER
          value: "minioadmin"
        - name: MINIO_ROOT_PASSWORD
          value: "minioadmin"
        ports:
        - containerPort: 9000
        - containerPort: 9001
        volumeMounts:
        - name: storage
          mountPath: /data
      volumes:
      - name: storage
        emptyDir: {}
```

Create the following file `minio-service.yaml`:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: minio-service
  namespace: minio
spec:
  type: ClusterIP
  ports:
    - port: 9000
      targetPort: 9000
  selector:
    app: minio
```

Apply the resources:

```shell-session
student@lab-s3:~$ kubectl create namespace minio
student@lab-s3:~$ kubectl apply -f minio-deployment.yaml
student@lab-s3:~$ kubectl apply -f minio-service.yaml
```

Check that MinIO is running:

```shell-session
student@lab-s3:~$ kubectl get pods -n minio
```

### Step 2: Setup MinIO Client (mc)

```shell-session
student@lab-s3:~$ wget https://dl.min.io/client/mc/release/linux-amd64/mc
student@lab-s3:~$ chmod +x mc
student@lab-s3:~$ sudo mv mc /usr/local/bin/
```

Configure `mc`:

```shell-session
student@lab-s3:~$ kubectl port-forward -n minio deployment/minio 9000:9000 9001:9001
student@lab-s3:~$ mc alias set local http://localhost:9000 minioadmin minioadmin
```

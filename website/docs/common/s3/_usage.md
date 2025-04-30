### Step 3: Create a Bucket and Upload Files

We will use the `mc` command-line tool to interact with MinIO, create buckets, and upload files:

```shell-session
student@lab-s3:~$ mc mb local/mybucket
student@lab-s3:~$ echo "hello cloud computing" > testfile.txt
student@lab-s3:~$ mc cp testfile.txt local/mybucket
student@lab-s3:~$ # check the result
student@lab-s3:~$ mc ls local/mybucket
student@lab-s3:~$ mc cat local/mybucket/testfile.txt
```

### Step 4: Access S3 from a Kubernetes App

We will use a python script to upload files to the MinIO bucket from a Kubernetes pod.

We need a `ConfigMap` to store the script and a `Deployment` to run it.

Create the following file `uploader-configmap.yaml`:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: uploader-script
  namespace: default
data:
  uploader.py: |
    import boto3, time

    s3 = boto3.client(
        's3',
        endpoint_url='http://minio-service.minio.svc.cluster.local:9000',
        aws_access_key_id='minioadmin',
        aws_secret_access_key='minioadmin',
        region_name='us-east-1'
    )

    while True:
        with open('/tmp/hello.txt', 'w') as f:
            f.write('hello from kubernetes')
        s3.upload_file('/tmp/hello.txt', 'mybucket', 'hello.txt')
        print('Uploaded hello.txt')
        time.sleep(30)
```

Create the following file `uploader-deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: uploader
spec:
  replicas: 1
  selector:
    matchLabels:
      app: uploader
  template:
    metadata:
      labels:
        app: uploader
    spec:
      containers:
      - name: uploader
        image: python:3.10
        command: ["bash", "-c"]
        args:
          - |
            pip install boto3 && python /app/uploader.py
        volumeMounts:
        - name: script-volume
          mountPath: /app
        env:
        - name: AWS_ACCESS_KEY_ID
          value: "minioadmin"
        - name: AWS_SECRET_ACCESS_KEY
          value: "minioadmin"
      volumes:
      - name: script-volume
        configMap:
          name: uploader-script
```

Deploy the example uploader app:

```shell-session
student@lab-s3:~$ kubectl apply -f uploader-configmap.yaml
student@lab-s3:~$ kubectl apply -f uploader-deployment.yaml
```

Check app logs:

```shell-session
student@lab-s3:~$ kubectl logs -l app=uploader
```

This app will attempt to upload a file into your MinIO bucket.

Note: To reload the script, you can restart the deployment:

```shell-session
student@lab-s3:~$ kubectl rollout restart deployment uploader
```

## Exercises

### Task 1: Upload multiple files

Use a `for` loop to create and upload 10 text files to your bucket.

```shell-session
for i in {1..10}; do echo "File $i" > file$i.txt; mc cp file$i.txt local/mybucket; done
```

Check if all files are present in the Web UI!

### Task 2: Deploy a second app to read files

Create a simple Kubernetes Deployment (yaml provided as example for `upload`) that lists files in the bucket.

What differences do you notice compared to uploading?

### Task 3: Upload timestamped files

Modify the uploader application so that each uploaded file has a unique name based on the current timestamp.

Hint: Update the Python code inside the uploader container to:

```python
import boto3, os, time
from datetime import datetime

s3 = boto3.client('s3',
  endpoint_url='http://minio-service.minio.svc.cluster.local:9000',
  aws_access_key_id='minioadmin',
  aws_secret_access_key='minioadmin',
  region_name='us-east-1')

while True:
    filename = f"hello_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.txt"
    filepath = f"/tmp/{filename}"
    with open(filepath, 'w') as f:
        f.write('hello from kubernetes')
    s3.upload_file(filepath, 'mybucket', filename)
    print(f'Uploaded {filename}')
    time.sleep(30)
```

This change will prevent overwriting and simulate realistic object uploads.

### Task 4: Create a private bucket

Use `mc` to create a new bucket called `privatebucket` and set it to be private (no anonymous access):

```shell-session
student@lab-s3:~$ mc mb local/privatebucket
student@lab-s3:~$ mc policy set none local/privatebucket
```

To list the policies, use:

```shell-session
student@lab-s3:~$ mc anonymous get local/privatebucket

```
Try to access the bucket without credentials. What happens?

Hint: To test you can share a public link to the bucket using `mc share` command.

```shell-session
student@lab-s3:~$ mc share download local/privatebucket/testfile.txt
student@lab-s3:~$ curl http://localhost:9000/privatebucket/testfile.txt

For the public link:
```
student@lab-s3:~$ mc share upload local/publicbucket/testfile.txt
student@lab-s3:~$ curl http://localhost:9000/publicbucket/testfile.txt
```

Note: To make a bucket public, use `mc anonymous set download local/publicbucket`.

### Task 5: Deploy a second MinIO instance

Deploy a second MinIO server in a different namespace (`minio2`).

Make sure:
- It uses different service names.
- It listens on a different NodePort if needed.

Use it to create a separate bucket and upload a file there.

### Task 6: Backup and restore a bucket

Using `mc`, copy all files from `mybucket` to a backup bucket called `backupbucket`:

```shell-session
student@lab-s3:~$ mc mb local/backupbucket
student@lab-s3:~$ mc mirror local/mybucket local/backupbucket
```

Now delete a file from `mybucket`, and restore it from `backupbucket`!

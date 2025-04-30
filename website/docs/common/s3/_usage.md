### Step 3: Create a Bucket and Upload Files

```shell-session
$ mc mb local/mybucket
$ echo "hello cloud computing" > testfile.txt
$ mc cp testfile.txt local/mybucket
$ # check the result
$ mc ls local/mybucket
$ mc cat local/mybucket/testfile.txt
```

### Step 4: Access S3 from a Kubernetes App

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
            pip install boto3 && \
            python -c "
import boto3, os, time
s3 = boto3.client('s3',
  endpoint_url='http://minio-service.minio.svc.cluster.local:9000',
  aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
  aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
  region_name='us-east-1')
while True:
  with open('/tmp/hello.txt', 'w') as f:
      f.write('hello from kubernetes')
  s3.upload_file('/tmp/hello.txt', 'mybucket', 'hello.txt')
  print('Uploaded hello.txt')
  time.sleep(30)
"
        env:
        - name: AWS_ACCESS_KEY_ID
          value: "minioadmin"
        - name: AWS_SECRET_ACCESS_KEY
          value: "minioadmin"
```

Deploy the example uploader app:

```shell-session
$ kubectl apply -f uploader-deployment.yaml
```

Check app logs:

```shell-session
$ kubectl logs -l app=uploader
```

This app will attempt to upload a file into your MinIO bucket.

## Exercises

### Task 1: Upload multiple files

Use a `for` loop to create and upload 10 text files to your bucket.

```shell-session
for i in {1..10}; do echo "File $i" > file$i.txt; mc cp file$i.txt local/mybucket; done
```

Check in Web UI if all files are there!

### Task 2: Deploy a second app to read files

Create a simple Kubernetes Deployment (yaml provided) that lists files in the bucket.

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
mc mb local/privatebucket
mc policy set none local/privatebucket
```

Try to access the bucket without credentials. What happens?

### Task 5: Deploy a second MinIO instance

Deploy a second MinIO server in a different namespace (`minio2`).

Make sure:
- It uses different service names.
- It listens on a different NodePort if needed.

Use it to create a separate bucket and upload a file there.

### Task 6: Backup and restore a bucket

Using `mc`, copy all files from `mybucket` to a backup bucket called `backupbucket`:

```shell-session
mc mb local/backupbucket
mc mirror local/mybucket local/backupbucket
```

Now delete a file from `mybucket`, and restore it from `backupbucket`!

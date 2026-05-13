## Kubernetes Jobs

### Introduction to Batch Workloads

In the context of cloud computing up until now we have only interacted with applications or services whose lifetime is infinite, which means that they are started and they are never stopped unless an error appears.

However, this does not cover most use cases in distributed computing. Many processing tasks are **batch workloads** - discrete units of work that:
- Run to completion
- Process a specific dataset or task
- Exit when finished
- Should not be automatically restarted after successful completion

Examples of batch workloads include:
- **Data processing**: ETL (Extract, Transform, Load) pipelines
- **Machine learning**: Training models, batch inference
- **Report generation**: Periodic analytics and exports
- **Backup and archival**: Database backups, log aggregation
- **Video/image processing**: Transcoding, thumbnail generation
- **Scientific computing**: Simulations, numerical analysis

Kubernetes by its nature works as a scheduler for jobs, which makes it well suited for scheduling processing jobs.

### Jobs vs Pods

A Kubernetes `Job` should be used instead of a `Pod` when:
- The workload has a defined start and end
- You expect the action to finish successfully
- You don't want resources lingering in the cluster after completion
- You need guarantees about completion and retry behavior

**Key differences:**

| Feature | Pod | Job |
|---------|-----|-----|
| **Lifecycle** | Long-running | Run-to-completion |
| **Restart behavior** | Restarts indefinitely on failure | Controlled retry with backoffLimit |
| **Completion tracking** | N/A | Tracks successful completions |
| **Resource cleanup** | Runs forever unless deleted | Can be automatically cleaned up |
| **Use case** | Services, daemons | Batch processing, one-time tasks |

The object which manages a discrete work item in Kubernetes is called a `Job` and it contains a specification for a container, as we are used to from Pod specifications.

The example bellow displays a job which displays a debug message:

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: hello-world-job
spec:
  template:
    spec:
      containers:
      - name: hello-world
        image: ghcr.io/containerd/busybox
        command: ["echo", "Hello from Kubernetes batch job!"]
      restartPolicy: Never
  backoffLimit: 4
```

When applying the above manifest, we can see that the `Job` is created, and we can inspect its output as follows:
```shell-session
student@lab-jobs:~/$ kubectl apply -f hello-world.yaml
kubectl get jobsjob.batch/hello-world-job created
student@lab-jobs:~/$ kubectl get jobs
NAME              COMPLETIONS   DURATION   AGE
hello-world-job   0/1           0s         0s
student@lab-jobs:~/$ kubectl logs job/hello-world-job
Hello from Kubernetes batch job!
```

The above example is useful for quick and dirty jobs, but when running in an actual batch environment there are some other factors which have to be involved:
* the increase scheduling accuracy and system cohesion you would add resource limits;
* use a custom job script;
* add fail conditions;
* limit job duration.

The following example is used for creating a complex job which runs a custom python script, limits its resources and requests a restart of the application fails:
```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: matrix-multiplication-job
spec:
  template:
    spec:
      containers:
      - name: matrix-multiply
        image: gitlab.cs.pub.ro:5050/scgc/cloud-courses/python:3.9-slim
        command: ["bash", "-c"]
        args:
        - |
          pip install numpy && python /scripts/matrix_multiply.py
        volumeMounts:
        - name: script-volume
          mountPath: /scripts
        - name: pip-local
          mountPath: /.local
        - name: pip-local
          mountPath: /.cache
        resources:
          requests:
            cpu: "2"
            memory: "4Gi"
          limits:
            cpu: "4"
            memory: "8Gi"
      volumes:
      - name: script-volume
        configMap:
          name: matrix-multiplication-script
      - name: pip-local
        emptyDir: {}
      restartPolicy: OnFailure
  backoffLimit: 2
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: matrix-multiplication-script
data:
  matrix_multiply.py: |
    import numpy as np
    import time
    import os

    # Create large matrices
    size = 5000
    print(f'Creating {size}x{size} matrices...')
    a = np.random.rand(size, size)
    b = np.random.rand(size, size)

    # Perform CPU-intensive matrix multiplication
    print('Starting matrix multiplication...')
    start_time = time.time()
    result = np.matmul(a, b)
    duration = time.time() - start_time

    print(f'Matrix multiplication complete in {duration:.2f} seconds')
    print(f'Result matrix shape: {result.shape}')
```

The `requests` dict is used for scheduling purposes, it is used as a minimum resource specification used for the container when choosing a node for placement.
The `limits` dict is used to specify the actual limits imposed on the container which it can't surpass.
As with a regular Pod, ConfigMaps, Secrets and other kubernetes objects can be mounted into the container.

Let's run it and see its output:
```
student@lab-jobs:~/$ kubectl logs job/matrix-multiplication-job
Collecting numpy
  Downloading numpy-2.0.2-cp39-cp39-manylinux_2_17_x86_64.manylinux2014_x86_64.whl (19.5 MB)
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 19.5/19.5 MB 101.7 MB/s eta 0:00:00
Installing collected packages: numpy
Successfully installed numpy-2.0.2
WARNING: Running pip as the 'root' user can result in broken permissions and conflicting behaviour with the system package manager. It is recommended to use a virtual environment instead: https://pip.pypa.io/warnings/venv

[notice] A new release of pip is available: 23.0.1 -> 25.1.1
[notice] To update, run: pip install --upgrade pip
Creating 5000x5000 matrices...
Starting matrix multiplication...
Matrix multiplication complete in 14.20 seconds
Result matrix shape: (5000, 5000)
```

### Job Configuration Options

Jobs provide several configuration options to control their behavior:

#### completions
Specifies the number of successful pod completions needed for the job to be considered complete.

```yaml
spec:
  completions: 5  # Job completes after 5 successful pod runs
```

#### parallelism
Controls how many pods run simultaneously. Useful for processing large datasets in parallel.

```yaml
spec:
  completions: 10
  parallelism: 3  # Run 3 pods at a time until 10 completions
```

#### activeDeadlineSeconds
Sets a timeout for the entire job. If the job doesn't complete within this time, it's terminated.

```yaml
spec:
  activeDeadlineSeconds: 3600  # Job fails if not done in 1 hour
```

#### backoffLimit
Number of retries before marking the job as failed. Default is 6.

```yaml
spec:
  backoffLimit: 3  # Retry up to 3 times on failure
```

#### ttlSecondsAfterFinished
Automatically cleans up the job after completion or failure.

```yaml
spec:
  ttlSecondsAfterFinished: 86400  # Delete job 24 hours after completion
```

### Job Patterns

Kubernetes Jobs support several common patterns for batch processing:

#### Pattern 1: Single Completion Job
The simplest pattern - run one pod to completion.

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: single-task
spec:
  template:
    spec:
      containers:
      - name: task
        image: busybox
        command: ["sh", "-c", "echo Processing task && sleep 10"]
      restartPolicy: Never
```

#### Pattern 2: Parallel Jobs with Fixed Completion Count
Process multiple items by running multiple pods in parallel.

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: parallel-processing
spec:
  completions: 10      # Need 10 successful completions
  parallelism: 3       # Run 3 pods at a time
  template:
    spec:
      containers:
      - name: processor
        image: busybox
        command: ["sh", "-c", "echo Processing item $RANDOM && sleep 5"]
      restartPolicy: Never
```

Use case: Processing a known set of tasks (e.g., generating 10 reports, processing 100 images in batches).

#### Pattern 3: Work Queue Pattern
Multiple workers processing tasks from a shared queue. Workers continue until the queue is empty.

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: work-queue
spec:
  parallelism: 5       # 5 workers processing in parallel
  # No completions - workers exit when queue is empty
  template:
    spec:
      containers:
      - name: worker
        image: my-worker:latest
        env:
        - name: QUEUE_URL
          value: "redis://queue:6379"
      restartPolicy: Never
```

Use case: Processing an unknown number of tasks from a message queue (RabbitMQ, Redis, SQS).

### Best Practices for Jobs

1. **Set resource limits**: Always specify requests and limits to prevent resource starvation
2. **Use `ttlSecondsAfterFinished`**: Automatically clean up completed jobs to avoid clutter
3. **Choose appropriate backoffLimit**: Balance between retry attempts and fast failure
4. **Monitor job status**: Use `kubectl get jobs` and `kubectl describe job` to track progress
5. **Use init containers**: Separate setup (downloading data) from processing
6. **Consider parallelism**: Use parallel jobs for independent tasks that can run simultaneously
7. **Handle failures gracefully**: Ensure your container exits with proper exit codes

### Case study: zip cracking

Let's look at a real world example of cracking a password using fcrackzip and jobs in Kubernetes.
The `decrypt-zip.yaml` is the basis for our job.
It contains the commands used for cracking the password for a zip file.
The `fcrackzip` tool can brute-force a ZIP archive's password.

Our task is to download the archive, and crack its password.

The following manifest will define our job and Persistent Volume:
```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: zip-decryption-job
  labels:
    app: zip-decryption
spec:
  ttlSecondsAfterFinished: 86400  # Automatically delete job 24h after completion
  backoffLimit: 2  # Number of retries before considering job failed
  template:
    metadata:
      labels:
        app: zip-decryption
    spec:
      restartPolicy: OnFailure
      initContainers:
      - name: download-zip
        image: ghcr.io/curl/curl-container/curl:master   # Lightweight curl image
        command: ["/bin/sh", "-c"]
        volumeMounts:
        - name: data-volume
          mountPath: /data
        args:
        - >
          echo "Downloading ZIP file from remote source..." &&
          curl http://swarm.cs.pub.ro/~sweisz/encrypted.zip -o /data/encrypted.zip
      containers:
      - name: hashcat-container
        image: gitlab.cs.pub.ro:5050/scgc/cloud-courses/fcrackzip  # Replace with appropriate hashcat image
        command: ["/bin/sh"]
        args:
        - "-c"
        - >
          cd /data &&
          fcrackzip -v -b -c a -l 5-5 -u encrypted.zip > results_lowercase.txt &&
          cat results_lowercase.txt
        volumeMounts:
        - name: data-volume
          mountPath: /data
        resources:
          requests:
            cpu: "2"
            memory: "4Gi"
          limits:
            cpu: "4"
            memory: "8Gi"
      volumes:
      - name: data-volume
        emptyDir: {}
      - name: wordlist-volume
        configMap:
          name: zip-decrypt-config
```

We know that the file has a password made up of 5 letters, which led us to use the `-l 5-5` option, together with `-b` to do brute-forcing.
We use the `initContainer` to download the archive and the main container to run `fcrackzip`.

### Exercise: Crack using wordlist

Change the above job in order to run `fcrackzip` using the wordlist from the following link: http://swarm.cs.pub.ro/~sweisz/wordlist.txt.
You can attach the wordlist as a ConfigMap as you've seen in the matrix multiplication example.
You can see how to configure fcrackzip to use wordlists in the following link: https://sohvaxus.github.io/content/fcrackzip-bruteforce-tutorial.html.

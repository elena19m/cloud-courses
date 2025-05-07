## Scheduling Jobs

In the context of cloud computing up until now we have only interracted with applications or services whose lifetime is infinite, which means that they are started and they are never stopped unless an error apears.

This does not cover most use cases in distributed computing though.
In many cases processing steps are handled in distinct chunks which are launched, and executed by a scheduler.
Kubernetes by its nature works as a scheduler for jobs, which makes it well suited for scheduling processing jobs.

A Kubernetes job would be used instead of a Pod when we expect that the action will finish and we do not want the resources of a Pod to be lingering in a cluster.
We have noticed from the liveness probes lab what when a Pod stops it doesn't just shutdown, it can be restarted indefinitely, which does not match our dedicate workload mode.

The object which manages a discrete work item in Kubernetes is called a `Job` and it contains a specification for a container, as we are used to from Pod specifications.

The example bellow displays a job which displays a debug message:

```
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
```
sergiu@epsilon:~/cc-workspace/curs-09$ oc apply -f hello-world.yaml
oc get jobsjob.batch/hello-world-job created
sergiu@epsilon:~/cc-workspace/curs-09$ oc get jobs
NAME              COMPLETIONS   DURATION   AGE
hello-world-job   0/1           0s         0s
sergiu@epsilon:~/cc-workspace/curs-09$ oc logs job/hello-world-job
Hello from Kubernetes batch job!
```

The above example is useful for quick and dirty jobs, but when running in an actual batch environment there are some other factors which have to be involved:
* the increase scheduling accuracy and system cohesion you would add resource limits;
* use a custom job script;
* add fail conditions;
* limit job duration.

The following example is used for creating a complex job which runs a custom python script, limits its resources and requests a restart of the application fails:
```
apiVersion: batch/v1
kind: Job
metadata:
  name: matrix-multiplication-job
spec:
  template:
    spec:
      containers:
      - name: matrix-multiply
        image: ghcr.io/jumpserver/python:3.9-slim
        command: ["bash", "-c"]
        args:
        - |
          pip install numpy && python /scripts/matrix_multiply.py
        volumeMounts:
        - name: script-volume
          mountPath: /scripts
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
sergiu@epsilon:~/cc-workspace/curs-09$ oc logs job/matrix-multiplication-job
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

### Case study: zip cracking

Let's look at a real world example of cracking a password using hascat and jobs in Kubernetes.
The `decrypt-zip.yaml` is the basis for our job.
It contains the commands used for cracking the password for a zip file.
The `fcrackzip` tool can brute-force a ZIP archive's password.

Our task is to download the archive in a Persistend Volume, and crack its password.

The following manifest will define our job and Persistent Volume:
```
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
        image: curlimages/curl:latest  # Lightweight curl image
        command: ["/bin/sh", "-c"]
        volumeMounts:
        - name: data-volume
          mountPath: /data
        args:
        - >
          echo "Downloading ZIP file from remote source..." &&
          curl http://swarm.cs.pub.ro/~sweisz/encrypted.zip -o /data/encrypted.zip
      containers:
      - name: fcrackzip-container
        image: zhindonm/fcrackzip  # Replace with appropriate fcrackzip image
        command: ["/bin/bash"]
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
            memory: "4Gi"
            cpu: "2"
          limits:
            memory: "8Gi"
            cpu: "4"
      volumes:
      - name: data-volume
        persistentVolumeClaim:
          claimName: zip-decrypt-pvc  # Reference to the PVC below
      - name: wordlist-volume
        configMap:
          name: zip-decrypt-config
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: zip-decrypt-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 100Mi
```

We know that the file has a password omade up of 5 letters, which led us to use the `-l 5-5` option, together with `-b` to do brute-forcing.
We use the `initContainer` to download the archive and the main container to run `fcrackzip`.

### Exercise: Crack using wordlist

Change the above job in order to run `fcrackzip` using the wordlist from the following link: http://swarm.cs.pub.ro/~sweisz/cc/wordlist.txt.
You can attach the wordlist as a ConfigMap as you've seen in the matrix multiplication example.
You can see how to configure fcrackzip to use wordlists in the following link: https://sohvaxus.github.io/content/fcrackzip-bruteforce-tutorial.html.

## Liveness probes

Software applications, no matter how well written and tested, are alyways prone to errors, crashes, deadlocks etc.
Sometimes, the only way to restore functionality is to restart the application.

When running in production, it is very important that application errors are detected as soon as they occur and then automatically mitigated.

In Kubernetes, we have the concept of **liveness probes**, which help us by continuously monitoring a container and taking an action if a failure occurs.

### Setup: a crashy app

To illustrate the concept, we will use an app that was specially built for this lab.
The app is a simple HTTP server written in Python, that runs normally for a specified number of seconds, and starts to return errors after that.

If you are curious, you can find the source code in `~/work/crashy-app/server.py`.
The time after the app starts to error out is defined by the `CRASH_AFTER` environment variable.

The docker image for this app should already exist:

```shell-session
student@cc-lab:~/work$ docker image ls
REPOSITORY     TAG        IMAGE ID       CREATED             SIZE
crashy-app     1.0.0      f0a327e2fc35   56 minutes ago      67MB
[...]
```

Let's load this image into the Kind cluster:

```shell-session
student@cc-lab:~/work$ kind load docker-image crashy-app:1.0.0
Image: "crashy-app:1.0.0" with ID "sha256:f0a327e2fc354173521a6425d679e3adaa95de11ca3b8e5306e8b58655f310e4" not yet present on node "kind-control-plane", loading...
```

We will create a deployment for this app and apply it. Notice that the `CRASH_AFTER` environment variable will be set to `60` seconds.

```shell-session
student@cc-lab:~/work$ cat crashy-deployment.yaml 
apiVersion: apps/v1
kind: Deployment
metadata:
  name: crashy-app
  labels:
    app: crashy
spec:
  replicas: 1
  selector:
    matchLabels:
      app: crashy
  template:
    metadata:
      labels:
        app: crashy
    spec:
      containers:
      - name: crashy-app
        image: crashy-app:1.0.0
        ports:
        - containerPort: 80
        env:
        - name: CRASH_AFTER
          value: "60"

student@cc-lab:~/work$ kubectl apply -f crashy-deployment.yaml 
deployment.apps/crashy-app created

student@cc-lab:~/work$ kubectl get deployments
NAME         READY   UP-TO-DATE   AVAILABLE   AGE
crashy-app   1/1     1            1           8s

student@cc-lab:~/work$ kubectl get pods
NAME                          READY   STATUS    RESTARTS   AGE
crashy-app-5bc4d6474b-lgnk9   1/1     Running   0          11s
```

Let's expose the app via a service:

```shell-session
student@cc-lab:~/work$ cat crashy-service.yaml 
apiVersion: v1
kind: Service
metadata:
  name: crashy-app
spec:
  type: NodePort
  selector:
    app: crashy
  ports:
    - protocol: TCP
      port: 80
      targetPort: 80
      nodePort: 30080

student@cc-lab:~/work$ kubectl apply -f crashy-service.yaml 
service/crashy-app created

student@cc-lab:~/work$ kubectl get services
NAME         TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)        AGE
crashy-app   NodePort    10.96.67.208   <none>        80:30080/TCP   6s
kubernetes   ClusterIP   10.96.0.1      <none>        443/TCP        24m
```

Notice that at the beggining, the app works normally:

```shell-session
student@cc-lab:~/work$ curl http://172.18.0.2:30080
Hi, my name is crashy-app-5bc4d6474b-lgnk9 and I'm a crashy app...
But I didn't crash... yet :D
```

After 60 seconds, it starts to return errors:

```
student@cc-lab:~/work$ curl http://172.18.0.2:30080
Hi, my name is crashy-app-5bc4d6474b-lgnk9 and I'm a crashy app...
I crashed 2.85 seconds ago, sorry about that :(
```

If you use `curl -v`, you will see that the server returns a **HTTP 500** status code.

If we list the pods, we see the pod as running, so Kubernetes has no way to know that the app is not available.

The only way to recover is to delete the pod, which will force the deployment to create a new one.
We can do this manually:

```shell-session
student@cc-lab:~/work$ kubectl delete pod/crashy-app-5bc4d6474b-lgnk9
pod "crashy-app-5bc4d6474b-lgnk9" deleted

student@cc-lab:~/work$ kubectl get pods
NAME                          READY   STATUS    RESTARTS   AGE
crashy-app-5bc4d6474b-2svb4   1/1     Running   0          9s
```

But we will have to keep doing this again and again, which is not convenient.

### Defining a liveness probe

A **liveness probe** helps us by periodically polling for a condition. When the condition fails, the container is automatically restarted.

We will be using a **httpGet** probe, which queries an HTTP endpoint of the app.
Most cloud-native apps have a separate endpoint for health monitoring, which is more lightweight (it doesn't perform the full processing, but only returns the status of the service).

Our crashy app responds to the `/health` endpoint, which can also be queried manually:

```shell-session
student@cc-lab:~/work$ curl http://172.18.0.2:30080/health
200 OK
[...]
student@cc-lab:~/work$ curl http://172.18.0.2:30080/health
500 Internal Server Error
```

Let's edit the deployment manifest by defining a liveness probe:

```shell-session
student@cc-lab:~/work$ cat crashy-deployment.yaml 
apiVersion: apps/v1
kind: Deployment
metadata:
  name: crashy-app
  labels:
    app: crashy
spec:
  replicas: 1
  selector:
    matchLabels:
      app: crashy
  template:
    metadata:
      labels:
        app: crashy
    spec:
      containers:
      - name: crashy-app
        image: crashy-app:1.0.0
        ports:
        - containerPort: 80
        env:
        - name: CRASH_AFTER
          value: "60"
        livenessProbe:
          httpGet:
            path: /health
            port: 80
          periodSeconds: 1
          failureThreshold: 3
          terminationGracePeriodSeconds: 1
```

:::note
The parameters have the following meaning:
  * `httpGet.path` - the path of the HTTP endpoint to probe
  * `httpGet.port` - the port of the HTTP endpoint to probe
  * `periodSeconds` - how many seconds to wait between two probes
  * `failureThreshold` - after how many failed probes is the container considered dead
  * `terminationGracePeriodSeconds` - how many seconds to wait before sending the `KILL` signal to a failed container
:::

Apply the modified manifest:

```shell-session
student@cc-lab:~/work$ kubectl apply -f crashy-deployment.yaml 
deployment.apps/crashy-app configured
```

Visualize the events for the pod and observe that the container is periodically restarted after three consecutive failed probes:

```shell-session
student@cc-lab:~/work$ kubectl events --for pod/crashy-app-5799b6fd57-sd56v --watch
LAST SEEN   TYPE     REASON      OBJECT                            MESSAGE
23s         Normal   Scheduled   Pod/crashy-app-5799b6fd57-sd56v   Successfully assigned default/crashy-app-5799b6fd57-sd56v to kind-control-plane
22s         Normal   Pulled      Pod/crashy-app-5799b6fd57-sd56v   Container image "crashy-app:1.0.0" already present on machine
22s         Normal   Created     Pod/crashy-app-5799b6fd57-sd56v   Created container: crashy-app
22s         Normal   Started     Pod/crashy-app-5799b6fd57-sd56v   Started container crashy-app
0s          Warning   Unhealthy   Pod/crashy-app-5799b6fd57-sd56v   Liveness probe failed: HTTP probe failed with statuscode: 500
0s (x2 over 1s)   Warning   Unhealthy   Pod/crashy-app-5799b6fd57-sd56v   Liveness probe failed: HTTP probe failed with statuscode: 500
0s (x3 over 2s)   Warning   Unhealthy   Pod/crashy-app-5799b6fd57-sd56v   Liveness probe failed: HTTP probe failed with statuscode: 500
0s                Normal    Killing     Pod/crashy-app-5799b6fd57-sd56v   Container crashy-app failed liveness probe, will be restarted
0s (x2 over 65s)   Normal    Pulled      Pod/crashy-app-5799b6fd57-sd56v   Container image "crashy-app:1.0.0" already present on machine
0s (x2 over 65s)   Normal    Created     Pod/crashy-app-5799b6fd57-sd56v   Created container: crashy-app
0s (x2 over 65s)   Normal    Started     Pod/crashy-app-5799b6fd57-sd56v   Started container crashy-app
0s (x4 over 65s)   Warning   Unhealthy   Pod/crashy-app-5799b6fd57-sd56v   Liveness probe failed: HTTP probe failed with statuscode: 500
0s (x5 over 66s)   Warning   Unhealthy   Pod/crashy-app-5799b6fd57-sd56v   Liveness probe failed: HTTP probe failed with statuscode: 500
0s (x6 over 67s)   Warning   Unhealthy   Pod/crashy-app-5799b6fd57-sd56v   Liveness probe failed: HTTP probe failed with statuscode: 500
0s (x2 over 65s)   Normal    Killing     Pod/crashy-app-5799b6fd57-sd56v   Container crashy-app failed liveness probe, will be restarted
0s (x3 over 2m10s)   Normal    Pulled      Pod/crashy-app-5799b6fd57-sd56v   Container image "crashy-app:1.0.0" already present on machine
0s (x3 over 2m10s)   Normal    Created     Pod/crashy-app-5799b6fd57-sd56v   Created container: crashy-app
0s (x3 over 2m10s)   Normal    Started     Pod/crashy-app-5799b6fd57-sd56v   Started container crashy-app
[...]
^C
```

The number of restarts can also be seen in the pod list:

```shell-session
student@cc-lab:~/work$ kubectl get pods
NAME                          READY   STATUS    RESTARTS     AGE
crashy-app-5799b6fd57-sd56v   1/1     Running   3 (3s ago)   3m19s
```

Verify using `curl` that the app automatically recovers after a failure.

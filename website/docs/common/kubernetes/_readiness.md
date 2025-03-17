## Readiness probes

Productions apps are often complex and are not ready to process traffic as soon as they are started.
Usually, they need some time to initialize (seconds or even minutes).
During the initialization time, traffic should not be routed to the respective instances, because it would not be processed anyway, and the users would see errors.

In Kubernetes, we have the concept of **readiness probes** which monitor a container and only accept traffic if they are ready.

### Setup: a lazy app

To illustrate the concept, we will use an app that was specially built for this lab.
The app is a simple HTTP server written in Python, that take a specified number of seconds to initialize, and runs normally after that.

If you are curious, you can find the source code in `~/work/lazy-app/server.py`.
The initialization time in seconds is a random number between zero and `READY_AFTER_MAX`.

The docker image for this app should already exist:

```shell-session
student@cc-lab:~/work$ docker image ls
REPOSITORY     TAG        IMAGE ID       CREATED             SIZE
lazy-app       1.0.0      f7eac9e4eda7   42 minutes ago      67MB
[...]
```

Let's load this image into the Kind cluster:

```shell-session
student@cc-lab:~/work$ kind load docker-image lazy-app:1.0.0
Image: "lazy-app:1.0.0" with ID "sha256:f7eac9e4eda7cc3b492cdfe6aff791cfd763567fb0502d5c8bb96cbc0cf032ed" not yet present on node "kind-control-plane", loading...
```

We will create a deployment for this app and apply it. Notice that the `READY_AFTER_MAX` environment variable will be set to `60` seconds.
The deployment will have 5 replicas, which means that there will be 5 pods that can serve requests.

```shell-session
student@cc-lab:~/work$ cat lazy-deployment.yaml 
apiVersion: apps/v1
kind: Deployment
metadata:
  name: lazy-app
  labels:
    app: lazy
spec:
  replicas: 5
  selector:
    matchLabels:
      app: lazy
  template:
    metadata:
      labels:
        app: lazy
    spec:
      containers:
      - name: lazy-app
        image: lazy-app:1.0.0
        ports:
        - containerPort: 80
        env:
        - name: READY_AFTER_MAX
          value: "300"

student@cc-lab:~/work$ kubectl apply -f lazy-deployment.yaml 
deployment.apps/lazy-app created

student@cc-lab:~/work$ kubectl get deployments
NAME       READY   UP-TO-DATE   AVAILABLE   AGE
lazy-app   5/5     5            5           8s

student@cc-lab:~/work$ kubectl get pods
NAME                        READY   STATUS    RESTARTS   AGE
lazy-app-674fb54b7d-9bckf   1/1     Running   0          4s
lazy-app-674fb54b7d-fsstv   1/1     Running   0          4s
lazy-app-674fb54b7d-hbsgg   1/1     Running   0          4s
lazy-app-674fb54b7d-tjddz   1/1     Running   0          4s
lazy-app-674fb54b7d-wxx7p   1/1     Running   0          4s
```

Let's expose the app via a service:

```shell-session
student@cc-lab:~/work$ cat lazy-service.yaml 
apiVersion: v1
kind: Service
metadata:
  name: lazy-app
spec:
  type: NodePort
  selector:
    app: lazy
  ports:
    - protocol: TCP
      port: 80
      targetPort: 80
      nodePort: 30081

student@cc-lab:~/work$ kubectl apply -f lazy-service.yaml 
service/lazy-app created

student@cc-lab:~/work$ kubectl get services
NAME         TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)        AGE
kubernetes   ClusterIP   10.96.0.1      <none>        443/TCP        52m
lazy-app     NodePort    10.96.180.27   <none>        80:30081/TCP   38m
```

We can see that all 5 instances are shown as "ready", but if we try to connect using `curl`, we don't always get successful responses:

```shell-session
student@cc-lab:~/work$ curl http://172.18.0.2:30081
Hi, my name is lazy-app-7c44789765-cdsvk and I'm a lazy app...
Getting ready... 24.81 more seconds please :D

student@cc-lab:~/work$ curl http://172.18.0.2:30081
Hi, my name is lazy-app-7c44789765-rrpcj and I'm a lazy app...
Getting ready... 119.54 more seconds please :D

student@cc-lab:~/work$ curl http://172.18.0.2:30081
Hi, my name is lazy-app-7c44789765-cdsvk and I'm a lazy app...
Getting ready... 17.34 more seconds please :D

student@cc-lab:~/work$ curl http://172.18.0.2:30081
Hi, my name is lazy-app-7c44789765-sn2sh and I'm a lazy app...
Getting ready... 184.09 more seconds please :D

student@cc-lab:~/work$ curl http://172.18.0.2:30081
Hi, my name is lazy-app-7c44789765-rrpcj and I'm a lazy app...
Getting ready... 110.19 more seconds please :D

student@cc-lab:~/work$ curl http://172.18.0.2:30081
Hi, my name is lazy-app-7c44789765-nvfkv and I'm a lazy app...
But I'm finally ready! :)

student@cc-lab:~/work$ curl http://172.18.0.2:30081
Hi, my name is lazy-app-7c44789765-sn2sh and I'm a lazy app...
Getting ready... 178.67 more seconds please :D

student@cc-lab:~/work$ curl http://172.18.0.2:30081
Hi, my name is lazy-app-7c44789765-nvfkv and I'm a lazy app...
But I'm finally ready! :)
```

Depending on the pod where the request is routed, we will see a successful or a failed response.
Ideally, the service would only route requests to pods that are ready.

### Defining a readiness probe

A **readiness probe** helps us by periodically polling for a condition. When the condition is successful, the container is automatically marked as ready.

We will be using a **httpGet** probe, which queries an HTTP endpoint of the app.
Most cloud-native apps have a separate endpoint for health monitoring, which is more lightweight (it doesn't perform the full processing, but only returns the status of the service).

Our lazy app responds to the `/health` endpoint, which can also be queried manually:

```shell-session
student@cc-lab:~/work$ curl http://172.18.0.2:30081/health
500 Internal Server Error
[...]
student@cc-lab:~/work$ curl http://172.18.0.2:30081/health
200 OK
```

First, let's delete the current deployment:

```shell-session
student@cc-lab:~/work$ kubectl delete deployments lazy-app
deployment.apps "lazy-app" deleted
```

Then, let's create a new deployment that defines a readiness probe:

```shell-session
student@cc-lab:~/work$ cat lazy-deployment.yaml 
apiVersion: apps/v1
kind: Deployment
metadata:
  name: lazy-app
  labels:
    app: lazy
spec:
  replicas: 5
  selector:
    matchLabels:
      app: lazy
  template:
    metadata:
      labels:
        app: lazy
    spec:
      containers:
      - name: lazy-app
        image: lazy-app:1.0.0
        ports:
        - containerPort: 80
        env:
        - name: READY_AFTER_MAX
          value: "300"
        readinessProbe:
          httpGet:
            path: /health
            port: 80
          periodSeconds: 1
          successThreshold: 2
```

:::note
The parameters have the following meaning:
  * `httpGet.path` - the path of the HTTP endpoint to probe
  * `httpGet.port` - the port of the HTTP endpoint to probe
  * `periodSeconds` - how many seconds to wait between two probes
  * `successThreshold` - after how many successful probes is the container considered ready
:::

Apply the new manifest and observe that initially no pod is ready:

```shell-session
student@cc-lab:~/work$ kubectl apply -f lazy-deployment.yaml 
deployment.apps/lazy-app created

student@cc-lab:~/work$ kubectl get deployments
NAME       READY   UP-TO-DATE   AVAILABLE   AGE
lazy-app   0/5     5            0           1s

student@cc-lab:~/work$ kubectl get pods
NAME                        READY   STATUS    RESTARTS   AGE
lazy-app-6d55bd7894-jnkm6   0/1     Running   0          2s
lazy-app-6d55bd7894-qt5mm   0/1     Running   0          2s
lazy-app-6d55bd7894-wsncf   0/1     Running   0          2s
lazy-app-6d55bd7894-zdhtv   0/1     Running   0          1s
lazy-app-6d55bd7894-zkxgm   0/1     Running   0          2s
```

Verify with `curl` that requests are only routed to pods that are ready:

```shell-session
student@cc-lab:~/work$ curl http://172.18.0.2:30081
Hi, my name is lazy-app-7c44789765-nvfkv and I'm a lazy app...
But I'm finally ready! :)
```

Eventually, they all become ready gradually.

You can observe that by listing the pods:

```shell-session
student@cc-lab:~/work$ kubectl get pods 
NAME                        READY   STATUS    RESTARTS   AGE
lazy-app-6d55bd7894-jnkm6   1/1     Running   0          41s
lazy-app-6d55bd7894-qt5mm   0/1     Running   0          41s
lazy-app-6d55bd7894-wsncf   0/1     Running   0          41s
lazy-app-6d55bd7894-zdhtv   1/1     Running   0          40s
lazy-app-6d55bd7894-zkxgm   0/1     Running   0          41s

[...]

student@cc-lab:~/work$ kubectl get pods 
NAME                        READY   STATUS    RESTARTS   AGE
lazy-app-6d55bd7894-jnkm6   1/1     Running   0          5m56s
lazy-app-6d55bd7894-qt5mm   1/1     Running   0          5m56s
lazy-app-6d55bd7894-wsncf   1/1     Running   0          5m56s
lazy-app-6d55bd7894-zdhtv   1/1     Running   0          5m55s
lazy-app-6d55bd7894-zkxgm   1/1     Running   0          5m56s
```

Or inspecting the deployment:

```shell-session
student@cc-la:~/work$ kubectl get deployments --watch
NAME       READY   UP-TO-DATE   AVAILABLE   AGE
lazy-app   0/5     5            0           2s
lazy-app   1/5     5            1           2m30s
lazy-app   2/5     5            2           2m36s
lazy-app   3/5     5            3           2m51s
lazy-app   4/5     5            4           3m38s
lazy-app   5/5     5            5           4m37s
^C
```

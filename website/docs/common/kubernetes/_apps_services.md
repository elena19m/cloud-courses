## Exposing an app

Even if `hello-app` is deployed, there is currently no way of communicating with it from outside the cluster.
The only way would be to use `kubectl exec` to enter the pod and communicate via localhost, which is not convenient.

For exposing the app outside the cluster, we need to create a Kubernetes **service**. This will act like a port-forwarding rule.

### Creating a service

We can create a service using `kubectl expose` or using a manifest. We will choose the second option.

Let's define a service manifest and apply it:

```bash
student@lab-kubernetes:~$ cat hello-app-service.yaml 
apiVersion: v1
kind: Service
metadata:
  name: hello-app
spec:
  type: NodePort      
  selector:
    app: hello
  ports:
    - protocol: TCP
      port: 8080
      targetPort: 8080
      nodePort: 30080

student@lab-kubernetes:~$ kubectl apply -f hello-app-service.yaml 
service/hello-app created

student@lab-kubernetes:~$ kubectl get services
NAME         TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)          AGE
hello-app    NodePort    10.96.186.102   <none>        8080:30080/TCP   7m42s
kubernetes   ClusterIP   10.96.0.1       <none>        443/TCP          20h
```

:::note
There are multiple attributes that describe ports:
  * `targetPort` is the port that the pod listens to
  * `port` is the port that other pods from **within** the cluster can connect to the service
  * `nodePort` is the port that we can connect to from **outside** the cluster (must be between 30000-32767)
:::
  
### Connecting to a service

Before connecting to the service, we must determine the node's IP address:

```bash
student@lab-kubernetes:~$ kubectl describe nodes kind-control-plane | grep InternalIP
  InternalIP:  172.18.0.2
```

and then connect via `curl`:

```bash
student@lab-kubernetes:~$ curl http://172.18.0.2:30080
Hello, world!
Version: 1.0.0
Hostname: hello-app-599bb4bf7f-l45k4
```

## Scaling an app

If the traffic to our app increases, we may need to scale the app (create mode pods, identical to the ones that already exist).

For example, let's scale `hello-app` to 10 pods. For this, change the value for `replicas` in `hello-app-deployment.yaml` to `10`, and reapply the manifest:

```bash
student@lab-kubernetes:~$ kubectl apply -f hello-app-deployment.yaml 
deployment.apps/hello-app configured

student@lab-kubernetes:~$ kubectl get pods
NAME                         READY   STATUS              RESTARTS   AGE
hello-app-599bb4bf7f-25w8g   1/1     Running             0          6s
hello-app-599bb4bf7f-7xzgr   0/1     ContainerCreating   0          5s
hello-app-599bb4bf7f-gr9xb   1/1     Running             0          6s
hello-app-599bb4bf7f-l45k4   1/1     Running             0          44m
hello-app-599bb4bf7f-mbgx7   0/1     ContainerCreating   0          6s
hello-app-599bb4bf7f-ps2dj   1/1     Running             0          6s
hello-app-599bb4bf7f-r6xqv   1/1     Running             0          6s
hello-app-599bb4bf7f-rrnws   0/1     ContainerCreating   0          5s
hello-app-599bb4bf7f-tnqtz   1/1     Running             0          6s
hello-app-599bb4bf7f-wh7qx   0/1     ContainerCreating   0          6s
```

After a while, you'll see that all 10 pods are running. Also, the deployment shows 10 available pods:

```bash
student@lab-kubernetes:~$ kubectl get deployments
NAME        READY   UP-TO-DATE   AVAILABLE   AGE
hello-app   10/10   10           10          45m
```

### Replica sets

What actually happened is that a Kubernetes **replica set** associated with the deployment, of scale `10`, was created:

```bash
student@lab-kubernetes:~$ kubectl get replicasets
NAME                   DESIRED   CURRENT   READY   AGE
hello-app-599bb4bf7f   10        10        10      1m
```

### Testing the scaled app

Connect multiple times to the service, using `curl`. You will notice that each time, a different pod responds:

```bash
student@lab-kubernetes:~$ curl http://172.18.0.2:30080
Hello, world!
Version: 1.0.0
Hostname: hello-app-599bb4bf7f-r6xqv
student@lab-kubernetes:~$ curl http://172.18.0.2:30080
Hello, world!
Version: 1.0.0
Hostname: hello-app-599bb4bf7f-gr9xb
student@lab-kubernetes:~$ curl http://172.18.0.2:30080
Hello, world!
Version: 1.0.0
Hostname: hello-app-599bb4bf7f-rrnws
student@lab-kubernetes:~$ curl http://172.18.0.2:30080
Hello, world!
Version: 1.0.0
Hostname: hello-app-599bb4bf7f-7xzgr
student@lab-kubernetes:~$ curl http://172.18.0.2:30080
Hello, world!
Version: 1.0.0
Hostname: hello-app-599bb4bf7f-ps2dj
```

## Upgrades and rollbacks

Deploying a different image version is done via editing the manifest and modifying the `image` field.

### Upgrading an app

Update `hello-app-deployment.yaml` and change the image tag to `2.0`. Then, redeploy the manifest:

```bash
student@lab-kubernetes:~$ kubectl apply -f hello-app-deployment.yaml 
deployment.apps/hello-app configured
```

To follow the status of the update, use `kubectl rollout status`:

```bash
student@lab-kubernetes:~$ kubectl rollout status deployment hello-app
Waiting for deployment "hello-app" rollout to finish: 5 out of 10 new replicas have been updated...
[...]
deployment "hello-app" successfully rolled out
```

Run a `curl` to confirm that the upgraded application is running:

```bash
student@lab-kubernetes:~$ curl http://172.18.0.2:30080
Hello, world!
Version: 2.0.0
Hostname: hello-app-56c5b6c78b-74x9s
```

### Rolling back

After the upgrade, a new replica set with scale `10` and the new image was created, and the old replica set was scaled down to `0`:

```bash
student@lab-kubernetes:~$ kubectl get replicasets
NAME                   DESIRED   CURRENT   READY   AGE
hello-app-56c5b6c78b   10        10        10      5m55s
hello-app-599bb4bf7f   0         0         0       60m
```

For quickly reverting to the previous version (for example, in case of an error), we can use `kubectl rollout undo`:

```bash
student@lab-kubernetes:~$ kubectl rollout undo deployment hello-app
deployment.apps/hello-app rolled back
```

Confirm that the rollback was successful:

```bash
student@lab-kubernetes:~$ curl http://172.18.0.2:30080
Hello, world!
Version: 1.0.0
Hostname: hello-app-599bb4bf7f-fcsf2
```

## Scaling an app

In production, the amount of traffic for an app is rarely constant. If the traffic to our app increases, we may need to scale the app (create mode pods, identical to the ones that already exist).

Let's start with the `hello-app` with only one replica.

Create and apply the deployment:

```shell-session
student@lab-kubernetes:~$ cat hello-app-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hello-app
  labels:
    app: hello
spec:
  replicas: 1
  selector:
    matchLabels:
      app: hello
  template:
    metadata:
      labels:
        app: hello
    spec:
      containers:
      - name: hello-app
        image: gitlab.cs.pub.ro:5050/scgc/cloud-courses/hello-app:1.0
        ports:
        - containerPort: 8080

student@lab-kubernetes:~$ kubectl apply -f hello-app-deployment.yaml
deployment.apps/hello-app created

student@lab-kubernetes:~$ kubectl get deployments
NAME        READY   UP-TO-DATE   AVAILABLE   AGE
hello-app   1/1     1            1           13s

student@lab-kubernetes:~$ kubectl get pods
NAME                         READY   STATUS    RESTARTS   AGE
hello-app-599bb4bf7f-l45k4   1/1     Running   0          17s
```

Then create and apply the service that exposes the app:

```shell-session
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
      nodePort: 30082

student@lab-kubernetes:~$ kubectl apply -f hello-app-service.yaml
service/hello-app created

student@lab-kubernetes:~$ kubectl get services
NAME         TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)          AGE
hello-app    NodePort    10.96.186.102   <none>        8080:30082/TCP   7m42s
kubernetes   ClusterIP   10.96.0.1       <none>        443/TCP          20h
```

Now, let's scale `hello-app` to 10 pods. For this, change the value for `replicas` in `hello-app-deployment.yaml` to `10`, and reapply the manifest:

```shell-session
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

```shell-session
student@lab-kubernetes:~$ kubectl get deployments
NAME        READY   UP-TO-DATE   AVAILABLE   AGE
hello-app   10/10   10           10          45m
```

### Replica sets

What actually happened is that a Kubernetes **replica set** associated with the deployment, of scale `10`, was created:

```shell-session
student@lab-kubernetes:~$ kubectl get replicasets
NAME                   DESIRED   CURRENT   READY   AGE
hello-app-599bb4bf7f   10        10        10      1m
```

### Testing the scaled app

Connect multiple times to the service, using `curl`. You will notice that each time, a different pod responds:

```shell-session
student@lab-kubernetes:~$ curl http://172.18.0.2:30082
Hello, world!
Version: 1.0.0
Hostname: hello-app-599bb4bf7f-r6xqv
student@lab-kubernetes:~$ curl http://172.18.0.2:30082
Hello, world!
Version: 1.0.0
Hostname: hello-app-599bb4bf7f-gr9xb
student@lab-kubernetes:~$ curl http://172.18.0.2:30082
Hello, world!
Version: 1.0.0
Hostname: hello-app-599bb4bf7f-rrnws
student@lab-kubernetes:~$ curl http://172.18.0.2:30082
Hello, world!
Version: 1.0.0
Hostname: hello-app-599bb4bf7f-7xzgr
student@lab-kubernetes:~$ curl http://172.18.0.2:30082
Hello, world!
Version: 1.0.0
Hostname: hello-app-599bb4bf7f-ps2dj
```
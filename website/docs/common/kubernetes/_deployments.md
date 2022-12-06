## Deployments

In many usecases, we want to describe the state of an application declaratively, so managing individual pods is not very convenient. Also, if an individual pod crashes or is deleted, it will not be respawned by default.

For this, we will use a **deployment** resource, which is an abstration that encapsulates one or more pods.

### Creating a deployment

Let's create a deployment for `hello-app` using the `kubectl create` command:

```bash
student@lab-kubernetes:~$ kubectl create deployment hello-app --image=gcr.io/google-samples/hello-app:1.0
deployment.apps/hello-app created
```

We can see that the deployment is created, along with a pod:

```bash
student@lab-kubernetes:~$ kubectl get deployments
NAME        READY   UP-TO-DATE   AVAILABLE   AGE
hello-app   1/1     1            1           35s

student@lab-kubernetes:~$ kubectl get pods
NAME                         READY   STATUS    RESTARTS   AGE
hello-app-79df7f8b96-mn6wj   1/1     Running   0          39s
```

### Getting information about a deployment

We can use `kubectl describe` to get details about a deployment:

```bash
student@lab-kubernetes:~$ kubectl describe deployments hello-app
Name:                   hello-app
Namespace:              default
CreationTimestamp:      Fri, 08 Apr 2022 12:40:55 +0000
Labels:                 app=hello-app
Annotations:            deployment.kubernetes.io/revision: 1
Selector:               app=hello-app
Replicas:               1 desired | 1 updated | 1 total | 1 available | 0 unavailable
StrategyType:           RollingUpdate
MinReadySeconds:        0
RollingUpdateStrategy:  25% max unavailable, 25% max surge
[...]
```

### Removing a deployment

A deployment is removed with the `kubectl delete` command:

```bash
student@lab-kubernetes:~$ kubectl delete deployments hello-app
deployment.apps "hello-app" deleted
```

### Kubernetes manifests

Rather than using `kubectl create` commands, it is more convenient to use Kubernetes **manifests**.
These are `.yaml` files that describe the resources we want to create. We can then create the resources with `kubectl apply`.

For example, let's define a manifest for creating the `hello-app` deployment:

```bash
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
        image: gcr.io/google-samples/hello-app:1.0
        ports:
        - containerPort: 8080
```

Apply the manifest and check that the deployment and the pod was created:

```bash
student@lab-kubernetes:~$ kubectl apply -f hello-app-deployment.yaml
deployment.apps/hello-app created

student@lab-kubernetes:~$ kubectl get deployments
NAME        READY   UP-TO-DATE   AVAILABLE   AGE
hello-app   1/1     1            1           13s

student@lab-kubernetes:~$ kubectl get pods
NAME                         READY   STATUS    RESTARTS   AGE
hello-app-599bb4bf7f-l45k4   1/1     Running   0          17s
```

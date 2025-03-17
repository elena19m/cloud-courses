## Autoscaling

In production, it's unfeasible to manually scale up and down an application.
Instead, we need a solution that automatically does this, as resource demands are changing.

In Kubernetes, we have the concept of **horizontal pod autoscaler**, which adds or removes pods from a replica set based on resource usage.

### Defining resource constrains

Remove the current `hello-app1 deployment, if any:

First, let's delete the current deployment:

```shell-session
student@cc-lab:~/work$ kubectl delete deployments hello-app
deployment.apps "hello-app" deleted
```

Then, let's create and apply a new deployment that defines resource constraints:

```shell-session
student@cc-lab:~/work$ cat hello-deployment.yaml
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
        resources:
          limits:
            cpu: 200m
          requests:
            cpu: 100m

student@cc-lab$ kubectl apply -f hello-deployment.yaml 
deployment.apps/hello-app created
```

:::note
The parameters have the following meaning:
  * `resources.requests.cpu` - minimum resources requested by the container (0.1 CPU cores in this case)
  * `resources.limits.cpu` - maximum resources requested by the container (0.2 CPU cores in this case)
:::

### Installing the metrics server

In order for Kubernetes to measure resource utilization, we must install the **metrics server**, which is not installed by default in Kind.

We will use **Helm**, which is a package manager for Kubernetes.

Using Helm will be the scope of another lab. For now, run the following commands to install the metrics server:

```shell-session
student@cc-lab:~/work$ helm repo add metrics-server https://kubernetes-sigs.github.io/metrics-server/
student@cc-lab:~/work$ helm repo update
student@cc-lab:~/work$ helm upgrade --install --set args={--kubelet-insecure-tls} metrics-server metrics-server/metrics-server --namespace kube-system
```

### Defining the autoscaling policy

Now, let's define and apply the horizontal cpu autoscaler:

```shell-session
student@cc-lab:~/work$ cat hello-autoscaler.yaml 
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: hello
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: hello-app
  minReplicas: 1
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 5
 
student@cc-lab:~/work$ kubectl apply -f hello-autoscaler.yaml
horizontalpodautoscaler.autoscaling/hello created
```

:::note
The parameters have the following meaning:
  * `minreplicas` - minimum replicas to scale down to
  * `maxReplicas` - maximum replicas to scale up to
  * `averageUtilization` - when to scale; in this case, when the average CPU load across pods is greater than 5%
:::

Also, inspect the horizontal pod autoscaler:

```shell-session
student@cc-lab:~/work$ kubectl get hpa
NAME    REFERENCE              TARGETS              MINPODS   MAXPODS   REPLICAS   AGE
hello   Deployment/hello-app   cpu: 0%/5%   1         10        1          2m30s
```

:::note
The values set for resource limits and average utilization are unrealisticaly low, but we did this to be able to generate load.
:::

### Generating load

Open another terminal and run a while loop that sends curl requests:

```shell-session
student@cc-lab:~$ while true; do curl http://172.18.0.2:30082/; sleep 0.01; done
```

In the first terminal, inspect the horizontal pod autoscaler:

```shell-session
student@cc-lab:~/work$ kubectl get hpa --watch
NAME    REFERENCE              TARGETS      MINPODS   MAXPODS   REPLICAS   AGE
hello   Deployment/hello-app   cpu: 0%/5%   1         10        1          20m
hello   Deployment/hello-app   cpu: 2%/5%   1         10        1          21m
hello   Deployment/hello-app   cpu: 18%/5%   1         10        1          21m
hello   Deployment/hello-app   cpu: 16%/5%   1         10        4          21m
hello   Deployment/hello-app   cpu: 5%/5%    1         10        4          22m
hello   Deployment/hello-app   cpu: 4%/5%    1         10        4          23m
[...]
```

Observe how additional replicas have been automatically created:

```shell-session
student@cc-lab:~/work$ kubectl get pods
NAME                        READY   STATUS    RESTARTS   AGE
hello-app-f447d7765-72sp8   1/1     Running   0          2m10s
hello-app-f447d7765-bwllr   1/1     Running   0          6m3s
hello-app-f447d7765-jr8kx   1/1     Running   0          2m10s
hello-app-f447d7765-v7lnq   1/1     Running   0          2m10s
```

### Stopping the load

Stop the while loop from the other terminal.
Continue to inspect the horizontal pod autoscaler:

```shell-session
student@cc-lab:~/work$ kubectl get hpa --watch
NAME    REFERENCE              TARGETS      MINPODS   MAXPODS   REPLICAS   AGE
hello   Deployment/hello-app   cpu: 5%/5%   1         10        4          23m
hello   Deployment/hello-app   cpu: 3%/5%   1         10        4          24m
hello   Deployment/hello-app   cpu: 0%/5%   1         10        4          25m
hello   Deployment/hello-app   cpu: 0%/5%   1         10        4          27m
hello   Deployment/hello-app   cpu: 1%/5%   1         10        4          27m
hello   Deployment/hello-app   cpu: 0%/5%   1         10        4          28m
hello   Deployment/hello-app   cpu: 1%/5%   1         10        4          29m
hello   Deployment/hello-app   cpu: 0%/5%   1         10        4          29m
hello   Deployment/hello-app   cpu: 0%/5%   1         10        4          29m
hello   Deployment/hello-app   cpu: 1%/5%   1         10        3          29m
hello   Deployment/hello-app   cpu: 0%/5%   1         10        1          30m
hello   Deployment/hello-app   cpu: 1%/5%   1         10        1          30m
hello   Deployment/hello-app   cpu: 0%/5%   1         10        1          31m
```

Notice that after a few minutes, the instances have been scaled down to 1:

```shell-session
student@cc-lab:~/work$ kubectl get pods
NAME                        READY   STATUS    RESTARTS   AGE
hello-app-f447d7765-bwllr   1/1     Running   0          14m
```

### Exercise - fine tuning

Try to tune the:
  * resources parameters (`resources.requests.cpu` and `resources.limits.cpu`)
  * autoscaler parameter (`averageUtilization`)
  * the way you generate traffic

in order to reach the maximum number of 10 instances.

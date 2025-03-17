## Ingress

Even if we can expose Kubernetes apps using services, each service runs on a different port.
If we want a single point of acccess to all apps in the Kubernetes cluster, we can use an **Ingress**.

An Ingress is a Kubernetes object that acts like an API gateway. Each service can be accessed using a different HTTP resource path.

### Setting up an ingress on the Kind cluster

Kind doesn't have the full Ingress functionality by default, so we have to install some dependencies.

First, let's install the Ingress controller functionality:

```shell-session
student@cc-lab:~/work$ kubectl apply -f https://kind.sigs.k8s.io/examples/ingress/deploy-ingress-nginx.yaml
namespace/ingress-nginx created
serviceaccount/ingress-nginx created
serviceaccount/ingress-nginx-admission created
role.rbac.authorization.k8s.io/ingress-nginx created
role.rbac.authorization.k8s.io/ingress-nginx-admission created
clusterrole.rbac.authorization.k8s.io/ingress-nginx created
clusterrole.rbac.authorization.k8s.io/ingress-nginx-admission created
rolebinding.rbac.authorization.k8s.io/ingress-nginx created
rolebinding.rbac.authorization.k8s.io/ingress-nginx-admission created
clusterrolebinding.rbac.authorization.k8s.io/ingress-nginx created
clusterrolebinding.rbac.authorization.k8s.io/ingress-nginx-admission created
configmap/ingress-nginx-controller created
service/ingress-nginx-controller created
service/ingress-nginx-controller-admission created
deployment.apps/ingress-nginx-controller created
job.batch/ingress-nginx-admission-create created
job.batch/ingress-nginx-admission-patch created
ingressclass.networking.k8s.io/nginx created
validatingwebhookconfiguration.admissionregistration.k8s.io/ingress-nginx-admission created
```

Then, we must install the cloud provider add-on for Kind.
Go to https://github.com/kubernetes-sigs/cloud-provider-kind/releases and download the archive for Linux AMD64 architecture.

Extract it, and run the executable in a different terminal. Keep it running.

```shell-session
student@cc-lab-alexandru-carp:~$ wget https://github.com/kubernetes-sigs/cloud-provider-kind/releases/download/v0.6.0/cloud-provider-kind_0.6.0_linux_amd64.tar.gz
[...]

student@cc-lab-alexandru-carp:~$ tar -xvf cloud-provider-kind_0.6.0_linux_amd64.tar.gz 
LICENSE
README.md
cloud-provider-kind

student@cc-lab-alexandru-carp:~$ ./cloud-provider-kind
[...]
```

### Configuring another service

Let's configure another service, similar to the `hello-app` one, so that the ingress will route traffic to both services.
This time, we will use `hello-app:2.0` image.

Create and apply the second deployment:

```shell-session
student@cc-lab:~/work$ cat hello-deployment-v2.yaml 
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hello-app-v2
  labels:
    app: hello-v2
spec:
  replicas: 1
  selector:
    matchLabels:
      app: hello-v2
  template:
    metadata:
      labels:
        app: hello-v2
    spec:
      containers:
      - name: hello-app
        image: gitlab.cs.pub.ro:5050/scgc/cloud-courses/hello-app:2.0
        ports:
        - containerPort: 8080
        resources:
          limits:
            cpu: 200m
          requests:
            cpu: 100m

student@cc-lab:~/work$ kubectl apply -f hello-deployment-v2.yaml 
deployment.apps/hello-app-v2 created

student@cc-lab:~/work$ kubectl get deployments
NAME           READY   UP-TO-DATE   AVAILABLE   AGE
hello-app      1/1     1            1           54m
hello-app-v2   1/1     1            1           12s

student@cc-lab:~/work$ kubectl get pods
NAME                            READY   STATUS    RESTARTS   AGE
hello-app-f447d7765-bwllr       1/1     Running   0          35m
hello-app-v2-5b9fbc5465-wr6nr   1/1     Running   0          5s
```

Create apply the second service:

```shell-session
student@cc-lab:~/work$ cat hello-service-v2.yaml 
apiVersion: v1
kind: Service
metadata:
  name: hello-app-v2
spec:
  type: NodePort
  selector:
    app: hello-v2
  ports:
    - protocol: TCP
      port: 8080
      targetPort: 8080
      nodePort: 30083

student@cc-lab:~/work$ kubectl apply -f hello-service-v2.yaml 
service/hello-app-v2 created

student@cc-lab:~/work$ kubectl get services
NAME           TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)          AGE
hello-app      NodePort    10.96.172.199   <none>        8080:30082/TCP   55m
hello-app-v2   NodePort    10.96.33.190    <none>        8080:30083/TCP   3s
kubernetes     ClusterIP   10.96.0.1       <none>        443/TCP          162m
```

### Defining the ingress

We will define an ingress so that:
  * `/v1` path will point to the service for `hello-app:1.0`
  * `/v2` path will point to the service for `hello-app:2.0`

```shell-session
student@cc-lab:~/work$ cat hello-ingress.yaml 
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: hello-ingress
spec:
  rules:
  - http:
      paths:
      - pathType: Prefix
        path: /v1
        backend:
          service:
            name: hello-app
            port:
              number: 8080
      - pathType: Prefix
        path: /v2
        backend:
          service:
            name: hello-app-v2
            port:
              number: 8080

student@cc-lab:~/work$ kubectl apply -f hello-ingress.yaml 
ingress.networking.k8s.io/hello-ingress configured

student@cc-lab:~/work$ kubectl describe ingress hello-ingress
Name:             hello-ingress
Labels:           <none>
Namespace:        default
Address:          
Ingress Class:    <none>
Default backend:  <default>
Rules:
  Host        Path  Backends
  ----        ----  --------
  *           
              /v1   hello-app:8080 (10.244.0.50:8080)
              /v2   hello-app-v2:8080 (10.244.0.54:8080)
Annotations:  <none>
Events:       <none>
```

### Testing traffic routing

For identifying the IP address associated to the ingress, we must inspect the services in the `ingress-nginx` namespace:

```shell-session
student@cc-lab:~/work$ kubectl get --namespace ingress-nginx services
NAME                                 TYPE           CLUSTER-IP     EXTERNAL-IP   PORT(S)                      AGE
ingress-nginx-controller             LoadBalancer   10.96.75.175   172.18.0.3    80:32191/TCP,443:32729/TCP   5m45s
ingress-nginx-controller-admission   ClusterIP      10.96.116.85   <none>        443/TCP
```

In our case, the IP address is `172.18.0.3`.

Let's test traffic routing with `curl`:

```shell-session
student@cc-lab:~/work$ curl 172.18.0.3/v1
Hello, world!
Version: 1.0.0
Hostname: hello-app-f447d7765-bwllr

student@cc-lab:~/work$ curl 172.18.0.3/v2
Hello, world!
Version: 2.0.0
Hostname: hello-app-v2-5b9fbc5465-wr6nr
```



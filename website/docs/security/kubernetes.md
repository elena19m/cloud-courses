---
sidebar_position: 5
---

# Container orchestration with Kubernetes
## Setup

We will be using a virtual machine in the [faculty's cloud](http://cloud.grid.pub.ro/).

When creating a virtual machine in the Launch Instance window:
  * Select **Boot from image** in **Instance Boot Source** section
  * Select **SCGC Template 2021** in **Image Name** section
  * Select the **m1.large** flavor.

In the base virtual machine:
  * Download the laboratory archive from [here](https://repository.grid.pub.ro/cs/scgc/laboratoare/lab-kubernetes.zip) in the `work` directory.
Use: `wget --user=user-curs --ask-password https://repository.grid.pub.ro/cs/scgc/laboratoare/lab-kubernetes.zip` to download the archive.
Replace `user-curs` with your LDAP username. The password is your LDAP password.
  * Extract the archive.
  * Download the `runvm.sh` script.
The `.qcow2` files will be used to start virtual machines using the `runvm.sh` script.
  * Start the virtual machines using `bash runvm.sh`.
  * The username for connecting to the nested VMs is `student` and the password is `student`.

```bash
$ # change the working dir
$ cd ~/work
$ # download the archive; replace user-curs with your LDAP username
$ wget --user=user-curs --ask-password https://repository.grid.pub.ro/cs/scgc/laboratoare/lab-kubernetes.zip
$ unzip lab-kubernetes.zip
$ # start VMs; it may take a while
$ bash runvm.sh
$ # check if the VMs booted
$ virsh net-dhcp-leases labvms
```

## Why Kubernetes?

Container solutions (like Docker) are very good for deploying applications in predictable and isolated environments.
However, for large systems, with a lot of nodes, it is impractical to manage containers with `docker` commands.

For this, container orchestration solutions have been developed. They manage a pool of worker nodes (basically, Linux machines with Docker installed) and containers are dynamically allocated to those nodes.
The orchestrator also takes care of container lifecycle operations (start, stop, scale, upgrade etc.).

Examples of container orchestation solutions:
  * Apache Mesos
  * Docker Swarm
  * Kubernetes
  * RedHat OpenShift (based on Kubernetes)

For this lab, we will be focusing on [Kubernetes](https://kubernetes.io/).

## Creating a Kubernetes cluster

In Kubernetes, the terminology for the pool of worker nodes is **Kubernetes cluster**.

There are many approaches for deploying and installing a Kubernetes cluster, ranging from single-node solutions suitable for testing and development to full-scale, production-ready clusters.

For this lab, we will be using **[kind](https://kind.sigs.k8s.io/)** (acronym for Kubernetes in Docker), which deployes a lightweight, single-node cluster, inside Docker.

:::note
`kind` is already installed on the lab machine.  If you want to know how to install it on a different machine, check out the [user guide](https://kind.sigs.k8s.io/docs/user/quick-start#installation).
:::

For creating a cluster on the lab machine, use the `kind create cluster` command:

```bash
student@lab-kubernetes:~$ kind create cluster
Creating cluster "kind" ...
 ✓ Ensuring node image (kindest/node:v1.23.4) 🖼 
 ✓ Preparing nodes 📦  
 ✓ Writing configuration 📜 
 ✓ Starting control-plane 🕹️ 
 ✓ Installing CNI 🔌 
 ✓ Installing StorageClass 💾 
Set kubectl context to "kind-kind"
You can now use your cluster with:

kubectl cluster-info --context kind-kind

Thanks for using kind! 😊
```

## Kubernetes CLI

The official tool for interacting with a Kubernetes cluster is `kubectl`.

:::note
`kubectl` is already installed on the lab machine.  If you want to know how to install it on a different machine, check out the [documentation](https://kubernetes.io/docs/tasks/tools/).
:::

Use `kubectl cluster-info` to show information about the cluster you deployed. You will see that the cluster is running locally:

```bash
student@lab-kubernetes:~$ kubectl cluster-info
Kubernetes control plane is running at https://127.0.0.1:41821
CoreDNS is running at https://127.0.0.1:41821/api/v1/namespaces/kube-system/services/kube-dns:dns/proxy

To further debug and diagnose cluster problems, use 'kubectl cluster-info dump'.
```

Use `kubectl get nodes` to show information about the cluster nodes. You will see just a single node:

```bash
student@lab-kubernetes:~$ kubectl get nodes
NAME                 STATUS   ROLES                  AGE   VERSION
kind-control-plane   Ready    control-plane,master   19h   v1.23.4
```

## Pods

The basic resource in Kubernetes is the **pod** which typically encapsulates a container with the resources it needs (e.g. config files, volumes etc.).

In some usecases, a pod can contain multiple containers (also called sidecar containers). We won't be addressing this in the lab.

### Launching a pod

Launching a pod is very similar to launching a Docker container. We will use the `kubectl run` command to do that.

We will use the `gcr.io/google-samples/hello-app:1.0` image, with is a simple HTTP server that echoes a message when receiving a request.

```bash
student@lab-kubernetes:~$ kubectl run hello-app --image=gcr.io/google-samples/hello-app:1.0
pod/hello-app created
```

### Getting information about a pod

For displaying a summary about pods or a certain pod, we can use `kubectl get pods`:

```bash
student@lab-kubernetes:~$ kubectl get pods
NAME                         READY   STATUS    RESTARTS   AGE
hello-app                    1/1     Running   0          12s
```

For detailed information, we can use `kubectl describe`:

```bash
student@lab-kubernetes:~$ kubectl describe pods hello-app
Name:         hello-app
Namespace:    default
Priority:     0
Node:         kind-control-plane/172.18.0.2
Start Time:   Fri, 08 Apr 2022 09:43:55 +0000
Labels:       run=hello-app
Annotations:  <none>
Status:       Running
IP:           10.244.0.89
[...]
```

### Running commands inside a pod

For debugging purposes, we can enter a pod and run commands, using `kubectl exec`. This is similar to `docker exec`.

We will test that the container is working, by sending a request to its own HTTP endpoint:

```bash
student@lab-kubernetes:~$ kubectl exec -it hello-app /bin/sh
kubectl exec [POD] [COMMAND] is DEPRECATED and will be removed in a future version. Use kubectl exec [POD] -- [COMMAND] instead.
/ # wget -q -O - localhost:8080
Hello, world!
Version: 1.0.0
Hostname: hello-app
/ # exit
```

### Getting logs from a pod

Similar to Docker, you can view the logs from a pod, using `kubectl logs`:

```bash
student@lab-kubernetes:~$ kubectl logs hello-app
2022/04/08 13:36:58 Server listening on port 8080
2022/04/08 13:37:34 Serving request: /
```

### Removing a pod

A pod is removed with the `kubectl delete` command:

```bash
student@lab-kubernetes:~$ kubectl delete pods hello-app
pod "hello-app" deleted
```

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

## Persistent storage

Most applications require persistent storage for keeping their state. For example, web servers need to store the content they are serving.

In the following steps, we will deploy an **nginx** application that will serve a custom-defined ``index.html``.

### Defining a ConfigMap

Kubernetes **ConfigMaps** are objects that can store arbitrary strings, including files.

Let's create a manifest that defines a ConfigMap that stores a custom `index.html` file. Note that the file content is defined inline:

```bash
student@lab-kubernetes:~$ cat nginx-html.yaml 
apiVersion: v1
kind: ConfigMap
metadata:
  name: nginx-html
data:
 index.html: |
    <html><body>Hello from SCGC Lab!</body></html>
```

Apply the manifest:

```bash
student@lab-kubernetes:~$ kubectl apply -f nginx-html.yaml 
configmap/nginx-html created
```

### Defining a Volume for a Deployment

Next, we will define an nginx **deployment** that mounts the ConfigMap by using a Volume.

```bash
student@lab-kubernetes:~$ cat nginx-deployment.yaml 
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx
  labels:
    app: nginx
spec:
  replicas: 1
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:latest
        ports:
        - containerPort: 80
        volumeMounts:
        - name: nginx-html-vol
          mountPath: "/usr/share/nginx/html/index.html"
          subPath: "index.html"
      volumes:
      - name: nginx-html-vol
        configMap:
          name: nginx-html
          items:
          - key: "index.html"
            path: "index.html"
```

:::note
Observe the following:
  * we defined a Volume called `nginx-html-vol` that takes its content from `nginx-html` ConfigMap
  * the volume is mounted in the nginx container, under `/usr/share/nginx/html/index.html`
:::

Apply the manifest:

```bash
student@lab-kubernetes:~$ kubectl apply -f nginx-deployment.yaml 
deployment.apps/nginx created
```

Also, expose the app via a service:

```bash
student@lab-kubernetes:~$ cat nginx-service.yaml 
apiVersion: v1
kind: Service
metadata:
  name: nginx
spec:
  type: NodePort      
  selector:
    app: nginx
  ports:
    - protocol: TCP
      port: 80
      targetPort: 80
      nodePort: 30888

student@lab-kubernetes:~$ kubectl apply -f nginx-service.yaml 
service/nginx created
```

Test that the app was correctly configured:

```bash
student@lab-kubernetes:~$ curl http://172.18.0.2:30888
<html><body>Hello from SCGC Lab!</body></html>
```

## Communicating between apps

Apps deployed in Kubernetes can also communicate with each other, using the service names.

For showing this, we will configure the nginx app, so that for requests on `/hello`, it proxies the request to the `hello-app` service.

### Creating the ConfigMap

We will need to create a ConfigMap for the custom nginx config file:

```bash
student@lab-kubernetes:~$ cat nginx-config.yaml 
apiVersion: v1
kind: ConfigMap
metadata:
  name: nginx-conf
data:
  default.conf: |
    server {
      listen       80;
      server_name  localhost;


      location / {
        root   /usr/share/nginx/html;
        index  index.html index.htm;
      }

      location /hello {
        proxy_pass http://hello-app:8080;
      }
    }

student@lab-kubernetes:~$ kubectl apply -f nginx-config.yaml 
configmap/nginx-conf created
```

### Mounting the config file

Modify the nginx deployment so that the config file is mounted in `/etc/nginx/conf.d/default.conf`:

```bash
student@lab-kubernetes:~$ cat nginx-deployment.yaml 
[...]
        volumeMounts:
[...]
        - name: nginx-conf-vol
          mountPath: "/etc/nginx/conf.d/default.conf"
          subPath: "default.conf"
      volumes:
[...]
      - name: nginx-conf-vol
        configMap:
          name: nginx-conf
          items:
          - key: "default.conf"
            path: "default.conf"

student@lab-kubernetes:~$ kubectl apply -f nginx-deployment.yaml 
deployment.apps/nginx configured
```

### Testing the app

Test that requests on `/` work as before, but requests on `/hello` are proxied:

```bash
student@lab-kubernetes:~$ curl http://172.18.0.2:30888
<html><body>Hello from SCGC Lab!</body></html>

student@lab-kubernetes:~$ curl http://172.18.0.2:30888/hello
Hello, world!
Version: 1.0.0
Hostname: hello-app-599bb4bf7f-dxqxs
```

## Namespaces

Even if containers represent isolated environments, we may need a broader isolation, for security purposes.

For examples, we may want to separate the applications of different customers, or development and production environments.

In Kubernetes, this is achieved using **namespaces**.

### Listing namespaces

All the exercises until now were performed in the **default** namespace. But Kubernetes has several namespaces out of the box:

```bash
student@lab-kubernetes:~$ kubectl get namespaces
NAME                 STATUS   AGE
default              Active   25h
kube-node-lease      Active   25h
kube-public          Active   25h
kube-system          Active   25h
local-path-storage   Active   25h
```

For example, the `kube-system` namespace is used for Kubernetes internal resources, that should not be modified by the user:

```bash
student@lab-kubernetes:~$ kubectl get pods -n kube-system
NAME                                         READY   STATUS    RESTARTS   AGE
coredns-64897985d-6qnmw                      1/1     Running   0          25h
coredns-64897985d-f6k2t                      1/1     Running   0          25h
etcd-kind-control-plane                      1/1     Running   0          25h
kindnet-tbmt8                                1/1     Running   0          25h
kube-apiserver-kind-control-plane            1/1     Running   0          25h
kube-controller-manager-kind-control-plane   1/1     Running   0          25h
kube-proxy-dpz24                             1/1     Running   0          25h
kube-scheduler-kind-control-plane            1/1     Running   0          25h
```

### Creating a new namespace

We can create a new namespace using `kubectl create`:

```bash
student@lab-kubernetes:~$ kubectl create namespace test
namespace/test created
```

### Verifying namespace isolation

Create a simple `nginx` pod in the `test` namespace. Notice the `-n test` parameter.

```bash
student@lab-kubernetes:~$ kubectl run nginx --image=nginx:latest -n test
pod/nginx created

student@lab-kubernetes:~$ kubectl get pods -n test
NAME    READY   STATUS    RESTARTS   AGE
nginx   1/1     Running   0          7s
```

Connect to the pod and verify if the `hello-app` service from the `default` namespace can be reached:

```bash
student@lab-kubernetes:~$ kubectl exec -it nginx -n test /bin/bash
kubectl exec [POD] [COMMAND] is DEPRECATED and will be removed in a future version. Use kubectl exec [POD] -- [COMMAND] instead.
root@nginx:/# curl http://hello-app:8080
curl: (6) Could not resolve host: hello-app
```

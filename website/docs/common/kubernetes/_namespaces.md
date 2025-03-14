## Communicating between apps

Apps deployed in Kubernetes can also communicate with each other, using the service names.

For showing this, we will configure the nginx app, so that for requests on `/hello`, it proxies the request to the `hello-app` service.

### Creating the ConfigMap

We will need to create a ConfigMap for the custom nginx config file:

```shell-session
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

```shell-session
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

```shell-session
student@lab-kubernetes:~$ curl http://172.18.0.2:30888
<html><body>Hello from SCGC Lab!</body></html>

student@lab-kubernetes:~$ curl http://172.18.0.2:30888/hello
Hello, world!
Version: 1.0.0
Hostname: hello-app-599bb4bf7f-dxqxs
```

:::note
This example was only a didactical one, for showing how a config file can be mounted into a pod.
For request routing, Kubernetes has a native mechanism, called [Ingress](https://kubernetes.io/docs/concepts/services-networking/ingress/)
:::


## Namespaces

Even if containers represent isolated environments, we may need a broader isolation, for security purposes.

For examples, we may want to separate the applications of different customers, or development and production environments.

In Kubernetes, this is achieved using **namespaces**.

### Listing namespaces

All the exercises until now were performed in the **default** namespace. But Kubernetes has several namespaces out of the box:

```shell-session
student@lab-kubernetes:~$ kubectl get namespaces
NAME                 STATUS   AGE
default              Active   25h
kube-node-lease      Active   25h
kube-public          Active   25h
kube-system          Active   25h
local-path-storage   Active   25h
```

For example, the `kube-system` namespace is used for Kubernetes internal resources, that should not be modified by the user:

```shell-session
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

```shell-session
student@lab-kubernetes:~$ kubectl create namespace test
namespace/test created
```

### Verifying namespace isolation

Create a simple `nginx` pod in the `test` namespace. Notice the `-n test` parameter.

```shell-session
student@lab-kubernetes:~$ kubectl run nginx --image=gitlab.cs.pub.ro:5050/scgc/cloud-courses/nginx:latest -n test
pod/nginx created

student@lab-kubernetes:~$ kubectl get pods -n test
NAME    READY   STATUS    RESTARTS   AGE
nginx   1/1     Running   0          7s
```

Connect to the pod and verify if the name of the `hello-app` service from the `default` namespace can be resolved:

```shell-session
student@lab-kubernetes:~$ kubectl exec -it nginx -n test -- /bin/bash
root@nginx:/# curl http://hello-app:8080
curl: (6) Could not resolve host: hello-app
```

:::note
The default namespace isolation is not very strong, because resources can still be accessed by FQDN or by IP address.
But additional security can be implemented, such as denying all network traffic between namespaces.
:::

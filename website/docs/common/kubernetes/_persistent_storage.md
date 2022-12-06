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

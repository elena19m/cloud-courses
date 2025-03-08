## Pods

The basic resource in Kubernetes is the **pod** which typically encapsulates a container with the resources it needs (e.g. config files, volumes etc.).

In some usecases, a pod can contain multiple containers (also called sidecar containers). We won't be addressing this in the lab.

### Launching a pod

Launching a pod is very similar to launching a Docker container. We will use the `kubectl run` command to do that.

We will use the `gitlab.cs.pub.ro:5050/scgc/cloud-courses/hello-app:1.0` image, which is a simple HTTP server that echoes a message when receiving a request.

```shell-session
student@lab-kubernetes:~$ kubectl run hello-app --image=gitlab.cs.pub.ro:5050/scgc/cloud-courses/hello-app:1.0
pod/hello-app created
```

### Getting information about a pod

For displaying a summary about pods or a certain pod, we can use `kubectl get pods`:

```shell-session
student@lab-kubernetes:~$ kubectl get pods
NAME                         READY   STATUS    RESTARTS   AGE
hello-app                    1/1     Running   0          12s
```

For detailed information, we can use `kubectl describe`:

```shell-session
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

```shell-session
student@lab-kubernetes:~$ kubectl exec -it hello-app -- /bin/sh
/ # wget -q -O - localhost:8080
Hello, world!
Version: 1.0.0
Hostname: hello-app
/ # exit
```

### Getting logs from a pod

Similar to Docker, you can view the logs from a pod, using `kubectl logs`:

```shell-session
student@lab-kubernetes:~$ kubectl logs hello-app
2022/04/08 13:36:58 Server listening on port 8080
2022/04/08 13:37:34 Serving request: /
```

### Removing a pod

A pod is removed with the `kubectl delete` command:

```shell-session
student@lab-kubernetes:~$ kubectl delete pods hello-app
pod "hello-app" deleted
```

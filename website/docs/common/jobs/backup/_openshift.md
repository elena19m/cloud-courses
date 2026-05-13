## Running Applications on OpenShift

### Connecting to OpenShift

OpenShift is Red Hat's container application platform that provides a secure and scalable foundation for building, deploying, and managing containerized applications.
It's a Kubernetes distribution with added features for enterprise use, including automated operations, developer workflows, and comprehensive security capabilities.
OpenShift extends Kubernetes with developer-focused tools that make it easier to manage applications throughout their lifecycle.

The UPB OpenShift deployment is at the following link: https://console-openshift-console.apps.ocp-demo.grid.pub.ro
This deployment is used to that you can you can us a real-world cluster deployment, with its limitations and advantages.

You will be running commands inside of the OpenShift cloud using its CLI-specific tool called `oc`.
The `oc` command offers a superset of the `kubectl` command, meaning that we can consider it an alias from the point of view of Cloud Computing.

A user has to login using the CLI in order to use the `oc` command.
We have to generate a token which will help us login.
To create the token we have to connect to the OpenShift dashboard: https://console-openshift-console.apps.ocp-demo.grid.pub.ro

From the OpenShift dashboard we have to press the button containing our names and select the `Copy login command`.
You will press the `Display token` link in the next page, which will display a command that you will have to copy paste in your terminal.
The command looks like this:
```
sergiu@epsilon:~/cc-workspace/curs-08$ oc login --token=sha256~asdlfkjhlkadsf23hj4l --server=https://api.ocp-demo.grid.pub.ro:6443
WARNING: Using insecure TLS client config. Setting this option is not supported!

Logged into "https://api.ocp-demo.grid.pub.ro:6443" as "sergiu.weisz" using the token provided.

You don't have any projects. You can try to create a new project, by running

    oc new-project <projectname>

```

Instead of referring to namespaces directly, OpenShift users the concept of projects.
To create a namespace for ourselves in the infrastructure, we have to run the following command:
```
sergiu@epsilon:~/ocp/upgrade$ oc new-project sergiu-weisz-openshift
Now using project "sergiu-weisz-openshift" on server "https://api.ocp-demo.grid.pub.ro:6443".

You can add applications to this project with the 'new-app' command. For example, try:

    oc new-app rails-postgresql-example

to build a new example application in Ruby. Or use kubectl to deploy a simple Kubernetes application:

    kubectl create deployment hello-node --image=registry.k8s.io/e2e-test-images/agnhost:2.43 -- /agnhost serve-hostname
```

To switch to a namespace we can use the `oc` command as follows:
```
sergiu@epsilon:~/cc-workspace/curs-08$ oc project sergiu-weisz-prj
Now using project "sergiu-weisz-prj" on server "https://api.ocp-demo.grid.pub.ro:6443".
```

### Deploying Ollama on OpenShift

Ollama is a tool which provides easy access to LLM which can be run on our own private or public clouds instead of SaaS infrastructures.
The advantages of running an LLM locally are as follows:

* not be paying subscription fees for the service
* you can use already available hardware with no added cost
* all your queries stay locally, nothing will be reported or added to any online profile of you

Together with Ollama we will be deploying the Open WebUI, a dashbord which connects to the running Ollama instance and provides a friendly user interface to run queries.

We will be addapting the following tutorial to run on our OpenShift cluster: https://gautam75.medium.com/deploy-ollama-and-open-webui-on-openshift-c88610d3b5c7.
We will not be using it directly, because we do not wish to allocate PersistentVolumes for a temporary use case such as a lab context.

We will be deploying the Ollama pods together with a service which will be receiving the queries.
Apply the following manifest to your cluster:
```
sergiu@epsilon:~/cc-workspace/curs-09/ollama$ cat ollama.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ollama
spec:
  replicas: 1
  selector:
    matchLabels:
      app: ollama
  template:
    metadata:
      labels:
        app: ollama
    spec:
      containers:
      - name: ollama
        image: ollama/ollama:latest
        ports:
        - containerPort: 11434
        volumeMounts:
        - name: ollama-data
          mountPath: /.ollama
        tty: true
      volumes:
      - name: ollama-data
        emptyDir: {}
---
apiVersion: v1
kind: Service
metadata:
  name: ollama
spec:
  ports:
  - protocol: TCP
    port: 11434
    targetPort: 11434
  selector:
    app: ollama
sergiu@epsilon:~/cc-workspace/curs-09/ollama$ oc apply -f ollama.yaml
deployment.apps/ollama created
service/ollama created
```

We will be checking if the deployment has been created and that the pod has been launched:
```
sergiu@epsilon:~/cc-workspace/curs-09/ollama$ oc get deployment
NAME     READY   UP-TO-DATE   AVAILABLE   AGE
ollama   1/1     1            1           50s
sergiu@epsilon:~/cc-workspace/curs-09/ollama$ oc get pods
NAME                      READY   STATUS    RESTARTS   AGE
ollama-76f696875f-6svtp   1/1     Running   0          59s
sergiu@epsilon:~/cc-workspace/curs-09/ollama$ oc get services
NAME     TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)     AGE
ollama   ClusterIP   172.30.141.96   <none>        11434/TCP   5m26s
```

We can now interact with the service by port forwarding it to our local machine and sending a curl to it:
```
sergiu@epsilon:~/cc-workspace/curs-09/ollama$ oc port-forward svc/ollama 11434:11434 &
Forwarding from 127.0.0.1:11434 -> 11434
Forwarding from [::1]:11434 -> 11434
sergiu@epsilon:~/cc-workspace/curs-09/ollama$ curl localhost:11434
Ollama is running
```

We will be interacting with Ollama through the CLI by running commands directly in the container using the command bellow.
```
sergiu@epsilon:~/cc-workspace/curs-09/ollama$ oc exec -it ollama-bb4ff999c-5w9fk -- /bin/bash
groups: cannot find name for group ID 1000800000
1000800000@ollama-bb4ff999c-5w9fk:/$ ollama pull llama3.2:3b
```
The `ollama` command is used inside the pod to pull a model as follows:
```
1000800000@ollama-bb4ff999c-5w9fk:/$ ollama pull llama3.2:3b
pulling manifest
<...>
verifying sha256 digest
writing manifest
success
1000800000@ollama-bb4ff999c-5w9fk:/$ ollama list
NAME           ID              SIZE      MODIFIED
llama3.2:3b    a80c4f17acd5    2.0 GB    15 minutes ago
```

We used the `ollama list` command above to see how much disk our model is using.

While we can interact with Ollama, we want to use a GUI application to make it easier to run queries and to offer the application to other users.
We will be using the Open WebUI project which will be configured to connect to the Ollama service configured earlier:
```
sergiu@epsilon:~/cc-workspace/curs-09/ollama$ cat open-webui.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: open-webui
spec:
  replicas: 1
  selector:
    matchLabels:
      app: open-webui
  template:
    metadata:
      labels:
        app: open-webui
    spec:
      containers:
      - name: open-webui
        image: ghcr.io/open-webui/open-webui:main
        ports:
        - containerPort: 8080
        env:
        - name: OLLAMA_BASE_URL
          value: "http://ollama:11434"
        - name: WEBUI_SECRET_KEY
          value: "your-secret-key"
        volumeMounts:
        - name: webui-data
          mountPath: /app/backend/data
      volumes:
      - name: webui-data
        emptyDir: {}
      restartPolicy: Always
---
apiVersion: v1
kind: Service
metadata:
  name: open-webui
spec:
  ports:
  - protocol: TCP
    port: 8080
    targetPort: 8080
  selector:
    app: open-webui
sergiu@epsilon:~/cc-workspace/curs-09/ollama$ oc apply -f open-webui.yaml
deployment.apps/open-webui created
service/open-webui created
sergiu@epsilon:~/cc-workspace/curs-09/ollama$ oc get deployment
NAME         READY   UP-TO-DATE   AVAILABLE   AGE
ollama       1/1     1            1           30m
open-webui   1/1     1            1           118s
sergiu@epsilon:~/cc-workspace/curs-09/ollama$ oc get pods
NAME                          READY   STATUS    RESTARTS   AGE
ollama-bb4ff999c-5w9fk        1/1     Running   0          27m
open-webui-7584f79cb6-wdqqz   1/1     Running   0          2m2s
```

To connect from the outside world to our OpenWebUI we can create a route, which can be accessed externally.
An OpenShift route works like a Ingress in regular Kubernetes, it creates a HTTP ingress point which will redirect traffic from the router to a selected service.
We will be creating the following route:
```
sergiu@epsilon:~/cc-workspace/curs-09/ollama$ oc create route edge --service open-webui
route.route.openshift.io/open-webui created
sergiu@epsilon:~/cc-workspace/curs-09/ollama$ oc get routes.route.openshift.io open-webui -o json | jq -r '.spec.host' | sed 's/^/https:\/\//'
https://open-webui-sergiu-weisz-prj.apps.ocp-demo.grid.pub.ro
```

The last command gives us the link which from which we can access the Open WebUI.
Configure the connection and try it out!

### DIY: DeepSeek R1 7b

After testing the Open WebIO, download the DeepSeek R1 7b quantized model for ollama.
You can search the Ollama library for it: https://ollama.com/library

You can download the model using the same command as above. You do not need to create a new deployment.

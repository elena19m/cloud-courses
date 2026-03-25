Create a local Kubernetes cluster using the `kind create cluster` command:

```shell-session
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
:::note
It is recommended that you use port-forwarding instead of X11 forwarding to interact with the UI.
:::

## What is Helm?

Package managers are tools used to help with the installation and management of software packages and dependencies. Linux, depending on the installed distribution, has `apt` (Ubuntu & Debian), `dnf` (Fedora, Redhat & CentOS) or `pacman` (Arch). Even for programming languages we use package managers to install libraries, such as `pip` for Python or `npm` for JavaScript.

Kubernetes has its own package manager called Helm. Helm simplifies the deployment and management of applications inside a Kubernetes cluster by packaging them in **charts**, which are reusable, configurable and versioned templates.

### Artifact Hub

[Artifact Hub](https://artifacthub.io/) is a centralized platform for discovering and sharing Kubernetes packages, including Helm charts, operators, and plugins.
It allows users to explore and install Helm charts from various repositories, simplifying application deployment.
Helm can connect to Artifact Hub by adding repositories listed there using `helm repo add`, making chart management more accessible.

### Installing Helm

Helm is already installed on our VMs. Use `helm version` to check that the tool was successfully installed:

```shell-session
student@lab-helm:~$ helm version
version.BuildInfo{Version:"v4.1.0", GitCommit:"4553a0a96e5205595079b6757236cc6f969ed1b9", GitTreeState:"clean", GoVersion:"go1.25.6", KubeClientVersion:"v1.35"}
```

:::note
If you want to install Helm on your computers, follow the installation link from [here](https://helm.sh/docs/intro/install/).
:::

:::note
Helm offers a [cheat sheet](https://helm.sh/docs/intro/cheatsheet/) with the basic commands necessary to manage an application.
:::

## Intro to Helm

### Charts

:::warning
Throughout all the examples and exercises, please be careful to **follow the instructions** the charts give you at the end of their installation.
:::

The packaging format used by Helm is called **chart**. A chart is a collection of files describing a set of Kubernetes resources.
One chart can package a simple resource, like a pod, or complex resources, like entire applications.

### CRDs - Custom Resource Definitions

CRDs are extensions of the Kubernetes API that allow users to define their own resources.
We can use CRDs to define new types of data or libraries and interact with them directly using `kubectl`.
More details about CRDs can be found [here](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/).

### Chart vs Deployment

A Kubernetes **Deployment** is a resource that manages the lifecycle of a set of pods.

A **chart** is a collection of files called **templates** that can include multiple Kubernetes resources (i.e. Deployments, Services, ConfigMaps etc.).

In the following example we will deploy Elastic using the two methods - using the Elastic operator and using the Elastic Helm chart.

#### Elastic Kubernetes Deployment

Firstly, we install the custom resource definition for Elastic using `create`:

```shell-session
student@lab-helm:~$ kubectl create -f https://download.elastic.co/downloads/eck/2.16.1/crds.yaml
customresourcedefinition.apiextensions.k8s.io/agents.agent.k8s.elastic.co created
customresourcedefinition.apiextensions.k8s.io/apmservers.apm.k8s.elastic.co created
customresourcedefinition.apiextensions.k8s.io/beats.beat.k8s.elastic.co created
customresourcedefinition.apiextensions.k8s.io/elasticmapsservers.maps.k8s.elastic.co created
customresourcedefinition.apiextensions.k8s.io/elasticsearches.elasticsearch.k8s.elastic.co created
customresourcedefinition.apiextensions.k8s.io/enterprisesearches.enterprisesearch.k8s.elastic.co created
customresourcedefinition.apiextensions.k8s.io/kibanas.kibana.k8s.elastic.co created
customresourcedefinition.apiextensions.k8s.io/logstashes.logstash.k8s.elastic.co created
```
Afterwards, we install the Elastic operator using `apply`:

```shell-session
student@lab-helm:~$ kubectl apply -f https://download.elastic.co/downloads/eck/2.16.1/operator.yaml
Warning: resource namespaces/elastic-system is missing the kubectl.kubernetes.io/last-applied-configuration annotation which is required by kubectl apply. kubectl apply should only be used on resources created declaratively by either kubectl create --save-config or kubectl apply. The missing annotation will be patched automatically.
namespace/elastic-system configured
serviceaccount/elastic-operator created
secret/elastic-webhook-server-cert created
configmap/elastic-operator created
clusterrole.rbac.authorization.k8s.io/elastic-operator created
clusterrole.rbac.authorization.k8s.io/elastic-operator-view created
clusterrole.rbac.authorization.k8s.io/elastic-operator-edit created
clusterrolebinding.rbac.authorization.k8s.io/elastic-operator created
service/elastic-webhook-server created
statefulset.apps/elastic-operator created
validatingwebhookconfiguration.admissionregistration.k8s.io/elastic-webhook.k8s.elastic.co created
```

Afterwards, we can monitor the operator's setup from its logs, using `logs`:

```shell-session
student@lab-helm:~$ kubectl -n elastic-system logs -f statefulset.apps/elastic-operator
```
We can check that the operator is ready by using `get` and checking that the operator pod is `Running`:

```shell-session
student@lab-helm:~$ kubectl get -n elastic-system pods
NAME                 READY   STATUS    RESTARTS   AGE
elastic-operator-0   1/1     Running   0          3m51s
```

:::note
Run `delete` to remove all the Elastic resources.

```shell-session
student@lab-helm:~$ kubectl delete -f https://download.elastic.co/downloads/eck/2.16.1/operator.yaml
student@lab-helm:~$ kubectl delete -f https://download.elastic.co/downloads/eck/2.16.1/crds.yaml
```
:::

#### Elastic Helm Chart

Now we will deploy Elastic using Helm.
Firstly, we will add the Elastic Helm repository to the package sources, and update the tool.

```shell-session
student@lab-helm:~$ helm repo add elastic https://helm.elastic.co
student@lab-helm:~$ helm repo update
student@lab-helm:~$ helm repo list
NAME    	URL
headlamp	https://kubernetes-sigs.github.io/headlamp/
elastic 	https://helm.elastic.co
```

Then we will use `helm install` to install the Elastic chart:

```shell-session
student@lab-helm:~$ helm install elastic-operator elastic/eck-operator -n elastic-system --create-namespace
NAME: elastic-operator
LAST DEPLOYED: Mon Mar 17 21:27:22 2025
NAMESPACE: elastic-system
STATUS: deployed
REVISION: 1
TEST SUITE: None
NOTES:
1. Inspect the operator logs by running the following command:
   kubectl logs -n elastic-system sts/elastic-operator
```

And we will check that the operator is running by looking at its logs, using `kubectl logs`:

```shell-session
student@lab-helm:~$ kubectl logs -n elastic-system sts/elastic-operator
{"log.level":"info","@timestamp":"2025-03-17T21:27:24.304Z","log.logger":"manager","message":"maxprocs: Updating GOMAXPROCS=1: determined from CPU quota","service.version":"2.16.1+1f74bdd9","service.type":"eck","ecs.version":"1.4.0"}
{"log.level":"info","@timestamp":"2025-03-17T21:27:24.304Z","log.logger":"manager","message":"Setting default container registry","service.version":"2.16.1+1f74bdd9","service.type":"eck","ecs.version":"1.4.0","container_registry":"docker.elastic.co"}

[...]

{"log.level":"info","@timestamp":"2025-03-17T21:27:35.818Z","log.logger":"resource-reporter","message":"Created resource successfully","service.version":"2.16.1+1f74bdd9","service.type":"eck","ecs.version":"1.4.0","kind":"ConfigMap","namespace":"elastic-system","name":"elastic-licensing"}
{"log.level":"info","@timestamp":"2025-03-17T21:27:35.820Z","log.logger":"manager","message":"Orphan secrets garbage collection complete","service.version":"2.16.1+1f74bdd9","service.type":"eck","ecs.version":"1.4.0"}
```

As we can see, the Elastic operator is running, something that can be seen using `kubectl get pods` as well:

```shell-session
student@lab-helm:~$ kubectl get pods -n elastic-system
NAME                 READY   STATUS    RESTARTS   AGE
elastic-operator-0   1/1     Running   0          3m44s
```

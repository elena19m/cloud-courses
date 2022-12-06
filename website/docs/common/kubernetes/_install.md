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

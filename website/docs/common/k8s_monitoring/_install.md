## Scenario

The purpose of this lab is to explore monitoring options for an application deployed in Kubernetes.
For this:
  * we will see how an application must be prepared in order to be ready for monitoring
  * deploy Prometheus for gathering application metrics
  * deploy Grafana and create a dashboard for displaying metrics in a graphical format

## Creating a Kubernetes cluster

Similar to the previous Kubernetes lab, deploy a single-node cluster, using Kind.

:::note
See the required steps in the Kubernetes lab [here](https://scgc.pages.upb.ro/cloud-courses/docs/management/kubernetes#creating-a-kubernetes-cluster).
:::

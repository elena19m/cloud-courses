## Prometheus

### Monitoring namespace

Prometheus must be deployed in a separate Kubernetes namespace, called **monitoring**. This namespace does not exist, so you must create it.

:::tip
Review the steps for creating a new namespace in the Kubernetes lab [here](https://scgc.pages.upb.ro/cloud-courses/docs/management/kubernetes#creating-a-new-namespace).
:::

### Deploying Prometheus

Deploy Prometheus using Helm, following the instructions from here: https://github.com/prometheus-community/helm-charts/tree/main/charts/prometheus

:::danger
**Attention:** Make sure to deploy the helm chart to the **monitoring** namespace.
:::

After the helm chart is deployed, use [`kubectl port-forward`](https://kubernetes.io/docs/tasks/access-application-cluster/port-forward-access-application-cluster/) to forward the port of the **prometheus-server** service to your VM.

Connect to the Prometheus UI using a browser. 

:::tip
See https://scgc.pages.upb.ro/cloud-courses/docs/basic/working_with_openstack#connecting-using-an-ssh-jump-host-proxy and use `-D 12345` instead of `-X` for starting a Socks proxy towards your VM. Then, configure a local browser to use `localhost:12345` as a Socks Proxy.
:::

### Configuring Prometheus

Configure Prometheus to monitor metrics exposed by **promexporter** in the **default** namespace. There are two different ways to do that. You can choose any method you want:
  * Customize `values.yaml` and redeploy the helm chart (see the **Configuration** section in https://github.com/prometheus-community/helm-charts/blob/main/charts/prometheus/README.md)
  * Directly edit the **prometheus-server** configmap (an example can be found here: https://sysdig.com/blog/kubernetes-monitoring-prometheus/)

:::tip
You will have to use the FQDN for specifying the hostname that Prometheus must monitor: `promexporter.default.svc.cluster.local:9113`
:::

### Prometheus queries

Confirm that the configuration is successful by accessing **/targets** in your browser. Also, go to **Graph** and query a metric, like `nginx_connections_accepted`. Perform requests on the nginx server and verify that the graph is updating.

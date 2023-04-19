### Grafana

#### Deploying Grafana

Deploy Grafana using Helm, following the instructions from here: https://docs.bitnami.com/kubernetes/infrastructure/grafana/get-started/install/

:::danger
**Attention:** Make sure to deploy the helm chart to the **monitoring** namespace.
:::

After the helm chart is deployed, use [`kubectl port-forward`](https://kubernetes.io/docs/tasks/access-application-cluster/port-forward-access-application-cluster/) to forward the port of the **grafana** service to your VM.

Connect to the Grafana UI using a browser. 

:::tip
See https://scgc.pages.upb.ro/cloud-courses/docs/basic/working_with_openstack#connecting-using-an-ssh-jump-host-proxy and use `-D 12345` instead of `-X` for starting a Socks proxy towards your VM. Then, configure a local browser to use `localhost:12345` as a Socks Proxy.
:::

#### Configuring Grafana

In the Grafana UI, configure a Prometheus data source, specifying the URL of the Prometheus server deployed in the same namespace.

:::tip
The URL should be `http://prometheus-server`.
:::

Import the Grafana dashboard provided by nginx-prometheus-exporter, by following the instructions from here: https://github.com/nginxinc/nginx-prometheus-exporter/tree/main/grafana

#### Using Grafana

Perform requests on the nginx server and verify that the dashboard is updating.

### Deploying the Prometheus exporter

The metrics exposed by nginx via the **stub_status** module are not compatible with Prometheus. To be able to use Prometheus for monitoring, we must use a prometheus exporter, which is a simple application that reads metrics and translates them to the prometheus format.

For nginx, a popular prometheus exporter is **nginx-prometheus-exporter**: https://github.com/nginxinc/nginx-prometheus-exporter

Deploy nginx-prometheus-exporter in the Kubernetes cluster, using a Kubernetes deployment. Take a look at the `docker run` command from the [`README.md`](https://github.com/nginxinc/nginx-prometheus-exporter/blob/main/README.md) file to figure out how you should configure your deployment.

:::tip
You should add the `-nginx.scrape-uri` command-line argument to the container.

Use [`args`](https://kubernetes.io/docs/tasks/inject-data-application/define-command-argument-container/) for configuring command-line arguments.
:::

:::tip
The URL that will be monitored should be `http://nginx:8080/metrics`
:::

### Exposing the Prometheus exporter as a service

Expose **nginx-prometheus-exporter** via a new Kubernetes service, on port **9113** inside the cluster. The service will be named **promexporter**.

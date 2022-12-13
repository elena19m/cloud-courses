## Deploying the Nginx service

Similar to the Kubernetes lab, deploy an nginx service that will be exposed on port **80** inside the cluster and port **30080** outside the cluster. The service will be named `nginx`.

You can choose the content that is served (`index.html`) at your discretion.

:::tip
Review the steps from the Kubernetes lab on how to start an nginx service with persistence [here](https://scgc.pages.upb.ro/cloud-courses/docs/management/kubernetes#persistent-storage).
:::

### Exposing the metrics endpoint

The nginx server will have to provide metrics about itself, on port **8080**, location `/metrics`. Use the `stub_status` module: http://nginx.org/en/docs/http/ngx_http_stub_status_module.html

:::tip
You will have to add an additional **server** code block in the nginx config. Review the steps for creating a custom nginx config in the Kubernetes lab [here](https://scgc.pages.upb.ro/cloud-courses/docs/management/kubernetes#communicating-between-apps).
:::

:::danger
**Attention:** You must serve the metrics on port **8080**, not on the same port **80** as the html content!
:::

### Updating the service

Expose the metrics endpoint via the same **nginx** Kubernetes service, on port **8080** inside the cluster and port **30088** outside the cluster.

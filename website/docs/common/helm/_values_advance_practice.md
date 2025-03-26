### Exercise: Nginx Advanced Deployment

Create a new Helm chart using `helm create nginx-advance`.
This will create an example Nginx template starting from which you will have to do the following:
1. Create a ConfigMap for your Nginx chart (you should create it in `~/nginx-advanced/templates`) that can be used to configure `index.html`.
You can follow the example:

```shell-session
apiVersion: v1
kind: ConfigMap
metadata:
  name: nginx-configmap
data:
  index.html: |
    <h1>Hello, World!</h1>
```

2. Update the values file (found in `~/nginx-advance/values.yaml`) to add the `volume` and `volumeMount` you have created with the ConfigMap.
The `mountPath` is **/usr/share/nginx/html**.
Follow this template:

```shell-session
# Additional volumes on the output Deployment definition.
volumes:
  - name: [volume-name]
    configMap:
      name: [ConfigMap-name]

volumeMounts:
  - name: [volume-name]
    mountPath: /usr/share/nginx/html
```

3. Deploy the chart and check the landing page and follow the steps given at the end of the deployment to setup the port-forwarding for the server.

```shell-session
student@lab-helm:~$ helm install nginx-chart ./nginx-advance

[...]

1. Get the application URL by running these commands:
  export POD_NAME=$(kubectl get pods --namespace default -l "app.kubernetes.io/name=harder-chart,app.kubernetes.io/instance=harder" -o jsonpath="{.items[0].metadata.name}")
  export CONTAINER_PORT=$(kubectl get pod --namespace default $POD_NAME -o jsonpath="{.spec.containers[0].ports[0].containerPort}")
  echo "Visit http://127.0.0.1:8080 to use your application"
  kubectl --namespace default port-forward $POD_NAME 8080:$CONTAINER_PORT
```

:::note
You can run `kubectl --namespace default port-forward $POD_NAME 8080:$CONTAINER_PORT &` to have the port-forwarding running in the background, but you will have to manually stop it by using `ps aux | grep kubectl` to get its PID and running `kill -9 PID`.
:::

:::note
Run the same commands everytime you update the chart.
:::

4. Update the chart so that the content of the Nginx server html pages is parameterized (can be set using values).
The parameter will have the following name: `pageContent.indexPage`.
To redeploy the chart you can use `helm update`:

```shell-session
student@lab-helm:~$ helm updgrade nginx-chart ./nginx-advance
Release "nginx-chart" has been upgraded. Happy Helming!
NAME: nginx-chart
LAST DEPLOYED: Thu Mar 20 20:20:32 2025
NAMESPACE: default
STATUS: deployed
REVISION: 5
NOTES:
1. Get the application URL by running these commands:
  export POD_NAME=$(kubectl get pods --namespace default -l "app.kubernetes.io/name=nginx-advance,app.kubernetes.io/instance=nginx-chart" -o jsonpath="{.items[0].metadata.name}")
  export CONTAINER_PORT=$(kubectl get pod --namespace default $POD_NAME -o jsonpath="{.spec.containers[0].ports[0].containerPort}")
  echo "Visit http://127.0.0.1:8080 to use your application"
  kubectl --namespace default port-forward $POD_NAME 8080:$CONTAINER_PORT 
```

5. Add another page in the ConfigMap that is added only when a condition is **true**.
The name and contents of the page are up to you (it is **html** so have fun with it), but it should be parameterized (similar to `index.html`).
Test your chart by running it and accessing the pages (**index.html** is accessed by going to **http://localhost:8080**, and other pages are accessed by going to **http://localhost:8080/[page-name].html**) 

### Exercise: Customize Podinfo

1. Starting from the previous Podinfo Helm deployment, use `--set` to manually configure the `replicaCount` to `5` and the UI message (the parameter is `ui.message`) from the home page to a custom one.
2. Now do the same, but this time use a values file.

:::note
You can check the `replicaCount` by using `kubectl describe deployment -n [my-podinfo-namespace] [my-podinfo-deployment-name]`.
You can check the UI message using `curl` as well: `curl localhost:8080` (after running the `kubectl port-forward` command).
:::

:::important
Once you are done, uninstall the chart to not overload the resources on your virtual machine.
You can do this by using `helm list -A` to get the namespace and name of the installed chart, and `helm uninstall -n <namespace> <chart_name>` to uninstall the chart.
:::

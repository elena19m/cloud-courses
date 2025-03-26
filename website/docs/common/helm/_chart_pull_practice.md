### Exercise: Deploy Podinfo

1. Deploy [Podinfo](https://github.com/stefanprodan/podinfo) using Helm and access its frontend to test your deployment.
Use the `ghcr.io` install.

:::note
Run the `kubectl` command the deployment tells you to run to expose the service and make it accessible from outside the cluster.
:::

:::note
To access the frontend for podinfo, connect to the OpenStack VM using `-L [local-port]:localhost:8080`.

```shell-session
# Forward local port 1080 to the port that you forward Kubernetes service to.
student@local-machine:~$ ssh -J fep -L 1080:localhost:8080 student@[ip_vm] 
```

If you have issues accessing the Podinfo frontend from Firefox, try a different browser.
:::

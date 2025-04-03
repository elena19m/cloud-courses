## Containerize and deploy a Java app to Azure

**Follow this tutorial - [Containerize and deploy a Java app to Azure](https://learn.microsoft.com/en-us/training/modules/containerize-deploy-java-app-aks/)** - to containerize and deploy a Java app to Azure using the Azure CLI.

:::tip
To forward the port of the OpenStack VM to your local machine, you can use a jump host and port forwarding SSH command. This will allow you access `http://localhost:8080` from your local machine.

You have to configure the SSH jump host `fep` in your `~/.ssh/config` file as explained [in this tutorial](https://cloud-courses.upb.ro/docs/basic/working_with_openstack/#permanent-ssh-configurations).

```shell
ssh -J fep -L 8080:127.0.0.1:8080 -i ~/.ssh/id_fep student@10.9.X.Y
```
:::

:::info
You can either work in the [Azure Cloud Shell](https://portal.azure.com/#cloudshell/) where `az` is installed or use the `az` in the OpenStack VM.

This tutorial is meant to be run in OpenStack VM because it requires `docker` installed.
:::

## Deploy a containerized application on Azure Kubernetes Service

**Follow the following tutorial - [Deploy a containerized application on Azure Kubernetes Service](https://learn.microsoft.com/en-us/training/modules/aks-deploy-container-app/)** - to deploy a containerized application on Azure Kubernetes Service (AKS) using the Azure CLI.

:::tip
You can run commands in the background by adding `&` at the end of the command. Use `nohup` and redirect the output to a file if you want to run the command in the background and keep it running even after you log out of the shell.

```bash
nohup az aks create --resource-group myResourceGroup --name myAKSCluster --node-count 1 --enable-addons monitoring --generate-ssh-keys > aks_create.log 2>&1 &
```
:::

:::info
You can either work in the [Azure Cloud Shell](https://portal.azure.com/#cloudshell/) where `az` is installed or use the `az` in the OpenStack VM.
:::

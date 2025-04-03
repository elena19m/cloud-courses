## Deploy a containerized application on Azure Kubernetes Service

**Follow the following tutorial - [Deploy a containerized application on Azure Kubernetes Service](https://learn.microsoft.com/en-us/training/modules/aks-deploy-container-app/)** - to deploy a containerized application on Azure Kubernetes Service (AKS) using the Azure CLI.

:::tip
You can run commands in the background by adding `&` at the end of the command. Use `nohup` and redirect the output to a file if you want to run the command in the background and keep it running even after you log out of the shell.

```bash
nohup az aks create ...... > aks_create.log 2>&1 &
```
:::

:::info
You can either work in the [Azure Cloud Shell](https://portal.azure.com/#cloudshell/) where `az` is installed or use the `az` in the OpenStack VM.

This tutorial is meant to be run in [Azure Cloud Shell](https://portal.azure.com/#cloudshell/).
:::

### AKS resource provider registration

If you are receiving an error with this message `The subscription is not registered to use namespace 'Microsoft.ContainerService'`, it means that the Azure Resource Provider responsible for AKS (Azure Kubernetes Service) is not registered in your subscription.

To resolve this, run:

```shell
az provider register --namespace Microsoft.ContainerService
```

Check the [Troubleshooting Documentation for more details](https://learn.microsoft.com/en-us/azure/azure-resource-manager/troubleshooting/error-register-resource-provider?tabs=azure-cli#solution).

### List Azure regions

To list available regions:

```shell
az account list-locations --query "[].{Region: name}" -o table
```

### AKS Quotas

Quotas are limits on the number of resources you can create in your Azure subscription. The quotas for AKS are based on the region where you create the AKS cluster and the type of resources you use.
You can check your quotas in the [Azure portal](https://portal.azure.com/) search for `Quotas` and select `Compute`. For an Education subscription, the quotas are usually set to 4 cores per VM family per region. This means you can use a maximum of 4 cores (vCPUs) for each VM family in the region where you create the AKS cluster.

By default, the AKS cluster is created with a default node pool using the `Standard_DS2_v2` VM size and 3 nodes.

To create a cluster with a different VM size, you can use the `--node-vm-size` parameter. The VM size can be consulted [here](https://learn.microsoft.com/en-us/azure/virtual-machines/sizes).

To change the number of nodes in the default node pool, you can use the `--node-count` parameter.

The command `az aks create` creates an Azure Kubernetes Service (AKS) cluster:
- `--resource-group`: The name of the resource group that contains the AKS cluster.
- `--name`: The name of the AKS cluster.
- `--node-count`: The number of nodes in the default node pool.
- `--node-vm-size`: The size of the VMs in the default node pool.

```shell
az aks create \
    --resource-group $RESOURCE_GROUP \
    --name $CLUSTER_NAME \
    --node-count 1 \
    --generate-ssh-keys \
    --node-vm-size Standard_B2s \
    --network-plugin azure
```

The command `az aks nodepool add` creates a new node pool in an existing AKS cluster:
- `--resource-group`: The name of the resource group that contains the AKS cluster.
- `--cluster-name`: The name of the AKS cluster.
- `--name`: The name of the new node pool.
- `--node-count`: The number of nodes in the new node pool.
- `--node-vm-size`: The size of the VMs in the new node pool.

```shell
az aks nodepool add \
    --resource-group $RESOURCE_GROUP \
    --cluster-name $CLUSTER_NAME \
    --name userpool \
    --node-count 2 \
    --node-vm-size Standard_B1s
```


To list the node pools in an AKS cluster, you can use the `az aks nodepool list` command:

```shell
az aks nodepool list \
    --resource-group $RESOURCE_GROUP  \
    --cluster-name $CLUSTER_NAME  \
    --query "[].{name:name, vmSize:vmSize, nodeCount:count}" -o table
```

To delete an AKS cluster, you can use the `az aks delete` command:

```shell
az aks delete \
    --resource-group $RESOURCE_GROUP \
    --name $CLUSTER_NAME \
    --yes \
    --no-wait
```

## Creating a Kubernetes cluster

As in the previous laboratories, we will create a cluster on the lab machine, using the `kind create cluster` command:

```shell-session
student@lab-storage:~$ kind create cluster --config kind-config.yaml
Creating cluster "cc-storage" ...
 ✓ Ensuring node image (kindest/node:v1.34.0) 🖼
 ✓ Preparing nodes 📦 📦  
 ✓ Writing configuration 📜 
 ✓ Starting control-plane 🕹️ 
 ✓ Installing CNI 🔌 
 ✓ Installing StorageClass 💾 
 ✓ Joining worker nodes 🚜 
Set kubectl context to "kind-cc-storage"
You can now use your cluster with:

kubectl cluster-info --context kind-cc-storage

Have a nice day! 👋
```

:::note
It is recommended that you use port-forwarding instead of X11 forwarding to interact with the UI.
:::

## Storage in Cloud

Storage is a critical part of any cloud application. This data can be anything from user-generated content, application logs, backups, or even machine learning models. 
Because an application is running in the cloud, it needs a way to access storage that is not tied to a specific machine or location. This is where cloud storage comes in.

Requirements for cloud storage include:

- **Accessibility**: Data should be easily accessible from anywhere, through APIs or other interfaces.
- **Performance**: Cloud storage should provide low latency and high throughput for data access.
- **Scalability**: The ability to handle increasing amounts of data without performance degradation.
- **Durability**: Ensuring that data is not lost and can be retrieved reliably (e.g., through replication).

### On-Premises vs Cloud Storage

The need for a storage solution for a cloud application is obvious but leaves the question of why not deploying it on-premises.

On-premises storage refers to storage solutions that are physically located within an organization's premises, such as local hard drives or network-attached storage (NAS). In contrast, cloud storage is provided by third-party providers and accessed over the internet.

|    | **On-Premises Storage** | **Cloud Storage** |
|----|-------------------------|-------------------|
| **Cost** | High upfront costs, ongoing maintenance | Pay-as-you-go for storage and usage |
| **Performance** | Limited by local hardware and network | High performance with optimized infrastructure |
| **Scalability** | Limited, requires manual intervention | can grow with demand |
| **Durability** | Prone to failure, requires backups | High durability, often with replication |

:::note
As a rough baseline, standard object storage costs approximately **$0.02–0.025 per GB/month** across providers (AWS, Azure, GCP), making them broadly comparable for storage alone. The real cost differences emerge from read/write operations and how tightly a workload is coupled to provider-specific features.
:::

### Providers

- **AWS S3** - The most widely adopted object storage service, with the richest ecosystem of integrations and tooling
- **GCP Cloud Storage** - Tight integration with Google's data and ML services (**BigQuery**, **Dataflow**, **Vertex AI**)
- **Azure Blob Storage** - Best fit for organizations already in the Microsoft ecosystem (**Active Directory**, **Office 365**)

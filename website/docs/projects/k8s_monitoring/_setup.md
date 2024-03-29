### Setup

We will be using a virtual machine in the [faculty's cloud](http://cloud.grid.pub.ro/).

When creating a virtual machine in the Launch Instance window:
  * Set the following **Instance Name**: `HW-<Your LDAP username>` (e.g., `HW-anamaria.popescu`).
  * Select **Boot from image** in **Instance Boot Source** section
  * Select **SCGC Template** in **Image Name** section
  * Select the **m1.large** flavor.

:::warning

You are allowed to create only one virtual machine. If you want to test/redo your homework,
please delete and rebuild the virtual machine.

The VMs that will not follow the requirements above will be deleted.
:::

We will be using the same resources as in the Kubernetes lab, as this project is based upon it.

In the base virtual machine:
  * Download the laboratory archive from [here](https://repository.grid.pub.ro/cs/scgc/laboratoare/lab-kubernetes.zip) in the `work` directory.
Use: `wget https://repository.grid.pub.ro/cs/scgc/laboratoare/lab-kubernetes.zip` to download the archive.
  * Extract the archive.
  * Start the virtual machines using `bash runvm.sh`.
  * The username for connecting to the nested VMs is `student` and the password is `student`.

```bash
$ # change the working dir
$ cd ~/work
$ # download the archive
$ wget https://repository.grid.pub.ro/cs/scgc/laboratoare/lab-kubernetes.zip
$ unzip lab-kubernetes.zip
$ # start VMs; it may take a while
$ bash runvm.sh
$ # check if the VMs booted
$ virsh net-dhcp-leases labvms
```

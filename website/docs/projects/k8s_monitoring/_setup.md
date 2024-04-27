### Setup

We will be using a virtual machine in the [faculty's cloud](http://cloud.grid.pub.ro/).

When creating a virtual machine in the Launch Instance window:
  * Set the following **Instance Name**: `HW-<Your LDAP username>` (e.g., `HW-anamaria.popescu`).
  * Select **Boot from image** in **Instance Boot Source** section
  * Select **SCGC Template** in **Image Name** section
  * Select the **m1.scgc** flavor.

:::warning

You are allowed to create only one virtual machine. If you want to test/redo your homework,
please delete and rebuild the virtual machine.

The VMs that do not follow the requirements above will be deleted. Make sure
to use the correct values, as they may differ from those used in labs.

We recommend to periodically create local backups for all configuration files,
to make sure you are not losing your work in case the virtual machine is
corrupted or deleted by mistake.
:::

In the base virtual machine:
  * Download the archive from [here](https://repository.grid.pub.ro/cs/scgc/laboratoare/homework-project.zip) in the `work` directory.
Use: `wget https://repository.grid.pub.ro/cs/scgc/laboratoare/homework-project.zip` to download the archive.
  * Extract the archive.
  * Start the virtual machines using `bash runvm.sh`.
  * The username for connecting to the nested VMs is `student` and the password is `student`.

```bash
$ # change the working dir
$ cd ~/work
$ # download the archive
$ wget https://repository.grid.pub.ro/cs/scgc/laboratoare/homework-project.zip
$ unzip homework-project.zip
$ # start VMs; it may take a while
$ bash runvm.sh
$ # check if the VMs booted
$ virsh net-dhcp-leases labvms
```

:::note
The `runvm.sh` script increases the virtual machine's disk size to 16GB, but the
partition and filesystem inside the virtual machine are **not** automatically
resized. You must resize the virtual machine's disk manually using the following
commands:

```bash
# Resize disk and filesystem
student@lab-kubernetes:~$ sudo growpart /dev/sda 2
student@lab-kubernetes:~$ sudo resize2fs /dev/sda2
# Check that the filesystem is correctly resized
student@lab-kubernetes:~$ df -h | grep /dev/sda2
/dev/sda2        16G  3.4G   12G  23% /
```
:::

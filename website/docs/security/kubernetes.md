---
sidebar_position: 5
---

# Container orchestration with Kubernetes
## Setup

We will be using a virtual machine in the [faculty's cloud](http://cloud.grid.pub.ro/).

When creating a virtual machine in the Launch Instance window:
  * Select **Boot from image** in **Instance Boot Source** section
  * Select **SCGC Template 2021** in **Image Name** section
  * Select the **m1.large** flavor.

In the base virtual machine:
  * Download the laboratory archive from [here](https://repository.grid.pub.ro/cs/scgc/laboratoare/lab-kubernetes.zip) in the `work` directory.
Use: `wget --user=user-curs --ask-password https://repository.grid.pub.ro/cs/scgc/laboratoare/lab-kubernetes.zip` to download the archive.
Replace `user-curs` with your LDAP username. The password is your LDAP password.
  * Extract the archive.
  * Download the `runvm.sh` script.
The `.qcow2` files will be used to start virtual machines using the `runvm.sh` script.
  * Start the virtual machines using `bash runvm.sh`.
  * The username for connecting to the nested VMs is `student` and the password is `student`.

```bash
$ # change the working dir
$ cd ~/work
$ # download the archive; replace user-curs with your LDAP username
$ wget --user=user-curs --ask-password https://repository.grid.pub.ro/cs/scgc/laboratoare/lab-kubernetes.zip
$ unzip lab-kubernetes.zip
$ # start VMs; it may take a while
$ bash runvm.sh
$ # check if the VMs booted
$ virsh net-dhcp-leases labvms
```

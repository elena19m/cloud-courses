## Setup

We will be using a virtual machine in the [faculty's cloud](http://cloud.grid.pub.ro/).

When creating a virtual machine in the Launch Instance window:
  * Select **Boot from image** in **Instance Boot Source** section
  * Select **SCGC Template** in **Image Name** section
  * Select the **m1.large** flavor.

In the base virtual machine:
  * Download the laboratory archive from [here](https://repository.grid.pub.ro/cs/scgc/laboratoare/lab-ldap.zip) in the `work` directory.
Use: `wget https://repository.grid.pub.ro/cs/scgc/laboratoare/lab-ldap.zip` to download the archive.

  * Extract the archive.
The `.qcow2` files will be used to start virtual machines using the `runvm.sh` script.
  * Start the virtual machines using `bash runvm.sh`.
  * The username for connecting to the nested VMs is `student` and the password is `student`.

```bash
$ # change the working dir
$ cd ~/work
$ # download the archive
$ wget https://repository.grid.pub.ro/cs/scgc/laboratoare/lab-ldap.zip
$ unzip lab-ldap.zip
$ # start VMs; it may take a while
$ bash runvm.sh
$ # check if the VMs booted
$ virsh net-dhcp-leases labvms
```


## Installing 389-ds

The most commonly used Lightweight Directory Access Protocol service (LDAP) on
Alma Linux is [389-ds][]. It is the upstream project / free alternative to
the RedHat Directory Server project. In order to set it up, we will need to
install it and all of its dependencies.

The configuration of the directory service will be handled using a `cockpit`
plugin which will need to be installed alongside the other directory server
packages. Cockpit is a web interface that allows you to configure the system
and even run commands on a RedHat-based operating system.

For this lab you will need to install the `389-directory-service` module from
the `@389` group, `cockpit` and some additional packages. You can use the
commands below to install them:

```bash
[student@lab-ldap ~]$ sudo dnf copr enable -y @389ds/389-directory-server
[student@lab-ldap ~]$ sudo dnf install 389-ds-base cockpit cockpit-389-ds
```


## Creating a LDAP instance

To configure an LDAP instance we will use the instructions in the
[RHDS configuration guide][]. For the purposes of this guide, we will use the
command line tools that come with the directory service, since they can also be
used for automating the process.

The `dscreate` tool allows creating an instance either by creating a template
that defines various arguments, and then importing it, or creating it
interactively. To run the configuration tool in interactive mode, run it using
the `interactive` argument, as shown below and then fill the required
parameters.

:::warning
Make sure you use a password that you will remember for the Directory Manager.
You will need it to query the database later.

The password **must not** contain any spaces.
:::

```bash
[student@lab-ldap ~]$ sudo dscreate interactive
Install Directory Server (interactive mode)
===========================================

Enter system's hostname [localhost]: lab-ldap

Enter the instance name [lab-ldap]: lab-ldap

Enter port number [389]: # Press Enter

Create self-signed certificate database [yes]: # Press Enter

Enter secure port number [636]: # Press Enter

Enter Directory Manager DN [cn=Directory Manager]: # Press Enter

Enter the Directory Manager password:   # Enter a password
Confirm the Directory Manager Password: # Re-enter the password

Enter the database suffix (or enter "none" to skip) [dc=lab-ldap]: dc=lab-ldap,dc=scgc,dc=ro

Create sample entries in the suffix [no]: # Press Enter

Create just the top suffix entry [no]: yes

Do you want to start the instance after the installation? [yes]: # Press Enter

Are you ready to install? [no]: yes
Starting installation ...
Validate installation settings ...
Create file system structures ...
Create self-signed certificate database ...
Perform SELinux labeling ...
Create database backend: dc=lab-ldap,dc=scgc,dc=ro ...
Perform post-installation tasks ...
Completed installation for instance: slapd-lab-ldap
```

You can check that the service and the instance are running using the commands
below:

```bash
[student@lab-ldap ~]$ sudo dsctl lab-ldap status
Instance "lab-ldap" is running
[student@lab-ldap ~]$ sudo ss -lntp | egrep '389|636'
LISTEN 0      128                *:636             *:*    users:(("ns-slapd",pid=1214,fd=9))
LISTEN 0      128                *:389             *:*    users:(("ns-slapd",pid=1214,fd=8))
```


## Querying the LDAP server

The directory server can be seen as a database where the data is distributed
in a tree-like (directory) hierarchy. The search base (as well as the database
suffix above) specifies its parameters in reverse order. The `dc=ro` is the
root of the tree, `dc=scgc` is a directory inside the root, `dc=lab-ldap` is a
directory inside `dc=scgc`, and so on.

You can query the LDAP server using the `ldapsearch` command. It connects to
the server and attempts to query its contents using two types of parameters:
 * a search base, specified using the `-b` parameter;
 * a list of attributes of the object.

To extract all the entries in the database that we have created, we can use the
following command:

```bash
[student@lab-ldap ~]$ ldapsearch -x -b 'dc=lab-ldap,dc=scgc,dc=ro'
# extended LDIF
#
# LDAPv3
# base <dc=lab-ldap,dc=scgc,dc=ro> with scope subtree
# filter: (objectclass=*)
# requesting: ALL
#

# lab-ldap.scgc.ro
dn: dc=lab-ldap,dc=scgc,dc=ro
objectClass: top
objectClass: domain
dc: lab-ldap
description: dc=lab-ldap,dc=scgc,dc=ro

# search result
search: 2
result: 0 Success

# numResponses: 2
# numEntries: 1
```

For now we only have the top domain. The search will return more entries as you
follow the lab and create entries.


[389-ds]: https://www.port389.org/index.html
[RHDS configuration guide]: https://access.redhat.com/documentation/en-us/red_hat_directory_server/11/html/installation_guide/assembly_setting-up-a-new-directory-server-instance_installation-guide#proc_creating-an-instance-using-the-interactive-installer_assembly_setting-up-a-new-instance-on-the-command-line-using-the-interactive-installer

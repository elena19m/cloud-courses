## Managing virtual machines with libvirt

The `libvirt` library was created in order to facilitate interactions with
virtual machines and containers. This library exposes a common interface for a
multitude of technologies (e.g., KVM, LXC) and is commonly used by cloud
infrastructure projects such as OpenStack and oVirt.

For system administrators, a command line interface called `virsh` was developed
as a front-end for libvirt.

To use libvirt we need to install the `virtinst`, `libvirt-clients`,
`virt-top`, `virt-viewer`, and `libvirt-daemon-system` packages.

```shell-session
student@lab-virt-host:~/work$ sudo apt install virtinst libvirt-clients virt-top virt-viewer libvirt-daemon-system
```

As a first step, we must enable the networking service provided by libvirt:

```shell-session
student@lab-virt-host:~/work$ sudo virsh -c qemu:///system net-start default
```

:::note
The network is enabled by default on the lab virtual machine since we also use
libvirt to manage the virtual machines in other labs, so you will see some
errors. These may be ignored.

```
error: Failed to start network default
error: Requested operation is not valid: network is already active
```
:::


### Creating a virtual machine in libvirt

The `virt-install` tool can be used to start managing a virtual machine using
libvirt:

```shell-session
student@lab-virt-host:~/work$ sudo virt-install --connect qemu:///system --name VM1 --hvm --ram 512 --disk path=debian-11.qcow2 --network network=default --vnc --noautoconsole --import
WARNING  No operating system detected, VM performance may suffer. Specify an OS with --os-variant for optimal results.

Starting install...
Domain creation completed.
```

The parameters have the following meanings:
  - `--connect qemu:///system` - connect to the system libvirt instance;
  - `--name VM1` - name of the virtual machine, is used by libvirt to identify
the virtual machine for other commands;
  - `--hvm` - use hardware virtualization support;
  - `--ram 512` - amount of RAM;
  - `--disk path=debian-11.qcow2` - disk image to attach;
  - `--network network=default` - use the default network bridge;
  - `--vnc` - export the console using VNC;
  - `--noautoconsole` - do not automatically attach to the console. This is
useful when exporting the console using VNC to daemonize the virtual machine;
  - `--import` - use the `debian-11.qcow2` disk image directly, and do not
attempt to install a system on it.

After running the command mentioned above, a configuration file in the XML
format is created by libvirt in `/etc/libvirt/qemu/VM1.xml`. You can inspect
this file and see how, and what, resources are managed.


### Controlling virtual machines using virsh

We can use the `virsh` console to manage the libvirt virtual machines. Connect
to the local daemon and list the running instances (you can also run the tool in
interactive mode if you do not specify a command):

```shell-session
student@lab-virt-host:~/work$ sudo virsh list
 Id   Name   State
----------------------
 2    VM1    running
```

Notice that the virtual machine has a state (`running`) and an ID (`2`). The
following operations can be issued using either the name, or the virtual
machine's ID.

To connect to the VNC server, we must first identify the VNC port the virtual
machine's server listens on, and then connect to it.

```shell-session
student@lab-virt-host:~/work$ sudo virsh vncdisplay VM1
127.0.0.1:0

student@lab-virt-host:~/work$ vncviewer :0
```

After confirming that the console works, close it. The guest will continue
running in the background.

To stop the virtual machine we can use the `shutdown` command:

```shell-session
student@lab-virt-host:~/work$ sudo virsh shutdown VM1
Domain VM1 is being shutdown

student@lab-virt-host:~/work$ sudo virsh list
 Id   Name   State
--------------------
```

Stopped virtual machines are not displayed in the `list` command by default. You
must add the `--all` parameter to see them:

```shell-session
student@lab-virt-host:~/work$ sudo virsh list --all
 Id   Name   State
-----------------------
 -    VM1    shut off
```

To restart a virtual machine you can use the `start` command:

```shell-session
student@lab-virt-host:~/work$ sudo virsh start VM1
Domain VM1 started

student@lab-virt-host:~/work$ sudo virsh list
 Id   Name   State
----------------------
 3    VM1    running
```

To completely delete the virtual machine, you can use the `undefine` and
`destroy` commands together.

```shell-session
student@lab-virt-host:~/work$ sudo virsh destroy VM1
Domain VM1 destroyed

student@lab-virt-host:~/work$ sudo virsh undefine VM1
Domain VM1 has been undefined
```

Undefined virtual machines will no longer be displayed in the `list` command,
and their configuration XML files are removed.


### Using libvirt as an unprivileged user

Create a new user called `vmanager` and copy the `almalinux-8.qcow2` disk image to
their home directory. Make the required changes so you can run virtual machines
as that user (the user cannot use `sudo` to run libvirt commands).

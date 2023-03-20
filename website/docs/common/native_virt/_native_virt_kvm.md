## Setup

We will be using a virtual machine in the [faculty's cloud](http://cloud.grid.pub.ro/).

When creating a virtual machine in the Launch Instance window:
  * Select **Boot from image** in **Instance Boot Source** section
  * Select **SCGC Template** in **Image Name** section
  * Select the **m1.medium** flavor.

:::info
There will not be a zip archive for this lab. We will work using the existing
virtual machine disk images.
:::


### Preparation - using X11 forwarding
Please make sure to enable X11 forwarding on all SSH connections. Use
the `-X` parameter when running `ssh`.

:::tip
Activating compression for the video stream can improve performance.
You can use compression by also appending the `-C` parameter to the SSH command.
You can get more details in the [Working with OpenStack][] lab.
:::
[Working with OpenStack]: ../../basic/working_with_openstack.md

If you intend to use the `root` account to run the commands in this lab, you
must fetch the `xauth` token created for the `student` user.

```bash
student@lab-virt-host:~$ sudo -i
root@lab-virt-host:~$ xauth merge /home/student/.Xauthority
```


## Managing virtual machines with KVM

Computational centers use virtualization on a large scale since it provides
flexibility in managing compute resources. In order to improve performance in a
virtualised environment, processors have introduced features and specific
instructions that enable guest operating systems to run uninterrupted and
unmodified. The software entity that is responsible with facilitating this type
of interaction between hardware and the guest operating system is called a
hypervisor.

**KVM** stands for "Kernel Virtual Machine" and is a kernel-level hypervisor
that implements native virtualization. In this lab, we will explore using this
virtualization solution to handle various use-cases.

First of all, we must verify that the underlying hardware supports native
virtualization. The virtualization extensions' name depends on the hardware
manufacturer:
  - INTEL: VMX (Virtual Machine eXtensions)
  - AMD: SVM (Secure Virtual Machine)


### Verify that the system supports virtualization

To verify that the processor supports the hardware extensions we can run the
following command:

```bash
student@lab-virt-host:~$ grep vmx /proc/cpuinfo
flags           : fpu vme [...] vmx ssse3 [...]
```

The `flags` section must include `vmx` on Intel systems, or `svm` on AMD systems
to be able to fully take advantage of virtualization.

To use KVM we need to install the `qemu-kvm` package that contains the `qemu`
userspace tool. `qemu` can be used to create and manage virtual machines by
interacting with the kernel module of the hypervisor.

```bash
student@lab-virt-host:~$ sudo apt update
student@lab-virt-host:~$ sudo apt install qemu-kvm
```

Before we can start a virtual machine, the kernel module module must be loaded:

```bash
student@lab-virt-host:~$ lsmod | grep kvm
kvm_intel             282624  0
kvm                   663552  1 kvm_intel
```

`qemu` is able to emulate or virtualize multiple processor architectures. As you
can see in the output of the command above, the `kvm_intel` module is also
loaded besides the `kvm` module. This means that, at the moment, this machine
can support x86 guests using KVM. For each architecture there will be a
different kernel module that is loaded. Loading the KVM kernel module leads to
the creation of the `/dev/kvm` character device. This device is used to
communicate with the hypervisor using `ioctl` operations:

```bash
student@lab-virt-host:~$ ls -l /dev/kvm
crw-rw---- 1 root kvm 10, 232 Feb 30 15:06 /dev/kvm
```

We will use the `kvm` command to start a virtual machine. The user that starts
the virtual machine must either be `root` or be a part of the group that owns
the `/dev/kvm` character device (the `kvm` group in our case).

:::tip Note
From this point on, most commands will require running as the `root` user. The
text will highlight this using `sudo`, but you can switch users to `root` as
mentioned above.
:::


### Starting a virtual machine

Let's create a virtual machine that has `512MB` of RAM (the `-m` parameter), 2
virtual CPU cores (the `-smp` parameter) and a virtual disk backed by the
`debian-11.qcow2` disk image (the `-hda` parameter):

```
student@lab-virt-host:~/work$ sudo kvm -hda debian-11.qcow2 -m 512 -smp 2
qemu-system-x86_64: warning: dbind: Couldn't connect to accessibility bus: Failed to connect to socket 0000a: Connection refused
qemu-system-x86_64: warning: host doesn't support requested feature: CPUID.80000001H:ECX.svm [bit 2]
qemu-system-x86_64: warning: host doesn't support requested feature: CPUID.80000001H:ECX.svm [bit 2]
```

If the command executes successfully, a new window should be shown on your
system and you can see the guest's output.

:::info Warnings
You may see some warning messages when running the `kvm` command. These messages
can usually be ignored.
:::

We can inspect the processes / threads created by `kvm` to see how it manages
the virtual machine. After opening a new terminal, check the KVM threads by
running the following command:

```bash
student@lab-virt-host:~/work$ ps -efL | grep kvm
root        5368    5344    5368  0    1 00:50 pts/1    00:00:00 sudo kvm -m 512 -smp 2 -hda debian-11.qcow2
root        5369    5368    5369  4    5 00:50 pts/1    00:00:00 qemu-system-x86_64 -enable-kvm -m 512 -smp 2 -hda debian-11.qcow2
root        5369    5368    5370  0    5 00:50 pts/1    00:00:00 qemu-system-x86_64 -enable-kvm -m 512 -smp 2 -hda debian-11.qcow2
root        5369    5368    5371  1    5 00:50 pts/1    00:00:00 qemu-system-x86_64 -enable-kvm -m 512 -smp 2 -hda debian-11.qcow2
root        5369    5368    5374 87    5 00:50 pts/1    00:00:09 qemu-system-x86_64 -enable-kvm -m 512 -smp 2 -hda debian-11.qcow2
root        5369    5368    5375  0    5 00:50 pts/1    00:00:00 qemu-system-x86_64 -enable-kvm -m 512 -smp 2 -hda debian-11.qcow2
```

:::note Inspect
Stop the virtual machine by pressing `CTRL+C` in the terminal that you started
it in. Start a new virtual machine with 4 virtual CPU cores and compare the
number of threads. How do you explain the difference?
:::


### Display export via VNC

When interacting with virtual machines, we do not usually want to start them
in the foreground. Instead, the virtual machine is started in the
background and in case we need to access its terminal, we connect to its
console. Using the `-vnc` option, `kvm` will start a VNC server and export the
virtual machine's console through it.

```
student@lab-virt-host:~/work$ sudo kvm -m 512 -smp 2 -hda debian-11.qcow2 -vnc :1
qemu-system-x86_64: warning: host doesn't support requested feature: CPUID.80000001H:ECX.svm [bit 2]
qemu-system-x86_64: warning: host doesn't support requested feature: CPUID.80000001H:ECX.svm [bit 2]
```

When starting the virtual machine like this, its console is not displayed, but
the process is still in foreground. To avoid this, we add the `--daemonize`
parameter:

```
student@lab-virt-host:~/work$ sudo kvm -m 512 -smp 2 -hda debian-11.qcow2 -vnc :1 --daemonize
```

The `-vnc :1` parameter starts a VNC server on the first VNC port.

:::note Connect to the VNC server
Find the port that the VNC server uses and connect to it. You can start a VNC
client on the server using the `vncviewer` command that is created when
the `xtightvncviewer` package is installed.

**Hint:** You can find the VNC port by inspecting the listening TCP ports.
:::


## Virtual machine disk storage

In the previous section we have started a virtual machine using an already
existing disk image - `debian-11.qcow2`. The **qcow2** extension stands for
"QEMU Copy-on-Write" and allows us to create multiple layered images on top of
a read-only base image. Using the `debian-11.qcow2` image as base, for each
virtual machine that we want to start, we will create a new qcow2 image that
will host all changes for the specific virtual machine. Examples on how to
create this layered setup will be shown in the following sections.


### Creating a new disk image

For start, we will create a new qcow2 image that we will use to create a new
virtual machine and install an operating system from an ISO image. Create
a new disk image using the `qemu-img` tool (if not already installed already,
install the `qemu-utils` package).

```bash
student@lab-virt-host:~/work$ qemu-img create -f qcow2 virtualdisk.qcow 2G
Formatting 'virtualdisk.qcow', fmt=qcow2 size=2147483648 cluster_size=65536 lazy_refcounts=off refcount_bits=16
```

The first argument of `qemu-img` is the subcommand that we want to use, in this
case it is `create`. When creating a new image you must specify its format
(using the `-f` parameter), name and maximum size (`2G`).

The installation process requires an installation medium (in ISO format). Begin
by downloading the latest Debian installer ISO, SHA512 checksums and signature
files from the [Debian download page][]. Verify the ISO's integrity and
that the checksum is signed using an [official signature][].
[Debian download page]: https://cdimage.debian.org/debian-cd/current/amd64/iso-cd/
[official signature]: https://www.debian.org/CD/verify

```
student@lab-virt-host:~/work$ sha512sum -c --ignore-missing SHA512SUMS
debian-11.3.0-amd64-netinst.iso: OK
student@lab-virt-host:~/work$ gpg --keyserver keyring.debian.org --receive-keys 0x11CD9819
gpg: /home/student/.gnupg/trustdb.gpg: trustdb created
gpg: key DA87E80D6294BE9B: public key "Debian CD signing key <debian-cd@lists.debian.org>" imported
gpg: Total number processed: 1
gpg:               imported: 1
student@lab-virt-host:~/work$ gpg --verify SHA512SUMS.sign
gpg: assuming signed data in 'SHA512SUMS'
gpg: Signature made Sat 26 Mar 2022 09:22:41 PM UTC
gpg:                using RSA key DF9B9C49EAA9298432589D76DA87E80D6294BE9B
gpg: Good signature from "Debian CD signing key <debian-cd@lists.debian.org>" [unknown]
gpg: WARNING: This key is not certified with a trusted signature!
gpg:          There is no indication that the signature belongs to the owner.
Primary key fingerprint: DF9B 9C49 EAA9 2984 3258  9D76 DA87 E80D 6294 BE9B
```

After the ISO disk image has been verified, you can start a new virtual machine
that uses it using the `-cdrom` argument:

```bash
student@lab-virt-host:~/work$ sudo kvm -hda virtualdisk.qcow -smp 2 -m 512 -cdrom debian-11.3.0-amd64-netinst.iso
```

The virtual machine will boot from the CD because the disk image that we have
created above does not have a bootloader. You can continue the installation
process as normal.

:::tip Note
You can stop the installation process after it begins.
:::


### Adding a new disk image

KVM is able to use multiple disk images on a single virtual machine.

For this task we will start a new virtual machine with the `debian-11.qcow2`
image as its primary boot device. Create an additional 1GB qcow2 disk image and
include it in the virtual machine's parameters. **Hint:** use the `-hdb`
parameter.

Inspect the size of the disk image. Notice that the qcow2 format is able to
expand the disk when data is written to it, but it will be initially small.

```bash
student@lab-virt-host:~/work$ du -sh image-name.qcow2
196K    image-name.qcow2
```

:::note Format the disks
After the virtual machine finishes booting check what block devices are
available. Create two 500MB partitions on the second disk (the one you have
created earlier) and format them using the `ext4` filesystem. Mount both
partitions and create 100MB files on each of them.

Inspect the size of the disk image on the host system and then stop the virtual
machine.
:::


### Creating a disk image based on a base image

The copy-on-write feature of the qcow2 disk format allows reusing a base disk
image in multiple virtual machines without overwriting the contents of the base
file. This means that we can create a template file and then run multiple
virtual machines without copying the template for each one of them.

For this task we aim to create two virtual machines from the same
`debian-11.qcow2` image. Before being able to do this, we must first create a
disk image based on `debian-11.qcow2` for each of the virtual machines.

```bash
student@lab-virt-host:~/work$ qemu-img create -f qcow2 -b debian-11.qcow2 sda-vm1.qcow2
Formatting 'sda-vm1.qcow2', fmt=qcow2 size=8589934592 backing_file=debian-11.qcow2 cluster_size=65536 lazy_refcounts=off refcount_bits=16
student@lab-virt-host:~/work$ du -sh sda-vm1.qcow2
196K    sda-vm1.qcow2
```

Create an additional disk image for the second virtual machine, called
`sda-vm2.qcow2`. Start both virtual machines using the newly created disk images
as their only attached disk.

:::note Write data in the virtual disk
Create a 50MB file in the first virtual machine and inspect the size of disks
created for the two virtual machines, as well as the size of the base image.
What has changed?
:::

You can stop the virtual machines after inspecting the changes to the disks.


### Converting between virtual disk formats

`qemu-img` also allows converting between various virtual machine disk formats.
We may need to convert a qcow2 image to the VMDK format (the default format used
by VMWare) or to the VDI format (the default format used by VirtualBox), without
going through the installation process again. We can use the `convert`
subcommand to achieve this:

```
student@lab-virt-host:~/work$ qemu-img convert -O vdi debian-11.qcow2 debian-11.vdi
```

We can then inspect the image, both before, and after conversion using `qemu-img
info`.
```
student@lab-virt-host:~/work$ qemu-img info debian-11.qcow2
image: debian-11.qcow2
file format: qcow2
virtual size: 8 GiB (8589934592 bytes)
disk size: 1 GiB
cluster_size: 65536
Snapshot list:
ID        TAG                     VM SIZE                DATE       VM CLOCK
1         new                         0 B 20XX-02-30 00:55:00   00:00:00.000
Format specific information:
    compat: 1.1
    lazy refcounts: false
    refcount bits: 16
    corrupt: false
student@lab-virt-host:~/work$ qemu-img info debian-11.vdi
image: debian-11.vdi
file format: vdi
virtual size: 8 GiB (8589934592 bytes)
disk size: 1.16 GiB
cluster_size: 1048576
```

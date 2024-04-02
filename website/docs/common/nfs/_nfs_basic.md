## Setup

We will be using a virtual machine in the [faculty's cloud](http://cloud.grid.pub.ro/).

When creating a virtual machine in the Launch Instance window:
  * Name your VM using the following convention: `scgc_lab<no>_<username>`,
where `<no>` is the lab number and `<username>` is your institutional account.
  * Select **Boot from image** in **Instance Boot Source** section
  * Select **SCGC Template** in **Image Name** section
  * Select the **m1.medium** flavor.

In the base virtual machine:
  * Download the laboratory archive from [here](https://repository.grid.pub.ro/cs/scgc/laboratoare/lab-nfs.zip) in the `work` directory.
Use: `wget https://repository.grid.pub.ro/cs/scgc/laboratoare/lab-nfs.zip` to download the archive.

  * Extract the archive.
The `.qcow2` files will be used to start virtual machines using the `runvm.sh` script.
  * Start the virtual machines using `bash runvm.sh`.
  * The username for connecting to the nested VMs is `student` and the password is `student`.

```shell-session
$ # change the working dir
$ cd ~/work
$ # download the archive
$ wget https://repository.grid.pub.ro/cs/scgc/laboratoare/lab-nfs.zip
$ unzip lab-nfs.zip
$ # start VMs; it may take a while
$ bash runvm.sh
$ # check if the VMs booted
$ virsh net-dhcp-leases labvms
```

There will be two virtual machines that are created. You must add them to the
`/etc/hosts` file on the host.

```
192.168.100.31 lab-nfs-1
192.168.100.32 lab-nfs-2
```


## Basic RAID array configuration

You can create and manage software RAID arrays in Linux using the `mdadm` tool.
Before beginning, make sure that you have it installed on both virtual
machines.

```shell-session
student@lab-nfs-1:~$ sudo apt update
student@lab-nfs-1:~$ sudo apt install mdadm
```


### Creating a RAID array

At this point we can create a new RAID-0 array using `sdb1`, `sdc1` and `sdd1`
on the first virtual machine.

```shell-session
student@lab-nfs-1:~$ sudo mdadm --create /dev/md0 --level=0 --raid-devices=3 /dev/sdb1 /dev/sdc1 /dev/sdd1
mdadm: Defaulting to version 1.2 metadata
mdadm: array /dev/md0 started.
```

The `/proc/mdstat` pseudo-device provides some information about the existing
arrays. We can inspect it by printing its contents.

```shell-session
student@lab-nfs-1:~$ sudo cat /proc/mdstat
Personalities : [linear] [multipath] [raid0] [raid1] [raid6] [raid5] [raid4] [raid10]
md0 : active raid0 sdd1[2] sdc1[1] sdb1[0]
      3136512 blocks super 1.2 512k chunks

unused devices: <none>
```

From the output above, you can see that we have an active RAID-0 array that uses
`sdb1`, `sdc1` and `sdd1`.

We can retrieve additional information about an array using the `mdadm` command
with the `--detail` argument.

```shell-session
student@lab-nfs-1:~$ sudo mdadm --detail /dev/md0
/dev/md0:
           Version : 1.2
     Creation Time : Today Feb 30 00:00:00 20XX
        Raid Level : raid0
        Array Size : 3136512 (2.99 GiB 3.21 GB)
      Raid Devices : 3
     Total Devices : 3
       Persistence : Superblock is persistent

       Update Time : Today Feb 30 00:00:00 20XX
             State : clean
    Active Devices : 3
   Working Devices : 3
    Failed Devices : 0
     Spare Devices : 0

            Layout : -unknown-
        Chunk Size : 512K

Consistency Policy : none

              Name : lab-nfs-1:0  (local to host lab-nfs-1)
              UUID : 2e345a91:3d6e6a9c:2d7c2563:bac3411e
            Events : 0

    Number   Major   Minor   RaidDevice State
       0       8       17        0      active sync   /dev/sdb1
       1       8       33        1      active sync   /dev/sdc1
       2       8       49        2      active sync   /dev/sdd1
```


### Modifying a RAID array's configuration

We will attempt to remove one of the disks from the array:

```shell-session
student@lab-nfs-1:~$ sudo mdadm /dev/md0 --fail /dev/sdd1
mdadm: set device faulty failed for /dev/sdd1:  Device or resource busy
```

:::info Question
As you can see, the command has failed. Why does this happen?
:::

Let's remove the existing RAID-0 array and replace it with a RAID-1 array
containing the same disks. We will begin by stopping the existing array.

```shell-session
student@lab-nfs-1:~$ sudo mdadm --stop /dev/md0
mdadm: stopped /dev/md0
student@lab-nfs-1:~$ sudo mdadm --detail /dev/md0
mdadm: cannot open /dev/md0: No such file or directory
```

We can then proceed to remove the data from the previously used disks'
superblocks to clean them.

```shell-session
student@lab-nfs-1:~$ sudo mdadm --zero-superblock /dev/sdb1 /dev/sdc1 /dev/sdd1
```

Finally, we can create the new array.

```shell-session
student@lab-nfs-1:~$ sudo mdadm --create /dev/md0 --level=1 --raid-devices=3 /dev/sdb1 /dev/sdc1 /dev/sdd1
mdadm: Note: this array has metadata at the start and
    may not be suitable as a boot device.  If you plan to
    store '/boot' on this device please ensure that
    your boot-loader understands md/v1.x metadata, or use
    --metadata=0.90
Continue creating array? y
mdadm: Defaulting to version 1.2 metadata
mdadm: array /dev/md0 started.
student@lab-nfs-1:~$ sudo mdadm --detail /dev/md0
/dev/md0:
           Version : 1.2
     Creation Time : Today Feb 30 00:05:00 20XX
        Raid Level : raid1
        Array Size : 1046528 (1022.00 MiB 1071.64 MB)
     Used Dev Size : 1046528 (1022.00 MiB 1071.64 MB)
      Raid Devices : 3
     Total Devices : 3
       Persistence : Superblock is persistent

       Update Time : Today Feb 30 00:05:00 20XX
             State : clean
    Active Devices : 3
   Working Devices : 3
    Failed Devices : 0
     Spare Devices : 0

Consistency Policy : resync

     Resync Status : 17% complete

              Name : lab-nfs-1:0  (local to host lab-nfs-1)
              UUID : e34cffe9:9243f0c4:bb101f64:912c10fb
            Events : 17

    Number   Major   Minor   RaidDevice State
       0       8       17        0      active sync   /dev/sdb1
       1       8       33        1      active sync   /dev/sdc1
       2       8       49        2      active sync   /dev/sdd1
```

Let's try to remove a disk from the newly created array. The disk is first
marked as faulty, and then removed completely.
```shell-session
student@lab-nfs-1:~$ sudo mdadm /dev/md0 --fail /dev/sdd1
mdadm: set /dev/sdd1 faulty in /dev/md0
student@lab-nfs-1:~$ sudo mdadm --detail /dev/md0
/dev/md0:
           Version : 1.2
     Creation Time : Today Feb 30 00:05:00 20XX
        Raid Level : raid1
        Array Size : 1046528 (1022.00 MiB 1071.64 MB)
     Used Dev Size : 1046528 (1022.00 MiB 1071.64 MB)
      Raid Devices : 3
     Total Devices : 3
       Persistence : Superblock is persistent

       Update Time : Today Feb 30 00:05:05 20XX
             State : clean, degraded
    Active Devices : 2
   Working Devices : 2
    Failed Devices : 1
     Spare Devices : 0

Consistency Policy : resync

              Name : lab-nfs-1:0  (local to host lab-nfs-1)
              UUID : e34cffe9:9243f0c4:bb101f64:912c10fb
            Events : 19

    Number   Major   Minor   RaidDevice State
       0       8       17        0      active sync   /dev/sdb1
       1       8       33        1      active sync   /dev/sdc1
       -       0        0        2      removed

       2       8       49        -      faulty   /dev/sdd1
student@lab-nfs-1:~$ sudo mdadm /dev/md0 --remove /dev/sdd1
mdadm: hot removed /dev/sdd1 from /dev/md0
student@lab-nfs-1:~$ sudo mdadm --detail /dev/md0
[...]
    Number   Major   Minor   RaidDevice State
       0       8       17        0      active sync   /dev/sdb1
       1       8       33        1      active sync   /dev/sdc1
       -       0        0        2      removed
```

:::info Question
Why did removing the disk work in this case?
:::


## RAID-5 array configuration

### Creating a RAID-5 array

Using partitions `sdb2`, `sdc2` and `sdd2` create the RAID-5 array named `md1`
on **both** virtual machines. We will be using the RAID-5 arrays later. The
output should look similar to the one below.

```shell-session
student@lab-nfs-2:~$ sudo mdadm --detail /dev/md1
/dev/md1:
           Version : 1.2
     Creation Time : Today Feb 30 00:10:00 20XX
        Raid Level : raid5
        Array Size : 2093056 (2044.00 MiB 2143.29 MB)
     Used Dev Size : 1046528 (1022.00 MiB 1071.64 MB)
      Raid Devices : 3
     Total Devices : 3
       Persistence : Superblock is persistent

       Update Time : Today Feb 30 00:10:00 20XX
             State : clean, degraded, recovering
    Active Devices : 2
   Working Devices : 3
    Failed Devices : 0
     Spare Devices : 1

            Layout : left-symmetric
        Chunk Size : 512K

Consistency Policy : resync

    Rebuild Status : 12% complete

              Name : lab-nfs-2:1  (local to host lab-nfs-2)
              UUID : 211c43bd:2d53841a:d4244d66:3cac5ee4
            Events : 3

    Number   Major   Minor   RaidDevice State
       0       8       18        0      active sync   /dev/sdb2
       1       8       34        1      active sync   /dev/sdc2
       3       8       50        2      spare rebuilding   /dev/sdd2
```


### Restoring a RAID-5 array

On the first virtual machine, mark `sdb2` as faulty and then remove it from the
RAID-5 array. You should see an output similar to the one below when inspecting
the configuration.

```shell-session
student@lab-nfs-1:~$ sudo mdadm --detail /dev/md1
/dev/md1:
           Version : 1.2
     Creation Time : Today Feb 30 00:10:00 20XX
        Raid Level : raid5
        Array Size : 2093056 (2044.00 MiB 2143.29 MB)
     Used Dev Size : 1046528 (1022.00 MiB 1071.64 MB)
      Raid Devices : 3
     Total Devices : 2
       Persistence : Superblock is persistent

       Update Time : Today Feb 30 00:10:05 20XX
             State : clean, degraded
    Active Devices : 2
   Working Devices : 2
    Failed Devices : 0
     Spare Devices : 0

            Layout : left-symmetric
        Chunk Size : 512K

Consistency Policy : resync

              Name : lab-nfs-1:1  (local to host lab-nfs-1)
              UUID : f7d4fc6c:6bddca12:9333c1c0:c2110b28
            Events : 21

    Number   Major   Minor   RaidDevice State
       -       0        0        0      removed
       1       8       34        1      active sync   /dev/sdc2
       3       8       50        2      active sync   /dev/sdd2
```

We can add a device back to the RAID array to restore it. In this case,
we will add the device that we have removed.

```shell-session
student@lab-nfs-1:~$ sudo mdadm /dev/md1 --add /dev/sdb2
mdadm: added /dev/sdb2
student@lab-nfs-1:~$ sudo mdadm --detail /dev/md1
/dev/md1:
           Version : 1.2
     Creation Time : Today Feb 30 00:10:00 20XX
        Raid Level : raid5
        Array Size : 2093056 (2044.00 MiB 2143.29 MB)
     Used Dev Size : 1046528 (1022.00 MiB 1071.64 MB)
      Raid Devices : 3
     Total Devices : 3
       Persistence : Superblock is persistent

       Update Time : Today Feb 30 00:10:10 20XX
             State : clean, degraded, recovering
    Active Devices : 2
   Working Devices : 3
    Failed Devices : 0
     Spare Devices : 1

            Layout : left-symmetric
        Chunk Size : 512K

Consistency Policy : resync

    Rebuild Status : 5% complete

              Name : lab-nfs-1:1  (local to host lab-nfs-1)
              UUID : f7d4fc6c:6bddca12:9333c1c0:c2110b28
            Events : 23

    Number   Major   Minor   RaidDevice State
       4       8       18        0      spare rebuilding   /dev/sdb2
       1       8       34        1      active sync   /dev/sdc2
       3       8       50        2      active sync   /dev/sdd2
```


## Persistent RAID configuration

In order to make our RAID configuration persistent, we can run the following
commands:

```shell-session
student@lab-nfs-1:~$ sudo mdadm --detail --scan | sudo tee /etc/mdadm/mdadm.conf
ARRAY /dev/md0 metadata=1.2 name=lab-nfs-1:0 UUID=e34cffe9:9243f0c4:bb101f64:912c10fb
ARRAY /dev/md1 metadata=1.2 name=lab-nfs-1:1 UUID=f7d4fc6c:6bddca12:9333c1c0:c2110b28
student@lab-nfs-1:~$ sudo update-initramfs -u
update-initramfs: Generating /boot/initrd.img-5.4.0-105-generic
```

Reboot the virtual machine and confirm that the arrays (`md0` and `md1` are
active).

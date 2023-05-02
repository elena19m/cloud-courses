## Configuring GlusterFS

:::caution
You must have `md1` configured as a RAID-5 array on both virtual machines
before continuing.
:::

GlusterFS is a distributed filesystem used to aggregate storage from multiple
sources. We will use it in conjunction with RAID arrays to test various types
of redundancy.


### XFS

XFS is the recommended filesystem for a GlusterFS configuration. Other types
of filesystems are also supported.

The `xfsprogs` package is required to manage XFS filesystems. Make sure that it
is installed on both virtual machines.

```shell-session
student@lab-nfs-1:~$ sudo apt install xfsprogs
```

Proceed by creating an XFS partition on the `md1` disk that you have created
before. We will first create a partition that covers the entire disk, and
then create the filesystem inside the partition.

```shell-session
student@lab-nfs-1:~$ sudo fdisk /dev/md1

Welcome to fdisk (util-linux 2.34).
Changes will remain in memory only, until you decide to write them.
Be careful before using the write command.


Command (m for help): n # Create a new partition
Partition type
   p   primary (0 primary, 0 extended, 4 free)
   e   extended (container for logical partitions)
Select (default p):

Using default response p.
Partition number (1-4, default 1): # Press Enter to use the default
First sector (2048-4186111, default 2048): # Press Enter to use the default
Last sector, +/-sectors or +/-size{K,M,G,T,P} (2048-4186111, default 4186111): # Press Enter to use the default

Created a new partition 1 of type 'Linux' and of size 2 GiB.

Command (m for help): w
The partition table has been altered.
Calling ioctl() to re-read partition table.
Syncing disks.

student@lab-nfs-1:~$ sudo mkfs.xfs -i size=512 /dev/md1p1
log stripe unit (524288 bytes) is too large (maximum is 256KiB)
log stripe unit adjusted to 32KiB
meta-data=/dev/md1p1             isize=512    agcount=8, agsize=65408 blks
         =                       sectsz=512   attr=2, projid32bit=1
         =                       crc=1        finobt=1, sparse=1, rmapbt=0
         =                       reflink=1
data     =                       bsize=4096   blocks=523008, imaxpct=25
         =                       sunit=128    swidth=256 blks
naming   =version 2              bsize=4096   ascii-ci=0, ftype=1
log      =internal log           bsize=4096   blocks=2560, version=2
         =                       sectsz=512   sunit=8 blks, lazy-count=1
realtime =none                   extsz=4096   blocks=0, rtextents=0
```

The new partition can be now mounted. We will use the `/export` directory for
this example.

:::note
The mount will use the newly created partition `p1` on the `md1` device.
:::

```shell-session
student@lab-nfs-1:~$ sudo mkdir -p /export
student@lab-nfs-1:~$ echo '/dev/md1p1 /export xfs defaults 1 2' | sudo tee -a /etc/fstab
/dev/md1p1 /export xfs defaults 1 2
student@lab-nfs-1:~$ sudo mount /export
student@lab-nfs-1:~$ df -h | grep export
/dev/md1p1      2.0G   47M  2.0G   3% /export
```

:::info Question
Notice the size of the partition. How do you explain it?
:::

:::info
Repeat the steps on the second virtual machine.
:::


### GlusterFS setup

Install the GlusterFS daemon, and then enable and start it on both virtual
machines.

```shell-session
student@lab-nfs-1:~$ sudo apt install glusterfs-server
student@lab-nfs-1:~$ sudo systemctl enable --now glusterd
```

After the daemon is started on both virtual machines we can connect the two
systems. You **must** first add hostname-IP mappings for the two storage
servers in `/etc/hosts` on both virtual machines. Afterwards, you
can run the following commands to check that a GlusterFS cluster can be created:

```shell-session
student@lab-nfs-1:~$ sudo gluster peer probe lab-nfs-2
peer probe: success.
student@lab-nfs-1:~$ sudo gluster peer status
Number of Peers: 1

Hostname: lab-nfs-2
Uuid: 8901b0e6-62f5-410b-bf32-121496b4823b
State: Peer in Cluster (Connected)
```

If the hosts are connected, we can create a GlusterFS volume using the
partitions that we have created in the RAID arrays on the two virtual machines.

```shell-session
student@lab-nfs-1:~$ sudo gluster volume create gluster-vol transport tcp lab-nfs-1:/export/brick1 lab-nfs-2:/export/brick1
volume create: gluster-vol: success: please start the volume to access data
student@lab-nfs-1:~$ sudo gluster volume info gluster-vol

Volume Name: gluster-vol
Type: Distribute
Volume ID: b476aa2b-d5fc-4697-aca7-6a471e938b0f
Status: Created
Snapshot Count: 0
Number of Bricks: 2
Transport-type: tcp
Bricks:
Brick1: lab-nfs-1:/export/brick1
Brick2: lab-nfs-2:/export/brick1
Options Reconfigured:
transport.address-family: inet
storage.fips-mode-rchecksum: on
nfs.disable: on
```

After setting up the volume, we can configure network access and start the
volume.

```shell-session
student@lab-nfs-1:~$ sudo gluster volume set gluster-vol auth.allow 192.168.100.*
volume set: success
student@lab-nfs-1:~$ sudo gluster volume start gluster-vol
volume start: gluster-vol: success
```


### Mounting a GlusterFS volume

If the setup went smoothly, we can mount the volume on the host virtual machine
(the one created in OpenStack).

```shell-session
student@lab-nfs-host:~/work$ sudo apt update
student@lab-nfs-host:~/work$ sudo apt install glusterfs-client
student@lab-nfs-host:~/work$ sudo mkdir /export
student@lab-nfs-host:~/work$ sudo mount -t glusterfs lab-nfs-1:/gluster-vol /export
student@lab-nfs-host:~/work$ df -h | grep export
lab-nfs-1:/gluster-vol  4.0G  135M  3.9G   4% /export
```

:::info Question
How do you explain the size of the volume?
:::


### GlusterFS and RAID

Test that adding or removing volumes from the RAID arrays does not affect the
GlusterFS volume. What limitations can you notice?


## Data replication using GlusterFS

In the setup above we used RAID-5 in order to provide redundancy and GlusterFS
to aggregate storage.

Now use GlusterFS to replicate data. Use the same disks as before (`sdb2`,
`sdc2`, `sdd2`) on the two virtual machines and arrange them in an array
that maximizes storage size. Afterwards, use GlusterFS to provide redundancy.

To remove an existing GlusterFS volume, do the following:

```shell-session
# On the host virtual machine
student@lab-nfs-host:~/work$ sudo umount /export
# On one of the storage virtual machines
student@lab-nfs-1:~$ sudo gluster volume stop gluster-vol
Stopping volume will make its data inaccessible. Do you want to continue? (y/n) y
volume stop: gluster-vol: success
student@lab-nfs-1:~$ sudo gluster volume delete gluster-vol
Deleting volume will erase all information about the volume. Do you want to continue? (y/n) y
volume delete: gluster-vol: success
student@lab-nfs-1:~$ sudo rm -rf /export/brick1/
# On the other virtual machine
student@lab-nfs-2:~$ sudo rm -rf /export/brick1/
```

:::tip
Use the `replica <number of replicas>` argument when creating a volume to
enable data replication.
:::

:::info
The resulting volume, when mounted, should be 3GB.
:::

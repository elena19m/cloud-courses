## LXD
### Intro

LXD is a next generation **system container** manager. It offers a user experience similar to virtual machines but using Linux containers instead. System containers are designed to run multiple processes and services and for all practical purposes. You can think of OS containers as VMs, where you can run multiple processes, install packages etc.

LXD has it's image based on pre-made images available for a wide number of Linux distributions and is built around a very powerful, yet pretty simple, REST API.

Let's start by installing LXD on `lab-docker` using snap and setup the `PATH` variable so we can use it easily:
```
root@lab-docker:~# apt install snapd
root@lab-docker:~# export PATH="$PATH:/snap/bin"
```

The LXD initialization process is can be started using `lxd init`:
```
root@lab-docker:~# lxd init
```

You will be prompted to specify details about the storage backend for the LXD containers and also networking options:

```
root@lab-docker:~# lxd init
Would you like to use LXD clustering? (yes/no) [default=no]: # press Enter
Do you want to configure a new storage pool? (yes/no) [default=yes]: # press Enter
Name of the new storage pool [default=default]: # press Enter
Name of the storage backend to use (dir, lvm, zfs, ceph, btrfs) [default=zfs]: # press Enter
Create a new ZFS pool? (yes/no) [default=yes]: # press Enter
Would you like to use an existing empty block device (e.g. a disk or partition)? (yes/no) [default=no]: # press Enter
Size in GB of the new loop device (1GB minimum) [default=5GB]: # press Enter
Would you like to connect to a MAAS server? (yes/no) [default=no]: # press Enter
Would you like to create a new local network bridge? (yes/no) [default=yes]: # press Enter
What should the new bridge be called? [default=lxdbr0]: # press Enter
What IPv4 address should be used? (CIDR subnet notation, “auto” or “none”) [default=auto]: 12.0.0.1/24
What IPv6 address should be used? (CIDR subnet notation, “auto” or “none”) [default=auto]: # press Enter
Would you like the LXD server to be available over the network? (yes/no) [default=no]: # press Enter
Would you like stale cached images to be updated automatically? (yes/no) [default=yes]: # press Enter
Would you like a YAML "lxd init" preseed to be printed? (yes/no) [default=no]: # press Enter
```

We have now successfully configured LXD storage backend and also networking. We can verify that `lxdbr0` was properly configured with the given subnet:
```
root@lab-docker:~# brctl show lxdbr0
bridge name     bridge id               STP enabled     interfaces
lxdbr0          8000.000000000000       no
root@lab-docker:~# ip address show lxdbr0
13: lxdbr0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UNKNOWN group default qlen 1000
    link/ether c6:fd:e7:04:9c:de brd ff:ff:ff:ff:ff:ff
    inet 12.0.0.1/24 scope global lxdbr0
       valid_lft forever preferred_lft forever
    inet6 fd42:89a:615d:8d24::1/64 scope global
       valid_lft forever preferred_lft forever
    inet6 fe80::c4fd:e7ff:fe04:9cde/64 scope link
       valid_lft forever preferred_lft forever
```

Use `lxc list`to show the available LXD containers on the host system:
```
root@lab-docker:~# lxc list
Generating a client certificate. This may take a minute...
+------+-------+------+------+------+-----------+
| NAME | STATE | IPV4 | IPV6 | TYPE | SNAPSHOTS |
+------+-------+------+------+------+-----------+
```

This is the first time the `lxc` client tool communicates with the `lxd` daemon and let's the user know that it automatically generates a client certificate for secure connections with the back-end. Finally, the command outputs a list of available containers, which is empty at the moment since we did not create any yet.

:::note
The `lxc` tool is part of the `lxd` package, **not** the `lxc` one. It will only communicate with the `lxd` daemon, and will therefore not show any information about containers previously created.
:::

### Start a system container

LXD uses multiple remote image servers. To list the default remotes we can use `lxc remote`:
```
root@lab-docker:~# lxc remote list
+-----------------+------------------------------------------+---------------+--------+--------+
|      NAME       |                   URL                    |   PROTOCOL    | PUBLIC | STATIC |
+-----------------+------------------------------------------+---------------+--------+--------+
| images          | https://images.linuxcontainers.org       | simplestreams | YES    | NO     |
+-----------------+------------------------------------------+---------------+--------+--------+
| local (default) | unix://                                  | lxd           | NO     | YES    |
+-----------------+------------------------------------------+---------------+--------+--------+
| ubuntu          | https://cloud-images.ubuntu.com/releases | simplestreams | YES    | YES    |
+-----------------+------------------------------------------+---------------+--------+--------+
| ubuntu-daily    | https://cloud-images.ubuntu.com/daily    | simplestreams | YES    | YES    |
+-----------------+------------------------------------------+---------------+--------+-------
```

LXD comes with 3 default remotes providing images:
  * ubuntu: (for stable Ubuntu images)
  * ubuntu-daily: (for daily Ubuntu images)
  * images: (for a bunch of other distros)

We can list the available images on a specific remote using `lxc image list`. In the below example, we list all the images from the `ubuntu` stable remote matching version `20.04`:
```
root@lab-docker:~# lxc image list ubuntu: 20.04
+--------------------+--------------+--------+-----------------------------------------------+---------+----------+------------------------------+
|       ALIAS        | FINGERPRINT  | PUBLIC |                  DESCRIPTION                  |  ARCH   |   SIZE   |         UPLOAD DATE          |
+--------------------+--------------+--------+-----------------------------------------------+---------+----------+------------------------------+
| f (5 more)         | 647a85725003 | yes    | ubuntu 20.04 LTS amd64 (release) (20200504)   | x86_64  | 345.73MB | May 4, 2020 at 12:00am (UTC) |
+--------------------+--------------+--------+-----------------------------------------------+---------+----------+------------------------------+
| f/arm64 (2 more)   | 9cb323cab3f4 | yes    | ubuntu 20.04 LTS arm64 (release) (20200504)   | aarch64 | 318.86MB | May 4, 2020 at 12:00am (UTC) |
+--------------------+--------------+--------+-----------------------------------------------+---------+----------+------------------------------+
| f/armhf (2 more)   | 25b0b3d1edf9 | yes    | ubuntu 20.04 LTS armhf (release) (20200504)   | armv7l  | 301.15MB | May 4, 2020 at 12:00am (UTC) |
+--------------------+--------------+--------+-----------------------------------------------+---------+----------+------------------------------+
| f/ppc64el (2 more) | 63ff040bb12b | yes    | ubuntu 20.04 LTS ppc64el (release) (20200504) | ppc64le | 347.49MB | May 4, 2020 at 12:00am (UTC) |
+--------------------+--------------+--------+-----------------------------------------------+---------+----------+------------------------------+
| f/s390x (2 more)   | d7868570a060 | yes    | ubuntu 20.04 LTS s390x (release) (20200504)   | s390x   | 315.86MB | May 4, 2020 at 12:00am (UTC) |
+--------------------+--------------+--------+-----------------------------------------------+---------+----------+------------------------------+
```

As we can see, there are available images for multiple architectures including armhf, arm64, powerpc, amd64 etc. Since LXD containers are sharing the kernel with the host system and there is also, there is no emulation support in containers, we need to choose the image matching the host architecture, in this case `x86_64` (`amd64`).

Now that we have chosen the container image, let's start a container named `lxd-ct`:
```
root@lab-docker:~# lxc launch ubuntu:f lxd-ct
```

The `f` (extracted from the `ALIAS` column) in `ubuntu:f` is the shortcut for `focal ubuntu` (version 20.04 is codenamed Focal Fossa). `ubuntu:` is the remote that we want to download the image from. Because this is the first time we launch a container using this image, it will take a while to download the rootfs for the container on the host.

:::note
As an alternative:
```
root@lab-docker:~# lxc launch images:alpine/3.11 lxd-ct
```
:::

Running `lxc list` we can see that now we have a container running:
```
root@lab-docker:~# lxc list
+--------+---------+------------------+----------------------------------------------+------------+-----------+
|  NAME  |  STATE  |       IPV4       |                     IPV6                     |    TYPE    | SNAPSHOTS |
+--------+---------+------------------+----------------------------------------------+------------+-----------+
| lxd-ct | RUNNING | 12.0.0.93 (eth0) | fd42:89a:615d:8d24:216:3eff:fea6:92f2 (eth0) | PERSISTENT | 0         |
+--------+---------+------------------+----------------------------------------------+------------+-----------
```

Let's connect to the `lxd-ct` as the preconfigured user `ubuntu`:
```
root@lab-docker:~# lxc exec lxd-ct -- sudo --login --user ubuntu
```

:::note
As an alternative:
```
root@lab-docker:~# lxc exec lxd-ct -- /bin/sh
```
:::

The first `--` from the command specifies that the `lxc exec` command options stop there and everything that follows are the commands that need to be run in the container. In this case, we want to login as the `ubuntu` user to the system.

Now we can check all the processes running in the container:
```
ubuntu@lxd-ct:~$ ps aux
```

As we can see from the output of `ps`, the LXD container runs the `systemd` init subsystem and not just the `bash` session as we saw in LXC containers.

To quit the container shell, a simple `CTRL - D` is enough. As a final step, let's stop our LXD container:
```
root@lab-docker:~# lxc stop lxd-ct
root@lab-docker:~# lxc list
+--------+---------+------+------+------------+-----------+
|  NAME  |  STATE  | IPV4 | IPV6 |    TYPE    | SNAPSHOTS |
+--------+---------+------+------+------------+-----------+
| lxd-ct | STOPPED |      |      | PERSISTENT | 0         |
+--------+---------+------+------+------------+-----------+
```

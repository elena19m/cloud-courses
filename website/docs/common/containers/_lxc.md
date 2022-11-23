## LXC

### LXC: Check for LXC support

LXC (Linux Containers) is an operating-system-level virtualization method for running multiple isolated Linux systems (containers) on a control host using a single Linux kernel. The support is integrated in the mainline kernel starting with version 2.6.29. That means any Linux kernel, starting with that version, if properly configured can support LXC containers.

Some key aspects related to LXC:
  * The physical machine is called a `hardware node`
  * The Linux kernel is shared between the hardware node and the containers
  * Each container has:
      * an isolated process hierarchy
      * a separated root filesystem
      * a configuration file

Start by connecting to `lab-docker`.

You can use `sudo su` to switch user to `root` after connecting.

Using the `lxc-checkconfig` command, check if the hardware node's kernel supports LXC:
```
root@lab-docker:~# lxc-checkconfig
```

Also, verify if that the `cgroup` filesystem is mounted:
```
root@lab-docker:~# mount
```


### LXC: Create basic containers

The `lxc-create` tool is used in order to facilitate the creation of a LXC container. Upon issuing a `lxc-create` command the following actions are made:
  * a minimal configuration file is created
  * the basic root filesystem for the container is created by downloading the necessary packages from remote repositories

The command syntax is the following:
```
lxc-create -n NAME -t TEMPLATE
```

Some of the values for `TEMPLATE` are: `alpine`, `ubuntu`, `busybox`, `sshd`, `debian`, or `fedora` and specifies the template script that will be employed when creating the `rootfs`. All the available template scripts are available in the following location: `/usr/share/lxc/templates/`.

:::note
If you system doesn't have the templates mentioned above, you can install them using the command `apt install lxc-templates`
:::

We can also use special parameters for running a specific template. For example,
in order to create a container using the following commands:

```
root@lab-docker:~# lxc-create -n ct1 -t busybox
root@lab-docker:~# lxc-ls
ct1
root@lab-docker:~# cat /var/lib/lxc/ct1/config
```

You can inspect the configuration file for this new container: `/var/lib/lxc/ct1/config`.

### Basic interaction

To see that the `ct1` container has been created created, on `lab-docker` run:
```
root@lab-docker:~# lxc-ls
ct1
```

Start the container by issuing the following command:
```
root@lab-docker:~# lxc-start -n ct1 -F
udhcpc: started, v1.30.1
udhcpc: sending discover
udhcpc: sending discover
udhcpc: sending select for 10.0.3.31
udhcpc: lease of 10.0.3.31 obtained, lease time 3600

Please press Enter to activate this console.


BusyBox v1.30.1 (Ubuntu 1:1.30.1-4ubuntu6.4) built-in shell (ash)
Enter 'help' for a list of built-in commands.

/ # halt

The system is going down NOW!
Sent SIGTERM to all processes
Sent SIGKILL to all processes
Requesting system halt
root@lab-docker:~#
```

Using the `-F, --foreground` option, the container is started in **foreground** thus we can observe that the terminal is attached to it.

We used the `halt` command in order to stop the container and return to the command line.

By adding the `-d` or `--daemon` argument to the `lxc-start` command, the container can be started in **background**:
```
root@lab-docker:~# lxc-start -n ct1 -d
```

Verify the container state using `lxc-info`:
```
root@lab-docker:~# lxc-info -n ct1
Name:           ct1
State:          RUNNING
PID:            86316
IP:             10.0.3.190
CPU use:        0.66 seconds
BlkIO use:      16.00 KiB
Memory use:     2.55 MiB
KMem use:       2.00 MiB
Link:           veth80jFsr
 TX bytes:      2.58 KiB
 RX bytes:      3.04 KiB
 Total bytes:   5.62 KiB
```

Finally, we can connect to the container's console using `lxc-console`:
```
root@lab-docker:~# lxc-console -n ct1

Connected to tty 1
Type <Ctrl+a q> to exit the console, <Ctrl+a Ctrl+a> to enter Ctrl+a itself

ct1 login:

```

We can disconnect from the container's console, without stopping it, using the **CTRL+A, Q** key combination.

### LXC: Process hierarchy

Using the `lxc-info` command, find out the `ct1` PID which will correspond to the container's init process. Any other process running in the container will be child processes of this `init`.

```
root@lab-docker:~# lxc-info -n ct1
Name:           ct1
State:          RUNNING
PID:            1977
CPU use:        0.33 seconds
BlkIO use:      4.00 KiB
Memory use:     1.66 MiB
KMem use:       1.06 MiB
```

From one terminal, connect to the `ct1` console:
```
root@lab-docker:~# lxc-console -n ct1
```

From other terminal in the `lab-docker`, print the process hierarchy starting with the container's PID:
```
# Install pstree
root@lab-docker:~# apt update
root@lab-docker:~# apt install psmisc
root@lab-docker:~# pstree --ascii -s -c -p 1977
systemd(1)---lxc-start(1974)---init(1977)-+-crond(2250)
                                          |-getty(2285)
                                          |-getty(2286)
                                          |-getty(2287)
                                          |-getty(2288)
                                          |-login(2284)---ash(2297)
                                          `-syslogd(2222)
```

As shown above, the init process of `ct1` is a child process of `lxc-start`.

Now, print the container processes from within `ct1`:
```
~ # ps -ef
PID   USER     COMMAND
    1 root     init
    4 root     /bin/syslogd
   14 root     /bin/udhcpc
   15 root     /bin/login -- root
   16 root     init
   19 root     -sh
   21 root     {ps} -sh
```

Even though the same processes can be observed from within or outside of the container, the process PIDs are different. This is because the operating system translates the process space for each container.

### LXC: Filesystem

LXC containers have their filesystem stored in the host machine under the following path: `/var/lib/lxc/<container-name>/rootfs/`.

Using this facility, files can be shared easily between containers and the host:
  * From within the container, create a file in the `/root` directory.
  * From the host `lab-docker`, access the previously created file and edit it.
  * Verify that the changes are also visible from the container.

#### Exercise: Start your own container

* Start an Ubuntu container starting from the `ubuntu` template named `ct2`;
* Connect to the `ct2` container. The username and password are `ubuntu`.

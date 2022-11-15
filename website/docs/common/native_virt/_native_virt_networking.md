## Bridged network configuration

We will create another two virtual machines using the `sda-vm1.qcow2` and
`sda-vm2.qcow2` disk images, that are based on the `debian-11.qcow2` base image.

By default, KVM creates virtual machines that are connected to a NAT network and
can only access the internet, without communicating between them. Our goal
for this task is to give the virtual machines access to both the internet, and
allow them to communicate between them. We will do so by creating a bridged
network.

The first step is adding a tap interface to each of the virtual machines. We can
add the interfaces by adding the `-device` and the `-netdev` parameters to
the `kvm` command.

```bash
student@lab-virt-host:~/work$ sudo kvm -smp 2 -m 512 -hda sda-vm1.qcow2 \
    -device e1000,netdev=net0,mac=00:11:22:33:44:55 -netdev tap,id=net0,script=no
```

The `-device` parameter specifies the type of emulated device (`e1000`), the
name of the device and the MAC address, while the `-netdev` parameter attaches
the device as a tap interface. The `script=no` parameter at the end of the
`netdev` parameter specifies that KVM should not run a script when the interface
is brought up.

:::warning
The name must be the same in both parameters.
:::

Start the second virtual machine using a command similar to the first one. Make
sure that the device names and MAC addresses are different from the first one's.
We must manually set the tap interfaces state to up (do the same for the second
virtual machine's interface):

```bash
student@lab-virt-host:~$ sudo ip link set dev tap0 up
```

Next, change the hostname on both virtual machines to `vm1`, and `vm2`
respectively.

```bash
student@debian-11:~$ sudo hostnamectl set-hostname vm1
student@debian-11:~$ echo '127.0.0.1 vm1' | sudo tee -a /etc/hosts

student@debian-11:~$ sudo hostnamectl set-hostname vm2
student@debian-11:~$ echo '127.0.0.1 vm2' | sudo tee -a /etc/hosts
```

At this point we have successfully created two virtual links between the KVM
guests and the host system. In order to connect both the physical machine and
the guests to the same network we will use a bridge device (a virtual switch
implemented in the Linux kernel).

Start by creating a bridge named `br0` and connect the tap interfaces to it:

```bash
student@lab-virt-host:~/work$ sudo brctl addbr br0
student@lab-virt-host:~/work$ sudo ip link set dev br0 up
student@lab-virt-host:~/work$ sudo brctl addif br0 tap0
student@lab-virt-host:~/work$ sudo brctl addif br0 tap1
student@lab-virt-host:~/work$ sudo brctl show br0
bridge name     bridge id               STP enabled     interfaces
br0             8000.9a09eec316b1       no              tap0
                                                        tap1
```

Configure the `192.168.6.10/24` address on the `br0` bridge interface on the
host, and `192.168.6.1/24` and `192.168.6.2/24` on the `eth0` in the two virtual
machines. Verify that you have connectivity between the three systems.

To get internet access inside the virtual machines, the host system must perform
NAT address translations. To enable NAT translation, run the following commands:

```bash
student@lab-virt-host:~/work$ sudo sysctl -w net.ipv4.ip_forward=1
net.ipv4.ip_forward = 1
student@lab-virt-host:~/work$ sudo iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
```

Check that you can access the internet from inside the virtual machines.

:::tip
You must configure the virtual machine to send packages meant for the internet
to go through the bridge's IP address.
:::

After you finish testing, stop the virtual machines and remove the bridge.

:::tip
You must bring the bridge interface down before deleting it.
:::

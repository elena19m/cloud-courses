### Configuring and deleting IP addresses

We first want to ensure connectivity between the host and red stations. In this tutorial we will use the iproute suite on Linux to perform common layer 3 (IP addressing) configurations.

We will configure one IP address from the 192.168.0.0/24 class on the link interfaces between the host station and the red station. That is, between host(veth-red) (the veth-red interface on the host station) and red(red-eth0) (the red-eth0 interface on the red station).

:::note
On the veth-red interface on the host station we will configure the IP address 192.168.0.1 with the mask 255.255.255.0 (/24 in the prefixed form):
```shell-command
root@host:~# ip address add 192.168.0.1/24 dev veth-red
```
:::

Note that the iproute2 suite (ie the ip utility) uses the mask in prefixed format: /24.

Immediately after a network configuration run a command to validate the configuration. In our case it is the command to display the level 3 (Network) configuration, that is, the IP address:

```shell-command
root@host:~# ip address show dev veth-red
47: veth-red: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc pfifo_fast state DOWN qlen 1000
 link/ether 4e:1b:b8:d9:14:bb brd ff:ff:ff:ff:ff:ff
 inet 192.168.0.1/24 scope global veth-red
```

:::note
On the red-eth0 interface on the red station we will configure the IP address 192.168.0.2 with the mask 255.255.255.0 (/24 in the prefixed form):
```shell-command
root@host:~# go red
[...]
root@red:~# ip address add 192.168.0.2/24 dev red-eth0
root@red:~# ip address show dev red-eth0
46: red-eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc pfifo_fast state DOWN qlen 1000
 link/ether 00:16:3e:8e:84:21 brd ff:ff:ff:ff:ff:ff
 inet 192.168.0.2/24 scope global eth0
 inet6 fe80::216:3eff:fe8e:8421/64 scope link
 valid_lft forever preferred_lft forever
```
:::

Likewise, after a network configuration, I ran the validation command, in this case ip address.

:::note
To test the connectivity between the host and red stations we use the ping command:
```shell-command
root@host:~# ping 192.168.0.2
PING 192.168.0.2 (192.168.0.2) 56(84) bytes of data.
^C
--- 192.168.0.2 ping statistics ---
2 packets transmitted, 0 received, 100% packet loss, time 1007ms
```
After a few seconds, stop the ping command using the `Ctrl+c` key combination.
:::

Notice that there is no connectivity between the two stations: packets are completely lost (100% packet loss). The reason is that we have not enabled the interfaces, we have only done layer 3 configurations.

:::note
Trace the layer 2 configuration of the interfaces using the ip link command:
```shell-command
root@host:~# ip link show dev veth-red
10: veth-red: <BROADCAST,MULTICAST> mtu 1500 qdisc pfifo_fast state DOWN qlen 1000
 link/ether 3e:03:f0:76:76:ab brd ff:ff:ff:ff:ff:ff
```
Notice that the interface is not active at layer 2 (Data Link). To activate the interface use the command:
```shell-command
root@host:~# ip link set dev veth-red up
```
Look again at the Layer 2 (Data Link) configuration of the veth-red interface and notice that it is now partially UP (UP and DOWN also appear in the command output):
```shell-command
root@host:~# ip link show dev veth-red
10: veth-red: <NO_CARRIER,BROADCAST,MULTICAST,UP> mtu 1500 qdisc pfifo_fast state DOWN qlen 1000
 link/ether 3e:03:f0:76:76:ab brd ff:ff:ff:ff:ff:ff
```
Test connectivity again using the ping command. Still no connectivity. This and the fact that DOWN also appeared in the output of the previous command is due to the fact that we did not enable the red-eth0 interface on the red station. The red-eth0 interface on the red station is the one connected to the veth-red interface on the host station; both must be enabled to have an active connection.

On the red station check the layer 2 configuration of the red-eth0 interface on the red. Note that it is DOWN and enable the interface if applicable using the command:
```shell-command
root@red:~# ip link set dev red-eth0 up
```
Verify that the interface is now active using the command:
```shell-command
root@red:~# ip link show dev red-eth0
```
Use the ping command to retest connectivity between the host and red stations.
:::

We want to go back to the original configuration. For this run a form command:
```shell-command
# ip address flush dev INTERFACE
```
where INTERFACE is the veth-red interface on the host station, respectively red-eth0 on the red station.
Ensure that no more IP addresses are configured on the interfaces using a command of the form:

```shell-command
# ip address show dev INTERFACE
```
where INTERFACE is the interface veth-red interface on the host station, respectively red-eth0 on the red station.

### Troubleshoot IP address configuration problem

Run the prepare script with the new ex6 argument:
```shell-command
root@host:~# start_lab ip ex6
```

After running the script the red station was restarted and the configurations were redone. You will need to reconnect to the red station using the command:
```shell-command
root@host:~# go red
```
The script configures the IP address 7.7.7.1 on the veth-red interface of the host station and the IP address 7.7.7.2 on the red-eth0 interface of the red station. To display the IP configuration on the two interfaces use the commands:
```shell-command
root@host:~# ip address show veth-red
47: veth-red: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc pfifo_fast state UP qlen 1000
 link/ether 4e:1b:b8:d9:14:bb brd ff:ff:ff:ff:ff:ff
 inet 7.7.7.1/32 scope global veth-red
```

```shell-command
root@red:~# ip address show red-eth0
46: red-eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc pfifo_fast state UP qlen 1000
 link/ether 00:16:3e:8e:84:21 brd ff:ff:ff:ff:ff:ff
 inet 7.7.7.2/24 scope global red-eth0
 inet6 fe80::216:3eff:fe8e:8421/64 scope link
 valid_lft forever preferred_lft forever
```
Use the ping command to test connectivity between the two IP addresses (7.7.7.1 and 7.7.7.2) on the two stations. Notice that there is no connectivity.

:::note
To troubleshoot this problem, we follow the routing table of each station:
```shell-command
root@red:~# ip r s
default via 7.7.7.1 dev red-eth0
7.7.7.0/24 dev red-eth0 proto kernel scope link src 7.7.7.2
```

```shell-command
root@host:~# ip r s
default via 10.9.0.1 dev eth0
10.9.0.0/16 dev eth0 proto kernel scope link src 10.9.3.210
169.254.169.254 via 10.9.0.100 dev eth0
192.168.2.0/24 dev veth-green proto kernel scope link src 192.168.2.1
192.168.3.0/24 dev veth-blue proto kernel scope link src 192.168.3.1
```

Notice that the relevant route (7.7.7.0/24) does not appear on the host in the routing table. Either the interface is disabled or the configuration is wrong.

Look carefully at the level 3 information:
```shell-command
root@host:~# ip address show veth-red
47: veth-red: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc pfifo_fast state UP qlen 1000
 link/ether 4e:1b:b8:d9:14:bb brd ff:ff:ff:ff:ff:ff
 inet 7.7.7.1/32 scope global veth-red
```

```shell-command
root@red:~# ip address show red-eth0
46: red-eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc pfifo_fast state UP qlen 1000
 link/ether 00:16:3e:8e:84:21 brd ff:ff:ff:ff:ff:ff
 inet 7.7.7.2/24 scope global red-eth0
 inet6 fe80::216:3eff:fe8e:8421/64 scope link
 valid_lft forever preferred_lft forever
```
:::

We can see that the interfaces are up (`UP`). But one of these addresses (7.7.7.1) has the `/32` mask. This means that they cannot network with each other and also explains the absence of the relevant route from the routing table.

Fixing this error is done by adding the IP address with the correct mask `7.7.7.1/24` on the `veth-red` interface on the host. Verify that you have connectivity between `host` and `red`.

Remember to delete the wrong address using the command `ip address delete 7.7.7.1/32 dev veth-red`. If you don't delete the wrong address you will have 2 IP addresses on the interface, one with a `/24` mask and one with a `/32` mask.


:::danger
A relatively common mistake in IP address configuration in Linux is to omit the netmask. Be careful not to omit the mask when configuring IP addresses on interfaces in Linux.
:::

:::warning
Listing a station's routing table is among the first steps in troubleshooting a connectivity problem.
:::

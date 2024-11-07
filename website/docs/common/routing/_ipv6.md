### IPv6

We want to provide IPv6 connectivity between host station and red. In this tutorial we will use the `iproute` suite from Linux to perform the necessary configurations. Use the -6 parameter to make IPv6 related settings.

We will configure one `2201::/64` class IP address on the link interfaces between the host station and the red station. That is, between host(`veth-red`) (the `veth-red` interface on the `host` station) and `red(red-eth0)` (the `red-eth0` interface on the `red` station).

:::note
On the `veth-red` interface on the `host` station we will configure the IP address `2201::1/64`:
```shell-command
root@host:~# ip -6 address add 2201::1/64 dev veth-red
```

Immediately after a network configuration run a command to validate the configuration. In our case it is the IPv6 address display command:
```shell-command
root@host:~# ip -6 address show dev veth-red
47: veth-red: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 state UP qlen 1000
 inet6 2201::1/64 scope global
 valid_lft forever preferred_lft forever
 inet6 fe80::215:5dff:fe5b:a38e/64 scope link
 valid_lft forever preferred_lft forever
```
:::

On the red-eth0 interface on the red station we will configure the IP address 2201::2/64:
:::note
Configure on the host-blue link IPv6 addresses from the 2202::/64 network and on the host-green link IPv6 addresses from the 2203::/64 network.

Enable routing for IPv6 on the host station:
```shell-command
root@host:~# sysctl -w net.ipv6.conf.all.forwarding=1
```

You also need to add default routes on red, green and blue to the host.

Check connectivity between containers using the **ping** command.
:::

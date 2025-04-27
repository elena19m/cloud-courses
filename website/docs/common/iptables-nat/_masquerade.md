## MASQUERADE NAT

The depletion of IPv4 addresses has led to the use of private class IP addresses (e.g. `192.168.0.0/24`). In addition to communication between hosts in a network, we also want Internet access. This is why the concept of Network Address Translation (NAT) has been introduced, where several hosts have access to the Internet using the same routable IP address: the gateway address. Enabling address translation (NAT) on the gateway causes the pair `<source IP address, source port>` (belonging to the station) to be replaced by the pair `<gateway IP address, available port>`.

Configuring NAT on Linux is done via the `iptables` command, just like configuring the firewall. Where we used the `filter` table (the default `iptables` table) for firewall configuration, we use the `nat` table for address translation configuration.

So, to enable NAT on a Linux server, run the command

```shell-session
root@host:~# iptables -t nat -A POSTROUTING -j MASQUERADE
```

In the above command:

- `-t` specifies the table to which the rule applies, in our case the nat table.
- `-A` means adding a rule to the end of the rule list.
- `POSTROUTING` refers to when the address translation process will be performed: after routing.
In iptables nomenclature this is also called a chain.
Examples of other chains: `INPUT`, `OUTPUT`, `FORWARD`, `PREROUTING`.
- `-j` is the action to be taken, `MASQUERADE` in this case (simple address translation action).
To check and validate the rule, we display the `POSTROUTING` chain entries in the `nat` table using the command

```shell-session
root@host:~# iptables -t nat -L POSTROUTING -n -v
Chain POSTROUTING (policy ACCEPT 0 packets, 0 bytes)
 pkts bytes target     prot opt in     out     source               destination
    0     0 MASQUERADE  all  --  *      *       0.0.0.0/0            0.0.0.0/0
```

We want to verify that NAT is configured correctly. To do this we will send a packet from the `red` host to `8.8.8.8`. The packet will pass through the gateway (i.e. `host`) and will be forwarded. On the `red` host we run the command

```shell-session
root@red:~# ping -c 2 8.8.8.8
PING 8.8.8.8 (8.8.8.8) 56(84) bytes of data.
From 192.168.1.2 icmp_seq=1 Destination Host Unreachable
From 192.168.1.2 icmp_seq=2 Destination Host Unreachable

--- 8.8.8.8 ping statistics ---
2 packets transmitted, 0 received, +2 errors, 100% packet loss, time 999ms
```

We notice that there is no connectivity from the `red` station to `8.8.8.8`:

```shell-session
root@host:~# iptables -t nat -L -n -v
Chain PREROUTING (policy ACCEPT 2 packets, 168 bytes)
 pkts bytes target     prot opt in     out     source               destination

Chain INPUT (policy ACCEPT 0 packets, 0 bytes)
 pkts bytes target     prot opt in     out     source               destination

Chain OUTPUT (policy ACCEPT 0 packets, 0 bytes)
 pkts bytes target     prot opt in     out     source               destination

Chain POSTROUTING (policy ACCEPT 0 packets, 0 bytes)
 pkts bytes target     prot opt in     out     source               destination
    0     0 MASQUERADE  all  --  *      *       0.0.0.0/0            0.0.0.0/0
```

We observe that packets arrive in the `PREROUTING` chain (before routing), but do not arrive in the `POSTROUTING` chain (after routing). We think there may be a problem with routing on the gateway. We check if routing is enabled:

```shell-session
root@host:~# sysctl net.ipv4.ip_forward
net.ipv4.ip_forward = 0
```

Indeed, routing is not enabled. To enable routing on the `host` we run the command

```shell-session
root@host:~# sysctl -w net.ipv4.ip_forward=1
net.ipv4.ip_forward = 1
```

We log back into the `red` host and use `ping` to test connectivity to `8.8.8.8`:


```shell-session
root@red:~# ping -c 2 8.8.8.8
PING 8.8.8.8 (8.8.8.8) 56(84) bytes of data.
64 bytes from 8.8.8.8: icmp_req=1 ttl=61 time=92.9 ms
64 bytes from 8.8.8.8: icmp_req=2 ttl=61 time=81.2 ms

--- 8.8.8.8 ping statistics ---
2 packets transmitted, 2 received, 0% packet loss, time 1001ms
rtt min/avg/max/mdev = 81.272/87.094/92.917/5.829 ms
```

Now there is connectivity, which can also be observed by the presence of packets processed by the `POSTROUTING` chain:

```shell-session
root@host:~# iptables -t nat -L POSTROUTING -n -v
Chain POSTROUTING (policy ACCEPT 0 packets, 0 bytes)
 pkts bytes target     prot opt in     out     source               destination
    2   168 MASQUERADE  all  --  *      *       0.0.0.0/0            0.0.0.0/0
```

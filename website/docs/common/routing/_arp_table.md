### ARP table

ARP (Address Resolution Protocol) is a protocol that makes each operating system internal the association between the IP addresses and the MAC addresses of the stations with which it communicates. Often the stations know the IP addresses of their neighbors but do not know the MAC addresses; the ARP protocol populates a system-local ARP table with the necessary entries. The ARP protocol is run by default by the operating system when communicating with a station whose MAC address is unknown.

We aim to trace the ARP table of a Linux system.

:::note
On the host station monitor the ARP table using the command:
```shell-command
root@host:~# ip neighbor show
[...]
```
:::

The table may be empty (no recent communication) or have some entries (most recent communication) or entries marked STALE (unreliable entries).

To populate the ARP table initiate communication with the other stations using the ping command:
```shell-command
root@host:~# ping -c 1 10.10.10.2
PING 10.10.10.2 (10.10.10.2) 56(84) bytes of data.
64 bytes from 10.10.10.2: icmp_req=1 ttl=64 time=0.033 ms
[...]
root@host:~# ping -c 1 10.10.20.2
PING 10.10.20.2 (10.10.20.2) 56(84) bytes of data.
64 bytes from 10.10.20.2: icmp_req=1 ttl=64 time=0.036 ms
[...]
root@host:~# ping -c 1 10.10.30.2
PING 10.10.30.2 (10.10.30.2) 56(84) bytes of data.
64 bytes from 10.10.30.2: icmp_req=1 ttl=64 time=0.080 ms
[...]
```
Watch the ARP table again:
```shell-command
root@host:~# ip neighbor show
10.10.10.2 dev veth-red laddr 00:16:3e:8e:84:21 REACHABLE
10.10.20.2 dev veth-green laddr 00:16:3e:d1:b2:95 REACHABLE
10.10.30.2 dev veth-blue laddr 00:16:3e:32:0f:ae REACHABLE
10.8.0.1 dev eth0 laddr 0a:00:27:00:00:00 REACHABLE
```
Notice that each station (red, green and blue) has a corresponding entry in the ARP table marked REACHABLE (valid entry). The additional input is the communication of the virtual machine (host station) with the fep.grid.pub.ro system.

:::note
Perform the above steps for each of the red, green and blue stations:
1. Follow the ARP table.
2. Initiate communication with the other stations to populate the ARP table.
3. Watch the ARP table again.
:::

Notice that in the ARP table of each of the red, green and blue stations there is an ARP entry corresponding to the host station. This happens because the communications go through the default gateway (ie through the host station) and each station only needs to know the MAC address of the gateway.
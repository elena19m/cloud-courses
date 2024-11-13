### IP Addressing and Routing

We want to achieve connectivity between the red and green stations as well. Since the two stations are on different local networks, we will need to configure the host station as the default gateway on each station.

To add the default gateway on the red station, use the commands:
```shell-command
root@host:~# go red
[...]
root@red:~# ip route add default via 10.10.10.1
```

After configuration (adding the route), we validate the configuration with a specific command. In this case we trace the routing table using the command:
```shell-command
root@red:~# ip route show
default via 10.10.10.1 dev red-eth0
10.10.10.0/24 dev red-eth0 proto kernel scope link src 10.10.10.2
```

:::info
The IP address `10.10.10.1` represents the IP address of the usernet interface on the host station.
:::

:::note
Enter the green station and execute the commands similarly.

Test connectivity by pinging between the green and red stations. Notice that it doesn't work. The reason why there is no connectivity is represented by the fact that the host station does not have routing enabled (it does not send the packets coming from one interface to another interface).

To enable routing on the host station, run the command:
```shell-command
root@host:~# sysctl -w net.ipv4.ip_forward=1
```

To validate the routing enable configuration, we run the command:
```shell-command
root@host:~# sysctl net.ipv4.ip_forward
net.ipv4.ip_forward = 1
```
Test the connectivity between red and green again and see if it works.
:::

:::note
Start the ping command from the red station to the green station.

Open a new terminal and run on the host station the command:
```shell-command
root@host:~# tcpdump -n -i usernet
listening on Ethernet, link-type EN10MB (Ethernet), capture size 65535 bytes
18:46:48.783576 IP red.local > 10.10.20.2: ICMP echo request, id 434, seq 163, length 64
18:46:48.783622 IP 10.10.20.2 > red.local: ICMP echo reply, id 434, seq 163, length 64
```

Notice the ICMP echo request/reply packets that pass through the host station (or in other words the host station routes them).
:::

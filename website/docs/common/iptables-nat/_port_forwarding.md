## Port forwarding

In the exercises so far we have used NAT to allow hosts with private IPs on a local network to access the Internet. NAT can also be used to allow a host on the local network to be accessed from the Internet. This process is called port forwarding.

We want to be able to access the `red` host via SSH from the Internet. This is not possible by default as the `red` host has a private IP address. The solution is to "open a port" on the gateway (i.e. the `host` station) and forward this port (port forwarding) to the port corresponding to the SSH service (TCP port 22) on the `red` station.

We will apply a rule on the `host` station to forward the traffic coming to the host on port 10022 to port 22 (SSH) of the `red` station (IP address 10.10.1.2):

```shell-session
root@host:~# iptables -t nat -A PREROUTING -p tcp --dport 10022 -j DNAT --to-destination 10.10.1.2:22
```

We check the rule by consulting the `PREROUTING` chain in the `NAT` table:

```shell-session
root@host:~# iptables -t nat -L PREROUTING -n -v
Chain PREROUTING (policy ACCEPT 1 packets, 474 bytes)
 pkts bytes target     prot opt in     out     source               destination
    0     0 DNAT       tcp  --  *      *       0.0.0.0/0            0.0.0.0/0            tcp dpt:10022 to:192.168.1.2:22
```

To check that the rule works, from `fep.grid.pub.ro` we open a new terminal and connect via SSH using port 10022 to the `host` station:

```shell-session
user.name@fep:~$ ssh -l student 10.9.X.Y -p 10022
student@10.10.1.2's password:
[...]
student@red:~#
```

We notice that after authentication we are on the `red` host. Port forwarding worked.

Now, let's use SSH to connect to the `host` station from the `green` host:

```shell-session
student@green:~# ssh -l student host -p 10022
[...]
student@red:~#
```

We notice that from the `green` station we can also access the `red` station via port forwarding. We want to limit port forwarding only for connections from the Internet. For this we need to update the port forwarding rule.

**Delete the port forwarding rule and add a new rule that only allows connections from the Internet to port forward to the `red` host.**

:::note
Apply the rule only for packets arriving on the `eth0` interface. Use the `-i` option of `iptables` to specify the incoming interface.
:::

Then perform the SSH connection again on port 10022 of the `host` station from `fep.grid.pub.ro` and the `green` host. If you have configured it correctly, the SSH connection from the `green` host will not work but it will still work from `fep.grid.pub.ro`.

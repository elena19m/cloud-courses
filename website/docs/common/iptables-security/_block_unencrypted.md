## Blocking unencrypted services

<details>
<summary>A brief introduction to iptables (click to expand)</summary>

`iptables` is a Linux utility that also provides a software firewall. iptables uses kernel support to intercept network packets at various points in their passage through the kernel and perform actions on them. Such actions are:
- accepting the packet (`ACCEPT`)
- rejecting the packet (`REJECT`)
- dropping the packet (`DROP`), similar to rejecting but no rejection notification is sent to the origin of the original packet.

The iptables command means working with kernel-level filtering rules. Typically, the following will be specified:
- the type of operation on the rule (add, delete, replace, insert)
- the point in the kernel where the packet must be found for the rule to be applied
- the rule itself

**Example with explanation**:
```bash
iptables -A FORWARD -d green -p tcp --dport telnet -j REJECT
```

- `-A`: add rule (append, add to the end of the rule list);
- `FORWARD`: the rule is applied to packets that will be routed; other variants are `INPUT` (packets received directly by the system) and `OUTPUT` (packets leaving the system);
- `-d green`: packets that have the `green` station address as their destination are selected;
- `-p tcp`: the selected packets are TCP packets;
- `--dport telnet`: the destination TCP port is the specific port for the telnet protocol (i.e. port 23, identified from the `/etc/services` file)
- `-j REJECT`: the packet is rejected

In the `iptables` filter table we will therefore have a list of rules that are traversed sequentially. The `-A FORWARD` part identifies the chain of rules, the `-d green -p tcp --dport telnet` part is the match part (which packets match the rule), and the `-j REJECT` part is the action part (what the rule does with the packet).

</details>

As you noticed in the previous point, traffic for the telnet and FTP protocols is clear, unencrypted traffic, and the credentials of a specific account and the commands run can be easily found.

We propose to block access from the `red` station to the `green` station for these services, configuring the router between the two stations, i.e. the `host` station. Basically we will configure firewall options on the `host` station using the `iptables` utility.

Authenticate as root on the `host` station. To block access to the telnet service (port 23) intended for the `green` station, run the command below on the `host` station. The command adds the appropriate `iptables` rule.

```shell-session
root@host:~# iptables -A FORWARD -d green -p tcp --dport telnet -j REJECT
```

To verify the addition of the above rule, run the command on the host station

```shell-session
root@host:~# iptables -L FORWARD
Chain FORWARD (policy ACCEPT)
target      prot opt ​​source       destination
REJECT      tcp  --  anywhere     green             tcp dpt:telnet reject-with icmp-port-unreachable
```

To display information about the processed packets and the interfaces used, run this command on the `host` station

```shell-session
root@host:~# iptables -L FORWARD -v
Chain FORWARD (policy ACCEPT 0 packets, 0 bytes)
pkts bytes target   prot opt ​​in   out     source      destination
   0     0 REJECT   tcp  --  any  any     anywhere    green             tcp dpt:telnet reject-with icmp-port-unreachable
```

To display information in numeric format (for host names and port names), run on the host station command

```shell-session
root@host:~# iptables -L FORWARD -v -n
Chain FORWARD (policy ACCEPT 0 packets, 0 bytes)
pkts bytes target   prot opt ​​in   out     source      destination
   0     0 REJECT   tcp  --  *    *       0.0.0.0/0   192.168.2.2   tcp dpt:23 reject-with icmp-port-unreachable
```

From now on we recommend using these options (`-v -n`) for listing `iptables` rules.

To verify that telnet traffic to green is blocked, run the command
```bash
telnet green
```

You will see a message like
```text
Trying 192.168.2.2...
telnet: Unable to connect to remote host: Connection refused
```
meaning that the connection is being attempted but the connection is rejected.
To see that the blocking rule worked, run the command

```shell-session
root@host:~# iptables -L FORWARD -v -n
Chain FORWARD (policy ACCEPT 0 packets, 0 bytes)
 pkts bytes target      prot opt ​​in   out     source      destination
    2   120 REJECT      tcp  --  *    *       0.0.0.0/0   192.168.2.2   tcp dpt:23 reject-with icmp-port-unreachable
```
Notice, in the output of the command, that there are now values ​​other than 0 in the `pkts` and `bytes` columns, a sign that there were packets processed by this rule, therefore blocked.

To verify that other connections (other than telnet) from `red` to `green` continue to work, run the following commands on the red station.

```bash
ftp green
ssh -l student green
```

We also want to block the other unencrypted service, FTP. Add a similar `iptables` rule to block, on the `host` station, FTP traffic destined for the `green` station. After adding the rule, use `iptables -L FORWARD -n -v` to validate the addition of the rule.

For this rule, you can pass argument 21 to the `--dport` option or even the ftp name. The association between port (number) and protocol (name) is found in the `/etc/services` file.

From the `red` station, verify that FTP traffic to the `green` station is blocked using the command

```bash
ftp green
```

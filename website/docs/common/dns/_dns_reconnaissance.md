When inspecting the security of a network (pentesting), the first step is to conduct a reconnaissance attack.
Usually, you start by inspecting all the hosts in the target network, their open ports and their services.

:::warning
For this task, you must allow recursive querries from your DNS server.
:::

You can do additional checking on the DNS server.
You can discover new hosts, maybe ones not exposed to the Internet
(i.e. with local network IP addresses) and you can get a better view of the target's network layout.
From there, you can start the next attack step.

Add the following zone to your DNS server:
```
$ cat /etc/bind/db.demoscgc.ro
;
; BIND data file for local loopback interface
;
$TTL	604800
@	IN	SOA	demoscgc.ro. admin.demoscgc.ro. (
			20220310	; Serial
			  604800	; Refresh
			   86400	; Retry
			 2419200	; Expire
			  604800 )	; Negative Cache TTL
;

; NS records
	IN	NS	ns1.demoscgc.ro.
	IN	NS	ns2.demoscgc.ro.

; MX records
	IN	MX	42	mail.demoscgc.ro.
	IN	MX	60	mail2.demoscgc.ro.

; A records
ns1.demoscgc.ro.		IN	A	192.168.100.11
ns2.demoscgc.ro.		IN	A	192.168.100.2
www.demoscgc.ro.		IN	A	192.168.100.1
mail.demoscgc.ro.		IN	A	192.168.100.3
mail2.demoscgc.ro.		IN	A	192.168.100.4
blog.demoscgc.ro.		IN	A	192.168.100.5
internal.demoscgc.ro.		IN	A	192.168.100.6
vmware.demoscgc.ro.		IN	A	192.168.100.7
ftp.demoscgc.ro.		IN	A	192.168.100.8
support.demoscgc.ro.		IN	A	192.168.100.9


transfer	IN	CNAME	ftp
vlog		IN	CNAME	blog
intranet	IN	CNAME	internal
```

Don't forget to add another zone to the `/etc/bind/named.conf.local` file.

Restart `bind`.

Install `dnsrecon` on the base VM:
```
$ sudo apt install dnsrecon
```

Start a scan over your DNS Server:
```
$ dnsrecon -d demoscgc.ro -n 192.168.100.11 -t std,brt
[*] Performing General Enumeration of Domain:demoscgc.ro
[-] DNSSEC is not configured for demoscgc.ro
[-] Error while resolving SOA record.
[*] 	 NS ns1.demoscgc.ro 192.168.100.11
[-] 	 Recursion enabled on NS Server 192.168.100.11
[*] 	 Bind Version for 192.168.100.11 b'9.16.22-Debian'
....
```

`dnsrecon` scans your DNS server and extract different information such as:
 * if you have DNSSEC
 * if your nameserver allows recursion
 * your bind version
 * NS entries
 * mail servers
 * searches against commonly used subdomain name

Run `dnsrecon -h` for more details.

:::warning
The scan will take a while. You can let it run and continue with other tasks.
:::

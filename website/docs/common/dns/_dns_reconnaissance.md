When inspecting the security of a network (pentesting), the first step is to conduct a reconnaissance attack.
Usually, you start by inspecting all the hosts in the target network, their open ports and their services.

You can do additional checking on the DNS server.
You can discover new hosts, maybe ones not exposed to the Internet
(i.e. with local network IP addresses) and you can get a better view of the target's network layout.
From there, you can start the next attack step.

Add the following zone to your DNS server:
```dns-zone
;
; BIND data file for local loopback interface
;
$TTL	604800
@	IN	SOA	scgc.ro. admin.scgc.ro. (
			20220310	; Serial
			  604800	; Refresh
			   86400	; Retry
			 2419200	; Expire
			  604800 )	; Negative Cache TTL
;

; NS records
	IN	NS	ns1.scgc.ro.
	IN	NS	ns2.scgc.ro.

; MX records
	IN	MX	42	mail.scgc.ro.
	IN	MX	60	mail2.scgc.ro.

; A records
ns1.scgc.ro.		IN	A	192.168.1.1
ns2.scgc.ro.		IN	A	192.168.1.2
www.scgc.ro.		IN	A	192.168.1.1
mail.scgc.ro.		IN	A	192.168.1.3
mail2.scgc.ro.		IN	A	192.168.1.4
blog.scgc.ro.		IN	A	192.168.1.5
internal.scgc.ro.	IN	A	192.168.1.6
vmware.scgc.ro.		IN	A	192.168.1.7
ftp.scgc.ro.		IN	A	192.168.1.8
support.scgc.ro.	IN	A	192.168.1.9


transfer	IN	CNAME	ftp
vlog		IN	CNAME	blog
intranet	IN	CNAME	internal
```

Install `dnsrecon` on the host:
```
$ sudo apt install dnsrecon
```

Start a scan over your DNS Server:
```
$ dnsrecon -d scgc.ro -n 192.168.1.1 -t std,brt
[*] Performing General Enumeration of Domain:scgc.ro
[-] DNSSEC is not configured for scgc.ro
[-] Error while resolving SOA record.
[*] 	 NS ns1.scgc.ro 192.168.1.1
[-] 	 Recursion enabled on NS Server 192.168.1.1
[*] 	 Bind Version for 192.168.1.1 b'9.16.22-Debian'
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
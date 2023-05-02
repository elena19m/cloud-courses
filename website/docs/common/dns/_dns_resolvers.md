In this task we will examine how we ca use two DNS resolvers to query DNS servers.
The two DNS resolvers we will use are **`host`** and **`dig`**.

```shell-session
root@dns:~# apt update
[...]
root@dns:~# apt install host dnsutils
[...]
```

### host
Next, we find out the IP address of a website using **host**.
```shell-session
root@dns:~# host acs.pub.ro
acs.pub.ro has address 141.85.227.151
acs.pub.ro mail is handled by 10 mx.acs.pub.ro.
```

We can see from this output DNS records, such as NS(name server), MX(mail server), AAAA(IPv6 address), SOA(start of authority).

For more information, we can use the `-v` parameter.
```shell-session
root@dns:~# host -v acs.pub.ro
Trying "acs.pub.ro"
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 1805
;; flags: qr aa rd ra; QUERY: 1, ANSWER: 1, AUTHORITY: 3, ADDITIONAL: 3

;; QUESTION SECTION:
;acs.pub.ro.			IN	A

;; ANSWER SECTION:
acs.pub.ro.		28800	IN	A	141.85.227.151

;; AUTHORITY SECTION:
acs.pub.ro.		28800	IN	NS	ns1.cs.pub.ro.
acs.pub.ro.		28800	IN	NS	ns1.grid.pub.ro.
acs.pub.ro.		28800	IN	NS	ns2.cs.pub.ro.

;; ADDITIONAL SECTION:
ns1.cs.pub.ro.		28800	IN	A	141.85.226.5
ns1.grid.pub.ro.	3600	IN	A	141.85.241.15
ns2.cs.pub.ro.		28800	IN	A	141.85.241.113

Received 154 bytes from 141.85.241.15#53 in 1 ms
Trying "acs.pub.ro"
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 58004
;; flags: qr aa rd ra; QUERY: 1, ANSWER: 0, AUTHORITY: 1, ADDITIONAL: 0

;; QUESTION SECTION:
;acs.pub.ro.			IN	AAAA

;; AUTHORITY SECTION:
acs.pub.ro.		28800	IN	SOA	ns1.cs.pub.ro. admin.acs.pub.ro. 2017120701 28800 7200 604800 86400

Received 77 bytes from 141.85.241.15#53 in 0 ms
Trying "acs.pub.ro"
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 755
;; flags: qr aa rd ra; QUERY: 1, ANSWER: 1, AUTHORITY: 3, ADDITIONAL: 4

;; QUESTION SECTION:
;acs.pub.ro.			IN	MX

;; ANSWER SECTION:
acs.pub.ro.		1	IN	MX	10 mx.acs.pub.ro.

;; AUTHORITY SECTION:
acs.pub.ro.		28800	IN	NS	ns1.grid.pub.ro.
acs.pub.ro.		28800	IN	NS	ns1.cs.pub.ro.
acs.pub.ro.		28800	IN	NS	ns2.cs.pub.ro.

;; ADDITIONAL SECTION:
mx.acs.pub.ro.		28800	IN	A	141.85.227.151
ns1.cs.pub.ro.		28800	IN	A	141.85.226.5
ns1.grid.pub.ro.	3600	IN	A	141.85.241.15
ns2.cs.pub.ro.		28800	IN	A	141.85.241.113

Received 173 bytes from 141.85.241.15#53 in 2 ms
```

In order to request a specific record we can use the `-t` parameter and the record we want.
```shell-session
root@dns:~# host -t ns acs.pub.ro
acs.pub.ro name server ns2.cs.pub.ro.
acs.pub.ro name server ns1.cs.pub.ro.
acs.pub.ro name server ns1.grid.pub.ro.
root@dns:~# host -t mx acs.pub.ro
acs.pub.ro mail is handled by 10 mx.acs.pub.ro.
root@dns:~# host -t soa acs.pub.ro
acs.pub.ro has SOA record ns1.cs.pub.ro. admin.acs.pub.ro. 2017120701 28800 7200 604800 86400
```

**host** will query the DNS servers from `/etc/resolv.conf`. If we want to query a specific DNS server, we can use host as such:
```shell-session
root@dns:~# host acs.pub.ro 8.8.8.8
Using domain server:
Name: 8.8.8.8
Address: 8.8.8.8#53
Aliases:

acs.pub.ro has address 141.85.227.151
acs.pub.ro mail is handled by 10 mx.acs.pub.ro.
```

### dig
Now use **dig** to get the detailed information, the IP address and specific records for a website.
Also, use dig to query the Google DNS server `8.8.8.8`.

:::important
It is noteworthy, that dig and host do not use `/etc/nsswitch.conf` for querying
DNS servers and they do not use the system's DNS resolver, which is usually a library.
We can see this from the following commands:

```shell-session
root@dns:~# strace -e openat host acs.pub.ro
[...]
openat(AT_FDCWD, "/etc/resolv.conf", O_RDONLY)      = 6
acs.pub.ro has address 141.85.227.151
acs.pub.ro mail is handled by 10 mx.acs.pub.ro.
[...]
root@dns:~# strace -e openat ping -c 1 acs.pub.ro
[...]
openat(AT_FDCWD, "/etc/resolv.conf", O_RDONLY|O_CLOEXEC) = 4
openat(AT_FDCWD, "/etc/resolv.conf", O_RDONLY|O_CLOEXEC) = 4
openat(AT_FDCWD, "/etc/nsswitch.conf", O_RDONLY|O_CLOEXEC) = 4
[...]
openat(AT_FDCWD, "/etc/host.conf", O_RDONLY|O_CLOEXEC) = 4
openat(AT_FDCWD, "/etc/hosts", O_RDONLY|O_CLOEXEC)  = 4
openat(AT_FDCWD, "/etc/ld.so.cache", O_RDONLY|O_CLOEXEC) = 4
openat(AT_FDCWD, "/lib/x86_64-linux-gnu/libnss_dns.so.2", O_RDONLY|O_CLOEXEC) = 4
openat(AT_FDCWD, "/lib/x86_64-linux-gnu/libresolv.so.2", O_RDONLY|O_CLOEXEC) = 4
PING acs.pub.ro (141.85.227.151) 56(84) bytes of data.
openat(AT_FDCWD, "/etc/hosts", O_RDONLY|O_CLOEXEC)  = 4
64 bytes from acs.pub.ro (141.85.227.151): icmp_seq=1 ttl=62 time=0.688 ms

--- acs.pub.ro ping statistics ---
1 packets transmitted, 1 received, 0% packet loss, time 0ms
rtt min/avg/max/mdev = 0.688/0.688/0.688/0.000 ms
```

We can see that host will use the `/etc/resolv.conf` file directly,
while the ping command reads the resolver configuration first:
the `/etc/nsswitch.conf` and the `/etc/resolv.conf` file are opened and then
calls are made to the resolving library (`libresolv.so.2`).

:::

We now want to configure the `lab1.scgc.ro` on the helper server that will work as a slave DNS server
(replace with your last name instead of scgc).
This domain will be transfered from the master (dns VM) to the slave (helper VM) (DNS zone transfer).
In order to correctly configure a zone transfer, we must follow these steps:
  - We setup a new DNS domain on the master VM for `lab1.scgc.ro`.
  - We install a DNS server on the helper VM.
  - We transfer the `lab1.scgc.ro` domain from the dns VM to the helper VM.

### Setup master DNS server

Configure a new DNS zone on the dns VM similarly to the previous one,
which will answer for queries about `lab1.scgc.ro`.
Your DNS zone must have at least an A record and a NS record for this exercise.

### Zone transfer

The helper VM has a Centos 7 operating system, which has some differences in the setup of the DNS server.

To install **BIND** use the following command:
```
yum install bind
```

On Red-Hat-based distributions bind will have the following characteristics:
  * Service name: `named`.
  * Main configuration and zone names file: `/etc/named.conf`.
  * Default zone file location: `/var/named`.

In order to transfer the zone from the master DNS server, we need to make the following configurations:
  * on the dns VM add the following line in the `/etc/bind/named.conf.local` file for the zone created in the preceding subtask:
```
    allow-transfer { 192.168.100.12; }; // replace with the slave VM IP address
```
  * on the helper VM
```
zone "lab1.scgc.ro." {
    type slave;
    file "/var/named/slaves/db.lab1.scgc.ro"; //the zone file
    masters { 192.168.100.11; }; //replace with the master VM IP address
};
```

:::important
Do **not** create the zone file. This file will be created by bind when the zone will be transferred.

:::

After making these configurations restart both servers.
:::note
To restart the **named** service on Centos, use the following command:
```
systemctl restart named.service
```

:::

To check that everything went well you can check the status on the helper VM:
```
[root@helper ~]# systemctl status named.service
named.service - Berkeley Internet Name Domain (DNS)
   Loaded: loaded (/usr/lib/systemd/system/named.service; disabled)
   Active: active (running) since Ma 2018-02-27 14:20:06 UTC; 15min ago
  Process: 20538 ExecStop=/bin/sh -c /usr/sbin/rndc stop > /dev/null 2>&1 || /bin/kill -TERM $MAINPID (code=exited, status=0/SUCCESS)
  Process: 20500 ExecReload=/bin/sh -c /usr/sbin/rndc reload > /dev/null 2>&1 || /bin/kill -HUP $MAINPID (code=exited, status=0/SUCCESS)
  Process: 20549 ExecStart=/usr/sbin/named -u named -c ${NAMEDCONF} $OPTIONS (code=exited, status=0/SUCCESS)
  Process: 20547 ExecStartPre=/bin/bash -c if [ ! "$DISABLE_ZONE_CHECKING" == "yes" ]; then /usr/sbin/named-checkconf -z "$NAMEDCONF"; else echo "Checking of zone files is disabled"; fi (code=exited, status=0/SUCCESS)
 Main PID: 20552 (named)
   CGroup: /system.slice/named.service
           └─20552 /usr/sbin/named -u named -c /etc/named.conf

feb 27 14:20:06 slave named[20552]: zone localhost/IN: loaded serial 0
feb 27 14:20:06 slave named[20552]: zone 1.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.ip6.arpa/IN: loaded serial 0
feb 27 14:20:06 slave named[20552]: all zones loaded
feb 27 14:20:06 slave named[20552]: running
feb 27 14:20:06 slave systemd[1]: Started Berkeley Internet Name Domain (DNS).
feb 27 14:20:06 slave named[20552]: zone lab1.scgc.ro/IN: Transfer started.
feb 27 14:20:06 slave named[20552]: transfer of 'lab1.scgc.ro/IN' from 192.168.100.11#53: connected using 192.168.100.12#57942
feb 27 14:20:06 slave named[20552]: zone lab1.scgc.ro/IN: transferred serial 3
feb 27 14:20:06 slave named[20552]: transfer of 'lab1.scgc.ro/IN' from 192.168.100.11#53: Transfer completed: 1 messages, 5 records, 156 bytes, 0.001 secs (156000 bytes/sec)
feb 27 14:20:06 slave named[20552]: zone lab1.scgc.ro/IN: sending notifies (serial 3)
```

To test that the zone has indeed been transferred you can now query the helper server for the zone which was transferred.
```
[root@helper ~]# host -v lab1.scgc.ro localhost
Trying "lab1.scgc.ro"
Using domain server:
Name: localhost
Address: ::1#53
Aliases:

;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 60555
;; flags: qr aa rd ra; QUERY: 1, ANSWER: 1, AUTHORITY: 1, ADDITIONAL: 1

;; QUESTION SECTION:
;lab1.scgc.ro.			IN	A

;; ANSWER SECTION:
lab1.scgc.ro.		604800	IN	A	192.168.100.11

;; AUTHORITY SECTION:
lab1.scgc.ro.		604800	IN	NS	ns.lab1.scgc.ro.

;; ADDITIONAL SECTION:
ns.lab1.scgc.ro.	604800	IN	A	192.168.100.11

Received 79 bytes from ::1#53 in 1 ms
Trying "lab1.scgc.ro"
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 5264
;; flags: qr aa rd ra; QUERY: 1, ANSWER: 0, AUTHORITY: 1, ADDITIONAL: 0

;; QUESTION SECTION:
;lab1.scgc.ro.			IN	AAAA

;; AUTHORITY SECTION:
lab1.scgc.ro.		604800	IN	SOA	lab1.scgc.ro. root.scgc.ro. 3 604800 86400 2419200 604800

Received 71 bytes from ::1#53 in 0 ms
Trying "lab1.scgc.ro"
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 24490
;; flags: qr aa rd ra; QUERY: 1, ANSWER: 0, AUTHORITY: 1, ADDITIONAL: 0

;; QUESTION SECTION:
;lab1.scgc.ro.			IN	MX

;; AUTHORITY SECTION:
lab1.scgc.ro.		604800	IN	SOA	lab1.scgc.ro. root.scgc.ro. 3 604800 86400 2419200 604800

Received 71 bytes from ::1#53 in 0 ms
```

The command has to produce similar output when run on the dns VM.


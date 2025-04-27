## Observing NATed packets (TCP)

We want to track the contents of TCP packets before and after address translation. In addition to the above exercise, we also want to track ports. For this we will generate TCP (HTTP) packets using `wget` on the `red` host and capture the packets using `tcpdump` on the `host` station.

On the `host` station, capture HTTP packets on all interfaces that have `cs.pub.ro` as destination address.

Use the following command:

```shell-session
root@host:~# tcpdump -n -i any ip dst host cs.pub.ro and tcp dst port 80
```

On the `red` host use `wget` to get the page from `cs.pub.ro`.

Watch the translation of the source IP address and source port in the packet capture performed with `tcpdump` on the host.

Notice in the capture that the source port chosen by the `red` host is the same as the one used after translation by the `host` station. NAT implementations will generally keep the port after translation. In the rare case that that port is busy on the `host` station (possibly due to another translation) another port will be assigned.

Do the same, but capture both outgoing and incoming traffic to/from `cs.pub.ro` port 80.


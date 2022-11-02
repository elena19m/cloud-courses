## Linux Virtual Server (LVS)

[Linux Virtual Server (LVS)](http://www.linuxvirtualserver.org/) is an advanced,
open source load balancing solution. It is also integrated in the Linux kernel.
The IP virtual server that we will present in this section is an extension of
LVS and is a transport-layer load balancer. This type of load balancer is also
known as a Layer 4 LAN switch, since it does not use application layer
information.

In LVS terminology, the load balancing server is called the Director, whereas
the machines that respond to requests are named Real Servers (RS). A client will
access the service exclusively using the address of the director.

LVS has [three operation modes](http://www.linuxvirtualserver.org/how.html):
  * **LVS-NAT** - the director performs NAT for the real servers. It is useful
when the RSs do not have public IP addresses and are part of the same network.
It does not scale well because the entire traffic must go through the director;
  * **LVS-TUN** - the director tunnels the client packets and the real servers
communicate directly with the client. It scales better than LVS-NAT because
only the client traffic goes through the director, but it requires implementing
a tunneling configuration on the real servers;
  * **LVS-DR** - the director routes the packets towards the real servers
without tunneling and the real servers communicate with the client directly. It
removes the tunneling prerequisite, but both the director and the real servers
must have their network interfaces in the same LAN. Additionally, the real
servers must be able to answer requests sent to the director, since the request
destination addresses are not overwritten.


## LVS-DR (direct routing)

An HTTP service will be load balanced. The `nginx` web server is already
installed on the real servers. The director will split the client requests to
the two real servers.

To manage the IP virtual server, you must first install the `ipvsadm` package on
the director system.

```bash
student@load-balancer:~$ sudo apt update
student@load-balancer:~$ sudo apt install ipvsadm
```

We will first configure a virtual address on the director machine. We will add
the `192.168.100.251/24` address on the `eth0:1` sub-interface on the
`load-balancer` machine.

```bash
student@load-balancer:~$ sudo ip addr add dev eth0 192.168.100.251/24 label eth0:1
```


### Configure IPVS in DR mode

We will configure the HTTP service as a virtual service. To do this, we need to
specify the virtual address, port and transport protocol used (TCP, in our
case). The following command creates a service (the `-A` parameter) that
handles requests coming to the `192.168.100.251` IP address on TCP port 80:

```bash
student@load-balancer:~$ sudo ipvsadm -A -t 192.168.100.251:80
```

Once the virtual service has been configured, we can also add the real servers:

```bash
student@load-balancer:~$ sudo ipvsadm -a -t 192.168.100.251:80 -r 192.168.100.72:80 -g
student@load-balancer:~$ sudo ipvsadm -a -t 192.168.100.251:80 -r 192.168.100.73:80 -g
```

In the commands above we add the real servers (with IP addresses
`192.168.100.72` and `192.168.100.73`) to the service that was created on
`192.168.100.251:80`. Routing will be done in direct route (DR) mode (set using
the `-g` parameter).

We also need to make the real servers answer to requests that are meant for the
virtual address. There are two ways of achieving this:
  * configure the virtual address on a loopback interface on the real servers. A
disadvantage of doing this is that the real servers might respond to ARP
messages that are actually meant for the director. This issue is known as the
[ARP problem](http://www.austintek.com/LVS/LVS-HOWTO/HOWTO/LVS-HOWTO.arp_problem.html);
  * configure an `iptables` rule that causes the real server to accept packets
even though the virtual address is not configured on any interface. We will use
this approach.

```bash
student@real-server-1:~$ sudo iptables -t nat -A PREROUTING -d 192.168.100.251 -j REDIRECT
student@real-server-2:~$ sudo iptables -t nat -A PREROUTING -d 192.168.100.251 -j REDIRECT
```

The virtual service is now completely configured and we can use it.

:::note Test the service
To test the functionality, fetch the HTTP page from `192.168.100.251`. Download
the page repeatedly and notice how the service behaves.
:::

We can use `tcpdump` to start a capture of the packets that traverse the
`virbr-labs` bridge on the host, with link-level header inspection (the `-e`
parameter). You could optionally add the `-A` parameter to also print the packet
bodies.


```bash
student@lab-lb-host:~/work$ sudo tcpdump -i virbr-labs -e
```

:::note Note IP and MAC addresses
Check the IP and MAC addresses of the packets:
  * sent from the client towards the director;
  * sent from the director towards the real servers;
  * replied by the real servers.
:::

The configuration of the virtual server can be inspected using the `-l`
parameter:

```bash
student@load-balancer:~$ sudo ipvsadm -l
IP Virtual Server version 1.2.1 (size=4096)
Prot LocalAddress:Port Scheduler Flags
  -> RemoteAddress:Port           Forward Weight ActiveConn InActConn
TCP  192.168.100.251:http wlc
  -> lab-lb-2:http                Route   1      0          0
  -> lab-lb-3:http                Route   1      0          0
```

A list of connections that are managed by the virtual server can be obtained
using the `-c` parameter:

```bash
student@load-balancer:~$ sudo ipvsadm -l -c
```


### Adding a connection threshold

We can update the basic configuration to change the server's behaviour.

Edit the configuration to set a maximum number of connections redirected towards
each real server. Set the limit to **three** for each server.

:::tip
The edit command is similar to the one that added the real servers,
but the `-a` parameter is changed to `-e`. You must add the proper parameter to
set the connection threshold.
:::

:::note Check how connections are handled
Start a large number of connections (e.g., using a `for` loop) and see how the
servers respond to the requests.
:::

For real servers with different hardware configurations, a different number of
maximum connections can be configured. Alternatively, we can use different
types of schedulers (e.g., weighted round-robin with different weights for each
server).


### Cleanup

To delete the service, use the `-D` parameter:

```bash
student@load-balancer:~$ sudo ipvsadm -D -t 192.168.100.251:80
```

You must also delete the iptables rules on the real servers:

```bash
student@real-server-1:~$ sudo iptables -t nat -F
student@real-server-2:~$ sudo iptables -t nat -F
```


## LVS-TUN (tunneling)

For this task we will configure the IP virtual server in tunneling mode.


### Configure IPVS in TUN mode
Similar to the previous task, configure the virtual service on the director and
add the real servers in tunneling mode.

:::tip
You must replace the `-g` parameter.
:::

As mentioned before, when using the tunneling mode we must configure a tunnel
interface on both real servers. The tunnel interface's IP address must be the
same as the IP address of the director.

To create an IP-IP tunnel interface on the first real server you can use the
following command:

```bash
student@real-server-1:~$ sudo ip tunnel add tun0 mode ipip local 192.168.100.72
```

Create a tunnel interface on the second real server. Make sure to set the
correct local IP address. After creating the interfaces, add the director's IP
address (`192.168.100.251/24`) on the tunnel interfaces and activate them on
both servers.

:::warning
When adding the IP address to the IP-IP tunnel, make sure to set a metric of
`32768` (or larger than the `100` used for the `eth0` interface). Otherwise, the
server will prefer using the tunnel for the `192.168.100.0/24` network and will
become inaccessible.

If you have set the wrong metric, you can reboot the virtual machine using
`virsh reboot lab-vm-X`. Alternatively, you can access its console using VNC and
removing the tunnel.
:::

:::note Check how connections are handled
Check how connections are handled using `tcpdump`. Compare the connections
handling to how connections were handled in direct routing mode.
:::


### Cleanup

Remove the service on the director and the tunnel interfaces on the real
servers.

```bash
student@real-server-1:~$ sudo ip tunnel del tun0
student@real-server-2:~$ sudo ip tunnel del tun0
```

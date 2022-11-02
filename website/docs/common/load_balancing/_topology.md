## Load balance topology

![Topology](./assets/lb_topology_light.svg#light)![Topology](./assets/lb_topology_dark.svg#dark)

The machines in the topology (the three KVM machines and the host) have the
following roles:
  * **load-balancer** is the director. It handles the load balancing for the
other two virtual machines (the real servers);
  * **real-server-1** and **real-server-2** are the real servers;
  * the host is the client that requests data from the servers.

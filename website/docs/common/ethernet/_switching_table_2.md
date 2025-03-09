## The switching table reloaded

:::info
[Download the topology by clicking here](assets/switching_table_2.pkt)
:::

### Switching table analysis

We want to trace the contents of the switching table in a scenario with 2 switches. 2 computers are connected to each switch.

Load the topology file into Packet Tracer and wait for the switches to run STP. After STP converged, the ports of the switches will be colored green.

Send packets between any 2 computers on the network and view the switching table on both switches. Notice that a port can have multiple MAC addresses associated with it.

The port of one switch that links to the other switch contains three MAC addresses:

* the MAC address of the port of the other switch
* the MAC addresses of the hosts connected to the other switch

### Removing equipment

Display the switching table of `Switch0` and note the port associated with the MAC address of host `PC1`.

Disconnect the `PC1` host from the network by pressing the green light on its link to `Switch0` followed by the Escape key (another way to delete a link can be achieved by using the "X" button on the right, followed by pressing the item to be deleted).

After unplugging the computer, watch the switching table and note the loss of the related entry.

### Reconnecting equipment

Use a Copper Straight-Through cable to connect the `PC1` host to the other available port of the `Switch0` switch (different from the initial one).

After STP converges on the switch, send a packet between `PC1` and `PC0`.

Note the populating of the switching table with a new entry corresponding to the MAC address of host `PC1`. A MAC address cannot appear twice in a switch's switching table.

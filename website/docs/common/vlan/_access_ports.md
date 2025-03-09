## Access ports

:::info
[Download the topology by clicking here](assets/vlan_access.pkt)
:::

In the topology there is a network with a switch, a management host and 4 other hosts (`PC1`, `PC2`, `PC3`, `PC4`) for users. Notice that the hosts can communicate with each other.

We want to isolate `PC1` and `PC3` from the other hosts (`PC2` and `PC4`) so that `PC1` can only communicate with `PC3`.

This can be accomplished by configuring the ports associated with `PC1` and `PC3` to be part of VLAN 10 and the ports associated with `PC2` and `PC4` to be part of VLAN 20.


:::info
After creating the VLANs in the switch database, configure the ports to be part of these VLANs as follows:

* Fa1/1 - `PC1` - VLAN 10
* Fa2/1 - `PC2` - VLAN 20
* Fa6/1 - `PC3` - VLAN 10
* Fa3/1 - `PC4` - VLAN 20

Check the connectivity between each pair of hosts. Note that hosts in the same VLAN can communicate with each other.
:::

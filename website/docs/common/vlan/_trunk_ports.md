## Trunk ports

:::info
[Download the topology by clicking here](assets/vlan_trunk.pkt)
:::

On the given topology from exercise 03, make a fiber optic link between the switches `Switch0` and `Switch1` on the Fa4/1 port of each switch.

Test connectivity between hosts in the same VLAN but different switches. Notice that there is no connectivity because there is no mechanism enabled for VLANs on different switches to communicate with each other.

To enable connectivity between hosts that are in the same VLAN but connected through different switches, we need to configure the link between the switches in trunk mode.

This link allows the encapsulation of packets with different VLANs.

Identify the interconnect port number on each of the switches. On each switch, enter the appropriate interface and set the link to trunk mode.


:::info
On `Switch0`, configure the Fa4/1 interface in trunk mode and allow access to all VLANs.

On `Switch1` configure the Fa4/1 interface in trunk mode and allow access to all VLANs.

:::

Investigate the trunk configuration on both switches.

Notice that the Fa4/1 interface is a trunk interface that carries VLANs 1 (the default), 10, and 20. In the case of `Switch0` it also transfers the management VLAN (100).

Verify that hosts in the same VLAN can communicate with each other regardless of which switch they are interconnected to.

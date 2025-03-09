## Cascading trunk ports

:::info
[Download the topology by clicking here](assets/vlan_trunk_2.pkt)
:::

We want to build virtual local area networks (VLANs) on a multi-switch topology. We will use trunk links between the switches.

The topology contains 4 hosts (`PC0`, `PC1`, `PC2`, `PC3`) and three switches (`Switch0`, `Switch1`, `Switch2`).

The four hosts already have their IP addresses configured and must be two by two in VLANs:

VLAN 10: `PC0` and `PC2`

VLAN 20: `PC1` and `PC3`

First, after STP converges, check the connectivity between all four hosts.

With no VLAN configurations made on the switches, the hosts can communicate with each other.


:::info
Configure the switches so that the hosts can only communicate within their own VLAN (have Layer 2 separation).

Note that all VLANs (10 and 20) must be created on all switches.

Verify by forwarding packets between any two hosts.
:::

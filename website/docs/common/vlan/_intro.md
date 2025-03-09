## VLANs intro

:::info
[Download the topology by clicking here](assets/vlan_intro.pkt)
:::

Virtual Local Area Networks (VLANs) are ways of logically separating a local area network (LAN) into multiple subnets on the same physical infrastructure.

Separation is accomplished at the Data Link level by inserting an additional field in the level 2 header. VLANs are identified within the frame by a VLAN ID.

Configuration of VLANs is performed on the switches, specifically on the switch interfaces/ports.

Hosts are not aware of the existence of VLANs; their perspective is that of a local area network, i.e. the virtual network related to a VLAN ID. A host will find itself in the VLAN specific to the port to which it is connected (existing configuration on the switch).

In the topology, hosts `PC0` and `PC2` belong to VLAN 10, and hosts `PC1` and `PC3` to VLAN 20. Notice that they can only communicate two by two, although their IP addresses are in the same address space.

The configuration of the two VLANs was performed on the `Switch0` switch.

In order to check the VLAN configuration on `Switch0`, click on it, select the `Config` tab in the new window then `VLAN Database` in the side panel.

Also, for each interface, you will see a line for VLAN configuration, specifically the type of port (access or trunk) and the allowed VLANs.

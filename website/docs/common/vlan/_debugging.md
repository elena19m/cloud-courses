## Debugging VLANs

:::info
[Download the topology by clicking here](assets/vlan_debugging.pkt)
:::

We plan to discuss how we troubleshoot problems in working with VLANs.

The topology contains five hosts that are in two VLANs, as follows:

* hosts `PC0`, `PC1` and `PC3` are in VLAN 10
* hosts `PC2`, `PC4` are in VLAN 20


:::info
Check why there is no connectivity between hosts `PC0` and `PC1`, even though they are connected to the same switch. Investigate `Switch0`.

Check why there is no connectivity between hosts `PC2` and `PC4`. Investigate the configuration for the trunk VLAN on `Switch1`.
:::

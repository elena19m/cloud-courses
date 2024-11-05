### Advanced VLSM

- A company receives the address space 45.67.89.0/24 to use internally. The company defines its topology as shown in the image below.

<p align="center">
    <img src="../../basic/assets/img/advanced-vlsm.svg" alt="Advanced VLSM"/>
</p>

<!--
This does not align the image in the center
![VLSM Topology](./assets/img/advanced-vlsm.svg)
-->

- The topology contains 5 networks:
    - Network A: between routers R1 and R2 (two addresses)
    - Network B: between routers R1 and R3 (two addresses)
    - Network C: created around switch Sw1, connected to router R1, containing 45 hosts
    - Network D: created around switch Sw2, connected to router R2, containing 45 hosts
    - Network E: created around switch Sw3, connected to router R3, containing 45 hosts

<!-- -->

:::note
- Perform an address space distribution using VLSM within the five networks.
- Specify the addresses for the routers. For networks C, D, and E, allocate the first address in the network to the router.
:::

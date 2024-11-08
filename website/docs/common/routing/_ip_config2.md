### Configuring IP addresses

We want to have connectivity between the red station and the host station, respectively between the green station and the host station. For this, we will configure IP addresses on each.

:::note
Configure one `10.10.10.0/24` class IP address on the link between the red station and the host station (that is, the link red(red-eth0) ↔ host(veth-red)) and test the connectivity.

Configure one `10.10.20.0/24` class IP address each on the link between the green station and the host station (ie link `green(green-eth0)` ↔ `host(veth-green)`) and test the connectivity.
:::

:::caution
Consider checking the Data Link level using the ip link command and enabling the interfaces as needed.
:::

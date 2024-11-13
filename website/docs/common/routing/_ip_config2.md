### Configuring IP addresses

We want to have connectivity between the red station and the host station, respectively between the green station and the host station. For this, we will configure IP addresses on each. For the conenctivity between host and red, you already configured it in the previous exercise.

:::note
Configure one `10.10.20.0/24` class IP address each on the link between the green station and the host station (ie link `green(green-eth0)` ↔ `host(usernet)`) and test the connectivity.
:::

:::caution
Consider checking the Data Link level using the ip link command and enabling the interfaces as needed.
:::

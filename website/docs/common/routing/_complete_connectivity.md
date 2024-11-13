### Complete connectivity setup

We want to ensure full connectivity between all stations in the topology. The blue station must be configured accordingly.

:::note
Configure class `10.10.30.0/24` IP addresses on the link between the host station and the blue station (ie between host(usernet) and blue(blue-eth0)).
:::

:::info
Be sure to check the layer 2 link using the ip link command.
:::

:::note
Test the connectivity between the host station and the blue station.

On the blue station, configure the host station as the default gateway, to allow connectivity to the other stations.
:::tip
On the blue station, use as default gateway the IP address on the usernet interface of the host station.
:::

:::note
Test connectivity between any two stations.
:::

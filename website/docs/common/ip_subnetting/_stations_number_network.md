### Number of Stations in the Network

The subnet mask separates the network part from the host part. The number of bits for the host part reflects the possible IP addresses for hosts.

However, two of these addresses cannot be assigned to hosts (they cannot be configured on hosts). These are the first IP address in the space and the last IP address in the possible space.

The first IP address in the address space contains only 0 bits for the host part and is the **network address**.

The last IP address in the address space contains only 1 bits for the host part and is the **broadcast address**.

If we have a subnet mask of /24, which means 8 bits (32-24) for the host part, we will have a possible space of `2^8 = 256 addresses`. Out of these addresses, 2 are unusable (the network address and the broadcast address), so we will have 254 assignable addresses. In general, if we have N bits allocated for the host part, we will have `2^𝑁 − 2` assignable addresses.

:::note Answer the questions below:
1. How many assignable addresses are there in the network `10.10.0.0/16`?
2. How many assignable addresses are there in the network `15.16.192.0/20`?
3. How many assignable addresses are there in the network `1.2.3.4/30`?
4. What is the subnet mask of the smallest network that can encompass 25 assignable addresses?
5. What is the subnet mask of the smallest network that can encompass 62 assignable addresses?
6. What is the subnet mask of the smallest network that can encompass 127 assignable addresses?
:::

### Calculation of Network Address and Broadcast Address

:::note Calculation of Network Address and Broadcast Address
Find the network address and broadcast address for the following tuples of IP addresses and subnet masks:
    1. `192.168.5.14/24`
    2. `192.168.5.14/25`
    3. `10.10.10.0/8`
    4. `172.16.4.254/22`
:::

<!--
IM: I don't think this can be a part of the master course because it relies on Packet Tracer

### 03. Utility of Subnet Mask

**Topologie**:
![download](/rl/labs/03/contents/rl_lab-03_utilitatea_mastii1.pkt)

- The topology contains 3 computers connected through a switch, and IP addresses are configured. After all the connections become active (all the indicator lights turn green), send a packet between any two stations.
- Note that there is no connectivity between station PC1 and the other two stations (PC0 and PC2).

- View the IP addresses and subnet masks configured on each of the stations.
- The reason why packet transmission from `PC1` does not work is that station `PC1` is on a different network compared to stations `PC0` and `PC2`.
- Although it may appear to be in the same network, the subnet mask differs. We will demonstrate this by calculating the network addresses:
    - `PC0`: `172.16.10.10 & 255.255.0.0 (/16)` = `172.16.0.0`
    - `PC1`: `172.16.20.20 & 255.255.255.0 (/24)` = `172.16.20.0`
    - `PC2`: `172.16.30.30 & 255.255.0.0 (/16)` = `172.16.0.0`
- It can be observed that stations PC0 and PC2 are part of the same network, while PC1 is in a different network, as indicated by the subnet mask.

__NOTE__ The membership of an IP address to a network can only be determined by using both the IP address and the subnet mask. A configuration without a subnet mask is incomplete.
-->

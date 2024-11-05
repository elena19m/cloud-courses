### Working with Bits

-   IP addresses are represented in groups of 8 bits. Therefore, you need good binary skills.

<!-- -->

- When converting a number to binary, it's best to break it down into powers of 2. For example:
    * `17 = 16 + 1 = 2^4 + 2^0`; results in the representation (in 8-bit binary) `00010001`
    * `173 = 128 + 32 + 8 + 4 + 1 = 2^7 + 2^5 + 2^3 + 2^2 + 2^0`; results in the representation (in 8-bit binary) `10101101`

- The ability to quickly represent numbers around powers of 2 is useful. For example:
    - for `64 = 01000000`
        - 63 is 64-1, a number with many bits set to 1 (6 bits): `00111111`
        - 62 is 63-1, a number with one less 1 (5 bits of 1 and one bit of 0): `00111110`
        - 65 is 64+1, adding the last bit of 1 to the representation of 64: `01000001`

:::note Convert the following numbers to 8-bit binary:
127, 80, 72, 254.
:::

### IP Address and Subnet Mask

- We aim to systematize the concepts of IP address, subnet mask, network address, and broadcast address.
- To ensure connectivity, we need a level 3 address, also known as an IP address. Each level 3 device (stations, routers, layer 3 switches) requires IP addresses.

------------------------------------------------------------------------

- In the case of an IP address, we will always configure the following:
    - **IP address** - 4 groups of 8 bits. Example: `192.168.100.200`
    -   **Subnet mask** - 4 groups of 8 bits, starting with the bit 1, with all 1 bits being consecutive; alternation of 0/1 is prohibited. For example, `11111111.00000000.00000000.00000000` is a valid subnet mask, while `11000001.00000000.00000000.00000000` is invalid. To simplify reading the mask, it is written in decimal, similar to the IP address:
        `11111111.00000000.00000000.00000000 = 255.0.0.0.`. Due to the special property of consecutive 1 bits, another form you will find for the subnet mask is the prefix form: /X, where X represents the number of 1 bits:
        `11111111.00000000.00000000.00000000 = 255.0.0.0 = /8`.

<!-- -->

- Starting from the IP address and subnet mask, we can identify two other properties of a network (for illustration, we will use the IP address 192.168.100.200/255.255.255.0):
    - **network address** - obtained by performing a **bitwise AND** between the IP address bits and the subnet mask bits
        - `192.168.100.200 & 255.255.255.0 = 192.168.100.0`
    - **broadcast address** -  obtained by performing a **bitwise OR** between the IP address bits and the bits of the subnet mask's complement (the complement is obtained by inverting the bit values at each position)
        - `192.168.100.200 | 0.0.0.255 = 192.168.100.255`

------------------------------------------------------------------------

- When we know the IP address and subnet mask and want to obtain the network address and broadcast address, it is useful to use the subnet mask to divide the IP address into two:
    - A **subnet part**, which spans as many bits as the subnet mask has 1s. It is 24 bits for a /24 mask (or 255.255.255.0), or 16 bits for a /16 mask (or 255.255.0.0), or 20 bits for a /20 mask (or 255.255.240.0).
    - A **host part** which spans the remaining space (32 - the number of 1 bits of the subnet mask). It is 8 bits for a /24 mask (32-24 = 8), 16 bits for a /16 mask (32-16 = 16), or 12 bits for a /20 mask (32-20 = 12).
- With this division, we will obtain the same values for the address 192.168.100.200/24 as calculated above, as reflected in the figure below.

<p align="center">
    <img src="./assets/img/ip-addr-detailed.png" alt="IP address construction"/>
</p>
<!--
This version doen not align the image in the center
![IP address construction](./assets/img/ip-addr-detailed.png){ width:"400" }
-->

------------------------------------------------------------------------

- Let's obtain the network address and broadcast address for the address `172.16.200.100/20`.
- We convert the address into a hybrid address by placing bits of 0 where the subnet mask is located: in the third octet of the four in the IP address: `172.16.1100|1000.xxxxxxxx`.
- We used the | (pipe) operator to separate the **network part** (the first 20 bits, related to the network) from the host part (the remaining bits (32-20 = 12 bits) related to the station). The bits of the last octet are not relevant for our calculation, so we placed xxxxxxxx in their place.

<!-- -->

- The network address has **all host bits set to 0**, so it will be `172.16.1100|0000.00000000`. Thus, the network address is `172.16.192.0/20`.
- The broadcast address has **all host bits set to 1**, so it will be 172.16.1100|1111.11111111. Thus, the broadcast address is 172.16.207.255/20.

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

### Number of Stations in the Network

- The subnet mask separates the network part from the host part. The number of bits for the host part reflects the possible IP addresses for hosts.
- However, two of these addresses cannot be assigned to hosts (they cannot be configured on hosts). These are the first IP address in the space and the last IP address in the possible space.
- The first IP address in the address space contains only 0 bits for the host part and is the **network address**.
- The last IP address in the address space contains only 1 bits for the host part and is the **broadcast address**.

<!-- -->
- If we have a subnet mask of /24, which means 8 bits (32-24) for the host part, we will have a possible space of `2^8 = 256 addresses`. Out of these addresses, 2 are unusable (the network address and the broadcast address), so we will have 254 assignable addresses.
- In general, if we have N bits allocated for the host part, we will have `2^𝑁 − 2` assignable addresses.

<!-- -->
:::note Answer the questions below:
1. How many assignable addresses are there in the network `10.10.0.0/16`?
2. How many assignable addresses are there in the network `15.16.192.0/20`?
3. How many assignable addresses are there in the network `1.2.3.4/30`?
4. What is the subnet mask of the smallest network that can encompass 25 assignable addresses?
5. What is the subnet mask of the smallest network that can encompass 62 assignable addresses?
6. What is the subnet mask of the smallest network that can encompass 127 assignable addresses?
:::

### Presentation of Subnetting

- In large networks, one starts with an address space provided by an authority and then subnets are created from this space. The subnets will cover different areas/departments. The process of dividing into subnets is called subnetting.
- In its simplest form, the subnets are divided into equal, fixed-size segments.

#### Tutorial

- We will subnet the network 78.78.32.0/22 into 4 subnets.
- In hybrid binary form, the large network address is `78.78.001000|00.00000000/22`. We used the pipe character | to separate the network part from the host part.
- Since we have 4 subnets, we need 2 additional bits for subnetting: 00, 01, 10, 11. This means the subnets will have a mask of /22 + 2 bits = /24. Therefore, each subnet will have `2^8 − 2 = 254 assignable hosts`.

<!-- -->

- The 4 subnets will have the following addresses:
    - `78.78.00100000.00000000/24` = `78.78.32.0/24`
    - `78.78.00100001.00000000/24` = `78.78.33.0/24`
    - `78.78.00100010.00000000/24` = `78.78.34.0/24`
    - `78.78.00100011.00000000/24` = `78.78.35.0/24`

<!-- -->

- The broadcast address for each subnet will be:
    - `78.78.00100000.11111111/24` = `78.78.32.255/24`
    - `78.78.00100001.11111111/24` = `78.78.33.255/24`
    - `78.78.00100010.11111111/24` = `78.78.34.255/24`
    - `78.78.00100011.11111111/24` = `78.78.35.255/24`

<!-- -->

- The first assignable address in each subnet will be:
    - `78.78.00100000.00000001/24` = `78.78.32.1/24`
    - `78.78.00100001.00000001/24` = `78.78.33.1/24`
    - `78.78.00100010.00000001/24` = `78.78.34.1/24`
    - `78.78.00100011.00000001/24` = `78.78.35.1/24`

<!-- -->

- The last assignable address in each subnet will be:
    - `78.78.00100000.11111110/24` = `78.78.32.254/24`
    - `78.78.00100001.11111110/24` = `78.78.33.254/24`
    - `78.78.00100010.11111110/24` = `78.78.34.254/24`
    - `78.78.00100011.11111110/24` = `78.78.35.254/24`

:::note Subnetting Questions
1. How many assignable addresses (that can be associated with a host) are there in a network with a mask of /23?
2. How many bits are needed for the subnet part if we want to create 7 subnets with as many hosts as possible?
3. How many bits are needed for the host part if we want to create as many networks as possible with 7 hosts?
4. Starting from a /22 network, what will be the mask of the new subnets if we want to create 6 subnets of equal size with as many hosts as possible?
5. Starting from a /22 network, what will be the mask of the new subnets if we want to create as many subnets as possible with 27 hosts?
6. Provide an example of two subnet masks for which the address `78.78.78.159` is a broadcast address, and two subnet masks for which the address `78.78.78.159` is a host address.
:::

:::note Subnetting
- A company has a /24 address space and a router with multiple interfaces.
- The router distributes the address space into 4 subnets with an equal number of hosts.
- Determine the network address and broadcast address of each subnet, as well as the first assignable address and the last assignable address for each subnet: `17.18.19.0/24`
:::

:::note Advanced Subnetting
- A company has a /22 address space and a router with multiple interfaces.
- The router distributes the address space into 6 subnets with an equal number of hosts.
- Determine the network address of each subnet and the last assignable address for each subnet: `17.18.16.0/22`.
:::

### VLSM presentation

- Let’s assume that an institute receives the address space `17.18.19.0/24`. The organizational decision dictates that this space be divided into three subnets for three departments:

1. A: a subnet for 100 hosts
2. B: a subnet for 60 hosts
3. C: a subnet for 50 hosts

------------------------------------------------------------------------

- When performing subnetting using VLSM (Variable Length Subnet Mask), we sort the subnets in descending order based on the number of hosts. We start with the largest subnet and then proceed step by step to the smaller ones.
- The first subnet needs to accommodate 100 hosts, so it requires 7 bits for the host part, resulting in a `/25` mask. We divide the main network into two subnets:
    1. `17.18.19.0/25`
    2. `17.18.19.128/25`
- We allocate the first subnet to the first department: A - 17.18.19.0/25.

<!-- -->

- We then further divide the second subnet (17.18.19.128/25).
- We need to use the remaining space for the other two subnets (B and C) with 60 and 50 hosts, respectively.
- We need 6 bits for the host part of each subnet, which gives us a /26 mask. We divide the new subnet into two subnets:
    1. `17.18.19.128/26`
    2. `17.18.19.192/26`
- We allocate each of the resulting two subnets to the two departments: `B - 17.18.19.128/26` and `C - 17.18.19.192/26`.
-  Since the initial space was divided into subnets with different masks, we call this process *Variable Length Subnet Mask* (VLSM).

<!-- -->

- The process is illustrated in the image below:

<p align="center">
    <img src="./assets/img/vlsm-presentation.png" alt="IP address construction"/>
</p>

<!--
This doen not align the image in the center
![VLSM subnet](./assets/img/vlsm_presentation.png)
-->

:::note VLSM
- A company has a /25 address space and a router with multiple interfaces.
- The router distributes the address space into 3 subnets with the following number of hosts: 54, 27, and 19. Determine these subnets for the following address space: `12.13.14.128/25`.
:::

### Advanced VLSM

- A company receives the address space 45.67.89.0/24 to use internally. The company defines its topology as shown in the image below.

<p align="center">
    <img src="./assets/img/advanced-vlsm.png" alt="IP address construction"/>
</p>

<!--
This does not align the image in the center
![VLSM Topology](./assets/img/advanced_vlsm.png)
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

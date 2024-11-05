### IP Address and Subnet Mask

- We aim to systematize the concepts of IP address, subnet mask, network address, and broadcast address.
- To ensure connectivity, we need a level 3 address, also known as an IP address. Each level 3 device (stations, routers, layer 3 switches) requires IP addresses.

------------------------------------------------------------------------

- In the case of an IP address, we will always configure the following:
    - **IP address** - 4 groups of 8 bits. Example: `192.168.100.200`
    -   **Subnet mask** - 4 groups of 8 bits, starting with the bit 1, with all 1 bits being consecutive; alternation of 0/1 is prohibited. For example, `11111111.00000000.00000000.00000000` is a valid subnet mask, while `11000001.00000000.00000000.00000000` is invalid. To simplify reading the mask, it is written in decimal, similar to the IP address:
        `11111111.00000000.00000000.00000000 = 255.0.0.0.`. Due to the special property of consecutive 1 bits, another form you will find for the subnet mask is the prefix form: /X, where X represents the number of 1 bits:
        `11111111.00000000.00000000.00000000 = 255.0.0.0 = /8`.

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

![IP address construction](./assets/ip-addr-detailed-light.svg#light)![IP address construction](./assets/ip-addr-detailed-dark.svg#dark)

------------------------------------------------------------------------

- Let's obtain the network address and broadcast address for the address `172.16.200.100/20`.
- We convert the address into a hybrid address by placing bits of 0 where the subnet mask is located: in the third octet of the four in the IP address: `172.16.1100|1000.xxxxxxxx`.
- We used the | (pipe) operator to separate the **network part** (the first 20 bits, related to the network) from the host part (the remaining bits (32-20 = 12 bits) related to the station). The bits of the last octet are not relevant for our calculation, so we placed xxxxxxxx in their place.

- The network address has **all host bits set to 0**, so it will be `172.16.1100|0000.00000000`. Thus, the network address is `172.16.192.0/20`.
- The broadcast address has **all host bits set to 1**, so it will be 172.16.1100|1111.11111111. Thus, the broadcast address is 172.16.207.255/20.

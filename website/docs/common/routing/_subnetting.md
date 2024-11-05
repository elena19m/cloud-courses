### Presentation of Subnetting

- In large networks, one starts with an address space provided by an authority and then subnets are created from this space. The subnets will cover different areas/departments. The process of dividing into subnets is called subnetting.
- In its simplest form, the subnets are divided into equal, fixed-size segments.

#### Tutorial

- We will subnet the network 78.78.32.0/22 into 4 subnets.
- In hybrid binary form, the large network address is `78.78.001000|00.00000000/22`. We used the pipe character | to separate the network part from the host part.
- Since we have 4 subnets, we need 2 additional bits for subnetting: 00, 01, 10, 11. This means the subnets will have a mask of /22 + 2 bits = /24. Therefore, each subnet will have `2^8 − 2 = 254 assignable hosts`.

- The 4 subnets will have the following addresses:
    - `78.78.00100000.00000000/24` = `78.78.32.0/24`
    - `78.78.00100001.00000000/24` = `78.78.33.0/24`
    - `78.78.00100010.00000000/24` = `78.78.34.0/24`
    - `78.78.00100011.00000000/24` = `78.78.35.0/24`

- The broadcast address for each subnet will be:
    - `78.78.00100000.11111111/24` = `78.78.32.255/24`
    - `78.78.00100001.11111111/24` = `78.78.33.255/24`
    - `78.78.00100010.11111111/24` = `78.78.34.255/24`
    - `78.78.00100011.11111111/24` = `78.78.35.255/24`

- The first assignable address in each subnet will be:
    - `78.78.00100000.00000001/24` = `78.78.32.1/24`
    - `78.78.00100001.00000001/24` = `78.78.33.1/24`
    - `78.78.00100010.00000001/24` = `78.78.34.1/24`
    - `78.78.00100011.00000001/24` = `78.78.35.1/24`

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

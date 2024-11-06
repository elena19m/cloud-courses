### VLSM presentation

Let’s assume that an institute receives the address space `17.18.19.0/24`. The organizational decision dictates that this space be divided into three subnets for three departments:

1. A: a subnet for 100 hosts
2. B: a subnet for 60 hosts
3. C: a subnet for 50 hosts

------------------------------------------------------------------------

When performing subnetting using VLSM (Variable Length Subnet Mask), we sort the subnets in descending order based on the number of hosts. We start with the largest subnet and then proceed step by step to the smaller ones.

The first subnet needs to accommodate 100 hosts, so it requires 7 bits for the host part, resulting in a `/25` mask. We divide the main network into two subnets:
    1. `17.18.19.0/25`
    2. `17.18.19.128/25`

We allocate the first subnet to the first department: A - 17.18.19.0/25.

We then further divide the second subnet (17.18.19.128/25).

We need to use the remaining space for the other two subnets (B and C) with 60 and 50 hosts, respectively.

We need 6 bits for the host part of each subnet, which gives us a /26 mask. We divide the new subnet into two subnets:
1. `17.18.19.128/26`
2. `17.18.19.192/26`

We allocate each of the resulting two subnets to the two departments: `B - 17.18.19.128/26` and `C - 17.18.19.192/26`.

Since the initial space was divided into subnets with different masks, we call this process *Variable Length Subnet Mask* (VLSM).

The process is illustrated in the image below:

![VLSM subnet](./assets/vlsm-presentation-light.svg#light)![VLSM subnet](./assets/vlsm-presentation-dark.svg#dark)

:::note VLSM
A company has a /25 address space and a router with multiple interfaces.

The router distributes the address space into 3 subnets with the following number of hosts: 54, 27, and 19. Determine these subnets for the following address space: `12.13.14.128/25`.
:::

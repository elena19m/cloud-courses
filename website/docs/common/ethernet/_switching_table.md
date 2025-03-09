## Populating the switching table

:::info
[Download the topology by clicking here](assets/switching_table.pkt)
:::

We want to trace how the switching table is populated. The topology consists of a switch and 4 hosts. Load the topology file into Packet Tracer and wait for the ports to light green instead of orange (wait for STP to converge).

To configure a switch, we usually use the CLI. In this lab we will mostly use the Graphical user Interface (GUI), but some functionality will need CLI access.

To access the CLI of a switch simply select a switch, then select the CLI tab in the new window. Press the `Enter` key on your keyboard once before writing any command.


:::info
In order to show the switching table of a Switch, we will use the following commands:

```bash
enable
show mac-address-table
```

:::

Display the switching table and notice that it is empty.

### The switching table

The switching table contains several columns, two of which are of interest:

* the Mac Address column specifies the MAC address
* the Ports column specifies the switch port

The table is thus an association between a MAC address and a port. We say that the tables have, for each entry:

* a match component - a MAC address is searched for
* an action component - based on the result of the match operation the packet is sent to the corresponding port.

The search part can appear once, the action part several times:

* we can have multiple MAC addresses corresponding to one port
* a MAC address can appear at most once in the switching table.


:::info
Find the name/number of each port of a switch and the MAC address of a host.

Send a packet from PC0 to PC1. Display the switching table again.

:::

Notice the addition of two entries:

* One entry is generated when sending the PC0 packet to PC1 - it contains the MAC address of the PC0 host and the port on which it is connected to the switch
* The second one is generated when returning the packet from PC1 to PC0 - it contains the MAC address of host PC1 and the port on which it, in turn, is connected to the switch.


:::info
Send a packet from PC1 to PC2. Display the switching table again. Why only one entry, not two?

Send a packet from PC2 to PC3. Display the switching table again. What do you notice?
:::

Clear the switching table.


:::info
You can use the `clear mac-address-table` command form the CLI to clear the switching table.
:::



:::info
Enter Simulation mode and send a packet from PC1 to PC3. What do you see? You see a summary of the sent packets in the Event list window.

Send another packet from PC1 to PC3. Why did it behave differently this time? Display the switching table again.
:::

Clear the switching table from the CLI using the `clear mac-address-table` command.


:::info
Enter Simulation mode and send a packet from PC1 to PC3. At each simulation step, view the switch's switching table.
:::

## Allow SSH traffic

At this point, SSH traffic to the `green` station is blocked.

We want to allow SSH traffic from the `red` station to the `green` station. Add a corresponding rule on the `host` station.

After adding the rule, try to make an SSH connection from the `red` station to the `green` station. Notice that the connection is not established.

Display the list of `iptables` rules on the `host` station. Why did the connection fail? Note the order of the displayed rules; they are run sequentially.

To solve the problem, delete the previously entered `iptables` rule and insert the rule on the `host` station. To insert, use the `-I` option of the `iptables` command. Verify that the SSH connection between `red` and `green` will now be established.

To delete a rule you can use the `-D` option.

To insert a rule use the `-I` option followed by the chain name (`INPUT`, `OUTPUT` or `FORWARD`), followed by the index of the position where you want to place the rule (1, 2, 3, …) and then followed by the rule specification.

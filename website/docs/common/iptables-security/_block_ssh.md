## Block SSH

We intend for the `green` station to not be accessible via SSH. To do this, add an `iptables` rule on the `host` station that will block traffic related to the SSH service (port 22).

Verify that the `iptables` rule has been added and then verify that SSH traffic to the `green` station is blocked from the `red` station.

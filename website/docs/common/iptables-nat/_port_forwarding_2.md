## Port forwarding again

We want to access the `green` and `blue` hosts from the Internet/outside via SSH using the `host` station. We'll use:

- port 20022 on the `host` station to port forward to port 22 of the `green` host;
- port 30022 on the `host` station to port forward to port 22 on the `blue` host.

Similar to the previous exercise, perform the necessary configurations for this port forwarding. Verify by connecting from `fep.grid.pub.ro` (Internet/outdoor equivalent) on ports 20022 and 30022 on the `host` station.

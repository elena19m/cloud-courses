## Deleting added rules

To allow all traffic to the `green` station, delete all iptables rules from the `FORWARD` chain on the `host` station. Use the `-F` (flush) option of the `iptables` command. Basically we return to the initial configuration, without `iptables` rules on the `host` station. Use the `iptables -L FORWARD -n -v` command to validate the deletion of the rules from the `FORWARD` chain.

After deleting the rules, check the operation of the telnet, FTP, SSH services by connecting from the `red` to the `green` station.

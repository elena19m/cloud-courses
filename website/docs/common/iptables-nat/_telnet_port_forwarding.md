## Telnet port forwarding

In previous exercises we enabled port forwarding for the SSH service. We want the `red`, `green` and `blue` hosts to be accessible via `telnet` from the Internet as well so:

- `red` can be accessed using port 10023
- `green` can be accessed using port 20023
- `blue` can be accessed using port 30023

Make the necessary configurations to enable port forwarding for `telnet` as described above.

Test from `fep.grid.pub.ro` using the telnet command:

```shell-session
user.name@fep:~# telnet 10.9.X.Y 10023
```

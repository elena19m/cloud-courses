## Observing NATed packets (Port Forwarding)

We will capture SSH traffic initiated from the outside to the `red` host through port 10022 of the `host` station. This is traffic before port forwarding. For this, on the host station we use the command

```shell-session
root@host:~# tcpdump -n -i eth0 tcp dst port 10022
```

On another terminal, also on the `host` station, we capture the traffic after port forwarding, on the `usernet` interface to the SSH port (22) of the `red` host. On the `host` station we use the command

```shell-session
root@host:~# tcpdump -n -i usernet tcp dst port 22
```

In order to generate traffic, connect from `fep.grid.pub.ro` using SSH to the `host` station on port 10022, which will be redirected to port 22 of the `red` host:

```shell-session
user.name@fep:~$ ssh -l student 10.9.X.Y -p 10022
student@red's password:
[...]
student@red:~#
```

In the captures above, we see the IP address and destination port being translated from the `<10.9.X.Y, 10022>` pair to the `<10.10.1.2, 22>` pair.


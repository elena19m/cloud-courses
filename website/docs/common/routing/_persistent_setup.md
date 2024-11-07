### Persistent setup

We want that when resetting a station the level 3 configurations (IP addresses) are preserved. The configurations we have made so far are temporary and are lost when the station is restarted. In Linux, the persistence of configurations is achieved by placing them in specific text files, each distribution (eg: Debian, RedHat) having its own configuration mode.

To prepare the exercise, run the prepare script:
```shell-command
root@host:~# start_lab ip ex9
root@host:~# ip address flush dev veth-red
```

**Persistently** perform the configuration from exercise [IPv6](#IPv6) for the host. The Linux distribution used in the lab is Debian-based.


:::tip
For details on how to make persistent configurations on Debian systems, see this [page](https://wiki.debian.org/NetworkConfiguration#Setting_up_an_Ethernet_Interface). You will make a static configuration.
:::

:::note
After you have made the necessary configurations for red, run on the host:
```shell-command
ifdown veth-red
ifup veth-red
```
:::

:::tip
For information related to enabling routing, see this [page](http://linuxpoison.blogspot.ro/2008/01/how-to-enable-ip-forwarding.html).
:::

:::note
Restart the virtual machine (host station) using the command:
```shell-command
root@host:~# reboot
```

After rebooting you should have enabled configurations and full topology connectivity.
:::

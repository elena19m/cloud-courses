### Persistent setup

We want that when resetting a station the level 3 configurations (IP addresses) are preserved. The configurations we have made so far are temporary and are lost when the station is restarted. In Linux, the persistence of configurations is achieved by placing them in specific text files, each distribution (eg: Debian, RedHat) having its own configuration mode.

To prepare the exercise, run the prepare script:
```shell-command
root@host:~# start_lab ex9
root@host:~# ip address flush dev usernet
```

**Persistently** perform the configuration from exercise [IPv6](#IPv6) for the host. The Linux distribution used in the lab is Ubuntu.


:::tip
For details on how to make persistent configurations on Ubuntu systems, see this [page](https://ubuntu.com/server/docs/configuring-networks#static-ip-address-assignment). You will make a static configuration.
:::

:::note
After you have made the necessary configurations for red, you can test by running the `reboot_vms` command on the host:
```shell-command
root@host:~# reboot_vms
```
:::

:::tip
For information related to enabling routing, see this [page](http://linuxpoison.blogspot.ro/2008/01/how-to-enable-ip-forwarding.html).
:::

## systemd services

Most common Linux distribution now ship with the **systemd** software suite to
manage a services and other system components. The use of systemd provides a
uniform configuration interface across multiple Linux distributions, and allows
configuring service prerequisites and various environment parameters.

We can inspect the status of a service using `systemctl status servicename`.

```shell-session
$ systemctl status ssh
● ssh.service - OpenBSD Secure Shell server
     Loaded: loaded (/lib/systemd/system/ssh.service; enabled; vendor preset: enabled)
     Active: active (running) since Mon 20XX-02-30 00:00:00 UTC; 33min ago
       Docs: man:sshd(8)
             man:sshd_config(5)
    Process: 674 ExecStartPre=/usr/sbin/sshd -t (code=exited, status=0/SUCCESS)
   Main PID: 677 (sshd)
      Tasks: 1 (limit: 1696)
     Memory: 4.9M
     CGroup: /system.slice/ssh.service
             └─677 sshd: /usr/sbin/sshd -D [listener] 0 of 10-100 startups

Feb 30 00:00:00 scgc-services systemd[1]: Starting OpenBSD Secure Shell server...
Feb 30 00:00:00 scgc-services sshd[677]: Server listening on 0.0.0.0 port 22.
Feb 30 00:00:00 scgc-services sshd[677]: Server listening on :: port 22.
Feb 30 00:00:00 scgc-services systemd[1]: Started OpenBSD Secure Shell server.
```

In the service's status command's output we can see a number of useful stats about
the service:

  * whether the service is enabled (i.e., it is automatically started when the
    system boots) - the `enabled;` parameter in the line starting with `Loaded`;
  * the time the service has started and how long it has been running;
  * what processes and how many are in the service's control group;
  * the last few lines output by the service to its output or standard error.


### Changing the state of services

You can start and stop a service using `systemctl start servicename` and
`systemctl stop servicename`, respectively.

:::note Stop the SSH service
Try stopping the `ssh` service. What do you observe? Try connecting to the
virtual machine again. What happens if you reboot the virtual machine?
:::

Services can be enabled or disabled using `systemctl enable servicename` and
`systemctl disable servicename`.

:::note Install nginx and toggle enabled state
Install the `nginx` service using `apt` and observe its status. Toggle its
enabled state (if disabled, enable it; if enabled, disable it). How does the
toggling affect its current running state?
:::

:::warning
Be careful when disabling services. Some services, like `ssh` are critical. If
disabled completely, you may become unable to connect to the system even if you
reboot it.
:::

:::tip
Look for *enable UNIT* in `man systemctl` to find out how you can immediately
affect the service's running state when enabling or disabling it.
:::


### Tuning service files

systemd services are configured using files under `/lib/systemd/system` or
`/etc/systemd/system`. We can use `systemctl cat servicename` to see the
configuration of a particular systemd unit.


```shell-session
$ sudo systemctl cat nginx
# /lib/systemd/system/nginx.service
# Stop dance for nginx
# =======================
#
# ExecStop sends SIGSTOP (graceful stop) to the nginx process.
# If, after 5s (--retry QUIT/5) nginx is still running, systemd takes control
# and sends SIGTERM (fast shutdown) to the main process.
# After another 5s (TimeoutStopSec=5), and if nginx is alive, systemd sends
# SIGKILL to all the remaining processes in the process group (KillMode=mixed).
#
# nginx signals reference doc:
# http://nginx.org/en/docs/control.html
#
[Unit]
Description=A high performance web server and a reverse proxy server
Documentation=man:nginx(8)
After=network.target

[Service]
Type=forking
PIDFile=/run/nginx.pid
ExecStartPre=/usr/sbin/nginx -t -q -g 'daemon on; master_process on;'
ExecStart=/usr/sbin/nginx -g 'daemon on; master_process on;'
ExecReload=/usr/sbin/nginx -g 'daemon on; master_process on;' -s reload
ExecStop=-/sbin/start-stop-daemon --quiet --stop --retry QUIT/5 --pidfile /run/nginx.pid
TimeoutStopSec=5
KillMode=mixed

[Install]
WantedBy=multi-user.target
```

The service configuration file contains various parameters that define generic
service information (e.g., the *Description* and *Documentation* fields in the
`[Unit]` section), dependencies on other services (e.g., the *After* and
*WantedBy* fields in the `[Unit]` and `[Install]` sections), as well as
service-specific parameters (e.g., where the service's PID should be stored, how
systemd should keep track of processes, execution steps, and so on).

:::note Override service configuration options
systemd can configure a number of parameters for the process. For example, the
maximum number of open file can be configured by setting the *LimitNOFILE* (see
`man systemd.exec` for more details) parameter in the `[Service]` section of the
process.

Use `systemctl edit nginx` to edit nginx's configuration parameters and set the
maximum number of open files to a really low number (e.g., 5).

You can define just the section name and the parameters you want to override;
you don't need to copy all the configuration in the original service file.
:::

:::tip
After configuring the parameter, you should see the following when running
`systemctl cat nginx` (note that an overrides file has been created under
`/etc/systemd` for the service).

```shell-session
# /etc/systemd/system/nginx.service.d/override.conf
[Service]
LimitNOFILE=5
```
:::

:::note Restart nginx with overridden settings
Try restarting the nginx service and observe what happens.

Note that this parameter is usually used to increase the maximum number of open
files, not reduce it - this is just an example to demonstrate the parameter.
:::

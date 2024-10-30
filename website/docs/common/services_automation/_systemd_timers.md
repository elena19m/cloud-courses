## Automating tasks using systemd timers

systemd timers are another option to automate recurring tasks, as well as
triggering tasks relative to other events (e.g., system boot time).

By default a timer triggers a unit with the same name as them - for example, a
service named `servicename.service` is automatically triggered by
`servicename.timer`.

The list of timers available on the system can be inspected using `systemctl
list-timers`. The output of the command displays the name of the timer, when the
last activation of the timer happened and when the next activation is scheduled,
as well as the name of the service that the timer activates.

In this section we will write a service that will periodically update the
system's message of the day (the text that is displayed when connecting to the
system).

:::note
By default the system displays a dynamic MOTD that is automatically generated
when connecting. To make the output more clear we will disable it.

Edit the `/etc/pam.d/sshd` file and comment the following line by prepending a
pound sign (`#`) before it, or removing it entirely:

```
session    optional     pam_motd.so  motd=/run/motd.dynamic
```

After updating the PAM file, connect to the virtual machine from a different
terminal and observe how the output has changed.
:::

Now that we have a clean canvas, let's implement a task that runs the following
script every 2 minutes.

Place the following script in `/usr/local/sbin/update-motd.sh`. When it runs it
updates the `/etc/motd` file, which will be displayed when connecting to the
system.

```bash
#!/bin/sh

set -eu -o pipefail

fetch_info() {
        echo "System information at $(date)"
        echo

        echo "Network interfaces:"
        ip -br a s | grep -E '^(eth|enp|virbr)'
        echo

        echo "Disk usage:"
        df -h /
        echo
}

echo "Fetching system information"
fetch_info > /etc/motd
echo "Finished successfully"
```

:::note Create a service file and timer that run the script
Using the `motd-news.service` and `motd-news.timer` service and timer files
as reference, create a new service and timer unit files in
`/etc/systemd/system`, for a service named `motd-update`.

The script executed by the service does not have to have the executable bit set
on it. To run it, we can explicitly invoke the `bash` interpretor using the
following execution parameter:

```
ExecStart=/bin/bash /usr/local/sbin/update-motd.sh
```

The timer should trigger the service to run **every two minutes**. Use
`man systemd.time` and read the *CALENDAR EVENTS* section to find how the
`OnCalendar` field should be set.

Make sure to remove the `RandomizedDelaySec=12h` parameter from the timer to
not add random delays in the execution.

Enable only the timer. The service does not have to be enabled, as it will be
automatically started by the timer periodically.
:::

:::tip
Confirm that you have the correctly set up the timer by listing the registered
timers and checking the timer's status or the associated journal entry.

If you have misconfigured the timer, you can edit it using the following
command (the timer must be restarted after being edited):

```shell-session
$ sudo systemctl edit --full motd-update.timer
```
:::

If you have configured the timer and service correctly, you should be able to
see lines in the service's logs that look like this:

```
Feb 30 00:00:00 scgc-services bash[XXXXX]: Fetching system information
Feb 30 00:00:00 scgc-services bash[XXXXX]: Finished successfully
```

This is because by default systemd uses the name of the executable that is
invoked by `ExecStart` as the system log tag.

:::note Set an expected syslog identifier for the service
Change the service's system log tag to *motd-update* using the
`SyslogIdentifier` parameter in the `[Service]` section.

Use the `--full` option when editing the service file, since this change is
relevant to the service as a whole, and not an override.

If the change is applied correctly, the logs from the next service run should
look like this:

```
Feb 30 00:00:00 scgc-services update-motd[XXXXX]: Fetching system information
Feb 30 00:00:00 scgc-services update-motd[XXXXX]: Finished successfully
```
:::

## journald

Logs captured by systemd from the services are kept in the system journal. The
logs kept in the journal can be easily queried using the `journalctl` command.

In its most basic form, the `journalctl` command displays logs from the
beginning of this system boot. We can use the `-b` flag followed by a number to
get the logs associated with a specific previous boot. For example, `-b -1` for
the logs of the previous boot.

:::info
Logs are not persisted by the default configuration. We must edit the
`/etc/systemd/journald.conf` file and set the *Storage* parameter to
`persistent` in order to force the journal to create the appropriate
permanent files to store the logs.

Edit the file and restart the `systemd-journald` service. Reboot the system a
couple of times before inspecting the logs for each boot cycle.
:::

:::tip
Persistent logs are especially important to inspect what may have caused a
system crash in a previous boot cycle.
:::

When trying to monitor service errors, the following parameters are
particularly useful:
  * `-e` moves to the end of the log immediately (we do not usually need to
    inspect old logs, and this option can be used to skip to the latest logs);
  * `-x` adds explanations for some messages from a message catalog;
  * `-u unitname` only shows messages associated with a specific systemd unit
    (e.g., service);
  * `-t syslogtag` displays messages with a specific syslog tag associated with
    them (i.e., the text after the hostname in the logs, next to a number - for
    example `nginx` in this line: `Feb 30 00:00:00 scgc-services nginx[XXXXX]`;
  * `-n number` only shows the most recent *number* logs;
  * `-f` makes the query follow updates to the logs, so new lines are displayed
    immediately.

:::note Follow logs to debug errors in real time
Use the correct flags to show the logs for the `nginx` service and automatically
update the displayed information.

From a different terminal update the `/etc/nginx/nginx.conf` file and break the
configuration (e.g., remove a `;` character somewhere), and then restart the
service. Observe the logged information in the first terminal.
:::

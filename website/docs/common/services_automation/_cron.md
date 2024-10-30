## Task automation using cron

Some tasks must be performed periodically for various purposes - creating
backups of configuration files, sending emails, cleaning up redundant
information, etc..

There are multiple ways to configure repeating tasks, but the most common is
using `cron`. Cron has a simple syntax for configuring tasks, with [five fields
describing when the task should run](https://www.ibm.com/docs/en/db2oc?topic=task-unix-cron-format)
and the remaining parameters define the command that should run. To edit the
list of tasks for the current user, use `crontab -e`.  The command has the same
format as it would in a terminal; for example the following line could be used
to backup the `important` directory every minute:

```cron
* * * * * umask 0077; tar zcvf "/home/student/backups/$(date +"\%F-\%H-\%M-\%S").tar.gz" /home/student/important
```

:::info
The percent (`%`) sign is a special character and must be escaped using
backslashes.
:::

:::note Create a task that runs every two minutes
Create a task that counts how many regular files there are in the `/usr/share`
directory **every two minutes**. Use the `find` command to list the regular files
and the `wc` command to count how many lines are printed by find (i.e., this
will give you the number of files).
:::

Now, you may be wondering what happens to the output. If you look in the
journal for the syslog tag `CRON` you may see some lines that show this
warning:

```
(CRON) info (No MTA installed, discarding output)
```

By default cron gathers the process' standard output and error and emails them
to the user. However, since the system does not have any mail services
installed, the output is discarded automatically.

:::note Configure postfix with local storage
Install the `postfix` package and configure it to only store the messages
**locally**.

After the scheduled tasks execute, check the `/var/log/student` file to see the
logged information.
:::

:::info
A mail is only created if the scheduled tasks output the data to the standard
output and error. You can explicitly redirect the output and error streams
to a file using `2>&1 >>/some/file` or completely discard them using `2>&1 >/dev/null`,
which will disable the creation of notification emails.
:::

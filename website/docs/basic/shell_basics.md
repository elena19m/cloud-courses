---
sidebar_position: 4
---

# Shell basics

Most system configurations that you will perform throughout the labs will be done through the Command Line Interface (CLI).
As such, you will need to have a good enough understanding of the basics of the Linux shell and how to best use the tools
at your disposal.

:::info Use any tool you like
The exercises here will go through a number of tools that are commonly installed on Linux. For terminal-based text editors,
since most systems come with `vi`/`vim` or `nano` pre-installed, we assume that you are familiar with at least one of them.
However, feel free to install any text editor you feel comfortable with - e.g. you can install and use
[micro](https://github.com/zyedidia/micro), which is a user friendly terminal-based text editor, instead of nano.
:::

:::note Installing packages
We recommend using the system's package managers (`apt` / `dnf`) to install packages whenever possible.
:::


## Lab Setup
  * We will be using a virtual machine in the [faculty's cloud](http://cloud.grid.pub.ro/).
  * When creating a virtual machine in the Launch Instance window:
    * Select **Boot from image** in **Instance Boot Source** section
    * Select **SCGC Template** in **Image Name** section
    * Select a flavor that is at least **m1.medium**.
  * The username for connecting to the VM is `student`.


## Basic shell concepts

The shell allows you to interact with the system, inspect or modify files and change the state of various processes.
For example, to list the contents of a directory, you can use the `ls` command:

```shell-session
$ ls
file1  file2  conversation
```

The contents of a file can be displayed with the `cat` command:

```
$ cat conversation
[10:50:20] Alice: We need to review the report on the latest spam emails
[10:50:34] Bob: Please send me a copy of the report
[10:50:40] Alice: How can I safely send it to you?
[10:50:44] Bob: Can you encrypt the data?
[10:51:14] Alice: I haven't done this before.
[10:51:20] Bob: It's pretty easy using GPG. I will send you my public key.
[10:51:29] Bob: <message has been removed>
[10:51:38] Bob: Import the key into your GPG agent and encrypt the file
[10:51:43] Bob: You can then safely send it to me.
```

:::note Save a copy of the text above
Save a copy of the text above into a text file. In the examples below, the file with the text is called `conversation`.
:::


### Redirecting command input and output

There are multiple ways of redirecting the input and output of a command:
  - redirecting output using `>` and `>>`;
  - redirecting input using `<`;
  - chaining commands using `|`.


#### Redirecting the output

You can redirect the output of a command using either `>` or `>>`. The difference between the two is what happens to the
content of the opened file:
  - when using `>` the old content of the file is discarded before writing the output of the command;
  - when using `>>` the output of the command is appended at the end of the file.

For example, you can redirect the output of the `echo` command like this:

```shell-session
$ echo "Scripting is cool" > output
```

:::note Observe redirect operator behaviour
Run multiple commands (e.g. `echo`) and redirect their output using both `>` and `>>` alternatively. Observe how the contents
of the files are changed depending on the operator.
:::


#### Redirecting the input

You can redirect a command's input to read from a file using the `<` operator as you can see below:

```shell-session
$ cat <input_file
Test input file
```


#### Chaining commands using `|`

You can multiple commands at the same time and redirect the output of one command to next command's input using the pipe (`|`) operator.
The following example uses `cat` to print the contents of the `conversation` file and the counts the number of lines in the file
using `wc -l`:

```shell-session
$ cat conversation | wc -l
9
```

:::caution
When redirecting the output of a command using `>` or `>>`, the shell attempts to open the file in write mode **before**
obtaining elevated privileges if the command is ran with `sudo`. This means that the following will fail:

```shell-session
$ sudo touch root_file
$ sudo echo "Test redirect with sudo" > root_file
```

You can still redirect the output to a file that you cannot normally write using the following command:

```shell-session
$ echo "Test redirect with tee" | sudo tee root_file
```
:::


### Variables

Like other programming and scripting languages, the `bash` scripting language allows you to define variables. To define a variable,
you need to use the following syntax (note the lack of spaces around the `=` sign):

```shell-session
$ variable=value
```

To expand the value of a variable, you can use either `$variable` or `${variable}`. The second version must be used
if you wish to append text to the variable, and that text would otherwise be misinterpreted as part of the variable name.
For example, in the second example below, the variable `variabletext` does not exist, and is expanded to an empty string:

```shell-session
$ variable=value
$ echo "$variable"
value
$ echo "$variabletext"

$ echo "${variable}"
value
$echo "${variable}text"
valuetext
```

:::info Variable inheritance
In the example above the variable is only visible to the shell process. Other processes that are created by the shell
will not have the variable defined in their environment. To make it visible to child processes you must use the `export` keyword:

```shell-session
$ variable=value
$ bash -c 'echo ${variable}'

$ export variable=value
$ bash -c 'echo ${variable}'
value
```
:::

:::note Quotes and variable expansion
Try printing the value of a variable using `echo`. Enclose the variable expansion (`$variable`) in either single quotes (`'`)
or double quotes (`"`) and observe the output.
:::


### Command arguments

Command arguments are separated by spaces. If you wish to pass a text that contains white spaces as a single argument, you
must enclose it in quotes.

:::note Observe the number of arguments using `printf`
The `printf` command can be used to format input parameters, similar to how you would use `printf` in C. In bash, however, it has
a special behaviour - if the number of arguments is larger than the number of parameters expected by the format string,
the format string is applied repeatedly until all arguments are used.

Use the `printf "%s\n" [arguments]` command and try to determine how many arguments the command receives:
 - use `multiple argument strings` as the argument, first as separate words and then enclose some of the string in quotes;
 - use the `var="variable with white spaces"` variable and expand it as the parameter, either enclosed, or not enclosed, in quotes.
:::


## Searching and replacing text

Searching and replacing parts of a text are fairly common operations when dealing with log files and configuration files.


### Searching for text in a file

The most commonly used tool to find text in a file is `grep`. It uses regular expressions to identify lines of text that match
a certain pattern. For example, to find all lines that have been sent by **Bob** in the `conversation` file, we can use
the following command:

```shell-session
$ grep 'Bob:' conversation
[10:50:34] Bob: Please send me a copy of the report
[10:50:44] Bob: Can you encrypt the data?
[10:51:20] Bob: It's pretty easy using GPG. I will send you my public key.
[10:51:29] Bob: <message has been removed>
[10:51:38] Bob: Import the key into your GPG agent and encrypt the file
[10:51:43] Bob: You can then safely send it to me.
```

:::note Locate other text
Find all lines of text that contain the phrase `safely send`.
:::


### Replacing text in a file

To perform various operations on text, such as replacing parts of it with other text, we can use `sed`. `sed` uses the same
type of regular expressions as `grep` to match text. For example, to replace **Bob**'s name with **Rudy** in the `conversation`
file, we can do the following:

```shell-session
$ sed 's/Bob:/Rudy:/g' conversation
[10:50:20] Alice: We need to review the report on the latest spam emails
[10:50:34] Rudy: Please send me a copy of the report
[10:50:40] Alice: How can I safely send it to you?
[10:50:44] Rudy: Can you encrypt the data?
[10:51:14] Alice: I haven't done this before.
[10:51:20] Rudy: It's pretty easy using GPG. I will send you my public key.
[10:51:29] Rudy: <message has been removed>
[10:51:38] Rudy: Import the key into your GPG agent and encrypt the file
[10:51:43] Rudy: You can then safely send it to me.
```

:::caution
By default `sed` simply prints the lines in the file, with any changes that are required, to the command's output. If you
want to save the changes to the file, use the `-i` flag.
:::


### Advanced operations using `awk`

`awk` is an advanced text processing tool that allows us to write complex scripts to parse files. It has a script language with
a syntax similar to C or PHP. For example, if we want to get the timestamps of all the messages that were sent by **Alice**,
we can use `awk` like this:

```shell-session
$ awk '{ if ($2 == "Alice:") { print $1 } }' conversation
[10:50:20]
[10:50:40]
[10:51:14]
```

In the command above the code enclosed in the outer brackets (`{ ... }`) is executed for each input line. The lines are broken
into words or tokens according to a field separator (defaults to white spaces), and the tokens are each assigned an index, starting
at **1**. As such, for each line, we check that the second field is `Alice:` and then print the first field (the timestamp)
on the line that matches the criteria.


:::note Reading from standard input
All commands described in this section can operate on the text they receive as standard input; as such, the following
are equivalent to the commands above:

```shell-session
$ cat conversation | grep 'Bob:'
$ cat conversation | sed 's/Bob:/Rudy:/g'
$ cat conversation | awk '{ if ($2 == "Alice:") { print $1 } }'
```
:::


## Managing network settings

We can use the `ip` command to inspect and change most common network configurations.

:::tip
The `ip` command's arguments can be passed in a short form, as long as no other command starts with the same characters.
For example, `ip address show` can be shortened to `ip a s`.
:::

:::caution
Configurations performed using the `ip` command are **not** permanent. You need to update the appropriate system configuration
files to make the changes permanent. However, temporary configurations are usually enough for the purposes of these labs.
:::


### Inspecting network interface IP addresses

Use the `ip address show` to see the system's network interfaces and associated configuration parameters:

```shell-session
$ ip address show
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
    inet6 ::1/128 scope host
       valid_lft forever preferred_lft forever
2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1450 qdisc fq_codel state UP group default qlen 1000
    link/ether 00:11:22:33:44:55 brd ff:ff:ff:ff:ff:ff
    inet 10.9.X.Y/16 brd 10.9.255.255 scope global dynamic eth0
       valid_lft 86352sec preferred_lft 86352sec
    inet6 fe80::f811:22ff:fe33:4455/64 scope link
       valid_lft forever preferred_lft forever
3: virbr0: <NO-CARRIER,BROADCAST,MULTICAST,UP> mtu 1500 qdisc noqueue state DOWN group default qlen 1000
    link/ether 52:54:00:d4:d9:40 brd ff:ff:ff:ff:ff:ff
    inet 192.168.122.1/24 brd 192.168.122.255 scope global virbr0
       valid_lft forever preferred_lft forever
4: virbr0-nic: <BROADCAST,MULTICAST> mtu 1500 qdisc fq_codel master virbr0 state DOWN group default qlen 1000
    link/ether 52:54:00:d4:d9:40 brd ff:ff:ff:ff:ff:ff
```


### Updating network interface IP addresses

To add or delete the IP address of an interface, the `ip` command provides the following commands:

```shell-session
$ sudo ip address add|delete A.B.C.D/M dev interface_name
```

For example, to delete the IP address of the `virbr0` interface we can use the following command:

```shell-session
$ sudo ip address delete 192.168.122.1/24 dev virbr0
$ ip address show
[...]
3: virbr0: <NO-CARRIER,BROADCAST,MULTICAST,UP> mtu 1500 qdisc noqueue state DOWN group default qlen 1000
    link/ether 52:54:00:d4:d9:40 brd ff:ff:ff:ff:ff:ff
[...]
```

To add the IP address back, we will perform the same operation, but specifying the `add` option, instead of `delete`:

```shell-session
$ sudo ip address add 192.168.122.1/24 dev virbr0
$ ip address show
[...]
3: virbr0: <NO-CARRIER,BROADCAST,MULTICAST,UP> mtu 1500 qdisc noqueue state DOWN group default qlen 1000
    link/ether 52:54:00:d4:d9:40 brd ff:ff:ff:ff:ff:ff
    inet 192.168.122.1/24 scope global virbr0
       valid_lft forever preferred_lft forever
[...]
```


### Debugging internet connectivity issues

When debugging issues with internet connectivity, the first step is checking if the system uses the correct default route:

```shell-session
$ ip route show
default via 10.9.0.1 dev eth0 proto dhcp src 10.9.X.Y metric 100
[...]
```

From the output above, we can see that the system uses an IP on the network `eth0` is connected to as the default gateway.
Since `eth0` is our connection the internet, this is the expected configuration.

Next, we must check whether the issue is not, in fact, related to internet access, but to the domain name resolution. If we can
ping a public IP address, such as `1.1.1.1`, but `dig` fails, it means that there is an issue with domain resolution:

```shell-session
$ ping -c1 1.1.1.1
PING 1.1.1.1 (1.1.1.1) 56(84) bytes of data.
64 bytes from 1.1.1.1: icmp_seq=1 ttl=56 time=1.66 ms

--- 1.1.1.1 ping statistics ---
1 packets transmitted, 1 received, 0% packet loss, time 0ms
rtt min/avg/max/mdev = 1.655/1.655/1.655/0.000 ms
$ dig google.com
; <<>> DiG 9.16.1-Ubuntu <<>> google.com
;; global options: +cmd
;; connection timed out; no servers could be reached
```

In such a case, make sure that there is a nameserver specified in `/etc/resolv.conf` before testing the connectivity again:

```shell-session
$ cat /etc/resolv.conf
nameserver 1.1.1.1
```

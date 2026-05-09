## Disk Forensics with Dissect

[Dissect](https://docs.dissect.tools/en/latest/index.html) is an open-source collection of python libraries and command-line tools for disk forensics.
It provides a flexible framework for analyzing disk images, extracting artefacts without the need to mount the image and exporting IOCs to structured data formats.

Key features of Dissect:
* Extract artefacts from sources such as QCOW2, VMDK, VDI
* Walk and extract files from filesystems such as EXT4, NTFS
* Parse log files, config files or command history files
* Export findings to structured data - JSON, CSV or streams to Splunk or Elastic

### Install Dissect

Dissect can be installed using `pipx` in a virtual environment:

```shell-session
student@lab-forensics:~$ pipx install dissect --include-deps
⚠️  Note: pygmentize was already on your PATH at /usr/bin/pygmentize
  installed package dissect 3.22, installed using Python 3.12.3
  These apps are now globally available
  [...]
    - target-fs
    - target-info
  [...]
done! ✨ 🌟 ✨
student@lab-forensics:~$ pipx ensurepath
Added /home/ubuntu/.local/bin to the PATH environment variable in /home/ubuntu/.bashrc

Open a new terminal to use pipx ✨ 🌟 ✨
```

:::tip
Dissect tools are prefixed with `target-` such as `target-info`, `target-query`, `target-fs`.
```shell-session
student@lab-forensics:~$ target-info --help
```
:::

### Basic image info

In `~/work/lab-forensics` you can find a `lab-forensics.qcow2` which is a snapshot of a compromised Wordpress instance that we will analyze using Dissect. To get basic information about the image such as OS version, install date or last activity date, you can use the `target-info` tool:

```shell-session
student@lab-forensics:~/work$ target-info lab-forensics/lab-forensics.qcow2
<Target lab-forensics/lab-forensics.qcow2>

Disks
- <Disk type='qcow2' size=8589934592>

Volumes
- <Volume name='part_00100000' size=8588886016 fs='xfs'>

Mounts
- <Mount fs='xfs' path='/'>

Hostname       : forensics
Domain         : None
Ips            : 10.0.2.15, 192.168.100.15
Os family      : linux
Os version     : AlmaLinux release 9.7 (Moss Jungle Cat)
Architecture   : x86_64-linux
Language       : en_US
Timezone       : Europe/Bucharest
Install date   : 2026-03-23T13:09:46.205296+00:00
Last activity  : 2026-05-08T11:48:52.535939+00:00
```

### Query general information

`target-query` is a tool used to query specific data inside one or more targets.
These queries are available in the form of functions.
Each function is focused on providing specific information such users configured on the system or command history.

To search for useful functions, you can use `target-query --list`:
```shell-session
student@lab-forensics:~/work$ target-query --list | less
```

The most basic usage of `target-query` is to execute a function on a target:
```shell-session
student@lab-forensics:~/work$ target-query -f <FUNCTIONS> lab-forensics/lab-forensics.qcow2
```

Retrieve the command history from the target:
```shell-session
student@lab-forensics:~/work$ target-query -f commandhistory lab-forensics/lab-forensics.qcow2
```

### Exercise 01 - Extract information

Retrieve the following information with `target-query`:
1. List of user accounts on the system.
2. List of last logged in users and their login times.
3. List of enabled services.

### Walk the filesystem

`target-fs` is a tool used to interact with the filesystem of a target. This commands has only a list of
subcommands that can be used: ls, cat, stat, walk, cp. For more info, look into `target-fs --help`.

```shell-session
student@lab-forensics:~/work$ target-fs lab-forensics/lab-forensics.qcow2 walk /home
/home/student
/home/student/.bash_logout
[...]
```

```shell-session
student@lab-forensics:~/work$ target-fs lab-forensics/lab-forensics.qcow2 ls /var/www/html/wordpress
wp-config-sample.php
wp-config.php
[...]
```

### Exercise 02 - Extract files

Retrieve the following information with `target-fs`:
1. Retrieve the access, modified time and contents for `wp-config.php`.
2. Retrieve and analyze the web server logs `/var/log/nginx/*.log` to check for insights about the attack vector.
3. Check if there are any suspicious files dropped in the Wordpress instance.

:::tip
Attackers commonly place webshells, backdoors, or malicious PHP files in writable WordPress directories such as:

- `wp-content/uploads/`
- `wp-content/plugins/`
- `wp-content/themes/`
- `/tmp/`
:::

### Open a shell

`target-shell` allows you to open an emulated shell to freely explore the target system. It comes in handy to quickly find and extract IOCs from a single target.

Only a few command are available such as `cd`, `ls`, `stat`, `shasum`, `hexdump`, `less`, `file`.
To find more commands, type `help` in the console.

```shell
student@lab-forensics:~/work$ target-shell lab-forensics/lab-forensics.qcow2
forensics:/$ help

Documented commands (type help <topic>):
========================================
alias  debug   filesystems  info    more      save       unalias
attr   digest  find         l       mounts    sha1sum    volumes
cat    dir     getfattr     less    pwd       sha256sum  xxd
cd     disks   hash         ll      python    shasum     zcat
clear  enter   head         ls      readlink  stat       zhead
cls    exit    help         man     registry  tree       zless
cyber  file    hexdump      md5sum  reload    type       zmore
```

You can now freely explore the filesystem, check file contents, check file hashes.

The most interesting paths to check are:
- `/var/log/nginx/` - web server logs that can provide insights into the attack
- `/var/www/html/wordpress/` - the web root of the Wordpress instance
- `/tmp` - a common directory used by attackers to drop files on the system
- `/home` - the home directory of the users where you can find user-specific files such as command history files, config files or documents that can provide insights into the attack and the attacker behavior

### Exercise 03 - Inspect the compromised target

Open a shell to the target and inspect the system to identify malicious PHP scripts that were used to get root access on the instance.

### Exercise 04 - Check IOCs against a malware database

Extract the hashes of the files from the previous exercise and check them against a malware database such as [VirusTotal](https://www.virustotal.com/) to identify any malicious files or indicators of compromise.

To easily extract the hashes of the files, you can use `target-fs`:
```shell-session
student@lab-forensics:~/work$ target-fs lab-forensics/lab-forensics.qcow2 cat <path> | sha256sum
```

Alternatively, you can use `target-shell` to open a shell and extract the file hashes:
```shell-session
student@ao-scgc:~/work$ target-shell lab-forensics/lab-forensics.qcow2
forensics:/$ shasum <path>
```

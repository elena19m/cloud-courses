## Disk Forensics with Dissect

[Dissect](https://docs.dissect.tools/en/latest/index.html) is an open-source collection of python libraries and command-line tools for disk forensics.
It provides a flexible framework for analyzing disk images, extracting artefacts without the need to mount the image and exporting IOCs to structured data formats.

Key features of Dissect:
* Extract artefacts from sources such as QCOW2, VMDK, VDI
* Walk and extract files from filesystems such as EXT4, NTFS
* Parse log files, config files or command history files
* Export findings to structured data - JSON, CSV or streams to Splunk or Elastic

### Install dissect

Dissect can be installed using `pip3` in a virtual environment:

```shell-session
student@lab-forensics:~$ python3 -m venv .venv
student@lab-forensics:~$ source .venv/bin/activate
(venv) student@lab-forensics:~$ pip3 install dissect
```

Dissect tools are prefixed with `target-` such as `target-info`, `target-query`, `target-fs`.

### Basic image info

In `~/work/lab-forensics` you can find a qcow2 snapshot of a vulnerable Wordpress instance that we will analyze using Dissect to understand how the attack was performed and to identify IoCs that can be used to detect similar attacks in the future.

To get basic information about the image, such as the partitions and filesystems, you can use the `target-info` tool:

```shell-session
(venv) student@lab-forensics:~/work/lab-forensics$ target-info lab-forensics.qcow2
```

### Query general information

`target-query` is a tool used to query specific data inside one or more targets.
These queries are available in the form of functions (`-f`).
Each function is focussed on providing specific functionality.

The most basic usage of target-query is to execute a function on a target:

```shell-session
(venv) student@lab-forensics:~/work/lab-forensics$ target-query -q -f <FUNCTION_NAME> lab-forensics.qcow2
```

To search for useful functions (`-f`), you can use `target-query --list`:
```shell-session
(venv) student@lab-forensics:~/work/lab-forensics$ target-query --list | less
```

List the function to retrieve the commands history from the target:
```shell-session
(venv) student@lab-forensics:~/work/lab-forensics$ target-query --list | grep history
(venv) student@lab-forensics:~/work/lab-forensics$ target-query -q -f commandhistory lab-forensics.qcow2
```

### Exercise 01 - Extract information

Retrieve the following information with `target-query`:
1. List of user accounts on the system
2. List of last logged in users and their login times
3. List of enabled services

### Walk the filesystem

`target-fs` is a tool used to walk the filesystem of a target and extract files based on specific criteria.
The most basic usage of `target-fs` is to walk the filesystem and extract all files that match a specific name or access/creation/modification time.

```shell-session
(venv) student@lab-forensics:~/work/lab-forensics$ target-fs -q lab-forensics.qcow2 walk /tmp
```

### Exercise 02 - Extract files

Extract the following files with `target-fs`:
1. The `wp-config.php` file that contains the database credentials for the Wordpress instance
2. The web server logs that can provide insights into the attack vector and the attack timeline
3. Any files that were created or modified in the last month, as they can indicate the presence of dropped files by the attacker


### Open a shell

`target-shell` allows you to open an emulated read-write shell to freely explore the target system.

Only a few command are available such as `cd`, `ls`, `stat`, `shasum`, `hexdump`, `less`, `file`.
It comes in handy to quickly walk and extract IOC from a single target.

```shell
(venv) student@lab-forensics:~/work/lab-forensics$ target-shell lab-forensics.qcow2
```

You can now freely explore the filesystem, check file contents, check file hashes.

The most interesting paths to check are:
- `/var/log/nginx/` - web server logs that can provide insights into the attack
- `/var/www/html/wordpress/` - the web root of the Wordpress instance where you can find the `wp-config.php` file that contains the database credentials and any dropped files by the attacker
- `/tmp` - a common directory used by attackers to drop files on the system
- `/home` - the home directory of the users where you can find user-specific files such as command history files, config files or documents that can provide insights into the attack and the attacker behavior

### Exercise 03 - Inspect the compromised target

Open a shell to the target and inspect the system to identify indicators of compromise (IoCs) that can be used to detect similar attacks in the future.

### Exercise 04 - Check against a malware database

Extract the hashes of the files from the previous exercise and check them against a malware database such as [VirusTotal](https://www.virustotal.com/) to identify any malicious files or indicators of compromise.

To easily extract the hashes of the files, you can use `target-fs`:

```shell-session
(venv) student@lab-forensics:~/work/lab-forensics$  target-fs -q lab-forensics.qcow2 cat <path> | sha256sum
```

Alternatively, you can use `target-shell` to open a shell and extract the file hashes:

```shell-session
$ target-shell lab-forensics.qcow2
$ sha256sum <path>
```

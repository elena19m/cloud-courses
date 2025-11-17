## Access Management in EOS

### EOS Virtual Identities

EOS uses a **VID (Virtual Identity)** system to manage user authentication and authorization. When a user connects to EOS, the system maps their credentials to a virtual identity.

Every operation in EOS is performed in the context of a virtual identity. The MGM translates each user credentials into a VID that determines the operations that can be performed by the user.

Check your current virtual identity when using the `root` user:

```shell-session
[root@mgm ~]# eos whoami
Virtual Identity: uid=0 (0,3,65534) gid=0 (0,4,65534) [authz:sss] sudo* host=localhost domain=localdomain
```

The above output shows `uid=0` (user ID for root), `gid=0` (group ID for root), `[authz:sss]` (authentication method using shared secret system), and `sudo*` (has sudo privileges).

Meanwhile, the user `student` is mapped to `nobody` (UID 65534):

```shell-session
[student@mgm ~]# eos whoami
Virtual Identity: uid=65534 (65534) gid=65534 (65534) [authz:unix] host=localhost domain=localdomain
```

The student user authenticates via `[authz:unix]` (Unix authentication) instead of sss, and is mapped to the `nobody` user. We'll edit this mapping later using the EOS VID configuration.

### Understanding POSIX Permissions vs ACLs

When you create a directory in EOS, it gets default POSIX permissions like `drwxr-xr-x` (owner has full access, others can read). ACLs allow you to grant specific permissions to individual users or groups beyond what POSIX permissions allow. For a complete list of ACL rules, see the [EOS ACL documentation](https://eos-docs.web.cern.ch/diopside/manual/interfaces.html#acls)

### Example: Granting Write Access to a Non-Sudo User

Let's demonstrate how to use ACLs to grant the user `student` write access to a directory, configuring a virtual identity mapping and and an ACL.

First, create a test directory as `root` and upload a file:

```shell-session
[root@mgm ~]# eos mkdir /eos/dev/shared
[root@mgm ~]# eos attr set default=replica /eos/dev/shared
[root@mgm ~]# eos attr set sys.forced.nstripes=2 /eos/dev/shared
[root@mgm ~]# echo "This is a shared file" > ~/shared_file
[root@mgm ~]# eos cp ~/shared_file /eos/dev/shared/
[eoscp] shared_file              Total 0.00 MB	|====================| 100.00 % [0.0 MB/s]
[eos-cp] copied 1/1 files and 22 B in 0.11 seconds with 194 B/s
```

Check the default permissions:

```shell-session
[root@mgm ~]# eos ls -l /eos/dev/ | grep shared
drwxrwxr-x   1 root     root               22 Nov 11 00:24 shared
```

The permissions `drwxrwxr-x` mean "others" can read (`r`), but not write (`w`).

Reading from `/eos/dev/shared` as user `student` works because the default POSIX permissions allow read access:

```shell-session
[student@mgm ~]$ eos ls /eos/dev/shared
shared_file

[student@mgm ~]$ eos cp /eos/dev/shared/shared_file ~/my_copy
[eoscp] shared_file              Total 0.00 MB	|====================| 100.00 %
```

Now try to write:

```shell-session
[student@mgm ~]$ echo "Hello from student!" > ~/my_file
[student@mgm ~]$ eos cp ~/my_file /eos/dev/shared/
[student@mgm ~]$ eos cp  ~/my_file /eos/dev/shared/
Secsss (getKeyTab): Unable to open /etc/eos.keytab; permission denied

Unable to open keytab file.
Secsss (getKeyTab): Unable to open /etc/eos.keytab; permission denied

Unable to open keytab file.
error: target file open failed - errno=13 : Permission denied [[ERROR] Server responded with an error: [3010] Unable to open file /eos/dev/shared/my_shared_file; Operation not permitted
]
error: failed copying path=root://localhost//eos/dev/shared/my_file
#WARNING [eos-cp] copied 0/1 files and 0 B in 0.08 seconds with 0 B/s
```

The user `student` needs permissions for write access.

:::note
You may see `Unable to open /etc/eos.keytab` warnings. These can be overlooked since the student user authenticates via Unix authentication (`authz:unix`), not shared secret system (sss).
:::

Before setting an ACL, we need to ensure the student user is properly mapped to a virtual identity in EOS.

Start by enabling Unix authentication:

```shell-session
[root@mgm ~]# eos vid enable unix
success: set vid [  eos.rgid=0 eos.ruid=0 mgm.cmd=vid mgm.subcmd=set mgm.vid.auth=unix mgm.vid.cmd=map mgm.vid.gid=99 mgm.vid.key=<key> mgm.vid.pattern=<pwd> mgm.vid.uid=99 ]
```

Check current virtual identity of the user `student` :

```shell-session
[student@mgm ~]$ eos whoami
Virtual Identity: uid=99 (99,65534) gid=99 (99) [authz:unix]
```

By default, EOS maps Unix-authenticated users to a non-privileged virtual identity with UID 99. Let's configure EOS VID to map the user `student` to virtual UID 1000 and GID 1000:

```shell-session
[root@mgm ~]# eos vid set map -unix "student" vuid:1000 vgid:1000
success: set vid [  eos.rgid=0 eos.ruid=0 mgm.cmd=vid mgm.subcmd=set mgm.vid.auth=unix mgm.vid.cmd=map mgm.vid.gid=1000 mgm.vid.key=<key> mgm.vid.pattern=student mgm.vid.uid=1000 ]
```

Check that the mapping was applied:

```shell-session
[student@mgm ~]$ eos whoami
Virtual Identity: uid=1000 (1000) gid=1000 (1000) [authz:unix] host=localhost domain=localdomain
```

Now when a user authenticates using unix authentication with the username `student`, EOS VID maps them to virtual UID 1000 and GID 1000.

By default, only POSIX permissions are checked in EOS. User ACL evaluation must be explicitly enabled on directories:

```shell-session
[root@mgm ~]# eos attr set sys.eval.useracl=1 /eos/dev/shared
[root@mgm ~]# eos attr get sys.eval.useracl /eos/dev/shared
sys.eval.useracl="1"
```

Now grant the student user write permissions using ACLs:

```shell-session
[root@mgm ~]# eos acl --user u:1000=rwx /eos/dev/shared
```

The `--user` flag sets user ACLs, `u:1000` specifies the user with UID 1000, and `=rwx` grants read, write, and browse permissions.

Check that the ACL was correctly set:

```shell-session
[root@mgm ~]# eos acl --list /eos/dev/shared

# user.acl
u:1000:rwx
```

Check for the ACL indicator (`+` sign) in `/eos/dev/shared` directory permissions:

```shell-session
[root@mgm ~]# eos ls -l /eos/dev/ | grep shared
drwxrwxr-+   1 root     root               22 Nov 11 00:24 shared
```

Now the user `student` should be able to write in the `/eos/dev/shared/` directory:

```shell-session
[student@mgm ~]$ eos cp ~/my_file /eos/dev/shared/
[eoscp] my_file                Total 0.00 MB	|====================| 100.00 % [0.0 MB/s]
[eos-cp] copied 1/1 files and 18 B in 0.11 seconds with 194 B/s

[student@mgm ~]$ eos ls /eos/dev/shared
shared_file
my_file
```

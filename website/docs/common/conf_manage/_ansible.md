## Ansible

Ansible is a configuration management and provisioning tool, similar to Puppet.
It uses SSH to connect to servers and run the configuration modules. As opposed
to Puppet, which normally uses a pull configuration (the client systems connect
to the Puppet server to fetch the configurations), Ansible works in a push
configuration (the configuration server has remote (e.g. SSH) access to all the
systems that it configures).

An advantage of Ansible is that it does not require a specific service daemon to
be installed on the target systems before the provisioning is performed. It
operates using various Python scripts for remote Linux systems, or Powershell
scripts for Windows systems.

We are going to install and configure Ansible on the host system:

```shell-session
student@lab-conf-manage-host:~$ sudo apt update
student@lab-conf-manage-host:~$ sudo apt install ansible
```

Make sure to check the version of Ansible that you have installed. Later
versions of Ansible may rename modules and add functionality, so you must ensure
that you use the correct documentation for your version.

```shell-session
student@lab-conf-manage-host:~$ ansible --version
ansible 2.9.6
  config file = /etc/ansible/ansible.cfg
[...]
```


### Configuring the inventory

Ansible uses inventory files where we can define lists of hosts and host groups
that are possible targets for our configurations.

Inventory files can also contain variable definitions on a per-host or per-group
basis. An example inventory file is created as `/etc/ansible/hosts`, initially
containing only comments.

The inventory file can be in any of many formats; the example inventory's format
is INI, but we will use the YAML format instead. Create the `inventory.yml` file
with the following contents:

```yaml
all:
  hosts:
    localhost:
      ansible_connection: local
  children:
    remotes:
      hosts:
        vm:
          ansible_host: 192.168.100.91
          ansible_user: student
```

:::info Inventory file structure
In the inventory file above we have defined two hosts:
  * `localhost` - the local system. Since the `ansible_connection` is set to
    `local`, Ansible will run the configuration modules (scripts) locally,
    without attempting to connect to the system through SSH;
  * `vm` - the remote system. The `ansible_host` variable must be set to define
    the IP or hostname Ansible should connect to if it differs from the entry's
    name (`vm`). The `ansible_user` defines the user Ansible will connect as.
    Note that Ansible will also parse the SSH config file for custom hosts and
    SSH parameters; as such, you can have an entry for `vm` that defines both
    parameters in the SSH configuration file, and they could be omitted here.
:::


### Testing host availability

We can test our connection to the hosts in the inventory file. To run the `ping`
module (tests that we can connect to the system) against `localhost` we can run
the following command:

```shell-session
student@lab-conf-manage-host:~$ ansible -i inventory.yml -m ping localhost
localhost | SUCCESS => {
    "ansible_facts": {
        "discovered_interpreter_python": "/usr/bin/python3"
    },
    "changed": false,
    "ping": "pong"
}
```

When running against the `remotes` host group, make sure that you can connect to
all hosts in the group (in this case, just the `192.168.100.91` virtual machine)
using SSH keys. The following command runs the `ping` module on all servers in
the `remotes` group.

```shell-session
student@lab-conf-manage-host:~$ ansible -i inventory.yml -m ping remotes
vm | SUCCESS => {
    "ansible_facts": {
        "discovered_interpreter_python": "/usr/libexec/platform-python"
    },
    "changed": false,
    "ping": "pong"
}
```

In both cases, we can see that Ansible's output is a JSON that reports some
information about the task that was executed.


### Ansible facter

Ansible has a fact gathering engine similar to Puppet. To gather facts about the
remote hosts we can use the `setup` module.

```shell-session
student@lab-conf-manage-host:~$ ansible -i inventory.yml -m setup vm
vm | SUCCESS => {
    "ansible_facts": {
        "ansible_all_ipv4_addresses": [
            "192.168.100.91"
        ],
[...]
        "ansible_fips": false,
        "ansible_form_factor": "Other",
        "ansible_fqdn": "localhost",
        "ansible_hostname": "lab-conf-manage",
        "ansible_hostnqn": "",
        "ansible_interfaces": [
            "lo",
            "eth0"
        ],
        "ansible_is_chroot": false,
        "ansible_iscsi_iqn": "",
[...]
```

Unless explicitly disabled, this module always runs at the beginning of
playbooks to gather facts about the system.


## Two-factor authentication for SSH

We plan to enable the use of two-factor authentication for SSH using the Google
authenticator PAM plugin. To do this, we need to first create a Google
authenticator configuration file on the host. To install the required packages
and create a Google authenticator configuration file with sensible defaults we
can use the following commands:

```shell-session
student@lab-conf-manage-host:~$ sudo apt install libpam-google-authenticator qrencode
student@lab-conf-manage-host:~$ google-authenticator -t -d -Q UTF8 -r 3 -R 30 -w 3 -e 5
```

:::info Authenticator parameters
The parameters given to the `google-authenticator` command have the following
meanings:
  * `-t` - create a time-based (TOTP) validation token;
  * `-d` - disallow code reuse (i.e., if the code has been used for
    authentication, it cannot be used again);
  * `-Q UTF` print the QR code using UTF8 characters. If it is not displayed
    properly, you can use `ANSI` or `NONE` (in the latter case you will need to
    manually copy the secret code);
  * `-r 3 -R 30` - limit login attempts to 3 every 30 seconds;
  * `-w 3` - use a window of 3 codes (the previous code, current one, next one)
    for authentication; since codes are time-based, this allows a maximum of 30
    seconds of time skew between the code generator (phone) and server;
  * `-e 5` - generate 5 emergency codes that can be used if the generator is not
    available.
:::

:::note Scan the authenticator code
When the configuration file is created, the secret code should be displayed both
as a QR code and a secret key. Scan the QR code or manually enter the secret
key into your preferred TOTP generator application (e.g. Google Authenticator).
:::


### Prepare configuration files

We will begin by copying the existing configuration files from the virtual
machine to the host. The files must be updated to enable the Google
authenticator PAM plugin.

```shell-session
student@lab-conf-manage-host:~$ mkdir files
# Copy the `/etc/pam.d/sshd` and `/etc/ssh/sshd_config` files from the VM to the `files` directory.
# The files should be named `pam_sshd` and `sshd_config`.
```

:::note Update the configuration files
After the files have been copied, the following configuration lines must be
added / updated:
  * in `sshd_config`:
```conf {3,4}
AuthorizedKeysFile      .ssh/authorized_keys
PasswordAuthentication yes
ChallengeResponseAuthentication yes
AuthenticationMethods publickey keyboard-interactive
GSSAPIAuthentication yes
GSSAPICleanupCredentials no
```
  * in `pam_sshd`:
```conf {3}
#%PAM-1.0
auth       substack     password-auth
auth       required     pam_google_authenticator.so
auth       include      postlogin
```
:::

The changes above enable SSH keyboard interactive authentication (e.g.,
password, OTP codes) as an alternative to the public key authentication, and
enable the challenge responses required for multiple authentication steps. In
the PAM configuration the Google authenticator plugin is added after password
authentication, so the user's password is required before the OTP code.

If the public key should have been requested **instead** of a password (so users
need to present a valid SSH key, and the OTP code afterwards), the
`password-auth` subtrack would instead be completely disabled, and the
`AuthenticationMethods` in the SSH configuration would be set to
`publickey,keyboard-interactive`.

:::info Alternative approaches
We could also use a module like [lineinfile][] to update parts of the
configuration files directly on the remote system, but this approach does not
guarantee that the content that we do not update is correct.
[lineinfile]: https://docs.ansible.com/ansible/2.9/modules/lineinfile_module.html
:::


### Create configuration playbook

An Ansible playbook is a collection of tasks that will be executed on the
systems that we want to configure. We will configure the system to use the
configuration files that we have prepared earlier.

We can use variables to set configuration parameters inside playbooks.  The
syntax used to expand all variables - including the ones created by the setup
module is `{{variable}}`. For example, `{{ansible_hostname}}` expands to the
hostname of the system Ansible currently configures (e.g. `lab-conf-manage` for
the virtual machine).

:::danger Secret information
Ansible will sometimes need to use or configure confidential information. Such
information must be added to encrypted vaults that are kept safe. Ansible can
interact with various vault formats, but for this example we will use the
default [Ansible vault tool][].

The Google authenticator information is confidential information, since anyone
with access to the file would be able to extract the secret code from it,
removing any benefit of implementing multi-factor authentication.
[Ansible vault tool]: https://docs.ansible.com/ansible/latest/cli/ansible-vault.html
:::

We first need to create a vault for the secret values:
  * the `sudo` password required to run privileged commands (when connecting as
    a non-root account);
  * the Google authenticator configuration file.

In preparation, we will convert the Google authenticator configuration file we
have created earlier as a template to base64. This step is not required, since
you can also add the entire file as-is to the vault. However, since its contents
do not have to be human-readable in the configuration, converting it makes the
configuration simpler. Run the command below and copy the output.

```shell-session
student@lab-conf-manage-host:~$ base64 ~/.google_authenticator | paste -s -d ''
```

To create the vault file we will use the `ansible-vault` command as shown below.
The command will ask for an encryption password for the vault file; this
password will be requested when the vault is read or edited, so make sure to use
a password that you will remember (you can also keep it in a separate file that
is usually not accessible to the Ansible server).

```shell-session
student@lab-conf-manage-host:~$ ansible-vault create files/vault
New Vault password:
Confirm New Vault password:
```

After running the command, an editor process will open. Enter the configuration
parameters and then close the editor:

:::warning Authenticator file variable
Set the `authenticator_file` variable to the output of the `base64` command
above. Do not use the `base64_encoded_google_...` string.
:::

```yaml
ansible_become_password: student
authenticator_file: base64_encoded_google_authenticator_configuration_file
```

:::note Confirm the vault is encrypted
After closing the editor, the configuration file is automatically encrypted.
Confirm that the file is encrypted and you can view it using the `ansible-vault`
command again.

```shell-session
student@lab-conf-manage-host:~$ cat files/vault
$ANSIBLE_VAULT;1.1;AES256
[...]
student@lab-conf-manage-host:~$ ansible-vault view files/vault
Vault password:
ansible_become_password: student
authenticator_file: base64_encoded_google_authenticator_configuration_file
```
:::

After configuring the vault, we have completed all prerequisites and can now
create the playbook file (as `sshd.yml`):

```yaml
---
- hosts: remotes

  tasks:
  # Include secret variables defined in the vault file
  - name: Include vault file
    include_vars: "files/vault"

  # Install the SSH server and make sure it is at the latest version using the package
  # manager identified by ansible
  - name: Ensure sshd is at the latest version
    package:
      name: openssh-server
      state: latest
    become: yes

  # Install the Google authenticator PAM plugin and make sure it is at the latest version
  - name: Ensure google-authenticator is at the latest version
    package:
      name: google-authenticator
      state: latest
    become: yes

  # Copy the Google authenticator configuration file
  # The file must have '0600' permissions. The default location is inside the user's home directory
  # Ansible can run filters to parse variables;
  # in this case, we use the `b64decode` filter to decode the file from base64
  - name: Copy Google Authenticator config file
    copy:
      content: "{{ authenticator_file | b64decode }}"
      dest: /home/student/.google_authenticator
      mode: 0600
      owner: student
      group: student

  # Overwrite the sshd configuration file. Make sure the challenge response setting
  # is enabled, and keyboard-interactive is a valid authentication method
  - name: Write the sshd configuration file
    template:
      src: files/sshd_config
      dest: /etc/ssh/sshd_config
      owner: root
      group: root
      mode: 0600
    become: yes
    notify:
      - restart sshd

  # Overwrite the PAM configuration file. Make sure that authentication through
  # google authenticator is required
  - name: Write the PAM configuration file
    template:
      src: files/pam_sshd
      dest: /etc/pam.d/sshd
      owner: root
      group: root
      mode: 0644
    become: yes
    notify:
      - restart sshd

  # Handlers that are invoked when the configuration files change.
  # Handlers are run at the end of the playbook, regardless of how many times they are triggered.
  handlers:
  # Restart the SSH daemon
  - name: restart sshd
    service:
      name: sshd
      state: restarted
    become: yes
```

To execute the playbook, use the command below. It will automatically run all
tasks in the `tasks` section on the servers defined in the `remotes` group.
You should see a similar output.

```
student@lab-conf-manage-host:~$ ansible-playbook -i inventory.yml --ask-vault-pass sshd.yml
Vault password:

PLAY [remotes] ***************************************************************************************************

TASK [Gathering Facts] *******************************************************************************************
ok: [vm]

TASK [Include vault file] ****************************************************************************************
ok: [vm]

TASK [Ensure sshd is at the latest version] **********************************************************************
ok: [vm]

TASK [Ensure google-authenticator is at the latest version] ******************************************************
changed: [vm]

TASK [Copy Google Authenticator config file] *********************************************************************
changed: [vm]

TASK [Write the sshd configuration file] *************************************************************************
changed: [vm]

TASK [Write the PAM configuration file] **************************************************************************
changed: [vm]

RUNNING HANDLER [restart sshd] ***********************************************************************************
changed: [vm]

PLAY RECAP *******************************************************************************************************
vm                         : ok=8    changed=5    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
```

You can test the connection to the virtual machine using the following command
to force using the `keyboard-interactive` authentication method:

```shell-session
student@lab-conf-manage-host:~$ ssh 192.168.100.91 -o PreferredAuthentications=keyboard-interactive
```

:::note Unable to login
You may notice that you are **not** able to login on the remote system if it is
running a RedHat operating system (e.g., Alma Linux). Inspect the journal logs on
the system to identify the problem:

```shell-session
[student@lab-conf-manage ~]$ sudo journalctl -xe -u sshd
```

If the error message looks like `Failed to create tempfile
"/home/student/.google_authenticator~XXXXXX": Permission denied`, it is because
SELinux does not allow the SSH service to create a temporary file in the user's
home directory (check the error using `audit2allow -aw`).

In this case, you must fix the issue:
  * change the location of the Google authenticator secrets file to
    `/home/student/.ssh/.google_authenticator` in the Ansible playbook;
  * check the [Google authenticator man page][] and find how you can set an
    alternate location for the secrets file;
  * update the location of the secrets file in the PAM configuration;
  * run the Ansible playbook again;
  * test the connection.
[Google authenticator man page]: https://github.com/google/google-authenticator-libpam#module-options
:::

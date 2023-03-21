## Linux authentication using LDAP

LDAP can be used as a central user database for various purposes. In large
organizations, in order to more easily keep track of the users (create accounts,
grant or revoke access, and suspend permissions), administrators commonly rely
on LDAP or a similar services.

The configurations presented in this section are adapted from the
[Configuring authentication and authorization in RHEL][] manual and provide
a minimal setup.

Before using LDAP to manage access on a system, the `sssd` package and some
dependencies are required. You can install the packages using the
following command on the same virtual machine as the LDAP server:

```bash
[student@lab-ldap ~]$ dnf install nss-pam-ldapd sssd sssd-ldap oddjob-mkhomedir
```

We can now configure the system to use our local LDAP deployment as a trusted
source using the command below (please note that the `--force` parameter
may not always be required):

```bash
[student@lab-ldap ~]$ authselect select sssd --force
```

:::danger
The command above edits system configuration files to use the `SSSD` service,
that fetches data from LDAP, as a provider for users, groups, and
other data. The `--force` flag will forcibly override the existing
configurations and may cause the system to misbehave, so please make sure
that you understand the implications.
:::

Edit the `/etc/sssd/sssd.conf` file and set the following fields:

```conf
[domain/default]
id_provider = ldap
auth_provider = ldap
chpass_provider = ldap
ldap_uri = ldap://192.168.100.21
ldap_search_base = dc=lab-ldap,dc=scgc,dc=ro
ldap_default_bind_dn = cn=Directory Manager
ldap_default_authtok_type = password
ldap_default_authtok = <Directory Manager's password>
ldap_user_auth_type = userPassword
ldap_tls_reqcert = allow

[sssd]
services = nss, pam
domains = default

[nss]
homedir_substring = /home
```

:::caution
The configuration file must have very restrictive permissions (e.g., `0600`).
Otherwise, the service will refuse to read the configurations.
:::

After editing the file, make sure to restart the `sssd` service. If the
configuration is properly set up, you will be able to get some user information
on the virtual machine:

:::warning
Do not confuse the `SSSD` service with the SSH daemon (sshd).
:::

```bash
[student@lab-ldap ~]$ getent passwd luke
luke:*:9900:9900:Luke:/home/luke:
[student@lab-ldap ~]$ su luke
Password:
sh-4.4$ pwd
/home/student
sh-4.4$ cd
sh: cd: /home/luke: No such file or directory
```

From the commands above, you can see that you can authenticate as `luke`, but
the user's home directory is not created. To automatically create home
directories, the functionality must be enabled using `authselect` and the
`oddjob` service must be running.

```bash
[student@lab-ldap ~]$ sudo authselect enable-feature with-mkhomedir
Make sure that SSSD service is configured and enabled. See SSSD documentation for more information.

- with-mkhomedir is selected, make sure pam_oddjob_mkhomedir module
  is present and oddjobd service is enabled and active
  - systemctl enable --now oddjobd.service

[student@lab-ldap ~]$ sudo systemctl enable --now oddjobd.service
```


## (Bonus) Create a different bind user

So far, in the examples above we have used the **Directory Manager** to connect
to LDAP and extract user information. In a production environment this is not
recommended, since the Directory Manager has full access over the entire
database. For this task you will have to:
 * create a different user (you do not have to add them in the `People`
organizational unit);
 * grant the new user **read-only** access on the `People` organizational unit
using ACIs (you can find more details here - [Defining ACI targets in RHDS][]).


## (Bonus) Enabling certificate validation in SSSD

In the configuration above we have disabled the certificate validation in
SSSD (using `ldap_tls_reqcert = allow`). Make the required changes to
re-enable the certificate validation. You have some examples in section 3.2
of [Configuring authentication and authorization in RHEL][].


[Configuring authentication and authorization in RHEL]: https://access.redhat.com/documentation/en-us/red_hat_enterprise_linux/8/html-single/configuring_authentication_and_authorization_in_rhel
[Defining ACI targets in RHDS]: https://access.redhat.com/documentation/en-us/red_hat_directory_server/11/html/administration_guide/defining_targets

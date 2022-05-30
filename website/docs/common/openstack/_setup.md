This lab's tasks will be performed in the faculty's [OpenStack cloud][]. We will
create, modify and delete different cloud objects (instances, networks,
subnets).
[OpenStack cloud]: https://cloud.grid.pub.ro/

To interact with OpenStack, we will use the official OpenStack client. The
client is already installed on `fep.grid.pub.ro`.

:::caution Resource names
All resources that you create must contain your username. Replace `user.name`
with your own username in the following tasks. If the resource name is not
specified, or is generic (e.g. `vm1`), append your username to it (e.g.
`user.name-vm1`).
:::


## Authentication

All operations performed in OpenStack require authentication. As such,
before using the OpenStack client, we must provide the necessary authentication
parameters. This is usually done using an [OpenStack RC file][] that defines
some variables to set up a certain environment inside the shell.
[Openstack RC file]: https://docs.openstack.org/ocata/user-guide/common/cli-set-environment-variables-using-openstack-rc.html


### OpenStack RC

To obtain your OpenStack RC file from the [Horizon dashboard][], go to `Project`
&rarr; `API Access`, click on the `Download OpenStack RC File` dropdown and
select `OpenStack RC File`.
[Horizon dashboard]: https://cloud.grid.pub.ro/

:::note Copy the RC file to fep
You must copy the configuration file to your home on `fep.grid.pub.ro`.
:::

:::info OpenStack RC format
The OpenStack RC file is a script file that defines and exports various shell
variables that will be used by the OpenStack client. The parameters can also be
passed as command line arguments, but since most of them will be the same
for all commands, using exported variables is more convenient.

The command line arguments take precedence over the corresponding environment
variables. The arguments usually have a similar format to their environment
counterparts, but written in lowercase and with underscores (`_`) replaced by
dashes (`-`) - e.g.  `OS_USERNAME` / `--os-username`.

When working with multiple projects, it is usually enough to replace the
`OS_PROJECT_ID` and `OS_PROJECT_NAME` variables, while other parameters can
remain the same.
:::

:::danger Authenticating using your password
If you inspect the RC file you will notice that the default configuration
reads your password as input and sets it as an environment variable. While this
approach may work, storing passwords as environment variables is usually
discouraged. You could opt to not use an authentication variable (the password),
but if a valid authentication token is not defined, the OpenStack client would
instead prompt for authentication every time it runs, which would greatly
decrease ease of use.
:::


### Token-based authentication

Besides password-based authentication, OpenStack supports other [authentication
plugins][]. We will use token-based authentication, which uses tokens to only
grant access to some OpenStack services. Furthermore, the token has an
expiration date attached to it, which reduces the impact of a potential
information leak, but also means that the token must be periodically renewed.
[authentication plugins]: https://docs.openstack.org/python-openstackclient/wallaby/cli/authentication.html

To use token-based authentication, you must update the RC file according to the
following patch (remove the lines starting with `-` and add the lines starting
with `+`; remove the `+` symbols at the beginning of each line):

```diff
 # In addition to the owning entity (tenant), OpenStack stores the entity
 # performing the action as the **user**.
 export OS_USERNAME="user.name"
-# With Keystone you pass the keystone password.
-echo "Please enter your OpenStack Password for project $OS_PROJECT_NAME as user $OS_USERNAME: "
-read -sr OS_PASSWORD_INPUT
-export OS_PASSWORD=$OS_PASSWORD_INPUT
+unset OS_TOKEN
+export OS_TOKEN=$(openstack token issue --os-auth-type=password -f value -c id)
+export OS_AUTH_TYPE="token"
+unset OS_USER_DOMAIN_NAME
 # If your configuration has multiple regions, we set that information here.
 # OS_REGION_NAME is optional and only valid in certain environments.
 export OS_REGION_NAME="RegionOne"
```

The changes above update the authentication method - we only use password
authentication to generate a new token (using `openstack token issue`) and set
the `OS_TOKEN` variable to be the token returned by the command (in column
`id`). After the token has been retrieved, we can set the authentication method
to `token` using the `OS_AUTH_TYPE` variable, so subsequent commands will use
the token to authenticate.

Note that we must first undefine the variable that defined the old token since
the OpenStack client throws an error if one is defined when using password
authentication. The `OS_USER_DOMAIN_NAME` must also be undefined since it is not
compatible with token authentication.

After updating the RC file, source it to execute the commands inside it as if
they were manually ran inside the current shell. This will make the shell define
and export the OpenStack variables, so child processes will inherit them. You
will be asked for your password when the token issuing command runs:

```bash
[user.name@fep8 ~]$ source scgc_prj-openrc.sh
Password:
```

After entering your password, if no error is shown, everything should be set as
expected and you will now be able to run OpenStack commands. For example, list
the catalog of installed services using `openstack catalog list`:

```bash
[user.name@fep8 ~]$ openstack catalog list
+-------------+----------------+---------------------------------------------+
| Name        | Type           | Endpoints                                   |
+-------------+----------------+---------------------------------------------+
| placement   | placement      | RegionOne                                   |
|             |                |   admin: https://cloud.grid.pub.ro:8780     |
|             |                | RegionOne                                   |
|             |                |   internal: https://cloud.grid.pub.ro:8780  |
|             |                | RegionOne                                   |
|             |                |   public: https://cloud.grid.pub.ro:8780    |
|             |                |                                             |
| neutron     | network        | RegionOne                                   |
|             |                |   admin: https://cloud.grid.pub.ro:9696     |
|             |                | RegionOne                                   |
|             |                |   public: https://cloud.grid.pub.ro:9696    |
|             |                | RegionOne                                   |
|             |                |   internal: https://cloud.grid.pub.ro:9696  |
[...]
+-------------+----------------+---------------------------------------------+
```


### Token management

Generate a new authentication token to inspect its format using the following
command:

```bash
[user.name@fep8 ~]$ openstack token issue
```

Inspect the other options that the command accepts by appending the `-h`
parameter.

After you finish inspecting the tokens, you can revoke them using the following
command (the ID of the token to revoke must be given as a positional parameter):

```bash
[user.name@fep8 ~]$ openstack token revoke gAAAAA[...]
```

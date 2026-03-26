This lab's tasks will be performed in the faculty's [OpenStack cloud][]. We will
create, modify and delete different cloud objects (instances, networks,
subnets).

:::tip Note
To interact with OpenStack, you should be logged in to `fep.grid.pub.ro` using your faculty credentials.
To run OpenStack commands, we will use the official OpenStack client. The client is already installed on `fep.grid.pub.ro`.
::::

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


### OpenStack RC

To obtain your OpenStack RC file from the [Horizon dashboard][], go to `Project`
&rarr; `API Access`, click on the `Download OpenStack RC File` dropdown and
select `OpenStack RC File`.

:::note Copy the RC file to fep
You must copy the configuration file to your home on `fep.grid.pub.ro` using
`scp`.
:::

:::info OpenStack RC format
The OpenStack RC file is a script file that defines and exports various shell
variables that will be used by the OpenStack client. The parameters can also be
passed as command line arguments, but since most of them will be the same
for all commands, using exported variables is more convenient because we can
easily `source` the RC file to set up the environment for all OpenStack commands.

The command line arguments take precedence over the corresponding environment
variables. The arguments usually have a similar format to their environment
counterparts, but written in lowercase and with underscores (`_`) replaced by
dashes (`-`) - e.g.  `OS_USERNAME` / `--os-username`.

When working with multiple projects, it is usually enough to replace the
`OS_PROJECT_ID` and `OS_PROJECT_NAME` variables, while other parameters can
remain the same.
:::

### OpenID Authentication

To access the OpenStack cloud, we will use OpenID authentication. This means that
instead of providing our credentials directly to OpenStack, we will authenticate
to an external OpenID provider (in our case, the faculty's Single Sign-On service)
and obtain an authentication token that will be used to access OpenStack services.

To authenticate using your faculty credentials, source the downloaded OpenStack RC file:
```shell-session
[user.name@fep8 ~]$ source didactic-scgc-lab-openrc.sh
To authenticate please go to: https://login.upb.ro/auth/realms/UPB/device?user_code=<code>
<openstack issued token>
```

This script initiates an OpenID Connect (OIDC) authorization request.
The terminal will pause and output a login URL alongside a code.

Follow the URL and complete the authentication process in your browser using
your faculty credentials. After a successful login, the OpenStack client will
receive an authentication token and export it into an environment variable `OS_TOKEN`
and you will now be able to run OpenStack commands.

For example, list the catalog of installed services using `openstack catalog list`:

```shell-session
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

```shell-session
[user.name@fep8 ~]$ openstack token issue
```

Inspect the other options that the command accepts by appending the `-h`
parameter.

After you finish inspecting the tokens, you can revoke them using the following
command (the ID of the token to revoke must be given as a positional parameter):

```shell-session
[user.name@fep8 ~]$ openstack token revoke gAAAAA[...]
```


[Openstack RC file]: https://docs.openstack.org/ocata/user-guide/common/cli-set-environment-variables-using-openstack-rc.html
[OpenStack cloud]: https://cloud.grid.pub.ro/
[Horizon dashboard]: https://cloud.grid.pub.ro/
[authentication plugins]: https://docs.openstack.org/python-openstackclient/wallaby/cli/authentication.html

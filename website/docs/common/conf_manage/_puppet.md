## Puppet resources

Puppet is a configuration management tool. In order to describe the required
configurations, Puppet uses its own declarative language. Puppet can manage both
Linux and Windows systems.

All Puppet tasks will be done inside the virtual machine that the `runvm.sh`
scripts starts.

To use Puppet you must first install the `puppet` package on your system.

```bash
[student@lab-conf-manage ~]$ sudo dnf install puppet
```

A `resource` is an abstraction for most entities and operations that can be
performed on a system. As an example, the state of a service (running / stopped)
is defined in Puppet as a resource.

Use the `puppet resource service` command to see the system services from
Puppet's perspective.

```puppet
[student@lab-conf-manage ~]$ puppet resource service
service { 'NetworkManager-dispatcher.service':
  ensure   => 'stopped',
  enable   => 'true',
  provider => 'systemd',
}
service { 'NetworkManager-wait-online.service':
  ensure   => 'running',
  enable   => 'true',
  provider => 'systemd',
}
service { 'NetworkManager.service':
  ensure   => 'running',
  enable   => 'true',
  provider => 'systemd',
}
service { 'auditd.service':
  ensure   => 'running',
  enable   => 'true',
  provider => 'systemd',
}
service { 'autovt@.service':
  ensure   => 'stopped',
  enable   => 'true',
  provider => 'systemd',
}
service { 'chrony-dnssrv@.service':
  ensure   => 'stopped',
  enable   => 'true',
  provider => 'systemd',
}
[...]
```

:::info Command syntax
The previous command's syntax is:
  * `puppet` command - used to access most of Puppet's features;
  * `resource` subcommand - interact with available Puppet resources;
  * `service` parameter - type of resources to show.
:::


### Resource structure

To show the resource representing the `root` user account, we can use the
following command:

```puppet
[student@lab-conf-manage ~]$ puppet resource user root
user { 'root':
  ensure   => 'present',
  comment  => 'root',
  gid      => 0,
  home     => '/root',
  provider => 'useradd',
  shell    => '/bin/bash',
  uid      => 0,
}
```

:::info Resource command output
The output contains the following information:
  * the type of the resource - in this example `user`;
  * the name of the resource - `root`;
  * attributes of the resource - `ensure`, `comment`, `gid`, and so on;
  * the values of each attribute.
:::

The output above represents a **resource declaration** of the user resource.


### Types of resources

Besides services and users, Puppet implements other types of resources. To see a
list of the available resources, you can use the following command:

```puppet
[student@lab-conf-manage ~]$ puppet describe --list
These are the types known to puppet:
augeas          - Apply a change or an array of changes to the  ...
cron            - Installs and manages cron jobs
exec            - Executes external commands
file            - Manages files, including their content, owner ...
filebucket      - A repository for storing and retrieving file  ...
group           - Manage groups
[...]
```


### Managing resources

We can create new resources using the `puppet resource` command. The generic
syntax is:

```
puppet resource type name attr1=val1 attr2=val2
```

We want to create the user `worker` so that:
  * the user's home directory is `/home/worker`;
  * the user's default shell is `/bin/sh`.

We can create the user with the following command:

```bash
[student@lab-conf-manage ~]$ sudo puppet resource user worker ensure=present shell=/bin/sh home=/home/worker
Notice: /User[worker]/ensure: created
user { 'worker':
  ensure   => 'present',
  home     => '/home/worker',
  provider => 'useradd',
  shell    => '/bin/sh',
}
```

:::note Verify resource creation
Open the `/etc/passwd` file and check the entry that was created for the user.
:::

In order to remove a resource, the `ensure` parameter must be set to `absent`.

As an example, to remove the `worker` user that we have previously created, we
can use the following command:

```bash
[student@lab-conf-manage ~]$ sudo puppet resource user worker ensure=absent
Notice: /User[worker]/ensure: removed
user { 'worker':
  ensure   => 'absent',
  provider => 'useradd',
}
```

:::note Verify resource removal
Check the `/etc/passwd` file again and confirm that the user has been removed.
:::


## Puppet manifests

Even though we can create, modify and remove resources from the command line,
using the `puppet resource` command, this is not a scalable approach and not
appropriate for complex scenarios.

As mentioned above, Puppet is a configuration management tool, which means that
we describe what resources must (or must not) exist on a system. Consequently,
the preferred approach would be:
  * creating a resource file that describes the resources on the system;
  * applying the described modifications using Puppet.

Files containing Puppet resource declarations are called **manifests** and
usually have the `.pp` file extension.

:::caution Puppet is a pull-type configuration system
The examples presented here are meant for educational purposes, and are better
suited for testing configurations. Puppet usually has a client-server
architecture, where the server keeps track of all manifest files, and the
clients connect to the server to retrieve (pull) them. This enables Puppet to
scale up and configure an entire cluster of servers.
:::


### Creating a manifest

We are going to write a manifest file that describe a file resource. The file is
going to have the following properties:
  * path: `/tmp/my_file`;
  * access mode: `0640`;
  * content: `This file was created using Puppet`.

We will save the following configuration in a file called `my_file_manif.pp`:

```puppet
file {'my_file':
  path    => '/tmp/my_file',
  ensure  => present,
  mode    => '0640',
  content => 'This file was created using Puppet',
}
```


### Applying a manifest

To apply a manifest we can use the `puppet apply` command:

```
[student@lab-conf-manage ~]$ puppet apply my_file_manif.pp
Notice: Compiled catalog for lab-conf-manage in environment production in 0.03 seconds
Notice: /Stage[main]/Main/File[my_file]/ensure: defined content as '{md5}73a33bf2b9a33847ac15cca5bf18c1c7'
Notice: Applied catalog in 0.05 seconds
```

:::note Verify resource creation
Check that the file has been created and the content and access permissions are
correct.
:::

Try applying the manifest one more time without modifying the file.

```
[student@lab-conf-manage ~]$ puppet apply my_file_manif.pp
Notice: Compiled catalog for lab-conf-manage in environment production in 0.02 seconds
Notice: Applied catalog in 0.04 seconds
```

:::info File resource state
Notice that if the file is already in the required state, Puppet will avoid
performing any action. This is because repeated application of the manifest
should be idempotent, meaning that it should not create any changes in the
system unless required.
:::

:::note Manifest application after file changes
Change the file's permissions and contents. Apply the manifest after each change
and notice the output given by Puppet. How does it keep track of content
changes?
:::


### States (ensure)

The `ensure` attribute usually specifies if the resource:
  * must exist (`ensure => present`);
  * must not exist (`ensure => absent`).

Some types of resources define additional states for the attribute. For example,
`file` resources can also have the following values for `ensure`:
  * `directory`;
  * `link`;
  * `file`.

Define a manifest that creates a symbolic link to `/tmp/my_file`. Use the Puppet
documentation for the [file type resource][] for more details.
[file type resource]: https://puppet.com/docs/puppet/6/types/file.html

:::tip
The `target` attribute must also be set when the `ensure => link` attribute is
set.
:::


### Authorized SSH key

Create a new manifest file and define a [ssh_authorized_key type resource][].
The resource must allow the `student` user on the host to authenticate as the
`student` user on the virtual machine using an SSH key.
[ssh_authorized_key type resource]: https://forge.puppet.com/modules/puppetlabs/sshkeys_core

:::tip
You must generate an SSH key on the host system, and copy its public key to the
manifest file. We recommend using ED25519 keys for their shorter length.
:::


### Resource dependency

A puppet manifest can contain declarations for multiple resources, but the order
in which they are applied is not strictly enforced.

There are some situations when we have to make sure that a resource is applied
before another (e.g. a package is installed before starting a service). In such
cases, we must define resource dependencies.

The [Puppet relationships docs][] provide a more detailed overview of how
resource relationships work. We will provide some examples in the following
sections.
[Puppet relationships docs]: https://puppet.com/docs/puppet/6/lang_relationships.html

#### Before / require

We can modify the previously created manifest and add an `exec` resource:

```puppet
exec {'echoer':
  command     => ['/bin/echo', 'Test hello!'],
  logoutput   => true,
  require     => File['my_file'],
}

file {'my_file':
  path    => '/tmp/my_file',
  ensure  => present,
  mode    => '0640',
  content => 'This file was created using Puppet',
}
```

The [exec type resource][] defines a shell command that must be executed. This
type of resource is not usually used since other resource types provide built-in
checks to verify if resource application is required. The `logoutput` attribute
specifies that the output of the command must also be passed to Puppet's
notification output.
[exec type resource]: https://puppet.com/docs/puppet/6/types/exec.html

:::note Observe the execution order
Apply the manifest above and observe the order in which the resources are
evaluated. Change the managed file and see how this affects the execution.
:::

The `before` attribute can be used to create an equivalent syntax:


```puppet
exec {'echoer':
  command     => ['/bin/echo', 'Test hello!'],
  logoutput   => true,
}

file {'my_file':
  path    => '/tmp/my_file',
  ensure  => present,
  mode    => '0640',
  content => 'This file was created using Puppet',
  before  => Exec['echoer'],
}
```


#### Notify / subscribe

Some resources require running an action that has the effect of a "refresh"
(e.g. a service that needs to reload its configuration). The behaviour of some
resources (e.g. [service type resource][]) may differ depending on whether the
resource is refreshed or not.
[service type resource]: https://puppet.com/docs/puppet/6/types/service.html

If in addition to resource dependencies we need to refresh a second resource
when the first one is changed, we can either:
  * use `notify` instead of `before`;
  * use `subscribe` instead of `require`.

As the example above, we can update the configuration above to use the `notify`
attribute instead `before`.

:::tip
By default, the `exec` resource will always run. To adapt it to work with the
`notify` system, add the `refresh` or `refreshonly` attributes accordingly.
:::

:::note Behaviour change
Notice how the behaviour changes between `before` and `notify`.
:::


#### Equivalent require syntax

Instead of explicitly using `before` / `require` or `notify` / `subscribe`, we
can use the `->` or `~>` operators:

```puppet
file {'my_file':
  path    => '/tmp/my_file',
  ensure  => present,
  mode    => '0640',
  content => 'This file was created using Puppet',
}
->
exec {'echoer':
  command     => ['/bin/echo', 'Test hello!'],
  logoutput   => true,
}

```

:::caution
Be careful when typing `~>` after adding a new line (pressing Enter). The
sequence `<Enter>~.` (i.e. pressing Enter and then typing tilde (`~`) and then
period (`.`)) is used to kill the SSH session.
:::


### Design patterns: package / file / service

In many situations, Puppet is used to make sure that a system service is
installed, has the appropriate configuration and started. Such a scenario can be
implemented using three resources:
  * `package`;
  * `file`;
  * `service`.

The first two components have a `before` / `require` relation, while the last
two have a `notify` / `subscribe` relation.

Create the following manifest which implements this design pattern for the SSH
service, and the apply the manifest:

```puppet
package {'openssh-server':
  ensure => present,
}
->
file {'/etc/ssh/sshd_config':
  ensure => file,
  mode   => '600',
  source => '/home/student/config-samples/sshd_config',
}
~>
service {'sshd':
  ensure => running,
  enable => true,
}
```

Modify various parts of the `package` / `file` / `service` triplet and reapply
the manifest. For example:
  * uninstall the package;
  * change the configuration file;
  * stop the service.

:::note Create a configuration manifest to configure nginx
Create a `package` / `file` / `service` manifest for the nginx service. You can
use the example configuration file from `/home/student/config-samples`.

On Alma Linux, the package is called `nginx` and the configuration file must is
placed in `/etc/nginx/nginx.conf`.

Also, add a custom index page that you place under
`/usr/share/nginx/html/index.html`. The contents of the file must be set using
the `content` attribute of the [file type resource][].
:::


### Variables and conditional statements

For an easier configuration parametrization, Puppet allows using variables and
conditionals.


#### Variables
Similar to PHP, variables in Puppet start with a `$` symbol - i.e. to access a
variable we use the `$variable` syntax, both for assignment and referencing.

We can change the manifest file for `my_file`, defining the contents as a
variable:

```puppet
$content = 'This file was created using Puppet'

file {'my_file':
  path    => '/tmp/my_file',
  ensure  => present,
  mode    => '0640',
  content => $content,
}
```


#### Facts
In addition to user-defined variables, Puppet uses a powerful data gathering
engine, called `facter` to retrieve information about the system. The variables
defined by the `facter` are called `facts` and can be accessed as system
variables in manifests.

We can use the `facter` command to see a list of all variables that are defined
by the data engine.

```bash
[student@lab-conf-manage ~]$ facter
augeas => {
  version => "1.12.0"
}
disks => {
  sda => {
    model => "QEMU HARDDISK",
    size => "8.00 GiB",
    size_bytes => 8589934592,
    vendor => "ATA"
  }
}
dmi => {
  bios => {
    release_date => "04/01/2014",
    vendor => "SeaBIOS",
    version => "1.13.0-1ubuntu1.1"
  },
[...]
```


#### Conditionals

An example of when using system variables (facts) is useful is when we need to
take decisions based on the value of some of them.

The following manifest ensures that the nginx service:
  * is stopped if the system is a physical machine;
  * is started if the system is a virtual machine.

The decision is taken based on the value of the `$is_virtual` variable.

```puppet
if $is_virtual {
  service {'nginx':
    ensure => running,
    enable => true,
    require => Package['nginx'],
  }
} else {
  service {'nginx':
    ensure => stopped,
    enable => false
  }
}
```

#### Manifest to install and configure nginx

First, uninstall the `nginx` server from the virtual machine. Write a manifest
that will:
  * install the nginx server;
  * configure nginx to serve a custom index page.

Use the [case conditional][] statement to create the index files in the
appropriate directories.

[case conditional]: https://puppet.com/docs/puppet/6/lang_conditional.html#lang_condition_case

:::note Facts dictionary
Depending on the version of Puppet that you use, the facts may change their
position in the facts dictionary. Review the output of the `facter` command to
locate the variables that you need.
:::

:::info Configuration parameters
You are **not** expected to change the service's configuration files this time
around. You only need to define a custom `index.html` file in the appropriate
location and access permissions.

Depending on the operating system's family (e.g., RedHat or Debian), the default
nginx configuration files differ as follows:
  * on RedHat systems, the root HTML directory is `/usr/share/nginx/html` and
    the service runs as the `nginx` user;
  * on Debian systems, the root HTML directory is `/var/www/html` and the
    service runs as the `www-data` user.
:::

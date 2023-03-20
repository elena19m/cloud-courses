## Resource management

OpenStack can manage various resources (e.g. virtual machines, networks, virtual
machine disk images) and allow users to configure complex networks of systems
with custom functionality.


### Listing resources

To be able to boot a virtual machine instance, we must know the following
parameters (objects):
  * `image`: the name or ID of the image used to boot the instance;
  * `flavor`: the name or ID of the flavor. The flavor defines the amount of
    resoruces reserved for the virtual machine (e.g. CPU, RAM, disk space);
  * `key pair`: the public SSH key to inject into the instance during the first
    boot;
  * `network`: which virtual network(s) the virtual machine will be connected to;
  * `security-group`: which security group (set of filter rules) to apply to the
    instance's networking.

For each of the above parameters we must inspect the list of resources that are
available in our OpenStack tenant.

:::tip Resource UUID vs name
Most commands in OpenStack can use both a resource's name and the resource's
unique ID (UUID). In this lab we will prefer using the UUID, which is the
recommended approach in most automation scripts. This is because while both the
name and the ID are unique at any given time, an object's ID cannot be changed,
while some objects can be renamed.
:::


#### Images

Images are managed by the `Glance` service. We can list them using the following
command:

```
[user.name@fep8 ~]$ openstack image list
+--------------------------------------+------------------------------------------+--------+
| ID                                   | Name                                     | Status |
+--------------------------------------+------------------------------------------+--------+
[...]
| xxxxxxxx-yyyy-zzzz-tttt-xxxxxxxxxx11 | SCGC Template                            | active |
[...]
| xxxxxxxx-yyyy-zzzz-tttt-xxxxxxxxxx12 | Ubuntu 16.04 Xenial                      | active |
[...]
+--------------------------------------+------------------------------------------+--------+
```

To boot the instance, we will use the `Ubuntu 16.04 Xenial` image. Use its
specific ID, as shown in the output of the `openstack image list` command. We
can get more information about this image using the `openstack image show`
command:

```
[user.name@fep8 ~]$ openstack image show xxxxxxxx-yyyy-zzzz-tttt-xxxxxxxxxx12
+------------------+------------------------------------------------------------------+
| Field            | Value                                                            |
+------------------+------------------------------------------------------------------+
| checksum         | xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx                                 |
| container_format | bare                                                             |
| created_at       | 20XX-02-30T00:00:00Z                                             |
| disk_format      | qcow2                                                            |
| file             | /v2/images/xxxxxxxx-yyyy-zzzz-tttt-xxxxxxxxxx12/file             |
| id               | xxxxxxxx-yyyy-zzzz-tttt-xxxxxxxxxx12                             |
| min_disk         | 0                                                                |
| min_ram          | 0                                                                |
| name             | Ubuntu 16.04 Xenial                                              |
| owner            | xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx                                 |
| properties       | nested='false', os_distro='nested', os_hash_algo='sha512', [...] |
| protected        | False                                                            |
| schema           | /v2/schemas/image                                                |
| size             | 313982976                                                        |
| status           | active                                                           |
| tags             |                                                                  |
| updated_at       | 20XX-02-30T00:00:00Z                                             |
| virtual_size     | 2361393152                                                       |
| visibility       | public                                                           |
+------------------+------------------------------------------------------------------+
```


#### Flavors

Flavors are managed by the `Nova` service (the compute service). We will list
the available flavors using `openstack flavor list`:

```
[user.name@fep8 ~]$ openstack flavor list
+--------------------------------------+----------------+------+------+-----------+-------+-----------+
| ID                                   | Name           |  RAM | Disk | Ephemeral | VCPUs | Is Public |
+--------------------------------------+----------------+------+------+-----------+-------+-----------+
| xxxxxxxx-yyyy-zzzz-tttt-xxxxxxxxxx21 | m1.tiny        |  512 |    8 |         0 |     1 | True      |
| xxxxxxxx-yyyy-zzzz-tttt-xxxxxxxxxx22 | m1.xlarge      | 4096 |   24 |         0 |     4 | True      |
| xxxxxxxx-yyyy-zzzz-tttt-xxxxxxxxxx23 | m1.medium      | 1536 |   16 |         0 |     1 | True      |
| xxxxxxxx-yyyy-zzzz-tttt-xxxxxxxxxx24 | m1.large       | 4096 |   16 |         0 |     2 | True      |
[...]
+--------------------------------------+----------------+------+------+-----------+-------+-----------+
```

Let's find more information about the `m1.tiny` flavor, which has the ID of
`xxxxxxxx-yyyy-zzzz-tttt-xxxxxxxxxx21`, using `openstack flavor show`:

```
[user.name@fep8 ~]$ openstack flavor show xxxxxxxx-yyyy-zzzz-tttt-xxxxxxxxxx21
+----------------------------+--------------------------------------+
| Field                      | Value                                |
+----------------------------+--------------------------------------+
| OS-FLV-DISABLED:disabled   | False                                |
| OS-FLV-EXT-DATA:ephemeral  | 0                                    |
| access_project_ids         | None                                 |
| description                | None                                 |
| disk                       | 8                                    |
| id                         | xxxxxxxx-yyyy-zzzz-tttt-xxxxxxxxxx21 |
| name                       | m1.tiny                              |
| os-flavor-access:is_public | True                                 |
| properties                 | type='gp'                            |
| ram                        | 512                                  |
| rxtx_factor                | 1.0                                  |
| swap                       |                                      |
| vcpus                      | 1                                    |
+----------------------------+--------------------------------------+
```


#### Key pairs

SSH key pairs are also managed by the `Nova` service. To list available
resources, we will use the following command:

```
[user.name@fep8 ~]$ openstack keypair list
+------+-------------------------------------------------+------+
| Name | Fingerprint                                     | Type |
+------+-------------------------------------------------+------+
| fep  | xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx | ssh  |
+------+-------------------------------------------------+------+
```

:::info Visible resources
OpenStack resources are scoped at multiple levels. Despite working in a shared
project with other users, you are only able to see your own SSH keys in the
output of `keypair list`. The same is also true for other resource types, but
scope structure differs (e.g. you can only see a project's private images,
images that were shared with the project, or public images, but cannot see a
different project's private images).
:::

You can use the `openstack keypair show` command to get more details on the
resource:

```
[user.name@fep8 ~]$ openstack keypair show fep
+-------------+-------------------------------------------------+
| Field       | Value                                           |
+-------------+-------------------------------------------------+
| created_at  | 20XX-02-30T00:00:00.000000                      |
| fingerprint | xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx |
| id          | fep                                             |
| is_deleted  | False                                           |
| name        | fep                                             |
| private_key | None                                            |
| type        | ssh                                             |
| user_id     | user.name                                       |
+-------------+-------------------------------------------------+
```


#### Networks

Networks are managed by the `Neutron` service. We will use the `openstack net
list` command to list all available networks:

```
[user.name@fep8 ~]$ openstack net list
+--------------------------------------+----------+--------------------------------------+
| ID                                   | Name     | Subnets                              |
+--------------------------------------+----------+--------------------------------------+
| xxxxxxxx-yyyy-zzzz-tttt-xxxxxxxxxx31 | vlan9    | xxxxxxxx-yyyy-zzzz-tttt-xxxxxxxxxx35 |
| xxxxxxxx-yyyy-zzzz-tttt-xxxxxxxxxx32 | demo-net | xxxxxxxx-yyyy-zzzz-tttt-xxxxxxxxxx36 |
| xxxxxxxx-yyyy-zzzz-tttt-xxxxxxxxxx33 | Net224   | xxxxxxxx-yyyy-zzzz-tttt-xxxxxxxxxx37 |
| xxxxxxxx-yyyy-zzzz-tttt-xxxxxxxxxx34 | Net240   | xxxxxxxx-yyyy-zzzz-tttt-xxxxxxxxxx38 |
+--------------------------------------+----------+--------------------------------------+
```

Let's see the available details about:
  * the `vlan9` network, using `openstack net show`;
  * its associated subnet, using `openstack subnet show`.

```
[user.name@fep8 ~]$ openstack net show xxxxxxxx-yyyy-zzzz-tttt-xxxxxxxxxx31
+---------------------------+--------------------------------------+
| Field                     | Value                                |
+---------------------------+--------------------------------------+
| admin_state_up            | UP                                   |
| availability_zone_hints   |                                      |
| availability_zones        | nova                                 |
| created_at                | 20XX-02-30T00:00:00Z                 |
| description               |                                      |
| dns_domain                | None                                 |
| id                        | xxxxxxxx-yyyy-zzzz-tttt-xxxxxxxxxx31 |
| ipv4_address_scope        | None                                 |
| ipv6_address_scope        | None                                 |
| is_default                | False                                |
| is_vlan_transparent       | None                                 |
| mtu                       | 1500                                 |
| name                      | vlan9                                |
| port_security_enabled     | True                                 |
| project_id                | xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx     |
| provider:network_type     | None                                 |
| provider:physical_network | None                                 |
| provider:segmentation_id  | None                                 |
| qos_policy_id             | None                                 |
| revision_number           | 6                                    |
| router:external           | External                             |
| segments                  | None                                 |
| shared                    | True                                 |
| status                    | ACTIVE                               |
| subnets                   | xxxxxxxx-yyyy-zzzz-tttt-xxxxxxxxxx35 |
| tags                      |                                      |
| updated_at                | 20XX-02-30T00:00:00Z                 |
+---------------------------+--------------------------------------+
```

```
[user.name@fep8 ~]$ openstack subnet show xxxxxxxx-yyyy-zzzz-tttt-xxxxxxxxxx35
+----------------------+--------------------------------------+
| Field                | Value                                |
+----------------------+--------------------------------------+
| allocation_pools     | 10.9.0.100-10.9.255.254              |
| cidr                 | 10.9.0.0/16                          |
| created_at           | 20XX-02-30T00:00:01Z                 |
| description          |                                      |
| dns_nameservers      | 1.1.1.1                              |
| dns_publish_fixed_ip | None                                 |
| enable_dhcp          | True                                 |
| gateway_ip           | 10.9.0.1                             |
| host_routes          |                                      |
| id                   | xxxxxxxx-yyyy-zzzz-tttt-xxxxxxxxxx35 |
| ip_version           | 4                                    |
| ipv6_address_mode    | None                                 |
| ipv6_ra_mode         | None                                 |
| name                 | vlan9-subnet                         |
| network_id           | xxxxxxxx-yyyy-zzzz-tttt-xxxxxxxxxx31 |
| project_id           | xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx     |
| revision_number      | 2                                    |
| segment_id           | None                                 |
| service_types        |                                      |
| subnetpool_id        | None                                 |
| tags                 |                                      |
| updated_at           | 20XX-02-30T00:00:02Z                 |
+----------------------+--------------------------------------+
```


#### Security groups

Security groups are managed by the `Neutron` service. We will use the following
command to list them:

```
[user.name@fep8 ~]$ openstack security group list
+--------------------------------------+----------+------------------------+----------------------------------+------+
| ID                                   | Name     | Description            | Project                          | Tags |
+--------------------------------------+----------+------------------------+----------------------------------+------+
| xxxxxxxx-yyyy-zzzz-tttt-xxxxxxxxxx41 | security |                        | xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx | []   |
| xxxxxxxx-yyyy-zzzz-tttt-xxxxxxxxxx42 | default  | Default security group | xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx | []   |
+--------------------------------------+----------+------------------------+----------------------------------+------+
```

For a verbose description of the security group we can run `openstack security
group show` followed by the ID of the group we want to inspect:

```
[user.name@fep8 ~]$ openstack security group show xxxxxxxx-yyyy-zzzz-tttt-xxxxxxxxxx42
+-----------------+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| Field           | Value                                                                                                                                                                           |
+-----------------+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| created_at      | 20XX-02-30T00:00:00Z                                                                                                                                                            |
| description     | Default security group                                                                                                                                                          |
| id              | xxxxxxxx-yyyy-zzzz-tttt-xxxxxxxxxx42                                                                                                                                            |
| name            | default                                                                                                                                                                         |
| project_id      | xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx                                                                                                                                                |
| revision_number | 7                                                                                                                                                                               |
| rules           | created_at='20XX-02-30T00:00:20Z', direction='egress', ethertype='IPv6', id='xxxxxxxx-yyyy-zzzz-tttt-xxxxxxxxxx51', standard_attr_id='4801', updated_at='20XX-02-30T00:00:22Z'  |
[...]
+-----------------+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
```


### Booting an instance

Finally, now that we have all the required information, we can start a new
instance. We will use:
  * image: `Ubuntu 16.04 Xenial`;
  * flavor: `m1.tiny`;
  * key pair: your own key pair;
  * network: `vlan9`;
  * security group: `default`;
  * name: `user.name-vm`.

We will run the following command to create the instance:

```
[user.name@fep8 ~]$ openstack server create --flavor m1.tiny --image xxxxxxxx-yyyy-zzzz-tttt-xxxxxxxxxx12 --nic net-id=xxxxxxxx-yyyy-zzzz-tttt-xxxxxxxxxx31 --security-group default --key-name fep user.name-vm
+-----------------------------+------------------------------------------------------------+
| Field                       | Value                                                      |
+-----------------------------+------------------------------------------------------------+
| OS-DCF:diskConfig           | MANUAL                                                     |
| OS-EXT-AZ:availability_zone |                                                            |
| OS-EXT-STS:power_state      | NOSTATE                                                    |
| OS-EXT-STS:task_state       | scheduling                                                 |
| OS-EXT-STS:vm_state         | building                                                   |
| OS-SRV-USG:launched_at      | None                                                       |
| OS-SRV-USG:terminated_at    | None                                                       |
| accessIPv4                  |                                                            |
| accessIPv6                  |                                                            |
| addresses                   |                                                            |
| adminPass                   | AbcdEfghIJkl                                               |
| config_drive                |                                                            |
| created                     | 20XX-02-30T00:01:00Z                                       |
| flavor                      | m1.tiny (xxxxxxxx-yyyy-zzzz-tttt-xxxxxxxxxx21)             |
| hostId                      |                                                            |
| id                          | xxxxxxxx-yyyy-zzzz-tttt-xxxxxxxxxx71                       |
| image                       | Ubuntu 16.04 Xenial (xxxxxxxx-yyyy-zzzz-tttt-xxxxxxxxxx12) |
| key_name                    | fep                                                        |
| name                        | user.name-vm                                               |
| progress                    | 0                                                          |
| project_id                  | xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx                           |
| properties                  |                                                            |
| security_groups             | name='xxxxxxxx-yyyy-zzzz-tttt-xxxxxxxxxx42'                |
| status                      | BUILD                                                      |
| updated                     | 20XX-02-30T00:01:00Z                                       |
| user_id                     | user.name                                                  |
| volumes_attached            |                                                            |
+-----------------------------+------------------------------------------------------------+
```

:::note Observe the virtual machine's state
Follow the state of the booted instance in the `Horizon` web interface.

Make a note of the ID of the instance, since we will be using it later.
:::



### Instance lifecycle

In this section we will perform various operations related to the lifecycle of
an instance.


#### Query

We can use the `openstack server list` to list all virtual machine instances:

```
[user.name@fep8 ~]$ openstack server list
+--------------------------------------+--------------+--------+------------------+---------------------+-----------+
| ID                                   | Name         | Status | Networks         | Image               | Flavor    |
+--------------------------------------+--------------+--------+------------------+---------------------+-----------+
| xxxxxxxx-yyyy-zzzz-tttt-xxxxxxxxxx71 | user.name-vm | ACTIVE | vlan9=10.9.3.125 | Ubuntu 16.04 Xenial | m1.tiny   |
+--------------------------------------+--------------+--------+------------------+---------------------+-----------+
```

Use the `openstack server show` to get details about the running instance:

```
[user.name@fep8 ~]$ openstack server show xxxxxxxx-yyyy-zzzz-tttt-xxxxxxxxxx71
+-----------------------------+------------------------------------------------------------+
| Field                       | Value                                                      |
+-----------------------------+------------------------------------------------------------+
| OS-DCF:diskConfig           | MANUAL                                                     |
| OS-EXT-AZ:availability_zone | NCIT                                                       |
| OS-EXT-STS:power_state      | Running                                                    |
| OS-EXT-STS:task_state       | None                                                       |
| OS-EXT-STS:vm_state         | active                                                     |
| OS-SRV-USG:launched_at      | 20XX-02-30T00:01:29.000000                                 |
| OS-SRV-USG:terminated_at    | None                                                       |
| accessIPv4                  |                                                            |
| accessIPv6                  |                                                            |
| addresses                   | vlan9=10.9.3.125                                           |
| config_drive                |                                                            |
| created                     | 20XX-02-30T00:01:00Z                                       |
| flavor                      | m1.tiny (xxxxxxxx-yyyy-zzzz-tttt-xxxxxxxxxx21)             |
| hostId                      | xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx   |
| id                          | xxxxxxxx-yyyy-zzzz-tttt-xxxxxxxxxx71                       |
| image                       | Ubuntu 16.04 Xenial (xxxxxxxx-yyyy-zzzz-tttt-xxxxxxxxxx12) |
| key_name                    | fep                                                        |
| name                        | user.name-vm                                               |
| progress                    | 0                                                          |
| project_id                  | xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx                           |
| properties                  |                                                            |
| security_groups             | name='default'                                             |
| status                      | ACTIVE                                                     |
| updated                     | 20XX-02-30T00:01:29Z                                       |
| user_id                     | user.name                                                  |
| volumes_attached            |                                                            |
+-----------------------------+------------------------------------------------------------+
```

:::note Test the connectivity
Test the connectivity to the virtual machine. Connect using SSH as the `ubuntu`
user.
:::


#### Stop the instance

To stop the instance without deleting it, we can use the `openstack server stop`
command. This is equivalent to shutting the instance down.

```
[user.name@fep8 ~]$ openstack server stop xxxxxxxx-yyyy-zzzz-tttt-xxxxxxxxxx71
[user.name@fep8 ~]$ openstack server list
+--------------------------------------+--------------+---------+------------------+---------------------+-----------+
| ID                                   | Name         | Status  | Networks         | Image               | Flavor    |
+--------------------------------------+--------------+---------+------------------+---------------------+-----------+
| xxxxxxxx-yyyy-zzzz-tttt-xxxxxxxxxx71 | user.name-vm | SHUTOFF | vlan9=10.9.3.125 | Ubuntu 16.04 Xenial | m1.tiny   |
+--------------------------------------+--------------+---------+------------------+---------------------+-----------+
```


#### Starting an instance

After being stopped, an instance can be started using the `openstack server
start` command:

```
[user.name@fep8 ~]$ openstack server start xxxxxxxx-yyyy-zzzz-tttt-xxxxxxxxxx71
```

:::note Verify successful start
After starting the instance:
  * access `Horizon` and verify that the instance has started;
  * connect using SSH to check if it is still reachable.
:::


#### Terminating an instance

Terminate the instance using the `openstack server delete` command:

```
[user.name@fep8 ~]$ openstack server delete xxxxxxxx-yyyy-zzzz-tttt-xxxxxxxxxx71
[user.name@fep8 ~]$ openstack server list
+----+------+--------+----------+-------+--------+
| ID | Name | Status | Networks | Image | Flavor |
+----+------+--------+----------+-------+--------+
+----+------+--------+----------+-------+--------+
```


### Initial configuration

OpenStack provides a mechanism for configuring an instance at first boot. This
is called a `day-0 configuration` and is implemented by the `cloud-init` module.

To use this functionality you must first create an initialization script (on
fep), that will be injected when the instance runs for the first time:

```bash
[user.name@fep8 ~]$ cat day0.txt
#!/bin/bash
echo test > /tmp/test.txt
```

Afterwards, boot an instance using `openstack server create` and inject the
script as user data in the virtual machine. You can use the same parameters as
before.

:::tip
Read the documentation of the [server create][] subcommand and find how you can
inject the configuration script as user data.
[server create]: https://docs.openstack.org/python-openstackclient/wallaby/cli/command-objects/server.html#server-create
:::

:::note Verify that the script ran
After the instance finishes booting, login on the virtual machine and confirm
that the `/tmp/test.txt` file has been created.
:::

Any script, no matter how complex, can be injected in the instance using this
mechanism.

:::note Clean up
Terminate the instance before advancing to the next task.
:::


### Networking

We want to create a topology of 2 virtual machines (a client and a server),
connected through a private network. Each virtual machine must also have a
management connection in the `vlan9` network:

```
+--------+          user.name-network            +--------+
| client |---------------------------------------| server |
+--------+            172.16.X.0/24              +--------+
    |                                                |
    | vlan9                                          | vlan9
    |                                                |
```

  * `vlan9` already exists and is a **provider** (physical) network;
  * `user.name-network` will have to be created and will be a **self-service**
    network (user defined, only visible inside our own project).


#### Creating the network

Create the network using the following command:

```
[user.name@fep8 ~]$ openstack net create user.name-network
+---------------------------+--------------------------------------+
| Field                     | Value                                |
+---------------------------+--------------------------------------+
| admin_state_up            | UP                                   |
| availability_zone_hints   |                                      |
| availability_zones        |                                      |
| created_at                | 20XX-02-30T00:02:00Z                 |
| description               |                                      |
| dns_domain                | None                                 |
| id                        | xxxxxxxx-yyyy-zzzz-tttt-xxxxxxxxxx81 |
| ipv4_address_scope        | None                                 |
| ipv6_address_scope        | None                                 |
| is_default                | False                                |
| is_vlan_transparent       | None                                 |
| mtu                       | 1450                                 |
| name                      | user.name-network                    |
| port_security_enabled     | True                                 |
| project_id                | xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx     |
| provider:network_type     | None                                 |
| provider:physical_network | None                                 |
| provider:segmentation_id  | None                                 |
| qos_policy_id             | None                                 |
| revision_number           | 1                                    |
| router:external           | Internal                             |
| segments                  | None                                 |
| shared                    | False                                |
| status                    | ACTIVE                               |
| subnets                   |                                      |
| tags                      |                                      |
| updated_at                | 20XX-02-30T00:02:00Z                 |
+---------------------------+--------------------------------------+
```

:::note Verify successful creation
Verify that the network has been successfully created using:
  * `Horizon`, access `Project` &rarr; `Network` &rarr; `Networks`;
  * the `openstack net show` command.
:::


#### Creating the subnet

The next step is to create a subnet for the `user.name-network`. We will use the
`openstack subnet create` command and:
  * `172.16.X.0/24` as the subnet prefix;
  * `user.name-subnet` for name;
  * no gateway (the virtual machines will have a gateway set through `vlan9`).

```
[user.name@fep8 ~]$ openstack subnet create user.name-subnet --network user.name-network --subnet-range 172.16.X.0/24
+----------------------+--------------------------------------+
| Field                | Value                                |
+----------------------+--------------------------------------+
| allocation_pools     | 172.16.X.2-172.16.X.254              |
| cidr                 | 172.16.X.0/24                        |
| created_at           | 20XX-02-30T00:03:00Z                 |
| description          |                                      |
| dns_nameservers      |                                      |
| dns_publish_fixed_ip | None                                 |
| enable_dhcp          | True                                 |
| gateway_ip           | 172.16.X.1                           |
| host_routes          |                                      |
| id                   | xxxxxxxx-yyyy-zzzz-tttt-xxxxxxxxxx91 |
| ip_version           | 4                                    |
| ipv6_address_mode    | None                                 |
| ipv6_ra_mode         | None                                 |
| name                 | user.name-subnet                     |
| network_id           | xxxxxxxx-yyyy-zzzz-tttt-xxxxxxxxxx81 |
| project_id           | xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx     |
| revision_number      | 0                                    |
| segment_id           | None                                 |
| service_types        |                                      |
| subnetpool_id        | None                                 |
| tags                 |                                      |
| updated_at           | 20XX-02-30T00:03:00Z                 |
+----------------------+--------------------------------------+
```

:::note Verify successful creation
Verify that the network has been successfully created using:
  * `Horizon`, access `Project` &rarr; `Network` &rarr; `Networks` &rarr;
    `user.name-network` &rarr; `Subnets`;
  * the `openstack subnet show` command.
:::


#### Boot the instances

Boot two `m1.tiny` instances based on `Ubuntu 16.04 Xenial` that are connected
to both `vlan9` and the newly created network.

:::tip
The `--nic` parameter can be specified multiple times.
:::

:::note Test connectivity
Connect to both virtual machines using SSH and request IPs through DHCP for the
second network interface:

```bash
ubuntu@user.name-vm-1:~$ sudo dhclient ens4
ubuntu@user.name-vm-2:~$ sudo dhclient ens4
```

Verify that each instance gets the correct IP address and that you can send
packages from one instance to the other through the private network.
:::

:::note Automatic configuration
Delete the instances and recreate them. This time, instead of manually logging
in on the instances and running `dhclient`, do this via `cloud-init`.
:::


#### Clean up

Delete both virtual machines, the subnet and the network that you have
previously created.

:::tip
Use the `openstack server delete` and `openstack net delete` commands to delete
the resources.
:::


## Orchestration

OpenStack allows defining complex architectures composed of multiple cloud
objects through a single operation, through a mechanism called `orchestration`.
To use orchestration we need an additional object, called a `stack`. The service
that handles orchestration in OpenStack is called `Heat`.


### Creating a stack
We will define a new stack that deploys three Ubuntu virtual machines at the
same time. For this, go to `Project` &rarr; `Orchestration` &rarr; `Stacks` and
click on `Launch Stack`. The stack will be called `user.name-stack`.

For `Template source` upload a file with the following content (substitute the
parameters for `name`, `image` and `key_name` accordingly):

```yaml
heat_template_version: 2013-05-23

resources:
  vm1:
    type: OS::Nova::Server
    properties:
      name: user.name-vm1
      image: xxxxxxxx-yyyy-zzzz-tttt-xxxxxxxxxx12
      flavor: m1.tiny
      key_name: fep
      networks:
      - network: vlan9

  vm2:
    type: OS::Nova::Server
    properties:
      name: user.name-vm2
      image: xxxxxxxx-yyyy-zzzz-tttt-xxxxxxxxxx12
      flavor: m1.tiny
      key_name: fep
      networks:
      - network: vlan9

  vm3:
    type: OS::Nova::Server
    properties:
      name: user.name-vm3
      image: xxxxxxxx-yyyy-zzzz-tttt-xxxxxxxxxx12
      flavor: m1.tiny
      key_name: fep
      networks:
      - network: vlan9
```

:::tip Stack password
You do not need to enter your LDAP account's password in the field with the
label `Password for user "user.name"`. The meaning of the stack parameters is
presented in the [Launch and manage stacks][] page.
[Launch and manage stacks]: https://docs.openstack.org/mitaka/user-guide/dashboard_stacks.html
:::

:::note Inspect the stack
After the stack is created:
  * verify that the three instances have been launched;
  * click on the stack name and inspect the associated resources;
  * suspend / resume the stack and see what happens to the instances;
  * delete the stack.
:::


### Initial configuration
With the template above as a base, create a new one that will also provision the
instances with an initial configuration:
  * each instance should have `apache2` installed;
  * the `index.html` file in `/var/www/html` should contain `This is <VM name>`.

:::tip
Review the [software configuration][] page for configuration examples.
[software configuration]: https://docs.openstack.org/heat/wallaby/template_guide/software_deployment.html
:::


## Revoke your authentication token

Before disconnecting, revoke your authentication token:

```bash
[user.name@fep8 ~]$ openstack token revoke $OS_TOKEN
```

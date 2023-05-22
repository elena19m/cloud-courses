import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

## Installation and configuration

The Elastic team provides multiple installation option. For the sake of
simplicity, we will use the precompiled packages for the specific distributions
we are using and briefly discuss other deployment options at the end.

For this lab we will use 2 virtual machines (systems). A system will be the
location of the Elastic Stack (Elasticsearch, Kibana and, eventually, Logstash).
This system runs AlmaLinux 8, so we will use RPM packages to install the 
components. The other system will represent a machine we want to monitor and
will run various Beats. It runs Ubuntu 20.04, so we will use DEB packages to
install the Beats.

### Elasticsearch

We will install Elasticsearch on the `lab-elk-1` (`lab-elk`) VM.
Download the RPM package and its signature using the commands below.

```shell-session
[root@elk ~] wget https://artifacts.elastic.co/downloads/elasticsearch/elasticsearch-8.7.0-x86_64.rpm
[root@elk ~] wget https://artifacts.elastic.co/downloads/elasticsearch/elasticsearch-8.7.0-x86_64.rpm.sha512
```

Don’t forget to check the hash in order to protect from supply chain attacks.

```shell-session
[root@elk ~]$ sha512sum -c elasticsearch-8.7.0-x86_64.rpm.sha512
elasticsearch-8.7.0-x86_64.rpm: OK
```

If the checksum is ok, continue installing.

:::danger
During the installation process, elasticsearch will print to the terminal
important information (such as the password of the default `elastic` user).

**We will need some of if later in the lab.**

**Copy it to a file on your local machine so you are able to refer to it later.**
:::

```shell-session
[root@elk ~]$ rpm --install elasticsearch-8.7.0-x86_64.rpm
warning: elasticsearch-8.7.0-x86_64.rpm: Header V4 RSA/SHA512 Signature, key ID d88e42b4: NOKEY
Creating elasticsearch group... OK
Creating elasticsearch user... OK
--------------------------- Security autoconfiguration information ------------------------------

Authentication and authorization are enabled.
TLS for the transport and HTTP layers is enabled and configured.

The generated password for the elastic built-in superuser is : J6qXS0=rZtQYz25*MEaC

If this node should join an existing cluster, you can reconfigure this with
'/usr/share/elasticsearch/bin/elasticsearch-reconfigure-node --enrollment-token <token-here>'
after creating an enrollment token on your existing cluster.

You can complete the following actions at any time:

Reset the password of the elastic built-in superuser with
'/usr/share/elasticsearch/bin/elasticsearch-reset-password -u elastic'.

Generate an enrollment token for Kibana instances with
 '/usr/share/elasticsearch/bin/elasticsearch-create-enrollment-token -s kibana'.

Generate an enrollment token for Elasticsearch nodes with
'/usr/share/elasticsearch/bin/elasticsearch-create-enrollment-token -s node'.

-------------------------------------------------------------------------------------------------
### NOT starting on installation, please execute the following statements to configure elasticsearch service to start automatically using systemd
 sudo systemctl daemon-reload
 sudo systemctl enable elasticsearch.service
### You can start elasticsearch service by executing
 sudo systemctl start elasticsearch.service
[/usr/lib/tmpfiles.d/elasticsearch.conf:1] Line references path below legacy directory /var/run/, updating /var/run/elasticsearch → /run/elasticsearch; please update the tmpfiles.d/ drop-in file accordingly.
```

As seen in the output above, this method of installation defaults to using TLS
for all connections. We will keep this unchanged, since it is good practice, but
this means we will need to configure additional options for the other services
that are trying to connect to Elasticsearch.

<details>
<summary>Peek into the systemd service file</summary>

You can take a look into the service file if you want to see some of the
environmental values and tweaks that you would have to do when installing from
source. More on that [here](https://www.elastic.co/guide/en/elasticsearch/reference/8.7/system-config.html).

```systemd
[Unit]
#[...]

[Service]
#[...]
Environment=ES_HOME=/usr/share/elasticsearch
Environment=ES_PATH_CONF=/etc/elasticsearch
Environment=PID_DIR=/var/run/elasticsearch
Environment=ES_SD_NOTIFY=true
EnvironmentFile=-/etc/sysconfig/elasticsearch

WorkingDirectory=/usr/share/elasticsearch

User=elasticsearch
Group=elasticsearch

# [...]

# Specifies the maximum file descriptor number that can be opened by this process
LimitNOFILE=65535

# Specifies the maximum number of processes
LimitNPROC=4096

# Specifies the maximum size of virtual memory
LimitAS=infinity

# Specifies the maximum file size
LimitFSIZE=infinity

# [...]
```

</details>
    

#### Useful locations

For RPM-based distributions, these are the folders where Elasticsearch and its
related tools and configuration files can be found:

- `/usr/share/elasticsearch`
    
    This is where various elasticsearch related tools are located
    
    ```shell-session
    [root@elk ~]# ls -la /usr/share/elasticsearch
    total 2228
    drwxr-xr-x.  7 root root     129 Apr 19 16:27 .
    drwxr-xr-x. 76 root root    4096 Apr 19 16:27 ..
    drwxr-xr-x.  2 root root    4096 Apr 19 16:27 bin
    drwxr-xr-x.  8 root root      96 Apr 19 16:27 jdk
    drwxr-xr-x.  5 root root    4096 Apr 19 16:27 lib
    -rw-r--r--.  1 root root    3860 Mar 27 19:30 LICENSE.txt
    drwxr-xr-x. 70 root root    4096 Apr 19 16:27 modules
    -rw-r--r--.  1 root root 2251227 Mar 27 19:32 NOTICE.txt
    drwxr-xr-x.  2 root root       6 Mar 27 19:37 plugins
    -rw-r--r--.  1 root root    8106 Mar 27 19:30 README.asciidoc
    ```
    
    Of interest to us are the `bin` and `jdk` directories. The `bin` directory
    contains useful tools, such as the CLI and `elasticsearch-reset-password` 
    (in case you lost the initial password that was outputted during 
    installation). Since Elasticsearch is written in Java, the `jdk` directory 
    contains a packaged Java Development Kit (including the JRE).
    
- `/etc/elasticsearch` - the main configuration directory
    
    ```shell-session
    [root@elk ~]# ls -la /etc/elasticsearch
    total 60
    drwxr-s---.  4 root elasticsearch  4096 Apr 19 16:38 .
    drwxr-xr-x. 79 root root           8192 Apr 19 16:28 ..
    drwxr-x---.  2 root elasticsearch    62 Apr 19 16:28 certs
    -rw-rw----.  1 root elasticsearch   536 Apr 19 16:28 elasticsearch.keystore
    -rw-rw----.  1 root elasticsearch  1042 Mar 27 19:34 elasticsearch-plugins.example.yml
    -rw-rw----.  1 root elasticsearch  4048 Apr 19 16:28 elasticsearch.yml
    -rw-rw----.  1 root elasticsearch  2623 Mar 27 19:34 jvm.options
    drwxr-s---.  2 root elasticsearch     6 Mar 27 19:37 jvm.options.d
    -rw-rw----.  1 root elasticsearch 17770 Mar 27 19:34 log4j2.properties
    -rw-rw----.  1 root elasticsearch   473 Mar 27 19:34 role_mapping.yml
    -rw-rw----.  1 root elasticsearch   197 Mar 27 19:34 roles.yml
    -rw-rw----.  1 root elasticsearch     0 Mar 27 19:34 users
    -rw-rw----.  1 root elasticsearch     0 Mar 27 19:34 users_roles
    ```
    
    The `elasticsearch.yml` file contains the main configuration. Fortunately, 
    elasticsearch comes with decent configuration options that we don’t need 
    to change.
    
    `jvm.options` and the  `jvm.options.d` folder are used to configure JVM 
    related settings, such as maximum memory usage.
    
- `/etc/elasticsearch/certs`
    
    This is the location of the certificates generated during the installation
    and used for secure communication between the Elastic Stack components.
    
    ```shell-session
    [root@elk ~]# ls -la /etc/elasticsearch/certs
    total 28
    drwxr-x---. 2 root elasticsearch    62 Apr 19 16:28 .
    drwxr-s---. 4 root elasticsearch  4096 Apr 19 16:38 ..
    -rw-rw----. 1 root elasticsearch  1915 Apr 19 16:28 http_ca.crt
    -rw-rw----. 1 root elasticsearch 10013 Apr 19 16:28 http.p12
    -rw-rw----. 1 root elasticsearch  5822 Apr 19 16:28 transport.p12
    ```
    

As of now, elasticsearch is only installed. In order to enable and start the
service use

```shell-session
[root@elk ~]$ systemctl daemon-reload
[root@elk ~]$ systemctl enable --now elasticsearch
```

We can check that everything is working correctly by sending a request to the
Elasticsearch instance.

```shell-session
[root@elk ~]$ curl --cacert /etc/elasticsearch/certs/http_ca.crt -u elastic https://localhost:9200
Enter host password for user 'elastic':
{
  "name" : "elk",
  "cluster_name" : "elasticsearch",
  "cluster_uuid" : "NTHTJiGyRYy_G6cbJ6G6MA",
  "version" : {
    "number" : "8.7.0",
    "build_flavor" : "default",
    "build_type" : "rpm",
    "build_hash" : "09520b59b6bc1057340b55750186466ea715e30e",
    "build_date" : "2023-03-27T16:31:09.816451435Z",
    "build_snapshot" : false,
    "lucene_version" : "9.5.0",
    "minimum_wire_compatibility_version" : "7.17.0",
    "minimum_index_compatibility_version" : "7.0.0"
  },
  "tagline" : "You Know, for Search"
}
```

Since the certificates generated by Elasticsearch upon installation are
self-signed, we need to specify the location of the CA certificate in order for
curl to verify the certificate of the Elasticsearch cluster.

:::danger
**Before we continue - firewall configuration**

The AlmaLinux distribution we are using comes with a preconfigured firewall that
does not allow traffic to port 9200 (the default elasticsearch port).

You can permit traffic to that port using the command `firewall-cmd --add-service=elasticsearch`.
Verify this worked by issuing a curl request from your Openstack VM to the VM
running Elasticsearch.
```shell-session
student@openstack-vm:~$ curl -k -u elastic https://192.168.100.101:9200/
Enter host password for user 'elastic':
{
  "name" : "elk",
  "cluster_name" : "elasticsearch",
  "cluster_uuid" : "NTHTJiGyRYy_G6cbJ6G6MA",
  "version" : {
    "number" : "8.7.0",
    "build_flavor" : "default",
    "build_type" : "rpm",
    "build_hash" : "09520b59b6bc1057340b55750186466ea715e30e",
    "build_date" : "2023-03-27T16:31:09.816451435Z",
    "build_snapshot" : false,
    "lucene_version" : "9.5.0",
    "minimum_wire_compatibility_version" : "7.17.0",
    "minimum_index_compatibility_version" : "7.0.0"
  },
  "tagline" : "You Know, for Search"
}
```
You will have to do this for Kibana as well.
:::

### Kibana

While we can use the Elasticsearch [API](https://www.elastic.co/guide/en/elasticsearch/reference/current/search-search.html)
to search the database, this is cumbersome and hard to visualize. We will deploy
Kibana for this, running on the same machine.

First, download the Kibana RPM package and checksum, check the checksum and 
install.

```shell-session
[root@elk ~]$ wget https://artifacts.elastic.co/downloads/kibana/kibana-8.7.0-x86_64.rpm
[root@elk ~]$ wget https://artifacts.elastic.co/downloads/kibana/kibana-8.7.0-x86_64.rpm.sha512
[root@elk ~]$ sha512sum -c kibana-8.7.0-x86_64.rpm.sha512
kibana-8.7.0-x86_64.rpm: OK
[root@elk ~]$ rpm --install kibana-8.7.0-x86_64.rpm
warning: kibana-8.7.0-x86_64.rpm: Header V4 RSA/SHA512 Signature, key ID d88e42b4: NOKEY
Creating kibana group... OK
Creating kibana user... OK
Created Kibana keystore in /etc/kibana/kibana.keystore
[/usr/lib/tmpfiles.d/elasticsearch.conf:1] Line references path below legacy directory /var/run/, updating /var/run/elasticsearch → /run/elasticsearch; please update the tmpfiles.d/ drop-in file accordingly.
```

Before starting the Kibana service we need to configure it to connect to our
Elasticsearch instance. This can be easily done with the use of an enrollment
token. To generate an enrollment token, go to the `/usr/share/elasticsearch/bin/`
directory and use the `elasticsearch-create-enrollment-token` binary.

```shell-session
[root@elk bin]# ./elasticsearch-create-enrollment-token -s kibana
eyJ2ZXIiOiI4LjcuMCIsImFkciI6WyIxOTIuMTY4LjEwMC4xMDE6OTIwMCJdLCJmZ3IiOiI0ODM3M2U3ZjY2NTM2NjViMGVmOGRkOWI1OWVlNzk4M2FmNDJlMTU4MjRlNDNjYTBiMTY2NDIzNzNiOTNjODI2Iiwia2V5IjoiZHlTb29vY0JiSkYySTVXbEpIMEc6Uy1ia2NkbVJUb0dCSXN4bGpwOE8wZyJ9
```

After this, run `kibana-setup` as the Kibana user.

```shell-session
[root@elk ~]# sudo -u kibana /usr/share/kibana/bin/kibana-setup --enrollment-token <enrollment-token>

✔ Kibana configured successfully.

To start Kibana run:
  bin/kibana
```

<details>
<summary>Peek into the enrollment-token</summary>

The token is a base64 encoded JSON containing some information about the
Elasticsearch host(s) and a few secret variables. Kibana will reach to an API
endpoint in for further configuration. More [here](https://www.elastic.co/guide/en/elasticsearch/reference/8.7/security-api-kibana-enrollment.html).

```shell-session
$ echo "eyJ2ZXIiOiI4LjcuMCIsImFkciI6WyIxOTIuMTY4LjEwMC4xMDE6OTIwMCJdLCJmZ3IiOiI0ODM3M2U3ZjY2NTM2NjViMGVmOGRkOWI1OWVlNzk4M2FmNDJlMTU4MjRlNDNjYTBiMTY2NDIzNzNiOTNjODI2Iiwia2V5IjoiZHlTb29vY0JiSkYySTVXbEpIMEc6Uy1ia2NkbVJUb0dCSXN4bGpwOE8wZyJ9" | base64 -d | jq .
{
  "ver": "8.7.0",
  "adr": [
    "192.168.100.101:9200"
  ],
  "fgr": "48373e7f6653665b0ef8dd9b59ee7983af42e15824e43ca0b16642373b93c826",
  "key": "dySooocBbJF2I5WlJH0G:S-bkcdmRToGBIsxljp8O0g"
}
```

</details>    

We also need to configure Kibana to listen on all interfaces. To do that, add
the line `server.host: "0.0.0.0"` to the `/etc/kibana/kibana.yml` file, or find
the commented one and modify it.

Now, we can go ahead and start Kibana using systemd.

```shell-session
[root@elk ~]# systemctl daemon-reload
[root@elk ~]# systemctl enable --now kibana
Created symlink /etc/systemd/system/multi-user.target.wants/kibana.service → /usr/lib/systemd/system/kibana.service.
```

:::danger
**Firewall configuration**

Don’t forget to open the port in the firewall.

`firewall-cmd --add-service=kibana`
:::

Connect to the Kibana instance on port 5601 using a browser and `ssh` as a SOCKS proxy. 
Revisit the LDAP lab if you do not remember how to do that.

Login using the credentials printed by Elasticsearch in the installation process
and wait for the initial setup to be done. Check that you can access the Kibana
UI. This might take a few minutes on the lab infrastructure. You can read the 
next section in the meantime.

### Alternative installation methods

<Tabs>
<TabItem value="DEB/RPM repositories" label="DEB/RPM repositories" default>

Instead of downloading the packages you can use your distribution’s package 
manager by installing the PGP key of Elasticsearch and adding the repositories. 
Below are the steps  for RPM.

1. Import the PGP key
    
    ```shell-session
    rpm --import https://artifacts.elastic.co/GPG-KEY-elasticsearch
    ```
    
2. Create the file `/etc/yum.repos.d/elasticsearch.repo` with the content below
    
    ```shell-session
    [elasticsearch]
    name=Elasticsearch repository for 8.x packages
    baseurl=https://artifacts.elastic.co/packages/8.x/yum
    gpgcheck=1
    gpgkey=https://artifacts.elastic.co/GPG-KEY-elasticsearch
    enabled=0
    autorefresh=1
    type=rpm-md
    ```
    
3. Install the packages
    
    ```shell-session
    sudo yum install --enablerepo=elasticsearch elasticsearch
    ```
    
</TabItem>

<TabItem value="Docker" label="Docker">

There are also Docker containers built for all the Elastic Stack components. 
The steps to use them look something like this:

1. Pull the image
    
    ```shell-session
    docker pull docker.elastic.co/elasticsearch/elasticsearch:8.7.0
    ```
    
2. Create a network for Elasticsearch and Kibana
    
    ```shell-session
    docker network create elastic
    ```
    
3. Start Elasticsearch and/or Kibana
    
    ```shell-session
    docker run --name es01 --net elastic -p 9200:9200 -it docker.elastic.co/elasticsearch/elasticsearch:8.7.0
    ```
    
</TabItem>
</Tabs>

For more details check [the documentation](https://www.elastic.co/guide/en/elasticsearch/reference/current/install-elasticsearch.html).

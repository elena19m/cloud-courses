## Networking in Docker

One of the advantages of using Docker is the network isolation provided by the solution.
When starting containers, they are isolated by default from the host system's network.
Containers are started in the `bridge` network.

Let's start a container in the default network and see if we can access it.

```console
docker run --name webserver-1 -d -t python-container:latest
```

The container was build with the following Dockerfile:

```console
$ cat ~/lab-containers-part-2/python-container/Dockerfile
FROM ubuntu:22.04

# Required to prevent warnings
ARG DEBIAN_FRONTEND=noninteractive
ARG DEBCONF_NONINTERACTIVE_SEEN=true

RUN apt update && apt -y install python3 curl iproute2

RUN rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN mkdir /var/www

COPY ./index.html /var/www

WORKDIR /var/www
CMD ["/usr/bin/python3", "-m", "http.server",  "8888"]
```

Try to connect to the container using `curl`:

```console
$ curl localhost:8888
curl: (7) Failed to connect to localhost port 8888 after 0 ms: Connection refused
```

We notice that the `webserver-1` container is configured to listen on port 8888, but we cannot connect to it.
On an unmodified docker daemon, containers are started attached to the `bridge` network` as seen in the following output:

```console
$ docker inspect webserver-1
<snipped out>
            "Networks": {
                "bridge": {
                    "IPAMConfig": null,
                    "Links": null,
                    "Aliases": null,
                    "MacAddress": "c6:3e:d8:a0:3e:9a",
                    "DriverOpts": null,
                    "GwPriority": 0,
                    "NetworkID": "188b195a78b1369bdfe401ab66d1b753d55d5d971e0629a46f01b29b1d3c56c2",
                    "EndpointID": "ac90c0cd5b9cd50354434644f7562edbc6f0aaba5dc9dbc21be7c0251663e1f2",
                    "Gateway": "172.17.0.1",
                    "IPAddress": "172.17.0.2",
                    "IPPrefixLen": 16,
                    "IPv6Gateway": "",
                    "GlobalIPv6Address": "",
                    "GlobalIPv6PrefixLen": 0,
                    "DNSNames": null
                }
            }
<snipped out>
```

The container outbound connectivity (including to the Internet) as seen below.
You will have run `apt update` and `apt install iputils-ping` inside the container first, to install `ping`.

```console
$ docker exec webserver-1 ping -c2 8.8.8.8
PING 8.8.8.8 (8.8.8.8) 56(84) bytes of data.
64 bytes from 8.8.8.8: icmp_seq=1 ttl=115 time=27.0 ms
64 bytes from 8.8.8.8: icmp_seq=2 ttl=115 time=25.6 ms

--- 8.8.8.8 ping statistics ---
2 packets transmitted, 2 received, 0% packet loss, time 1001ms
rtt min/avg/max/mdev = 25.598/26.291/26.985/0.693 ms
```

But we can also see that the container does not run on the same network as the host system:

```console
student@cc:~/lab-containers-part-2/python-container$ ip addr show
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
    inet6 ::1/128 scope host
       valid_lft forever preferred_lft forever
2: wlp1s0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP group default qlen 1000
    link/ether 00:d4:9e:81:ed:40 brd ff:ff:ff:ff:ff:ff
    inet 10.41.176.16/16 brd 10.41.255.255 scope global dynamic noprefixroute wlp1s0
       valid_lft 684574sec preferred_lft 684574sec
    inet6 fe80::817e:8f5d:8ec:3ee7/64 scope link noprefixroute
       valid_lft forever preferred_lft forever
```

Here, you will have to install the `iproute2` package inside the container before running the command:

```console
student@cc:~/lab-containers-part-2/python-container$ docker exec webserver-1 ip a s
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
    inet6 ::1/128 scope host
       valid_lft forever preferred_lft forever
2: eth0@if160: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP group default
    link/ether c6:3e:d8:a0:3e:9a brd ff:ff:ff:ff:ff:ff link-netnsid 0
    inet 172.17.0.2/16 brd 172.17.255.255 scope global eth0
       valid_lft forever preferred_lft forever
```

The issue is that a separate virtual network is created for containers.
This network is connected to the host system via a virtual bridge created by the docker daemon.
The name of the default docker bridge is called `docker0` and we can see it below:

```console
student@cc:~/lab-containers-part-2/python-container$ ip addr show docker0
6: docker0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP group default
    link/ether fe:01:47:f0:80:ee brd ff:ff:ff:ff:ff:ff
    inet 172.17.0.1/16 brd 172.17.255.255 scope global docker0
       valid_lft forever preferred_lft forever
    inet6 fe80::fc01:47ff:fef0:80ee/64 scope link
       valid_lft forever preferred_lft forever
```

An explicit config has to be made to forward a port from the host system to the container.

For that, the `-p` option is used.

```console
student@cc:~/lab-containers-part-2/python-container$ docker run --name webserver -d -p 8000:8888 -t python-container:latest
9df13f47a64f98b4d816cc43f7989f812e3a7575538f6b7a2c07740540a843a3
student@cc:~/lab-containers-part-2/python-container$ curl localhost:8000
Simple Python server
```

In the above example we have opened port 8000 on the host machine and forwarded it to port 8888 on the container.

:::note
Ports bellow 1024 require root access to be forwarded.
:::

#### Exercise: Container port forwarding

Create a new `webserver-8844` container based on the `python-container` image and forward port 8844 on the local machine to port 8888 on the container.

### Creating new networks

The `docker network create` command creates a new network as follows:

```console
student@cc:~/lab-containers-part-2/python-container$ docker network create isolated-servers
c8c6de8430e81a2e86d2c7e7705d826c0ce5e19cb06facbb7d6e730166103f5d
student@cc:~/lab-containers-part-2/python-container$ docker network list
NETWORK ID     NAME                    DRIVER    SCOPE
188b195a78b1   bridge                  bridge    local
419795d5abb0   cloud-courses_default   bridge    local
7bb2bee32f12   docker_default          bridge    local
e541c06d4f1c   host                    host      local
c8c6de8430e8   isolated-servers        bridge    local
7649b3737768   none                    null      local
```

We have used the `docker network list` command to list all the docker networks on the system.

:::note
The `host` and `none` networks are described in a future section
:::

To start a container inside of a network you have to add the `--network` option to the `docker run command`.

```console
docker run --network isolated-servers --name webserver-2 -d -p 8000:8888 -t python-container:latest
```

```console
student@cc:~/lab-containers-part-2/python-container$ docker exec webserver-2 ip addr show
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
    inet6 ::1/128 scope host
       valid_lft forever preferred_lft forever
2: eth0@if166: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP group default
    link/ether fa:83:22:2c:df:08 brd ff:ff:ff:ff:ff:ff link-netnsid 0
    inet 172.19.0.2/16 brd 172.19.255.255 scope global eth0
       valid_lft forever preferred_lft forever
```

We notice that while we were running in the 172.17.0.0/16 network before, the `webserver-2` container is in the `172.19.0.0/16` network.

#### Exercise: Starting containers in networks

Start a new container in the `isolated-server` network named `client` based on the `python-container:latest` image.
Check the connection between the `client` and `webserver-2` containers using the `curl` command.
What port should you query on to get the web server message? Why?


### Running a real world container on a separate network

We will use as an example, a set of containers consisting of a MySQL database and a WordPress service.

To start the two containers we will use the following commands:

```
student@lab-docker:~$ docker network create test-net
69643d63f7a785c07d4b93cf77a8b921e97595da778344e9aa8f62ac9cb6909a
student@lab-docker:~$ docker run -d --hostname db --network test-net -e "MYSQL_ROOT_PASSWORD=somewordpress" -e "MYSQL_DATABASE=wordpress" -e "MYSQL_USER=wordpress" -e "MYSQL_PASSWORD=wordpress" mysql:5.7
657e3c4a23e120adf0eb64502deead82e156e070f7e9b47eff522d430279d3e1
student@lab-docker:~$ docker run -d --hostname wordpress --network test-net -p "8000:80" -e "WORDPRESS_DB_HOST=db" -e "WORDPRESS_DB_USER=wordpress" -e "WORDPRESS_DB_PASSWORD=wordpress" gitlab.cs.pub.ro:5050/scgc/cloud-courses/wordpress:latest
Unable to find image 'wordpress:latest' locally
latest: Pulling from library/wordpress
c229119241af: Pull complete
47e86af584f1: Pull complete
e1bd55b3ae5f: Pull complete
1f3a70af964a: Pull complete
0f5086159710: Pull complete
7d9c764dc190: Pull complete
ec2bb7a6eead: Pull complete
9d9132470f34: Pull complete
fb23ab197126: Pull complete
cbdd566be443: Pull complete
be224cc1ae0f: Pull complete
629912c3cae4: Pull complete
f1bae9b2bf5b: Pull complete
19542807523e: Pull complete
59191c568fb8: Pull complete
30be9b012597: Pull complete
bb41528d36dd: Pull complete
bfd3efbb7409: Pull complete
7f19a53dfc12: Pull complete
23dc552fade0: Pull complete
5133d8c158a7: Pull complete
Digest: sha256:df2edd42c943f0925d4634718d1ed1171ea63e043a39201c0b6cbff9d470d571
Status: Downloaded newer image for wordpress:latest
b019fd009ad4bf69a9bb9db3964a4d446e9681b64729ffb850af3421c1df070c
```

The useful options above are:

* `-e` sets an environment variable. This variable will be received by the container;
* `-p` exposes an internal port of the container (`80`) to a port on the host machine (`8000`);
* `--hostname` makes it so the container uses a specific hostname;
* `--network` connects the container to a network other than the default.

We noticed in the output that we created the `test-net` network. We did this because in the default docker configuration, containers cannot communicate between themselves.

We can connect using the Firefox browser to the virtual machine on port `8000` to configure the WordPress server.

### Exercise: Running commands in the container

Start a container that hosts the NextCloud file sharing service. To connect to the NextCloud service, you need to expose the HTTP server running in the virtual machine. To do this, follow the example above. The container image name is `nextcloud`.

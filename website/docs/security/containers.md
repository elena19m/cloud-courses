---
sidebar_position: 5
---

# Container-based virtualization

## Setup

We will be using a virtual machine in the [faculty's cloud](http://cloud.grid.pub.ro/).

When creating a virtual machine in the Launch Instance window:
  * Select **Boot from image** in **Instance Boot Source** section
  * Select **SCGC Template 2021** in **Image Name** section
  * Select the **m1.large** flavor.

In the base virtual machine:
  * Download the laboratory archive from [here](https://repository.grid.pub.ro/cs/scgc/laboratoare/lab-docker.zip) in the `work` directory.
Use: `wget --user=user-curs --ask-password https://repository.grid.pub.ro/cs/scgc/laboratoare/lab-docker.zip` to download the archive.
Replace `user-curs` with your LDAP username. The password is your LDAP password.
  * Extract the archive.
  * Download the `runvm.sh` script.
The `.qcow2` files will be used to start virtual machines using the `runvm.sh` script.
  * Start the virtual machines using `bash runvm.sh`.
  * The username for connecting to the nested VMs is `student` and the password is `student`.

```bash
$ # change the working dir
$ cd ~/work
$ # download the archive; replace user-curs with your LDAP username
$ wget --user=user-curs --ask-password https://repository.grid.pub.ro/cs/scgc/laboratoare/lab-docker.zip
$ unzip lab-docker.zip
$ wget swarm.cs.pub.ro/~sweisz/runvm.sh
$ # start VMs; it may take a while
$ bash runvm.sh
$ # check if the VMs booted
$ virsh net-dhcp-leases labvms
```

## Needs / use-cases

* easy service install
* isolated test environments
* local replicas of production environments

## Objectives

* container management (start, stop, build)
* service management
* container configuration and generation

## What are containers?

Containers are an environment in which we can run applications isolated from the host system.

In Linux-based operating systems, containers are run like an application
which has access to the resources of the host station, but which may interact with processes from
outside the isolated environment.

The advantage of using a container for running applications is that it can be easily turned on and off
and modified. Thus, we can install applications in a container, configure them
and run them without affecting the other system components

A real usecase where we run containers is when we want to set up a server that depends on
fixed, old versions of certain libraries. We don't want to run that server on our system
physically, as conflicts with other applications may occur. Containerizing the server, we can have a
version of the library installed on the physical machine and another version installed on the
container without conflict between them.

## Containers versus virtual machines?

Both containers and virtual machines allow us to run applications in an isolated environment.
However, there are fundamental differences between the two mechanisms.
A container runs directly on top of the operating system.
Meanwhile, a virtual machine runs its own kernel and then runs the applications on top of that.
This added abstraction layer adds overhead to running the desired applications, and the overhead slows down  the applications.

Another plus for running containers is the ability to build and pack them iteratively.
We can easily download a container from a public repository, modify it, and
upload it to a public repository without uploading the entire image. We can do that because
changes to a container are made iteratively, saving the differences between the image
original and modified version.

There are also cases where we want to run applications inside a virtual machine. E.g,
if we want to run a compiled application for an operating system other than Linux, we
could not do this because containers can run applications that are compiled for the system
host operation. Virtual machines can also run operating systems other than the operating system
host.

## LXC / LXD

**TODO** (see old [labs](https://ocw.cs.pub.ro/courses/scgc/laboratoare/04))

## Starting a container

To start an application inside a Docker container use the following command:

```
student@lab-docker:~$ sudo docker run -it ubuntu:18.04 bash
Unable to find image 'ubuntu:18.04' locally
18.04: Pulling from library/ubuntu
11323ed2c653: Already exists 
Digest: sha256:d8ac28b7bec51664c6b71a9dd1d8f788127ff310b8af30820560973bcfc605a0
Status: Downloaded newer image for ubuntu:18.04
root@3ec334aece37:/# cat /etc/lsb-release 
DISTRIB_ID=Ubuntu
DISTRIB_RELEASE=18.04
DISTRIB_CODENAME=bionic
DISTRIB_DESCRIPTION="Ubuntu 18.04.6 LTS"
root@3ec334aece37:/# 
```

The `docker` command was run using the following parameters:
* `run`, start a container;
* `-i`, starts an" interactive "container, which accepts keyboard input;
* `-t`, associates a terminal to the run command;
* `ubuntu: 18.04` is the name of the image we want to use.
  [Dockerhub] (https://hub.docker.com/) is a public image repository from which we can download
  already built images;
* `bash`, the command we want to run in the container.

We can also run a non-interactive command in a container as follows:

```
student@lab-docker:~$ sudo docker run ubuntu:18.04 ps -ef
UID          PID    PPID  C STIME TTY          TIME CMD
root           1       0  0 12:01 ?        00:00:00 ps -ef
```

:::note
The `ps -ef` command would show all active processes in the system. We notice that only one command appears in the output above, because we are running in an isolated environment. We will return to this in the TODO subsection
:::

However, we do not want to always run containers in the foreground. If we want to run a script that cannot be run in the host environment, and this script will run for a long time, we prefer to run the command in the background.

To start a container in the background, use the `-d` option for the` docker run` command as follows:
```
student@lab-docker:~$ sudo docker run -d ubuntu:18.04 sleep 10000
a63ee06826a33c0dfab825a0cb2032eee2459e0721517777ee019f59e69ebc02
student@lab-docker:~$ sudo docker ps
CONTAINER ID   IMAGE          COMMAND         CREATED         STATUS         PORTS     NAMES
a63ee06826a3   ubuntu:18.04   "sleep 10000"   7 seconds ago   Up 5 seconds             wonderful_lewin
student@lab-docker:~$ sudo docker exec -it a63ee06826a3 /bin/bash
root@a63ee06826a3:/# ps -ef
UID          PID    PPID  C STIME TTY          TIME CMD
root           1       0  0 02:19 ?        00:00:00 sleep 10000
root           7       0  2 02:19 pts/0    00:00:00 /bin/bash
root          19       7  0 02:20 pts/0    00:00:00 ps -ef
root@a63ee06826a3:/# exit
```

We can see that the container started by us is still running by running the `docker ps` command.
Relevant columnts
* `CONTAINER ID`
* `NAMES`

To connect to a container running in the background, use the `docker exec` command along with the container ID or name selected using the `docker ps` command:

```
student@lab-docker:~$ sudo docker exec -it a63ee06826a3 /bin/bash
root@a63ee06826a3:/# ps -ef
UID          PID    PPID  C STIME TTY          TIME CMD
root           1       0  0 02:19 ?        00:00:00 sleep 10000
root           7       0  2 02:19 pts/0    00:00:00 /bin/bash
root          19       7  0 02:20 pts/0    00:00:00 ps -ef
root@a63ee06826a3:/# exit
```

To stop a container running in the background, use the `docker stop` command along with the container ID or name as follows:
```
student@lab-docker:~$ sudo docker stop a63ee06826a3
a63ee06826a3
student@lab-docker:~$ sudo docker ps
CONTAINER ID   IMAGE     COMMAND   CREATED   STATUS    PORTS     NAMES
student@lab-docker:~$ 
```


## Exercise: Starting a container

* Start a container in the background based on the `centos: 7` image.
* Connect to the container just turned on and run the `yum install bind-utils` command.
* Disconnect from container.

## Context: Container separation

Most of the time when we use containers we do not use them interractively. They have a well-defined purpose, to run a service, an application, or to do a set of fixed operations.

A constructive approach to using containers is `do one thing and do it well`. For this reason, we recommend that each container be built with a single purpose in mind.

For example, for a web application we might have the following approach:

* a container running an http server;
* a container running a database.

This architecture allows us to change a container, such as changing the type of database used without changing the entire container.

## Building a container

Most times just running a container interractively and connectig to it when the need arrises is not enough.
We want a way to automatically build and distribute single-use containers.
For example, we want to use purpose build containers when running a CI/CD system that build a website and publishes it to the web.
Each website has its own setup requirements, and we'd like to automate this.
We could add automation by running a script, but in this case we'd lose one of the psotives of running containers, the iterrative nature of images, because the docker images would be monilithic.

In order to create a container we need to define a `Dockerfile` file as follows:

```
FROM ubuntu:18.04

ARG DEBIAN_FRONTEND=noninteractive
ARG DEBCONF_NONINTERACTIVE_SEEN=true

RUN apt-get update
RUN apt-get install -y software-properties-common

RUN apt-get install -y firefox
```

Each line contains commands that will be interpreted by Docker when building the image:

* `FROM`, specifies the base container image
* `RUN`, runs in container

This container will then be used to compile a container which can run firefox.

It should be noted that in the process of building containers we have to use non-interactive commands, because we do not have access to the terminal where the terminal is built, so we can not write the keyboard options.

To build the container we will use the following command:
```
student@lab-docker:~$ docker build -t firefox-container  .
```

When we run the command we base that the `Dockerfile` file is in the current directory (`~`). The `-t` option will generate a container image named `firefox-container`.

To list container images on the machine use the following command:
```
student@lab-docker:~$ docker image list
```

This list contains both internally downloaded and locally built containers.

## Exercise: Generate a container image

* Write a `Dockerfile.centos` file containing a recipe for generating a container image based on the` centos:7` container in which to install the `bind-utils` tool.

:::note
To generate a container using a file other than the default `Dockerfile` we use the` -f` option.
:::

* Start the container generated in the previous exercise and run the command `nslookup hub.docker.com` to verify the installation of the package.

## Downloading containers

Another important principle, both in the use of containers and in programming in general, is reusability. Instead of developing a new solution for every problem we encounter, we can use a solution that has already been implemented and submitted to a public repository.

For example, if we want to use a MySQL database to store information, instead of using a basic Ubuntu container and installing and configuring the server ourselves, we can download a container that already has the package installed.

## Running orders in an unloaded container

We will use as an example, a set of containers consisting of a MySQL database and a WordPress service.

To start the two containers we will use the following commands:

```
student@lab-docker:~$ sudo docker network remove test-net
test-net
student@lab-docker:~$ sudo docker network create test-net
69643d63f7a785c07d4b93cf77a8b921e97595da778344e9aa8f62ac9cb6909a
student@lab-docker:~$ sudo docker run -d --hostname db --network test-net -e "MYSQL_ROOT_PASSWORD=somewordpress" -e "MYSQL_DATABASE=wordpress" -e "MYSQL_USER=wordpress" -e "MYSQL_PASSWORD=wordpress" mysql:5.7
657e3c4a23e120adf0eb64502deead82e156e070f7e9b47eff522d430279d3e1
student@lab-docker:~$ sudo docker run -d --hostname wordpress --network test-net -p "8000:80" -e "WORDPRESS_DB_HOST=db" -e "WORDPRESS_DB_USER=wordpress" -e "WORDPRESS_DB_PASSWORD=wordpress" wordpress:latest
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
* `-p` exposes an internal port of the container (` 80`) to a port on the host machine (`8000`);
* `--hostname` makes it so the container uses a specific hostname;
* `--network` connects the container to a network other than the default.

We noticed in the output that we created the `test-net` network. We did this because in the default docker configuration, containers cannot communicate between themselves

We can connect using the Firefox browser to the virtual machine on port `8000` to configure the WordPress server.

### Exercise: Running orders in the container

Start a container that hosts the Nextcloud file sharing service. To connect to the nextcloud service, you need to expose the HTTP server running in the virtual machine. To do this, follow the example above. The container image name is `nextcloud`.

## Automate container startup using Docker Compose

As we can see from the TODO example, we can start containers using the `docker run` command, but that means running a command for each container.
This is simple when we only need to start two containers, but if we want to start more than two containers, or if we want to offer users a "one click" solution and we have a suite of containers needed for our solution, running in an ordered fasion for each container does not scale.

The solution to this issue is the Docker Compose mechanism.
It allows an administrator to write a specification for a work environment, including options for running containers, volumes running containers, and networks where containers will communicate.

The command is called `docker-compose`, and it uses `docker-compose.yaml` files which look like this:

```
version: "3.3"

services:
  db:
    image: mysql:5.7
    networks:
      - wordpress-net
    environment:
      MYSQL_ROOT_PASSWORD: somewordpress
      MYSQL_DATABASE: wordpress
      MYSQL_USER: wordpress
      MYSQL_PASSWORD: wordpress

  wordpress:
    depends_on:
      - db
    image: wordpress:latest
    networks:
      - wordpress-net
    ports:
      - "8000:80"
    environment:
      WORDPRESS_DB_HOST: db
      WORDPRESS_DB_USER: wordpress
      WORDPRESS_DB_PASSWORD: wordpress
      WORDPRESS_DB_NAME: wordpress

networks:
    wordpress-net:
```

In order to start the containers we use the `docker-compose up` command:
```
student@lab-docker:~$ sudo docker-compose up
WARNING: Some networks were defined but are not used by any service: wordpress-net
Creating network "student_default" with the default driver
Creating student_db_1 ... done
Creating student_wordpress_1 ... done
Attaching to student_db_1, student_wordpress_1
db_1         | 2022-04-05 03:48:41+00:00 [Note] [Entrypoint]: Entrypoint script for MySQL Server 5.7.37-1debian10 started.
db_1         | 2022-04-05 03:48:41+00:00 [Note] [Entrypoint]: Switching to dedicated user 'mysql'
db_1         | 2022-04-05 03:48:42+00:00 [Note] [Entrypoint]: Entrypoint script for MySQL Server 5.7.37-1debian10 started.
db_1         | 2022-04-05 03:48:42+00:00 [Note] [Entrypoint]: Initializing database files
db_1         | 2022-04-05T03:48:42.223165Z 0 [Warning] TIMESTAMP with implicit DEFAULT value is deprecated. Please use --explicit_defaults_for_timestamp server option (see documentation for more details).
db_1         | 2022-04-05T03:48:42.819383Z 0 [Warning] InnoDB: New log files created, LSN=45790
db_1         | 2022-04-05T03:48:42.931685Z 0 [Warning] InnoDB: Creating foreign key constraint system tables.
db_1         | 2022-04-05T03:48:43.011806Z 0 [Warning] No existing UUID has been found, so we assume that this is the first time that this server has been started. Generating a new UUID: 49a0ec32-b493-11ec-b38d-0242ac150002.
db_1         | 2022-04-05T03:48:43.019048Z 0 [Warning] Gtid table is not ready to be used. Table 'mysql.gtid_executed' cannot be opened.
wordpress_1  | WordPress not found in /var/www/html - copying now...
wordpress_1  | Complete! WordPress has been successfully copied to /var/www/html
wordpress_1  | No 'wp-config.php' found in /var/www/html, but 'WORDPRESS_...' variables supplied; copying 'wp-config-docker.php' (WORDPRESS_DB_HOST WORDPRESS_DB_NAME WORDPRESS_DB_PASSWORD WORDPRESS_DB_USER)
wordpress_1  | AH00558: apache2: Could not reliably determine the server's fully qualified domain name, using 172.21.0.3. Set the 'ServerName' directive globally to suppress this message
wordpress_1  | AH00558: apache2: Could not reliably determine the server's fully qualified domain name, using 172.21.0.3. Set the 'ServerName' directive globally to suppress this message
wordpress_1  | [Tue Apr 05 03:48:43.798334 2022] [mpm_prefork:notice] [pid 1] AH00163: Apache/2.4.53 (Debian) PHP/7.4.28 configured -- resuming normal operations
wordpress_1  | [Tue Apr 05 03:48:43.798714 2022] [core:notice] [pid 1] AH00094: Command line: 'apache2 -D FOREGROUND'
db_1         | 2022-04-05T03:48:44.339284Z 0 [Warning] A deprecated TLS version TLSv1 is enabled. Please use TLSv1.2 or higher.
db_1         | 2022-04-05T03:48:44.339352Z 0 [Warning] A deprecated TLS version TLSv1.1 is enabled. Please use TLSv1.2 or higher.
db_1         | 2022-04-05T03:48:44.339950Z 0 [Warning] CA certificate ca.pem is self signed.
db_1         | 2022-04-05T03:48:44.547479Z 1 [Warning] root@localhost is created with an empty password ! Please consider switching off the --initialize-insecure option.
```

Notice that both containers run in the foreground. In order to start the containers in the backgroud, we have to user the `-d` option.

To stop the containers specified in the `docker-compose.yaml` file we use the` docker-compose down` command as follows:

```
student@lab-docker:~$ sudo docker-compose down
WARNING: Some networks were defined but are not used by any service: wordpress-net
Removing student_wordpress_1 ... done
Removing student_db_1        ... done
Removing network student_default
```

### Exercise: Automation using Docker Compose

Write a `docker-compose.yaml` file that will automatically start the `nextcloud` container when running the `docker-compose up` command.

## Using persistent storage in containers

When we work with applications that we install on a cluster, they store data ephemerally. Thus, when deleting the container, all the information in the container is deleted.
We don't want this to happen in the example of a database, where we rely on information being stored for a long time.

To start a container to which we attach a storage volume, we start the container as follows:

```
student@lab-docker:~$ sudo docker run -d -v mysql-volume:/var/lib/mysql -e "MYSQL_ROOT_PASSWORD=somewordpress" -e "MYSQL_DATABASE=wordpress" -e "MYSQL_USER=wordpress" -e "MYSQL_PASSWORD=wordpress" mysql:5.7
07ae337cead33307e6146f4e7142345e59d59dd29334b6e37f47268b58d093ac
student@lab-docker:~$ sudo docker exec -it 07ae337cead33307e6146f4e7142345e59d59dd29334b6e37f47268b58d093ac /bin/bash
root@07ae337cead3:/# echo "Hello" > /var/lib/mysql/test-file
root@07ae337cead3:/# exit
student@lab-docker:~$ sudo docker stop 07ae337cead33307e6146f4e7142345e59d59dd29334b6e37f47268b58d093ac
07ae337cead33307e6146f4e7142345e59d59dd29334b6e37f47268b58d093ac
student@lab-docker:~$ sudo docker rm 07ae337cead33307e6146f4e7142345e59d59dd29334b6e37f47268b58d093ac
07ae337cead33307e6146f4e7142345e59d59dd29334b6e37f47268b58d093ac
student@lab-docker:~$ sudo docker run -d -v mysql-volume:/var/lib/mysql -e "MYSQL_ROOT_PASSWORD=somewordpress" -e "MYSQL_DATABASE=wordpress" -e "MYSQL_USER=wordpress" -e "MYSQL_PASSWORD=wordpress" mysql:5.7
ad1b42b46654a8d4c721e69e824aa7ee18f1e39a85e0b27f1ac966c355a2786a
student@lab-docker:~$ sudo docker exec -it ad1b42b46654a8d4c721e69e824aa7ee18f1e39a85e0b27f1ac966c355a2786a /bin/bash
root@ad1b42b46654:/# cat /var/lib/mysql/test-file 
Hello
```

:::note
While `docker stop` stops the container from running, the container's data is pruned after running the `docker rm` command.
:::

The `-v` option attaches the` mysql-volume` to the `mysql` container to the /var/lib/mysql path.
We notice that after we connected the volume, we wrote "Hello" in a file and it could be read after we restarted the container.
Volumes are defaulted to `/var/lib/docker/volumes/`.

If we want to mount a directory or file on the host system as persistent storage, we can do so using the path to the directory we want to use, instead of the volume name we want to use. .
The following example illustrates this option:

```
student@lab-docker:~$ sudo docker run -d -v ~/mysql-vol/:/shared-dir -e "MYSQL_ROOT_PASSWORD=somewordpress" -e "MYSQL_DATABASE=wordpress" -e "MYSQL_USER=wordpress" -e "MYSQL_PASSWORD=wordpress" mysql:5.7
628de4f3c693b25396de4bbaa951636535ecb1c167b1cca785028479676b7cec
student@lab-docker:~$ sudo docker exec -it 628de4f3c693b25396de4bbaa951636535ecb1c167b1cca785028479676b7cec /bin/bash
root@628de4f3c693:/# cat /shared-dir/test-file
Hello
```

In the case of containers that are run by `docker-composite`, a volume-type entry will look like this:
```
version: "3.3"

services:
  db:
    image: mysql:5.7
    networks:
      - wordpress-net
    volumes:
      - mysql-vol
    environment:
      MYSQL_ROOT_PASSWORD: somewordpress
      MYSQL_DATABASE: wordpress
      MYSQL_USER: wordpress
      MYSQL_PASSWORD: wordpress

  wordpress:
    depends_on:
      - db
    image: wordpress:latest
    networks:
      - wordpress-net
    ports:
      - "8000:80"
    environment:
      WORDPRESS_DB_HOST: db
      WORDPRESS_DB_USER: wordpress
      WORDPRESS_DB_PASSWORD: wordpress
      WORDPRESS_DB_NAME: wordpress

volumes:
    mysql-vol:

networks:
    wordpress-net:

```

:::note
Note that when we run the `docker-compose down` command, the volume defined in` docker-compose.yaml` is deleted.
In order not to delete the volumes from the recipe, we need to run the `docker-compose stop` command to stop the containers defined in the YAML file.
:::

### Exercise: Mount a persistent volume in the container

Start a container from the `nextcloud` image to which you attach a volume called` nextcloud-vol` to `/var/www/html`.
Restart the container and check that the configurations made when starting the container have been saved.

## Container security

An advantage of using containers, in addition to the ease of building and starting containers, comes from the fact that a container runs in an isolated environment from the rest of the system.
From this we can limit the running of applications in the container. We can do this by limiting process access to other processes in the system, as we saw in the TODO example, or we can do this by limiting the number of cyclesCPUs that can be accessed by the container, or by limiting the ram memory that can be allocated by applications in the container.

However, a disadvantage that containers have over virtual machines comes from the fact that a container runs on the same system as the host system and when it makes system calls it runs code from within the host kernel.
If a vulnerability is discovered that allows an application to exit the container, it can affect the entire system, especially if it is a vulnerability at the kernel level.
But in the case of a viral machine, a machine runs in an environment completely isolated from the physical system, so it has no way to receive additional access to system resources.

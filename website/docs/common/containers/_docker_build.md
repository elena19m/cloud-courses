## Building a container

Most times just running a container interactively and connecting to it when the need arises is not enough.
We want a way to automatically build and distribute single-use containers.
For example, we want to use purpose build containers when running a CI/CD system that build a website and publishes it to the web.
Each website has its own setup requirements, and we'd like to automate this.
We could add automation by running a script, but in this case we'd lose one of the positives of running containers, the iterative nature of images, because the docker images would be monolithic.

In order to create a container we need to define a `Dockerfile` file as follows:

```
FROM gitlab.cs.pub.ro:5050/scgc/cloud-courses/ubuntu:18.04

ARG DEBIAN_FRONTEND=noninteractive
ARG DEBCONF_NONINTERACTIVE_SEEN=true

RUN apt-get update
RUN apt-get install -y software-properties-common

RUN apt-get install -y firefox
```

Each line contains commands that will be interpreted by Docker when building the image:

* `FROM`, specifies the base container image
* `RUN`, runs in container

This container will then be used to compile a container which can run Firefox.

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

### Exercise: Generate a container image

* Write a `Dockerfile.centos` file containing a recipe for generating a container image based on the `gitlab.cs.pub.ro:5050/scgc/cloud-courses/centos:7` container in which to install the `bind-utils` tool.

:::note
To generate a container using a file other than the default `Dockerfile` we use the` -f` option.
:::

* Start the container generated in the previous exercise and run the command `nslookup hub.docker.com` to verify the installation of the package.

### Downloading containers

Another important principle, both in the use of containers and in programming in general, is reusability. Instead of developing a new solution for every problem we encounter, we can use a solution that has already been implemented and submitted to a public repository.

For example, if we want to use a MySQL database to store information, instead of using a basic Ubuntu container and installing and configuring the server ourselves, we can download a container that already has the package installed.

### Running commands in an unloaded container

We will use as an example, a set of containers consisting of a MySQL database and a WordPress service.

To start the two containers we will use the following commands:

```
student@lab-docker:~$ sudo docker network remove test-net
test-net
student@lab-docker:~$ sudo docker network create test-net
69643d63f7a785c07d4b93cf77a8b921e97595da778344e9aa8f62ac9cb6909a
student@lab-docker:~$ sudo docker run -d --hostname db --network test-net -e "MYSQL_ROOT_PASSWORD=somewordpress" -e "MYSQL_DATABASE=wordpress" -e "MYSQL_USER=wordpress" -e "MYSQL_PASSWORD=wordpress" mysql:5.7
657e3c4a23e120adf0eb64502deead82e156e070f7e9b47eff522d430279d3e1
student@lab-docker:~$ sudo docker run -d --hostname wordpress --network test-net -p "8000:80" -e "WORDPRESS_DB_HOST=db" -e "WORDPRESS_DB_USER=wordpress" -e "WORDPRESS_DB_PASSWORD=wordpress" gitlab.cs.pub.ro:5050/scgc/cloud-courses/wordpress:latest
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

### Exercise: Running commands in the container

Start a container that hosts the NextCloud file sharing service. To connect to the NextCloud service, you need to expose the HTTP server running in the virtual machine. To do this, follow the example above. The container image name is `nextcloud`.

### Build More Images from Dockerfiles

Let's build the following Docker images:

1. Build the CTF Docker image:

   ```console
   docker build -f dockerfile/ctf.Dockerfile -t my-ctf ctf/
   ```

   The options in the above command are:

   - `-f dockerfile/ctf.Dockerfile`: the path to the `Dockerfile` used to build the image
   - `-t my-ctf`: the image name (also called a tag)
   - `ctf/`: the directory that will be used as the base for `COPY` commands

   Running the command above results in the creation of the `my-ctf` image.

1. Build the `linux-kernel-labs` Docker image:

   ```console
   docker build -f dockerfile/linux-kernel-labs.Dockerfile -t linux-kernel-labs .
   ```

   Running the command above results in an error:

   ```text
   => ERROR [32/36] RUN groupadd -g $ARG_GID ubuntu
   ------
    > [32/36] RUN groupadd -g $ARG_GID ubuntu:
   0.207 groupadd: invalid group ID 'ubuntu'
   ------
   linux-kernel-labs.Dockerfile:42
   --------------------
     40 |     ARG ARG_GID
     41 |
     42 | >>> RUN groupadd -g $ARG_GID ubuntu
   ```

   This is caused by missing build arguments `ARG_UID` and `ARG_GID`.
   We provide these arguments via the `--build-arg` option:

   ```console
   docker build -f dockerfile/linux-kernel-labs.Dockerfile --build-arg ARG_GID=$(id -g) --build-arg ARG_UID=$(id -u) -t linux-kernel-labs .
   ```

   Running the command above results in the creation of the `linux-kernel-labs` image.

1. Build the `uso-lab` Docker image:

   ```console
   docker build -f dockerfile/uso-lab.Dockerfile -t uso-lab .
   ```

   Running the command above results in an error:

   ```text
    => ERROR [15/16] COPY ./run.sh /usr/local/bin/run.sh
   ------
    > [15/16] COPY ./run.sh /usr/local/bin/run.sh:
   ------
   uso-lab.Dockerfile:20
   --------------------
     18 |     RUN rm -rf /var/lib/apt/lists/*
     19 |
     20 | >>> COPY ./run.sh /usr/local/bin/run.sh
     21 |     CMD ["run.sh"]
   ```

   This is because the [`run.sh` script](https://github.com/systems-cs-pub-ro/uso-lab/blob/master/labs/03-user/lab-container/fizic/run.sh) is not available in the local filesystem.
   You will fix that as a task below.

1. Build the `dropbox` Docker image:

   ```console
   docker build -f dockerfile/dropbox.Dockerfile -t dropbox .
   ```

   Running the command above results in a similar error as above:

   ```text
   => ERROR [9/9] COPY ./run.sh /usr/local/bin/run.sh
   ------
    > [9/9] COPY ./run.sh /usr/local/bin/run.sh:
   ------
   dropbox.Dockerfile:80
   --------------------
     78 |
     79 |     # Install init script and dropbox command line wrapper
     80 | >>> COPY ./run.sh /usr/local/bin/run.sh
     81 |     CMD ["run.sh"]
   ```

   This is because the [`run.sh` script](https://github.com/Sergiu121/uso-lab/blob/master/labs/09-task-admin/lab-container/dropbox/run.sh) is not available in the local filesystem.
   You will fix that as a task below.

### Exercise: Fix Build Issue

First, fix the issue with the creation of the `uso-lab` image.
That is:

1. Copy the [`run.sh` script](https://github.com/systems-cs-pub-ro/uso-lab/blob/master/labs/03-user/lab-container/fizic/run.sh) locally.

1. Run the `docker build` command again.
   Be sure to pass the correct path as the final argument to the `docker build` command.
   This is the path where the `run.sh` script is located locally.

Follow similar steps to fix the issue with the creation of the `dropbox` image.

### Exercise: Images from Other Dockerfiles

Search the Internet (GitHub or otherwise) for two Dockerfiles.
Build images from those two Dockerfiles.

### Exercise: Python Server

Go to the `python-server` directory and build the container using the following command:

```console
docker build -t python-server:1.0 .
```

The command builds the container with the specification from the `Dockerfile`.
Test the container functionality by running:

```console
curl localhost:8080
```

Change the base image to Debian and rebuild the container tagged with the `python-server-debian:1.0` tag.

Create a `Makefile` with has the following rules:

- `build`: creates a new image using the `Dockerfile`;
- `start`: starts a container based on the `python-server` image named `python-workspace` in the background;
- `stop`: stops the `python-workspace` container;
- `connect`: connects to the container in an interactive shell.

### Exercise: Assignment Checker

A common use case for using containers is platform-agnostic testing.
The `assignment-checker` directory contains a bash scripts which runs tests on an application by running it and comparing its output with a reference.

Create a Docker image which is able to run this script, compile de application and run the tests.

### Exercise: Build Program With GCC13

An advantage of using containers is the fact that they offer a flexible environment for testing and building applications.
Based on [this](https://gitlab.cs.pub.ro/operating-systems/assignments-docker-base/-/blob/main/Dockerfile?ref_type=heads) Dockerfile, create a Docker image which compiles an application based based on a `Makefile` located in the `/workdir` path.

The container must be able to compile applications using GCC13.

The application to be compiled is located in `assignment-checker/src`.
Use the included `Makefile` to compile it.


## Container Registries

Now that we have created a set of containers, we want to publish them so they are available to the world and to download on other systems.

To push the `python-container` image that we have built earlier, we will need to tag it so that it has an associated namespace as such:

```console
docker tag python-container:1.0 <dockerhub-username>/python-container:1.0
```

Where `dockerhub-username` is your DockerHub username.

To push the container you will use the `docker push command`:

```container
docker push <dockerhub-username>/python-container:1.0
```

Tag the `assignment-checker` container and push it to DockerHub.

### Using GitHub Container Registry

While using DockerHub offers great visibility for projects and container images, it limits the number of pulls for images on a specific IP.
To bypass this issue we will create a GitHub Container Registry (GHCR) account and login to it.

Follow the [GHCR tutorial](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry#authenticating-to-the-container-registry) to create a GHCR account.

Login to the account the same as you did with the DockerHub account and tag the `assignment-checker` image to be pushed to GHCR.

## Inspect Docker Instances

Let's start with inspecting the Docker installation and instances on the virtual machine.

Follow the steps below:

1. See available `docker` commands:

   ```console
   docker help
   ```

1. Check the `docker` version:

   ```console
   docker version
   ```




1. Find out the currently running Docker containers:

   ```console
   docker ps
   ```

   You will see the Docker containers that are currently running, namely an Nginx container:

   ```text
   CONTAINER ID   IMAGE          COMMAND                  CREATED       STATUS          PORTS                                     NAMES
   fbfe1d0b5870   nginx:latest   "/docker-entrypoint.…"   6 hours ago   Up 38 seconds   0.0.0.0:8080->80/tcp, [::]:8080->80/tcp   cdl-nginx
   ```

1. Find out all containers, including those that are stopped:

   ```console
   docker ps -a
   ```

   A new container, named `ctf-piece_of_pie` is now visible:

   ```text
   CONTAINER ID   IMAGE              COMMAND                  CREATED          STATUS                        PORTS                                     NAMES
   16a526c7c94c   ctf-piece_of_pie   "/usr/local/bin/run.…"   24 minutes ago   Exited (137) 51 seconds ago                                             ctf-piece_of_pie
   fbfe1d0b5870   nginx:latest       "/docker-entrypoint.…"   6 hours ago      Up 40 seconds                 0.0.0.0:8080->80/tcp, [::]:8080->80/tcp   cdl-nginx
   ```

1. Find out port-related information about the `cdl-nginx` container that is running:

   ```console
   docker port cdl-nginx
   ```

   You can see the port forwarding:

   ```text
   80/tcp -> 0.0.0.0:8080
   80/tcp -> [::]:8080
   ```

   You can check the current install by querying the server:

   ```console
   curl localhost:8080
   ```

   You will see the default HTML page of Nginx.

   No information is shown for containers that are not running:

   ```console
   docker port ctf-piece_of_pie
   ```

1. Get detailed information about the Docker instances, either started or stopped:

   ```console
   docker inspect cdl-nginx
   docker inspect ctf-piece_of_pie
   ```

1. Find out of the runtime logging information of the container:

   ```console
   docker logs cdl-nginx
   docker logs ctf-piece_of_pie
   ```

1. Find out runtime statistics and resource consumption of the running Nginx container:

   ```console
   docker stats cdl-nginx
   ```

   Close the screen by running `Ctrl+c`.

1. Find out the internal processes of the running Nginx container:

   ```console
   docker top cdl-nginx
   ```


### Exercise: Inspect Docker Instances

Repeat the steps above, at least 2-3 times.

Now, let's use the steps above on different containers.
Start two new containers named `cdl-caddy` and `cdl-debian-bash` by running the corresponding scripts:

```console
./vanilla-caddy/run-caddy-container.sh
./debian-bash/run-debian-bash-container.sh
```

Inspect the two newly started containers using the commands above.

## Interact with Docker Instances

Let's now do actual interaction with Docker container instances.
Such as starting and stopping containers, copying files to / from containers, getting a shell inside containers etc.

Follow the steps below.

### Start Instances

Start the `ctf-piece_of_pie` instance:

```console
docker start ctf-piece_of_pie
```

Now check it is started:

```console
docker ps
```

You can see it appears as a started container.

Check the ports and the processes:

```console
docker port ctf-piece_of_pie
docker top ctf-piece_of_pie
```

Connect locally to test the service:

```console
nc localhost 31337
```

### Stop Instances

Stop the `cdl-nginx` instance:

```console
docker stop cdl-nginx
```

You can see it does not appear as a started container.

Check to see the list of stopped containers:

```console
docker ps -a
```

### Remove Containers

A stopped container can be removed.
Once this is done, the container is gone forever.
It will have to be re-instantiated if needed, as we'll see in section ["Images and Containers"](#images-and-containers).

Remove the `cdl-nginx` container:

```console
docker rm cdl-nginx
```

The container is now gone.
You can use different commands to see if is gone:

```console
docker ps -a
docker inspect cdl-nginx
docker stats cdl-nginx
```

### Connect to a Container

You can connect to a container by using `docker exec`.
Typically, you want to start a shell.
Start a shell on the `ctf-piece_of_pie` container by using

```console
docker exec -it ctf-piece_of_pie /bin/bash
```

More than that, you can run different commands inside the container:

```console
docker exec -it ctf-piece_of_pie ls
docker exec -it ctf-piece_of_pie ls /proc
docker exec -it ctf-piece_of_pie cat /etc/shadow
docker exec -it ctf-piece_of_pie id
```

### Copy Files To / From a Container

You can copy files or entire directories to or from a container.
For example, to copy the `README.md` file to the `cdl-nginx` container in the `root` directory, use:

```console
docker cp README.md cdl-nginx:/root/
```

Likewise, if we want to copy the `index.html` file we use:

```console
docker cp cdl-nginx:/usr/share/nginx/html/index.html .
```

:::note
There is a period (`.`) at the end of the command above.
It is required, it points to the current directory.
:::

You can see that the container doesn't need to be running.

### Exercise: Interact with Docker instances

Make sure all four containers are started: `cdl-nginx`, `ctf-piece_of_pie`, `cdl-caddy`, `cdl-debian-bash`.
Start them if they are not stared.

Copy files to and from containers.

1. Copy `README.md` and `install-docker.sh` files from the current directory in the `/usr/local/` directory in all containers available (via `docker ps -a`).

1. Copy the `ctf/` local directory in the `/usr/local/` directory in all containers available (via `docker ps -a`).

1. Create a directory for each available container:

   ```console
   mkdir container-cdl-nginx
   mkdir container-ctf-piece_of_pie
   mkdir container-cdl-caddy
   mkdir container-cdl-debian-bash
   ```

   Copy the `/bin/bash` binary from each available container to their respective directory.

   Copy the `/etc/os-release` file from each available container to their respective directory.
   Check the contents to see what Linux distro was used to construct the filesystem.

## Docker Images

Images are stored locally either by being pulled from a container registry such as [DockerHub](https://hub.docker.com) (see section ["Getting Images"](#getting-images)) or from a `Dockefile` (see section ["Dockerfile"](#dockerfile)).

List the available Docker images by using:

```console
docker image ls
```

You will get an output such as:

```text
REPOSITORY         TAG        IMAGE ID       CREATED        SIZE
ctf-piece_of_pie   latest     1f844c4f935b   9 hours ago    209MB
<none>             <none>     99ba2c76892a   9 hours ago    216MB
<none>             <none>     e81d4254c928   13 hours ago   209MB
<none>             <none>     2d74afaf7b34   13 hours ago   209MB
debian             bookworm   617f2e89852e   2 weeks ago    117MB
nginx              latest     3b25b682ea82   4 weeks ago    192MB
gcc                14.2       d0b5d902201b   3 months ago   1.42GB
```

The `<none>` entries store intermediary versions of an image file.

You can also inspect an image, such as `debian:bookworm`.

```console
docker image inspect debian:bookworm
```

### Images and Containers

As stated above, containers are created from images.
Let's re-create the Nginx container, starting from the `nginx:latest` image:

```console
docker create --rm --name cdl-nginx nginx:latest
```

Check out it was created by running:

```console
docker ps -a
```

The container is currently stopped.
In order to start the container, run:

```console
docker start cdl-nginx
```

Check out it was started by running:

```console
docker ps
docker logs cdl-nginx
docker inspect cdl-nginx
docker stats cdl-nginx
```

The create and start command can be combined in a single command, `docker run`.

Create another Nginx container by using `docker run`:

```console
docker run --rm --name cdl1-nginx -p 8882:80 nginx:latest
```

You can see that, by default, the container is started in foreground.
Stop the container using `CTRL+C`, (like you would stop any other foreground process).

Now, run two more Nginx containers, in background, using the `-d` argument (or `--detach`):

```console
docker run -d --rm --name cdl2-nginx -p 8882:80 nginx:latest
docker run -d --rm --name cdl3-nginx -p 8883:80 nginx:latest
```

Check whether they are running:

```console
docker ps
docker stats cdl2-nginx
docker stats cdl3-nginx
curl localhost:8882
curl localhost:8883
```

The `--rm` option will remove an Nginx instance once it is stopped.

Stop the instances:

```console
docker stop cdl2-nginx
docker stop cdl3-nginx
```

Now the containers are gone forever (because of the `--rm` option):

```console
docker ps -a
```

### Exercise: Create more Nginx instances

Create more Nginx instances from available images:

1. Use `docker run` to create 5 more Nginx images from the `nginx:latest` image.
   Make sure you use different public ports.

   Use the `--rm` option of `docker run`.

1. Stop the containers you have just started.

1. Check they are gone forever.

### Getting Images

Images are stored locally either by being pulled from a container registry such as [DockerHub](https://hub.docker.com/_/httpd) (see section ["Getting Images"](#getting-images)) or from a `Dockefile` (see section ["Dockerfile](#dockerfile)).

To search for an image you like, use the commands below:

```console
docker search database
```

To pull images locally, use:

```console
docker pull <container-image-name-and-path-in-regitry>
```

such as:

```console
docker pull nginx:latest
docker pull gcc:14.2
```

### Exercise: Download Docker images

Download and instantiate other images.

1. Download images the applications: [MongoDB](https://hub.docker.com/_/mongo), [MariaDB](https://hub.docker.com/_/mariadb).
   Use the names `mongo:latest` and `mariadb:latest`.

1. Create 5 container instances for `MongoDB` and 5 container instances for `MariaDB`.
   Use the `--rm` option for `docker run`.

1. Check to see the container instances are running.

1. After a while, stop the newly instances.


## Inspect the docker service

Docker runs as a service (`docker.service`) under Linux (`dockerd` is the Docker daemon). You can inspect its status by using `systemctl status docker`.

    ```console
    student@work:~$ systemctl status docker
    docker.service - Docker Application Container Engine
     Loaded: loaded (/lib/systemd/system/docker.service; enabled; vendor preset: enabled)
     Active: active (running) since Tue 2025-02-18 18:38:17 EET; 6 days ago
    TriggeredBy: docker.socket
       Docs: https://docs.docker.com
    Main PID: 7580 (dockerd)
      Tasks: 21
     Memory: 538.7M
     CGroup: /system.slice/docker.service
             ├─ 7580 /usr/bin/dockerd -H fd:// --containerd=/run/containerd/containerd.sock
             └─23702 /usr/bin/docker-proxy -proto tcp -host-ip 127.0.0.1 -host-port 3000 -con>

    ```

You can restart the service (usually when changing the Docker daemon configuration) by running `systemctl restart docker`.

`docker system info` (or `docker info`) shows general information about the Docker installation (version, plugins), data regarding containers (number of containers, number of images), runtime solution, security options, and details about the current system (operating system, architecture, resources).

    ```console
    student@work:~$ docker system info
    Client: Docker Engine - Community
     Version:    27.1.2
     Context:    default
     Debug Mode: false
     Plugins:
      buildx: Docker Buildx (Docker Inc.)
        Version:  v0.16.2
        Path:     /usr/libexec/docker/cli-plugins/docker-buildx
      compose: Docker Compose (Docker Inc.)
        Version:  v2.29.1
        Path:     /usr/libexec/docker/cli-plugins/docker-compose
      scan: Docker Scan (Docker Inc.)
        Version:  v0.23.0
        Path:     /usr/libexec/docker/cli-plugins/docker-scan

    Server:
     Containers: 1
      Running: 1
      Paused: 0
      Stopped: 0
     Images: 2
     Server Version: 27.1.2
    ...

    Security Options:
     apparmor
     seccomp
      Profile: builtin
    Kernel Version: 5.15.0-118-generic
    Operating System: Ubuntu 20.04.2 LTS
    OSType: linux
    Architecture: x86_64
    CPUs: 2
    Total Memory: 5.748GiB
    ```

Using `docker system df`, you can see the total space used by the containers, images, volumes etc., including the space that can be reclaimed (unused data).

    ```console
    student@work:~$ docker system df
    TYPE            TOTAL     ACTIVE    SIZE      RECLAIMABLE
    Images          2         1         965.7MB   396.8MB (41%)
    Containers      1         1         3.869kB   0B (0%)
    Local Volumes   10        3         632.6MB   347.5MB (54%)
    Build Cache     16        0         0B        0B
    ```

To reclaim the space, you can use `docker system prune`. It's always a good idea to clean up your working space.

    ```console
    student@work:~$ docker system prune
    ```


To check the system-wide events, you can use `docker system events`. The command below limits the events to the ones that happened since last hour (it helps while filtering and debugging).

    ```console
    student@work:~$ docker system events --since $(echo $(date +"%s") - 3600 | bc)
    2025-02-25T10:31:38.911766282+02:00 container prune  (reclaimed=0)
    2025-02-25T10:31:38.913897032+02:00 network prune  (reclaimed=0)
    2025-02-25T10:31:38.914807392+02:00 image prune  (reclaimed=0)
    2025-02-25T10:31:38.986330104+02:00 builder prune  (reclaimed=0)
    ...
    ```


Another method of inspecting the logs associated with the docker service is by using `journalctl`. Run it yourself and compare the results with the ones displayed using `docker system events`.



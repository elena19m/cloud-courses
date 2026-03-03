## Volumes

While it makes sense to run Docker containers by themselves as services, all the data that they produce is ephemeral and will be deleted when the container is destroyed.

To provide an input to the containers and a permanent storage for them we use volumes.

Volumes are used to save outputs of files permanently.
Let's start a container based the `perpetual-writer` image that was prepared for this lab.
The container will be named `perpetual-writer` and will run in the background.

Use the following command:

```shell-session
$ docker run -d --name perpetual-writer -v perpetual-storage:/perpetual-storage -t perpetual-writer
```

Stop it and remove it.
Start a new container based on the same image using the same command.

Check the contents of the `/perpetual-storage/logs` file from within the container with:
```shell-session
$ docker exec -it perpetual-writer cat /perpetual-storage/logs
```

The files are still stored on disk but in the `/var/lib/docker` directory.
To find local mount point of the volume run the `docker volume inspect` command.
List the content of that directory.

## Bind mounts

Bind volumes mount files or directories from the host to a path in the container.

We will be running the `nginx` container using content from on our host system.
The command to do this from the `~/lab-containers-part-2` directory is:

```shell-session
$ docker run --name better-nginx -v $PWD/nginx-website:/usr/share/nginx/html:ro -d nginx
```

The `nginx-website` directory is mounted to the `/usr/share/nginx/html` directory.

To verify the content served by `nginx`, you need to find the IP address with `docker inspect`:
```shell-session
$ docker inspect better-nginx | jq -r '.[0].NetworkSettings.Networks[].IPAddress'
172.17.0.2
```

Then use `curl` to access the content served by `nginx` on port `80`:
```shell-session
$ curl http://172.17.0.2:80
Simple NGINX server
```

Now create a local directory named `better-website`, with an `index.html` file inside, that has a different content.
Change the above command to mount the `better-website` directory instead.
See what has changed (use `curl` again).

Add an additional mount point to the above command to mount the `nginx-confs/nginx.conf` file as the Nginx configuration file found at `/etc/nginx/nginx.conf`.

## Volumes

While it makes sense to run Docker containers by themselves as services, all the data that they produce is ephemeral and will be deleted when the container is destroyed.

To provide an input to the containers and a permanent storage for them we use volumes.

Volumes are used to save outputs of files permanently. Start a container based on the image you can build and call `perpetual-writer`in the background using the following command:

```console
docker run -d --name perpetual-writer -v perpetual-storage:/var/perpetual-storage -t perpetual-writer
```

Stop it and remove it.
Start a new container based on the same image using the same command.
Enter the container and check the content of the `/perpetual-storage/logs` file.

The files are still stored on disk but in the `/var/lib/docker` directory.
To find local mount point of the volume run the `docker volume inspect` command.
List the content of that directory.

### Bind mounts

Bind volumes mount files or directories from the host to a path in the container.

We will be running the `nginx` container using content on our host system.
The command to do this from the repository root is:

```console
docker run --name better-nginx -v $PWD/nginx-website:/usr/share/nginx/html:ro -d nginx
```

The `nginx-website` directory is mounted to the `/usr/share/nginx/html` directory.
Change the above command to mount the `better-website` directory instead.
See what has changed.

Add an additional mount point to the above command to mount the `nginx-confs/nginx.conf` file as the Nginx configuration file fount at `/etc/nginx/nginx.conf`.

## Docker Compose

### Automate container startup using Docker Compose

As we can see from the above example, we can start containers using the `docker run` command, but that means running a command for each container.
This is simple when we only need to start two containers, but if we want to start more than two containers, or if we want to offer users a "one click" solution and we have a suite of containers needed for our solution, running in an ordered manner for each container does not scale.

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

In order to start the containers we use the `docker-compose up -d` command:

```
student@lab-docker:~$ docker-compose up -d
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

Notice that both containers run in the foreground. In order to start the containers in the background, we have to user the `-d` option.

To stop the containers specified in the `docker-compose.yaml` file we use the `docker-compose down` command as follows:

```
student@lab-docker:~$ docker-compose down
WARNING: Some networks were defined but are not used by any service: wordpress-net
Removing student_wordpress_1 ... done
Removing student_db_1        ... done
Removing network student_default
```

### Exercise: NextCloud Deployment using Docker Compose

Write a `docker-compose.yaml` file that will automatically start the `nextcloud` container when running the `docker-compose up` command.

### Using persistent storage in containers

When we work with applications that we install on a cluster, they store data ephemerally. Thus, when deleting the container, all the information in the container is deleted.
We don't want this to happen in the example of a database, where we rely on information being stored for a long time.

To start a container to which we attach a storage volume, we start the container as follows:

```
student@lab-docker:~$ docker run -d -v mysql-volume:/var/lib/mysql -e "MYSQL_ROOT_PASSWORD=somewordpress" -e "MYSQL_DATABASE=wordpress" -e "MYSQL_USER=wordpress" -e "MYSQL_PASSWORD=wordpress" mysql:5.7
07ae337cead33307e6146f4e7142345e59d59dd29334b6e37f47268b58d093ac
student@lab-docker:~$ docker exec -it 07ae337cead33307e6146f4e7142345e59d59dd29334b6e37f47268b58d093ac /bin/bash
root@07ae337cead3:/# echo "Hello" > /var/lib/mysql/test-file
root@07ae337cead3:/# exit
student@lab-docker:~$ docker stop 07ae337cead33307e6146f4e7142345e59d59dd29334b6e37f47268b58d093ac
07ae337cead33307e6146f4e7142345e59d59dd29334b6e37f47268b58d093ac
student@lab-docker:~$ docker rm 07ae337cead33307e6146f4e7142345e59d59dd29334b6e37f47268b58d093ac
07ae337cead33307e6146f4e7142345e59d59dd29334b6e37f47268b58d093ac
student@lab-docker:~$ docker run -d -v mysql-volume:/var/lib/mysql -e "MYSQL_ROOT_PASSWORD=somewordpress" -e "MYSQL_DATABASE=wordpress" -e "MYSQL_USER=wordpress" -e "MYSQL_PASSWORD=wordpress" mysql:5.7
ad1b42b46654a8d4c721e69e824aa7ee18f1e39a85e0b27f1ac966c355a2786a
student@lab-docker:~$ docker exec -it ad1b42b46654a8d4c721e69e824aa7ee18f1e39a85e0b27f1ac966c355a2786a /bin/bash
root@ad1b42b46654:/# cat /var/lib/mysql/test-file
Hello
```

:::note
While `docker stop` stops the container from running, the container's data is pruned after running the `docker rm` command.
:::

The `-v` option attaches the `mysql-volume` to the `mysql` container to the /var/lib/mysql path.
We notice that after we connected the volume, we wrote "Hello" in a file and it could be read after we restarted the container.
Volumes are defaulted to `/var/lib/docker/volumes/`.

If we want to mount a directory or file on the host system as persistent storage, we can do so using the path to the directory we want to use, instead of the volume name we want to use. .
The following example illustrates this option:

```
student@lab-docker:~$ docker run -d -v ~/mysql-vol/:/shared-dir -e "MYSQL_ROOT_PASSWORD=somewordpress" -e "MYSQL_DATABASE=wordpress" -e "MYSQL_USER=wordpress" -e "MYSQL_PASSWORD=wordpress" mysql:5.7
628de4f3c693b25396de4bbaa951636535ecb1c167b1cca785028479676b7cec
student@lab-docker:~$ docker exec -it 628de4f3c693b25396de4bbaa951636535ecb1c167b1cca785028479676b7cec /bin/bash
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
Note that when we run the `docker-compose down` command, the volume defined in `docker-compose.yaml` is deleted.
In order not to delete the volumes from the recipe, we need to run the `docker-compose stop` command to stop the containers defined in the YAML file.
:::

### Exercise: Mount a persistent volume in the NextCloud container

Start a container from the `nextcloud` image to which you attach a volume called `nextcloud-vol` to `/var/www/html`.
Restart the container and check that the configurations made when starting the container have been saved.

## HAProxy

HAProxy is a service that can function as a high-availability load balancer and
proxy. HAProxy can function as a TCP load balancer, meaning that it can proxy
random TCP streams, such as SSH connections, but for the purposes of this lab,
we are interested in configuring it as an HTTP proxy.


### HAProxy as load balancer

To use HAProxy, it must first be installed on the load balancer system:

```bash
student@load-balancer:~$ sudo apt update
student@load-balancer:~$ sudo apt install haproxy
```

Make sure to enable and start the HAProxy.

```bash
student@load-balancer:~$ sudo systemctl enable --now haproxy
```

We can configure HAProxy as a load balancer and reverse proxy for the two HTTP
servers, `real-server-1` and `real-server-2`. To do this, edit the
`/etc/haproxy/haproxy.cfg` file and configure the server to listen for HTTP
connections and use the two servers as the backends (append the following
configuration at the end of the file):

```
frontend www
        bind *:80
        default_backend realservers

backend realservers
        mode http
        balance roundrobin
        server realserver-1 192.168.100.72:80
        server realserver-2 192.168.100.73:80
```

:::tip
Restart the HAProxy whenever you edit the settings file to reload the changes.
:::

:::note Check how connections are handled
Check how connections are handled using `tcpdump`. Compare the connections
handling to how they were handled when using IP virtual server.
:::


### Health checks

HAProxy can automatically detect when the backend servers are down and remove
them from the pool of available servers to avoid sending requests to the
servers when they are unavailable.

To add health checks, edit the configuration files and add the
[httpchk](https://docs.haproxy.org/2.2/configuration.html#4.2-option%20httpchk)
option in the `backend` section, and then enable checks on the backend servers.
Set the check interval to 3 seconds.

:::tip
To enable health checks on the server, you must use the
[check](https://docs.haproxy.org/2.2/configuration.html#5.2-check) setting, and
configure the interval using the `inter` keyword.
:::

:::caution
Since the backend servers only have a basic configuration that serves static
pages (an `index.html` file), you cannot use the default health check method
(`OPTIONS`). You will have to use the `GET` method instead. To change the used
method, use the [http-check send][] directive and configure it to use the `GET`.

[http-check send]: https://docs.haproxy.org/2.2/configuration.html#4.2-http-check%20send

A fully functional application written using a programming language / framework
like PHP or NodeJS will likely handle the `OPTIONS` HTTP method without issues.
:::

After adding the health checks, see how HAProxy behaves when stopping the
`nginx` service on one of the real servers. Verify the service's logs and how
new requests are directed through the load balancer.


## HAProxy response caching

HAProxy can cache server responses to reduce the load on the web servers. This
is an important functionality since some files (e.g., CSS style pages,
JavaScript script, static images) are the same for all users. Consequently such
pages can be cached by the load balancer and served without requesting them from
the backend.


### Configure HAProxy caching

The cache must first be created at the top level of the configuration file, and
then used in the `backend` section. You can find more details in the
[cache](https://docs.haproxy.org/2.2/configuration.html#6) section of the
documentation.

We will configure a 256MB cache that will be used to store objects of a maximum
of 20MB. Only responses that are smaller than the maximum size (and are
cacheable according to the conditions defined in the documentation) will be
added to the cache. Additionally, we configure the cache such that objects that
are older than five seconds will expire. When an object's cache entry has
expired, it will be requested again from the backend servers.

```
backend realservers
        [...]
        http-request cache-use main
        http-response cache-store main
        server [...]

cache main
        total-max-size 256
        max-object-size 20971520
        max-age 5
```

:::note Observe responses when using a cache
Observe the behaviour of the load balancer after the cache has been enabled.
Send multiple requests to the server and see how the responses change when
using, or not using the cache. Keep sending requests for more than 10 seconds.
:::

We can extract information about the cached data using the administration
socket. To do this, we will use `socat` to connect to the socket and enter
commands:

```bash
student@load-balancer:~$ echo 'show cache' | sudo socat - /run/haproxy/admin.sock
```


### Blocking response caching

The web server can decide that some responses should not be cached, or that the
response must be re-validated by the client before reusing. We can use the
[Cache-Control](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control)
HTTP header to change how the response is be cached.

For example, we can set the `no-cache` policy on the responses coming from the
second web server. Edit the `/etc/nginx/sites-available/default` page on the
`real-server-2` server and add the following configuration in the `server`
section.

```
location /index.html {
        add_header Cache-Control no-cache;
}
```

After editing the configuration, restart the `nginx` service. Observe what
responses the client receives and the stats about HAProxy caches.

:::warning
On production servers it usually does not make sense to set the `no-cache`
parameter on plain HTML files. However, some response categories, such as
transitory messages used in authentication protocols should not be cached, since
they should not be reusable, and caching them may leak confidential information.
:::


### Performance improvements using caching

To get a better view of the load on the systems, we must first configure HAProxy
to only use one of the backend servers. Remove the `realserver-2` from the
configuration and restart HAProxy. Afterwards, confirm that you only get replies
from the first server.

We will use the `httperf` tool to test performance. Install the tool on the host
system:

```bash
student@lab-lb-host:~$ sudo apt install httperf
```

To start testing using the index file, use the following command:

```bash
student@lab-lb-host:~$ httperf --server 192.168.100.251 --port 80 --num-conns 10000 --rate 1000 --timeout 5
```

:::note Check the load on the system
Observe the load on the load balancer and the real server using `htop`. When the
test is finished, see the numbers printed by `httperf` for `Connection rate`,
`Request rate`, `Net I/O`.

Disable response caching and repeat the tests. See how the numbers change.
:::


## Securing connections with HTTPS

HTTPS is a protocol that encrypts communication between the client and the
server. This makes using HTTPS a requirement on all sites that require
authentication, or handle any sort of confidential information. Anyone with
access to the network can insert sniffing tools or implement various types of
attacks that force traffic to go through their system; without the encryption
provided by HTTPS they can view the raw packets and extract any transmitted
information.

Currently, almost all sites implement HTTPS, by either using a paid certificate
from a certification authority, or free certificates from authorities like
[Let's Encrypt](https://letsencrypt.org/).

For the purposes of this lab, since we do not have a (public) domain for our
services, we will use locally signed certificates - either a self-signed
certificate, or certificates signed by an internal certification authority.
Review the [generating a certificate](../../basic/certificates.md#generating-and-inspecting-a-certificate)
section for more details.


### Using HTTPS with HAProxy

Before enabling HTTPS, create a self-signed certificate in the
`/etc/ssl/private` directory (see the `crt-base` directive in the HAProxy
configuration). For this example, we will assume that you will create the
`load-balancer.pem` file as the certificate.

To enable HTTPS you must use the `ssl` setting and specify the certificate file
using the `crt` setting on the `bind` directive. The default port for HTTPS is
`443`.

```
frontend www
        bind *:80
        bind *:443 ssl crt load-balancer.pem
        [...]
```

:::caution Using the proper key file
The [crt directive](https://docs.haproxy.org/2.2/configuration.html#5.1-crt)
expects all certificate information to be placed in the same file (i.e., the
certificate, private key, issuer certificate chain, etc., must be concatenated
in a larger `*.pem` file) and HAProxy will automatically extract the data from
that file.

If the certificate file does not contain some of the expected information, it
will attempt to use some pre-defined file extensions to look for it. For
example, you could have the key in a separate file called
`load-balancer.pem.key`.
:::

:::tip Connecting to an HTTPS server
Both `wget` and `curl` support connecting to an HTTPS server and expect the
server to use a certificate that has been signed by a trusted authority. Since
we do not have a trusted certificate, you can pass the `-k` parameter to `curl`,
or the `--no-check-certificate` parameter to `wget`.
:::


### Automatic HTTPS redirects

A good practice is redirecting requests coming to the HTTP port (80) to use
HTTPS. To do this, we can add the following line to the `frontend` section of
the HAProxy configuration file:

```
frontend www
      [...]
      redirect scheme https if !{ ssl_fc }
```

:::tip Following redirects
To follow redirects, you can use the `-L` flag for `curl`. `wget` should
automatically follow redirects and download the page.
:::


### Internal HTTPS servers

Even when using HTTPS for client connections, establishing connections to the
backend servers using plain HTTP implies that we trust our internal network. We
can reduce the risk of having internal traffic intercepted (at the cost of
computational resources required for encryption) by adding TLS encryption to all
internal servers.

Begin by enabling HTTPS on the two backend servers. You will have to create
certificates for both backend servers. You can choose to either create a
self-signed certificate for each server, or create a CA on the host system that
you will use to sign the certificates.

We will assume that the certificates are created as
`/etc/ssl/private/real-server.pem` and the key is
`/etc/ssl/private/real-server.key`. Add the following configuration in the
`/etc/nginx/sites-enables/ssl` file:

```nginx
server {
        listen 443 ssl default_server;
        listen [::]:443 ssl default_server;

        server_name _;

        ssl_certificate /etc/ssl/private/real-server.pem;
        ssl_certificate_key /etc/ssl/private/real-server.key;

        root /var/www/html;
        index index.html;

        location / {
                try_files $uri $uri/ =404;
        }
}
```

After the configuration has been added, restart the `nginx` service on both
servers and check that you can send HTTPS requests to them.

At this point all that is left is configuring HAProxy to connect to the backend
servers using HTTPS. You must set the correct port and enable the use of SSL
when connecting.

:::tip
Since the backend servers do not use certificates that are signed by a trusted
authority, you will have to let HAProxy know that it can trust them. Use the
[ca-file](https://docs.haproxy.org/2.2/configuration.html#5.1-ca-file) setting
on the `server` directives to specify the certificate of the CA (or the
certificate files in case of self-signed certificates) that HAProxy should
trust.
:::

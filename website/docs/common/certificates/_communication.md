## Client/server communication


### Unencrypted client/server communication

First, in a separate terminal, start a `tcpdump` session to dump traffic on the loopback interface.
We will also use this for the next task.

```bash
$ sudo tcpdump -A -i lo port 12345
```

Now, start a simple server listening on the port `tcpdump` is monitoring.

```bash
$ nc -l 12345
```

To connect to the server, run the following in another terminal.

```bash
$ nc localhost 12345
```

:::tip
Notice that any text typed into the client shows in the server and vice-versa.
Also, the messages can be seen in plaintext in the `tcpdump` log.
:::


### Client/server communication over SSL/TLS

Use `openssl s_server` to start a server listening on the same port as the previous exercise.
Use the `server.tld` certificate previously generated.

```bash
$ openssl s_server -key server.key -cert server.crt -accept 12345
Using default temp DH parameters
ACCEPT
```

Connect to the server using `openssl s_client`.

```bash
$ openssl s_client -connect localhost:12345
CONNECTED(00000003)
Can't use SSL_get_servername
depth=0 C = RO, ST = Bucharest, L = Bucharest, O = Cloud courses, OU = Development, CN = server.tld
verify error:num=20:unable to get local issuer certificate
verify return:1
depth=0 C = RO, ST = Bucharest, L = Bucharest, O = Cloud courses, OU = Development, CN = server.tld
verify error:num=21:unable to verify the first certificate
verify return:1
---
Certificate chain
 0 s:C = RO, ST = Bucharest, L = Bucharest, O = Cloud courses, OU = Development, CN = server.tld
   i:C = RO, ST = Bucharest, O = Cloud & Grid Team, OU = Cloud Courses, CN = Cloud Courses CA
---
[...]
SSL handshake has read 1773 bytes and written 363 bytes
Verification error: unable to verify the first certificate
```

The validation of the server certificate has failed.

Attempt the connection again, this time specifying the CA certificate.

```bash
$ openssl s_client -CAfile ca/ca.crt -connect localhost:12345
CONNECTED(00000003)
Can't use SSL_get_servername
depth=1 C = RO, ST = Bucharest, O = Cloud & Grid Team, OU = Cloud Courses, CN = Cloud Courses CA
verify return:1
depth=0 C = RO, ST = Bucharest, L = Bucharest, O = Cloud courses, OU = Development, CN = server.tld
verify return:1
---
Certificate chain
 0 s:C = RO, ST = Bucharest, L = Bucharest, O = Cloud courses, OU = Development, CN = server.tld
   i:C = RO, ST = Bucharest, O = Cloud & Grid Team, OU = Cloud Courses, CN = Cloud Courses CA
---
[...]
SSL handshake has read 1773 bytes and written 363 bytes
Verification: OK
```

:::tip
The connection has been successfully established.
Verify that messages exchanged between server and client are no longer displayed in the `tcpdump` log.
:::

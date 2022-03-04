---
sidebar_position: 3
---

# Security: PKI, X.509, SSL, TLS

TLS (Transport Layer Security) is a cryptographic protocol that provides communication security between a client and a server.
Usually, the identity of the server is verified through a certificate.
This certificate contains a public key, the identity of the server and a signature which verifies that the key belongs to the entity in the certificate.

A certificate is valid if it is signed by a Certificate Authority (CA).
The CA is considered trustworthy by the communication client.
The client has access to the certificate of the CA, with which the signature in
the certificate belonging to the server can be verified and, consequently, the identity of the server can be verified.

## Lab Setup
  * We will be using a virtual machine in the [faculty's cloud](http://cloud.grid.pub.ro/).
  * When creating a virtual machine in the Launch Instance window:
    * Select **Boot from image** in **Instance Boot Source** section
    * Select **SCGC Template** in **Image Name** section
    * Select a flavor that is at least **m1.medium**.
  * The username for connecting to the VM is `student`.
  * For the following exercises, the resources can be found in the laboratory archive:
```
[student@scgc ~] $ cd
[student@scgc ~] $ wget --user=<username> --ask-password https://repository.grid.pub.ro/cs/scgc/laboratoare/lab-08.zip
[student@scgc ~] $ unzip lab-08.zip
```

## Tasks

### Inspecting and Verifying a Certificate

Begin by inspecting the certificate found in the `houdini.cs.pub.ro.crt-roedunet` file.

```bash
$ cd 1
$ openssl x509 -in houdini.cs.pub.ro.crt-roedunet -noout -text
```

In the output you can find information about:
  * the issuer
  * the validity
    * start date
    * end date
  * the public key
    * algorithm
    * modulus
    * exponent
  * certificate extensions
  * signature

Specific information regarding the certificate can be printed by replacing the `-text` argument with the one or more of the following:
```bash
$ openssl x509 -in houdini.cs.pub.ro.crt-roedunet -noout -pubkey
$ openssl x509 -in houdini.cs.pub.ro.crt-roedunet -noout -startdate
$ openssl x509 -in houdini.cs.pub.ro.crt-roedunet -noout -enddate
$ openssl x509 -in houdini.cs.pub.ro.crt-roedunet -noout -dates
$ openssl x509 -in houdini.cs.pub.ro.crt-roedunet -noout -issuer
$ openssl x509 -in houdini.cs.pub.ro.crt-roedunet -noout -subject
$ openssl x509 -in houdini.cs.pub.ro.crt-roedunet -noout -modulus
```

To verify the certificate using a certificate chain, use the following command:
```bash
$ openssl verify -CAfile terena-ca-chain.pem houdini.cs.pub.ro.crt-roedunet
houdini.cs.pub.ro.crt-roedunet: OU = Domain Control Validated, CN = houdini.cs.pub.ro
error 10 at 0 depth lookup:certificate has expired
OK
```
The certificate is expired, but has otherwise been verified.

Check the information in certificate chain:
```bash
$ cat terena-ca-chain.pem
-----BEGIN CERTIFICATE-----
...
-----END CERTIFICATE-----
-----BEGIN CERTIFICATE-----
...
-----END CERTIFICATE-----
-----BEGIN CERTIFICATE-----
...
-----END CERTIFICATE-----
```

Notice there are multiple certificates in the file.
Although `openssl` does not provide direct support for printing information about each certificate in the chain, the following workaround can be used:

```bash
$ openssl crl2pkcs7 -nocrl -certfile terena-ca-chain.pem | openssl pkcs7 -print_certs -noout
subject=/C=NL/ST=Noord-Holland/L=Amsterdam/O=TERENA/CN=TERENA SSL CA 2
issuer=/C=US/ST=New Jersey/L=Jersey City/O=The USERTRUST Network/CN=USERTrust RSA Certification Authority

subject=/C=US/ST=New Jersey/L=Jersey City/O=The USERTRUST Network/CN=USERTrust RSA Certification Authority
issuer=/C=SE/O=AddTrust AB/OU=AddTrust External TTP Network/CN=AddTrust External CA Root

subject=/C=SE/O=AddTrust AB/OU=AddTrust External TTP Network/CN=AddTrust External CA Root
issuer=/C=SE/O=AddTrust AB/OU=AddTrust External TTP Network/CN=AddTrust External CA Root
```

Verify `open-source.cs.pub.ro.crt-roedunet` and `security.cs.pub.ro.crt-roedunet` using the two certificate chains present in the resources archive.

:::tip
Find the ''issuer'' for each of the certificates and use the appropriate certificate chain.

:::

### Remotely Inspecting a Certificate

Connect to `aero.curs.pub.ro` using a secure connection to obtain its certificate.

```bash
$ echo | openssl s_client -connect aero.curs.pub.ro:443
CONNECTED(00000003)
depth=2 C = US, ST = New Jersey, L = Jersey City, O = The USERTRUST Network, CN = USERTrust RSA Certification Authority
verify return:1
depth=1 C = NL, O = GEANT Vereniging, CN = GEANT OV RSA CA 4
verify return:1
depth=0 C = RO, postalCode = 060042, L = Bucure\C8\99ti, street = Sectorul 6, street = "Independentei Street, No.313", O = Universitatea Politehnica din Bucure\C8\99ti, OU = NCIT Cluster, CN = *.curs.pub.ro
verify return:1
---
Certificate chain
 0 s:C = RO, postalCode = 060042, L = Bucure\C8\99ti, street = Sectorul 6, street = "Independentei Street, No.313", O = Universitatea Politehnica din Bucure\C8\99ti, OU = NCIT Cluster, CN = *.curs.pub.ro
   i:C = NL, O = GEANT Vereniging, CN = GEANT OV RSA CA 4
 1 s:C = GB, ST = Greater Manchester, L = Salford, O = Comodo CA Limited, CN = AAA Certificate Services
   i:C = GB, ST = Greater Manchester, L = Salford, O = Comodo CA Limited, CN = AAA Certificate Services
 2 s:C = US, ST = New Jersey, L = Jersey City, O = The USERTRUST Network, CN = USERTrust RSA Certification Authority
   i:C = GB, ST = Greater Manchester, L = Salford, O = Comodo CA Limited, CN = AAA Certificate Services
 3 s:C = NL, O = GEANT Vereniging, CN = GEANT OV RSA CA 4
   i:C = US, ST = New Jersey, L = Jersey City, O = The USERTRUST Network, CN = USERTrust RSA Certification Authority
...
```

The received certificate appears to be for `*.curs.pub.ro`.
This is a wildcard certificate that is available for all subdomains of `curs.pub.ro`.
Such certificates can be used when all subdomains are secured by the same server (web server or load balancer). Let's inspect the certificate:

```bash
$ echo | openssl s_client -connect aero.curs.pub.ro:443 2>/dev/null | sed -ne '/-BEGIN CERTIFICATE-/,/-END CERTIFICATE-/p' | openssl x509 -noout -text
Certificate:
    Data:
        Version: 3 (0x2)
        Serial Number:
            3c:e8:ca:7b:24:34:0e:23:33:d2:ec:4d:3e:de:d0:03
        Signature Algorithm: sha384WithRSAEncryption
        Issuer: C = NL, O = GEANT Vereniging, CN = GEANT OV RSA CA 4
        Validity
            Not Before: Jul  8 00:00:00 2020 GMT
            Not After : Jul  8 23:59:59 2021 GMT
        Subject: C = RO, postalCode = 060042, L = Bucure\C8\99ti, street = Sectorul 6, street = "Independentei Street, No.313", O = Universitatea Politehnica din Bucure\C8\99ti, OU = NCIT Cluster, CN = *.curs.pub.ro
        Subject Public Key Info:
            Public Key Algorithm: rsaEncryption
                RSA Public-Key: (4096 bit)
                Modulus:
                    00:ce:7b:17:7b:8f:c3:be:00:b5:a4:7f:28:db:53:
                    db:a2:27:c2:62:6d:a4:75:7b:10:b7:81:3e:1d:5c:
                    6d:48:18:77:3f:f8:d6:5e:93:e8:50:fd:16:fb:a2:
                    79:ae:4b:12:39:22:df:28:9c:b7:82:b2:89:9c:7e:
                    09:7a:43:b5:51:10:77:a3:c2:ec:bd:03:f6:b1:40:
                    f2:c1:82:ca:3b:53:fa:3a:5a:61:20:25:10:03:d6:
                    cc:eb:67:da:0a:3a:5b:f5:95:5e:15:5d:7e:b8:9d:
                    e5:9e:d5:0e:5b:4d:77:7b:eb:4f:e7:e6:ad:d4:7c:
                    20:dc:82:cc:d0:cf:63:5d:b3:8b:41:e4:3a:4e:70:
                    f6:18:75:a4:90:1a:b3:18:ad:b2:51:53:92:9f:bf:
                    ed:c1:c3:8e:ea:e0:8e:ef:68:fa:36:d2:c9:ed:8d:
                    34:24:4b:d5:9d:18:ab:42:c3:0d:38:71:1b:ea:a9:
                    ca:28:ff:cf:f5:9d:e1:cd:53:69:7a:c8:f2:82:af:
                    48:72:e9:96:db:16:00:7a:c0:fc:7a:7b:01:eb:d4:
                    66:9a:6c:4c:66:7d:de:f7:bc:9d:43:90:c0:03:4a:
                    a6:42:98:e0:cc:44:58:85:00:6b:f2:76:cd:59:dc:
                    df:d0:83:88:eb:28:5c:c9:3a:1b:b2:0d:61:27:1f:
                    ed:a9:63:0e:4a:f7:3e:25:b3:ab:30:92:15:b6:b2:
                    89:53:50:48:b2:77:39:6a:43:42:47:0d:d2:b6:c7:
                    27:40:f9:77:1b:55:44:7e:67:81:5e:cf:7e:8e:65:
                    1c:a4:0b:05:b6:ff:0a:91:70:79:40:f9:be:e8:17:
                    74:81:3a:c1:f2:be:51:2e:3a:0b:d2:a9:55:1c:37:
                    3b:2b:76:eb:2c:7b:64:fc:e7:0f:6c:c4:28:f7:7c:
                    2c:d0:61:31:a8:f6:db:fd:89:08:c6:9d:c5:98:ec:
                    cd:55:4b:e9:7b:3c:95:45:68:ca:fe:f0:45:75:2f:
                    6b:65:53:c2:44:b0:44:16:af:e8:d2:5b:d5:e0:1d:
                    57:45:6f:43:02:80:62:0d:d8:5a:75:ac:fd:ae:a0:
                    6b:b0:52:7c:00:cf:65:57:2e:ce:0a:8d:ec:24:68:
                    75:ce:62:92:0b:bf:b1:02:65:b9:6f:fe:a9:fa:77:
                    24:7f:5a:2b:7d:aa:bb:42:50:8e:d4:91:f0:94:3d:
                    3c:42:47:64:c7:92:c7:4f:ce:0b:43:01:f6:92:c2:
                    4e:d0:2c:9b:ee:9f:b0:6b:d2:14:84:54:0c:ad:53:
                    74:01:0e:b4:2b:63:95:cc:51:1e:44:ce:ef:9c:c0:
                    9d:a7:98:41:1a:c4:3b:97:75:f5:eb:84:00:22:8e:
                    b9:66:37
                Exponent: 65537 (0x10001)
        X509v3 extensions:
            X509v3 Authority Key Identifier: 
                keyid:6F:1D:35:49:10:6C:32:FA:59:A0:9E:BC:8A:E8:1F:95:BE:71:7A:0C

            X509v3 Subject Key Identifier: 
                F9:09:37:51:7C:1D:EC:62:7A:9E:F9:4C:23:98:9E:FB:14:3F:52:D9
            X509v3 Key Usage: critical
                Digital Signature, Key Encipherment
            X509v3 Basic Constraints: critical
                CA:FALSE
            X509v3 Extended Key Usage: 
                TLS Web Server Authentication, TLS Web Client Authentication
            X509v3 Certificate Policies: 
                Policy: 1.3.6.1.4.1.6449.1.2.2.79
                  CPS: https://sectigo.com/CPS
                Policy: 2.23.140.1.2.2

            X509v3 CRL Distribution Points: 

                Full Name:
                  URI:http://GEANT.crl.sectigo.com/GEANTOVRSACA4.crl

            Authority Information Access: 
                CA Issuers - URI:http://GEANT.crt.sectigo.com/GEANTOVRSACA4.crt
                OCSP - URI:http://GEANT.ocsp.sectigo.com

            X509v3 Subject Alternative Name: 
                DNS:*.curs.pub.ro, DNS:curs.pub.ro
...
```

As we can see, all the Subject Alternative Names (SAN) can be found under in the certificate, under `DNS` entries.

:::tip
Within a browser, inspect the certificate for `aero.curs.pub.ro` and find the field
that specifies the Subject Alternative Names for the certificate.
To avoid automatic redirecting to `curs.upb.ro`, go to `aero.curs.pub.ro/2019`.

:::

### Generating and Inspecting a Certificate

The steps required when generating a certificate are as follows:
  - generate a private key
  - generate a certificate signing request (CSR) with the key and identification data
  - send the CSR to a CA in order to have it signed

We will generate a CSR for `server.scgc`. Use the `3` directory.

```bash
$ cd 3
```

First, generate a private key:

```bash
$ openssl genrsa -out server.scgc.key 2048
Generating RSA private key, 2048 bit long modulus
...............................................+++
.....................................................................................+++
e is 65537 (0x10001)
```

Then, generate the signing request:
```bash
$ openssl req -new -key server.scgc.key -out server.scgc.csr
...
```

:::tip
Supply the following information in the request:
  * `Organization Name`: `SCGC`.
  * `Organizational Unit`: `Development`.
  * `Common Name`: `server.scgc`.
The other fields can be completed as desired.

:::

Usually, at this point, the request would be sent to a trusted CA in order to be signed.
Instead, we will sign the certificate using the `scgc-ca.crt` certificate from the resource archive.

```bash
$ openssl ca -config scgc-ca.cnf -policy signing_policy -extensions signing_req -in server.scgc.csr -out server.scgc.crt
Using configuration from scgc-ca.cnf
Check that the request matches the signature
Signature ok
...
Sign the certificate? [y/n]:y


1 out of 1 certificate requests certified, commit? [y/n]y
Write out database with 1 new entries
Data Base Updated
```

:::tip
Inspect the `scgc-ca.cnf` file, in particular the `signing_policy` section.

A more complex openssl configuration file can be found at `/etc/ssl/openssl.cnf`.

:::

Verify that the signed certificate matches the generated key.
```bash
$ openssl x509 -in server.scgc.crt -noout -modulus | md5sum
d80db122c02c6ef6eabb3b4cbd8b8f40  -
$ openssl rsa -in server.scgc.key -noout -modulus | md5sum
d80db122c02c6ef6eabb3b4cbd8b8f40  -
```

Furthermore, verify the certificate using the `scgc-ca.crt` certificate.
```bash
$ openssl verify -CAfile scgc-ca/scgc-ca.crt server.scgc.crt
server.scgc.crt: OK
```

:::warning

Currently, the `scgc-ca.crt` certificate is expired, so the last command will fail.
If you want to solve this issue, you can regenerate the CA certificate by running the following commands (and resign the newly created CSR):
```bash
$ openssl req -new -key scgc-ca/scgc-ca.key -out scgc-ca/scgc-ca.csr
$ openssl x509 -req -in scgc-ca/scgc-ca.csr -signkey scgc-ca/scgc-ca.key -out scgc-ca/scgc-ca.crt
```

:::

### Unencrypted Client/Server Communication

First, in a separate terminal, start a `tcpdump` session to dump traffic on the loopback interface.
We will also use this for the next exercise.

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

### Client/Server Communication over SSL/TLS

Use `openssl s_server` to start a server listening on the same port as the previous exercise.
Use the `server.scgc` certificate previously generated.

```bash
$ openssl s_server -key server.scgc.key -cert server.scgc.crt -accept 12345
Using default temp DH parameters
ACCEPT
```

Connect to the server using `openssl s_client`.
```bash
$ openssl s_client -connect localhost:12345
CONNECTED(00000003)
depth=0 C = RO, ST = Bucharest, L = Bucharest, O = SCGC, OU = Development, CN = server.scgc
verify error:num=20:unable to get local issuer certificate
verify return:1
depth=0 C = RO, ST = Bucharest, L = Bucharest, O = SCGC, OU = Development, CN = server.scgc
verify error:num=21:unable to verify the first certificate
verify return:1
---
Certificate chain
 0 s:/C=RO/ST=Bucharest/L=Bucharest/O=SCGC/OU=Development/CN=server.scgc
   i:/C=RO/O=SCGC/OU=Development/CN=SCGC CA
---
...
    Verify return code: 21 (unable to verify the first certificate)
```

The validation of the server certificate has failed.

Attempt the connection again, this time specifying the CA certificate.

```bash
$ openssl s_client -CAfile scgc-ca/scgc-ca.crt -connect localhost:12345
CONNECTED(00000003)
depth=1 C = RO, O = SCGC, OU = Development, CN = SCGC CA
verify return:1
depth=0 C = RO, ST = Bucharest, L = Bucharest, O = SCGC, OU = Development, CN = server.scgc
verify return:1
---
Certificate chain
 0 s:/C=RO/ST=Bucharest/L=Bucharest/O=SCGC/OU=Development/CN=server.scgc
   i:/C=RO/O=SCGC/OU=Development/CN=SCGC CA
---
...
    Verify return code: 0 (ok)
```

:::tip
The connection has been successfully established.
Verify that messages exchanged between server and client are no longer displayed in the `tcpdump` log.

:::



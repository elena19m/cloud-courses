## Creating and inspecting certificates


TLS (Transport Layer Security) is a cryptographic protocol that provides communication security between a client and a server.
Usually, the identity of the server is verified through a certificate.
This certificate contains a public key, the identity of the server and a signature which verifies that the key belongs to the entity in the certificate.

A certificate is valid if it is signed by a Certificate Authority (CA).
The CA is considered trustworthy by the communication client.
The client has access to the certificate of the CA, with which the signature in
the certificate belonging to the server can be verified and, consequently, the identity of the server can be verified.


### Inspecting local certificate files

Begin by inspecting the certificate found in the `houdini.cs.pub.ro.crt-roedunet` file.

```shell-session
$ cd cert-inspect
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

```shell-session
$ openssl x509 -in houdini.cs.pub.ro.crt-roedunet -noout -pubkey
$ openssl x509 -in houdini.cs.pub.ro.crt-roedunet -noout -startdate
$ openssl x509 -in houdini.cs.pub.ro.crt-roedunet -noout -enddate
$ openssl x509 -in houdini.cs.pub.ro.crt-roedunet -noout -dates
$ openssl x509 -in houdini.cs.pub.ro.crt-roedunet -noout -issuer
$ openssl x509 -in houdini.cs.pub.ro.crt-roedunet -noout -subject
$ openssl x509 -in houdini.cs.pub.ro.crt-roedunet -noout -modulus
```

To verify the certificate using a certificate chain, use the following command:

```shell-session
$ openssl verify -CAfile terena-ca-chain.pem houdini.cs.pub.ro.crt-roedunet
houdini.cs.pub.ro.crt-roedunet: OU = Domain Control Validated, CN = houdini.cs.pub.ro
error 10 at 0 depth lookup:certificate has expired
OK
```

The certificate is expired, but has otherwise been verified.

:::tip
Use `man openssl-verify` to check other error codes.
:::

Check the information in certificate chain:

```shell-session
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

```shell-session
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


### Inspecting remote certificates

Connect to `indico.upb.ro` using a secure connection to obtain its certificate.

```shell-session
$ echo | openssl s_client -connect indico.upb.ro:443
CONNECTED(00000003)
depth=2 C = GR, O = Hellenic Academic and Research Institutions CA, CN = HARICA TLS ECC Root CA 2021
verify return:1
depth=1 C = GR, O = Hellenic Academic and Research Institutions CA, CN = GEANT TLS ECC 1
verify return:1
depth=0 C = RO, L = Bucure\C8\99ti, O = POLITEHNICA Bucure\C8\99ti, CN = indico.upb.ro
verify return:1
---
Certificate chain
 0 s:C = RO, L = Bucure\C8\99ti, O = POLITEHNICA Bucure\C8\99ti, CN = indico.upb.ro
   i:C = GR, O = Hellenic Academic and Research Institutions CA, CN = GEANT TLS ECC 1
   a:PKEY: id-ecPublicKey, 384 (bit); sigalg: ecdsa-with-SHA384
   v:NotBefore: Feb 23 14:28:41 2026 GMT; NotAfter: Feb 23 14:28:41 2027 GMT
 1 s:C = GR, O = Hellenic Academic and Research Institutions CA, CN = GEANT TLS ECC 1
   i:C = GR, O = Hellenic Academic and Research Institutions CA, CN = HARICA TLS ECC Root CA 2021
   a:PKEY: id-ecPublicKey, 384 (bit); sigalg: ecdsa-with-SHA384
   v:NotBefore: Jan  3 11:14:21 2025 GMT; NotAfter: Dec 31 11:14:20 2039 GMT
 2 s:C = GR, O = Hellenic Academic and Research Institutions CA, CN = HARICA TLS ECC Root CA 2021
   i:C = GR, O = Hellenic Academic and Research Institutions CA, CN = HARICA TLS ECC Root CA 2021
   a:PKEY: id-ecPublicKey, 384 (bit); sigalg: ecdsa-with-SHA384
   v:NotBefore: Feb 19 11:01:10 2021 GMT; NotAfter: Feb 13 11:01:09 2045 GMT
...
```

The received certificate appears to be for `*.curs.pub.ro`.
This is a wildcard certificate that is available for all subdomains of `curs.pub.ro`.
Such certificates can be used when all subdomains are secured by the same server (web server or load balancer). Let's inspect the certificate:

```shell-session
$ echo | openssl s_client -connect indico.upb.ro:443 2>/dev/null | sed -ne '/-BEGIN CERTIFICATE-/,/-END CERTIFICATE-/p' | openssl x509 -noout -text
Certificate:
    Data:
        Version: 3 (0x2)
        Serial Number:
            55:a7:74:3f:03:61:78:a5:69:61:7b:6d:67:b0:15:ba
        Signature Algorithm: ecdsa-with-SHA384
        Issuer: C = GR, O = Hellenic Academic and Research Institutions CA, CN = GEANT TLS ECC 1
        Validity
            Not Before: Feb 23 14:28:41 2026 GMT
            Not After : Feb 23 14:28:41 2027 GMT
        Subject: C = RO, L = Bucure\C8\99ti, O = POLITEHNICA Bucure\C8\99ti, CN = indico.upb.ro
        Subject Public Key Info:
            Public Key Algorithm: id-ecPublicKey
                Public-Key: (384 bit)
                pub:
                    04:fa:4f:03:0c:06:3e:c6:f4:79:e2:c1:70:9c:ba:
                    54:e0:05:ab:d5:d0:5f:7a:38:67:3c:c4:9f:c4:15:
                    09:8e:38:9d:bc:e3:ca:2c:dd:f1:53:2c:b4:2f:67:
                    7c:40:25:15:77:8c:01:9e:3b:53:cd:e1:c4:44:29:
                    54:b1:37:8f:82:42:e1:57:ad:d7:cc:1c:84:1d:47:
                    cf:5e:9b:71:de:a7:7f:1d:0e:dc:86:10:0b:39:4a:
                    14:d1:06:95:8f:12:a2
                ASN1 OID: secp384r1
                NIST CURVE: P-384
        X509v3 extensions:
            X509v3 Basic Constraints: critical
                CA:FALSE
            X509v3 Authority Key Identifier:
                E9:99:06:8D:17:1F:AB:FB:96:1A:5A:C8:5B:5E:5D:5E:EC:DA:9C:8F
            Authority Information Access:
                CA Issuers - URI:http://crt.harica.gr/HARICA-GEANT-TLS-E1.cer
                OCSP - URI:http://ocsp-tls.harica.gr
            X509v3 Subject Alternative Name:
                DNS:indico.upb.ro, DNS:www.indico.upb.ro
...
```

As you can see, all the Subject Alternative Names (SAN) can be found under in the certificate, under `DNS` entries.

:::tip
Within a browser, inspect the certificate for `indico.upb.ro` and find the field
that specifies the Subject Alternative Names for the certificate.
:::


### Generating certificates

The steps required when generating a certificate are as follows:
  - generate a private key
  - generate a certificate signing request (CSR) with the key and identification data
  - send the CSR to a CA in order to have it signed

We will generate a CSR for `server.tld`. Use the `cert-gen` directory.

```shell-session
$ cd cert-gen
```

First, generate a private key:

```shell-session
$ openssl genrsa -out server.key 2048
Generating RSA private key, 2048 bit long modulus
...............................................+++
.....................................................................................+++
e is 65537 (0x10001)
```

Then, generate the signing request:

```shell-session
$ openssl req -new -key server.key -out server.csr
...
```

:::tip
Supply the following information in the request:
  * `Organization Name`: `Cloud courses`.
  * `Organizational Unit`: `Development`.
  * `Common Name`: `server.tld`.

The other fields can be completed as desired.
:::

Usually, at this point, the request would be sent to a trusted CA in order to be signed.
Instead, we will sign the certificate using the `ca.crt` certificate from the resource archive.

```shell-session
$ openssl ca -config ca.cnf -policy signing_policy -extensions signing_req -in server.csr -out server.crt
Using configuration from ca.cnf
Check that the request matches the signature
Signature ok
...
Sign the certificate? [y/n]:y


1 out of 1 certificate requests certified, commit? [y/n]y
Write out database with 1 new entries
Data Base Updated
```

:::tip
Inspect the `ca.cnf` file, in particular the `signing_policy` section.

A more complex OpenSSL configuration file can be found at `/etc/ssl/openssl.cnf`.
:::

Verify that the signed certificate matches the generated key.

```shell-session
$ openssl x509 -in server.crt -noout -modulus | md5sum
d80db122c02c6ef6eabb3b4cbd8b8f40  -
$ openssl rsa -in server.key -noout -modulus | md5sum
d80db122c02c6ef6eabb3b4cbd8b8f40  -
```

Furthermore, verify the certificate using the `ca.crt` certificate.
```shell-session
$ openssl verify -CAfile ca/ca.crt server.crt
server.crt: OK
```

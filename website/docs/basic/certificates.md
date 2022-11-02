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

import CertSetup, {toc as CertSetupTOC} from '../common/certificates/_setup.md';

<CertSetup/>

import CertBasics, {toc as CertBasicsTOC} from '../common/certificates/_basics.md';

<CertBasics/>

import CertComm, {toc as CertCommTOC} from '../common/certificates/_communication.md';

<CertComm/>

export const toc = [...CertSetupTOC, ...CertBasicsTOC, ...CertCommTOC]

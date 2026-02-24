## GPG

[GPG](https://www.gnupg.org/) (GNU Privacy Guard) is an open-source implementation of the
[OpenPGP Message Format](https://www.ietf.org/rfc/rfc4880.txt) that is used
to secure the data that is transmitted from one entity to another
through untrusted environments where one must assure that the data was not
tampered by a third party.

GPG works using symmetric key encryption or a pair of public and private
cryptographic keys.


### GPG key setup

This step is done once, the first time you generate your GPG key. After that,
you can exchange the GPG public key with your collaborators and start encrypting
sensitive data or signing documents.

For this task, you will work on the VM.


:::danger
Most  `gpg` commands will work with binary files and, by default, will output
binary data to the terminal. Make sure to add the `--output` parameter or pipe
the output to `cat -v` or another tool that can escape non-printable characters
(`gpg [...] |& cat -v`).
:::

```bash
student@lab:~$ gpg --full-generate-key
gpg (GnuPG) 2.2.19; Copyright (C) 2019 Free Software Foundation, Inc.
This is free software: you are free to change and redistribute it.
There is NO WARRANTY, to the extent permitted by law.

Please select what kind of key you want:
   (1) RSA and RSA (default)
   (2) DSA and Elgamal
   (3) DSA (sign only)
   (4) RSA (sign only)
  (14) Existing key from card
Your selection? <Enter>
RSA keys may be between 1024 and 4096 bits long.
What keysize do you want? (3072) 4096
Requested keysize is 4096 bits
Please specify how long the key should be valid.
         0 = key does not expire
      <n>  = key expires in n days
      <n>w = key expires in n weeks
      <n>m = key expires in n months
      <n>y = key expires in n years
Key is valid for? (0) <Enter>
Key does not expire at all
Is this correct? (y/N) y

GnuPG needs to construct a user ID to identify your key.

Real name: Student User
Email address: user@stud.acs.upb.ro
Comment: SCGC Lab
You selected this USER-ID:
    "Student User (SCGC Lab) <user@stud.acs.upb.ro>"

Change (N)ame, (C)omment, (E)mail or (O)kay/(Q)uit? O
We need to generate a lot of random bytes. It is a good idea to perform
some other action (type on the keyboard, move the mouse, utilize the
disks) during the prime generation; this gives the random number
generator a better chance to gain enough entropy.
We need to generate a lot of random bytes. It is a good idea to perform
some other action (type on the keyboard, move the mouse, utilize the
disks) during the prime generation; this gives the random number
generator a better chance to gain enough entropy.
gpg: /home/student/.gnupg/trustdb.gpg: trustdb created
gpg: key 29F1349EEE0E2B1E marked as ultimately trusted
gpg: directory '/home/student/.gnupg/openpgp-revocs.d' created
gpg: revocation certificate stored as '/home/student/.gnupg/openpgp-revocs.d/<FINGERPRINT>.rev'
public and secret key created and signed.

pub   rsa4096 2026-02-24 [SC]
      <FINGERPRINT>
uid                      Student User (SCGC Lab) <user@stud.acs.upb.ro>
sub   rsa4096 2026-02-24 [E]
```

:::info
Depending on your GPG version, the prompt may be different.
For example, you may have more key type options (Elliptic Curve).
Always use a key type that provides good security guarantees.
:::

Let's check the key we have created.

```bash
student@lab:~$ gpg --list-key --with-subkey-fingerprint
gpg: checking the trustdb
gpg: marginals needed: 3  completes needed: 1  trust model: pgp
gpg: depth: 0  valid:   1  signed:   0  trust: 0-, 0q, 0n, 0m, 0f, 1u
/home/student/.gnupg/pubring.kbx
--------------------------------
pub   rsa4096 2026-02-24 [SC]
      <FINGERPRINT>
uid           [ultimate] Student User (SCGC Lab) <user@stud.acs.upb.ro>
sub   rsa4096 2026-02-24 [E]
      <E_FINGERPRINT>
```

:::info Subkeys
GPG uses primary keys and subkeys. Under a primary key that is used only for
signing, you can have multiple subkeys that are signed with the primary key and
can be used for authentication, signing or encryption.

As you can see in the output above, you have two fingerprints.
The first one (under `pub`) is associated with the key and is used for signing
(`S`) and certification (`C`).

The second one (under `sub`) is associated with a subkey that was generated for
encryption (`E`). In our case, when we created the primary key, the encryption
subkey was automatically created.
:::

### Exercise - Share GPG encrypted data

For this task you have to work in pairs. The task is described for two students,
but it can be extended to as many students as you want.

In the next sections we will present the scenario in which Bob wants to send
encrypted data to Alice. For this task, one of you will be Alice and the other(s)
will be Bob (for multiple senders, the steps must be repeated for each one):
  - the data you want to encrypt is up to you (e.g., Bob can
create a plain text file with some important secrets he wants to share with Alice),
be creative;
  - you can transmit the encrypted data using your favourite platform (`scp`, Teams, WhatsApp,
email, homing pigeons).


#### Export Alice's public key

This task is for Alice.

The first thing we need to do is to export the public key in a format that can
be sent to Bob.

For this task, pay attention to replace the text in `<...>`.

```bash
student@lab:~$ gpg --armour --output <alice>.gpg --export <Alice's email>
```

Send the public key to Bob.

:::info
The key validation steps can be omitted, but since GPG does not have a public root of
trust (similar to root CAs for certificates), anyone can impersonate the sender/recipient.

It is always a good idea to check the key's fingerprint before trusting it.
:::

Another important step is for Bob to verify that the key belongs to Alice.
For that, we should also inform Bob (this time on a secure channel) about the
key's fingerprint.

```bash
student@lab:~$ gpg -v --fingerprint <Alice's email>
gpg: using pgp trust model
pub   rsa4096 2026-02-24 [SC]
      14A9 DB7B 835B E2F0 743A  BD24 0501 C489 B420 74DE
uid           [ultimate] Alice (SCGC Lab) <alice@stud.acs.upb.ro>
sub   rsa4096 2026-02-24 [E]
```

When the time comes, inform Bob of the key's fingerprint. Do not use the same communication
channel as before.

#### Import Alice's public key

This task is for Bob.

Receive the public key from Alice and import it.

```bash
student2@lab:~$ gpg --import alice.gpg
[...]
gpg: key 0501C489B42074DE: public key "Alice (SCGC Lab) <alice@stud.acs.upb.ro>" imported
gpg: Total number processed: 1
gpg:               imported: 1

student2@lab:~$ gpg --list-keys
gpg: checking the trustdb
gpg: marginals needed: 3  completes needed: 1  trust model: pgp
gpg: depth: 0  valid:   1  signed:   0  trust: 0-, 0q, 0n, 0m, 0f, 1u
/home/student2/.gnupg/pubring.kbx
---------------------------------
pub   rsa3072 2026-02-24 [SC]
      1AD169FE836BF8B6A83DCF8A26E89A3E08202572
uid           [ultimate] Bob (SCGC Lab) <bob@stud.acs.upb.ro>
sub   rsa3072 2026-02-24 [E]

pub   rsa4096 2026-02-24 [SC]
      14A9DB7B835BE2F0743ABD240501C489B42074DE
uid           [ unknown] Alice (SCGC Lab) <alice@stud.acs.upb.ro>
sub   rsa4096 2026-02-24 [E]
```

:::info
Note that Bob's key is marked as `ultimate` (highly trusted), while Alice's key is
marked as `unknown` (untrusted).

You can check all the trust values in `man gpg`, by searching for `TRUST
VALUES`.
:::

Now, let's check the fingerprint of the key and sign the key:
  - we need to look at the imported key's fingerprint (`fpr`);
  - compare it with the fingerprint received from Alice;
  - when we are sure that the fingerprint is correct, we can sign the key.

```
# Check if fingerprints match
student2@lab:~$ gpg --edit-key alice
gpg (GnuPG) 2.2.19; Copyright (C) 2019 Free Software Foundation, Inc.
This is free software: you are free to change and redistribute it.
There is NO WARRANTY, to the extent permitted by law.


pub  rsa4096/0501C489B42074DE
     created: 2026-02-24  expires: never       usage: SC
     trust: unknown       validity: unknown
sub  rsa4096/6FF781FA463A1F64
     created: 2026-02-24  expires: never       usage: E
[ unknown] (1). Alice (SCGC Lab) <alice@stud.acs.upb.ro>

gpg> fpr
pub   rsa4096/0501C489B42074DE 2026-02-24 Alice (SCGC Lab) <alice@stud.acs.upb.ro>
 Primary key fingerprint: 14A9 DB7B 835B E2F0 743A  BD24 0501 C489 B420 74DE

gpg> sign

pub  rsa4096/0501C489B42074DE
     created: 2026-02-24  expires: never       usage: SC
     trust: unknown       validity: unknown
 Primary key fingerprint: 14A9 DB7B 835B E2F0 743A  BD24 0501 C489 B420 74DE

     Alice (SCGC Lab) <alice@stud.acs.upb.ro>

Are you sure that you want to sign this key with your
key "Bob <bob@stud.acs.upb.ro>" (26E89A3E08202572)

Really sign? (y/N) y

student2@lab:~$ gpg --list-keys
/home/student2/.gnupg/pubring.kbx
---------------------------------
...
pub   rsa4096 2026-02-24 [SC]
      14A9DB7B835BE2F0743ABD240501C489B42074DE
uid           [  full  ] Alice (SCGC Lab) <alice@stud.acs.upb.ro>
sub   rsa4096 2026-02-24 [E]
```

:::info
After signing the key, its trust status is elevated to `full`.
:::

#### Encrypt a file

This task is for Bob.

Create a file and encrypt it. Specify the recipient's (Alice's) email.
You can only encrypt a file if you have the recipient's public key imported into
your keyring.

```bash
student2@lab:~$ gpg --output doc.gpg --encrypt --recipient <Alice's email> doc
```

Send the `doc.gpg` file to Alice.

#### Decrypt the file

This task is for Alice.

Receive the file from Bob and decrypt it.

```bash
student@lab:~$ gpg --output doc --decrypt doc.gpg
gpg: encrypted with 4096-bit RSA key, ID 6FF781FA463A1F64, created 2026-02-24
      "Alice (SCGC Lab) <alice@stud.acs.upb.ro>"
student@lab:~$ cat doc
[redacted]
```


#### Exercise: Send a response back to Bob

Create a new file, encrypt it and send it back to Bob.



### Exercise - Verifying files with GPG


In the previous task we saw how we can use GPG to encrypt data. However, Alice
cannot verify that the sender is, indeed, Bob since the public key can be used
by anyone to encrypt data, not just Bob.

In this task, we will also sign the encrypted message before sending it to
Alice. For this, make sure that Bob has imported Alice's key and vice-versa.
Otherwise, we cannot sign and verify documents.

#### Encrypt and sign a document

This task is for Bob. Similar with the previous task, we encrypt the message for
Alice, but we additionally create a detached signature (the signature is written
in a separate file, `doc.gpg.asc`) that Alice can use to
verify that the message came from Bob.

```bash
student2@lab:~$ gpg --output doc.gpg --encrypt --recipient alice@stud.acs.upb.ro doc
student2@lab:~$ gpg --armour --detach-sign doc.gpg
student2@lab:~$ ls -l
[...]
-rw-rw-r-- 1 student2 student2  609 Feb 24 10:44 doc.gpg
-rw-rw-r-- 1 student2 student2  659 Feb 24 10:44 doc.gpg.asc
-rw-rw-r-- 1 student2 student2   13 Feb 24 09:41 doc
[...]
```

Send both files to Alice.

#### Verify the signature

This task is for Alice.

```bash
student@lab:~$ gpg --verify doc.gpg.asc doc.gpg
gpg: Signature made Tue 24 Feb 2026 10:44:17 AM UTC
gpg:                using RSA key 1AD169FE836BF8B6A83DCF8A26E89A3E08202572
gpg: Good signature from "Bob <bob@stud.acs.upb.ro>" [full]
```


### Exercise - Verify ISO download

Usually, when you download something (like an ISO file) from the Internet,
providers also add information that can be used to verify the
integrity of the data. While some use only a checksum validation system (`md5`,
`sha256`), others also use GPG signatures to validate authenticity of the checksums.


Access the [Fedora Project Security
page](https://www.fedoraproject.org/security/), download the Fedora GPG keyring
and use the keys to validate the authenticity of the checksum file for one of
the Fedora versions. Go to the
[download server](https://dl.fedoraproject.org/pub/fedora/linux/releases/),
navigate to one of the released versions (e.g, `43/Workstation/x86_64/iso/`),
download **only** the checksum file and verify it using the GPG keys.


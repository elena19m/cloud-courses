### Allow only local recursive queries

By default, bind will make recursive queries for any unknown query received.
Recursive queries are quite costly, therefore they should only be allowed explicitly.
We can check this by quering for `google.com` from the master and slave VMs:

```
root@master:~# host google.com localhost
Using domain server:
Name: 10.9.107.151
Address: 10.9.107.151#53
Aliases:

google.com has address 216.58.214.206
google.com has IPv6 address 2a00:1450:400d:802::200e
google.com mail is handled by 40 alt3.aspmx.l.google.com.
google.com mail is handled by 50 alt4.aspmx.l.google.com.
google.com mail is handled by 30 alt2.aspmx.l.google.com.
google.com mail is handled by 10 aspmx.l.google.com.
google.com mail is handled by 20 alt1.aspmx.l.google.com.

[root@slave ~]# host google.com master
Using domain server:
Name: 10.9.107.151
Address: 10.9.107.151#53
Aliases:

google.com has address 216.58.214.206
google.com has IPv6 address 2a00:1450:400d:802::200e
google.com mail is handled by 10 aspmx.l.google.com.
google.com mail is handled by 30 alt2.aspmx.l.google.com.
google.com mail is handled by 20 alt1.aspmx.l.google.com.
google.com mail is handled by 40 alt3.aspmx.l.google.com.
google.com mail is handled by 50 alt4.aspmx.l.google.com.
```

In order to restrict who can make recursive queries, we have to edit the `/etc/bind/named.conf.options` file and add the following lines:

```
acl goodguys { 10.9.107.151; 127.0.0.1; };

options {
[...]
        allow-recursion { goodguys; };
        recursion yes;
[...]
};
```

Now, if we query again for `google.com`, from the master VM the query should suceed and from the slave VM it should now fail.

```
[root@slave ~]# host google.com master
Using domain server:
Name: 10.9.107.151
Address: 10.9.107.151#53
Aliases:

Host google.com.cloud.grid.pub.ro not found: 5(REFUSED)
```

### Allow recursive queries from a specific host

Change the `/etc/bind/named.conf.options file` on the master VM to allow recursive queries from the other VM.


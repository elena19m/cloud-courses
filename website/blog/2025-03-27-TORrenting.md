---
title: TORrenting
description: TORrenting (Downloading torrents over TOR)
slug: torrenting
tags: [SOCcare, security, threat intelligence sharing]

hide_table_of_contents: false
---

import SOCcareLogo from './assets/soccare.png';
import gif from './assets/gekko-cantrefuse.gif';


When talking about cybersecurity, people often think about hacking systems or actively fighting hackers.
However, one of the most important (and often considered to be boring) activities of a cybersecurity expert is to monitor (and search) for IOCs (Indicators of Compromise).
These IOCs are, then, used to detect (and prevent) attacks against your infrastructure, services or users.

Usually, you monitor everything that can be monitored (kinda like a Big Brother): from your devices, services to the wild, wild Internet.
While your local network is accessible, monitoring the rest of the Internet might be a really tricky task.
One of the most challenging tasks is to monitor the [dark web](https://blog.talosintelligence.com/what-is-the-dark-web/) since it is usually only accessible via TOR.
This blog post presents some general aspects of how a cybersecurity analyst can use TOR to analyze artifacts that can only be found on the dark web.


<!-- truncate -->


While torrenting over TOR is not recommended due to putting strain on the TOR network, the Bittorrent protocol can work over it and there might be situations where you need to be able to torrent something through TOR (such as when the tracker is also hosted on TOR).

## Requirements


---

* a Linux machine (either a privacy focused distribution like Tails, a regular VM or a VPS)
* TOR
* a torrent client; this guide will use [Transmission](https://transmissionbt.com/).

## Setup


---

### Installing and enabling TOR

Install `tor` by following the [instructions listed here](https://community.torproject.org/onion-services/setup/install/).

#### Summary

Run the following commands as the root user.

**Ubuntu/Debian**

```bash
apt install -y apt-transport-https lsb-release
distribution="$(lsb-release -sc)"
echo "   deb     [signed-by=/usr/share/keyrings/deb.torproject.org-keyring.gpg] https://deb.torproject.org/torproject.org ${distribution} main
   deb-src [signed-by=/usr/share/keyrings/deb.torproject.org-keyring.gpg] https://deb.torproject.org/torproject.org ${distribution} main" | tee /etc/apt/sources.list.d/tor.list
wget -qO- https://deb.torproject.org/torproject.org/A3C4F0F979CAA22CDBA8F512EE8CBC9E886DDD89.asc | gpg --dearmor | tee /usr/share/keyrings/deb.torproject.org-keyring.gpg >/dev/null
apt update
apt install tor deb.torproject.org-keyring

systemctl enable --now tor
```

**Fedora** 

```bash
echo '[tor]
name=Tor for Fedora $releasever - $basearch
baseurl=https://rpm.torproject.org/fedora/$releasever/$basearch
enabled=1
gpgcheck=1
gpgkey=https://rpm.torproject.org/fedora/public_gpg.key
cost=100' > /etc/yum.repos.d/tor.repo
dnf install tor

systemctl enable --now tor
```

### Installing transmission

**Ubuntu/Debian**

```bash
apt install transmission-common transmission-daemon
```

**Fedora**

```bash
dnf install transmission-common transmission-daemon
```

## Downloading the torrent


---

### Configuring transmission

In order to use TOR both for resolving the hostname of the tracker and for tunnelling traffic, we need to edit the configuration file of `transmission-daemon` and set the `http_proxy` environment variable to `socks5h://127.0.0.1:9050`.

Run the command below and add the following line under the `[Service]` section: `Environment=http_proxy=socks5h://127.0.0.1:9050/`

```bash
systemctl edit --full transmission-daemon.service
```


:::warning
At the time of writing, there is a bug that stops the `transmission-daemon` from starting with the default configuration. When editing the service file with the command above also change `Type=notify` to `Type=simple` if you have issues starting the service.

You can [find more details about this issue here](https://askubuntu.com/questions/1527761/transmission-daemon-times-out-when-launched-by-systemd).

:::

Example of how the file should look now:

```ini
[Unit]
Description=Transmission BitTorrent Daemon
Wants=network-online.target
After=network-online.target

[Service]
User=debian-transmission
Type=simple
Environment=http_proxy=socks5h://127.0.0.1:9050/
ExecStart=/usr/bin/transmission-daemon -f --log-level=error
ExecReload=/bin/kill -s HUP $MAINPID
NoNewPrivileges=true
MemoryDenyWriteExecute=true
ProtectSystem=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

Reload the service file configuration, and start the service.

```bash
systemctl daemon-reload
systemctl enable --now transmission-daemon
```

### Downloading the torrent


:::warning
You might need to log out and log back in before you can add torrents.

:::

In order to download the torrent you need to use the `transmission-remote` command.

Some good documentation can be found [here](https://help.ubuntu.com/community/TransmissionHowTo).

In order to add a torrent file run use the following command:

```bash
transmission-remote -n 'transmission:transmission' -a /path/to/torrent/file.torrent
```

By default, you will find the downloads under `/var/lib/transmission/downloads`.

## SOCcare

The SOCcare project is co-funded by the European Union, alongside our collaborators,
NRD Cyber Security and RevelSI, and supported by the
European Cybersecurity Competence Centre (ECCC) Centre (ECCC) under Grant Agreement No. 101145843.
Views and opinions expressed are however those of the author(s) only and do not necessarily
reflect those of the European Union or the European Cybersecurity Competence Centre.
Neither the European Union nor the European Cybersecurity Competence Centre can be held responsible for them.

<img src={SOCcareLogo} width="600"/>

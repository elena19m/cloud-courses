---
title: Attackers are stealing your CPU
description: An analysis of two real-world cryptomining attacks captured by our honeypot infrastructure, covering XMRig and Dota/Outlaw malware
slug: attackers-are-stealing-your-cpu
tags: [SOCcare, security, threat intelligence sharing, cryptomining, xmrig, dota, outlaw-botnet]

hide_table_of_contents: false
---

import SOCcareLogo from './assets/soccare.png';

import XMRigOpensearch from './assets/attackers_are_stealing_your_cpu/xmrig/xmrig_opensearch.png';
import LookylooScript from './assets/attackers_are_stealing_your_cpu/xmrig/lookyloo_scripts.png';
import PandoraLinux from './assets/attackers_are_stealing_your_cpu/xmrig/pandora_linux.png';
import PandoraWindows from './assets/attackers_are_stealing_your_cpu/xmrig/pandora_windows.png';
import VTXMRig from './assets/attackers_are_stealing_your_cpu/xmrig/vt_xmrig.png';
import PandoraXMRig from './assets/attackers_are_stealing_your_cpu/xmrig/pandora_xmrig.png';
import PandoraObservables from './assets/attackers_are_stealing_your_cpu/xmrig/pandora_observables.png';

import DecodedPayload from './assets/attackers_are_stealing_your_cpu/dota/decoded_payload.png'
import PayloadExecuted from './assets/attackers_are_stealing_your_cpu/dota/payload_executed.png'
import ReconCommands from './assets/attackers_are_stealing_your_cpu/dota/recon_commands.png'
import SignatureOccurrence from './assets/attackers_are_stealing_your_cpu/dota/signature_occurrence.png'
import SSHKey from './assets/attackers_are_stealing_your_cpu/dota/ssh_key.png'

As SOC analysts, we've seen the usual noise - SSH brute-force attempts, bot scans, "forgotten" webshells hidden in `/tmp`,
or worse, in `wp-content/uploads`. But sometimes the damage is not ransomware, no data theft or any destruction at all.
Sometimes, attackers just want your CPU cycles.
<!-- truncate -->

In this write-up, we are looking into two cryptocurrency mining campaigns recovered from our honeypots - **XMRig** and **DOTA3/Outlaw**.
We'll walk you through how both miners were delivered and what artifacts were left behind.

## XMRig

Our honeypot infrastructure is based on [Cowrie](https://github.com/cowrie/cowrie) which is an SSH honeypot, hence the attack has started with a brute-force attempt. After "guessing" the correct password, the attacker gained root access on the system and started dropping threat intel for us.

The attacker downloaded scripts from an external domain: `hxxp[://]badintmine[.]onrender[.]com/setup[.]sh`.

<img src={XMRigOpensearch} width="600"/>

Investigating the domain on [Lookyloo reveals that there are two setup scripts](https://lookyloo.circl.lu/tree/117c25cb-be94-41df-84a8-68d4f7c95779/9dc3ae1d-45b5-4821-b11f-167a3482c5ba) - one for Linux machine and the other one for Windows.

<img src={LookylooScript} width="600"/>

Digging even further, we submitted the `setup.sh` script to Pandora to analyze its contents and to confirm if it’s malicious or not:

<img src={PandoraLinux} width="600"/>

Analyzing the script itself, we can see that it is downloading a new artefact from `hxxp[://]badintmine[.]onrender[.]com/xmrig` which is the actual cryptocurrency mining binary. The script then establishes persistence by creating a `systemd` service named `badint`, ensuring the miner automatically relaunches after a reboot. Additionally, the attacker wallet address is set and the system is connected to a remote mining pool `pool[.]hashvault[.]pro:443`.

The second script, `setup.bat`, is the Windows counterpart and it follows the same logic for Windows-based systems:

<img src={PandoraWindows} width="600"/>

Pandora automatically extracts observables or potential IOCs to continue the investigation or to ingest it as threat intelligence:

<img src={PandoraObservables} width="600"/>

A further Google search about the observables from the script is revealing that `HashVault` is a cryptocurrency mining pool commonly associated with Monero mining operations, while XMRig itself is a legitimate open-source mining software frequently used in cryptojacking campaigns.

This sample of `xmrig` is flagged as malicious by both Pandora and [VirusTotal](https://www.virustotal.com/gui/file/0c748b9e8bc6b5b4fe989df67655f3301d28ef81617b9cbe8e0f6a19d4f9b657):

<img src={PandoraXMRig} width="600"/>
<img src={VTXMRig} width="600"/>

## DOTA3/Outlaw

Firstly, the attacker injects an ssh key in the `.ssh/authorized_keys` allowing passwordless remote access for future logins. A specific indicator within the key itself is the comment `mdrfckr`, a signature leading to the [Outlaw/Dota cryptomining attack](https://securelist.com/outlaw-botnet/116444/).

<img src={SSHKey} width="600"/>

Querying our OpenSearch instances for both the `mdrfckr` indicator and its associated SSH key are appearing repeatedly from many IP addresses. In total, the attacker attempted to authenticate and establish persistence on the honeypot infrastructure more than 150 times.

<img src={SignatureOccurrence} width="600"/>

The next commands are basic reconnaissance, killing other competing miners or services and changing the root password with a random string.

<img src={ReconCommands} width="600"/>

The attacker executes a payload encoded in `base64`, likely as a simple obfuscation mechanism. After decoding the payload using CyberChef
, the script revealed functionality associated with the `dota3` malware:

<img src={DecodedPayload} width="600"/>

The decoded commands suggest attempts to (probably) move laterally to new machines using by scanning 192.168.0.0/16 and 172.16.0.0/16.
The `/tmp/up.txt` is a file containing `<username>:<password>` to brute force other machines in these subnets.

Unfortunately, this is just an assumption because the attacker did not manage to drop `dota3` or `kthreadadd` before ending the session.
Nevertheless, the IOCs gathered strongly align with previously documented behavior associated with the Outlaw/DOTA cryptomining botnet.

## Tools used

Throughout the investigation, we've used the following open-source tools or platforms to safely analyze the payloads:
- [Lookyloo](https://lookyloo.circl.lu/capture)
- [Pandora](https://pandora.circl.lu/submit)
- [VirusTotal](https://www.virustotal.com/gui/)
- [CyberChef](https://cyberchef.io/)

## Conclusions

Looking into these two cryptomining campaigns we've seen how they rely on simple techniques to compromise and monetize exposed systems.
Both the XMRig and Dota/Outlaw activity chains leveraged brute-forced SSH access, lightweight persistence mechanisms, and legitimate tools to quietly hijack computational resources for cryptocurrency mining.
While the XMRig campaign is more focused on deploying the scrips and start mining, the Dota/Outlaw counterpart showed a more  advanced behavior by attempting lateral movement across the internal subnets.

### SOCcare

The SOCcare project is co-funded by the European Union, alongside our collaborators,
NRD Cyber Security and RevelSI, and supported by the
European Cybersecurity Competence Centre (ECCC) Centre (ECCC) under Grant Agreement No. 101145843.
Views and opinions expressed are however those of the author(s) only and do not necessarily
reflect those of the European Union or the European Cybersecurity Competence Centre.
Neither the European Union nor the European Cybersecurity Competence Centre can be held responsible for them.

<img src={SOCcareLogo} width="600"/>

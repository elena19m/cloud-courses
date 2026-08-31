---
title: Hey, look, someone shared this with you
description: New trends in terms of phishing in Microsoft
slug: phishing-microsoft-device-authorization
tags: [SOCcare, security, threat intelligence sharing, phishing, device authorization]

hide_table_of_contents: false
---

import SOCcareLogo from './assets/soccare.png';

import CompromisedAccount from './assets/soccare-blogpost-august-2026.png';

It was a pretty chill summer. Everyone seemed to enjoy the holidays, even some of our nemesis,
the attackers. However, not everyone put work on hold: some of our users are still checking
their emails during vacation, some attackers are crafting new ways of phishing, and some SOC
analysts are eager to learn new things.


<!-- truncate -->

Without further ado, meet our three characters:
  - Carl - our naive researcher that works during holidays
  - Trudy - our restless attacker
  - Doof - our eager to learn SOC analyst

While Doof was searching through the world wide web for interesting news about security matters,
they stumbled across this one: [https://home.cern/computer-security-one-click-to-many/]().

Oh, no, no, no, no! That’s basically one easy trick to gain access to an institutional account.
That’s not gonna happen in our institution, right? Right? We have 2FA enabled, through our own SSO, Keycloak.
Wait, but so does CERN. And this kind of attack bypasses the 2FA… Ehh, darn it.

Well, let’s check. If we have this kind of insight it would be a shame (and a really bad practice)
to not check if our accounts were compromised. So Doof started to fight with Microsoft’s
inconsistent ways of keeping the logs… and security events.

Aaaand, here it is. After navigating through the maze of logs and services,
Doof found something: a user that received the following notification and used device authorization.

<img src={CompromisedAccount} width="600"/>

One single user (that we have logs for), Carl, was indeed infected. After cross-checking logs,
Doof realised that Trudy did only some reconnaissance queries. Nothing interesting.
Carl had all their active sessions revoked and that’s it. Case solved. For now, at least.

In the above shown image, the email addresses and real names were redacted.
While the initiator was, indeed, a malicious actor (and the flow did not make sense,
i.e., no need to use device authorization for that kind of operation - one to one to
what CERN’s blog post described), the account seemed to be related to an Italian public body.
That means that the account was likely compromised and used only as a pivot to infect other accounts.

## Tools used

Throughout the investigation, we've used the following platforms:
- [Microsoft Entra](https://learn.microsoft.com/en-us/entra/identity/monitoring-health/overview-monitoring-health)
- [Microsoft Purview](https://www.microsoft.com/en-us/security/business/microsoft-purview)
- [VirusTotal](https://www.virustotal.com/gui/)

## Conclusions

Remember: always double check the email (sender, subject, language) and the links before clicking them.
If something looks fishy, there is a high chance it is a phish.

### SOCcare

The SOCcare project is co-funded by the European Union, alongside our collaborators,
NRD Cyber Security and RevelSI, and supported by the
European Cybersecurity Competence Centre (ECCC) Centre (ECCC) under Grant Agreement No. 101145843.
Views and opinions expressed are however those of the author(s) only and do not necessarily
reflect those of the European Union or the European Cybersecurity Competence Centre.
Neither the European Union nor the European Cybersecurity Competence Centre can be held responsible for them.

<img src={SOCcareLogo} width="600"/>

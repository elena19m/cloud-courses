---
title: WordPress attack, this time with more IoCs
description: Investigations on a compromised WordPress instance
slug: wordpress-adware
tags: [SOCcare, security, threat intelligence sharing, WordPress, adware, obfuscated PHP code]

hide_table_of_contents: false
---

import SOCcareLogo from './assets/soccare.png';
import OpenSearchDashboard from './assets/wordpress-xmrpc.png';

Yup, that’s us. Probably you are wondering how we ended up with another WordPress instance to analyze (and another WordPress-related blog post). WordPress seems to be heaven for attackers: many plugins, many themes, many things that can be attacked.


<!-- truncate -->

[Wordfence]( https://www.wordfence.com/threat-intel/) has really nice dashboards
you can check out and see what’s the trend in terms of WordPress
vulnerabilities. Usually, the vulnerabilities are split into three categories:
[WordPress core](
https://www.wordfence.com/threat-intel/vulnerabilities/wordpress-core) (less
than a dozen per year), [WordPress
plugins](https://www.wordfence.com/threat-intel/vulnerabilities/wordpress-plugins)
and [WordPress themes](
https://www.wordfence.com/threat-intel/vulnerabilities/wordpress-themes/). Only
in the [first month of 2026](
https://www.wordfence.com/threat-intel/vulnerabilities/search?search=&cwe_type=-&cvss_rating=-&date_month=1&date_year=2026)
there were more than 900 new WordPress related CVEs, of which around 30 are
marked as CRITICAL.

Yet, besides all these vulnerabilities, one of the biggest issues is user’s leaked credentials. You can have the most wonderful, updated
and secure WordPress instance, but one tiny simple user (or worse, admin)
password can tear down the whole castle.

Now, let’s go back to our investigation.
It’s a not-so-long story that goes way back to last summer. Bear
with me, we’ll get to the juicy stuff in a bit.

The signs were there: a vulnerability assessment done in November 2025 revealed that the site seems to
have been compromised since July 2025. Following the procedures, we announced
the site administrators and asked them to remediate their website. Since the
website is not in our administration, the procedure is to allow the site admins
some time to clean up their infrastructure.  We hoped for the best (and did not
expect the worst).

Things went south in December 2025 when we observed a high
amount of traffic generated for a particular website, many of them looking very
similar: POST requests to `xmlrpc.php`. Excluding the `xmlrpc.php` ones, the
rest were either generic bots scans (that were inoffensive) or weird-looking
paths (a chain of many directories) that generated a `200` HTTP response.

So, with hot chocolate mugs to warm our souls and jingle bells in the background in
an enchanting Christmas scenery, we started to dig deeper into this website (the
IR teams don't take a break during … the winter break, right?).

About that, let’s break down our investigation and our findings in 5 small sections

## 1.  `xmlrcp.php` was used for exploitation to add malicious files and users

In the specific dates with malware traces, there were a lot of requests made to
`xmlrpc.php`, from IP addresses mostly originated from Singapore (more than 50%,
as seen in the picture below), from 2 IPs (`172[.]104[.]171[.]15` and
`146[.]190[.]96[.]250`) and US, mainly another 2 IPs (`138[.]197[.]31[.]38`,
`159[.]203[.]135[.]193`). This makes up almost all the traffic seen in the last
90 days to `xmlprc.php`, about 70.000 requests. Almost all requests (99.92%) got
a `200` response, and even though it doesn’t specifically mean all were doing
something nasty, the calls to xmlrpc are likely how the malicious files/users
got into the system.


<img src={OpenSearchDashboard} />

## 2. Remote execution files

Some obfuscated php files (that attempt remote code execution) were dropped on
the website, likely using some of the xmlrpc requests mentioned above. The files
are placed in the `well-known` directory (under a very long path of
directories), and contain small snippets of PHP code, followed by binary data.
By decoding the PHP code we determined that it was used to decode the rest of
the data. We can decode the data ourselves using the following code:

```bash
$code = file_get_contents("infected.php");
$payload = substr($code, -13687);
$payload = str_replace(["nuyxmaflij","voawzxubmi"], ["<",">"], $payload);
echo gzuncompress($payload);
```

This gives us another obfuscated file, following the same pattern: PHP code that
does `base64_decode(rot13(the rest of the file))`. After decoding that, we have
the initialization of an array with random bytes, then some more complex
decoding, followed by `eval(eval(eval(...(decoded payload)))))`.

This is clearly some sort of remote code execution, and likely how the rest of the
attack happened.

## 3. Symbolic links for attempted data exposure

Along with the RCE files, also in the `well-known` directory, there are a lot of
symbolic links to files outside the hosting sandbox. The targeted files are
mainly `.env` files, configuration files, etc.

```bash
9-WordPress-web.txt -> /var/mail/web/wp-config.php
```

There were almost 37,000 links present, trying to link to files in `/bin`,
`/usr`, `/var`, etc.  There were no successful requests made to these files in
the last 90 days of the investigation.

## 4. Adding a new admin user

Upon inspecting the database, we noticed that a new admin user was created. This
is particularly weird because the timestamp and the password hash are not using
the WordPress hashing format, so there is no way this user was created
legitimately via the WordPress API. Most likely, it was added via a direct SQL
call using the PHP RCE above.  There are no registered logins for the user in
the `wp_login` table, but since the attackers had access to the database, they
could have very easily cleaned their traces.

## 5. Injected adware in all the php files served to the user

Inside almost all PHP files, there was a `<script>` part injected at the end of
the file which contained obfuscated JavaScript code. The script was also
injected in `.js` files that were included by the php files, so likely all the
relevant pages were infected.

The JavaScript code was obfuscated using
[https://obfuscator.io/](https://obfuscator.io/) , so it was easy to deobfuscate
using [https://obf-io.deobfuscate.io](https://obf-io.deobfuscate.io/) .

The code first checked `navigator.userAgent`, `navigator.vendor`, and `window.opera` to see if it was
running on a mobile phone. If it was, it hijacked user clicks using
`document.addEventListener("click", handler)`; and every 2 minutes, at a click,
it opened one of 10 hardcoded `shorturl` links
 ```bash
const _0xe6f43 = ["hXXps://urshort[.]com/BEZ0c70",
            "hXXps://urshort[.]com/PSQ1c21",
            "hXXps://urshort[.]com/VxY2c02",
            "hXXps://urshort[.]com/MtN3c13",
            "hXXps://urshort[.]com/GEh4c14",
            "hXXps://urshort[.]com/HSf5c55",
            "hXXps://urshort[.]com/JRp6c56",
            "hXXps://urshort[.]com/sFh7c87",
            "hXXps://urshort[.]com/pHm8c98",
            "hXXps://urshort[.]com/GAv9c59"];
```

None of the urls are still active, but this looks like an adware.


## Conclusions

The moral of the story? The website was blocked. Even though the analysis showed
that the URLs were not active, that does not mean everything is alright.

Pretty, pretty please, [keep your WordPress instance updated, safe and secure](
https://wordpress.com/support/security/). Or how the song says: call us when
they break your website next summer, we will be waiting here.


### SOCcare

The SOCcare project is co-funded by the European Union, alongside our collaborators,
NRD Cyber Security and RevelSI, and supported by the
European Cybersecurity Competence Centre (ECCC) Centre (ECCC) under Grant Agreement No. 101145843.
Views and opinions expressed are however those of the author(s) only and do not necessarily
reflect those of the European Union or the European Cybersecurity Competence Centre.
Neither the European Union nor the European Cybersecurity Competence Centre can be held responsible for them.

<img src={SOCcareLogo} width="600"/>

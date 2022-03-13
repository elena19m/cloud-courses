![Schema](./assets/dns_spoofing_light.svg#light)![Connect](./assets/dns_spoofing_dark.svg#dark)

DNS Spoofing is an attack that relies on sending modified DNS responses to the victim.
When the victim tries to access a domain `example.com`,
the attacker will respond that `example.com` has an IP controlled by the attacker.

A possible scenario that uses DNS Spoofing in the vector attack is presented in the image above.
The attacker is a malicious host in the same network as the victim (a coffee shop with free public WiFi).
Using ARP Cache Poisoning, the attacker listen to all the traffic between the victim and the local router (acts like a MitM).
When the victim wants to access a well-known domain (e.g. a social network page), the solver will check locally for caches.
If the caches are expired, they will send a DNS server request. The attacker will intercept the traffic and will
respond that the social network has a particular IP address.
Using that IP, the victim will connect to a page that resembles the social network one.
Thus, the attacker can steal the victim's credentials.

A method of mitigating this kind of attack is to set up DNSSEC.
DNSSEC signs the DNS responses, and the victim's local server will reject the
attacker's mangled package.

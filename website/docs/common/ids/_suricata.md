## Installation and configuration


### Lab Topology

![Topology](./assets/topology-light.svg#light)![Topology](./assets/topology-dark.svg#dark) <!-- .element height="200%" width="200%" -->

As presented in the scheme above, our architecture is the following:
  * the base virtual machine with two interfaces: `eth0` is connected to the
  OpenStack network (which is the External Network), while `virbr-labs` is the
  bridge that connects the virtual machines (which is our Internal Network);
  * three virtual machines that are connected to the `virbr-labs` bridge
  interface: VM1 is a Debian webserver, VM2 and VM3 are CentOS systems;

Using virtual machines, the topology presented above simulates a small network.
The traffic we want to monitor is the one that flows through the `virbr-labs`
network adapter. Thus, we will install Suricata in the base virtual machine
and will configure it to inspect the traffic that flows through `virbr-labs`.
We will consider our internal network `192.168.100.0/24`.

### Install Suricata

Install Suricata on the host virtual machine:

```bash
student@base-lab-ids:~$ sudo apt update
student@base-lab-ids:~$ sudo add-apt-repository ppa:oisf/suricata-stable
Suricata IDS/IPS/NSM stable packages
https://suricata.io/
https://oisf.net/
[...[
Press [ENTER] to continue or Ctrl-c to cancel adding it.
[...]
student@base-lab-ids:~$ sudo apt update
student@base-lab-ids:~$ sudo apt install suricata
```

Edit `/etc/suricata/suricata.yaml` and set up `HOME_NET` and `EXTERNAL_NET`
variables. Usually, `HOME_NET` contains the IP addresses that you
consider to be your internal network. If you want to add multiple IP addresses
or networks, you can use the list format. In contrast, `EXTERNAL_NET` is,
usually, everything that your internal network is not (hence the `!` (not)
marker).

```
[...]
HOME_NET: "[192.168.100.0/24]"
EXTERNAL_NET: "!$HOME_NET"
[...]
```

:::warning
For some of the attacks later in the lab we will use an IP in the `10.9.0.0/16`
network as the source IP. For the detection to work properly, make sure that
only the `192.168.100.0/24` is part of the `HOME_NET`.
:::

We need to specify the interface we want Suricata to monitor. Edit the
`/etc/suricata/suricata.yaml` file and setup `af-packet` -> `interface` and
`pcap` -> `interface` to `virbr-labs` and restart Suricata.

```bash
student@base-lab-ids:~$ sudo grep -A 2 -B 2 "virbr-labs" /etc/suricata/suricata.yaml
# Linux high speed capture support
af-packet:
  - interface: virbr-labs
    # Number of receive threads. "auto" uses the number of cores
    #threads: auto
--
# Cross platform libpcap capture support
pcap:
  - interface: virbr-labs
    # On Linux, pcap will try to use mmap'ed capture and will use "buffer-size"
    # as total memory used by the ring. So set this to something bigger
student@base-lab-ids:~$ sudo systemctl restart suricata
```

### Rules in Suricata

![Rules](./assets/suricata-alert.png#light)![Rules](./assets/suricata-alert.png#dark)

A Suricata rule has three components:
  - **Action** - specifies how the traffic that matches that rule should be
    treated. The four most used actions are:
    - **alert** - the traffic is considered to be malicious, it generates an
      alert that is logged in the `eve.json` and `fast.json` files. However, the
      packet will pass;
    - **pass** - the packet that matches this rule will not be further inspected
      and is allowed in the network;
    - **drop** - the traffic that matches this rule will be dropped. In this
      case, neither the source, not the destination are notified that the
      packet was dropped;
    - **reject** - same as **drop** with the difference that both source and
      destination will receive a notification that says that the packet is
      rejected.
  - **Header** - specifies the following information:
    - **Protocol** - can be either a generic one (such as TCP or UDP) or
      a specific one such as HTTP, DNS, FTP, SSH and so on. For each
      protocol, there are specific keywords that can be used in the packet's
      signature (see `Options` part);
    - **Source IP and port**;
    - **Destination** - which can only be either from source to destination
      (represented by `->`) or bidirectional (represented by `<>`). You cannot
      set rules from destination to source (which would be represented by `<-`);
    - **Destination IP and port**.
  - **Option** - specifies what the packet's state description should be so
    the rule should be triggered. It starts with `(`, continues with a list of
    keywords that are delimited by `;` and ends with `)`. A keyword is an entry
    in the `key:value(s)` format.

More information on the rule format and the keywords that can be used can be
found in the Suricata documentation:
  - [Suricata Rules](https://suricata.readthedocs.io/en/suricata-6.0.0/rules/index.html)
  - [Action Order](https://suricata.readthedocs.io/en/suricata-6.0.0/configuration/suricata-yaml.html#action-order)


### Download the default ruleset

You can manually download and add signatures for Suricata. However, the
recommended way of installing rulesets using the `suricata-update` tool.
On your host virtual machine, run the following command:

```bash
student@base-lab-ids:~$ sudo suricata-update
```

:::note
Ignore the warnings that are displayed by `suricata-update`.
:::

Check the `/var/lib/suricata/rules/suricata.rules` file. Here are all the
installed rules. Do not manually edit the `suricata.rules` file. It is intended
to be modified only by `suricata-update`. If you want to enable/disable a
certain rule, use the `/etc/suricata/{enable,disable}.conf` files. If you want
to add your own rules, see the [Custom rules](#custom_rules) section.

The log files you will be usually working are:
  * `/var/log/suricata/fast.log` - presents a summarised report of the attacks;
  * `/var/log/suricat/eve.json` - contains information regarding the
  network packets that flow through the network.

You can customize the output format using the `suricata.yaml` file. In this
lab, we will work with the default settings.

:::note
After installing, you will not be able to see any output in `fast.log` since
there are no alerts, yet. An example output can be seen below:

```bash
student@base-lab-ids:~$ tail -n 5 /var/log/suricata/fast.log
05/14/2022-21:00:11.560255  [**] [1:2029994:1] ET HUNTING Suspicious NULL DNS Request [**] [Classification: Misc activity] [Priority: 3] {UDP} 192.168.100.82:52694 -> 192.168.100.254:53
05/14/2022-21:00:11.562117  [**] [1:2030555:1] ET INFO Outbound RRSIG DNS Query Observed [**] [Classification: Potentially Bad Traffic] [Priority: 2] {UDP} 192.168.100.254:53 -> 192.168.100.82:52694
05/14/2022-21:00:14.798014  [**] [1:2030555:1] ET INFO Outbound RRSIG DNS Query Observed [**] [Classification: Potentially Bad Traffic] [Priority: 2] {UDP} 192.168.100.254:53 -> 192.168.100.83:51450
05/14/2022-21:00:14.805496  [**] [1:2029994:1] ET HUNTING Suspicious NULL DNS Request [**] [Classification: Misc activity] [Priority: 3] {UDP} 192.168.100.83:42122 -> 192.168.100.254:53
05/14/2022-21:00:14.807949  [**] [1:2030555:1] ET INFO Outbound RRSIG DNS Query Observed [**] [Classification: Potentially Bad Traffic] [Priority: 2] {UDP} 192.168.100.254:53 -> 192.168.100.83:42122
```
:::

There is a specific rule in Suricata we can use to check if the Intrusion
Detection System (IDS) works properly. From VM2, run the following command and
check the `fast.log` and `eve.json` files.

```bash
[student@lab-ids-2 ~]$ curl http://testmynids.org/uid/index.html
[...]
student@base-lab-ids:~$ tail -n 1 /var/log/suricata/fast.log
05/15/2022-04:27:23.348138  [**] [1:2100498:7] GPL ATTACK_RESPONSE id check returned root [**] [Classification: Potentially Bad Traffic] [Priority: 2] {TCP} 18.66.2.80:80 -> 192.168.100.82:38412
student@base-lab-ids:~$ grep '"event_type":"alert"' /var/log/suricata/eve.json | tail -n 1
{"timestamp":"2022-05-15T04:27:23.348138+0000","flow_id":300241855909474,"in_iface":"virbr-labs","event_type":"alert","src_ip":"18.66.2.80","src_port":80,"dest_ip":"192.168.100.82" [...]
```

:::info
If you do not see any traffic in the `fast.log` file, check that the
`virbr-labs` interface is properly set for both `af-packet` and `pcap` sections
and restart Suricata. Wait a couple of minutes after restarting Suricata before
reattempting the test.

You can check whether Suricata has finished loading the rules by inspecting the
`/var/log/suricata/suricata.log` file.
:::


### Download third-party rulesets

You can download additional rulesets using the `suricata-update` tool.

First, let's see all the available rulesets:
```
student@base-lab-ids:~$ sudo suricata-update list-sources
[...]
Name: et/open
  Vendor: Proofpoint
  Summary: Emerging Threats Open Ruleset
  License: MIT
Name: et/pro
  Vendor: Proofpoint
  Summary: Emerging Threats Pro Ruleset
  License: Commercial
  Replaces: et/open
  Parameters: secret-code
  Subscription: https://www.proofpoint.com/us/threat-insight/et-pro-ruleset
Name: oisf/trafficid
  Vendor: OISF
  Summary: Suricata Traffic ID ruleset
  License: MIT
Name: scwx/enhanced
  Vendor: Secureworks
  Summary: Secureworks suricata-enhanced ruleset
  License: Commercial
  Parameters: secret-code
  Subscription: https://www.secureworks.com/contact/ (Please reference CTU Countermeasures)
Name: scwx/malware
  Vendor: Secureworks
  Summary: Secureworks suricata-malware ruleset
  License: Commercial
  Parameters: secret-code
  Subscription: https://www.secureworks.com/contact/ (Please reference CTU Countermeasures)
[...]
```

Some of the rulesets require a subscription (see the entries with the
`Subscription` field set), while others do not. We will use one that does not
require a subscription, the OISF (Open Information Security Foundation) Traffic
ID ruleset.

```
student@base-lab-ids:~$ sudo suricata-update enable-source oisf/trafficid
6/5/2022 -- 08:35:59 - <Info> -- Using data-directory /var/lib/suricata.
6/5/2022 -- 08:35:59 - <Info> -- Using Suricata configuration /etc/suricata/suricata.yaml
6/5/2022 -- 08:35:59 - <Info> -- Using /etc/suricata/rules for Suricata provided rules.
6/5/2022 -- 08:35:59 - <Info> -- Found Suricata version 6.0.5 at /usr/bin/suricata.
6/5/2022 -- 08:35:59 - <Info> -- Creating directory /var/lib/suricata/update/sources
6/5/2022 -- 08:35:59 - <Info> -- Enabling default source et/open
6/5/2022 -- 08:35:59 - <Info> -- Source oisf/trafficid enabled
```

We must run `suricata-update` to fetch and use the rules from the ruleset:

```bash
student@base-lab-ids:~$ sudo suricata-update
```

`suricata-update` will merge all rules from the enabled rulesets in a single
file: `/var/lib/suricata/rules/suricata.rules`. Check the last lines from the
`/var/lib/suricata/rules/suricata.rules` and, based on them, generate an alert.

From VM2 try to access `twitter.com` using the following command:

```bash
[student@lab-ids-2 ~]$ curl twitter.com
```

Check the logs from the `eve.log` and `fast.log` files:

```bash
student@base-lab-ids:~$ grep '"event_type":"alert"' /var/log/suricata/eve.json | grep twitter
{"timestamp":"2022-05-06T08:44:48.476995+0000","flow_id":404555317665412,"in_iface":"virbr-labs","event_type":"alert","src_ip":"192.168.100.82","src_port":56648,"dest_ip":"104.244.42.193","dest_port":80,"proto":"TCP","tx_id":0,"alert":{"action":"allowed","gid":1,"signature_id":2013028,"rev":6,"signature":"ET POLICY curl User-Agent Outbound","category":"Attempted Information Leak","severity":2,"metadata":{"created_at":["2011_06_14"],"updated_at":["2021_12_01"]}},"http":{"hostname":"twitter.com","url":"/","http_user_agent":"curl/7.61.1","http_method":"GET","protocol":"HTTP/1.1","status":301,"redirect":"https://twitter.com/","length":0},"app_proto":"http","flow":{"pkts_toserver":4,"pkts_toclient":3,"bytes_toserver":347,"bytes_toclient":496,"start":"2022-05-06T08:44:48.286340+0000"}}
student@base-lab-ids:~$ tail -n 1 /var/log/suricata/fast.log
05/06/2022-08:44:48.476995  [**] [1:2013028:6] ET POLICY curl User-Agent Outbound [**] [Classification: Attempted Information Leak] [Priority: 2] {TCP} 192.168.100.82:56648 -> 104.244.42.193:80
```

:::info
To disable a ruleset, you can use `suricata-update disable-source
<source_name>`. Do not forget to run `suricata-update` to update the current
ruleset. However, we **will not** disable the ruleset for the remainder of the
lab.
:::


### Port Scanning detection

Scan the network using `nmap` and `SYN Scan` as a port scanning technique
(`-sS`):

```
student@base-lab-ids:~$ sudo apt install -y nmap
student@base-lab-ids:~$ sudo nmap -Pn -sS -T3 192.168.100.0/24
student@base-lab-ids:~$ grep '"dest_ip":"192.168.100.83"' /var/log/suricata/eve.json | grep '"event_type":"alert"'
```

Why there are no logged alerts (related to scanning)?

<details>
<summary>Explanation</summary>

The rules verify the traffic that comes from the external network
(i.e. `EXTERNAL_NET any -> HOME_NET`). Since the base VM (from where we run
`nmap`) has an interface in the same network as the `HOME_NET`, the packets will
have it as source. If you inspect the traffic, you can see that the
source IP is `192.168.100.254` which is the virtual machines' gateway and the IP
of the `virbr-labs` bridge interface.

</details>

You can simulate an external scanning using the following command (update the
source IP given using `-S` to be your virtual machine's IP in the vlan9
network):

```bash
student@base-lab-ids:~$ sudo nmap -e virbr-labs -S 10.9.X.Y -sS -T3 192.168.100.0/24
student@base-lab-ids:~$ grep '"dest_ip":"192.168.100.83"' /var/log/suricata/eve.json | grep '"event_type":"alert"'
student@base-lab-ids:~$ grep "192.168.100.83" /var/log/suricata/fast.log
```

:::note
Sometimes, `nmap` may crash with the following error:

```
nmap: Target.cc:503: void Target::stopTimeOutClock(const timeval*): Assertion `htn.toclock_running == true' failed.
```

Ignore it and try again.
:::

Run an XMAS Scan (`-sX`) and check the logs from both types of scans presented above.
Why are there no logged entries related to this type of scanning?

:::info
If you have multiple alerts, check the date when you ran the attack and compare
it to the one that is logged.
:::

Modify `/var/lib/suricata/rules/suricata.rules` so the scan will be caught.

:::tip
Search for rules with `XMAS` in their name. Not all the `XMAS` rules may work,
so find the one that works.
:::

To enable a rule from the ruleset (the ones that appear to be commented in the
`suricata.rules` file), you must edit the `/etc/suricata/enable.conf` file:

```
student@base-lab-ids ~$ sudo cat /etc/suricata/enable.conf
<sid> # the sid (Signature ID) of the rule you want to enable.
student@base-lab-ids ~$ sudo suricata-update
[...]
8/5/2022 -- 18:02:31 - <Info> -- Writing rules to /var/lib/suricata/rules/suricata.rules: total: 33416; enabled: 25989; added: 0; removed 0; modified: 1
[...]
student@base-lab-ids ~$ sudo systemctl restart suricata
```

Enable the desired rule and recheck XMAS scanning.

:::tip
You can disable a rule by adding its `sid` in the `/etc/suricata/disable.conf`
file. Then, you must run `suricata-update` to reload the rules and then restart
the `suricata` service.

As an example, you may see a lot of alerts for Ubuntu package updates, which are
not usually dangerous, but make it difficult to see the real alerts. You can
find the rule that triggers that alert by checking the `"signature_id"` field of
a log line.
```
student@base-lab-ids:~$ sudo cat /etc/suricata/disable.conf
2013504
student@base-lab-ids:~$ sudo suricata-update
[...]
student@base-lab-ids:~$ sudo systemctl restart suricata
```
:::


### Custom rules

As you can see, you can catch only the XMAS Scanning that comes from the
external network. However, we want to check whether someone from the internal
network starts a scan. To do this, we will duplicate the rule we have been using
to detect the XMAS attack and modify the source of the attack.

:::note
This is a Proof-of-Concept usage. In reality, you will edit your `suricata.yaml`
file and add better definitions for your internal and external networks.
:::

We cannot directly modify the `/var/lib/suricata/rules/suricata.rules` file
since our updates will be automatically removed when running `suricata-update`.
However, we can add our custom ruleset.

Copy the rule you have used to detect the XMAS port scanning in the
`/var/lib/suricata/rules/custom.rules`. Make sure to change the `sid` to
something that does not exist.

```bash
student@base-lab-ids:~$ sudo cat /var/lib/suricata/rules/custom.rules
alert tcp $HOME_NET any -> $HOME_NET any (msg:"GPL SCAN nmap XMAS - my updated rule"; flow:stateless; flags:FPU,12; reference:arachnids,30; classtype:attempted-recon; sid:900000001; rev:8; metadata:created_at 2010_09_23, updated_at 2022_05_07;)
```

Modify the `/etc/suricata/suricata.yaml` file to look like this (add
`custom.rules` as a source of rules Suricata must take into consideration):

```bash
student@base-lab-ids:~$ sudo grep "custom.rules" -B 4 -A 2 /etc/suricata/suricata.yaml
default-rule-path: /var/lib/suricata/rules

rule-files:
  - suricata.rules
  - custom.rules

##
```

Check if the rules are taken into account:

```bash
student@base-lab-ids:~$ sudo suricata -c /etc/suricata/suricata.yaml --dump-config | grep rules
outputs.5.pcap-log.honor-pass-rules = no
app-layer.protocols.http2.http1-rules = no
engine-analysis.rules-fast-pattern = yes
engine-analysis.rules = yes
detect.profiling.grouping.include-rules = false
profiling.rules = (null)
profiling.rules.enabled = yes
profiling.rules.filename = rule_perf.log
profiling.rules.append = yes
profiling.rules.limit = 10
profiling.rules.json = yes
default-rule-path = /var/lib/suricata/rules
rule-files.0 = suricata.rules
rule-files.1 = custom.rules

```

Rerun `suricata-update` and restart `suricata`:

```bash
student@base-lab-ids:~$ sudo suricata-update
student@base-lab-ids:~$ sudo systemctl restart suricata
```

Rerun the scanning and check the logs:

```bash
student@base-lab-ids:~$ sudo nmap -sX -T3 192.168.100.0/24
Starting Nmap 7.80 ( https://nmap.org ) at 2022-05-08 18:30 UTC
student@base-lab-ids:~$ grep \"event_type\"\:\"alert\" /var/log/suricata/eve.json | tail
{"timestamp":"2022-05-08T18:30:48.297487+0000","flow_id":2205646302251535,"in_iface":"virbr-labs","event_type":"alert","src_ip":"192.168.100.254","src_port":51961,"dest_ip":"192.168.100.82","dest_port":2382,"proto":"TCP","alert":{"action":"allowed","gid":1,"signature_id":2201228,"rev":8,"signature":"GPL SCAN nmap XMAS - my updated rule","category":"Attempted Information Leak","severity":2,"metadata":{"created_at":["2010_09_23"],"updated_at":["2022_05_07"]}},"flow":{"pkts_toserver":1,"pkts_toclient":0,"bytes_toserver":54,"bytes_toclient":0,"start":"2022-05-08T18:30:48.297487+0000"}}
[...]
student@base-lab-ids:~$ tail -f /var/log/suricata/fast.log
05/08/2022-18:30:48.297487  [**] [1:2201228:8] GPL SCAN nmap XMAS - my updated rule [**] [Classification: Attempted Information Leak] [Priority: 2] {TCP} 192.168.100.254:51961 -> 192.168.100.82:2382
05/08/2022-18:30:48.299612  [**] [1:2201228:8] GPL SCAN nmap XMAS - my updated rule [**] [Classification: Attempted Information Leak] [Priority: 2] {TCP} 192.168.100.254:51960 -> 192.168.100.82:6779
05/08/2022-18:30:48.301727  [**] [1:2201228:8] GPL SCAN nmap XMAS - my updated rule [**] [Classification: Attempted Information Leak] [Priority: 2] {TCP} 192.168.100.254:51961 -> 192.168.100.82:5810
```

### Alert requests to a site

Add a custom rule that will alert when someone tries to access a certain site.
You can choose which one you like (e.g. `facebook.com`, `netflix.com`).

:::tip
You can copy one of the rules with `SURICATA TRAFFIC-ID` to the custom rules and
remove the `noalert` parameter. After reloading the rule set and restarting
Suricata, you will have to wait a couple of minutes before testing. If the rule
works, more than one rule (i.e. the one containing `curl User-Agent Outbound`)
should be displayed.
:::


## Use Suricata as an Intrusion Prevention System (IPS)

By default, Suricata runs in the IDS mode. We will configure it to run in the
IPS mode.

Since an IPS must be able to drop/reject packets, it needs to be configured with
some protocol that can manage the packet flow:
  * Using `iptables` and
  [NFQUEUE](https://home.regit.org/netfilter-en/using-nfqueue-and-libnetfilter_queue/)
  * Using `AF_PACKET` mode that copies packets from one interface on another.

Check the [Suricata Docs](https://suricata.readthedocs.io/en/suricata-6.0.0/setting-up-ipsinline-for-linux.html)
for more information regarding the two modes.

### Configuration

Based on our network topology, the best method we can choose is the second one:
we will transfer all the traffic that comes from `eth0` to `virbr-labs` and
vice-versa.

Modify the `/etc/suricata/suricata.yaml` file to have the following
configuration in the `af-packet` section:

```bash
student@base-lab-ids:~$ sudo grep "af-packet" -A 85 /etc/suricata/suricata.yaml
af-packet:
  - interface: virbr-labs
    # Number of receive threads. "auto" uses the number of cores
    threads: 1
    # Default clusterid. AF_PACKET will load balance packets based on flow.
    cluster-id: 99
    [...]
    cluster-type: cluster_flow
    [...]
    defrag: no
    # To use the ring feature of AF_PACKET, set 'use-mmap' to yes
    use-mmap: yes
    [...]
    buffer-size: 32768
    [...]
    copy-mode: ips
    copy-iface: eth0
  - interface: eth0
    threads: 1
    defrag: no
    cluster-type: cluster_flow
    cluster-id: 98
    copy-mode: ips
    copy-iface: virbr-labs
    buffer-size: 32768
    use-mmap: yes

  # Put default values here. These will be used for an interface that is not
  # in the list above.
  - interface: default
    #threads: auto
    #use-mmap: no
```

Reload the rules and restart Suricata.

### Drop requests

Modify the rule you have added in the `/var/lib/suricata/rules/custom.rules` to
drop the packets that are part of the XMAS Scan, reload the rules and restart
Suricata. Make sure to also increase the `rev` (revision) parameter.

:::tip
It may take a while until the rules are updated, so if the following test does
not succeed, wait a couple of minutes before running it again. If it still does
not work, start debugging.

You can also inspect the `/var/log/suricata/suricata.log` file and wait for
all the rule files to be successfully loaded:
```
student@base-lab-ids:~$ tail -f /var/log/suricata/suricata.log
15/5/2022 -- 06:46:36 - <Config> - Loading rule file: /var/lib/suricata/rules/suricata.rules
15/5/2022 -- 06:46:45 - <Config> - Loading rule file: /var/lib/suricata/rules/custom.rules
15/5/2022 -- 06:46:45 - <Info> - 2 rule files processed. 26073 rules successfully loaded, 0 rules failed
15/5/2022 -- 06:46:45 - <Info> - Threshold config parsed: 0 rule(s) found
15/5/2022 -- 06:46:46 - <Perf> - using shared mpm ctx' for tcp-packet
15/5/2022 -- 06:46:46 - <Perf> - using shared mpm ctx' for tcp-stream
15/5/2022 -- 06:46:46 - <Perf> - using shared mpm ctx' for udp-packet
15/5/2022 -- 06:46:46 - <Perf> - using shared mpm ctx' for other-ip
15/5/2022 -- 06:46:46 - <Info> - 26076 signatures processed. 1281 are IP-only rules, 4133 are inspecting packet payload, 20454 inspect application layer, 108 are decoder event only
15/5/2022 -- 06:46:46 - <Config> - building signature grouping structure, stage 1: preprocessing rules... complete
15/5/2022 -- 06:46:46 - <Perf> - TCP toserver: 41 port groups, 40 unique SGH's, 1 copies
15/5/2022 -- 06:46:46 - <Perf> - TCP toclient: 21 port groups, 21 unique SGH's, 0 copies
15/5/2022 -- 06:46:46 - <Perf> - UDP toserver: 41 port groups, 38 unique SGH's, 3 copies
15/5/2022 -- 06:46:46 - <Perf> - UDP toclient: 21 port groups, 17 unique SGH's, 4 copies
15/5/2022 -- 06:46:46 - <Perf> - OTHER toserver: 254 proto groups, 3 unique SGH's, 251 copies
15/5/2022 -- 06:46:46 - <Perf> - OTHER toclient: 254 proto groups, 0 unique SGH's, 254 copies
```
:::

```bash
student@base-lab-ids:~$ sudo nmap -sX -T3 192.168.100.0/24
Starting Nmap 7.80 ( https://nmap.org ) at 2022-05-08 20:06 UTC
Nmap scan report for 192.168.100.81
Host is up (0.0018s latency).
Not shown: 998 closed ports
PORT   STATE         SERVICE
22/tcp open|filtered ssh
53/tcp open|filtered domain
MAC Address: 52:54:00:00:08:01 (QEMU virtual NIC)

Nmap scan report for 192.168.100.82
Host is up (0.00065s latency).
All 1000 scanned ports on 192.168.100.82 are open|filtered
MAC Address: 52:54:00:00:08:02 (QEMU virtual NIC)

Nmap scan report for 192.168.100.83
Host is up (0.0016s latency).
All 1000 scanned ports on 192.168.100.83 are open|filtered
MAC Address: 52:54:00:00:08:03 (QEMU virtual NIC)

Nmap done: 256 IP addresses (3 hosts up) scanned in 13.63 seconds
student@base-lab-ids:~$ tail -f /var/log/suricata/fast.log
05/08/2022-20:07:05.926514  [Drop] [**] [1:2201228:8] GPL SCAN nmap XMAS - my updated rule [**] [Classification: Attempted Information Leak] [Priority: 2] {TCP} 192.168.100.254:41117 -> 192.168.100.82:7002
05/08/2022-20:07:05.926519  [Drop] [**] [1:2201228:8] GPL SCAN nmap XMAS - my updated rule [**] [Classification: Attempted Information Leak] [Priority: 2] {TCP} 192.168.100.254:41117 -> 192.168.100.82:3077
05/08/2022-20:07:05.928637  [Drop] [**] [1:2201228:8] GPL SCAN nmap XMAS - my updated rule [**] [Classification: Attempted Information Leak] [Priority: 2] {TCP} 192.168.100.254:41116 -> 192.168.100.82:389
05/08/2022-20:07:05.928652  [Drop] [**] [1:2201228:8] GPL SCAN nmap XMAS - my updated rule [**] [Classification: Attempted Information Leak] [Priority: 2] {TCP} 192.168.100.254:41116 -> 192.168.100.82:464
05/08/2022-20:07:05.930842  [Drop] [**] [1:2201228:8] GPL SCAN nmap XMAS - my updated rule [**] [Classification: Attempted Information Leak] [Priority: 2] {TCP} 192.168.100.254:41117 -> 192.168.100.82:8899
05/08/2022-20:07:05.930866  [Drop] [**] [1:2201228:8] GPL SCAN nmap XMAS - my updated rule [**] [Classification: Attempted Information Leak] [Priority: 2] {TCP} 192.168.100.254:41116 -> 192.168.100.82:3580
05/08/2022-20:07:05.932981  [Drop] [**] [1:2201228:8] GPL SCAN nmap XMAS - my updated rule [**] [Classification: Attempted Information Leak] [Priority: 2] {TCP} 192.168.100.254:41117 -> 192.168.100.82:49165
05/08/2022-20:07:06.028681  [Drop] [**] [1:2201228:8] GPL SCAN nmap XMAS - my updated rule [**] [Classification: Attempted Information Leak] [Priority: 2] {TCP} 192.168.100.254:41117 -> 192.168.100.82:464
05/08/2022-20:07:06.028698  [Drop] [**] [1:2201228:8] GPL SCAN nmap XMAS - my updated rule [**] [Classification: Attempted Information Leak] [Priority: 2] {TCP} 192.168.100.254:41117 -> 192.168.100.82:389
05/08/2022-20:07:06.032900  [Drop] [**] [1:2201228:8] GPL SCAN nmap XMAS - my updated rule [**] [Classification: Attempted Information Leak] [Priority: 2] {TCP} 192.168.100.254:41117 -> 192.168.100.82:3580
^C
student@base-lab-ids:~$

```

Why the hosts and the ports were discovered even though the packets were dropped?

<details>
<summary>Explanation</summary>

If you compare this output with the previous one, you can see that the
discovered ports have the [open|filtered][] status which means that the port is
not closed, but somewhere on the route, something blocked the packets (usually a
firewall).
[open|filtered]: https://nmap.org/book/man-port-scanning-basics.html

</details>


## Misc

### Drop packets for cryptominers

Add custom rules that generates an alert and drops the packets if the user tries
to access a cryptomining site (you can choose any cryptomining site).

:::tip
You do not have to write your own rules if you do not want to. There are
multiple rules you can find online (i.e. on GitHub, like
[this one](https://gist.github.com/GelosSnake/e116ebf3b7fa0579965e25fa4d758d41)).
:::


### Denial of Service attacks

To simulate a Denial-of-Service attack, we will use the `slowhttptest` tool.
We will install `slowhttptest` on VM2:
```
[student@lab-ids-2 ~]$ sudo dnf -y install epel-release
[student@lab-ids-2 ~]$ sudo dnf -y install slowhttptest
```

#### Slowloris

Slowloris is a slow-type denial of service attack. It simulates the behaviour
of a very slow client that opens multiple HTTP connections to the target
web server, then it delays the responses, occupying all the server's available
ports and keeping them open for a long time. Thus, the server becomes unable to
accept legitimate requests.

We will run the attack from VM2 to cause a Denial of Service on VM1, inspect the
traffic and see if we can create a rule to catch Slowloris.

Let's see how it works. You need four terminals: two to the base VM, one to VM1
(the web server), one to VM2.

From the first terminal from the base VM, let's inspect the alerts that are
generated by Suricata:

```bash
student@base-lab-ids:~/work$ tail -f /var/log/suricata/fast.log
[...] # any new logs will be displayed here.
```

From the second terminal on the base VM, let's check that the web server is
accessible by running the following command:

```bash
student@base-lab-ids:~/work$ for i in $(seq 1 200); do curl 192.168.100.81; sleep 2; done
Welcome to lab-ids-1
Welcome to lab-ids-1
```

Keep the command running.

From the VM2, run the Slowloris attack using the following command:

```bash
[student@lab-ids-2 ~]$ slowhttptest -c 10000 -H -i 10 -r 300 -t GET -u http://192.168.100.81
Fri May 13 21:02:56 2022:
        slowhttptest version 1.8.1
 - https://github.com/shekyan/slowhttptest -
test type:                        SLOW HEADERS
number of connections:            10000
URL:                              http://192.168.100.81/
verb:                             GET
cookie:
Content-Length header value:      4096
follow up data max size:          68
interval between follow up data:  10 seconds
connections per seconds:          300
probe connection timeout:         5 seconds
test duration:                    240 seconds
using proxy:                      no proxy

Fri May 13 21:02:56 2022:
slow HTTP test status on 15th second:

initializing:        0
pending:             2
connected:           765
error:               0
closed:              1018
service available:   NO
```

Check the web server's availability:

```
student@base-lab-ids:~/work$ for i in $(seq 1 200); do curl 192.168.100.81; sleep 1; done
Welcome to lab-ids-1
Welcome to lab-ids-1
[...]
curl: (56) Recv failure: Connection reset by peer
curl: (52) Empty reply from server
curl: (56) Recv failure: Connection reset by peer
curl: (56) Recv failure: Connection reset by peer
curl: (56) Recv failure: Connection reset by peer
curl: (52) Empty reply from server
curl: (52) Empty reply from server
curl: (56) Recv failure: Connection reset by peer
```

As you can see from the logs, the attack was not caught even though in the
`suricata.rules` files there is a rule for detecting Slowloris attack.
Why is this happening?

<details>
<summary>Explanation</summary>

Even though there are rules to catch Slowloris, they may not match the actual
attack signature. When confronted with a Denial of Service attack such as
Slowloris, it depends on its behaviour more than its signature. Different
Slowloris implementations use different techniques that may not be detectable by
the current signatures.

The Slowloris rule you can find in the `suricata.rules` files checks for
`POST` HTTP requests, while our attack uses `GET` headers. However, even if
we change the method from `GET` to `POST`, the attack will still be undetected.

At this point, we can either write our own signature that may or may not
catch the attack or use a more powerful tool (usually based on ML algorithms)
that will analyse the network behaviour over time, based on pattern
recognition techniques.

</details>


Let's inspect the traffic that flows through the network. Run `slowloris` with
only one connection open (`-c 1`) and inspect the traffic.
Compare it with the output for `curl http://192.168.100.81`.

Start `tcmpdump` using the following command:

```
student@base-lab-ids:~$ sudo tcpdump -nvvvXi virbr-labs src 192.168.100.82 and dst 192.168.100.81
[...]
17:25:43.688054 IP (tos 0x0, ttl 64, id 36786, offset 0, flags [DF], proto TCP (6), length 60)
    192.168.100.82.51210 > 192.168.100.81.80: Flags [S], cksum 0x70dc (correct), seq 1780797759, win 29200, options [mss 1460,sackOK,TS val 2629860000 ecr 0,nop,wscale 6], length 0
        0x0000:  4500 003c 8fb2 4000 4006 6115 c0a8 6452  E..<..@.@.a...dR
        0x0010:  c0a8 6451 c80a 0050 6a24 d13f 0000 0000  ..dQ...Pj$.?....
        0x0020:  a002 7210 70dc 0000 0204 05b4 0402 080a  ..r.p...........
        0x0030:  9cc0 7aa0 0000 0000 0103 0306            ..z.........
[...]
17:25:43.740119 IP (tos 0x0, ttl 64, id 36788, offset 0, flags [DF], proto TCP (6), length 278)
    192.168.100.82.51210 > 192.168.100.81.80: Flags [P.], cksum 0x5cbb (correct), seq 0:226, ack 1, win 457, options [nop,nop,TS val 2629860052 ecr 2440181390], length 226: HTTP, length: 226
        GET / HTTP/1.1
        Host: 192.168.100.81
        User-Agent: Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; rv:11.0) like GeckoAppleWebKit/534.30 (KHTML, like Gecko) Chrome/12.0.742.822 Safari/534.30
        Referer: TESTING_PURPOSES_ONLY
[...]
```

Note the number of packets that are send through the network for only one
connection and their size.

And the `access.log` file from the web server:
```bash
student@lab-ids-1:~$ tail -n 2 /var/log/nginx/access.log
192.168.100.82 - - [13/May/2022:21:10:02 +0300] "GET / HTTP/1.1" 400 0 "TESTING_PURPOSES_ONLY" "Opera/9.80 (Macintosh; Intel Mac OS X 10.7.0; U; Edition MacAppStore; en) Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit/534.34 (KHTML,like Gecko) PhantomJS/1.9.0 (development) Safari/534.34"
192.168.100.82 - - [13/May/2022:21:10:02 +0300] "GET / HTTP/1.1" 400 0 "TESTING_PURPOSES_ONLY" "Opera/9.80 (Macintosh; Intel Mac OS X 10.7.0; U; Edition MacAppStore; en) Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit/534.34 (KHTML,like Gecko) PhantomJS/1.9.0 (development) Safari/534.34"
```

As we can see, there are a lot of testing purposes GET packets sends from VM2 to VM1.
From the `tcpdump` output, you can see the packets' metadata. We can try to add
our custom rule that can detect Slowloris.

A dummy rule which counts the number of packets with
a size less than 100 and alerts if more than 50 of them are generated in less
than 60 seconds is the following one:
```bash
alert tcp $HOME_NET any -> $HOME_NET any (msg:"Posible Slowloris Attack"; flow:no_stream; dsize:<100; threshold:type both,track by_dst,count 50,seconds 60; classtype:web-application-attack; sid:900000501; rev:15; metadata:created_at 2022_05_09, updated_at 2022_05_09;)
```

:::note
The rule from above may generate false positive (i.e. run
`curl http://192.168.100.81` in a while loop).
:::

#### R-U-Dead-Yet (RUDY)

Another attack you can check using `slowhttptest` is R-U-Dead-Yet (RUDY).
The behaviour is the same as for the Slowloris attack: acting like a very slow
client to occupy the web server's connections.

In contrast with Slowloris that will slowly send HTTP headers (hence its name
in `slowhttptest` - "slow headers"), RUDY uses the HTTP body instead,
making it difficult to catch using a typical IDS rules.

Run a Denial of Service attack from VM2 to VM1. Check the logs to see if the
rule above detects RUDY or not.

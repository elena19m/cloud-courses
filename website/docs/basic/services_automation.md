---
sidebar_position: 5
---

# Services and automating tasks

## Lab Setup
  * We will be using a virtual machine in the [faculty's cloud](http://cloud.grid.pub.ro/).
  * When creating a virtual machine in the Launch Instance window:
    * Name your VM using the following convention: `scgc_lab<no>_<username>`,
      where `<no>` is the lab number and `<username>` is your institutional account.
    * Select **Boot from image** in **Instance Boot Source** section
    * Select **SCGC Template** in **Image Name** section
    * Select the **m1.medium** flavor.
  * The username for connecting to the VM is `student`.


import SystemdServices from '../common/services_automation/_systemd_services.md';

<SystemdServices/>

import Journald from '../common/services_automation/_journald.md';

<Journald/>

import Cron from '../common/services_automation/_cron.md';

<Cron/>

import SystemdTimers from '../common/services_automation/_systemd_timers.md';

<SystemdTimers/>

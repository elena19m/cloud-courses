## Setup 

We will be using a virtual machine in the [faculty's cloud](http://cloud.grid.pub.ro/).

When creating a virtual machine in the Launch Instance window:
  * Select **Boot from image** in **Instance Boot Source** section
  * Select **SCGC Template** in **Image Name** section
  * Select the **m1.elk** flavor.

In the base virtual machine:
  * Download the laboratory archive from [here](https://repository.grid.pub.ro/cs/scgc/laboratoare/lab-elk.zip) in the `work` directory.
Use: `wget https://repository.grid.pub.ro/cs/scgc/laboratoare/lab-elk.zip` to download the archive.
  * Extract the archive.
The `.qcow2` files will be used to start virtual machines using the `runvm.sh` script.
  * Start the virtual machines using `bash runvm.sh`.
  * The username for connecting to the nested VMs is `student` and the password is `student`.


```shell-session
$ # change the working dir
$ cd ~/work
$ # download the archive
$ wget https://repository.grid.pub.ro/cs/scgc/laboratoare/lab-elk.zip
$ unzip lab-elk.zip
$ # start VMs; it may take a while
$ bash runvm.sh
$ # check if the VMs booted
$ virsh net-dhcp-leases labvms
```

## Introduction

The Elastic Stack is a collection of software products used for data and log 
collection, storage, analysis and visualization. It is one of the most used 
enterprise platforms. In this lab, we will deploy and configure the Elastic 
Stack (Elasticsearch, Logstash, Kibana) on a host (the `elk` VM) and configure 
another host (the `helper` VM) to collect data from and send it to our Elastic 
Stack VM by using Beats, a collection of lightweight data shippers.

### Lab topology
![Topology](./assets/topology-light.svg#light)![Topology](./assets/topology-dark.svg#dark) <!-- .element height="200%" width="200%" -->

As presented in the scheme above, our architecture is the following:
  * the `elk` VM - this will run the Elastic Stack components (Elasticsearch, 
  Kibana and Logstash)
  * the `helper` VM - this will play the role of a monitored host in our 
  environment. We will install various Beats and services with the purpose
  of collecting data from it.

In a real life scenario, the Elastic Stack might run in a different network
than the monitored hosts, and the number of monitored hosts would be higher.

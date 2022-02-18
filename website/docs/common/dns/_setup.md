We will be using two virtual machines in the [faculty's cloud](http://cloud.grid.pub.ro/).

Create two VMs (one will be our DNS master server and one will be our DNS slave server).
When creating a virtual machine in the Launch Instance window:
  * Select **Boot from image** in **Instance Boot Source** section
  * For the master VM select **Debian 10.3** in **Image Name** section
  * For the slave VM select **Centos 7** in **Image Name** section
  * Select the **m1.small** flavor for both VMs.
  * The usernames for connecting to the VMs are:
    * `debian` for **Debian 10.3**
    * `student` for **CentOS 7**
  * For ease of use we recommend adding entries in the `/etc/hosts` file corresponding to the slave and master VMs
    * `<ip_master> master`
    * `<ip_slave> slave`
    * These two lines will allow using `master` instead of the IP address of the master VM for clarity. Likewise, we can use `slave` instead of the IP address of the slave VM.


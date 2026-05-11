We will be using a virtual machine in the [faculty's cloud](http://cloud.grid.pub.ro/).

When creating a virtual machine in the Launch Instance window:
  * Name your VM using the following convention: `scgc_lab<no>_<username>`,
where `<no>` is the lab number and `<username>` is your institutional account.
  * Select **Boot from image** in **Instance Boot Source** section
  * Select **SCGC Template** in **Image Name** section
  * Select the **g.medium** flavor.

In the base virtual machine:
  * Download the laboratory archive from [here](https://repository.grid.pub.ro/cs/scgc/laboratoare/lab-forensics.zip) in the `work` directory.
Use: `wget https://repository.grid.pub.ro/cs/scgc/laboratoare/lab-forensics.zip` to download the archive.
  * Extract the archive.
The files extracted will be used as a starting point for the exercises in this laboratory.

```shell-session
$ # change the working dir
$ cd ~/work
$ # download the archive
$ wget https://repository.grid.pub.ro/cs/scgc/laboratoare/lab-forensics.zip
$ unzip lab-forensics.zip
```

We will be using several Python-based forensic tools throughout the lab - Dissect and Volatility 3.
To install them we recommend following Python best practices and use a virtual environment, either manually managed through `venv` or with `pipx`/`uv`. We will be using `pipx`, which can be installed using your system's package manager:

```shell-session
student@lab-forensics:~$ sudo apt update && sudo apt install -y pipx python3-venv
```

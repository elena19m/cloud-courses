---
sidebar_position: 5
---

# Chrome Remote Desktop

**Chrome Remote Desktop** is a Google service that allows you to view the screen of your virtual machine in a browser, 
regardless of where you are running the virtual machine.

The only prerequisites are:
  * have a Google account (if you have a `@gmail.com` email address, you already have one)
  * use the Chrome browser on your laptop
  * your VM must have Internet connectivity

## Setup

We will be using a virtual machine in the [faculty's cloud](http://cloud.grid.pub.ro/).

When creating a virtual machine in the Launch Instance window:
  * Select **Boot from image** in **Instance Boot Source** section
  * Select a Debian-based image in the **Image Name** section (e.g. **CC 2024-2025**)
  * Select the **m1.xlarge** flavor.

Connect to the VM using SSH.

## Install Chrome Remote Desktop on the VM

1. Add the custom repository for Chrome Remote Desktop:

```shell-session
$ curl https://dl.google.com/linux/linux_signing_key.pub \
    | sudo gpg --dearmor -o /etc/apt/trusted.gpg.d/chrome-remote-desktop.gpg
$ echo "deb [arch=amd64] https://dl.google.com/linux/chrome-remote-desktop/deb stable main" \
    | sudo tee /etc/apt/sources.list.d/chrome-remote-desktop.list
```

2. Update the list of packages:

```
$ sudo apt update
```

3. Install Chrome Remote Desktop

```shell-session
$ sudo apt install chrome-remote-desktop
```

## Install the Cinnamon Desktop Environment

1. Install the packages for the Cinnamon Desktop Environment and basic X11 components:

```shell-session
$ sudo apt install cinnamon-core desktop-base dbus-x11
```

2. Configure Chrome Remote Desktop to use Cinnamon in 2D mode by default (Chrome Remote Desktop does not support 3D graphics acceleration):

```shell-session
$ echo "exec /etc/X11/Xsession /usr/bin/cinnamon-session-cinnamon2d" | sudo tee /etc/chrome-remote-desktop-session
```

## Link the VM to Chrome Remote Desktop in your Google account

1. On your laptop, open the Chrome browser and navigate to https://remotedesktop.google.com/headless

2. Click **Begin**, then **Next**, then **Authorize**. Allow Chrome Remote Desktop to access your account.

3. Copy the command line for Debian Linux and run it in your VM. The command should look like this:

```shell-session
DISPLAY= /opt/google/chrome-remote-desktop/start-host \
    --code="4/xxxxxxxxxxxxxxxxxxxxxxxx" \
    --redirect-url="https://remotedesktop.google.com/_/oauthredirect" \
    --name=$(hostname)
```

You will be prompted to enter a 6-digit pin. Choose one that you will **remember**, because you will need it when you connect to your VM.

4. Verify that the Chrome Remote Desktop started successfully:

```shell-session
$ sudo systemctl status chrome-remote-desktop@$USER
● chrome-remote-desktop@student.service - Chrome Remote Desktop instance for student
     Loaded: loaded (/lib/systemd/system/chrome-remote-desktop@.service; enabled; vendor preset: enabled)
     Active: active (running) since Sat 2025-04-12 14:58:23 UTC; 1min 40s ago
```

## Connect to the VM using Chrome Remote Desktop

1. On your laptop, open the Chrome browser and navigate to https://remotedesktop.google.com/access/

2. Click the name of your VM.

3. Enter the PIN you configured when prompted.

4. That's it, you can now use your VM from within the browser. Enjoy!

## References

  * https://support.google.com/chrome/answer/1649523
  * https://cloud.google.com/architecture/chrome-desktop-remote-on-compute-engine

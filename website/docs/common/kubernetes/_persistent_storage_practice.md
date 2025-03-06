### Exercise: custom sshd config

1. Copy the sshd config file from the pod.
Check the documentation of the `linxuserver.io/openssh-server` image for its location.

2. Edit the configuration file in order to allow TCP port forwarding and X11 display forwarding.

3. Create a ConfigMap from this configuration and create a deployment that mounts this file in the pod.

4. Connect using SSH and try to do a port forwarding.

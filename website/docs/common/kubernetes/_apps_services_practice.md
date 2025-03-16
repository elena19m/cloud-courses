### Exercise: LET ME IN

1. Create a service for your `OpenSSH` deployment in order to allow SSH connections on port `32222` from outside the cluster.
Connect to the pod using SSH.

2. Update the deployment in order to give your user `sudo` access without a password.
Connect to the pod using SSH and check if you can use `sudo`.

3. Now roll back to the previous version where your user did not have `sudo` access.
Connect to the pod using SSH and check if you can use `sudo`.

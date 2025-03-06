### Exercise: Baby's first ~steps~ deployment

1. Create a deployment using the `quay.io/linuxserver.io/openssh-server`

2. Read [the documentation for this container](https://docs.linuxserver.io/images/docker-openssh-server) and add the following configurations to your deployment:

    a. Use a different user inside the container.

    b. Generate an SSH keypair (`ssh-keygen`) and set that public key for the user.

    c. Apply the deployment.

3. Don't worry, we can't connect using SSH just yet. Execute a command inside the container to verify that the user has been created and the key has been copied to `~/.ssh/authorized_keys`.

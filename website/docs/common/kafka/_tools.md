## What tools we will use?

In this lab, we'll use two docker containers: the kafka broker and a third-party tool for UI visualization, called **kafka-ui**. For the coding (tutorial and exercises), we'll use Python3 with the **confluent-kafka** package.

:::note
**kafka-ui** is not an official tool, but a visualization tool designed and developed by the community, useful in the development process.
:::



:::info
**kafka-ui** is a web application, already configured in your VM to run on `localhost:8080`.

There are two options for connecting to the Argo CD user interface: **SSH tunneling** or **Chrome Remote Desktop**.
:::

:::info
**Option 1: SSH tunneling**

[Follow this tutorial](https://cloud-courses.upb.ro/docs/basic/working_with_openstack/#permanent-ssh-configurations) to configure the SSH service to bind and forward the `8080` port to your machine:

```shell-session
ssh -J fep -L 8080:127.0.0.1:8080 -i ~/.ssh/id_fep  student@10.9.X.Y
```
:::

:::info
**Option 2: Chrome Remote Desktop**

An alternative to SSH tunneling or X11 forwarding is Chrome Remote Desktop, which allows you to connect to the graphical inteface of your VM.

If you want to use this method, follow the steps from [here](https://cloud-courses.upb.ro/docs/basic/crd).
:::

## Set the connection

Go to `localhost:8080` and configure as follows:
* **Cluster name**: CC_lab
* **Host**: kafka
* **Post**: 9092

At the bottom of the page click **Validate**. If everything goes well, we will see a toastr, `Configuration is valid`. We can click on **Submit**. After a couple of seconds, we will be able to see more options on the left panel:
* The **Brokers** page shows the list of kafka nodes available in the cluster.
* The **Topics** page presents all the topics.
* The **Consumers** page lists the consumer groups, with all the consumers in each group.
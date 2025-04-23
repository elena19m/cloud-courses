## Useful scripts

Kafka provides a set of useful scripts for cluster management or just producing and consuming events.

For this part of the lab, we will need two shell instances. In both of them, run the following commands to enter the container and go to the scripts directory:

```shell-session
$ docker exec -it kafka bash
$ cd /opt/kafka/bin
```

## Kafka topics

Kafka topics represent logical channels or categories to which records (messages) are published and from which records are consumed. We can view a topic as a directory from our filesystem. Each topic has a name, as each directory, and we can consume (read) from our topic by using its name, as listing the files from the directory.

Each topic is composed of one or more partitions, which are units of parallelism and storage within a topic. Imagine a Kafka topic as a highway where data (messages) flows like cars. The highway has three lanes, each lane represents a partition of the topic. Cars in a single lane (partition) follow a strict order, but multiple lanes allow more cars to travel at once.

![Schema](./assets/kafka.svg#light)

### Create a topic

Now that we have all the technical details, let's create our first topic.

```shell-session
$ ./kafka-topics.sh --bootstrap-server localhost:19092 --create --topic post.office
```

This script will connect to our Kafka node on port **19092** (used for external clients) and create a topic called **post.office**. Let's go back to **kafka-ui** on the **Topics** page and we will see a new topic **post.office** with 3 **Partitions** and 1 **Replication Factor**.

### Delete a topic

We can delete topics using the same script.

:::warning
If you run the below script, you will have to recreate the **post.office**.
:::

```shell-session
$ ./kafka-topics.sh --bootstrap-server localhost:19092 --delete --topic post.office
```

### Produce events on a topic

The following command will **produce** an event on the **post.office** topic.

```shell-session
$ echo '{"event": "new_envelope", "to": "Alan Turing", "message": "You are my role model"}' | ./kafka-console-producer.sh --bootstrap-server localhost:19092 --topic post.office
```

Let's take a look at the **Topics** page. We will see that the **Number of messages** field increased. Click on the topic name and a more detailed page will pop. We can see on the **Messages** tab our message, but the **Consumers** tab is empty.

### Consume events from a topic

The following instruction will **consume** an event from the **post.office** topic.

```shell-session
$ ./kafka-console-consumer.sh --bootstrap-server localhost:19092 --topic post.office
```

:::note
As we can see, the script will lock our terminal waiting for events, but the first event is not received. Let's produce the same event again and see the result.
:::

:::note
If we go on the **Messages** tab, we will see with a high chance that the second message is produces on other partition than the first one. That is a result of Kafka's internal routing system. Kafka will try to send messages on different partitions to increase the parallelism when we have multiple consumers.
:::

### Updating the number of partitions

As we were able to see in the above section, more partitions mean higher parallelism. We want to increase the number of partitions from 3 to 5 using the following script:

```shell-session
$ ./kafka-topics.sh --alter --topic post.office --partitions 5 --bootstrap-server localhost:9092
```

A real-world example would be an online shop. We use kafka to produce some events to another service that sends emails to customers. The entire year, three partitions work just fine, but the Black Friday comes. All the customers will start searching for products and purchasing all kinds of stuff. Three event consumers might not be enough and we don't want to miss or delay sending any purchasing email.
## Exercises

From this point, we will use the python script provided in the ZIP archive.

:::note
To continue the lab, we need to create a virtual environment and install the `confluent-kafka` package. Run the following commands (directly on the VM, **not** in the kafka container):

```shell-session
$ python3.10 -m venv venv
$ source venv/bin/activate
$ pip3 install confluent-kafka
```
:::

:::warning
Make sure your prompt contains the `(venv)` message, as the following example:
```shell-session
(venv) student@cc-lab:~$
```
The `confluent-kafka` package is available only in the virtual environment, not on the machine.
:::

For more in-depth details about `confluent-kafka`, [check the official documentation](https://docs.confluent.io/platform/current/clients/confluent-kafka-python/html/index.html).

### Task 1

Here we have a **Python** script that creates multiple threads, one for each consumer/producer. We will always have one producer, which creates an event per second without any output, until the SIGINT (CTRL + C) signal is caught. We have a variable number of consumer threads, which will print everytime they consume something. Example of output:

```shell-session
$ python3 kafka.py
Consumer 0: {"to": "Steve Jobs", "from": "KFYbPZO@gmail.com", "message": "We will have affordable prices, right?"} (key: None)
SIGINT received. Stopping thread...
```

Follow `TODO1` comments and let some events to be produced. What is the result in each consumer?

<details>
<summary><b>Read me after</b></summary>
Each consumer will get all the events. Sometimes this is what we want, but sometimes this behaviour can lead to duplicating the actions.
An example is the online shop that send events each time an user purchases something. One email service would want to subscribe to these events to send details to customers. Another service, that generates invoices for businesses, would also be a consumer. Both require the same events, not just a subset of them.

What about a high traffic day that require two invoice services to generate the documentation in time? It would be a disaster to generate and send two invoices for one purchase, right?
</details>

### Task 2

Follow `TODO2` comments and let some events to be produced. What is the result in each consumer?

<details>
<summary><b>Read me after</b></summary>
As we can see, grouping multiple consumers under the same ID means that we will not consume the same event twice.

**Kafka** has an internal routing system based on partitions and the number of consumers in a consumer group. In this case, we can have maximum 5 active consumers because we have 5 partitions. The rest of the consumers will be on hold and will run only if active consumers stop for any reason. 
</details>

### Task 3

Follow `TODO3` comments and let some events to be produced. What is the result in each consumer?

<details>
<summary><b>Read me after</b></summary>
Up until this moment, we sent events that had a value, but without a key.
When we send an event with a key, **Kafka** makes a hash of the key and assigns it to a partition. From that moment, all the events containing that key hash will be routed to the same partition.

You can also check the `kafka-ui` dashboard.

:::note
We are creating a small amount of events compared to what Kafka can handle. There is a chance that some consumers will not get events.

Kafka **does not guarantee** that events with different keys will be sent on different partitions.

Kafka **guarantees** that events with the same key will also get on the same partition.
:::
</details>
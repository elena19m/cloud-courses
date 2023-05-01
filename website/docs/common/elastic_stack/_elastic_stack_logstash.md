## (BONUS) Custom log formats with Logstash

:::tip
Before starting this section we recommend stopping previous Beats.
:::

### Installation

Details about installing Logstash can be found 
[here](https://www.elastic.co/guide/en/logstash/current/installing-logstash.html).
For your convenience, it has already been installed on the `elk` VM under 
`/usr/share/logstash`.

### Creating a logstash pipeline

There is a command logger running on the system that logs data in a custom way 
not supported by default in Filebeat. Make sure it is running using 
`snoopyctl status`. Enable it if necessary using `snoopyctl enable`.

Data is logged to `/var/log/snoopy.log` and the service configuration file is in
`/etc/snoopy.ini`. 

Examine the files, setup Filebeat to send data to Logstash and create a Logstash
pipeline to ingest the logs in a structured way in Elasticsearch. For field
extraction you can use the grok or dissect plugins.

#### Useful links

- [https://www.elastic.co/guide/en/logstash/current/advanced-pipeline.html](https://www.elastic.co/guide/en/logstash/current/advanced-pipeline.html)
- [https://www.elastic.co/guide/en/logstash/current/field-extraction.html](https://www.elastic.co/guide/en/logstash/current/field-extraction.html)
- [https://www.elastic.co/guide/en/logstash/current/plugins-filters-dissect.html](https://www.elastic.co/guide/en/logstash/current/plugins-filters-dissect.html)
- [https://www.elastic.co/guide/en/logstash/current/plugins-filters-grok.html](https://www.elastic.co/guide/en/logstash/current/plugins-filters-grok.html)

## What is MinIO?

[**MinIO**](https://min.io/docs/minio/kubernetes/upstream/) is an open-source, high-performance, S3-compatible object storage system. It allows users to store unstructured data like photos, videos, log files, backups, and container images.

Key features of MinIO:
- **Lightweight and scalable**: Can be deployed quickly and scales horizontally.
- **S3 API compatibility**: Works seamlessly with applications written for AWS S3.
- **High Performance**: Designed for high-throughput workloads.
- **Built for Kubernetes**: Native support for Kubernetes deployments.

We will explain these concepts more deeply in the following chapters.

## Why do we need MinIO?

Object storage is crucial when applications need to store and retrieve large amounts of unstructured data reliably.

Here are a few real-world use cases:
1. Machine Learning Models
    * Store massive training datasets like images and audio.
    * Serve models for production services directly from object storage.
2. Backup and Archival
    * Snapshots of databases or virtual machines stored reliably.
    * Cost-effective storage for rarely accessed data.
3. Web Applications
    * Host static assets like images, CSS, and videos.
    * Provide easy upload/download functionality for users.

MinIO is a lightweight, cost-effective solution for all these tasks when we don't want to depend on a public cloud (like AWS S3).

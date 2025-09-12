---
title: How to configure Dissect for Cowrie snapshots
description: Learn how to set up Dissect to analyze Cowrie’s differential snapshots, making honeypot exploration smooth and quick.
slug: dissect-for-cowrie
tags: [SOCcare, security, forensics, threat intelligence analysis, ioc, dissect]

hide_table_of_contents: false
---

import SOCcareLogo from './assets/soccare.png';

Honeypots like Cowrie are a great source of knowledge about attack vectors and new IOCs, but analyzing them can become a cumbersome task - especially because their number can get quite big. That’s where [Dissect](https://docs.dissect.tools/en/latest/) comes into play. By leveraging its API, you can streamline forensic analysis and automate snapshot processing. This opens up the road to fully automated IOC extraction pipelines that are able to analyze honeypot data and publish threat intelligence to be further processed by IDS tools.

This post is a short guide on how to configure Dissect API to work with Cowrie's snapshots.

<!-- truncate -->

Dissect provides a Python API that can easily integrate into existing pipelines or frameworks.
For most use cases, simply loading a target and applying plugins is enough:

```python
target = Target.open(target_path)
os = target.os
install_date = target.install_date
activity = target.activity
users = target.users()
```

Interacting with Cowrie snapshots can get slightly different because Cowrie generates `qcow2` differential snapshots on top of a base image to minimize disk usage. Inspecting a snapshot metadata with `qemu-img info` might paint a more clear picture:

```shell-session
$ qemu-img info snapshot-ubuntu_2204-ff4b5af73ac04d279074922bfda47c05.qcow2
image: snapshot-ubuntu_2204-ff4b5af73ac04d279074922bfda47c05.qcow2
file format: qcow2
virtual size: 4.88 GiB (5242880000 bytes)
disk size: 24.1 MiB
cluster_size: 65536
backing file: /mnt/data/ubuntu-22.04.qcow2
backing file format: qcow2
[...]
```

A naive approach to analyze Cowrie snapshots is to create standalone `qcow2` images by concatenating the base and snapshot image with `qemu-img` tools. However, this comes with a significant downside - it is time-consuming for a large number of snapshots as Cowrie generates.

Depending on your Cowrie setup, Dissect can automatically detect the backing file path and loading it alongside the snapshot.
Under the hood, `Target.open(target_path)` detects the image type (`qcow2`), reads the image headers, and most likely discovers the backing file path automatically.

For more control, you can interact directly with [Dissect’s QCOW2 module](hhttps://github.com/fox-it/dissect.hypervisor/blob/main/dissect/hypervisor/disk/qcow2.py#L38-L63), giving you more flexibility to handle snapshots and base images explicitly:

```python
from dissect.target import Target
from dissect.hypervisor.disk import qcow2
from pathlib import Path

def open_qcow2_with_backing_file(snapshot_path: Path, backing_path: Path):
    # Open base QCOW2 image
    backing_fh = backing_path.open("rb")
    base_qcow2 = qcow2.QCow2(backing_fh)
    base_stream = base_qcow2.open()

    # Open snapshot QCOW2 image with base as backing file
    snapshot_fh = snapshot_path.open("rb")
    snapshot_qcow2 = qcow2.QCow2(
        snapshot_fh,
        backing_file=base_stream
    )
    snapshot_stream = snapshot_qcow2.open()

    return snapshot_stream, snapshot_fh, backing_fh, base_stream

def analyze_image(snapshot_path: Path, backing_path: Path):
    # Open the QCOW2 snapshot along with its backing file and get file/stream handles
    snapshot_stream, snapshot_fh, backing_fh, base_stream = open_qcow2_with_backing_file(snapshot_path, backing_path)

    # Create a new Dissect target to analyze the disk image
    target = Target()
    # Add the snapshot stream to the target’s disks
    target.disks.add(snapshot_stream)
    # Resolve all disks, volumes and filesystems and load an operating system on the current
    target.apply()

    # Collect data from the snapshot
    os = target.os
    install_date = target.install_date
    activity = target.activity
    users = target.users()

    # Clean up file handles / streams explicitly
    snapshot_stream.close()
    base_stream.close()
    snapshot_fh.close()
    backing_fh.close()

if __name__ == "__main__":
  snapshot_path = Path("/mnt/data/snapshots/snapshot-ubuntu_2204-ff4b5af73ac04d279074922bfda47c05.qcow2")
  backing_path = Path("/mnt/data/ubuntu-22.04.qcow2")
  result = analyze_image(snapshot_path, backing_path)
```

Taking a look into the `QCOW2` class itself, it allows `data_file` and a `backing_file` to be passed directly:

```python
class QCow2:
    """QCOW2 virtual disk implementation.

    If a data-file is required and ``fh`` is not a ``Path``, it's required to manually pass a file like object
    in the `data_file` argument. Otherwise, the data file will be automatically opened if it exists in the same directory.
    It's possible to defer opening the data file by passing ``allow_no_data_file=True``.

    The same applies to the backing-file. This too can be deferred by passing ``allow_no_backing_file=True``.

    Args:
        fh: File handle or path to the QCOW2 file.
        data_file: Optional file handle for the data file. If not provided and ``fh`` is a ``Path``, it will try to open it automatically.
        backing_file: Optional file handle for the backing file. If not provided and ``fh`` is a ``Path``, it will try to open it automatically.
        allow_no_data_file: If True, allows the QCOW2 file to be opened without a data file.
        allow_no_backing_file: If True, allows the QCOW2 file to be opened without a backing file.
    """
    def __init__(
        self,
        fh: BinaryIO | Path,
        data_file: BinaryIO | None = None,
        backing_file: BinaryIO | None = None,
        *,
        allow_no_data_file: bool = False,
        allow_no_backing_file: bool = False,
    ):
```

In conclusion, by leveraging Dissect’s Python API flexibility and modularity, you can efficiently analyze Cowrie snapshots alongside their backing files, gaining insights into the threat actor activity without the overhead of manually looking into them. Whether you’re integrating Dissect as a step into a forensics pipeline or exploring honeypot snapshots, this approach minimizes time spent on investigating and extracting IOCs.

### SOCcare

The SOCcare project is co-funded by the European Union, alongside our collaborators,
NRD Cyber Security and RevelSI, and supported by the
European Cybersecurity Competence Centre (ECCC) Centre (ECCC) under Grant Agreement No. 101145843.
Views and opinions expressed are however those of the author(s) only and do not necessarily
reflect those of the European Union or the European Cybersecurity Competence Centre.
Neither the European Union nor the European Cybersecurity Competence Centre can be held responsible for them.

<img src={SOCcareLogo} width="600"/>

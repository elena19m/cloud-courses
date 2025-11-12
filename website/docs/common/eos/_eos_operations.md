## Writing and reading files in EOS
EOS organizes its storage space across multiple filesystems, which are grouped together into storage groups. Each FST node can host one or more of these filesystems. From the user's perspective, EOS exposes a unified logical file hierarchy, but internally, every file path maps to a specific physical location on an FST node.

EOS supports different file layouts that dictate how data is stored across nodes. The layout is set per directory, allowing to manage data based on importance and performance needs.

### 1. Replica layout

The **Replica layout** in EOS stores complete copies of a file across multiple filesystems, based on a configurable replication factor. This approach ensures data redundancy and high availability, allowing file access even if one or more copies become unavailable.

When a write request is received by EOS, it creates multiple copies of the file according to the replication factor and stores them across different filesystems. These filesystems are selected from the same scheduling group based on predefined balancing rules, such as available space and node load.

By default, EOS creates a base directory at `/eos/dev/`. Before writing any data on the EOS instance, let's create a directory and define its replication policy with a replication factor of 2, ensuring that each file stored inside it is duplicated on two filesystems:

```shell-session
[root@mgm ~]# eos mkdir /eos/dev/replica                                  # create the directory
[root@mgm ~]# eos attr -r set default=replica /eos/dev/replica            # set replica layout
[root@mgm ~]# eos attr -r set sys.forced.nstripes=2 /eos/dev/replica      # set replication factor to 2
[root@mgm ~]# sudo eos attr ls /eos/dev/replica                           # check directory settings
sys.eos.btime="1761832881.81783206"
sys.forced.blocksize="4k"
sys.forced.checksum="adler"
sys.forced.layout="replica"
sys.forced.nstripes="2"
sys.forced.space="default"
```

This configuration ensures that all files stored in `/eos/dev/replica` is duplicated on two FST nodes.

Let’s create a file and upload it to the `/eos/dev/replica` directory in EOS:

```shell-session
[root@mgm ~]# dd if=/dev/urandom of=my_file bs=1M count=10
[root@mgm ~]# eos cp ~/my_file /eos/dev/replica
[eoscp] my_file                  Total 10.00 MB	|====================| 100.00 % [48.5 MB/s]
[eos-cp] copied 1/1 files and 10.49 MB in 0.30 seconds with 35.33 MB/s
```

Verify that the file exists by listing the contents of the `/eos/dev/replica` directory:

```shell-session
[root@mgm ~]# eos ls /eos/dev/replica
my_file
```

The directory `/eos/dev/replica` is part of the logical namespace that EOS exposes to users, internally EOS maps each logical file entry to one or more physical replicas stored across different FST nodes.

When a user writes to or reads from `/eos/dev/replica/`, they do not need to know where the actual data resides. This mapping between the logical file and its physical replicas is maintained in the file metadata, which can be inspected using the `eos fileinfo` command:

```shell-session
[root@mgm ~]# eos fileinfo /eos/dev/replica/my_file
  File: '/eos/dev/replica/my_file'  Flags: 0640
  Size: 10485760
Status: healthy
Modify: Mon Nov 10 23:37:34 2025 Timestamp: 1762810654.531039000
Change: Mon Nov 10 23:37:34 2025 Timestamp: 1762810654.322678393
Access: Mon Nov 10 23:37:34 2025 Timestamp: 1762810654.322679714
 Birth: Mon Nov 10 23:37:34 2025 Timestamp: 1762810654.322678393
  CUid: 0 CGid: 0 Fxid: 00000010 Fid: 16 Pid: 17 Pxid: 00000011
XStype: adler    XS: b1 29 e8 5a    ETAGs: "4294967296:b129e85a"
Layout: replica Stripes: 2 Blocksize: 4k LayoutId: 00100012 Redundancy: d1::t0 
  #Rep: 2
┌───┬──────┬────────────────────────┬────────────────┬────────────────┬──────────┬──────────────┬────────────┬────────┬────────────────────────┐
│no.│ fs-id│                    host│      schedgroup│            path│      boot│  configstatus│       drain│  active│                  geotag│
└───┴──────┴────────────────────────┴────────────────┴────────────────┴──────────┴──────────────┴────────────┴────────┴────────────────────────┘
 0        1             fst-1.spd.ro        default.0          /data01     booted             rw      nodrain   online               local::geo 
 1        2             fst-1.spd.ro        default.0          /data02     booted             rw      nodrain   online               local::geo 

*******
```

The metadata of a file includes details such as the logical filename, the unique file identifier (Fxid), and the replication factor (#Rep).
In this example, EOS created two physical replicas of the file, stored on the filesystems with `fs-id 1` and `fs-id 2`, both located on the `fst-1` node.

#### Exercise

* Write other files in the `/eos/dev/replica` directory. Inspect them using the `eos fileinfo` command and observe which filesystems store the replicas.
* On each storage node, `eos-fst-1`, `eos-fst-2`, and `eos-fst-3`, inspect the `/dataXY` directories to see how EOS organizes physical files.
* Create a new EOS directory and set the replication factor to 3. Populate the directory with files and use `eos fileinfo` to observe how the files are distributed across the six filesystems.

**Hint:** Add the `--fullpath` flag to the `eos fileinfo` command to get the complete physical path of each replica on the FST nodes.

#### Reading replica files

When a client wants to read a file, the MGM retrieves the file metadata and points the client to one of the FSTs that stores a copy of the file.

Let's download the file we previously stored on our EOS instance:

```shell-session
[root@mgm ~]# eos cp /eos/dev/replica/my_file ~/my_file_from_eos
[eoscp] my_file                   Total 0.00 MB	|====================| 100.00 % [209.7 MB/s]
[eos-cp] copied 1/1 files and 50 MB in 0.11 seconds with 97.09 MB/s
```

Verify that the original file with the one retrieved from EOS are identical:

```shell-session
[root@mgm ~]# diff ~/my_file ~/my_file_from_eos
```

### 2. RAIN layout

**RAIN (Redundant Array of Independent Nodes)** is a fault-tolerant layout in EOS that uses erasure coding to protect data with lower storage overhead than full replication.

Instead of storing full copies, erasure coding splits each file into data blocks and parity blocks, which are distributed across multiple FST nodes. For example, a 4+2 configuration splits a file into 4 data blocks and 2 parity blocks, allowing the system to tolerate up to 2 missing blocks without data loss.

The RAIN write process involves several steps:

1. The original file is divided into multiple data blocks using erasure coding algorithms.
2. Parity blocks are computed from the data blocks to support reconstruction in case of failure.
3. Data and parity blocks are distributed across different filesystems from the same group.

Let's create a directory `/eosdev/rain` and define its layout to `raid6`, ensuring that each file stored inside it are split in 4 data blocks and 2 parity blocks:

```shell-session
[root@mgm ~]# eos mkdir /eos/dev/rain                                     # create the directory
[root@mgm ~]# eos attr -r set default=raid6 /eos/dev/rain                 # set raid6 layout
[root@mgm ~]# eos attr ls /eos/dev/rain                                   # check directory settings
sys.eos.btime="1761822399.256165363"
sys.forced.blockchecksum="crc32c"
sys.forced.blocksize="1M"
sys.forced.checksum="adler"
sys.forced.layout="raid6"
sys.forced.nstripes="6"
sys.forced.space="default"
```

Let’s create a file and upload it to the `/eos/dev/rain` directory in EOS:

```shell-session
[root@mgm ~]# dd if=/dev/urandom of=my_rain_file bs=1M count=10
[root@mgm ~]# eos cp ~/my_rain_file /eos/dev/rain
[eoscp] my_rain_file             Total 10.00 MB	|====================| 100.00 % [59.9 MB/s]]
[eos-cp] copied 1/1 files and 10.49 MB in 0.46 seconds with 22.86 MB/s
```

List the contents of the `/eos/dev/rain` directory to check that the file was uploaded:

```shell-session
[root@mgm ~]# eos ls /eos/dev/rain
my_rain_file
```

Use the `eos fileinfo` command to inspect the erasure coded file:

```shell-session
[root@mgm ~]# eos fileinfo /eos/dev/rain/my_rain_file
  File: '/eos/dev/rain/my_rain_file'  Flags: 0640
  Size: 10485760
Status: healthy
Modify: Mon Nov 10 17:00:19 2025 Timestamp: 1762786819.895897000
Change: Mon Nov 10 17:00:19 2025 Timestamp: 1762786819.226030661
Access: Mon Nov 10 17:00:19 2025 Timestamp: 1762786819.226032180
 Birth: Mon Nov 10 17:00:19 2025 Timestamp: 1762786819.226030661
  CUid: 0 CGid: 0 Fxid: 0000000b Fid: 11 Pid: 18 Pxid: 00000012
XStype: adler    XS: af 61 ca 06    ETAGs: "2952790016:af61ca06"
Layout: raid6 Stripes: 6 Blocksize: 1M LayoutId: 20640542 Redundancy: d3::t0 
  #Rep: 6
┌───┬──────┬────────────────────────┬────────────────┬────────────────┬──────────┬──────────────┬────────────┬────────┬────────────────────────┐
│no.│ fs-id│                    host│      schedgroup│            path│      boot│  configstatus│       drain│  active│                  geotag│
└───┴──────┴────────────────────────┴────────────────┴────────────────┴──────────┴──────────────┴────────────┴────────┴────────────────────────┘
 0        1             fst-1.spd.ro        default.0          /data01                        rw      nodrain   online               local::geo
 1        2             fst-1.spd.ro        default.0          /data02                        rw      nodrain   online               local::geo
 2        6             fst-3.spd.ro        default.0          /data02                        rw      nodrain   online               local::geo 
 3        4             fst-2.spd.ro        default.0          /data02                        rw      nodrain   online               local::geo                                   
 4        3             fst-2.spd.ro        default.0          /data01                        rw      nodrain   online               local::geo                       
 5        5             fst-3.spd.ro        default.0          /data01                        rw      nodrain   online               local::geo  

*******
```

In this example, the file layout is set to `raid6`, meaning that EOS splits the file into six stripes and distributes them across the six available filesystems. Because EOS writes all stripes within a single selected group, we previously placed all filesystems in the same storage group to ensure our EOS instance supports erasure coded files.

#### Reading RAIN files

Reading from RAIN storage requires reconstructing the original file from its distributed fragments:

1. The MGM identifies the locations of all required stripes.
2. Using available data stripes and parity information, EOS reconstructs the original file.
3. The system can read the stripes from different filesystems in parallel to improve performance.

Let's download the file we previously stored on our EOS instance:

```shell-session
[root@mgm ~]# eos cp /eos/dev/rain/my_rain_file ~/my_file_from_eos
[eoscp] my_rain_file             Total 10.00 MB	|====================| 100.00 % [9.3 MB/s]]
[eos-cp] copied 1/1 files and 10.49 MB in 1.51 seconds with 6.95 MB/s
```

Verify that the original file with the one retrieved from EOS are identical:

```shell-session
[root@mgm ~]# diff ~/my_rain_file ~/my_file_from_eos
```

#### Exercise

* Write other files in the `/eos/dev/rain` directory. Inspect them using the `eos fileinfo` command and observe which fileystems nodes store the stripes.
* On each storage node, `eos-fst-1`, `eos-fst-2`, and `eos-fst-3`, inspect the `/dataXY` directories to see how EOS organizes the stripes. Compare the size of individual stripes with the size of the original file.
* Create a new EOS directory and set a different RAIN layout (e.g., `raid5`). Populate the directory with files and use `eos fileinfo` to observe how the stripes are distributed across the six filesystems.

**Hint:** Add the `--fullpath` flag to the `eos fileinfo` command to display the complete physical path of each stripe on the FST nodes.

**Hin:** To check out all RAIN layouts supported by EOS, check out `eos attr -h` and look for the `sys.forced.layout` variable.

### **Key differences between Replica and RAIN layouts**
- **Storage Efficiency vs Performance**: RAIN provides greater storage efficiency by storing only fragments and parity instead of full copies. However, this comes with higher computational overhead due to the need for encoding during writes and reconstruction during reads. Replica layouts, on the other hand, are less efficient in terms of storage but offer faster and simpler access to data.
- **Fault Tolerance**: Both provide fault tolerance, but RAIN can recover from more complex failure scenarios
- **Use Cases**: Replica is ideal for frequently accessed data, while RAIN is better for large, less frequently accessed data

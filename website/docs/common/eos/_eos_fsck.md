## Error detection in EOS

Distributed storage systems are vulnerable to bit rot (the gradual degradation of stored data over time) and other incidents that can corrupt or damage files. When such issues occur, users encounter errors while trying to access the affected files.

To maintain data consistency and availability, EOS has the *FSCK (Filesystem Consistency Check) mechanism*. It can detect missing or corrupted files and when possible, it attempts to repair these issues using healthy replicas of a file stored on other filesystems. For a full description of all detected errors and how they are handled, see the (EOS documentation)[https://eos-docs.web.cern.ch/diopside/manual/microservices.html#error-types-detected-by-fsck].

To activate the FSCK mechanism in EOS, first set the interval fsck will scan the filesystems to 300 seconds (5 min):

```shell-session
[root@mgm ~]# for name in 1 2 3 4 5 6 ; do eos fs config $name scaninterval=300; done
[root@mgm ~]# eos fs status 1 | grep scaninterval              # check that scaninterval was set
scaninterval                     := 300
```

Next we need to activate collection and repair threads:
```shell-session
[root@mgm ~]# fsck config toggle-collect
```

Now the `fsck stat` command should show the two collections of threads as running:

```shell-session
[root@mgm ~]# sudo eos fsck stat
Info: collection thread status -> enabled
Info: repair thread status     -> disabled
Info: repair category          -> all
Info: best effort              -> false
251031 17:21:37 1761931297.078495 Start error collection
251031 17:21:37 1761931297.078519 Filesystems to check: 6
251031 17:21:37 1761931297.086203 Finished error collection
251031 17:21:37 1761931297.086207 Next run in 30 minutes
```

Now the FSCK mechanism will scan the filesystems every 5 minute to discover errors with files.
The filesystems are scanned at defined intervals, in our case every 5 minutes, and the errors are collected locally on each FST node. A dedicated FSCK collection thread on the MGM then gathers these results at configured intervals (by default, every 30 minutes) and assembles a comprehensive error report. If the FSCK repair thread is enabled, the MGM will automatically trigger repair actions when necessary.

#### Exercise: EOS FSCK in action

Now running the `eos fsck report` command should show nothing since all files are healthy for now. To see this FSCK error discovery and repairing mechanisms in action, let's simulate a damaged file:

* Connect to one of the FSTs file is stored and delete one of the copies of a file we previously stored
* Now wait for the FSCK mechanism to discover the issue and the file should appear as missing in the FSCK report

Once the file appears in the FSCK report, let's enable the repairing mechanism and let FSCK handle the issue:

```shell-session
[root@mgm ~]# fsck config toggle-repair
[root@mgm ~]# sudo eos fsck stat
Info: collection thread status -> enabled
Info: repair thread status     -> enabled
Info: repair category          -> all
Info: best effort              -> false
251031 17:21:37 1761931297.078495 Start error collection
251031 17:21:37 1761931297.078519 Filesystems to check: 6
251031 17:21:37 1761931297.086203 Finished error collection
251031 17:21:37 1761931297.086207 Next run in 30 minutes
```

Since FSCK repair is now activated, the file will be saved by duplicating the existing replica on the other filesystem.

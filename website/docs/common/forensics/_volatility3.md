## Memory forensics with Volatility3

The [Volatility3](https://github.com/volatilityfoundation/volatility3) framework is a modular and extensible tool for memory forensics.
Using a translation layer based on debugging symbols from the operating system, it can reconstruct the state of a system at the moment a memory capture has been taken. This type of analysis is critical as attackers eveolve to use more sophisticated threats which leave no trace on the disk.

### Installing Volatility 3

Since it is written in Python, volatility is [published on PyPi](https://pypi.org/project/volatility3/). The official installation instructions on Github use the `pip` package manager, but we recommend following Python best practices and installing it in a virtual environment, either manually managed through `venv` or with `pipx`/`uv`. We will be using `pipx`, which can be installed using your system's package manager:

```shell-session
student@lab-forensics:~$ sudo apt update && sudo apt install -y pipx python3-venv
```

Then, we can install volatility using: 

```shell-session
student@lab-forensics:~$ pipx install volatility3
Installing to existing directory '/home/student/.local/pipx/venvs/volatility3'
  installed package volatility3 2.27.0, Python 3.8.10
  These binaries are now globally available
    - vol
    - volshell
⚠️  Note: '/home/ubuntu/.local/bin' is not on your PATH environment variable. These binaries will not be globally accessible until your PATH is updated. Run `pipx ensurepath` to automatically add it, or manually modify your PATH in your shell's config file (i.e. ~/.bashrc).
done! ✨ 🌟 ✨

student@lab-forensics:~$ pipx ensurepath
Added /home/ubuntu/.local/bin to the PATH environment variable in /home/ubuntu/.bashrc

Open a new terminal to use pipx ✨ 🌟 ✨
```


### Memory Acquisition

Volatility does not handle memory acquisition. This can be done in multiple ways, depending on the nature of the analyzed system (bare metal / virtual machine, operating system).

#### Virtualized systems

If the system you want to analyze is a virtual machine AND you have access to the host (i.e. the hypervisor), this is in general an easy task. For most hypervisors, simply suspending/pausing the virtual machine will create a "state" file, which contains the content of the RAM.

For VMWare, the file has the `.vmem` extension and can be found in the same directory as the other VM files (configurations, disks). For QEMU, the file has the `.save` extension and is usually found in `/home/$USER/.config/libvirt/qemu/save` or `/var/lib/libvirt/qemu/save`.

This, while creating a cleaner RAM snapshot, will also fully disrupt the system by pausing it and making it unavailable. This is not always desirable. In an active investigation you might not want to have the attackers know you are on their tail.

For QEMU virtual machines managed through `virt-manager` there is the option of using the `virsh dump` command as seen below. 

```shell-session
ubuntu@host:~$ virsh list
 Id   Name        State
---------------------------
 9    guest1      running
 12   guest2      running
 
ubuntu@host:~$ virsh dump --help
  NAME
    dump - dump the core of a domain to a file for analysis

  SYNOPSIS
    dump <domain> <file> [--live] [--crash] [--bypass-cache] [--reset] [--verbose] [--memory-only] [--format <string>]

  DESCRIPTION
    Core dump a domain.

  OPTIONS
    [--domain] <string>  domain name, id or uuid
    [--file] <string>  where to dump the core
    --live           perform a live core dump if supported
    --crash          crash the domain after core dump
    --bypass-cache   avoid file system cache when dumping
    --reset          reset the domain after core dump
    --verbose        display the progress of dump
    --memory-only    dump domain's memory only
    --format <string>  specify the format of memory-only dump


ubuntu@host:~$ virsh dump --memory-only --live guest2 example.dmp

Domain 'guest2' dumped to example.dmp
```

While we also have the option to crash the server (or crash and restart it), there is also the  option to perform a live RAM dump with the caveat that it might generate an unclean dump, due to the memory changing during the operation.

#### All systems

If the system you want to analyze is bare metal or you don't have access to the hypervisor, your choices are either generating a crash or using specialized memory capture software.

**Generating a crash**

Both Windows and Linux systems have ways to trigger crashes and to save the RAM. For Linux, you can generate a kernel crash using the [SysRq Facility](https://en.wikipedia.org/wiki/Magic_SysRq_key) and you can use the `kdump` utility to generate a RAM dump upon crashing. Windows automatically generates a *minidump*, but it need to be [configured in order to generate a full RAM dump](https://learn.microsoft.com/en-us/troubleshoot/windows-client/performance/generate-a-kernel-or-complete-crash-dump) on a Blue Screen of Death (BSoD). Triggering a BSoD can then be done in [a few different ways](https://windowsreport.com/how-to-trigger-a-windows-10-bsod-on-demand/) with default tools or using the [NotMyFault sysinternals tool](https://learn.microsoft.com/en-us/sysinternals/downloads/notmyfault).

**Using specialized software**

Specialized software is also available for both Linux and Windows. One of the more popular options on Linux is [AVML](https://github.com/microsoft/avml). For Windows there are multiple free or commercial options (e.g. [DumpIt](https://www.magnetforensics.com/resources/magnet-dumpit-for-windows/)).


### Memory Forensics

Our focus will be on structured memory analysis - interpreting the data in the RAM as the operating system would. It requires modeling the data structures in the RAM - knowing where and how the operating system places information, either through debug symbols or reverse engineering. Volatility uses "profiles" for various operating systems in order to have this information. For Windows systems, Microsoft publishes this type of information (PDB - symbol files) which Volatility can download and translate to its internal representation. For Linux systems, since anybody can build a kernel with various configuration options, there is no single point for finding this information. Building a profile for Linux requires running a few commands ([as described here](https://medium.com/@alirezataghikhani1998/build-a-custom-linux-profile-for-volatility3-640afdaf161b)) or relying on other sources, [such as this one](https://github.com/leludo84/vol3-linux-profiles). For this lab, the required profile has been provided in the archive.


### Running volatility

Even before knowing what kind of system the RAM dump is from, you can try and identify it using volatility, as such:

```shell-session
student@lab-forensics:~/work$ vol -f memory.dmp banners
Volatility 3 Framework 2.27.0
Progress:  100.00               PDB scanning finished
Offset  Banner

0x74e00a20      Linux version 5.14.0-570.46.1.el9_6.x86_64 (mockbuild@x64-builder03.almalinux.org) (gcc (GCC) 11.5.0 20240719 (Red Hat 11.5.0-5), GNU ld version 2.35.2-63.el9) #1 SMP PREEMPT_DYNAMIC Wed Sep 24 05:41:59 EDT 2025
```

You can also call volatility with the `-h` or `--help` argument to see a list of options and **plugins.**

```shell-session
student@lab-forensics:~/work$ vol -f memory.dmp -h
usage: vol [-h] [-c CONFIG] [--parallelism [{processes,threads,off}]] [-e EXTEND] [-p PLUGIN_DIRS] [-s SYMBOL_DIRS] [-v] [-l LOG] [-o OUTPUT_DIR] [-q] [-f FILE] [--write-config] [--save-config SAVE_CONFIG]
           [--clear-cache] [--cache-path CACHE_PATH] [--offline | -u URL] [--filters FILTERS] [--hide-columns [HIDE_COLUMNS [HIDE_COLUMNS ...]]] [-r RENDERER] [--single-location SINGLE_LOCATION]
           [--stackers [STACKERS [STACKERS ...]]] [--single-swap-locations [SINGLE_SWAP_LOCATIONS [SINGLE_SWAP_LOCATIONS ...]]]
           PLUGIN ...

An open-source memory forensics framework

optional arguments:
  -h, --help            Show this help message and exit, for specific plugin options use 'vol <pluginname> --help'
  -c CONFIG, --config CONFIG
                        Load the configuration from a json file
  --parallelism [{processes,threads,off}]
                        Enables parallelism (defaults to off if no argument given)
  -e EXTEND, --extend EXTEND
                        Extend the configuration with a new (or changed) setting
  -p PLUGIN_DIRS, --plugin-dirs PLUGIN_DIRS
                        Semi-colon separated list of paths to find plugins
  -s SYMBOL_DIRS, --symbol-dirs SYMBOL_DIRS
                        Semi-colon separated list of paths to find symbols
  -v, --verbosity       Increase output verbosity
  -l LOG, --log LOG     Log output to a file as well as the console
  -o OUTPUT_DIR, --output-dir OUTPUT_DIR
                        Directory in which to output any generated files
  -q, --quiet           Remove progress feedback
  -f FILE, --file FILE  Shorthand for --single-location=file:// if single-location is not defined
  --write-config        Write configuration JSON file out to config.json
  --save-config SAVE_CONFIG
                        Save configuration JSON file to a file
  --clear-cache         Clears out all short-term cached items
  --cache-path CACHE_PATH
                        Change the default path (/home/student/.cache/volatility3) used to store the cache
  --offline             Do not search online for additional JSON files
  -u URL, --remote-isf-url URL
                        Search online for ISF json files
  --filters FILTERS     List of filters to apply to the output (in the form of [+-]columname,pattern[!])
  --hide-columns [HIDE_COLUMNS [HIDE_COLUMNS ...]]
                        Case-insensitive space separated list of prefixes to determine which columns to hide in the output if provided
  -r RENDERER, --renderer RENDERER
                        Determines how to render the output (quick, none, csv, pretty, json, jsonl, arrow, parquet)
  --single-location SINGLE_LOCATION
                        Specifies a base location on which to stack
  --stackers [STACKERS [STACKERS ...]]
                        List of stackers
  --single-swap-locations [SINGLE_SWAP_LOCATIONS [SINGLE_SWAP_LOCATIONS ...]]
                        Specifies a list of swap layer URIs for use with single-location

Plugins:
  For plugin specific options, run 'vol <plugin> --help'

  PLUGIN
    banners.Banners     Attempts to identify potential linux banners in an image
    configwriter.ConfigWriter
                        Runs the automagics and both prints and outputs configuration in the output directory.
    frameworkinfo.FrameworkInfo
                        Plugin to list the various modular components of Volatility
    isfinfo.IsfInfo     Determines information about the currently available ISF files, or a specific one
    layerwriter.LayerWriter
                        Runs the automagics and writes out the primary layer produced by the stacker.
    linux.bash.Bash     Recovers bash command history from memory.
    linux.boottime.Boottime
                        Shows the time the system was started
    linux.capabilities.Capabilities
                        Lists process capabilities
    linux.check_afinfo.Check_afinfo
                        Verifies the operation function pointers of network protocols (deprecated).
    linux.check_creds.Check_creds
                        Checks if any processes are sharing credential structures (deprecated).
    linux.check_idt.Check_idt
                        Checks if the IDT has been altered (deprecated).
    linux.check_modules.Check_modules
                        Compares module list to sysfs info, if available (deprecated).
    linux.check_syscall.Check_syscall
                        Check system call table for hooks (deprecated).
    linux.ebpf.EBPF     Enumerate eBPF programs
    linux.elfs.Elfs     Lists all memory mapped ELF files for all processes.
    linux.envars.Envars
                        Lists processes with their environment variables
    linux.graphics.fbdev.Fbdev
                        Extract framebuffers from the fbdev graphics subsystem
    linux.hidden_modules.Hidden_modules
                        Carves memory to find hidden kernel modules (deprecated).
    linux.iomem.IOMem   Generates an output similar to /proc/iomem on a running system.
    linux.ip.Addr       Lists network interface information for all devices
    linux.ip.Link       Lists information about network interfaces similar to `ip link show`
    linux.kallsyms.Kallsyms
                        Kallsyms symbols enumeration plugin.
    linux.keyboard_notifiers.Keyboard_notifiers
                        Parses the keyboard notifier call chain (deprecated).
    linux.kmsg.Kmsg     Kernel log buffer reader
    linux.kthreads.Kthreads
                        Enumerates kthread functions
    linux.library_list.LibraryList
                        Enumerate libraries loaded into processes
    linux.lsmod.Lsmod   Lists loaded kernel modules.
    linux.lsof.Lsof     Lists open files for each processes.
    linux.malfind.Malfind
                        Lists process memory ranges that potentially contain injected code (deprecated).
    linux.malware.check_afinfo.Check_afinfo
                        Verifies the operation function pointers of network protocols.
    linux.malware.check_creds.Check_creds
                        Checks if any processes are sharing credential structures
    linux.malware.check_idt.Check_idt
                        Checks if the IDT has been altered
    linux.malware.check_modules.Check_modules
                        Compares module list to sysfs info, if available
    linux.malware.check_syscall.Check_syscall
                        Check system call table for hooks.
    linux.malware.hidden_modules.Hidden_modules
                        Carves memory to find hidden kernel modules
    linux.malware.keyboard_notifiers.Keyboard_notifiers
                        Parses the keyboard notifier call chain
    linux.malware.malfind.Malfind
                        Lists process memory ranges that potentially contain injected code.
    linux.malware.modxview.Modxview
                        Centralize lsmod, check_modules and hidden_modules results to efficiently spot modules presence and taints.
    linux.malware.netfilter.Netfilter
                        Lists Netfilter hooks.
    linux.malware.tty_check.Tty_Check
                        Checks tty devices for hooks
    linux.module_extract.ModuleExtract
                        Recreates an ELF file from a specific address in the kernel
    linux.modxview.Modxview
                        Centralize lsmod, check_modules and hidden_modules results to efficiently spot modules presence and taints (deprecated).
    linux.mountinfo.MountInfo
                        Lists mount points on processes mount namespaces
    linux.netfilter.Netfilter
                        Lists Netfilter hooks (deprecated).
    linux.pagecache.Files
                        Lists files from memory
    linux.pagecache.InodePages
                        Lists and recovers cached inode pages
    linux.pagecache.RecoverFs
                        Recovers the cached filesystem (directories, files, symlinks) into a compressed tarball.
    linux.pidhashtable.PIDHashTable
                        Enumerates processes through the PID hash table
    linux.proc.Maps     Lists all memory maps for all processes.
    linux.psaux.PsAux   Lists processes with their command line arguments
    linux.pscallstack.PsCallStack
                        Enumerates the call stack of each task
    linux.pslist.PsList
                        Lists the processes present in a particular linux memory image.
    linux.psscan.PsScan
                        Scans for processes present in a particular linux image.
    linux.pstree.PsTree
                        Plugin for listing processes in a tree based on their parent process ID.
    linux.ptrace.Ptrace
                        Enumerates ptrace's tracer and tracee tasks
    linux.sockstat.Sockstat
                        Lists all network connections for all processes.
    linux.tracing.ftrace.CheckFtrace
                        Detect ftrace hooking
    linux.tracing.perf_events.PerfEvents
                        Lists performance events for each process.
    linux.tracing.tracepoints.CheckTracepoints
                        Detect tracepoints hooking
    linux.tty_check.tty_check
                        Checks tty devices for hooks (deprecated).
    linux.vmaregexscan.VmaRegExScan
                        Scans all virtual memory areas for tasks using RegEx.
    linux.vmcoreinfo.VMCoreInfo
                        Enumerate VMCoreInfo tables
                        
 [...]
 
The following plugins could not be loaded (use -vv to see why): volatility3.plugins.linux.vmayarascan, volatility3.plugins.windows.cachedump, volatility3.plugins.windows.direct_system_calls,
volatility3.plugins.windows.hashdump, volatility3.plugins.windows.indirect_system_calls, volatility3.plugins.windows.lsadump, volatility3.plugins.windows.malware.direct_system_calls,
volatility3.plugins.windows.malware.indirect_system_calls, volatility3.plugins.windows.mftscan, volatility3.plugins.windows.registry.cachedump, volatility3.plugins.windows.registry.hashdump,
volatility3.plugins.windows.registry.lsadump, volatility3.plugins.windows.vadyarascan, volatility3.plugins.yarascan
```

In order to specify the location where volatility will look for profiles, you can use the `-s` flag


### Exercise 01 - Overcoming the limitations of disk forensics

A good starting point if the attacker did not try to erase his tracks by [disabling the bash history](https://unix.stackexchange.com/questions/10922/temporarily-suspend-bash-history-on-a-given-shell) is to look at the bash history, checking for what commands were executed. Unfortunately, in the disk forensics part, we could see that the attacker deleted the bash history file (`.bash_history`). 

Volatility has a plugin that can extract the bash history from memory:

```shell-session
student@lab-forensics:~/work$ vol -f memory.dmp -s ./symbols linux.bash
Volatility 3 Framework 2.27.0
Progress:  100.00               Stacking attempts finished
PID     Process CommandTime     Command

81929   bash    2026-05-06 12:33:41.000000 UTC  su
81930   sh      2026-05-06 12:33:41.000000 UTC  ls -l /tmp/systemd-private-8e0d9aae14bc4bdf95bb6f343e0138e5-php74-php-fpm.service-wAYbLZ/tmp/
81930   sh      2026-05-06 12:33:41.000000 UTC  ls /tmp

[...]
```


:::info
**Try the command yourself, the output will be different.**

:::

#### Try and answer the following questions

* What exploit (name or CVE) did the attacker use for privilege escalation? By default, volatility checks for a root owned bash process when invoking this plugin. Check for other bash processes with the `linux.pstree` plugin.
Use the `--pid` option of the `linux.bash` plugin to extract the history from all the bash processes.
* What did the attacker download after becoming root (filename)?
* What IP did the attacker download the file from? - you can use other tools


### Exercise 02 - Recovering files

The original report you received mentioned that files uploaded by the users were encrypted.

Depending on how the files were encrypted and when they were last accessed, the originals might still be in memory, [in the page cache](https://www.cs.princeton.edu/courses/archive/fall19/cos316/lectures/11-page-cache.pdf).

Try and use the `linux.pagecache.Files` and `linux.pagecache.InodePages` plugins to extract some of the encrypted files. The first plugin will list the files (or parts of files) in the page cache, while the second can be used to dump (recover) the files. 

:::warning
**Don't worry if this fails, this is not a sure way to recover files, but it is worth trying.**

**You can extract other files for practice, including the encrypted ones.**

**If you extract the encrypted ones verify their integrity against the ones from the disk snapshot.**
:::

<details>
<summary>Hint 1</summary>

    Redirect the output of the `linux.pagecache.Files` plugin to a file. The output can be pretty large and it might be hard to search through.
</details>

<details>
<summary>Hint 2</summary>

    If you know the original filename, you can also try searching for it using the `linux.pagecache.Files` plugin. Try the `--help` argument and see how you can do it.
</details>

<details>
<summary>Hint 3</summary>

    You can also use the `linux.pagecache.RecoverFs` plugin to extract the parts of the filesystem found in memory, but this can take a while.
</details>

### Exercise 03 - Uncovering attacker infrastructure and tools

While disk forensics give us an idea of what happened in the past, memory forensics can show us what happens right now on the system, without leaving a trace on the disk - network connections and processes.

#### Try and answer the following questions

* Does the attacker have an active connection to the compromised machine? 
    <details>
    <summary>Hint 1</summary>

        The `linux.sockstat` plugin might be useful.
    </details>
* If so, what is/are the IP(s) from where the connection is initiated? What information can you gather about the IP(s)?
    <details>
    <summary>Hint 2</summary>

        What have you figured out about the compromised machine? It is an nginx webserver that uses `php-fpm` to serve PHP files. Most legitimate connections will be associated with one of those processes. What about the other connections?
    </details>
* What process can be associated with this connection? Try and find both the PID and name.
    <details>
    <summary>Hint 3</summary>

        While both the PID of the process is in the output of the `linux.sockstat` plugin, try and see what the plugins that deal with processes have to report. Give `linux.psaux`, `linux.psscan`, `linux.pslist` and `linux.pstree` a try. They can report different information and inconsistencies might help you spot suspicious processes.
    </details>
* Cross check with the bash history. Can you figure out what tool the attacker is using for the remote connection? 
* Can you find another suspicious process? Don't worry if you can't, we will take a look at it in the next section.


### Exercise 04 - Uncovering fileless malware

Fileless malware is a type of malware that leaves no traces on the filesystem. A common technique on Windows, called process hollowing, can be used to hide malicious code in the memory of another process. On Linux, a mechanism called [memory mapped file descriptors](https://circuitlabs.net/advanced-file-i-o-memory-mapped-files-mmap-munmap/) can be used to write the content of an executable directly into the memory and execute it from that same memory region, as if it were a file on disk. While this does not leave any trace on the disk, it leaves traces that can help you identify such processes.

The first is a broken link in the `/proc` filesystem where a link to the location on disk of the binary should be (`/proc/<pid>/exe`). 

```shell-session
student@lab-forensics:~/work$ ls -la /proc/349926/exe
lrwxrwxrwx 1 student student 0 May  6 18:03 /proc/349926/exe -> '/memfd: (deleted)'
```

It can also be seen in the memory map of the process.

```shell-session
student@lab-forensics:~/work$ cat /proc/349926/maps
00400000-00739000 r-xp 00000000 00:01 935801                             /memfd: (deleted)
00739000-00a94000 r--p 00339000 00:01 935801                             /memfd: (deleted)
00a94000-00aed000 rw-p 00694000 00:01 935801                             /memfd: (deleted)
00aed000-02b30000 rw-p 00000000 00:00 0
f04d8000000-f04d9400000 ---p 00000000 00:00 0
f04d9400000-f04d9c00000 rw-p 00000000 00:00 0
f04d9c00000-f04dc000000 ---p 00000000 00:00 0
7f9c383f6000-7f9c38708000 rw-p 00000000 00:00 0
7f9c38708000-7f9c38808000 rw-p 00000000 00:00 0
7f9c38808000-7f9c3881a000 rw-p 00000000 00:00 0
7f9c3881a000-7f9c3a81a000 rw-p 00000000 00:00 0
7f9c3a81a000-7f9c4c623000 ---p 00000000 00:00 0
7f9c4c623000-7f9c4c624000 rw-p 00000000 00:00 0
7f9c4c624000-7f9c6c623000 ---p 00000000 00:00 0
7f9c6c623000-7f9c6c624000 rw-p 00000000 00:00 0
7f9c6c624000-7f9c7cbdb000 ---p 00000000 00:00 0
7f9c7cbdb000-7f9c7cbdc000 rw-p 00000000 00:00 0
7f9c7cbdc000-7f9c7ec92000 ---p 00000000 00:00 0
7f9c7ec92000-7f9c7ec93000 rw-p 00000000 00:00 0
7f9c7ec93000-7f9c7f0a9000 ---p 00000000 00:00 0
7f9c7f0a9000-7f9c7f0aa000 rw-p 00000000 00:00 0
7f9c7f0aa000-7f9c7f11a000 ---p 00000000 00:00 0
7f9c7f11a000-7f9c7f17a000 rw-p 00000000 00:00 0
7ffc10b73000-7ffc10b94000 rw-p 00000000 00:00 0                          [stack]
7ffc10b97000-7ffc10b9a000 r--p 00000000 00:00 0                          [vvar]
7ffc10b9a000-7ffc10b9b000 r-xp 00000000 00:00 0                          [vdso]
ffffffffff600000-ffffffffff601000 --xp 00000000 00:00 0                  [vsyscall]
```

Using volatility, we can check for this using the `linux.elfs` plugin, which gives a similar output to the `maps` file above, but for every process in memory.

#### \[EXTRA\] Extracting a binary from a memory dump

Use the `linux.elfs` plugin to find the malware and extract the binary using the `linux.proc.Maps` plugin. 

Give [this StackOverflow question](https://stackoverflow.com/questions/1401359/understanding-linux-proc-pid-maps-or-proc-self-maps) a read to better understand the `/proc/<pid>/maps` structure and where the actual binary is located.

Dump the corresponding regions and reconstruct the binary.

The resulting binary will not be runnable, but it is good enough to do some static analysis on it. Try and run some static analysis tools to figure out the answers to the following questions. Start with a simple `strings`.

* What programming language was used when developing the malware?
    <details>
    <summary>Hint 1</summary>

        Once you figured it out try and use Ghidra with some extensions (Google it) to analyze the binary.
    </details>
* What library was used for the encryption?
* What type of encryption was used? 
* Can you find the encryption key? Is it useful / can you decrypt the data? Why (not)?

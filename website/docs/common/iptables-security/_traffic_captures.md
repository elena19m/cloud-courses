## Traffic Captures

`tcpdump` is a Linux command line utility that captures and analyzes network packets at the interface level. It is often used for troubleshooting or as a security tool. It is versatile, offers filters, and can be used in a variety of cases. Being a command line utility, it is most often used on systems that do not have a GUI, to collect data, which can then be moved and viewed with Wireshark.

Among the tcpdump options, we have:
- `-i`: the interface to listen on
- `-p`: destination port: filter by the destination port of the packets
- `-v`: verbosity level
- `-w`: the file to save the data to

To use a graphical application, you need to capture the traffic generated to `red` in a file and then copy the file to the physical machine, to analyze it with Wireshark.

The steps to follow are:
- Start tcpdump on the `usernet` interface on the `host` with the option to save the output to a file.
- Generate traffic to `red` from any of the other machines. You can use any kind of traffic (e.g. ping / ssh / telnet).
- Use `scp` to copy the output file from the host machine to `fep.grid.pub.ro` and then to the local machine.

Open the file with Wireshark.

What kind of packets did you analyze?

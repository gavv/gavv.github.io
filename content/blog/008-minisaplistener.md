+++
slug = "minisaplistener"
date = "2016-12-09"
tags = ["linux", "unix", "networking"]
title = "Using MiniSAPServer and MiniSAPListener for SAP/SDP"
+++

[MiniSAPServer](https://wiki.videolan.org/MiniSAPServer/) is a small program that periodically sends SAP/SDP messages, given a config file and destination address.

I've prepared a complementary [MiniSAPListener](https://github.com/gavv/MiniSAPListener) program which listens for SAP/SDP messages, and prints them to stdout or passes to a shell command. The source code is mostly extracted from [PulseAudio](https://www.freedesktop.org/wiki/Software/PulseAudio/) RTP receiver.

To send custom SAP/SDP messages, one should create two configuration files for MiniSAPServer, one with SAP configuration, and another with an SDP message.

*sap.cfg*

```
[global]
sap_delay=2            # send SAP packets every 2 seconds

[program]
address=224.2.127.254  # multicast address
customsdp=sdp.cfg      # SDP config
```

*sdp.cfg*

```
v=0
o=test_origin 16914 1 IN IP4 192.168.58.15
s=test_session
u=https://example.org
c=IN IP4 239.255.12.42/255
t=0 0
a=tool:miniSAPserver 0.3.8
a=type:broadcast
a=charset:UTF-8
m=audio 12345 RTP/AVP 10
```

Now we can run MiniSAPServer to send announcements:

```
$ ./sapserver -s -c sap.cfg
+ Parsing configuration file

+ 1 programs loaded
+ Packet TTL set to 255
+ Running as program.
v=0
o=test_origin 16914 1 IN IP4 192.168.58.15
s=test_session
u=https://example.org
c=IN IP4 239.255.12.42/255
t=0 0
a=tool:miniSAPserver 0.3.8
a=type:broadcast
a=charset:UTF-8
m=audio 12345 RTP/AVP 10

....
```

And MiniSAPListener will receive announcements:

```
$ ./saplisten -v
origin=test_origin session=test_session conn=239.255.12.42 host=192.168.58.15 port=12345 goodbye=0 pt=10
origin=test_origin session=test_session conn=239.255.12.42 host=192.168.58.15 port=12345 goodbye=0 pt=10
```

We can configure MiniSAPListener to invoke a shell command for every created, removed, or modified session:

*test_command.sh*

```
#! /bin/sh
echo "test_command:"
echo "  origin=$1"
echo "  session=$2"
echo "  conn=$3"
echo "  host=$4"
echo "  port=$5"
echo "  goodbye=$6"
echo "  pt=$7"
echo "  encoding=$8"
```

```
$ ./saplisten -c ./test_command.sh 
test_command:
  origin=test_origin
  session=test_session
  conn=239.255.12.42
  host=192.168.58.15
  port=12345
  goodbye=0
  pt=10
  encoding=
```

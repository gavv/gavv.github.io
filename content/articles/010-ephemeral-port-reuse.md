+++
slug = "ephemeral-port-reuse"
date = "2017-12-03"
tags = ["linux", "networking"]
title = "Ephemeral ports and SO_REUSEADDR"
+++

### Ephemeral ports

The [ephemeral port](https://en.wikipedia.org/wiki/Ephemeral_port) range is a range of ports used by the kernel when the user wants the socket to be bound to a random unused port.

In particular, `bind`, `listen`, `connect`, and `sendto` may automatically allocate an ephemeral port for AF_INET and AF_INET6 sockets. This behavior is described in the `ip_local_port_range` section of the [`ip(7)`](http://man7.org/linux/man-pages/man7/ip.7.html) man page.

This feature is not specified in POSIX but is available in many operating systems that implement BSD sockets, including Linux.

### Reusing address

Be careful when using `SO_REUSEADDR` and the port is allowed to be ephemeral.

The [`socket(7)`](http://man7.org/linux/man-pages/man7/socket.7.html) man page states the following:

```
       SO_REUSEADDR
              Indicates that the rules used in validating addresses supplied
              in a bind(2) call should allow reuse of local addresses.  For
              AF_INET sockets this means that a socket may bind, except when
              there is an active listening socket bound to the address.
```

Hence, when an ephemeral port is allocated, `SO_REUSEADDR` enables the kernel to reuse any other non-listening ephemeral port.

The important point here is that the kernel doesn't check whether there is an opened socket for an ephemeral port, it only checks whether there is a socket in the listening state for that port.

This means that the kernel is free to reuse an ephemeral port of any opened UDP socket (because `listen` is not used for datagram sockets) and any opened TCP socket for which `listen` was not called yet.

Note that when some application uses `bind` to allocate an ephemeral port for a TCP socket, and then immediately calls `listen`, there is still a short period of time when the socket is in the non-listening state.

Thus, to prevent the probability of stealing a port of a random running application, take care not to accidentally enable `SO_REUSEADDR` when using ephemeral ports, both for UDP and TCP sockets.

### Test program

I've prepared a small program demonstrating the issue: [`ephemeral_reuse.c`](https://github.com/gavv/snippets/blob/master/net/ephemeral_reuse.c)

The program opens the given number of listening or non-listening UDP or TCP sockets bound to ephemeral ports and checks whether all ports are unique or not. All sockets are kept open until the program exits.

Let's give it a try.

Create 1000 UDP sockets, disable `SO_REUSEADDR`. All ports are unique:

```
$ ./a.out 1000 udp nolisten noreuseaddr
protocol = udp
listen = no
reuseaddr = no
conflicts = 0
```

Create 1000 UDP sockets, enable `SO_REUSEADDR`. An opened port was stealed 21 times:

```
$ ./a.out 1000 udp nolisten reuseaddr
protocol = udp
listen = no
reuseaddr = yes
conflict: port[0102] = port[0122] = 34061
conflict: port[0139] = port[0204] = 36124
conflict: port[0008] = port[0248] = 33533
conflict: port[0020] = port[0286] = 47015
conflict: port[0213] = port[0404] = 50594
conflict: port[0128] = port[0406] = 59259
conflict: port[0375] = port[0462] = 43698
conflict: port[0320] = port[0607] = 39131
conflict: port[0352] = port[0760] = 48673
conflict: port[0713] = port[0762] = 35236
conflict: port[0571] = port[0770] = 59258
conflict: port[0123] = port[0810] = 41065
conflict: port[0536] = port[0819] = 50470
conflict: port[0182] = port[0851] = 52191
conflict: port[0753] = port[0856] = 46756
conflict: port[0672] = port[0858] = 44039
conflict: port[0007] = port[0903] = 47422
conflict: port[0097] = port[0928] = 47125
conflict: port[0842] = port[0934] = 39183
conflict: port[0315] = port[0942] = 60800
conflict: port[0230] = port[0998] = 40282
conflicts = 21
```

Create 7100 non-listening TCP sockets, disable `SO_REUSEADDR`. All ports are unique:

```
$ ulimit -n 10000
$ ./a.out 7100 tcp nolisten noreuseaddr
protocol = tcp
listen = no
reuseaddr = no
conflicts = 0
```

Create 7100 listening TCP sockets, enable `SO_REUSEADDR`. All ports are unique:

```
$ ulimit -n 10000
$ ./a.out 7100 tcp listen reuseaddr
protocol = tcp
listen = yes
reuseaddr = yes
conflicts = 0
```

Create 7100 non-listening TCP sockets, enable `SO_REUSEADDR`. An opened port was stealed 42 times:

```
$ ulimit -n 10000
$ ./a.out 7100 tcp nolisten reuseaddr
protocol = tcp
listen = no
reuseaddr = yes
conflict: port[0363] = port[7058] = 40937
conflict: port[5264] = port[7059] = 33537
conflict: port[6065] = port[7060] = 42069
conflict: port[1806] = port[7061] = 45957
conflict: port[1876] = port[7062] = 38849
conflict: port[6090] = port[7063] = 42155
conflict: port[5490] = port[7064] = 38647
conflict: port[4865] = port[7065] = 46569
conflict: port[4513] = port[7066] = 45537
conflict: port[3739] = port[7067] = 38319
conflict: port[2725] = port[7068] = 34301
conflict: port[4580] = port[7069] = 32807
conflict: port[0361] = port[7070] = 45011
conflict: port[2313] = port[7071] = 45897
conflict: port[0424] = port[7072] = 41923
conflict: port[3041] = port[7073] = 36329
conflict: port[3256] = port[7074] = 45633
conflict: port[1726] = port[7075] = 46483
conflict: port[6776] = port[7076] = 46487
conflict: port[5526] = port[7077] = 35263
conflict: port[1832] = port[7078] = 40733
conflict: port[5735] = port[7079] = 45167
conflict: port[2503] = port[7080] = 39915
conflict: port[3772] = port[7081] = 46113
conflict: port[2008] = port[7082] = 42091
conflict: port[6396] = port[7083] = 33845
conflict: port[1686] = port[7084] = 41317
conflict: port[0442] = port[7085] = 35267
conflict: port[3145] = port[7086] = 34915
conflict: port[4996] = port[7087] = 35381
conflict: port[5611] = port[7088] = 34413
conflict: port[2340] = port[7089] = 35225
conflict: port[6178] = port[7090] = 34697
conflict: port[4223] = port[7091] = 43477
conflict: port[4401] = port[7092] = 44133
conflict: port[0402] = port[7093] = 43581
conflict: port[3957] = port[7094] = 39753
conflict: port[0855] = port[7095] = 32859
conflict: port[0839] = port[7096] = 38731
conflict: port[5221] = port[7097] = 42147
conflict: port[0201] = port[7098] = 43873
conflict: port[6667] = port[7099] = 45859
conflicts = 42
```

**UPDATE:** As reported in comments, the last case (tcp nolisten reuseaddr) is not reprdocuing anymore on recent kernels. Here is the output for kernel 4.19.102:

```
$ ulimit -n 10000
$ ./a.out 7100 tcp nolisten reuseaddr
protocol = tcp
listen = no
reuseaddr = yes
conflicts = 0
```

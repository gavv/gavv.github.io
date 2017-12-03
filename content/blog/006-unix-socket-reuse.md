+++
slug = "unix-socket-reuse"
date = "2016-07-07 00:00:01"
tags = ["linux", "posix", "networking"]
title = "Reusing UNIX domain socket (SO_REUSEADDR for AF_UNIX)"
+++

[Unix domain sockets](https://en.wikipedia.org/wiki/Unix_domain_socket) are a networkless version of Internet sockets.

They have several advantages:

* Unix domain sockets are files, so file-system permissions may be used for them
* when one end is closed (e.g. process exits), `SIGPIPE` is delivered to another end
* performance may be up to 2x better

See details [here](http://lists.freebsd.org/pipermail/freebsd-performance/2005-February/001143.html).

### Lack of SO_REUSEADDR

A socket file is created by `bind(2)` call. If the file already exists, `EADDRINUSE` is returned.

Unlike Internet sockets (`AF_INET`), Unix domain sockets (`AF_UNIX`) doesn't have `SO_REUSEADDR`, at least on Linux and BSD. The only way to reuse a socket file is to remove it with `unlink()`.

There are two bad approaches to deal with this problem:

* We could call `unlink()` just before `bind()`.

    The problem is that if we run two instances of our process, the second one will silently remove socket used by the first one, instead of reporting a failure.

    Also, there is a race here since the socket can be created by another process between `unlink()` and `bind()`.

* We could call `unlink()` when the process exits instead.

    The problem is that if our process crashes, `unlink()` will not be called and we'll have a dangling socket.

### Using a lock file

One option is to use a lock file in addition to the socket file.

We'll use a separate lock file and never call `unlink()` on it. When a process is going to bind a socket, it first tries to acquire a lock:

* If the lock can't be acquired, it means that another process is holding the lock *now*, because kernel guarantees that the lock is released if owner process exits or crashes.

* If the lock is successfully acquired, we can safely `unlink()` the socket, because we're the only owner and no race may occur.

Example implementation:

```c
#define SOCK_PATH "/tmp/socket"
#define LOCK_PATH "/tmp/socket.lock"

int server = socket(AF_UNIX, SOCK_STREAM, 0);
if (server == -1)
    exit(1);

struct sockaddr_un server_addr;
memset(&server_addr, 0, sizeof(server_addr));

server_addr.sun_family = AF_UNIX;
strncpy(server_addr.sun_path, SOCK_PATH, sizeof(server_addr.sun_path));

// open lock file
int lock_fd = open(LOCK_PATH, O_RDONLY | O_CREAT, 0600);
if (lock_fd == -1)
    exit(1);

// try to acquire lock
int ret = flock(lock_fd, LOCK_EX | LOCK_NB);
if (ret != 0)
    exit(1);   // the lock is held by another process

// remove socket file
unlink(SOCK_PATH);

// create new socket file
ret = bind(server, (struct sockaddr *)&server_addr, sizeof(server_addr));
if (ret != 0)
    exit(1);
```

### Using abstract namespace sockets

Another option is to use Linux-specific abstract namespace sockets.

To create an abstract namespace socket, set the first byte in the `sun_path` field of the `sockaddr_un` to `\0`. See [`unix(7)`](http://man7.org/linux/man-pages/man7/unix.7.html). This socket will not be mapped to the filesystem, so it's not possible to use filesystem permissions or remove it with `unlink()`.

The advantage is that such a socket is automatically removed when the process exits, so there is no problem with socket reusing.

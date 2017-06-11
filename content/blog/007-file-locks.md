+++
slug = "file-locks"
date = "2016-07-29"
tags = ["linux", "posix", "ipc"]
title = "File locking in Linux"
+++

**Table of contents**

* [Introduction](#introduction)
* [Advisory locking](#advisory-locking)
 * [Common features](#common-features)
 * [Differing features](#differing-features)
 * [File descriptors and i-nodes](#file-descriptors-and-i-nodes)
 * [BSD locks (flock)](#bsd-locks-flock)
 * [POSIX record locks (fcntl)](#posix-record-locks-fcntl)
 * [lockf function](#lockf-function)
 * [Open file description locks (fcntl)](#open-file-description-locks-fcntl)
 * [Emulating Open file description locks](#emulating-open-file-description-locks)
 * [Command line tools](#command-line-tools)
* [Mandatory locking](#mandatory-locking)

---

## Introduction

[File locking](https://en.wikipedia.org/wiki/File_locking) is a mutual-exclusion mechanism for files. Linux supports two major kinds of file locks:

* advisory locks
* mandatory locks

Below we discuss all lock types available in POSIX and Linux and provide usage examples.

---

## Advisory locking

Traditionally, locks are [advisory](http://unix.stackexchange.com/questions/147392/what-is-advisory-locking-on-files-that-unix-systems-typically-employs) in Unix. They work only when a process explicitly acquires and releases locks, and are ignored if a process is not aware of locks.

There are several types of advisory locks available in Linux:

* BSD locks (flock)
* POSIX record locks (fcntl, lockf)
* Open file description locks (fcntl)

All locks except the `lockf` function are [reader-writer locks](https://en.wikipedia.org/wiki/Readers%E2%80%93writer_lock), i.e. support exclusive and shared modes.

Note that [`flockfile`](http://man7.org/linux/man-pages/man3/flockfile.3.html) and friends have nothing to do with the file locks. They manage internal mutex of the `FILE` object from stdio.

### Common features

The following features are common for locks of all types:

* All locks support blocking and non-blocking operations.
* Locks are allowed only on files, but not directories.
* Locks are automatically removed when the process exits or terminates. It's guaranteed that if a lock is acquired, the process acquiring the lock is still alive.

### Differing features

This table summarizes the difference between the lock types. A more detailed description and usage examples are provided below.

<table>
 <tr>
  <th></th>
  <th>BSD locks</th>
  <th>lockf function</th>
  <th>POSIX record locks</th>
  <th>Open file description locks</th>
 </tr>
 <tr>
  <th>Portability</th>
  <td>widely available</td>
  <td>POSIX (XSI)</td>
  <td>POSIX (base standard)</td>
  <td>Linux 3.15+</td>
 </tr>
 <tr>
  <th>Associated with</th>
  <td>File object</td>
  <td>[i-node, pid] pair</td>
  <td>[i-node, pid] pair</td>
  <td>File object</td>
 </tr>
 <tr>
  <th>Applying to byte range</th>
  <td>no</td>
  <td>yes</td>
  <td>yes</td>
  <td>yes</td>
 </tr>
 <tr>
  <th>Support exclusive and shared modes</th>
  <td>yes</td>
  <td>no</td>
  <td>yes</td>
  <td>yes</td>
 </tr>
 <tr>
  <th>Atomic mode switch</th>
  <td>no</td>
  <td>-</td>
  <td>yes</td>
  <td>yes</td>
 </tr>
 <tr>
  <th>Works with NFS (Linux)</th>
  <td>no</td>
  <td>yes</td>
  <td>yes</td>
  <td>yes</td>
 </tr>
</table>

### File descriptors and i-nodes

A [*file descriptor*](https://en.wikipedia.org/wiki/File_descriptor) is an index in the per-process file descriptor table (in the left of the picture). Each file descriptor table entry contains a reference to a *file object*, stored in the file table (in the middle of the picture). Each file object contains a reference to an [i-node](https://en.wikipedia.org/wiki/Inode), stored in the i-node table (in the right of the picture).

<img src="/blog/file-locks/tables.png" width="500px"/>

A file descriptor is just a number that is used to refer a file object from the user space. A file object represents an opened file. It contains things likes current read/write offset, non-blocking flag and other non-persistent state. An i-node represents a filesystem object. It contains things like file meta-information (e.g. owner and permissions) and references to data blocks.

File descriptors created by several `open()` calls for the same file path point to different file objects, but these file objects point to the same i-node. Duplicated file descriptors created by `dup2()` or `fork()` point to the same file object.

A BSD lock and an Open file description lock is associated with a file object, while a POSIX record lock is associated with an `[i-node, pid]` pair. We'll discuss it below.

### BSD locks (flock)

The simplest and most common file locks are provided by [`flock(2)`](http://man7.org/linux/man-pages/man2/flock.2.html).

Features:

* not specified in POSIX, but widely available on various Unix systems
* always lock the entire file
* associated with a file object
* do not guarantee atomic switch between the locking modes (exclusive and shared)
* do not work with NFS (on Linux)

These locks are associated with a file object, i.e.:

* duplicated file descriptors, e.g. created using `dup2` or `fork`, refer to the same lock
* distinct file descriptors, e.g. created using two `open` calls (even for the same file), refer to different locks

This is a big advantage over the POSIX record locks (see next section).

However, `flock()` doesn't guarantee atomic mode switch. From the man page:

> Converting a lock (shared to exclusive, or vice versa) is not
> guaranteed to be atomic: the existing lock is first removed, and then
> a new lock is established.  Between these two steps, a pending lock
> request by another process may be granted, with the result that the
> conversion either blocks, or fails if LOCK_NB was specified.  (This
> is the original BSD behaviour, and occurs on many other
> implementations.)

This problem is solved by other types of locks.

Usage example:

```c
#include <sys/file.h>

// acquire shared lock
if (flock(fd, LOCK_SH) == -1) {
    exit(1);
}

// non-atomically upgrade to exclusive lock
// do it in non-blocking mode, i.e. fail if can't upgrade immediately
if (flock(fd, LOCK_EX | LOCK_NB) == -1) {
    exit(1);
}

// release lock
// lock is also released automatically when close() is called or process exits
if (flock(fd, LOCK_UN) == -1) {
    exit(1);
}
```

### POSIX record locks (fcntl)

POSIX record locks, also known as process-associated locks, are provided by [`fcntl(2)`](http://man7.org/linux/man-pages/man2/fcntl.2.html), see "Advisory record locking" section in the man page.

Features:

* [specified](http://pubs.opengroup.org/onlinepubs/9699919799/functions/fcntl.html) in POSIX (base standard)
* can be applied to a byte range
* associated with an `[i-node, pid]` pair instead of a file object
* guarantee atomic switch between the locking modes (exclusive and shared)
* work with NFS (on Linux)

These locks are associated with an `[i-node, pid]` pair, which means:

* all file descriptors opened by the same process for the same file refer to the same lock (even distinct file descriptors, e.g. created using two `open()` calls)

Therefore, all process' threads always share the same lock for the same file. In particular:

* the lock acquired through some file descriptor by some thread may be released through another file descriptor by another thread;

* when any thread calls `close()` on any descriptor referring to given file, the lock is released for the whole process, even if there are other opened descriptors referring this file.

This behavior makes it inconvenient to use POSIX record locks in two scenarios:

* when you want to synchronize threads as well as processes because all threads always share the same lock

* when you're writing a library, because you don't control the whole application and can't prevent it from opening and closing independent file descriptors for the file you're locking in the library

These problems are solved by the Open file description locks.

Usage example:

```c
#include <fcntl.h>

struct flock fl;
memset(&fl, 0, sizeof(fl));

// lock in shared mode
fl.l_type = F_RDLCK;

// lock entire file
fl.l_whence = SEEK_SET; // offset base is start of the file
fl.l_start = 0;         // starting offset is zero
fl.l_len = 0;           // len is zero, which is a special value representing end
                        // of file (no matter how large the file grows in future)

// F_SETLKW specifies blocking mode
if (fcntl(fd, F_SETLKW, &fl) == -1) {
    exit(1);
}

// atomically upgrade shared lock to exclusive lock, but only
// for bytes in range [10; 15)
//
// after this call, the process will hold three lock regions:
//  [0; 10)        - shared lock
//  [10; 15)       - exclusive lock
//  [15; SEEK_END) - shared lock
fl.l_type = F_WRLCK;
fl.l_start = 10;
fl.l_len = 5;

// F_SETLKW specifies non-blocking mode
if (fcntl(fd, F_SETLK, &fl) == -1) {
    exit(1);
}

// release lock for bytes in range [10; 15)
fl.l_type = F_UNLCK;

if (fcntl(fd, F_SETLK, &fl) == -1) {
    exit(1);
}

// close file and release locks for all regions
// remember that locks are released when process calls close()
// on any descriptor for a lock file
close(fd);
```

### lockf function

[`lockf(3)`](http://man7.org/linux/man-pages/man3/lockf.3.html) function is a simplified version of POSIX record locks.

Features:

* [specified](http://pubs.opengroup.org/onlinepubs/9699919799/functions/lockf.html) in POSIX (XSI)
* can be applied to a byte range (optionally automatically expanding when data is appended in future)
* associated with an `[i-node, pid]` pair instead of a file object
* supports only exclusive locks

Since `lockf` locks are associated with an `[i-node, pid]` pair, they have the same problems as POSIX record locks described above.

The interaction between `lockf` and other types of locks is not specified by POSIX. On Linux, `lockf` is [just a wrapper](https://github.com/lattera/glibc/blob/master/io/lockf.c) for POSIX record locks.

Usage example:

```c
#include <unistd.h>

// set current position to byte 10
if (lseek(fd, 10, SEEK_SET) == -1) {
    exit(1);
}

// acquire exclusive lock for bytes in range [10; 15)
// F_LOCK specifies blocking mode
if (lockf(fd, F_LOCK, 5) == -1) {
    exit(1);
}

// release lock for bytes in range [10; 15)
if (lockf(fd, F_ULOCK, 5) == -1) {
    exit(1);
}
```

### Open file description locks (fcntl)

Open file description locks are Linux-specific and combine advantages of the BSD locks and Open file description locks. They are provided by [`fcntl(2)`](http://man7.org/linux/man-pages/man2/fcntl.2.html), see "Open file description locks (non-POSIX)" section in the man page.

Features:

* Linux-specific, not specified in POSIX
* can be applied to a byte range
* associated with a file object
* guarantee atomic switch between the locking modes (exclusive and shared)

These locks are available since the 3.15 kernel.

The API is the same as for POSIX record locks (see above). It uses `struct flock` too. The only difference is in `fcntl` command names:

* `F_OFD_SETLK` instead of `F_SETLK`
* `F_OFD_SETLKW` instead of `F_SETLKW`
* `F_OFD_GETLK` instead of `F_GETLK`

### Emulating Open file description locks

What do we have for multithreading and atomicity so far?

* BSD locks allow thread synchronization but don't allow atomic mode switch.
* POSIX record locks don't allow thread synchronization but allow atomic mode switch.
* Open file description locks allow both but are available only on recent Linux kernels.

If you need both features but can't use Open file description locks (e.g. you're using some embedded system with an outdated Linux kernel), you can *emulate* them on top of the POSIX record locks.

Here is one possible approach:

* Implement your own API for file locks. Ensure that all threads always use this API instead of using `fcntl()` directly. Ensure that threads never open and close lock-files directly.

* In the API, implement a process-wide singleton (shared by all threads) holding all currently acquired locks.

* Associate two additional objects with every acquired lock:
 * a counter
 * an RW-mutex, e.g. [`pthread_rwlock`](http://pubs.opengroup.org/onlinepubs/9699919799/functions/pthread_rwlock_destroy.html)

Now, you can implement lock operations as following:

* *Acquiring lock*

 * First, acquire the RW-mutex. If the user requested the shared mode, acquire a read lock. If the user requested the exclusive mode, acquire a write lock.
 * Check the counter. If it's zero, also acquire the file lock using `fcntl()`.
 * Increment the counter.

* *Releasing lock*

 * Decrement the counter.
 * If the counter becomes zero, release the file lock using `fcntl()`.
 * Release the RW-mutex.

This approach makes possible both thread and process synchronization.

### Command line tools

The following tools may be used to acquire and release locks from command line:

* [`flock`](http://man7.org/linux/man-pages/man1/flock.1.html)

    Provided by `util-linux` package. Uses `flock()`.

* [`lockfile`](http://linuxcommand.org/man_pages/lockfile1.html)

    Provided by `procmail` package. Uses `flock()`, `lockf()`, or `fcntl()` depending on what's available on the system.

---

## Mandatory locking

Linux has limited support for [mandatory file locking](https://www.kernel.org/doc/Documentation/filesystems/mandatory-locking.txt). See the "Mandatory locking" section in the [`fcntl(2)`](http://man7.org/linux/man-pages/man2/fcntl.2.html) man page.

A mandatory lock is activated for a file when all of these conditions are met:

* The partition was mounted with the `mand` option.
* The set-group-ID bit is on and group-execute bit is off for the file.
* A POSIX record lock is acquired.

Note that the [set-group-ID](https://en.wikipedia.org/wiki/Setuid) bit has its regular meaning of elevating privileges when the group-execute bit is on and a special meaning of enabling mandatory locking when the group-execute bit is off.

When a mandatory lock is activated, it affects regular system calls on the file:

* When an exclusive or shared lock is acquired, all system calls that *modify* the file (e.g. `open()` and `truncate()`) are blocked until the lock is released.

* When an exclusive lock is acquired, all system calls that *read* from the file (e.g. `read()`) are blocked until the lock is released.

However, the documentation mentions that current implementation is not reliable, in particular:

* races are possible when locks are acquired concurrently with `read()` or `write()`
* races are possible when using `mmap()`

Since mandatory locks are not allowed for directories and are ignored by `unlink()` and `rename()` calls, you can't prevent file deletion or renaming using these locks.

Below you can find a usage example of mandatory locking.

`fcntl_lock.c`:

```c
#include <sys/fcntl.h>
#include <unistd.h>
#include <stdio.h>
#include <stdlib.h>

int main(int argc, char **argv) {
    if (argc != 2) {
        fprintf(stderr, "usage: %s file\n", argv[0]);
        exit(1);
    }

    int fd = open(argv[1], O_RDWR);
    if (fd == -1) {
        perror("open");
        exit(1);
    }

    struct flock fl = {};
    fl.l_type = F_WRLCK;
    fl.l_whence = SEEK_SET;
    fl.l_start = 0;
    fl.l_len = 0;

    if (fcntl(fd, F_SETLKW, &fl) == -1) {  
        perror("fcntl");
        exit(1);
    }

    pause();
    exit(0);
}
```

Build `fcntl_lock`:

```
$ gcc -o fcntl_lock fcntl_lock.c
```

Mount the partition and create a file with the mandatory locking enabled:

```
$ mkdir dir
$ mount -t tmpfs -o mand,size=1m tmpfs ./dir
$ echo hello > dir/lockfile
$ chmod g+s,g-x dir/lockfile
```

Acquire a lock in the first terminal:

```
$ ./fcntl_lock dir/lockfile
(wait for a while)
^C
```

Try to read the file in the second terminal:

```
$ cat dir/lockfile
(hangs until ^C is pressed in the first terminal)
hello
```

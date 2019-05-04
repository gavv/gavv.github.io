+++
slug = "xlib-usage-examples"
date = "2016-07-05 00:00:01"
tags = ["linux", "x11"]
title = "Xlib usage examples"
+++

**Table of contents**

* [What is Xlib?](#what-is-xlib)
* [Printing pressed keys](#printing-pressed-keys)
* [Embedding window](#embedding-window)

---

## What is Xlib?

[Xlib](https://en.wikipedia.org/wiki/Xlib) (also known as libX11) is an X11 client library. It contains functions for interacting with an X server.

This page provides several code snippets implementing complete X11 programs.

---

## Printing pressed keys

The source code is available on GitHub: [`xlib_hello.c`](https://github.com/gavv/snippets/blob/master/xlib/xlib_hello.c).

The snippet creates a new window and handles X11 events:

* prints all received events to stdout
* prints pressed keys into a graphical window
* quits when the close button is pressed

Some documentation that was useful for me:

* [Xlib Programming Manual, Vol. 1](http://menehune.opt.wfu.edu/Kokua/Irix_6.5.21_doc_cd/usr/share/Insight/library/SGI_bookshelves/SGI_Developer/books/XLib_PG/sgi_html/index.html), especially [Events](http://menehune.opt.wfu.edu/Kokua/Irix_6.5.21_doc_cd/usr/share/Insight/library/SGI_bookshelves/SGI_Developer/books/XLib_PG/sgi_html/ch08.html) chapter
* [The Xlib Manual](https://tronche.com/gui/x/xlib/)
* [Window creation/X11](http://rosettacode.org/wiki/Window_creation/X11) on Rosetta Code

---

## Embedding window

The snippet implements a container window that can be used as a parent for an arbitrary X11 window.

### Window hierarchy

In X11, all windows are organized in a hierarchy, starting from a [root window](https://en.wikipedia.org/wiki/Root_window), so that every window (except root) has a parent window. Since this hierarchy is global, the child and parent windows are not required to belong to the same process.

There are two ways of setting the window parent:

* when a new window is created, its creator specifies its parent window ID
* any applications can change the parent of any window, given its window ID

The latter feature is used by [re-paranting window managers](https://en.wikipedia.org/wiki/Re-parenting_window_manager) (i.e. any modern window manager).

### Embedding

There are no special requirements for the child window that can be embedded. Almost every X11 application is already prepared for embedding its top-level window into some parent window (typically a window manager frame that contains the close button).

The parent window, however, should implement some specific event handling.

See details here:

* [Event Processing Overview](https://tronche.com/gui/x/xlib/events/processing-overview.html)
* [Changing the Parent of a Window](https://tronche.com/gui/x/xlib/window-and-session-manager/changing-window-parent.html)
* [`tkUnixEmbed.c`](https://github.com/tcltk/tk/blob/master/unix/tkUnixEmbed.c) from the Tcl/Tk source code

Some applications allow to specify the parent window ID that they will pass to `XCreateWindow` instead of the screen root when creating their window, e.g.:

* `mplayer` accepts `-wid` command line argument
* `xterm` accepts `-into` command line argument

### The snippet

The source code is available on GitHub: [`xlib_container.c`](https://github.com/gavv/snippets/blob/master/xlib/xlib_container.c).

The snippet does the following:

* creates a new window with a blue background, that will be used as a container
* forks and executes a child process, appending the container window ID to its command line arguments
* handles container-specific window events

Here is the result of embedding an `xterm` window:

```
$ ./xlib_container xterm -into
```

![](/articles/xlib-usage-examples/embedded_xterm.png)

Note the blue frame around the `xterm` window, which is the container window background.

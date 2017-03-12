+++
slug = "libudev-usb"
date = "2016-07-05 00:00:00"
tags = ["linux", "udev", "usb"]
title = "Detecting USB devices with libudev"
+++

Below you can find code snippets that match USB devices using libudev.

A good tutorial is available here: [libudev and Sysfs Tutorial](http://www.signal11.us/oss/udev/).

### Listing and monitoring USB devices

The snippet first prints all detected USB devices, and then enters monitoring mode and prints USB devices when they are inserted or removed.

Source code on GitHub: [`udev_monitor_usb.c`](https://github.com/gavv/snippets/blob/master/udev/udev_monitor_usb.c)

Example output:

```
$ ./a.out
usb usb_device exists 1d6b:0001 /dev/bus/usb/002/001
usb usb_device exists 046d:c05b /dev/bus/usb/002/002
usb usb_device exists 1d6b:0001 /dev/bus/usb/003/001
usb usb_device exists 1d6b:0001 /dev/bus/usb/004/001
usb usb_device exists 1d6b:0001 /dev/bus/usb/005/001
usb usb_device exists 1d6b:0002 /dev/bus/usb/001/001
usb usb_device    add 8564:1000 /dev/bus/usb/001/026
usb usb_device remove 0000:0000 /dev/bus/usb/001/026
^C
```

### Listing USB storage devices

The snippet prints detected USB storage devices.

Storage device is matched with the following criteria:

* current device SUBSYSTEM is "scsi" and DEVTYPE is "scsi_device"
* child device exists where SUBSYSTEM is "block"
* child device exists where SUBSYSTEM is "scsi_disk"
* parent device exists where SUBSYSTEM is "usb" and DEVTYPE is "usb_device"

Source code on GitHub: [`udev_list_usb_storage.c`](https://github.com/gavv/snippets/blob/master/udev/udev_list_usb_storage.c).

Example output:

```
$ ./a.out
block = /dev/sdb, usb = 0bc2:ab20, scsi = Seagate
```

+++
slug = "dell-xps15"
date = "2023-03-15"
tags = ["linux", "hardware", "debian", "dell"]
title = "Linux on Dell XPS 15"
+++

<a data-lightbox="roc_devicec" href="/articles/dell-xps15/dell.jpg">
  <img src="/articles/dell-xps15/dell.jpg" width="430px"/>
</a>

This is a small report and how-to on running Debian on [Dell XPS 15 9520](https://www.dell.com/en-us/shop/dell-laptops/xps-15-laptop/spd/xps-15-9520-laptop).

TL;DR:

* on the whole, it works well
* use Debian Bookworm
* be aware of poor sound quality of built-in speakers on Linux
* be aware of possible issues with dock station after hibernation

**Table of contents**

* [Installing Debian](#installing-debian)
* [Video](#video)
  * [3.5K OLED display](#35k-oled-display) <div class="small-label">WORKS</div>
  * [Touch display](#touch-display) <div class="small-label">NOT TESTED</div>
  * [Integrated Intel video card](#integrated-intel-video-card) <div class="small-label">WORKS</div>
  * [Discrete NVIDIA video card](#discrete-nvidia-video-card) <div class="small-label">NOT TESTED</div>
* [Audio](#audio)
  * [Speakers](#speakers) <div class="small-label">WORKS WITH ISSUES</div>
  * [3.5mm jack](#35mm-jack) <div class="small-label">WORKS</div>
* [Connectivity](#connectivity)
  * [Wi-Fi](#wi-fi) <div class="small-label">WORKS</div>
  * [Bluetooth](#bluetooth) <div class="small-label">WORKS</div>
* [Inputs](#inputs)
  * [Keyboard](#keyboard) <div class="small-label">WORKS</div>
  * [Touch pad](#touch-pad) <div class="small-label">WORKS</div>
  * [Fingerprint scanner](#fingerprint-scanner) <div class="small-label">NOT TESTED</div>
  * [Camera](#camera) <div class="small-label">WORKS</div>
  * [Microphone](#microphone) <div class="small-label">WORKS</div>
* [Suspend](#suspend)
  * [Suspend to disk](#suspend-to-disk) <div class="small-label">WORKS</div>
  * [Suspend to ram](#suspend-to-ram) <div class="small-label">WORKS</div>
* [Dock station](#dock-station) <div class="small-label">WORKS WITH ISSUES</div>
* [Info](#info)

----

## Installing Debian

First of all, open BIOS (press F12 after turning on) and adjust a few settings:

* set SATA mode to AHCI
* disable "Secure Boot"

Then you can boot from live USB and install Debian.

I was installing Debian Bullseye, and it did not ship drivers for Wi-Fi adapter (they are in non-free section), so I installed via Ethernet connected to dock station.

Sources: [[1]](https://github.com/825i/debian-10.4-dell-xps-9560), [[2]](https://wiki.debian.org/InstallingDebianOn/Dell/Dell%20XPS%2015%209560).

----

## Video

### 3.5K OLED display

<div class="flex_table">
  <div class="flex_th">WORKS</div>
</div>

I'm using Xfce + i3 on Debian, and I needed several tweeks to adjust apps for high resolution. I don't know whether these tweeks are needed on GNOME and KDE or on other distros.

*Note: all these changes will fully apply only after restart.*

Configure Gtk3:

* Xfce Settings > Appearance > Fonts > set "Custom DPI setting" to 96 (i.e. force default DPI)
* Xfce Settings > Appearance > Settings > set "Window Scaling" to 2x

Configure cursor:

* Xfce Settings > Mouse and Touchpad > Theme > set "Cursor size" to 48

Configure Qt:

* open `/etc/environment` and add:

    ```
    QT_SCALE_FACTOR=2
    ```

Configure X11:

* open `.Xresources` and add:

    ```
    Xft.dpi: 192
    ```

* run:

    ```
    xrdb .Xresources
    ```

    This will affect some Gtk apps that do not respect "Custom DPI setting" and "Window Scaling" settings above. In my case, Xfce "Log out" popup for some reason ignores Xfce settings, but honors Xft.dpi.

Configure LightDM [[source]](https://evren-yurtesen.blogspot.com/2017/10/lightdm-and-4k-displays.html):

* create `/usr/local/bin/setup-lightdm`, make it executable, and add the following:

    ```
    #!/bin/sh
    if [ ! -z "$DISPLAY" ]; then
      /usr/bin/xrandr --output eDP-1 --scale 0.65x0.65
    fi
    ```

* open `/etc/lightdm/lightdm.conf`, find section `[Seat:*]` and add:

    ```
    greeter-setup-script=/usr/local/bin/setup-lightdm
    session-setup-script=/usr/local/bin/setup-lightdm
    ```

    I did not find a working solution to scale login widgets properly, so I applied this workaround to scale the whole screen. It looks a bit blury, but at least it's readable.

Configure TTY [[source]](https://askubuntu.com/a/1227821/566753):

* install Terminus font:

    ```
    sudo apt install xfonts-terminus
    ```

* configure font:

    ```
    sudo dpkg-reconfigure console-setup
    ```

    Choose "UTF-8", "Latin1", "Terminus", "16x32".

Configure GRUB:

* open `/etc/default/grub` and add:

    ```
    GRUB_TERMINAL=gfxterm
    GRUB_GFXMODE=1280x1024
    GRUB_GFXPAYLOAD_LINUX=keep
    ```

* run:

    ```
    sudo update-grub
    ```

### Touch display

<div class="flex_table">
  <div class="flex_th">NOT TESTED</div>
</div>

I just disabled it in BIOS.

### Integrated Intel video card

<div class="flex_table">
  <div class="flex_th">WORKS</div>
</div>

At first I tried Debian Bullseye (currently stable), and graphics was lagging with i915 driver. Then I upgraded to Debian Bookworm (currently testing) and all issues were magically fixed.

I'm using X11.

### Discrete NVIDIA video card

<div class="flex_table">
  <div class="flex_th">NOT TESTED</div>
</div>

I tried to install `nvidia-driver` on Debian Bullseye, but got black screen after reboot. I didn't try to dig into it further.

----

## Audio

### Speakers

<div class="flex_table">
  <div class="flex_th">WORKS WITH ISSUES</div>
</div>

This laptop is claimed to have excellent sound quality, thanks to its 4 speakers, however on Linux the sound quality is actually poor, exactly because of these 4 speakers and, likely, lack of proper driver support for them.

Two related issues are known:

* In earlier kernel versions, the low frequency pair of speakers was disabled. It is fixed in kernels starting from 5.15.46.

  Links:

    * https://bugzilla.kernel.org/show_bug.cgi?id=216035
    * https://bugs.launchpad.net/ubuntu/+source/linux/+bug/1981364

* Although the  low frequency speakers are now enabled, low frequencies are still clipped and the sound very clearly feels "flat" and "cut off".

  Links:

    * https://gitlab.freedesktop.org/pipewire/pipewire/-/issues/2162
    * https://github.com/thesofproject/linux/issues/3729
    * https://bugzilla.kernel.org/show_bug.cgi?id=215233
    * https://bbs.archlinux.org/viewtopic.php?id=279883

As far as I know, this problem is specific to Linux and is not reproducing on Windows with Dell driver. I'm not aware of any solution for Linux. I've seen one [incomplete workaround](https://askubuntu.com/questions/1226485/terrible-sound-on-ubuntu-18-04-with-dell-xps-15-7590/1230889#1230889), but I didn't try it.

The resulting sound quality makes speakers bad for listening to music, however they are still pretty well for calls.

### 3.5mm jack

<div class="flex_table">
  <div class="flex_th">WORKS</div>
</div>

Nothing to say here, it just works.

----

## Connectivity

### Wi-Fi

<div class="flex_table">
  <div class="flex_th">WORKS</div>
</div>

Add `non-free` (in case of Debian Bullseye) or `non-free-firmware` (in case of Debian Bookworm) to `/etc/apt/sources.list` and run `sudo apt update`.

Then install the following packages:

```
sudo apt install firmware-iwlwifi intel-microcode firmware-misc-nonfree
```

### Bluetooth

<div class="flex_table">
  <div class="flex_th">WORKS</div>
</div>

If you're running Debian Bookworm with PipeWire, install this package:

```
sudo apt install libspa-0.2-bluetooth
```

And restart BlueZ and PipeWire:

```
sudo systemctl restart bluetooth.service
systemctl --user restart pipewire.service
```

----

## Inputs

### Keyboard

<div class="flex_table">
  <div class="flex_th">WORKS</div>
</div>

Works out of the box including backlight and Fn hotkeys.

### Touch pad

<div class="flex_table">
  <div class="flex_th">WORKS</div>
</div>

Works out of the box.

### Fingerprint scanner

<div class="flex_table">
  <div class="flex_th">NOT TESTED</div>
</div>

Never tried it.

### Camera

<div class="flex_table">
  <div class="flex_th">WORKS</div>
</div>

Works out of the box.

### Microphone

<div class="flex_table">
  <div class="flex_th">WORKS</div>
</div>

Works out of the box.

Medium sound quality, good for calls.

----

## Suspend

### Suspend to disk

<div class="flex_table">
  <div class="flex_th">WORKS</div>
</div>

Works out of the box. See also "Dock station" section.

### Suspend to ram

<div class="flex_table">
  <div class="flex_th">WORKS</div>
</div>

Works out of the box.

----

## Dock station

<div class="flex_table">
  <div class="flex_th">WORKS WITH ISSUES</div>
</div>

I'm using Dell Thunderbolt Dock WD19TBS 130W.

(I chose this one because I heard that Dell modifiction of thunderbolt with 130 Watts is needed to properly power Dell laptops with OLED displays; probably that's not fully true).

I've tried connecting dock station via USB and Thunderbolt ports. Both worked for me, but in case of USB I got a warning from BIOS (at boot time) that Thunderbolt port is recommended.

I've tested Ethernet, USB, and HDMI ports of the dock station. Everything worked out of the box.

One problem I experienced is that dock station stopped working after resuming from hibernation. I've rebooted, and USB ports of dock station started working, but HDMI didn't. After plugging and unplugging HDMI cable several time it started working too.

----

## Info

```
$ nproc
20
```

Comment: there are 20 threads and 14 cores (6 x 2-thread "performance" cores + 8 "efficient" cores).

```
$ cat /proc/cpuinfo | pastebinit
```

https://paste.debian.net/hidden/f5467bb7/

```
$ lspci -k | pastebinit
```

https://paste.debian.net/hidden/293aa32b/

```
$ lshw | pastebinit
```

https://paste.debian.net/hidden/f35a4bc8/

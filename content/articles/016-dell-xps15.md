+++
slug = "dell-xps15"
date = "2023-03-15"
tags = ["linux", "hardware", "debian", "dell"]
title = "Debian Linux on Dell XPS 15"
+++

<a data-lightbox="roc_devicec" href="/articles/dell-xps15/dell.jpg">
  <img src="/articles/dell-xps15/dell.jpg" width="430px"/>
</a>

{{% toc %}}

This is a small report and how-to on running Debian on [Dell XPS 15 9520](https://www.dell.com/en-us/shop/dell-laptops/xps-15-laptop/spd/xps-15-9520-laptop).

TL;DR:

* on the whole, it works well
* use Debian Bookworm or later
* be aware of sound quality issues of built-in speakers on Linux
* be aware of possible issues with dock station after hibernation

----

# Installing Debian

First of all, open BIOS (press F12 after turning on) and adjust a few settings:

* set SATA mode to AHCI
* disable "Secure Boot"

Then you can boot from live USB and install Debian.

I was installing Debian Bullseye, and it did not ship drivers for Wi-Fi adapter (they are in non-free section), so I installed via Ethernet connected to dock station.

Source: [[1]](https://wiki.debian.org/InstallingDebianOn/Dell/Dell%20XPS%2015%209560).

----

# Video

## 3.5K OLED display

<div class="flex_table">
  <div class="flex_th">WORKS</div>
</div>

I'm using Xfce + i3 on Debian, and I needed several tweaks to adjust apps for high resolution. I don't know whether these tweaks are needed on GNOME and KDE or on other distros.

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

Configure i3:

* just use large font size for i3, i3status, and rofi (or whatever you use)

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

    I did not find a working solution to scale login widgets properly, so I applied this workaround to scale the whole screen. It looks a bit blurry, but at least it's readable.

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

## Touch display

<div class="flex_table">
  <div class="flex_th">WORKS</div>
</div>

Works out of the box.

Didn't try to use it with dual display.

## Integrated Intel video card

<div class="flex_table">
  <div class="flex_th">WORKS</div>
</div>

At first I tried Debian Bullseye (currently stable), and graphics was lagging with i915 driver. Then I upgraded to Debian Bookworm (currently testing) and all issues were magically fixed.

I'm using X11.

## Discrete NVIDIA video card

<div class="flex_table">
  <div class="flex_th">REPORTED TO WORK</div>
</div>

I tried to install `nvidia-driver` on Debian Bullseye, but got black screen after reboot.

I didn't try to dig into it further, however people on Reddit told me that it works without issues on newer kernel and video drivers.

----

# Audio

## Speakers

<div class="flex_table">
  <div class="flex_th">WORKS WITH ISSUES</div>
</div>

In reviews, this laptop was claimed to have excellent sound quality, thanks to it's two pairs of speakers. However, in my experience on Linux, the sound quality was not so good.

Here are the known issues:

* In kernel versions below 5.15.46, the low frequency pair of speakers is not properly activated.

  Links: [[1]](https://bugzilla.kernel.org/show_bug.cgi?id=216035), [[2]](https://bugs.launchpad.net/ubuntu/+source/linux/+bug/1981364)

* In kernel versions starting from 5.15.46 and below 6.2, both pairs of speakers are employed, but for some reason the sound feels "flat".

  Links: [[1]](https://gitlab.freedesktop.org/pipewire/pipewire/-/issues/2162), [[2]](https://github.com/thesofproject/linux/issues/3729), [[3]](https://bugzilla.kernel.org/show_bug.cgi?id=215233), [[4]](https://bbs.archlinux.org/viewtopic.php?id=279883)

* In kernel versions starting from 6.2, the sound feels way better, but for my taste, I'd rate it average. I expected more, based on reviews.

As far as I know, the problems below 6.2 were specific to Linux and were not reproducing on Windows when using Dell driver. However, I don't know whether on 6.2 it sounds the same as on Windows, or still has Linux-specific issues.

In Debian Bullseye, the kernel version is 5.10. In Bookworm, it is 6.1. You can install 6.2 by yourself, but it's not stable yet. On my laptop, 6.2 causes freeze on reboot.

## 3.5mm jack

<div class="flex_table">
  <div class="flex_th">WORKS</div>
</div>

Nothing to say here, it just works.

----

# Connectivity

## Wi-Fi

<div class="flex_table">
  <div class="flex_th">WORKS</div>
</div>

Add `non-free` (in case of Debian Bullseye) or `non-free-firmware` (in case of Debian Bookworm) to `/etc/apt/sources.list` and run `sudo apt update`.

Then install the following packages:

```
sudo apt install firmware-iwlwifi intel-microcode firmware-misc-nonfree
```

## Bluetooth

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

# Inputs

## Keyboard

<div class="flex_table">
  <div class="flex_th">WORKS</div>
</div>

Works out of the box including backlight and Fn hotkeys.

## Touch pad

<div class="flex_table">
  <div class="flex_th">WORKS</div>
</div>

Works out of the box.

## Fingerprint scanner

<div class="flex_table">
  <div class="flex_th">NOT TESTED</div>
</div>

Never tried it.

## Camera

<div class="flex_table">
  <div class="flex_th">WORKS</div>
</div>

Works out of the box.

## Microphone

<div class="flex_table">
  <div class="flex_th">WORKS</div>
</div>

Works out of the box.

Medium sound quality, good for calls.

----

# Suspend

## Suspend to disk

<div class="flex_table">
  <div class="flex_th">WORKS</div>
</div>

Works out of the box. See also "Dock station" section.

## Suspend to ram

<div class="flex_table">
  <div class="flex_th">WORKS</div>
</div>

Works out of the box.

----

# Dock station

<div class="flex_table">
  <div class="flex_th">WORKS WITH ISSUES</div>
</div>

I'm using Dell Thunderbolt Dock WD19TBS 130W.

(I chose this one because I heard that Dell modification of thunderbolt with 130 Watts is needed to properly power Dell laptops with OLED displays; probably that's not fully true).

I've tried connecting dock station via USB and Thunderbolt ports. Both worked for me, but in case of USB I got a warning from BIOS (at boot time) that Thunderbolt port is recommended.

I've tested Ethernet, USB, and HDMI ports of the dock station. Everything worked out of the box.

One problem I experienced is that dock station HDMI sometimes stops working after resuming from hibernation or after reboot. It is fixed by rebooting dock station (power off and on) and then reconnecting HDMI.

----

# Info

```
$ nproc
20
```

Comment: there are 20 threads and 14 cores (6 x 2-thread "performance" cores + 8 "efficient" cores).

```
$ cat /proc/cpuinfo | gh gist create
```

https://gist.github.com/gavv/efbf569f1180672149c981f3dfdfaf3a

```
$ lspci -k | gh gist create
```

https://gist.github.com/gavv/3ff8b3d52b02613994a533702918ca9a

```
$ lshw | gh gist create
```

https://gist.github.com/gavv/4ca7b7499ace338590fdaba94e387cb0

+++
slug = "roc-tutorial"
date = "2019-08-14"
tags = ["audio", "networking", "roc"]
title = "A step-by-step tutorial for live audio streaming with Roc"
+++

<a data-lightbox="roc_devices" href="/articles/roc-tutorial/roc_devices.jpg">
  <img src="/articles/roc-tutorial/roc_devices.jpg" width="430px"/>
</a>

{{% toc %}}

---

<div class="block">
  <div class="block-header">
    UPDATE
  </div>
  You can find tutorial updated for <b>0.4.x</b> release series in <a href="/articles/roc-0.4/"><b>this article</b></a>.
</div>

# What is Roc?

Roc is an open-source toolkit for real-time audio streaming over the network. You can learn about the project here: [overview](https://roc-streaming.org/toolkit/docs/about_project/overview.html), [features](https://roc-streaming.org/toolkit/docs/about_project/features.html), [usage](https://roc-streaming.org/toolkit/docs/about_project/usage.html).

Among other things, Roc can be used as a network transport for PulseAudio, ALSA, or macOS CoreAudio,  and connect audio applications and devices across the network. Roc has the following benefits in this case:

* compared to built-in PulseAudio transports and other software that uses TCP or bare RTP, Roc can provide quite low latency and good service quality over Wi-Fi *at the same time*;

* compared to Opus-based transports, Roc can stream high-quality lossless audio and still provide loss recovery; though, Opus support is also planned and is on the way;

* Roc can interconnect audio apps and devices across different platforms and audio systems;

* Roc transparently integrates into the PulseAudio workflow and can be controlled via the usual PulseAudio GUIs, just like the built-in PulseAudio transports, but provides a better service quality on Wi-Fi.

My [earlier article](https://gavv.net/articles/new-network-transport/) describes how does Roc achieve this and provides some comparison with other software including built-in PulseAudio transports.

What can you do with this? Some examples:

* you can connect speakers to a Raspberry Pi box and stream sound from your other devices to it;

* you can also stream sound to your Android phone;

* you can set up some music server with remote control (like MPD) and then stream sound from it to other devices;

* you can set up several devices and switch between them on the fly via standard PulseAudio GUI or CLI; you can also route different apps to different devices;

* all of these can work over Wi-Fi with acceptable service quality.

This tutorial describes how to use Roc to connect audio apps and devices running on Ubuntu or macOS desktop, Raspberry Pi board, or an Android phone.

---

# What's new?

Since the [last publication](https://gavv.net/articles/roc-0.1/), I and Dmitriy have prepared two minor bugfix releases: [0.1.1](https://roc-streaming.org/toolkit/docs/development/changelog.html#version-0-1-1-jun-18-2019) and [0.1.2](https://roc-streaming.org/toolkit/docs/development/changelog.html#version-0-1-2-aug-14-2019). They fix numerous build issues reported by users, fix OpenFEC crashes and bugs in networking code, and add initial Android support.

Thanks to everyone who have reported bugs and contributed patches! Special thanks to [S-trace](https://github.com/S-trace) who has helped a lot with the [porting to Android](https://github.com/roc-streaming/roc-toolkit/issues/222).

Now we will focus on [0.2](https://github.com/roc-streaming/roc-toolkit/issues?q=is%3Aopen+is%3Aissue+milestone%3A0.2.0), which will add RTCP and RTSP support and the Control API. These protocols will open a way towards adding more audio encodings, including non-stereo channel sets, non-44100 sample rates, and Opus support. These features are planned for 0.3 release.

Longer-term plans (after 0.3) include service discovery, adaptive streaming, multi-room, a relay tool, and an Android app. These features are not scheduled to a specific release yet. I'll post updates to our [mailing list](https://roc-streaming.org/toolkit/docs/about_project/contacts.html) and to [my twitter](https://twitter.com/gavv42).

If you want to **help the project** in any way, you're highly welcome! We've prepared [contribution guidelines](https://roc-streaming.org/toolkit/docs/development/contribution_guidelines.html) and a bunch of issues tagged as ["help wanted"](https://github.com/roc-streaming/roc-toolkit/issues?q=is%3Aissue+is%3Aopen+label%3A%22help+wanted%22) and ["easy hacks"](https://github.com/roc-streaming/roc-toolkit/issues?q=is%3Aissue+is%3Aopen+label%3A%22easy+hacks%22) (see the documentation for details).

Finally, I've decided to write a step-by-step tutorial for typical usage scenarios. So here we go.

---

# Ubuntu desktop

The following instructions are suitable for Ubuntu 16.04 or later. If you're using another Linux distro, consult the [User cookbook](https://roc-streaming.org/toolkit/docs/building/user_cookbook.html) page from Roc documentation.

These instructions assume that you're using PulseAudio and want to use Roc PulseAudio modules. The full documentation for them is available [here](https://roc-streaming.org/toolkit/docs/running/pulseaudio_modules.html).

If you don't want to use PulseAudio, you can use Roc command-line tools that can work, for example, with bare ALSA. The documentation for them is available [here](https://roc-streaming.org/toolkit/docs/running/command_line_tools.html) and [here](https://roc-streaming.org/toolkit/docs/manuals.html).

## Install dependencies

```
$ sudo apt-get install g++ pkg-config scons ragel gengetopt \
    libuv1-dev libunwind-dev libpulse-dev libsox-dev libcpputest-dev \
    libtool intltool autoconf automake make cmake
```

## Clone, build, install

```
$ git clone https://github.com/roc-streaming/roc-toolkit.git
$ cd roc-toolkit
$ scons -Q --enable-pulseaudio-modules --build-3rdparty=openfec,pulseaudio
$ sudo scons -Q --enable-pulseaudio-modules --build-3rdparty=openfec,pulseaudio install
```

## Configure PulseAudio sink

Perform this step if you want to **send** sound from your computer to remote Roc receivers, for example, to send sound from a browser or an audio player to a Raspberry Pi box with speakers.

For every remote receiver, e.g. for every Raspberry Pi box running roc-recv, add the following line to **`/etc/pulse/default.pa`**:

```
load-module module-roc-sink remote_ip=<IP> sink_properties=device.description=<NAME>
```

Here, **`<IP>`** is the IP address of the Roc receiver, and **`<NAME>`** is a human-readable name that will be displayed in the PulseAudio GUI.

For example:

```
load-module module-roc-sink remote_ip=192.168.0.100 sink_properties=device.description=Raspberry
```

This will create a PulseAudio sink that sends all sound written to it to a specific Roc receiver. Local applications like browsers and audio players can then be connected to this sink using usual PulseAudio GUIs like pavucontrol.

Restart PulseAudio:

```
$ pulseaudio --kill
$ pulseaudio --start
```

## Configure PulseAudio sink-input

Perform this step if you want to **receive** sound from remote Roc senders, for example from a Roc sink on another computer, and play it on your computer.

Add the following line to **`/etc/pulse/default.pa`**:

```
load-module module-roc-sink-input sink_input_properties=media.name=<NAME>
```

Here, **`<NAME>`** is a human-readable name that will be displayed in the PulseAudio GUI.

For example:

```
load-module module-roc-sink-input sink_input_properties=media.name=Roc
```

This will create a PulseAudio sink-input that receives the sound from arbitrary Roc senders and writes it to a local sink. This sink-input can then be connected to a sink, typically a sound card, using usual PulseAudio GUIs like pavucontrol.

Restart PulseAudio:

```
$ pulseaudio --kill
$ pulseaudio --start
```

## Using pavucontrol

Here is how you can connect VLC player to a Roc **sink** named "Raspberry" (which sends sound to a Raspberry Pi box) using pavucontrol tool:


<img src="/articles/roc-tutorial/pavucontrol_roc_sink.png" width="680px"
    style="border: solid 1px; border-color: #bebab0;"/>

And here is how you can connect Roc **sink-input** named "Roc" (which receives sound from remote Roc sinks) to a specific local sound card:

<img src="/articles/roc-tutorial/pavucontrol_roc_sink_input.png" width="680px"
    style="border: solid 1px; border-color: #bebab0;"/>

## Service discovery

It would be much handier if Roc was automatically discovering receivers available in LAN and creating a Roc sink for each one, just like PulseAudio does it for its "native" tunnel sinks.

In our [roadmap](https://roc-streaming.org/toolkit/docs/development/roadmap.html), we have service discovery API and the corresponding support in tools and PulseAudio modules.

---

# Raspberry Pi (ALSA)

The following instructions are suitable for Raspberry Pi 2 and 3 with Raspbian. If you're using another board or distro, consult the [User cookbook](https://roc-streaming.org/toolkit/docs/building/user_cookbook.html), [Tested boards](https://roc-streaming.org/toolkit/docs/portability/tested_boards.html), and [Cross-compiling](https://roc-streaming.org/toolkit/docs/portability/cross_compiling.html) pages from the documentation.

These instructions assume that you want to use Docker to get a pre-packaged (binary) toolchain for cross-compiling. If you want to prepare the toolchain manually, consult the documentation above.

These instructions also assume that you're using **bare ALSA** (without PulseAudio) **on your board**. If you're using PulseAudio instead, consult the [next section](#raspberry-pi-pulseaudio).

## Install Docker

Follow the [official instructions](https://docs.docker.com/install/linux/docker-ce/ubuntu/) to install Docker from the upstream repo.

Alternatively, you can install Docker packaged by Ubuntu maintainers:

```
$ sudo apt-get install docker.io
```

## Cross-compile Roc

```
$ git clone https://github.com/roc-streaming/roc-toolkit.git
$ cd roc-toolkit
$ docker run -t --rm -u "${UID}" -v "${PWD}:${PWD}" -w "${PWD}" \
    rocproject/cross-arm-linux-gnueabihf \
      scons -Q \
        --disable-pulseaudio \
        --disable-tests \
        --host=arm-linux-gnueabihf \
        --build-3rdparty=libuv,libunwind,openfec,alsa,sox
```

## Install Roc

Copy binaries to the board:

```
$ scp ./bin/arm-linux-gnueabihf/roc-{recv,send} <ADDRESS>:
```

Here, **`<ADDRESS>`** is the IP address of your Raspberry Pi box.

## Install dependencies

To install runtime Roc dependencies, **ssh** to the box and run apt-get:

```
pi@raspberrypi:~ $ sudo apt-get install libasound2
```

## Run roc-recv

Perform this step if you want to **receive** sound from remote Roc senders, for example from a Roc sink on another computer, and play it on your Raspberry Pi box.

**ssh** to the box and run roc-recv:

```
pi@raspberrypi:~ $ /home/pi/roc-recv -vv -s rtp+rs8m::10001 -r rs8m::10002 -d alsa
```

You can test that it works by streaming to it a WAV file **from your desktop**:

```
$ roc-send -vv -s rtp+rs8m:<ADDRESS>:10001 -r rs8m:<ADDRESS>:10002 -i ./file.wav
```

Here, **`<ADDRESS>`** is the IP address of your Raspberry Pi box.

You should hear the sound now. If you didn't, check roc-recv output for errors and ensure that ALSA works on your box. Some useful commands are `alsactl init`, `alsamixer`, and `aplay`.

If everything works, you can now configure Roc sink or roc-send on your other devices to stream sound from them and play it on the Raspberry Pi box.

## Run roc-send

Perform this step if you want to **send** sound played on your Raspberry Pi box to a remote Roc receiver, for example to a Roc sink-input on another computer.

First **ssh** to the box and configure a loopback ALSA device in **`/etc/asound.conf`**:

```
pcm.aloop {
   type hw
   card 2
}

ctl.aloop {
   type hw
   card 2
}

defaults.pcm.card 2
defaults.ctl.card 2
```

Then load the loopback module:

```
pi@raspberrypi:~ $ sudo modprobe snd-aloop
```

...and run roc-send:

```
pi@raspberrypi:~ $ /home/pi/roc-send -vv -s rtp+rs8m:<ADDRESS>:10001 -r rs8m:<ADDRESS>:10002 \
    -d alsa -i 'plughw:CARD=Loopback,DEV=1'
```

Here, **`<ADDRESS>`** is the destination IP address running Roc receiver, for example, **your desktop** computer running roc-recv or Roc sink-input.

Note that the exact ALSA device name can be different. You can get the name by running `aplay -L` and searching for "Loopback" entries.

You can test that it works by running roc-recv on the computer which address you have passed to roc-send:

```
$ roc-recv -vv -s rtp+rs8m::10001 -r rs8m::10002
```

...and then playing something to the loopback device on the **Raspberry Pi** box:

```
pi@raspberrypi:~ $ aplay file.wav
```

You should hear the sound now. If you didn't, check roc-send output for errors and ensure that the loopback device works on the box. You can test it using `aplay` and `arecord` tools.

If everything works, you can now configure Roc sink-input or roc-recv on your other devices to receive and play the sound streamed from you Raspberry Pi box. On the Raspberry Pi box, you can run an audio player configured to use the loopback device.

## Add Roc to boot

If you want to run roc-recv or roc-send on boot, you can **ssh** to the box and add something like this to **/etc/rc.local**:

```
while :; do
  /home/pi/roc-recv -vv -s rtp+rs8m::10001 -r rs8m::10002 -d alsa 2>>/tmp/roc.log
done
```

If you're using roc-send with the loopback device, you can also add snd-aloop to **/etc/modules**:

```
snd-aloop
```

## Web interface?

For the single-board computer with bare ALSA it probably would be handy to have a daemon with a web interface allowing to configure and monitor Roc senders and receivers.

Such a daemon can be probably written in Go or Python or other higher-level language compared to C++.

Currently there are no plans for such a thing; however, if you think that it would be useful, please let us know. Even better, if you would like to help with this, feel free to contact us. See [contacts](https://roc-streaming.org/toolkit/docs/about_project/contacts.html) page or just leave a comment.

---

# Raspberry Pi (PulseAudio)

The following instructions are suitable for Raspberry Pi 2 and 3 with Raspbian. If you're using another board or distro, consult the [User cookbook](https://roc-streaming.org/toolkit/docs/building/user_cookbook.html), [Tested boards](https://roc-streaming.org/toolkit/docs/portability/tested_boards.html), and [Cross-compiling](https://roc-streaming.org/toolkit/docs/portability/cross_compiling.html) pages from the documentation.

These instructions assume that you want to use Docker to get a pre-packaged (binary) toolchain for cross-compiling. If you want to prepare the toolchain manually, consult the documentation above.

These instructions also assume that you're using **PulseAudio on your board**. If you're using bare ALSA instead, consult the [previous section](#raspberry-pi-alsa).

## Install Docker

Follow the [official instructions](https://docs.docker.com/install/linux/docker-ce/ubuntu/) to install Docker from the upstream repo.

Alternatively, you can install Docker packaged by Ubuntu maintainers:

```
$ sudo apt-get install docker.io
```

## Cross-compile Roc

```
$ git clone https://github.com/roc-streaming/roc-toolkit.git
$ cd roc-toolkit
$ docker run -t --rm -u "${UID}" -v "${PWD}:${PWD}" -w "${PWD}" \
    rocproject/cross-arm-linux-gnueabihf \
      scons -Q \
        --enable-pulseaudio-modules \
        --disable-tests \
        --host=arm-linux-gnueabihf \
        --build-3rdparty=libuv,libunwind,openfec,alsa,pulseaudio:<VERSION>,sox
```

Here, **`<VERSION>`** is the exact PulseAudio version installed **on your board**, e.g. "10.0". You can determine it by ssh'ing to the box and running `pulseaudio --version`.

## Install Roc

Copy binaries to the board:

```
$ scp ./bin/arm-linux-gnueabihf/libroc.so.*.* <ADDRESS>:
$ scp ./bin/arm-linux-gnueabihf/module-roc-* <ADDRESS>:
```

and then **ssh** to the box and install libroc and PulseAudio modules into the system:

```
pi@raspberrypi:~ $ mv libroc.so.*.* /usr/lib/
pi@raspberrypi:~ $ mv module-roc-* /usr/lib/pulse-<VERSION>/modules/
```

Here, **`<ADDRESS>`** is the IP address of your Raspberry Pi box, and **`<VERSION>`** is the exact PulseAudio version installed on your board.

## Install dependencies

To install runtime Roc dependencies, **ssh** to the box and run apt-get:

```
pi@raspberrypi:~ $ sudo apt-get install libasound2 libpulse0 libltdl7
```

## Configure PulseAudio sink-input

Perform this step if you want to **receive** sound from remote Roc senders, for example from a Roc sink on another computer, and play it on your Raspberry Pi box.

**ssh** to the board and add the following line to **`/etc/pulse/default.pa`**:

```
load-module module-roc-sink-input
```

This will create a PulseAudio sink-input that receives the sound from arbitrary Roc senders and writes it to a local sink. This sink-input can then be connected to a sink, typically a sound card, using PulseAudio command-line tools.

Then **ssh** to the board and restart PulseAudio:

```
pi@raspberrypi:~ $ pulseaudio --kill
pi@raspberrypi:~ $ pulseaudio --start
```

and then attach the sink-input to a sound card (PulseAudio will remember this even after restart):

```
pi@raspberrypi:~ $ pactl move-sink-input <SINK_INPUT_NUM> <SINK_NUM>
```

Here, **`<SINK_INPUT_NUM>`** is the number of Roc sink-input, and **`<SINK_NUM>`** is the number of the sound card sink. You can determine these numbers by running `pactl list sink-inputs` and `pactl list sinks`, respectively.

For example:

```
pi@raspberrypi:~ $ pactl move-sink-input 0 0
```

You can test that it works by streaming to it a WAV file **from your desktop**:

```
$ roc-send -vv -s rtp+rs8m:<ADDRESS>:10001 -r rs8m:<ADDRESS>:10002 -i ./file.wav
```

Here, **`<ADDRESS>`** is the IP address of your Raspberry Pi box.

You should hear the sound now. If you didn't, check PulseAudio log for errors and ensure that PulseAudio works on your box. It might be useful to kill PulseAudio and run in foreground with increased verbosity: `pulseaudio -vvv`.

If everything works, you can now configure Roc sink or roc-send on your other devices to stream sound from them and play it on the Raspberry Pi box.

## Configure PulseAudio sink

Perform this step if you want to **send** sound played on your Raspberry Pi box to a remote Roc receiver, for example to a Roc sink-input on another computer.

**ssh** to the board and add the following line to **`/etc/pulse/default.pa`**:

```
load-module module-roc-sink remote_ip=<IP>
```

Here, **`<IP>`** is the IP address of the Roc receiver which will receive and play the sound from the Raspberry Pi box.

For example:

```
load-module module-roc-sink remote_ip=192.168.0.100
```

This will create a PulseAudio sink that sends all sound written to it to a specific Roc receiver. Local applications like audio players can then be connected to this sink using usual PulseAudio command-line tools.

Then **ssh** to the board and restart PulseAudio:

```
pi@raspberrypi:~ $ pulseaudio --kill
pi@raspberrypi:~ $ pulseaudio --start
```

and then you can make Roc sink the default sink:

```
pi@raspberrypi:~ $ pactl set-default-sink <SINK_NUM>
```

Here, **`<SINK_NUM>`** is the number of Roc sink, which can be determined by running `pactl list sinks`.

After doing this, newly started PulseAudio clients will automatically use this sink as an audio output. PulseAudio will remember the default sink even after a restart.

You can test your setup by running roc-recv on the computer which address you have passed to module-roc-sink:

```
$ roc-recv -vv -s rtp+rs8m::10001 -r rs8m::10002
```

...and then playing something to the loopback device on the **Raspberry Pi** box:

```
pi@raspberrypi:~ $ aplay file.wav
```

You should hear the sound now. If you didn't, check PulseAudio log for errors and ensure that PulseAudio works on your box. It might be useful to kill PulseAudio and run in foreground with increased verbosity: `pulseaudio -vvv`.

If everything works, you can now configure Roc sink-input or roc-recv on your other devices to receive and play the sound streamed from you Raspberry Pi box. On the Raspberry Pi box, you can run an audio player.

---

# macOS

The following instructions are suitable for macOS 10.12 and later. If you're using an older version, consult the [User cookbook](https://roc-streaming.org/toolkit/docs/building/user_cookbook.html) page from Roc documentation.

## Prepare environment

* install Xcode Command Line Tools ([instructions](http://osxdaily.com/2014/02/12/install-command-line-tools-mac-os-x/)) or Xcode (from App Store)
* install Homebrew ([instructions](http://osxdaily.com/2018/03/07/how-install-homebrew-mac-os/))
* install Git ([instructions](https://www.atlassian.com/git/tutorials/install-git))

## Install dependencies

```
$ brew install scons ragel gengetopt sox libuv cpputest \
    libtool autoconf automake make cmake
```

## Clone, build, install

```
$ git clone https://github.com/roc-streaming/roc-toolkit.git
$ cd roc-toolkit
$ scons -Q --build-3rdparty=openfec
$ sudo scons -Q --build-3rdparty=openfec install
```

## Run roc-recv

If you want to **receive** sound from remote Roc senders, for example from a Roc sink on another computer and play it on your macOS computer, run roc-recv:

```
$ roc-recv -vv -s rtp+rs8m::10001 -r rs8m::10002
```

You can test that it works by streaming to it a WAV file:

```
$ roc-send -vv -s rtp+rs8m:<ADDRESS>:10001 -r rs8m:<ADDRESS>:10002 -i ./file.wav
```

Here, **`<ADDRESS>`** is the IP address of your macOS computer.

If everything works, you can now configure Roc sink or roc-send on your other devices to stream sound from them and play it on the macOS computer.

## Run roc-send

If you want to **send** sound played on your macOS computer to a remote Roc receiver, for example to a Raspberry Pi box, you would need to create a **virtual device**.

You can do it by [**installing Soundflower**](http://osxdaily.com/2013/02/25/record-system-audio-mac-os-x-soundflower/) (download a [**recent release here**](https://github.com/mattingalls/Soundflower/releases)).

Then you can run roc-send:

```
$ roc-send -vv -s rtp+rs8m:<ADDRESS>:10001 -r rs8m:<ADDRESS>:10002 -d coreaudio -i "Soundflower (2ch)"
```

Here, **`<ADDRESS>`** is the destination IP address running Roc receiver, and "Soundflower (2ch)" is the Soundflower device name. It can be displayed by `system_profiler SPAudioDataType` command.

You can test that it works by running roc-recv on the computer which address you have passed to roc-send:

```
$ roc-recv -vv -s rtp+rs8m::10001 -r rs8m::10002
```

...and then playing something on your macOS computer, e.g. using an audio player or a browser.

Don't forget to make the "Soundflower (2ch)" the default output device in "System Preferences -> Sound -> Output", as described in the instruction linked above.

<a data-lightbox="roc_devicec" href="/articles/roc-tutorial/macos_soundflower.jpg">
  <img src="/articles/roc-tutorial/macos_soundflower.jpg" width="500px"/>
</a>

You should hear the sound now. If you didn't, check roc-send output for errors and ensure that the Soundflower device works.

If everything works, you can now configure Roc sink-input or roc-recv on your other devices to receive and play the sound streamed from your macOS computer.

## macOS app?

It would be much handier if Roc was automatically discovering receivers available in LAN and creating a virtual device for each one, just like PulseAudio does it for its "native" tunnel sinks.

It is possible to do so by adding service discovery to Roc, adopting virtual device implementation from [Soundflower](https://github.com/mattingalls/Soundflower), and creating a macOS app that puts all these things together. The service discovery support is in our [roadmap](https://roc-streaming.org/toolkit/docs/development/roadmap.html); the rest is not so far.

If you need such an app, please let us know because currently, it's not clear how much people would use it. Even better, if you would like to help with this, feel free to contact us. See [contacts](https://roc-streaming.org/toolkit/docs/about_project/contacts.html) page or just leave a comment.

---

# Android / Termux

Android support is still work in progress and was not properly tested yet. I've tried only Roc PulseAudio sink-input (Roc receiver) module so far. It requires Termux and PulseAudio Android port to be installed on the device.

## Install Termux

Install [Termux app](https://termux.com/) from Google Play or F-Droid.

## Install PulseAudio and Roc

Open Termux on your Android device and enter these commands:

```
$ pkg install unstable-repo
$ pkg install roc
$ pkg install pulseaudio
```

It will look like this:

<a data-lightbox="roc_devicec" href="/articles/roc-tutorial/termux_pkg.jpg">
  <img src="/articles/roc-tutorial/termux_pkg.jpg" width="500px"/>
</a>

## Configure PulseAudio sink-input

Add the following line to **`/data/data/com.termux/files/usr/etc/pulse/default.pa`**:

```
load-module module-roc-sink-input
```

This will create a PulseAudio sink-input that **receives** the sound from arbitrary Roc senders and writes it to a local sound card.

Restart PulseAudio:

```
$ pulseaudio --kill
$ pulseaudio --start
```

Now you can configure Roc sink or roc-send on your other devices to stream sound from them and play it on the Android device.

## Android app?

The described solution may work but it is, obviously, not very convenient. It would be much better to have a native Android app with a GUI and do not require Termux and PulseAudio.

We have plans for an app, but there is no estimate yet.

If you need such an app, please let us know because currently, it's not clear how much people would use it. Even better, if you would like to help with this, feel free to contact us. See [contacts](https://roc-streaming.org/toolkit/docs/about_project/contacts.html) page or just leave a comment.

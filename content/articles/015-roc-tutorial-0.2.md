+++
slug = "roc-tutorial-0.2"
date = "2023-02-27"
tags = ["audio", "networking", "roc"]
title = "Updated tutorial for Roc 0.2"
+++

{{% toc %}}

---

<div class="info-block">
  <div class="info-header">
    UPDATE
  </div>
  You can find tutorial updated for <b>0.4.x</b> release series in <a href="/articles/roc-0.4/"><b>this article</b></a>.
</div>

# What's new?

This article is an updated version of [previous tutorial](https://gavv.net/articles/roc-tutorial/). An overview of the new release is [available here](https://gavv.net/articles/roc-0.2/).

There are two main changes that affect users:

* PulseAudio modules moved to a [separate repo](https://github.com/roc-streaming/roc-pulse) and have their own build system and new build instructions.
* Command-line tools now use universal URI notation for network endpoints and audio devices.

This table provides examples of old and new notation.

<table class="verbatim-table">
  <tr>
    <th>old notation</th>
    <th>new notation</th>
 </tr>
 <tr>
    <td>-s rtp+rs8m:127.0.0.1:10001</td>
    <td>-s rtp+rs8m://127.0.0.1:10001</td>
 </tr>
 <tr>
    <td>-r rs8m::10002</td>
    <td>-r rs8m://0.0.0.0:10002</td>
 </tr>
 <tr>
    <td>-d alsa -o hw:0,0</td>
    <td>-o alsa://hw:0,0</td>
 </tr>
 <tr>
    <td>-d alsa</td>
    <td>-o alsa://default</td>
 </tr>
 <tr>
    <td>-o filename.wav</td>
    <td>-o file:filename.wav</td>
 </tr>
 <tr>
    <td>-o /path/to/filename.wav</td>
    <td>-o file:///path/to/filename.wav</td>
 </tr>
 <tr>
    <td>-d wav -o filename</td>
    <td>-o file:filename.wav --output-format wav</td>
 </tr>
 <tr>
    <td>-d wav -o -</td>
    <td>-o file://- --output-format wav</td>
 </tr>
</table>

For more details, see updated [manual pages](https://roc-streaming.org/toolkit/docs/manuals.html).

---

# Linux desktop (PulseAudio)

These instructions assume that you're using PulseAudio and want to use Roc PulseAudio modules. The full documentation for them is repo's [README](https://github.com/roc-streaming/roc-pulse).

## Install dependencies

On Debian-based systems, this command will install all needed dependencies:

```
$ sudo apt install -y \
    gcc g++ make libtool intltool m4 autoconf automake \
    meson libsndfile-dev cmake scons git wget python3 \
    pulseaudio
```

## Clone, build, install

```
$ git clone https://github.com/roc-streaming/roc-pulse.git
$ cd roc-pulse
$ make
$ sudo make install
```

## Configure PulseAudio sink-input (Roc receiver)

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

## Configure PulseAudio sink (Roc sender)

Perform this step if you want to **send** sound from your computer to remote Roc receivers, for example, to send sound from a browser or an audio player to a Raspberry Pi board with speakers.

For every remote receiver, e.g. for every Raspberry Pi board running roc-recv, add the following line to **`/etc/pulse/default.pa`**:

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

## Using pavucontrol

Here is how you can connect VLC player to a Roc **sink** named "Raspberry" (which sends sound to a Raspberry Pi board) using pavucontrol tool:

<img src="/articles/roc-tutorial/pavucontrol_roc_sink.png" width="680px"
    style="border: solid 1px; border-color: #bebab0;"/>

And here is how you can connect Roc **sink-input** named "Roc" (which receives sound from remote Roc sinks) to a specific local sound card:

<img src="/articles/roc-tutorial/pavucontrol_roc_sink_input.png" width="680px"
    style="border: solid 1px; border-color: #bebab0;"/>

---

# Linux desktop (PipeWire)

## Option 1: Install PipeWire + Roc from PPA

PipeWire has builtin support for Roc ([1](https://docs.pipewire.org/page_module_roc_sink.html), [2](https://docs.pipewire.org/page_module_roc_source.html)), but it is not enabled by default in most distros, since Roc itself is not yet packaged in most of them.

For debian-based systems, there is [pipewire-debian](https://pipewire-debian.github.io/pipewire-debian/) PPA, which provides recent PipeWire with Roc modules enabled.

First, follow instructions from the PPA website. After installing PipeWire from PPA, you will automatically have PipeWire Roc modules at:

```
/usr/lib/x86_64-linux-gnu/pipewire-<VERSION>/libpipewire-module-roc-sink.so
/usr/lib/x86_64-linux-gnu/pipewire-<VERSION>/libpipewire-module-roc-source.so
```

Then, install libroc, which is used by those modules:

```
sudo apt install -y libroc
```

## Option 2: Build PipeWire Roc modules from sources

Alternatively, you can continue using PipeWire package from your distro, and build PipeWire's Roc modules separately, using PipeWire source tree.

First, install build dependencies according to [Roc documentation](https://roc-streaming.org/toolkit/docs/building/user_cookbook.html).

On Debian-based systems, this command will install all needed dependencies:

```
$ sudo apt-get install build-essential g++ pkg-config scons ragel gengetopt \
    libuv1-dev libunwind-dev libspeexdsp-dev libsox-dev libssl-dev libpulse-dev \
    libtool intltool autoconf automake make cmake meson git
```

Clone Roc sources:

```
$ git clone https://github.com/roc-streaming/roc-toolkit.git
```

Build and install Roc:

```
$ cd roc-toolkit
$ scons -Q --build-3rdparty=openfec
$ sudo scons -Q --build-3rdparty=openfec install
```

Then install build dependencies according to [PipeWire CI](https://gitlab.freedesktop.org/pipewire/pipewire/-/blob/master/.gitlab-ci.yml).

On Debian-based systems, this command will install all needed dependencies:

```
$ sudo apt-get install \
    findutils git systemd \
    libasound2-dev libavcodec-dev libavformat-dev libva-dev libglib2.0-dev libgstreamer1.0-dev \
    libdbus-1-dev libdbus-glib-1-dev libudev-dev libx11-dev \
    meson ninja-build pkg-config \
    python3-pip python3-docutils
```

Clone PipeWire sources:

```
$ git clone https://gitlab.freedesktop.org/pipewire/pipewire.git
```

Checkout version which is used on your system:

```
$ cd pipewire
$ git checkout $(pipewire --version | grep -Eo '[0-9.]+' | head -1)
```

Build PipeWire and all modules:

```
$ meson setup builddir
$ meson configure builddir -Dprefix=/usr
$ meson compile -C builddir
```

Install Roc modules into the system:

```
$ sudo cp builddir/src/modules/libpipewire-module-roc-sink.so <PIPEWIRE_MODULE_DIR>/
$ sudo cp builddir/src/modules/libpipewire-module-roc-source.so <PIPEWIRE_MODULE_DIR>/
```

For example, on Debian-based x86_64 systems with PipeWire 0.3.x, **`PIPEWIRE_MODULE_DIR`** is **`/usr/lib/x86_64-linux-gnu/pipewire-0.3`**.

## Configure PipeWire source (Roc receiver)

Perform this step if you want to **receive** sound from remote Roc senders, for example from a Roc sink on another computer, and play it on your computer.

First, ensure that you have pipewire configuration directory:

```
$ mkdir -p ~/.config/pipewire/pipewire.conf.d
```

Then, create **`~/.config/pipewire/pipewire.conf.d/roc-source.conf`** and add the following:

```
context.modules = [
  {   name = libpipewire-module-roc-source
      args = {
          local.ip = 0.0.0.0
          resampler.profile = medium
          fec.code = rs8m
          sess.latency.msec = 100
          local.source.port = 10001
          local.repair.port = 10002
          source.name = "Roc Source"
          source.props = {
             node.name = "roc-source"
          }
      }
  }
]
```

Then restart PipeWire:

```
$ systemctl restart --user pipewire.service
```

Now you should see Roc Source in the list of loaded modules:

```
$ pw-cli ls Module
	...
	id 28, type PipeWire:Interface:Module/3
 		object.serial = "28"
 		module.name = "libpipewire-module-roc-source"
```

After doing this, if remote Roc sender will send samples to your computer, it will be played.

## Configure PipeWire sink (Roc sender)

Perform this step if you want to **send** sound from your computer to remote Roc receivers, for example, to send sound from a browser or an audio player to a Raspberry Pi board with speakers.

First, ensure that you have pipewire configuration directory:

```
$ mkdir -p ~/.config/pipewire/pipewire.conf.d
```

Then, create **`~/.config/pipewire/pipewire.conf.d/roc-sink.conf`** and add the following:

```
context.modules = [
  {   name = libpipewire-module-roc-sink
      args = {
          fec.code = rs8m
          remote.ip = <IP>
          remote.source.port = 10001
          remote.repair.port = 10002
          sink.name = "Roc Sink"
          sink.props = {
             node.name = "roc-sink"
          }
      }
  }
]
```

Here, **`<IP>`** is the IP address of the Roc receiver.

Then restart PipeWire:

```
$ systemctl restart --user pipewire.service
```

Now you should see Roc Source in the list of loaded modules:

```
$ pw-cli ls Module
	...
	id 29, type PipeWire:Interface:Module/3
 		object.serial = "29"
 		module.name = "libpipewire-module-roc-sink"
```

After doing this, if you select "ROC Sink" as the output device, sound written to it will be send to remote Roc receiver.

---

# Raspberry Pi (ALSA)

The following instructions are suitable for Raspberry Pi 2 and later. If you're using another board, consult the [User cookbook](https://roc-streaming.org/toolkit/docs/building/user_cookbook.html)  and [Cross-compiling](https://roc-streaming.org/toolkit/docs/portability/cross_compiling.html) pages from the documentation.

These instructions assume that you want to use Docker to get a pre-packaged (binary) toolchain for cross-compiling. If you want to prepare the toolchain manually, consult the documentation above.

These instructions also assume that you're using **bare ALSA** (without PulseAudio) **on your board**. If you're using PulseAudio instead, consult the [next section](#raspberry-pi-pulseaudio).

## Are you running 32-bit or 64-bit OS on Raspberry?

On your Raspberry board, both CPU and OS may be either 32-bit or 64-bit. What is important is the bitness of OS. If you're not sure, run:

```
pi@raspberrypi:~ $ uname -m
```

on your board. If the output is `aarch64`, the the OS is 64-bit. If the output is `arm*` then it's 32-bit.

## Install dependencies on Raspberry

To install runtime Roc dependencies, **ssh** to the board and run apt-get:

```
pi@raspberrypi:~ $ sudo apt-get install libasound2
```

## Install Docker on desktop machine

Follow the [official instructions](https://docs.docker.com/engine/install/) to install Docker from the upstream repo.

If you're running Ubuntu on your desktop, you can also install Docker packaged by distro:

```
$ sudo apt-get install docker.io
```

## Cross-compile Roc tools on desktop machine (for 64-bit Raspberry)

```
$ git clone https://github.com/roc-streaming/roc-toolkit.git
$ cd roc-toolkit
$ docker run -t --rm -u "${UID}" -v "${PWD}:${PWD}" -w "${PWD}" \
    rocstreaming/toolchain-aarch64-linux-gnu:gcc-7.4 \
      scons -Q \
        --host=aarch64-linux-gnu \
        --build-3rdparty=all \
        --disable-pulseaudio
```

## Install Roc tools (to 64-bit Raspberry)

Copy command-line tools to the board via ssh:

```
$ scp ./bin/aarch64-linux-gnu/roc-{recv,send} <IP>:/usr/bin
```

Here, **`<IP>`** is the IP address of your Raspberry Pi board.

## Cross-compile Roc tools on desktop machine (for 32-bit Raspberry)

```
$ git clone https://github.com/roc-streaming/roc-toolkit.git
$ cd roc-toolkit
$ docker run -t --rm -u "${UID}" -v "${PWD}:${PWD}" -w "${PWD}" \
    rocstreaming/toolchain-arm-linux-gnueabihf:gcc-4.9 \
      scons -Q \
        --host=arm-linux-gnueabihf \
        --build-3rdparty=all \
        --disable-pulseaudio
```

## Install Roc tools (to 32-bit Raspberry)

Copy command-line tools to the board via ssh:

```
$ scp ./bin/arm-linux-gnueabihf/roc-{recv,send} <IP>:/usr/bin
```

Here, **`<IP>`** is the IP address of your Raspberry Pi board.

## Run roc-recv on Raspberry (Roc receiver)

Perform this step if you want to **receive** sound from remote Roc senders, for example from a Roc sink on another computer, and play it on your Raspberry Pi board.

**ssh** to the board and run roc-recv:

```
pi@raspberrypi:~ $ /usr/bin/roc-recv -vv \
    -s rtp+rs8m://0.0.0.0:10001 -r rs8m://0.0.0.0:10002 -c rtcp://0.0.0.0:10003 \
    -o alsa://default
```

Instead of `alsa://default`, you can use `alsa://<DEVICE>`, where `DEVICE` is one of the names printed by `aplay -l`.

If you want to automatically start `roc-recv` on boot, create **`/etc/systemd/system/roc-recv.service`** with the following content:

```
[Unit]
Description=roc-recv
After=network-online.target
Wants=network-online.target systemd-networkd-wait-online.service

[Service]
ExecStart=/usr/bin/roc-recv -vv -s rtp+rs8m://0.0.0.0:10001 -r rs8m://0.0.0.0:10002 -c rtcp://0.0.0.0:10003
Restart=on-failure
RestartSec=1s

[Install]
WantedBy=multi-user.target
```

Then run:

```
pi@raspberrypi:~ $ sudo systemctl daemon-reload
pi@raspberrypi:~ $ sudo systemctl enable --now roc-recv.service
```

## Run roc-send on Raspberry (Roc sender)

Perform this step if you want to **send** sound played on your Raspberry Pi board to a remote Roc receiver, for example to a Roc sink-input on another computer.

First **ssh** to the board and configure a loopback ALSA device in **`/etc/asound.conf`**:

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
pi@raspberrypi:~ $ /home/pi/roc-send -vv \
    -s rtp+rs8m://<IP>:10001 -r rs8m://<IP>:10002 -c rtcp://<IP>:10003 \
    -i alsa://plughw:CARD=Loopback,DEV=1
```

Here, **`<IP>`** is the destination IP address running Roc receiver, for example, **your desktop** computer running Roc receiver.

Note that the exact ALSA device name can be different. You can get the name by running `aplay -L` and searching for "Loopback" entries.

If you want to automatically start `roc-send` on boot, create **`/etc/systemd/system/roc-send.service`** with the following content:

```
[Unit]
Description=roc-send
After=network-online.target
Wants=network-online.target systemd-networkd-wait-online.service

[Service]
ExecStart=/usr/bin/roc-send -vv -s rtp+rs8m://<IP>:10001 -r rs8m://<IP>:10002 -c rtcp://<IP>:10003 -i alsa://<DEVICE>
Restart=on-failure
RestartSec=1s

[Install]
WantedBy=multi-user.target
```

Then run:

```
pi@raspberrypi:~ $ sudo systemctl daemon-reload
pi@raspberrypi:~ $ sudo systemctl enable --now roc-send.service
```

You should also add snd-aloop to **`/etc/modules`**:

```
snd-aloop
```

---

# Raspberry Pi (PulseAudio)

The following instructions are suitable for Raspberry Pi 2 and later. If you're using another board, consult the [User cookbook](https://roc-streaming.org/toolkit/docs/building/user_cookbook.html)  and [Cross-compiling](https://roc-streaming.org/toolkit/docs/portability/cross_compiling.html) pages from the documentation.

These instructions assume that you want to use Docker to get a pre-packaged (binary) toolchain for cross-compiling. If you want to prepare the toolchain manually, consult the documentation above.

These instructions also assume that you're using **PulseAudio on your board**. If you're using bare ALSA instead, consult the [previous section](#raspberry-pi-alsa).

## Are you running 32-bit or 64-bit OS on Raspberry?

On your Raspberry board, both CPU and OS may be either 32-bit or 64-bit. What is important is the bitness of OS. If you're not sure, run:

```
pi@raspberrypi:~ $ uname -m
```

on your board. If the output is `aarch64`, the the OS is 64-bit. If the output is `arm*` then it's 32-bit.

## Which PulseAudio version are you running on Raspberry?

It's important to build Roc PulseAudio modules against exactly same version of PulseAudio which is running on your board. If you're not sure, run:

```
pi@raspberrypi:~ $ pulseaudio --version
```

## Install dependencies on Raspberry

To install runtime Roc dependencies, **ssh** to the board and run apt-get:

```
pi@raspberrypi:~ $ sudo apt-get install libasound2 libpulse0 libltdl7
```

## Install Docker on desktop machine

Follow the [official instructions](https://docs.docker.com/engine/install/) to install Docker from the upstream repo.

If you're running Ubuntu on your desktop, you can also install Docker packaged by distro:

```
$ sudo apt-get install docker.io
```

## Cross-compile Roc PulseAudio modules on desktop machine (for 64-bit Raspberry)

```
$ git clone https://github.com/roc-streaming/roc-pulse.git
$ cd roc-pulse
$ docker run -t --rm -u "${UID}" -v "${PWD}:${PWD}" -w "${PWD}" \
    rocstreaming/toolchain-aarch64-linux-gnu:gcc-7.4 \
        env TOOLCHAIN_PREFIX=aarch64-linux-gnu PULSEAUDIO_VERSION=<???> make
```

You should replace `<???>` with the exact version of PulseAudio which you're using on your Raspberry Pi board, for example `15.99.1`.

## Cross-compile Roc PulseAudio modules on desktop machine (for 32-bit Raspberry)

```
$ git clone https://github.com/roc-streaming/roc-pulse.git
$ cd roc-pulse
$ docker run -t --rm -u "${UID}" -v "${PWD}:${PWD}" -w "${PWD}" \
    rocstreaming/toolchain-arm-linux-gnueabihf:gcc-4.9 \
        env TOOLCHAIN_PREFIX=arm-linux-gnueabihf PULSEAUDIO_VERSION=<???> make
```

You should replace `<???>` with the exact version of PulseAudio which you're using on your Raspberry Pi board, for example `15.99.1`.

## Install Roc PulseAudio modules to Raspberry

Copy command-line tools to the board via ssh:

```
$ scp ./bin/module-roc-*.so <IP>:/usr/lib/pulse-<PULSE_VER>/modules/
```

Here, **`<IP>`** is the IP address of your Raspberry Pi board, and **`<PULSE_VER>`** is the version of PulseAudio which you're using on your Raspberry Pi board, for example `15.99.1`.

## Configure PulseAudio sink-input (Roc receiver)

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

## Configure PulseAudio sink (Roc sender)

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

---

# macOS

The following instructions are suitable for macOS 10.12 and later. If you're using an older version, consult the [User cookbook](https://roc-streaming.org/toolkit/docs/building/user_cookbook.html) page from Roc documentation.

## Prepare environment

* install Xcode Command Line Tools ([instructions](http://osxdaily.com/2014/02/12/install-command-line-tools-mac-os-x/)) or Xcode (from App Store)
* install Homebrew ([instructions](http://osxdaily.com/2018/03/07/how-install-homebrew-mac-os/))
* install Git ([instructions](https://www.atlassian.com/git/tutorials/install-git))

## Install dependencies

```
$ brew install pkg-config scons ragel gengetopt libuv speexdsp sox \
    libtool autoconf automake make cmake
```

## Clone, build, install

```
$ git clone https://github.com/roc-streaming/roc-toolkit.git
$ cd roc-toolkit
$ scons -Q --build-3rdparty=openfec
$ sudo scons -Q --build-3rdparty=openfec install
```

## Run roc-recv (Roc receiver)

If you want to **receive** sound from remote Roc senders, for example from a Roc sink on another computer and play it on your macOS computer, run roc-recv:

```
$ roc-recv -vv -s rtp+rs8m://0.0.0.0:10001 -r rs8m://0.0.0.0:10002 -c rtcp://0.0.0.0:10003
```

## Run roc-send (Roc sender)

If you want to **send** sound played on your macOS computer to a remote Roc receiver, for example to a Raspberry Pi box, you would need to create a **virtual device**.

You can do it by [**installing Soundflower**](http://osxdaily.com/2013/02/25/record-system-audio-mac-os-x-soundflower/) (download a [**recent release here**](https://github.com/mattingalls/Soundflower/releases)).

Then you can run roc-send:

```
$ roc-send -vv -s rtp+rs8m://<IP>:10001 -r rs8m://<IP>:10002 -c rtcp://<IP>:10003 -i "core://Soundflower (2ch)"
```

Here, **`<IP>`** is the destination IP address running Roc receiver, and "Soundflower (2ch)" is the Soundflower device name. It can be displayed by `system_profiler SPAudioDataType` command.

Don't forget to make the "Soundflower (2ch)" the default output device in "System Preferences -> Sound -> Output", as described in the instruction linked above.

<a data-lightbox="roc_devicec" href="/articles/roc-tutorial/macos_soundflower.jpg">
  <img src="/articles/roc-tutorial/macos_soundflower.jpg" width="500px"/>
</a>

---

# Android

To run Roc receiver and sender on Android device, you can use [Roc Droid](https://github.com/roc-streaming/roc-droid/) project.

You can download prebuilt APK for [latest release](https://github.com/roc-streaming/roc-droid/releases), or build it from source by following instructions in README. Then just follow instructions within the app.

The app can work in two modes:

* receive sound from remote Roc sender, and play it on Android
* grab sound, either from currently playing Android apps, or from microphone, and send it to remote Roc receiver

<img src="https://raw.githubusercontent.com/roc-streaming/roc-droid/master/screenshot.webp" width="250px"/>

---

# Troubleshooting

## Sound

Before running Roc tools on Raspberry, ensure that sound is working on your board using `aplay` or `arecord`. Other useful commands are `alsamixer` and `alsactl init`, but their usage it out of the scope of this tutorial.

## Network

When you run Roc sender and Roc receiver, you should see information about connected sender in receiver's logs. If you don't, it indicates problems with network connection, e.g. you used incorrect address or port.

## Logs

Command-line tools write logs to standard output, if you specify `-vv` option. If you're using systemd to run them, logs can be seen using `journalctl`.

To see logs from PulseAudio modules, you can run daemon manually in terminal using `pulseaudio -vvv` command.

## Stuttering

If you hear stuttering, you can increase latency by using `sess_latency_msec=200` (for PulseAudio module), or `sess.latency.msec=200` (for PipeWire module), or `--sess-latency=200ms` (for command-line tool) on the receiver side. In this example, you set latency to 200 milliseconds; you may need higher value, depending on quality of your network.

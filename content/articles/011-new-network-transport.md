+++
slug = "new-network-transport"
date = "2019-05-03"
tags = ["linux", "audio", "networking", "roc"]
title = "Working on a new network transport for PulseAudio and ALSA"
+++

## Intro

Last few years I was working on [Roc](https://roc-project.github.io/), an open-source toolkit for real-time media streaming over the network. Due to lack of free time, we postponed release several times, but now it's almost ready. This article is, inter alia, some kind of a pre-release announcement.

You can read more about the project [here](https://roc-project.github.io/roc/docs/about_project.html). The project scope is quite wide. It provides a general-purpose library and tools that can be used in numerous use-cases. However, to start with something feasible and practical, we decided to focus the first few releases on the home audio use-case.

Other tools exist that solve the same or similar tasks, including built-in PulseAudio transports. However, they usually don't provide a good service quality when the latency is not high (I've tested latencies from 100 to 300 ms so far) and the network is not reliable (in particular on Wi-Fi). This is the use-case where Roc can help you.

Roc has the following tools for home audio:

* Two command-line tools, the first reads a stream from an audio device and transmits it to the network, and the second receives the stream and plays it. These tools can be used with PulseAudio, with bare ALSA, with macOS CoreAudio, and probably with other backends too.

* PulseAudio sink and sink input that virtually do the same but provide seamless integration into the usual PulseAudio workflow.

This article explains what features are available in Roc, how it is compared to the other software, how to use it, and what plans we have.

## Example setup

Here is my demo setup:

* An Orange Pi box with an external Wi-Fi antenna, a USB soundcard, and large speakers. It runs PulseAudio with a Roc sink input.

* Two Raspberry Pi boxes with internal Wi-Fi antennas and smaller speakers. They both run bare ALSA (without PulseAudio) and the roc-recv command-line tool.

* A laptop running PulseAudio with three Roc sinks, one for each box.

<div style="display: flex; padding-top: 5px; padding-bottom: 5px;">
  <div style="margin-right: 5px;">
    <div>
      <a data-lightbox="opi-l2" href="/articles/new-network-transport/photos/opi-l2.jpg">
        <img src="/articles/new-network-transport/photos/opi-l2.jpg"/>
      </a>
    </div>
    <i>Orange Pi Lite2</i>
  </div>
  <div style="margin-left: 5px; margin-right: 5px;">
    <div>
      <a data-lightbox="rpi-3b" href="/articles/new-network-transport/photos/rpi-3b.jpg">
        <img src="/articles/new-network-transport/photos/rpi-3b.jpg"/>
      </a>
    </div>
    <i>Raspberry Pi 3B</i>
  </div>
  <div style="margin-left: 5px;">
    <div>
      <a data-lightbox="rpi-zw" href="/articles/new-network-transport/photos/rpi-zw.jpg">
        <img src="/articles/new-network-transport/photos/rpi-zw.jpg"/>
      </a>
    </div>
    <i>Raspberry Pi Zero W</i>
  </div>
</div>

All three boxes and the laptop are connected to the wireless LAN. The latency is configured to 100ms on the Roc sink input on the Orange Pi box and to 150ms on the roc-recv instances on the Raspberry Pi boxes.

Each box has a corresponding Roc sink on the laptop. It allows connecting any audio application running on the laptop to any box via usual PulseAudio GUIs like pavucontrol.

Here is a video demonstrating this:

<div class="youtube">
  <iframe src="https://www.youtube.com/embed/W0oS8mqTWYM">
  </iframe>
</div>

## Design overview

Real-time streaming has the following implications:

* the latency should be constant;
* the latency should be low;
* the real-time input on the sender and real-time output on the receiver (e.g. soundcards) may have different clock domains.

Roc achieves this as follows:

* The sender sends samples at a constant rate. The receiver first accumulates samples in the incoming queue until its size becomes equal to the required latency and then starts reading samples from the queue at a constant rate. This allows to keep the latency constant.

* The sender and receiver use FEC codes instead of acknowledgments and retransmissions. This allows to keep the latency low.

* The receiver estimates the sender's rate by observing the incoming queue size and adjusts its own rate to it. This allows to compensate the clocks difference.

Thereby, the incoming queue at the receiver serves for the three purposes at the same time. It is used as a jitter buffer, as a recovery buffer, and for rate estimation. The first use is usual. The rest two are briefly discussed below.

If you want to learn more about the implementation, see the [internals](https://roc-project.github.io/roc/docs/internals.html) section in our documentation. In particular, take a look at the [data flow](https://roc-project.github.io/roc/docs/internals/data_flow.html) page.

## Loss recovery

If you're using an unreliable network such as 802.11, you should cope with packet losses somehow.

One approach is to send ACKS or NACKS and retransmit lost packets. This approach, however, doesn't fit well with the real-time and low-latency requirements.

Another approach is to use Forward Erasure Correction (FEC) codes. The idea is that the sender adds some redundant packets to the stream which then can be used on the receiver to recover some amount of losses.

Roc uses the second approach. It implements the [FECFRAME](https://tools.ietf.org/html/rfc6363) specification with two FEC schemes. The implementation is based on the [OpenFEC](http://openfec.org/) library. See details in [our documentation](https://roc-project.github.io/roc/docs/internals/fec.html).

The following screencast demonstrates the packet recovery feature on a noisy channel:

<img src="/articles/new-network-transport/screencast/roc-recv.gif"/>

Roc cuts the packet stream into blocks. If a block contains some lost or recovered packets, the block state is reported in the following format:

    ..r......r.....X.... ....xx....

A block state report consists of two parts separated with space. The left part is for audio packets, and the right part is for redundant packets. Each packet in a block is denoted with one of these symbols:

* `"."` -- the packet was received (hooray)
* `"r"` -- the packet was lost but recovered  (hooray)
* `"X"` (uppercase) -- the audio packet was lost and was not recovered (we'll hear a glitch)
* `"x"` (lowercase) -- the redundant packet was lost and was not recovered (no big deal)

Note that the receiver reports only blocks that contain some lost or recovered packets. Blocks that were received without losses are not reported.

## Clock adjustment

If you're streaming audio between different devices, you should also deal with the fact that every device has its own clock domain with a bit different frequency, even if nominally the frequencies are the same.

The difference is quite small, but when the latency is low and the stream continues for hours, this difference will accumulate and lead to the latency lag and eventually to underruns or overruns on the receiver.

Roc deals with it by adjusting the stream rate on the receiver side using a resampler. See details in [our documentation](https://roc-project.github.io/roc/docs/internals/fe_resampler.html).

The following diagram demonstrates the incoming queue size at the receiver when it is running with or without clock adjustment. As you can see, without the adjustment the queue has decreased by 40 milliseconds in a half of an hour.

<img src="/articles/new-network-transport/plots/queue.png"/>

## Protocols and encodings

Roc doesn't invent new protocols and heavily relies on existing open specifications. This allows us to take advantage of their careful design and potential interoperability with other software.

Roc is designed to support arbitrary transport protocols, but for now, it implements RTP with A/V profile and FECFRAME with two FEC schemes, Reed-Solomon and LDPC-Staircase. See details in [our documentation](https://roc-project.github.io/roc/docs/internals/network_protocols.html).

There are also plans to add support for RTCP (for receiver feedback), SAP/SDP (for service discovery), and RTSP (for session negotiation and control) in upcoming releases.

Roc is also designed to support arbitrary encodings, but currently, it supports only the so-called CD-quality audio, i.e. 44100 Hz PCM 16-bit stereo. We are planning to add support for more audio encodings in the near future, in particular, add support for [Opus](http://opus-codec.org/). We're also planning to add video support, but probably a bit later.

## Comparison with other transports

PulseAudio has two major types of network transport: "native" and RTP. You can read about them in [this article](https://gavv.github.io/articles/pulseaudio-under-the-hood/).

The "native" transport is based on TCP, which is not well suited for the low-latency real-time streaming and shows worse service quality on lower latencies and an unreliable network. In contrast, Roc is based on RTP, which works on top of UDP and doesn't have these problems.

The RTP transport uses UDP just like Roc does, but it doesn't implement loss recovery, so the service quality is also worse. The frequency estimation algorithms are also different. Arguably, the PulseAudio implementation is sometimes laggy, but this needs more testing.

Some streaming software uses HTTP, in particular PulseAudio DLNA support. It works on top of TCP, which have problems that we already discussed above.

Some media players and toolkits have network streaming support as well, e.g. VLC and FFmpeg. Usually, they use bare RTP without any loss recovery. BTW, some of them could improve the service quality by employing our library.

Some applications integrate Opus, a lossy audio codec with built-in packet loss recovery. Roc, in contrast, supports lossless encoding and encoding-independent packet loss recovery. There are plans to add support for lossy encodings as well, including Opus.

A number of libraries exist implementing RTP transport or the entire SIP stack. Many of them lack the loss recovery or clock adjustment features. Also, many of them have quite a low-level API, while Roc API is high-level and protocol-independent, hiding all the network transport machinery. On the other hand, Roc doesn't support various control protocols and audio encodings (but will in the future).

Another related technology is WebRTC, which also uses RTP, Opus, and has a draft specification for encoding-independent FEC. It is mainly aimed to communication with web-browsers but is not limited to it. Since it has so much in common with our protocol stack, we're thinking about adding WebRTC support as well, but it's not a priority yet.

There are also some more specialized technologies targeted to end-users and requiring either special hardware (Bluetooth) or certification (DLNA, AirPlay). Roc, in contrast, is a general-purpose and open-source solution.

## Comparison with PulseAudio on Wi-Fi

This section provides the results of a simple experiment.

I was streaming a 30-minute audio file using Roc tools, PulseAudio "native" transport, and PulseAudio RTP transport. All three transports were configured to use 250ms latency. The channel was a noisy 2.4Hz Wi-Fi network. I additionally loaded the network with a youtube live translation running in the background.

The diagram below shows the number of glitches per second for every second during a 30-minute period. As you can see, Roc performs better in this case, but still has a room for improvement.

<img src="/articles/new-network-transport/plots/glitches.png"/>

The input signal was a sine wave generated using the `sox` tool. The output signal was recorded at the receiver using the `parec` tool. The number of glitches was then calculated from the recorded output using [this script](https://gist.github.com/gavv/da4cdbbc796cb4d1f6e5c397408ed87b), which assumes that the input signal is smooth and counts the discontinuities in the output.

The exact commands I run may be found in [this gist](https://gist.github.com/gavv/e5834a8b0d30eb7ee48de30c88709660).

## Typical configuration

The best configuration for Roc sender and receiver depends on your network characteristics and latency requirements. Here is the configuration that works well on my home Wi-Fi:

* Reed-Solomon FEC code
* 150 ms network buffer
* 6.4 ms packets (320 samples per channel per packet)
* 128 ms FEC block with 20 source packets and 10 repair packets

On this setup, most time all lost or delayed packets are successfully recovered. I see about one recovery per a few minutes. I hear glitches no more than once a half of an hour.

However, these numbers can't be used everywhere. I saw Wi-Fi networks where 100 ms network buffer also worked well. On the other hand, I also saw Wi-Fi networks where 300 ms and even 500 ms buffer was not enough.

## How to use

If you want to try Roc, consult the following documentation sections:

* [Building](https://roc-project.github.io/roc/docs/building.html) --- building and installing;
* [Running](https://roc-project.github.io/roc/docs/running.html) --- instructions for command-line tools and PulseAudio modules;
* [Manuals](https://roc-project.github.io/roc/docs/manuals.html) --- reference for command-line tools;
* [API](https://roc-project.github.io/roc/docs/api.html) --- reference and examples for the C library.

As a quick start, it should be enough to take a look at these three pages:

* [User cookbook](https://roc-project.github.io/roc/docs/building/user_cookbook.html)
* [Command-line tools](https://roc-project.github.io/roc/docs/running/command_line_tools.html)
* [PulseAudio modules](https://roc-project.github.io/roc/docs/running/pulseaudio_modules.html)

Currently, Roc supports GNU/Linux (command-line tools and PulseAudio modules) and macOS (command-line tools). See details in [the documentation](https://roc-project.github.io/roc/docs/portability/supported_platforms.html).

If you want to run Roc on a single-board computer, see also our [tested boards](https://roc-project.github.io/roc/docs/portability/tested_boards.html) and [cross compiling](https://roc-project.github.io/roc/docs/portability/cross_compiling.html) pages.

Various *nix operating systems may work too but were not tested yet. Other ports, including Android and Windows, are planned but are not a high priority yet, unless someone would like to maintain them.

## Status and plans

We're going to make the first release (version 0.1) in a few weeks. We have to resolve two issues with the PulseAudio latency and FECFRAME support and after that, the transport part may be considered more or less usable.

The next few releases will be focused on adding more audio encodings (lossless and lossy including Opus) and protocols (RTCP for receiver feedback, SAP/SDP for service discovery, and RTSP for session negotiation and control). These features are important for Roc in general and for PulseAudio integration particularly.

There are a lot of longer-term plans, including smaller features like dynamic latency and bitrate adjustment and larger features like video support. See our [roadmap](https://roc-project.github.io/roc/docs/development/roadmap.html) and the [project board](https://github.com/roc-project/roc/projects/2).

There are also a lot of tests to do. It would be interesting to measure the transport latency more precisely, to measure the service quality on different network conditions and types (various 802.11 versions, Internet), to compare FECFRAME and Opus loss recovery, to investigate the quality of our resampler, etc.

If people find our PulseAudio modules useful, we'll consider submitting them to the upstream (if they would like to accept it). This is rather crucial because PulseAudio does not provide a stable API for external modules.

Finally, there are some ideas of end-user applications on top of Roc, for instance, some open-source audio and video sharing tools for mobile and desktop. There are no concrete plans right now though.

If you're interested in how the project would evolve, you can subscribe to [my twitter](https://twitter.com/gavv42) or our [mailing list](https://www.freelists.org/list/roc).

## Feedback

First of all, we'd be happy to hear some feedback:

* does someone find the project useful?
* how do people want to use it?
* what features would they like to see?

Second, we need testers. Please report to us any issues you'll find. We would also be glad to see the results of any measurements, comparisons, etc.

Third, contributors are always welcome! We have quite a long roadmap. We'd also be happy to see maintainers for new platforms.

Finally, feel free to contact us if you want to discuss the integration of Roc into your project or building something larger on top of it.

You can reach us [via GitHub](https://github.com/roc-project/roc) or via the [mailing list](https://www.freelists.org/list/roc) (see instructions in README on GitHub).

Thanks for reading!

+++
title = "CV"
+++

<div class="cv-header">
  <h2 class="cv-name">Victor Gaydov</h2>
  <h1 class="cv-title">Real-time Systems Software Engineer</h1>

  <div class="cv-contacts">
    <div class="cv-contacts-column">
      <div><i class="fa-solid fa-envelope"></i>
        <a href="mailto:victor@enise.org">victor@enise.org</a></div>
      <div><i class="fa-brands fa-github"></i>
        <a href="https://github.com/gavv" target="_blank" rel="noopener">github.com/gavv</a></div>
    </div>
    <div class="cv-contacts-column">
      <div><i class="fa-brands fa-linkedin"></i>
        <a href="https://www.linkedin.com/in/victor-gaydov/" target="_blank" rel="noopener">linkedin.com/in/victor-gaydov</a></div>
      <div><i class="fa-solid fa-briefcase"></i>
        <a href="https://www.upwork.com/o/profiles/users/_~01205fd34b306ddfd6/" target="_blank" rel="noopener">upwork</a>,
        <a href="https://www.toptal.com/developers/resume/victor-gaydov" target="_blank" rel="noopener">toptal</a></div>
    </div>
  </div>

  <div class="cv-download">
    <i class="fa-solid fa-file-pdf"></i>
    <a href="/victor_gaydov_cv.pdf" target="_blank" rel="noopener">PDF</a>
  </div>
</div>

# Summary

15 years in software engineering, the last decade on real-time and performance-critical systems in embedded, cloud, desktop, and mobile; much of it low-latency audio.

Co-founder of Roc Streaming (open-source real-time audio stack) and ViveSound (commercial desktop audio engine).

# Expertise

* **Real-time multimedia:** low-latency streaming, synchronization, DSP pipelines, FEC; latency and sync measurement; RTP/RTCP, WebRTC; voice AI integration.
* **Audio drivers & APIs:** Linux, macOS, Windows; Core Audio, WASAPI, PipeWire, ALSA, AAudio, macOS HAL plug-ins, Windows APO, virtual audio devices.
* **Concurrency & performance:** lock-free algorithms, real-time safety, profiling, contention analysis; Linux internals.
* **Embedded:** Linux, Zephyr, cross-compilation; STM32, ARM, MIPS, RISC-V; hardware test rigs, hardware mocks.
* **Broader experience:** data streaming backends (gRPC, WebSockets); high-load services; native platform integration (Win32, macOS, POSIX; Android JNI/NDK, iOS CF/AVF).
* **Languages:** C++, C, Rust, Go; working knowledge: Python, C#, Java/Kotlin, Objective-C.

# Open Source Work

I maintain around 15 open-source projects of varying scale, spanning real-time audio and engineering tools; some have commercial adopters. The full list is on [gavv.net/open-source](/open-source/).

## Roc Streaming • Co-founder

<span class="post-time">2015 - present</span> <span class="cv-link">[roc-streaming.org](https://roc-streaming.org/)</span> <span class="cv-stats"><i class="fa-solid fa-star"></i> 1.2K+&nbsp;&nbsp;<i class="fa-solid fa-user"></i> 50+</span>

Open ecosystem for real-time audio over IP, with open-source and commercial users. Co-founded and remain a core maintainer. My contributions:

- Real-time architecture with deadline-aware media pipelines and budgeted task scheduling.
- Adaptive latency, clock synchronization, asynchronous resampling, streaming statistics, lock-free algorithms and allocators subsystem.
- Custom RTP/FECFRAME stack with Reed-Solomon and LDPC-Staircase FEC.
- ADC-to-DAC latency down to 10 ms, sync precision 1-2 ms, and resilient playback with loss recovery over Wi-Fi and Internet.
- OS integrations: macOS virtual device with gRPC control and PulseAudio modules.
- Go and Java bindings (JNI, AAR), native layer for Android (MediaProjection, foreground service), and Kotlin/Flutter bridge.
- Cross-compilation and test infrastructure: QEMU-based CI and hardware acceptance testing across x86, ARM32, ARM64, RISC-V, MIPS.
- Release cycle, code review, documentation, contributor onboarding.

## libASPL • Author

<span class="post-time">2021 - present</span> <span class="cv-link">[gavv/libASPL](https://github.com/gavv/libASPL)</span> <span class="cv-stats"><i class="fa-solid fa-star"></i> 85+&nbsp;&nbsp;<i class="fa-solid fa-user"></i> 5+</span>

Open-source C++17 library for building virtual audio devices on macOS.

- Type-safe, extensible abstraction layer over the Core Audio HAL object tree.
- Real-time-safe audio I/O, lock-free control paths, HAL simulation for driver testing.

## Signal Estimator • Author

<span class="post-time">2020 - present</span> <span class="cv-link">[gavv/signal-estimator](https://github.com/gavv/signal-estimator)</span> <span class="cv-stats"><i class="fa-solid fa-star"></i> 85+&nbsp;&nbsp;<i class="fa-solid fa-user"></i> 10+</span>

Audio engineering tool for end-to-end latency and synchronization measurement.

- Measures the complete hardware+software path, from ADC input to DAC output.
- Applies to a wide range of setups: sound cards, network streaming, acoustic paths, virtual devices.
- Computes delay via FFT-based signal correlation, I/O jitter, driver delay, synchronization error.

# Founder Experience

## ViveSound • Technical Co-founder

<span class="post-time">2024 - present</span> <span class="cv-link">[vivesound.com](https://vivesound.com/)</span>

Commercial engine for OS-level interception and processing of other apps audio on Windows and macOS. Joined as a freelance engineer, led it to commercial launch, later became an equity partner.

- Owned technical roadmap, release cycle, and QA.
- Cross-platform, multi-process, multi-language architecture spanning background services, virtual devices, and OS integrations.
- Low-latency inter-process audio pipelines with lock-free shared-memory transport and gRPC control.
- Configurable DSP chains with built-in effects, in-process and out-of-process plugins, and on-device and cloud voice AI.
- Native audio (WASAPI, Core Audio) and system layer (Win32, macOS frameworks).
- Customer SDK and documentation (C#, Go).

# Freelance Projects

I work independently since 2019. I hold Top Rated status and 100% Job Success Score on Upwork, and have delivered around 10 projects, including a few long-term ones lasting 1-2 years.

## Probabilistic NAT traversal for P2P streaming

<div class="post-time">2025</div>

Hole punching algorithm for a P2P streaming product on embedded Linux.

- Three-axis NAT classifier per RFC 5780, on a custom STUN client.
- Random port probing on the birthday paradox; 1-2 minutes to connect in the hard case.
- Physical network testbed emulating full-cone, port-restricted, and symmetric NATs.
- Integrated into customer's streaming product, shipped and tested on real ISPs.

## Consumer audio device for online music collaboration

<div class="post-time">2023 - 2025</div>

Hardware box for jamming online with live instruments; custom PCB, Linux/ALSA.

- Built the audio stack from prototype to production and handed off to in-house engineers.
- Real-time architecture isolating latency-sensitive paths from business logic.
- Embedded Linux peer and cloud multipoint mixer (ARM64, ALSA, DSP).
- P2P streaming with adaptive jitter buffer and forward error correction.
- Tested and measured on a closed-loop calibration rig.
- Achieved end-to-end latency below 30 ms over the Internet.

## Wearable audio augmentation for live venues

<div class="post-time">2023</div>

Wireless device for concertgoers: aligns network playback with the acoustic sound reaching the listener.

- Embedded Linux receiver aligning playback with acoustic watermarks in the captured signal.
- Real-time streaming over Wi-Fi and ALSA I/O with hardware-timestamp delay control.
- Achieved synchronization precision below 0.25 ms.

## GPU speech-to-text server with WebRTC

<div class="post-time">2023</div>

- Real-time self-hosted transcription service based on faster-whisper / CTranslate2.
- Sliding window with segment retirement, making Whisper behave as a streaming model.
- Go/Pion WebRTC with Opus and in-band FEC.

## NTP server and client for Zephyr RTOS

<div class="post-time">2023</div>

- Ported the BusyBox ntpd server to Zephyr RTOS on STM32F7 with hardware RTC.
- Custom SNTP client with IPv6 support.

## Wireless audio multi-room software

<div class="post-time">2021 - 2022</div>

- Clock-synchronized low-latency streaming for multi-room home audio setups.
- Hardware test rig for measuring sync error between speakers.
- Achieved synchronization precision ~1-2 ms.

## Synchronized video monitoring for remote operators

<div class="post-time">2021</div>

Live video fanned out to operators at distant sites who need to make decisions in lockstep.

- RTSP cameras transcoded to RTP / H.264 with KCP FEC and fanned out to receivers (Go, FFmpeg).
- Custom NTP-like clock sync protocol and fixed-latency frame scheduling (OpenGL).
- Achieved presentation skew below 0.5 ms.

## Software hearing aid for Android and iOS

<div class="post-time">2020</div>

- Real-time hearing augmentation pipeline in a portable C++ core.
- Platform-native low-latency audio with AAudio/Oboe and Core Audio (C++, Objective-C, Java).
- 50 ms mouth-to-ear on budget phones from 2020.
- Latency measured acoustically on a purpose-built hardware rig.

## Automated voice call testing over Bluetooth

<div class="post-time">2019</div>

Lab automation software for scoring voice call quality on mobile phones using PESQ/MOS.

- Python service impersonating HFP/SCO headset for nearby mobile devices (PulseAudio, BlueZ).
- Live streaming via WebRTC for call monitoring, with Opus in-band FEC and PLC.
- Live upload of call recordings to cloud for storage and analysis (GStreamer, FFmpeg, SoX).
- Deployed to lab and got unattended testing running on real phones and carrier networks.

# Prior Employment

## Team Lead • TradingView

<div class="post-time">2016 - 2019</div>

High-load concurrent streaming hub in Go for real-time trading data (30k streams, 20k rps, 400 MBps).

- Led a team of 5-10, designed architecture, performed code review, owned release cycle.
- Rate limiting, backpressure, admission control by memory and contention.
- Debugged performance bottlenecks down to Go runtime: GC pauses, scheduler run-queue latency.

## Software Engineer • Zodiac Interactive, InfoTeCS, NTMR

<div class="post-time">2010 - 2016</div>

Developed embedded software across digital TV, secure networking, and industrial scanners.

- Embedded Linux for digital TV set-top boxes: video streaming and storage, platform abstraction layer, reproducible cross build (Broadcom, Cisco; ARM, MIPS; uclibc).
- Bare-metal and RTOS firmware: Altera SoC (C, Verilog, UCOS-II), Mikromedia SoC (ARM Cortex-M3), servo and sensor control over CAN, RS-232, UART, live offloading over Ethernet.
- Linux system software: Graphical stack on USB-connected microcontroller, serial-over-IP for remote industrial equipment, distributed computing on MPI cluster.

# Technical Writing

Full list on [gavv.net/articles](/articles/).

- **[Roc Toolkit docs](https://roc-streaming.org/toolkit/docs/)** — 50 pages on pipelines, threading, timestamp domains, FEC, resampling.
- **[PulseAudio under the hood](/articles/pulseaudio-under-the-hood/)** — 150-page book; referred by the official PulseAudio documentation.
- **[Working on a new network transport for PulseAudio and ALSA](/articles/new-network-transport/)** — Design and benchmarks of the first release of Roc Toolkit.
- **[File locking in Linux](/articles/file-locks/)** — BSD, POSIX, and OFD locks: semantics, trade-offs, examples.

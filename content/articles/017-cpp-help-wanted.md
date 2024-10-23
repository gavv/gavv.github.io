+++
slug = "cpp-help-wanted"
date = "2023-09-20"
tags = ["audio", "networking", "roc", "help-wanted"]
title = "Two C++17 projects open for contributions"
+++

# Signal Estimator

* [project](https://github.com/gavv/signal-estimator)
* [issues](https://github.com/gavv/signal-estimator/labels/help%20wanted)

This one implements a tool (both CLI and GUI) for measuring audio latency and glitches.

The idea behind the tool is simple: you have an audio loopback that connects audio output to audio input; the tool writes impulses to the output, waits until the same impulses are received from the input, and measures the delay or other properties.

<img src="/articles/cpp-help-wanted/signal_estimator.png" width="400px"/>

I'm using this tool at work for measuring latency of various audio software. Here is an example of a real-world usage, a test bench for measuring latency of audio streaming between two boards over Ethernet:

<img src="/articles/cpp-help-wanted/loopback_example.jpg" width="450px"/>

The project is written in modern C++ and has rather small code base. There are issues needing help related to project core (audio I/O, algorithms), command-line interface, and graphical interface (it uses Qt).

<img src="/articles/cpp-help-wanted/signal_estimator_gui.png" width="450px"/>

# Real-time tests for Roc Toolkit

* [project](https://github.com/roc-streaming/rt-tests)
* [issues](https://github.com/roc-streaming/rt-tests/labels/help%20wanted)

The project is in its infancy and is waiting for someone who will help it grow. Its goal is to implement real-time test suite for [Roc Toolkit](https://github.com/roc-streaming/roc-toolkit), a library for audio streaming.

Roc implements various features essential for real-time streaming: maintaining guaranteed latency, packet loss recovery, clock drift compensation, and others. You can find some interesting overview in my [old post](https://gavv.net/articles/new-network-transport/).

Roc already has unit and integration tests, but those tests, by design, have limitations:

* they are run frequently during development, so they should not take long
* they are run everywhere (on developer machine, on CI), so should not be sensitive to real-time (e.g. tests should pass even on loaded machine like CI VM worker)
* they are yes/no tests, i.e. should either succeed or fail

The idea of the new project is to develop a different kind of tests:

* running on real hardware on unloaded system
* running long if needed
* providing some metrics, not just success or failure
* testing various real-time aspects of the toolkit, for example latency, number of glitches, etc

Currently, the project has a build system, and a skeleton of one test that implement full loopback: writes audio stream to roc sender, obtains the stream from roc receiver, and runs a very basic check.

<img src="/articles/cpp-help-wanted/rt_tests.png" width="350px"/>

I've prepared a bunch of issues explaining details of further tests that need to be developed. Current test skeleton is written in C++17 with the use of Google Test.

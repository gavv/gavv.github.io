+++
slug = "decode-play"
date = "2016-07-07 00:00:00"
tags = ["linux", "audio"]
title = "Decoding and playing audio files in Linux"
+++

**Table of contents**

* [Overview](#overview)
* [FFmpeg](#ffmpeg)
* [SoX](#sox)
* [ALSA (libasound)](#alsa-libasound)
* [PulseAudio](#pulseaudio)
* [Other libraries](#other-libraries)
* [Notes](#notes)

---

## Overview

I was playing with various media libraries recently and have prepared several snippets demonstrating how one can decode and play an audio file in two separate steps.

The source code is available on GitHub [here](https://github.com/gavv/snippets/tree/master/decode_play) and [there](https://github.com/gavv/snippets/tree/master/pa).

The following libraries are used:

* [FFmpeg](https://www.ffmpeg.org/)
* [SoX](http://sox.sourceforge.net/)
* [ALSA](http://www.alsa-project.org/main/index.php/Main_Page) (libasound)
* [PulseAudio](https://www.freedesktop.org/wiki/Software/PulseAudio/)
* [libsndfile](http://www.mega-nerd.com/libsndfile/)

Each snippet is a small program. There are two kinds of them:

* decoders demonstrate reading an audio file and decoding raw PCM samples from it
* players demonstrate sending the raw PCM samples to the sound card

Since all snippets use the same sample format and use stdin or stdout, any decoder may be combined with any player via a pipe, for example:

```
$ ./ffmpeg_decode     foo.mp3   |  ./alsa_play_tuned
$ ./sox_decode_chain  foo.mp3   |  ./ffmpeg_play
$ ./sndfile_decode    foo.flac  |  ./sox_play
```

Below you can find a brief description of every snippet and some side notes.

---

## FFmpeg

### [`ffmpeg_decode`](https://github.com/gavv/snippets/blob/master/decode_play/ffmpeg_decode.cpp)

This snippet decodes a file using FFmpeg (with automatic resampling and channel mapping).

Initialization:

* open the input file context (`AVFormatContext`) and look for an audio stream in it
* find a decoder (`AVCodec`) for the audio stream
* initialize the decoder context (`AVCodecContext`) for the decoder (`AVCodec`)
* initialize the swresample context (`SwrContext`) that will convert from decoder output to our PCM format and perform resampling if necessary

Decoding loop:

* read an audio packet (`AVPacket`) from the input file (`AVFormatContext`)
* decode an audio frame (`AVFrame`) from the the audio packet (`AVPacket`) using decoder context (`AVCodecContext`)
* convert the decoded frame (`AVFrame`) to raw samples (byte buffer) using swresample context (`SwrContext`)
* write the raw samples to stdout

Notes:

* swresample context (`SwrContext`) enables buffering if input data is larger than the passed buffer, so we also read all buffered data (if any) before processing the next frame. The buffering can be avoided by carefully choosing the buffer size.

### [`ffmpeg_play`](https://github.com/gavv/snippets/blob/master/decode_play/ffmpeg_play.cpp)

This snippet plays decoded samples using FFmpeg.

Initialization:

* open an output device (`AVOutputFormat`)
* create the output device context (`AVFormatContext`) for the output device
* add an audio stream (`AVStream`) for the output device context, which contains the encoder context (`AVCodecContext`)
* initialize the encoder context (`AVCodecContext`) parameters for our PCM format

Playback loop:

* read raw samples (byte buffer) from stdin
* construct an audio packet (`AVPacket`) that references our buffer with raw samples
* write the audio packet to the output device context (`AVFormatContext`)

### [`ffmpeg_play_encoder`](https://github.com/gavv/snippets/blob/master/decode_play/ffmpeg_play_encoder.cpp)

This snippet is a bit complicated version of the previous one, demonstrating encoder usage.

Initialization:

* open an output device (`AVOutputFormat`)
* create the output device context (`AVFormatContext`) for the output device
* add an audio stream (`AVStream`) for output device context, which contains the encoder context (`AVCodecContext`)
* initialize the encoder context (`AVCodecContext`) parameters for our PCM format
* open an encoder (`AVCodec`) for our output format and attach it to the encoder context (`AVCodecContext`)

Playback loop:

* read raw samples (byte buffer) from stdin
* construct an audio frame (`AVFrame`) that references our buffer with raw samples
* encode the audio frame (`AVFrame`) into audio packet (`AVPacket`) using encoder context (`AVCodecContext`)
* write the audio packet to the output device context (`AVFormatContext`)

---

## SoX

### [`sox_decode_simple`](https://github.com/gavv/snippets/blob/master/decode_play/sox_decode_simple.cpp)

This snippet decodes a file using SoX (without resampling and channel mapping).

Initialization:

* open an input file (`sox_format_t`)

Decoding loop:

* read samples from the input file
* write samples to stdout

### [`sox_decode_chain`](https://github.com/gavv/snippets/blob/master/decode_play/sox_decode_chain.cpp)

This snippet also decodes file using SoX, but uses effects chain and supports resampling and channel mapping.

It opens input file and constructs effects chain:

1. `input` effect reads samples from the input file
2. `gain` and `rate` effects are added if the input file rate differs from the output rate, to perform resampling
3. `channels` effect is added if the input file channel set differs from the output channel set, to perform channel mapping
4. `stdout` effect writes samples to stdout

When the effects chain is constructed, it is executed using `sox_flow_effects()`.

### [`sox_play`](https://github.com/gavv/snippets/blob/master/decode_play/sox_play.cpp)

This snippet plays decoded samples using SoX.

Initialization:

* open an output device (`sox_format_t`)

Playback loop:

* read samples from stdin
* write samples to the output device

---

## ALSA (libasound)

### [`alsa_play_simple`](https://github.com/gavv/snippets/blob/master/decode_play/alsa_play_simple.cpp)

This snippet plays decoded samples using ALSA with the default parameters.

Initialization:

* open an output device (`snd_pcm_t`)
* set the output format
* get the period size

Playback loop:

* read samples from stdin (full period)
* write samples to the output device

### [`alsa_play_tuned`](https://github.com/gavv/snippets/blob/master/decode_play/alsa_play_tuned.cpp)

This snippet also uses ALSA to play decoded samples but with non-default configuration.

The most important thing here is *ring buffer* parameters.

When a program plays sound using libasound, samples are actually written to the internal ring buffer. ALSA reads samples from the buffer every timer tick.

If a program tries to write to a full buffer, a *buffer overrun* occurs. If ALSA tries to read from an empty buffer, a *buffer underrun* occurs. These two events are also called *xruns*. As the result, the user hears sound lags and sees "alsa xrun" messages in console.

To avoid xruns, you can tweak four ring buffer parameters:

* `buffer_size` - the number of samples in the ring buffer
* `buffer_time` - duration of the whole buffer in microseconds
* `period_size` - the number of samples that ALSA reads from the buffer every timer tick (no more than the `buffer_size`)
* `period_time` - duration of the timer tick in microseconds (no more than the `buffer_time`)

And also two related parameters:

* `start_threshold` - before reading the very first sample from the buffer, ALSA waits until there are `start_threshold` samples in it
* `avail_min` - before reading the next batch of samples from the buffer (every timer tick), ALSA waits until there are at least `avail_min` samples in it

These parameters are always a compromise between the robustness and latency.

Here are my recommendations:

* `period_size` should be set to the number of samples that the program writes to pcm at a time; the higher it is, the higher the latency is, but the lesser the probability of xrun is
* `buffer_size` should be a multiple of `period_size` and several times more
* `start_threshold` should be set to `buffer_size`
* `avail_min` should be set to `period_size`

---

## PulseAudio

### [`pa_play_simple`](https://github.com/gavv/snippets/blob/master/pa/pa_play_simple.c)

This snippet plays decoded samples using PulseAudio [Simple API](https://freedesktop.org/software/pulseaudio/doxygen/index.html#simple_sec).

Initialization:

* create `pa_simple` object which represents a connection to PulseAudio server plus playback stream

Playback loop:

* read samples from stdin
* write samples to PulseAudio server

### [`pa_play_async_cb`](https://github.com/gavv/snippets/blob/master/pa/pa_play_async_cb.c)

This snippet plays decoded samples using PulseAudio [Asynchronous API](https://freedesktop.org/software/pulseaudio/doxygen/index.html#async_sec).

Initialization:

* create `pa_mainloop` object that will be used to run our program
* create `pa_context` object that represents a connection to the server
* setup callback for context state updates
* run the mainloop

When the connection is established, our callback is invoked. Now we should create a stream:

* create `pa_stream` object that represents a playback stream
* configure buffer parameters and stream flags
* setup callback to be invoked when the server wants more samples

There are four parameters of the server-side stream buffer:

* `maxlength` - maximum buffer length (in bytes)
* `tlength` - desired buffer length, i.e. the target latency (in bytes)
* `prebuf` - start threshold, i.e. the minimum number of bytes to be accumulated in buffer before starting the stream (in bytes)
* `minreq` - minimum number of samples to be requested from the client each time (in bytes)

We also enable three stream flags:

* `PA_STREAM_AUTO_TIMING_UPDATE`

    Automatically update current latency (stream buffer size) from the server. We just print current latency to stderr.

* `PA_STREAM_INTERPOLATE_TIMING`

    Interpolate reported latency values between timing updates. We want the latency values printed to stderr to change smoothly.

* `PA_STREAM_ADJUST_LATENCY`

    With this flag, `tlength` becomes the target size for the stream buffer plus device buffer, instead of just stream buffer. PulseAudio will do two things:

    * adjust the device buffer size (ALSA ring buffer size) to be the minimum *tlength* value among of the all connected streams

    * request samples from the client in such way that there is always about *tlength - dlength* bytes remaining in the stream buffer, where *dlength* is the device buffer size

When PulseAudio server wants more samples, it invokes our callback which does the following:

* ask PulseAudio to allocate a memory for next batch of samples
* read requested amount of samples from stdin to the buffer
* write the buffer to PulseAudio

We could also do memory allocation by ourselves. However, delegating this function to PulseAudio prevents us from unnecessary copying when PulseAudio uses the zero-copy mode. Zero copy is usually a default for local clients.

### [`pa_play_async_poll`](https://github.com/gavv/snippets/blob/master/pa/pa_play_async_poll.c)

This snippet is just like previous one, but it uses polling instead of callbacks. Polling is performed between mainloop iterations.

This approach could be also used with a [threaded mainloop](https://freedesktop.org/software/pulseaudio/doxygen/threaded_mainloop.html). In this case, polling may be performed from another thread after obtaining a lock.

---

## libsndfile

### [`sndfile_decode`](https://github.com/gavv/snippets/blob/master/decode_play/sndfile_decode.cpp)

This snippet decodes a file using libsndfile.

Initialization:

* open an input file (`SNDFILE`)

Decoding loop:

* read samples from the input file
* write samples to stdout

---

## Other libraries

There are no snippets for these libraries, but they may be also useful.

Portable audio I/O:

* [libsoundio](http://libsound.io/)
* [libao](https://www.xiph.org/ao/)
* [PortAudio](http://www.portaudio.com/)
* [RtAudio](https://github.com/thestk/rtaudio)

Media frameworks:

* [SDL](https://www.libsdl.org/)
* [GStreamer](https://gstreamer.freedesktop.org/)
* [Qt Multimedia](http://doc.qt.io/qt-5/qtmultimedia-index.html)
* [OpenAL](https://www.openal.org/)

---

## Notes

SoX can use libsndfile for reading files. FFmpeg can use SoX for more precise resampling.

Both SoX and FFmpeg can use ALSA and PulseAudio for audio output. But note that FFmpeg tools use SDL for audio output instead.

PulseAudio usually uses ALSA for audio output. It may also use SoX for high-quality resampling.

All libraries listed here (with or without snippets) are cross-platform.

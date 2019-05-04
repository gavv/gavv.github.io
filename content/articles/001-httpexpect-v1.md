+++
slug = "httpexpect-v1"
date = "2016-07-04"
tags = ["go", "http"]
title = "httpexpect.v1: end-to-end HTTP API testing for Go"
+++

`httpexpect` is a new Go package for end-to-end HTTP and REST API testing.

It provides convenient chainable helpers for building HTTP request, sending it, and inspecting received HTTP response and its payload.

Links:

* [repo on GitHub](https://github.com/gavv/httpexpect)
* [announcement on Reddit](https://www.reddit.com/r/golang/comments/4qrhjd/httpexpect_v1_released_endtoend_http_api_testing/)

The key point is that request construction and response assertions become concise and declarative:

```go
// create httpexpect instance
e := httpexpect.New(t, "http://example.com")

// check that "GET /fruits" returns empty JSON array
e.GET("/fruits").
    Expect().
    Status(http.StatusOK).JSON().Array().Empty()
```

You can find more examples in the [Quick Start](https://github.com/gavv/httpexpect#quick-start).

The first stable branch is released and available on gopkg: [`httpexpect.v1`](http://gopkg.in/gavv/httpexpect.v1).

There is a compatibility promise for this branch.

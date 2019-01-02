+++
slug = "sconsign-bug"
date = "2016-07-06"
tags = ["scons"]
title = "SCons rebuilds generated source files every launch"
+++

### Problem

In a large project that uses SCons, [VariantDir](https://bitbucket.org/scons/scons/wiki/VariantDir%28%29), and source code generation, happens one of the following:

* generated source files are rebuilt every time when `scons` is launched
* if `.sconsign.dblite` is removed manually, `scons` crashes with the following trace:

```none
OSError: [Errno 2] No such file or directory: '.sconsign.dblite':
  File "/usr/lib64/python2.7/site-packages/SCons/Script/Main.py", line 1372:
    _exec_main(parser, values)
  File "/usr/lib64/python2.7/site-packages/SCons/Script/Main.py", line 1335:
    _main(parser)
  File "/usr/lib64/python2.7/site-packages/SCons/Script/Main.py", line 1099:
    nodes = _build_targets(fs, options, targets, target_top)
  File "/usr/lib64/python2.7/site-packages/SCons/Script/Main.py", line 1297:
    jobs.run(postfunc = jobs_postfunc)
  File "/usr/lib64/python2.7/site-packages/SCons/Job.py", line 113:
    postfunc()
  File "/usr/lib64/python2.7/site-packages/SCons/Script/Main.py", line 1294:
    SCons.SConsign.write()
  File "/usr/lib64/python2.7/site-packages/SCons/SConsign.py", line 109:
    syncmethod()
  File "/usr/lib64/python2.7/site-packages/SCons/dblite.py", line 127:
    self._os_unlink(self._file_name)
Exception OSError: OSError(2, 'No such file or directory') in
  <bound method dblite.__del__ of <SCons.dblite.dblite object at 0x7fa287435c10>> ignored
```

Unfortunately, I was unable to reproduce this outside of my project.

### Reason

The problem occurs because:

* SCons creates individual `.sconsign` files for the source directory and build directory (VariantDir)
* for some reason, SCons writes build metainfo for generated sources to the `.sconsign` under the build directory but searches for it in the `.sconsign` under the source directory
* since SCons can't find build metainfo for generated sources, it assumes that they should be (re)built, and this happens every time

You can check if this is your case with the following command:

```
$ scons --debug=explain
...
scons: Cannot explain why `<FILENAME>' is being rebuilt: No previous build information found
```

### Solution

The workaround is to use single global `.sconsign` for the whole project. This feature is enabled by setting the `SConsignFile` to an absolute path:

```python
import os.path
env.SConsignFile(os.path.join(env.Dir('#').abspath, '.sconsign.dblite'))
```

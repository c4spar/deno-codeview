# [0.2.2](https://github.com/c4spar/deno-codeview/compare/0.2.1...0.2.2) (2021-04-26)

### Features

- add --exclude-watch and --lock option
  ([b3bc4f2](https://github.com/c4spar/deno-codeview/commit/b3bc4f2))

### Bug Fixes

- lcov copy process closed before done
  ([610eca2](https://github.com/c4spar/deno-codeview/commit/610eca2))
- show waiting message only if watch is enabled
  ([a63a32a](https://github.com/c4spar/deno-codeview/commit/a63a32a))
- fix --exclude and --include options
  ([3c329ab](https://github.com/c4spar/deno-codeview/commit/3c329ab))
- tests are not executed without --watch option
  ([8bea115](https://github.com/c4spar/deno-codeview/commit/8bea115))
- add version number
  ([fbc70a0](https://github.com/c4spar/deno-codeview/commit/fbc70a0))
- **lcov:** fix parse method and import
  ([6f9c4d4](https://github.com/c4spar/deno-codeview/commit/6f9c4d4))

### Code Refactoring

- refactor success and failed message
  ([a16ec5d](https://github.com/c4spar/deno-codeview/commit/a16ec5d))
- disable spinner if logLevel is set to debug
  ([a8a99fd](https://github.com/c4spar/deno-codeview/commit/a8a99fd),
  [21cbb86](https://github.com/c4spar/deno-codeview/commit/21cbb86))
- refactor run method
  ([56acafd](https://github.com/c4spar/deno-codeview/commit/56acafd))
- refactor test command
  ([3b0c02f](https://github.com/c4spar/deno-codeview/commit/3b0c02f))
- update help text
  ([2190dff](https://github.com/c4spar/deno-codeview/commit/2190dff))

### Chore

- lint ([67d08f4](https://github.com/c4spar/deno-codeview/commit/67d08f4))
- **ci:** add release workflow
  ([b312b99](https://github.com/c4spar/deno-codeview/commit/b312b99))
- **ci:** add lint workflow
  ([7f3bf24](https://github.com/c4spar/deno-codeview/commit/7f3bf24))
- **upgrade:** deno/std0.95.0 and cliffy@v0.18.2
  ([3a1c3c7](https://github.com/c4spar/deno-codeview/commit/3a1c3c7))

### Documentation Updates

- update version to v0.2.1
  ([facedf3](https://github.com/c4spar/deno-codeview/commit/facedf3))

# [v0.2.1](https://github.com/c4spar/deno-codeview/compare/0.2.0...0.2.1) (2021-03-15)

### Bug Fixes

- **cli:** old coverage data are shown after re-build
  ([5cdec5b](https://github.com/c4spar/deno-codeview/commit/5cdec5b))

### Chore

- **upgrade:** cliffy@v0.18.1
  ([0f19402](https://github.com/c4spar/deno-codeview/commit/0f19402))

# [v0.2.0](https://github.com/c4spar/deno-codeview/compare/0.1.0...0.2.0) (2021-03-15)

### Features

- **cli:** add --maximize option to start the web-view with a maximized window
  ([6263411](https://github.com/c4spar/deno-codeview/commit/6263411))
- **cli:** show loading page on startup
  ([6f24052](https://github.com/c4spar/deno-codeview/commit/6f24052))
- **cli:** delete tmp directory on exit, add --keep option and ask before
  deleting ([c05538f](https://github.com/c4spar/deno-codeview/commit/c05538f))
- **cli:** add --hostname option
  ([5948104](https://github.com/c4spar/deno-codeview/commit/5948104))
- **lcov:** add lcov parser (#1)
  ([9e01290](https://github.com/c4spar/deno-codeview/commit/9e01290),
  [84e0800](https://github.com/c4spar/deno-codeview/commit/84e0800),
  [2fe52a7](https://github.com/c4spar/deno-codeview/commit/2fe52a7),
  [ad03f65](https://github.com/c4spar/deno-codeview/commit/ad03f65))

### Bug Fixes

- **cli:** add missing param to debounce option
  ([46badcb](https://github.com/c4spar/deno-codeview/commit/46badcb))
- **cli:** fix logLevel type
  ([d6c808a](https://github.com/c4spar/deno-codeview/commit/d6c808a))
- **cli:** make reload parameter optional and fix option types
  ([4465092](https://github.com/c4spar/deno-codeview/commit/4465092))
- **cli:** fix description of --debounce option and add short flag
  ([a8646cd](https://github.com/c4spar/deno-codeview/commit/a8646cd))
- **cli:** fix description of --no-spinner option
  ([9d9623c](https://github.com/c4spar/deno-codeview/commit/9d9623c))
- **cli:** add missing -A short flag for --allow-all
  ([013c498](https://github.com/c4spar/deno-codeview/commit/013c498))

### Code Refactoring

- **cli:** refactor initialisation, clean and exit
  ([206812e](https://github.com/c4spar/deno-codeview/commit/206812e),
  [eb9b131](https://github.com/c4spar/deno-codeview/commit/eb9b131))
- **server:** use std/http for web-server
  ([c13c199](https://github.com/c4spar/deno-codeview/commit/c13c199))

# [v0.1.0](https://github.com/c4spar/deno-codeview/compare/6cd9c65...v0.1.0) (2021-03-11)

### Features

- add first version
  ([c76859f](https://github.com/c4spar/deno-codeview/commit/c76859f))

### Documentation Updates

- update readme
  ([b098369](https://github.com/c4spar/deno-codeview/commit/b098369),
  [fef0d4e](https://github.com/c4spar/deno-codeview/commit/fef0d4e))

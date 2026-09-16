# libuv loop scheduling for Node3D

This is a part of the [Node3D](https://github.com/node-3d) project.

[![NPM](https://badge.fury.io/js/@node-3d%2Fuv-loop.svg)](https://badge.fury.io/js/@node-3d%2Fuv-loop)
[![Build Binaries](https://github.com/node-3d/uv-loop/actions/workflows/build.yml/badge.svg)](https://github.com/node-3d/uv-loop/actions/workflows/build.yml)

```bash
npm install @node-3d/uv-loop
```

`@node-3d/uv-loop` is a deliberately small native addon that exposes a hot
libuv idle loop primitive. It starts one shared unref'd idle pump when imported,
then lets TypeScript register one-shot and looping callbacks on top of that
single native pump.

It is intended for render loops and other latency-sensitive work where
recursive `setImmediate` or timer scheduling can produce visibly uneven frame
pacing. It does not implement throttling; callers that need slower updates can
throttle downstream through vsync, timers, or their own timing conditionals.
It does not know about GLFW, WebGL, Three.js, or Node3D frame policies.

## Quick Start

The API mirrors Node's timer handle style:

```ts
import { clearIdleLoop, setIdleLoop } from '@node-3d/uv-loop';

const loop = setIdleLoop(() => {
	render();

	if (done) {
		clearIdleLoop(loop);
	}
});

loop.unref();
```

For a one-shot idle callback:

```ts
import { setIdle } from '@node-3d/uv-loop';

setIdle(() => {
	updateOnce();
});
```

Handles are ref'd by default, like Node.js timer handles. Use `unref()` when
idle work should not keep the process alive, and `ref()` to opt back in.

```ts
import { clearIdleLoop, setIdleLoop } from '@node-3d/uv-loop';

const loop = setIdleLoop(() => {
	render();

	if (done) {
		clearIdleLoop(loop);
	}
});

loop.unref();
loop.ref();
loop.hasRef();
```

## API

* `setIdle(callback)` - schedules a callback on the next libuv idle turn and
  returns an idle handle.
* `clearIdle(handle)` - clears a one-shot or loop idle handle.
* `setIdleLoop(callback)` - calls a callback on every libuv idle turn until
  cleared, and returns an idle handle.
* `clearIdleLoop(handle)` - alias for `clearIdle`.

Idle handles expose Node timer-style lifecycle methods:

* `handle.ref()` - keeps the process alive while this handle is active.
* `handle.unref()` - allows the process to exit while this handle is active.
* `handle.hasRef()` - returns whether this handle currently keeps the process alive.

The native addon still uses one shared libuv idle pump internally. Per-handle
ref state is tracked in TypeScript and translated to the shared native pump.

## Stub Mode

Set `NODE_3D_UV_LOOP_STUB=1` or pass `--node-3d-uv-loop-stub` as an
application argument to load a JavaScript stub instead of the native binary. The
stub uses recursive `setImmediate` scheduling and implements the same public
API. This is useful for CI, unsupported runtime experiments, or comparing
behavior without the native libuv path.

## Examples

* [`examples/benchmark.ts`](examples/benchmark.ts) compares recursive
  `setImmediate`, recursive `setIdle`, and `setIdleLoop`.

Run the benchmark from this package:

```bash
node examples/benchmark.ts
node examples/benchmark.ts --seconds=10
```

## Binary Origin

Release archives are built by this repository's public GitHub Actions workflows.

Attestations: https://github.com/node-3d/uv-loop/attestations

To verify a downloaded archive:

```bash
gh release download <tag> -R node-3d/uv-loop -p <platform>.gz
gh attestation verify <platform>.gz -R node-3d/uv-loop
```

Prebuilt addon binaries are provided for Windows x64/ARM64, Linux x64/ARM64,
and macOS x64/ARM64. Because this addon calls libuv directly, release binaries
are split by Node.js major version. Install chooses the binary tag from the
runtime Node.js version:

* Node.js 22 -> `<package-version>-22`
* Node.js 24 -> `<package-version>-24`
* Node.js 26 -> `<package-version>-26`
* Odd majors inside the supported range use the previous even major.
* Older majors use the minimum supported binary major.
* Newer majors use the maximum supported binary major.

There is no compilation step during the `npm install` command when a matching
prebuilt archive is available.

## ABI Notice

This package uses `napi_get_uv_event_loop()` and direct libuv APIs from
`<uv.h>`. Node-API itself is ABI-stable, but Node.js does not guarantee libuv
ABI stability across Node.js major versions. This package intentionally
contains that risk in one small optional scheduling layer.

When the runtime Node.js major does not have an exact binary line, install logs
a warning and falls back to the nearest configured binary line described above.

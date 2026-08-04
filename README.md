# libuv loop scheduling for Node3D

This is a part of the [Node3D](https://github.com/node-3d) project.

```bash
npm install @node-3d/uv-loop
```

`@node-3d/uv-loop` is a deliberately small native addon that exposes a hot
libuv idle loop primitive. It does not know about GLFW, WebGL, Three.js, or
Node3D frame policies.

The API mirrors Node's timer handle style:

```ts
import { clearIdleLoop, setIdleLoop } from '@node-3d/uv-loop';

const loop = setIdleLoop(() => {
	render();

	if (done) {
		clearIdleLoop(loop);
	}
});
```

## API

* `setIdle(callback)` - schedules a callback on the next libuv idle turn.
* `clearIdle(handle)` - clears a one-shot or loop idle handle.
* `setIdleLoop(callback)` - calls a callback on every libuv idle turn until cleared.
* `clearIdleLoop(handle)` - alias for `clearIdle`.
* `refIdle(handle)` - keeps the process alive while the handle is active.
* `unrefIdle(handle)` - allows the process to exit while the handle is active.

## ABI Notice

This package uses `napi_get_uv_event_loop()` and direct libuv APIs from
`<uv.h>`. Node-API itself is ABI-stable, but Node.js does not guarantee libuv
ABI stability across Node.js major versions. This package intentionally
contains that risk in one small optional scheduling layer.

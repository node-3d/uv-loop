import { strict as assert } from 'node:assert';
import { execFile as execFileCallback } from 'node:child_process';
import { test } from 'node:test';
import { promisify } from 'node:util';
import { clearIdle, clearIdleLoop, setIdle, setIdleLoop } from './index.ts';
import type { TIdleHandle } from './index.ts';

const execFile = promisify(execFileCallback);

test('setIdle calls callback once', async () => {
	let calls = 0;

	await new Promise<void>((res) => {
		const handle = setIdle(() => {
			calls++;
			assert.equal(handle.hasRef(), false);
			res();
		});
	});

	await new Promise<void>((res) => {
		setImmediate(res);
	});
	assert.equal(calls, 1);
});

test('setIdleLoop calls callback until cleared', async () => {
	const state: { handle?: TIdleHandle } = {};
	let calls = 0;

	await new Promise<void>((res) => {
		state.handle = setIdleLoop(() => {
			calls++;

			if (calls >= 3) {
				clearIdleLoop(state.handle);
				res();
			}
		});
	});

	assert.ok(state.handle);
	assert.ok(calls >= 3);
	clearIdle(state.handle);
});

test('idle handles expose timer-style ref controls', () => {
	const handle = setIdle(() => undefined);

	assert.equal(handle.hasRef(), true);
	assert.equal(handle.unref(), handle);
	assert.equal(handle.hasRef(), false);
	assert.equal(handle.ref(), handle);
	assert.equal(handle.hasRef(), true);

	clearIdle(handle);
	assert.equal(handle.hasRef(), false);
});

test('clearIdle accepts missing handles', () => {
	clearIdle(null);
	clearIdle(undefined);
});

test('stub native implementation can be selected with an environment variable', async () => {
	const { stdout } = await execFile(
		process.execPath,
		[
			'--input-type=module',
			'-e',
			"const { setIdle } = await import('./ts/index.ts'); setIdle(() => console.log('stub-ok'));",
		],
		{
			env: {
				// oxlint-disable-next-line node/no-process-env
				...process.env,
				NODE_3D_UV_LOOP_STUB: '1',
			},
		},
	);

	assert.equal(stdout.trim(), 'stub-ok');
});

test('stub native implementation can be selected with a process argument', async () => {
	const { stdout } = await execFile(process.execPath, [
		'--input-type=module',
		'-e',
		"process.argv.push('--node-3d-uv-loop-stub'); const { setIdle } = await import('./ts/index.ts'); setIdle(() => console.log('stub-arg-ok'));",
	]);

	assert.equal(stdout.trim(), 'stub-arg-ok');
});

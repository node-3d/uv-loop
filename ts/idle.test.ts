import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { clearIdle, clearIdleLoop, refIdle, setIdle, setIdleLoop, unrefIdle } from './index.ts';
import type { TIdleHandle } from './index.ts';

test('setIdle calls callback once', async () => {
	let calls = 0;

	await new Promise<void>((res) => {
		setIdle(() => {
			calls++;
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

test('refIdle and unrefIdle accept active handles', async () => {
	const handle = setIdleLoop(() => {
		clearIdleLoop(handle);
	});

	unrefIdle(handle);
	refIdle(handle);

	await new Promise<void>((res) => {
		setImmediate(res);
	});
});

test('clearIdle accepts missing handles', () => {
	clearIdle(null);
	clearIdle(undefined);
});

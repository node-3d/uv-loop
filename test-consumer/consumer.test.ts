import assert from 'node:assert/strict';
import test from 'node:test';

import { clearIdle, setIdle } from '@node-3d/uv-loop';

test('loads and schedules through the native addon', async () => {
	await new Promise<void>((res) => {
		const handle = setIdle(() => {
			clearIdle(handle);
			res();
		});
	});
	assert.ok(true);
});

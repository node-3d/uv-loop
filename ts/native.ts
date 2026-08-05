import { createRequire } from 'node:module';
import { getBin } from '@node-3d/addon-tools';

type TNativeIdleLoop = {
	ref: () => void;
	unref: () => void;
};

type TNative = {
	setIdleLoop: (callback: (() => void) | null) => TNativeIdleLoop;
};

const loadAddon = createRequire(import.meta.url);
const globalStore = globalThis as typeof globalThis & {
	'@node-3d/uv-loop'?: TNative;
};
const useStub =
	// oxlint-disable-next-line node/no-process-env
	process.env.NODE_3D_UV_LOOP_STUB === '1' || process.argv.includes('--node-3d-uv-loop-stub');

const createStubNative = (): TNative => {
	let callback: (() => void) | null = null;
	let next: NodeJS.Immediate | null = null;
	let isRefed = false;

	const schedule = (): void => {
		if (callback === null || next !== null) {
			return;
		}

		next = setImmediate(() => {
			next = null;
			if (callback === null) {
				return;
			}

			const activeCallback = callback;
			schedule();
			return activeCallback();
		});

		if (!isRefed) {
			next.unref();
		}
	};

	return {
		setIdleLoop: (nextCallback) => {
			callback = nextCallback;
			if (callback === null) {
				if (next !== null) {
					clearImmediate(next);
					next = null;
				}
			} else {
				schedule();
			}

			return {
				ref: () => {
					isRefed = true;
					next?.ref();
				},
				unref: () => {
					isRefed = false;
					next?.unref();
				},
			};
		},
	};
};

const loadNative = (): TNative => {
	if (useStub) {
		return createStubNative();
	}

	return loadAddon(`../${getBin()}/uv-loop.node`) as TNative;
};

export const native = globalStore['@node-3d/uv-loop'] ?? loadNative();

globalStore['@node-3d/uv-loop'] ??= native;

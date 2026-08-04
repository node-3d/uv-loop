import { createRequire } from 'node:module';
import { getBin } from '@node-3d/addon-tools';

export type TNativeIdleHandle = object & { readonly __idleHandle: unique symbol };

type TNative = {
	setIdle: (callback: () => void) => TNativeIdleHandle;
	setIdleLoop: (callback: () => void) => TNativeIdleHandle;
	clearIdle: (handle: TNativeIdleHandle | null | undefined) => void;
	refIdle: (handle: TNativeIdleHandle) => void;
	unrefIdle: (handle: TNativeIdleHandle) => void;
};

const loadAddon = createRequire(import.meta.url);
const globalStore = globalThis as typeof globalThis & {
	'@node-3d/uv-loop'?: TNative;
};

export const native = (globalStore['@node-3d/uv-loop'] ??
	loadAddon(`../${getBin()}/uv-loop.node`)) as TNative;

globalStore['@node-3d/uv-loop'] ??= native;

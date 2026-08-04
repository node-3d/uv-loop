import { native } from './native.ts';
import type { TNativeIdleHandle } from './native.ts';

export type TIdleHandle = TNativeIdleHandle;
export type TIdleCallback = () => void;

export const setIdle = (callback: TIdleCallback): TIdleHandle => native.setIdle(callback);

export const setIdleLoop = (callback: TIdleCallback): TIdleHandle => native.setIdleLoop(callback);

export const clearIdle = (handle: TIdleHandle | null | undefined): void => {
	native.clearIdle(handle);
};

export const clearIdleLoop = clearIdle;

export const refIdle = (handle: TIdleHandle): void => {
	native.refIdle(handle);
};

export const unrefIdle = (handle: TIdleHandle): void => {
	native.unrefIdle(handle);
};

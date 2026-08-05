import { native } from './native.ts';

export type TIdleHandle = {
	ref: () => TIdleHandle;
	unref: () => TIdleHandle;
	hasRef: () => boolean;
};
export type TIdleCallback = () => void;

type TRegistration = {
	callback: TIdleCallback;
	once: boolean;
	isRefed: boolean;
};

const registrations = new Map<TIdleHandle, TRegistration>();
let refedRegistrations = 0;

export const clearIdle = (handle: TIdleHandle | null | undefined): void => {
	if (handle === null || handle === undefined) {
		return;
	}

	handle.unref();
	registrations.delete(handle);
};

export const clearIdleLoop = clearIdle;

const idleLoop = native.setIdleLoop(() => {
	const snapshot = [...registrations];

	for (const [handle, registration] of snapshot) {
		if (registrations.get(handle) !== registration) {
			continue;
		}

		if (registration.once) {
			clearIdle(handle);
		}

		registration.callback();
	}
});

process.once('beforeExit', () => {
	registrations.clear();
	refedRegistrations = 0;
	native.setIdleLoop(null);
});

const refNativeIdleLoop = (): void => {
	if (refedRegistrations++ === 0) {
		idleLoop.ref();
	}
};

const unrefNativeIdleLoop = (): void => {
	if (refedRegistrations === 0) {
		return;
	}

	refedRegistrations--;
	if (refedRegistrations === 0) {
		idleLoop.unref();
	}
};

const addRegistration = (callback: TIdleCallback, once: boolean): TIdleHandle => {
	const handle: TIdleHandle = {
		ref: () => {
			const registration = registrations.get(handle);
			if (registration && !registration.isRefed) {
				registration.isRefed = true;
				refNativeIdleLoop();
			}
			return handle;
		},
		unref: () => {
			const registration = registrations.get(handle);
			if (registration?.isRefed) {
				registration.isRefed = false;
				unrefNativeIdleLoop();
			}
			return handle;
		},
		hasRef: () => registrations.get(handle)?.isRefed ?? false,
	};

	registrations.set(handle, { callback, once, isRefed: false });
	handle.ref();
	return handle;
};

export const setIdle = (callback: TIdleCallback): TIdleHandle => addRegistration(callback, true);

export const setIdleLoop = (callback: TIdleCallback): TIdleHandle =>
	addRegistration(callback, false);

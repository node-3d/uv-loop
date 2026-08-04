import { native } from './native.ts';

export type TIdleHandle = number & { readonly __idleHandle: unique symbol };
export type TIdleCallback = () => void;

type TRegistration = {
	callback: TIdleCallback;
	once: boolean;
};

const registrations = new Map<number, TRegistration>();
let nextId = 1;

const idleLoop = native.setIdleLoop(() => {
	const snapshot = [...registrations];

	for (const [id, registration] of snapshot) {
		if (registrations.get(id) !== registration) {
			continue;
		}

		if (registration.once) {
			registrations.delete(id);
		}

		registration.callback();
	}
});

process.once('beforeExit', () => {
	native.setIdleLoop(null);
});

const addRegistration = (callback: TIdleCallback, once: boolean): TIdleHandle => {
	const id = nextId++;
	registrations.set(id, { callback, once });
	return id as TIdleHandle;
};

export const setIdle = (callback: TIdleCallback): TIdleHandle => addRegistration(callback, true);

export const setIdleLoop = (callback: TIdleCallback): TIdleHandle =>
	addRegistration(callback, false);

export const clearIdle = (handle: TIdleHandle | null | undefined): void => {
	if (handle === null || handle === undefined) {
		return;
	}

	registrations.delete(handle);
};

export const clearIdleLoop = clearIdle;

export const refIdle = (): void => {
	idleLoop.ref();
};

export const unrefIdle = (): void => {
	idleLoop.unref();
};

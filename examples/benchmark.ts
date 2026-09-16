import { clearIdleLoop, setIdle, setIdleLoop } from '@node-3d/uv-loop';

type TResult = {
	name: string;
	seconds: number;
	ticks: number;
	ticksPerSecond: number;
};

const secondsArg = process.argv.find((arg) => arg.startsWith('--seconds='));
const seconds = secondsArg ? Number.parseFloat(secondsArg.slice('--seconds='.length)) : 5;
const durationMs = seconds * 1000;

const now = (): number => performance.now();

const finish = (name: string, startedAt: number, ticks: number): TResult => {
	const elapsedMs = now() - startedAt;
	const elapsedSeconds = elapsedMs / 1000;

	return {
		name,
		seconds: Number(elapsedSeconds.toFixed(3)),
		ticks,
		ticksPerSecond: Math.round(ticks / elapsedSeconds),
	};
};

const runSetImmediate = async (): Promise<TResult> =>
	new Promise((res) => {
		const startedAt = now();
		const deadline = startedAt + durationMs;
		let ticks = 0;

		const loop = (): void => {
			ticks++;

			if (now() >= deadline) {
				res(finish('setImmediate loop', startedAt, ticks));
				return;
			}

			setImmediate(loop);
		};

		setImmediate(loop);
	});

const runSetIdle = async (): Promise<TResult> =>
	new Promise((res) => {
		const startedAt = now();
		const deadline = startedAt + durationMs;
		let ticks = 0;

		const loop = (): void => {
			ticks++;

			if (now() >= deadline) {
				res(finish('setIdle loop', startedAt, ticks));
				return;
			}

			setIdle(loop);
		};

		setIdle(loop);
	});

const runSetIdleLoop = async (): Promise<TResult> =>
	new Promise((res) => {
		const startedAt = now();
		const deadline = startedAt + durationMs;
		let ticks = 0;

		const handle = setIdleLoop(() => {
			ticks++;

			if (now() >= deadline) {
				clearIdleLoop(handle);
				res(finish('setIdleLoop', startedAt, ticks));
			}
		});
	});

const results = [await runSetImmediate(), await runSetIdle(), await runSetIdleLoop()];

console.table(results);

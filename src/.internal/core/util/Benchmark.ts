/** @ignore *//** */

import * as $array from "./Array";

/**
 * @ignore
 */
interface Test {
	name: string;
	fn: () => boolean;
}

/**
 * @ignore
 */
class Result {
	constructor(public duration: number, public iterations: number) {}

	public ms(): number {
		return this.duration / this.iterations;
	}
}

/**
 * @ignore
 */
function runTest(fn: () => boolean): Result | undefined {
	let iterations = 0;

	const start = Date.now();
	const end = start + 10000;

	for (;;) {
		if (!fn()) {
			return;
		}

		++iterations;

		const now = Date.now();

		if (now >= end) {
			return new Result(now - start, iterations);
		}
	}
}

/**
 * @ignore
 */
export class Benchmark {
	protected tests: Array<Test> = [];

	public test(name: string, fn: () => boolean): void {
		this.tests.push({ name, fn });
	}

	public run(): void {
		console.log("Benchmark starting...");

		let maxLen = 0;

		$array.each(this.tests, (test) => {
			if (!test.fn()) {
				throw new Error(test.name + " failed");
			}

			maxLen = Math.max(maxLen, test.name.length);
		});

		const empty = runTest(() => true)!.ms();

		$array.each(this.tests, (test) => {
			const result = runTest(test.fn);

			if (result) {
				console.log(`${test.name.padStart(maxLen)}:  ${(result.ms() - empty).toFixed(10)} ms`);

			} else {
				throw new Error(test.name + " failed");
			}
		});

		console.log("Benchmark finished");
	}
}

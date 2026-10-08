/** @ignore *//** */

/**
 * ============================================================================
 * IMPORTS
 * ============================================================================
 * @hidden
 */
import * as $array from "./Array";

/**
 * A callback queued for a frame, called with the current time in
 * milliseconds.
 *
 * @ignore Exclude from docs
 */
export type Listener = (now: number) => void;

/**
 * @ignore
 */
let pendingFrame = false;

/**
 * @ignore
 */
const nextQueue: Array<Listener> = [];

/**
 * @ignore
 */
const readQueue: Array<Listener> = [];

/**
 * @ignore
 */
const writeQueue: Array<Listener> = [];

/**
 * @ignore
 */
const idleQueue: Array<Listener> = [];

/**
 * @ignore
 */
const fps = 1000 / 60;

/**
 * Calls `fn` on the next animation frame, or after about 1/60 of a second
 * where `requestAnimationFrame` is not available.
 *
 * @ignore Exclude from docs
 */
export const raf =
	(typeof requestAnimationFrame === "function"
		? function(fn: () => void): void {
			requestAnimationFrame(fn);
		}
		: function(fn: () => void): void {
			setTimeout(fn, fps);
		});

/**
 * Runs the queued "next", "read" and "write" callbacks, in that order, and
 * asks for another frame while any remain.
 *
 * @ignore Exclude from docs
 */
function frameLoop(): void {
	const now = Date.now();


	const length = nextQueue.length;

	for (let i = 0; i < length; ++i) {
		nextQueue[i](now);
	}

	$array.shiftLeft(nextQueue, length);


	for (let i = 0; i < readQueue.length; ++i) {
		readQueue[i](now);
	}

	readQueue.length = 0;


	for (let i = 0; i < writeQueue.length; ++i) {
		writeQueue[i](now);
	}

	writeQueue.length = 0;


	if (nextQueue.length === 0 && readQueue.length === 0) {
		pendingFrame = false;

	} else {
		raf(frameLoop);
	}
}

/**
 * Asks for a frame, unless one is already pending.
 *
 * @ignore Exclude from docs
 */
function pendFrame(): void {
	if (!pendingFrame) {
		pendingFrame = true;

		raf(frameLoop);
	}
}


/**
 * Calls `fn` on the next frame, before the read and write callbacks.
 *
 * @ignore Exclude from docs
 * @param fn  Callback
 */
export function nextFrame(fn: Listener): void {
	nextQueue.push(fn);
	pendFrame();
}

/**
 * Calls `fn` on the next frame, before the write callbacks.
 *
 * @ignore Exclude from docs
 * @param fn  Callback
 */
export function readFrame(fn: Listener): void {
	readQueue.push(fn);
	pendFrame();
}

/**
 * Calls `fn` on the next frame, after the read callbacks.
 *
 * @ignore Exclude from docs
 * @param fn  Callback
 */
export function writeFrame(fn: Listener): void {
	writeQueue.push(fn);
	pendFrame();
}

/**
 * Queues `fn` to be called by the next `triggerIdle()`.
 *
 * @ignore Exclude from docs
 * @param fn  Callback
 */
export function whenIdle(fn: Listener): void {
	idleQueue.push(fn);
}

/**
 * [triggerIdle description]
 *
 * @ignore Exclude from docs
 * @todo Description
 * @todo Maybe don't trigger a callback which was added while in the middle of triggering?
 */
export function triggerIdle(): void {
	const now = Date.now();

	const length = idleQueue.length;

	for (let i = 0; i < length; ++i) {
		(<any>idleQueue.shift())(now);
	}
}

/** @ignore *//** */

import type { IDisposer } from "./Disposer";
import * as $array from "./Array";
import * as $utils from "./Utils";

/**
 * @ignore
 */
interface Sensor {
	addTarget(target: Element, callback: () => void): void;
	removeTarget(target: Element): void;
}

/**
 * @ignore
 */
declare const ResizeObserver: any;

/**
 * @ignore
 */
class Native implements Sensor {
	private _observer: any;
	private _targets: Array<{ target: Element, callback: () => void }> = [];

	constructor() {
		this._observer = new ResizeObserver((entries: Array<any>) => {
			$array.each(entries, (entry) => {
				$array.each(this._targets, (x) => {
					if (x.target === entry.target) {
						x.callback();
					}
				});
			});
		});
	}

	addTarget(target: Element, callback: () => void) {
		this._observer.observe(target, { box: "border-box" });
		this._targets.push({ target, callback });
	}

	removeTarget(target: Element) {
		this._observer.unobserve(target);

		$array.keepIf(this._targets, (x) => {
			return x.target !== target;
		});
	}
}

/**
 * @ignore
 */
interface ClientBounds {
	width: number,
	height: number,
	left: number,
	right: number,
	top: number,
	bottom: number,
	x: number,
	y: number
}


/**
 * @ignore
 */
class Raf implements Sensor {
	public static delay: number = 200;

	private _timer: number | null = null;
	private _targets: Array<{ target: Element, callback: () => void, size: ClientRect | DOMRect | ClientBounds }> = [];

	addTarget(target: Element, callback: () => void) {
		if (this._timer === null) {
			let lastTime: number | null = null;

			const loop = () => {
				const currentTime = Date.now();

				if (lastTime === null || currentTime > (lastTime + Raf.delay)) {
					lastTime = currentTime;

					$array.each(this._targets, (x) => {
						let newSize = x.target.getBoundingClientRect();

						if (newSize.width !== x.size.width || newSize.height !== x.size.height) {
							x.size = newSize;
							x.callback();
						}
					});
				}

				if (this._targets.length === 0) {
					this._timer = null;

				} else {
					this._timer = requestAnimationFrame(loop);
				}
			};

			this._timer = requestAnimationFrame(loop);
		}

		// We start off with fake bounds so that sensor always kicks in
		let size = { width: 0, height: 0, left: 0, right: 0, top: 0, bottom: 0, x: 0, y: 0 };
		this._targets.push({ target, callback, size });
	}

	removeTarget(target: Element) {
		$array.keepIf(this._targets, (x) => {
			return x.target !== target;
		});

		if (this._targets.length === 0) {
			if (this._timer !== null) {
				cancelAnimationFrame(this._timer);
				this._timer = null;
			}
		}
	}
}


/**
 * @ignore
 */
let observer: Sensor | null = null;

/**
 * @ignore
 */
function makeSensor(): Sensor {
	if (observer === null) {
		if (typeof ResizeObserver !== "undefined") {
			observer = new Native();

		} else {
			observer = new Raf();
		}
	}

	return observer;
}

/**
 * @ignore
 */
export class ResizeSensor implements IDisposer {
	private _sensor: Sensor;
	private _element: Element;
	private _listener: IDisposer;
	private _disposed: boolean = false;

	constructor(element: Element, callback: () => void) {
		this._sensor = makeSensor();
		this._element = element;

		// This is needed because we need to know when the window is zoomed
		this._listener = $utils.onZoom(callback);

		this._sensor.addTarget(element, callback);
	}

	public isDisposed() {
		return this._disposed;
	}

	public dispose() {
		if (!this._disposed) {
			this._disposed = true;
			this._sensor.removeTarget(this._element);
			this._listener.dispose();
		}
	}

	public get sensor(): Sensor {
		return this._sensor;
	}
}

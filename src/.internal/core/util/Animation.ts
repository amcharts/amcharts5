import type { Entity, Animation } from "./Entity";
import { Percent } from "./Percent";
import { Color } from "./Color";
import type { Easing } from "./Ease";
import { EventDispatcher, Events } from "./EventDispatcher";
import * as $object from "./Object";

export type Animations<T> = { [K in keyof T]?: Animation<T[K]> };

/**
 * @ignore
 */
export async function waitForAnimations<T>(animations: Animations<T> | undefined): Promise<void> {
	if (animations !== undefined) {
		const promises: Array<Promise<void>> = [];

		$object.each(animations, (_, animation) => {
			promises.push(animation.waitForStop());
		});

		await Promise.all(promises);
	}
}


interface ITime {
	readonly tag: unique symbol;
}

/**
 * New type which allows for conversion from a number into a Time, but not from a Time to a number
 */
export type Time = number | ITime;


/**
 * @ignore
 */
export function normalize(value: number, min: number, max: number): Time {
	if (min === max) {
		return 0;

	} else {
		return Math.min(Math.max((value - min) * (1 / (max - min)), 0), 1);
	}
}

/**
 * @ignore
 */
export function range(diff: Time, from: number, to: number): number {
	return from + (diff as number * (to - from));
}

/**
 * @ignore
 */
export function defaultInterpolate<A, B>(diff: Time, from: A, to: B): A | B {
	if (diff >= 1) {
		return to;

	} else {
		return from;
	}
}

/**
 * @ignore
 */
export function percentInterpolate(diff: Time, from: Percent, to: Percent): Percent {
	return new Percent(range(diff, from.percent, to.percent));
}

/**
 * @ignore
 */
export function colorInterpolate(diff: Time, from: Color, to: Color): Color {
	return Color.interpolate(diff, from, to);
}

/**
 * @ignore
 */
export function getInterpolate(from: number, to: number): typeof range;

/**
 * @ignore
 */
export function getInterpolate(from: Percent, to: Percent): typeof percentInterpolate;

/**
 * @ignore
 */
export function getInterpolate(from: any, to: any): typeof defaultInterpolate;

/**
 * @ignore
 */
export function getInterpolate(from: any, to: any): (diff: Time, from: any, to: any) => any {
	if (typeof from === "number" && typeof to === "number") {
		return range;
	}

	if (from instanceof Percent && to instanceof Percent) {
		return percentInterpolate;
	}

	if (from instanceof Color && to instanceof Color) {
		return colorInterpolate;
	}

	return defaultInterpolate;
}


export enum AnimationState {
	Stopped,
	Playing,
	Paused,
}

export interface IAnimation {
	_runAnimation(_currentTime: number): AnimationState;
}


/**
 * @ignore
 */
export interface IEntityEvents {
	started: {};
	stopped: {};
	// TODO replace this with stopped
	ended: {};
	progress: { progress: number };
}

/**
 * @ignore
 */
export class AnimationTime implements IAnimation {
	protected _entity: Entity;
	protected _duration: number;

	protected _playingDuration: number | null = null;
	protected _startingTime: number | null = null;
	protected _current: Time = 0;
	protected _from: Time = 0;
	protected _to: Time = 0;

	declare public _events: IEntityEvents;
	public events: EventDispatcher<Events<this, this["_events"]>> = new EventDispatcher();

	public easing: Easing | undefined;

	constructor(entity: Entity, duration: number) {
		this._entity = entity;
		this._duration = duration;
	}

	private _stopEvent() {
		const type = "stopped";
		if (this.events.isEnabled(type)) {
			this.events.dispatch(type, { type: type, target: this });
		}
	}

	public _runAnimation(currentTime: number): AnimationState {
		if (this._playingDuration !== null) {
			if (this._startingTime === null) {
				this._startingTime = currentTime;
				return AnimationState.Playing;
			}
			else {
				const diff = (currentTime - this._startingTime) / this._playingDuration;

				if (diff >= 1) {
					this._playingDuration = null;
					this._startingTime = null;
					this._from = this._to;
					this._current = this._to;
					this._entity.markDirty();
					this._stopEvent();
					const type = "ended";
					if (this.events.isEnabled(type)) {
						this.events.dispatch(type, { type: type, target: this });
					}
					return AnimationState.Stopped;

				} else {
					this._current = range(diff, this._from as number, this._to as number);
					this._entity.markDirty();

					const type = "progress";
					if (this.events.isEnabled(type)) {
						this.events.dispatch(type, { type: type, target: this, progress: diff });
					}

					return AnimationState.Playing;
				}
			}

		} else {
			return AnimationState.Stopped;
		}
	}

	private _play() {
		this._from = this._current;

		if (this._playingDuration === null) {
			this._entity._root._addAnimation(this);

			const type = "started";
			if (this.events.isEnabled(type)) {
				this.events.dispatch(type, { type: type, target: this });
			}

		} else {
			this._startingTime = null;
		}

		this._playingDuration = Math.abs((this._to as number) - (this._from as number)) * this._duration;
	}

	public get duration(): number {
		return this._duration;
	}

	public set duration(value: number) {
		if (this._duration !== value) {
			this._duration = value;

			if (value === 0) {
				this.jumpTo(this._to);

			} else if (this._current !== this._to) {
				this._play();
			}
		}
	}

	public get current(): Time {
		if (this.easing) {
			return this.easing(this._current);

		} else {
			return this._current;
		}
	}

	public stop() {
		this.jumpTo(this._current);
	}

	public jumpTo(value: Time) {
		if (this._current !== value) {
			this._entity.markDirty();
		}

		if (this._playingDuration !== null) {
			this._stopEvent();
		}

		this._playingDuration = null;
		this._startingTime = null;
		this._current = value;
		this._from = value;
		this._to = value;
	}

	public tweenTo(value: Time) {
		if (this._current === value || this._duration === 0) {
			this.jumpTo(value);

		} else {
			if (this._to !== value) {
				this._to = value;
				this._play();
			}
		}
	}
}


/*export class AnimationValue extends AnimationTime {
	public _min: number;
	public _max: number;

	constructor(entity: Entity, duration: number, min: number, max: number) {
		super(entity, duration);
		this._min = min;
		this._max = max;
	}

	public get min(): number {
		return this._min;
	}

	public set min(value: number) {
		if (this._min !== value) {
			this._min = value;
			this._entity.markDirty();
		}
	}

	public get max(): number {
		return this._max;
	}

	public set max(value: number) {
		if (this._max !== value) {
			this._max = value;
			this._entity.markDirty();
		}
	}

	public currentValue(): number {
		return range(super.currentTime(), this._min, this._max);
	}

	public jumpToValue(value: number) {
		super.jumpToTime(normalize(value, this._min, this._max));
	}

	public tweenToValue(value: number) {
		super.tweenToTime(normalize(value, this._min, this._max));
	}
}
*/

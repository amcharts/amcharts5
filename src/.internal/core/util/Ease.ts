/**
 * A collection of easing functions.
 *
 * Parts of this collection are taken from D3.js library (https://d3js.org/)
 */

/**
 * ============================================================================
 * IMPORTS
 * ============================================================================
 * @hidden
 */
import * as $math from "./Math";
import * as $object from "./Object";
import type { Time } from "./Animation";

/**
 * An easing function: takes animation progress from `0` to `1` and returns
 * the eased progress.
 */
export type Easing = (time: Time) => Time;

/**
 * What an easing function is, by name: the base easing, which way it applies,
 * and whether it goes there and back. Only functions made from the ones here
 * have one - a hand-written easing cannot be named.
 *
 * @since 5.20.8
 */
export interface IEasingInfo {
	easing: string;
	ease?: "out" | "inOut";
	yoyo?: boolean;
}

function named(easing: Easing, info: IEasingInfo): Easing {
	(easing as any)._easingInfo = info;
	return easing;
}

/**
 * Returns what an easing function is, by name, or `undefined` for one that was
 * not made from the functions here.
 *
 * @param   easing  Easing function
 * @return          Its name and options
 * @since 5.20.8
 */
export function easingInfo(easing: Easing | undefined): IEasingInfo | undefined {
	return easing ? (easing as any)._easingInfo : undefined;
}

/**
 * The functions below are from D3.js library (https://d3js.org/)
 *
 * ----------------------------------------------------------------------------
 * Copyright 2017 Mike Bostock
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice,
 *	this list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *	this list of conditions and the following disclaimer in the documentation
 *	and/or other materials provided with the distribution.
 *
 * 3. Neither the name of the copyright holder nor the names of its
 *	contributors may be used to endorse or promote products derived from this
 *	software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 * ----------------------------------------------------------------------------
 * @hidden
 */

/**
 * No easing: the animation runs at a constant speed.
 */
export function linear(t: Time): Time {
	return t;
}

/**
 * Starts slowly and speeds up (progress squared).
 */
export function quad(t: Time): Time {
	return (t as number) * (t as number);
}

/**
 * Starts slowly and speeds up, more sharply than `quad` (progress cubed).
 */
export function cubic(t: Time): Time {
	return (t as number) * (t as number) * (t as number);
}

/**
 * Raises progress to the power `e`: `2` is the same as `quad`, `3` as
 * `cubic`.
 *
 * @param   t  Progress, from `0` to `1`
 * @param   e  Exponent
 * @return     Eased progress
 */
export function pow(t: Time, e: number): Time {
	return Math.pow(t as number, e);
}

/**
 * Barely moves at first, then speeds up sharply (exponential).
 */
export function exp(t: Time): Time {
	return Math.pow(2, 10 * (t as number) - 10);
}

/**
 * Starts gently and speeds up, following a sine curve.
 */
export function sine(t: Time): Time {
	return 1 - Math.cos((t as number) * $math.HALFPI);
}

/**
 * Starts slowly and speeds up steeply near the end, following a quarter
 * circle.
 */
export function circle(t: Time): Time {
	return 1 - Math.sqrt(1 - (t as number) * (t as number));
}

/**
 * ============================================================================
 * TRANSFORMERS
 * ============================================================================
 * @hidden
 */

/**
 * Makes an easing go there and back: it reaches the end halfway through and
 * returns to the start.
 *
 * @param   ease  Easing function
 * @return        Easing function
 */
export function yoyo(ease: Easing): Easing {
	const easing = function (t: Time) {
		if ((t as number) < 0.5) {
			return ease((t as number) * 2.0);

		} else {
			return ease((1.0 - (t as number)) * 2.0);
		}
	};
	const info = easingInfo(ease);
	return info && !info.yoyo ? named(easing, { ...info, yoyo: true }) : easing;
}

/**
 * Turns an easing around, so it starts fast and ends slowly. The easings
 * here ease in (start slowly) unless wrapped in `out()` or `inOut()`.
 *
 * @param   ease  Easing function
 * @return        Easing function
 */
export function out(ease: Easing): Easing {
	const easing = function (t: Time) {
		return 1.0 - (ease(1.0 - (t as number)) as number);
	};
	const info = easingInfo(ease);
	return info && !info.ease && !info.yoyo ? named(easing, { ...info, ease: "out" }) : easing;
}

/**
 * Applies an easing at both ends: it eases in for the first half and out for
 * the second.
 *
 * @param   ease  Easing function
 * @return        Easing function
 */
export function inOut(ease: Easing): Easing {
	const easing = function (t: Time) {
		if (t as number <= 0.5) {
			return ease(t as number * 2.0) as number / 2.0;

		} else {
			return 1.0 - (ease((1.0 - (t as number)) * 2.0) as number / 2.0);
		}
	};
	const info = easingInfo(ease);
	return info && !info.ease && !info.yoyo ? named(easing, { ...info, ease: "inOut" }) : easing;
}

/**
 * ============================================================================
 * BOUNCE
 * ============================================================================
 * @hidden
 */
let b1 = 4 / 11,
	b2 = 6 / 11,
	b3 = 8 / 11,
	b4 = 3 / 4,
	b5 = 9 / 11,
	b6 = 10 / 11,
	b7 = 15 / 16,
	b8 = 21 / 22,
	b9 = 63 / 64,
	b0 = 1 / b1 / b1;

/**
 * Bounces at the start before heading to the end. `out(bounce)` bounces at
 * the end instead, like a dropped ball.
 */
export function bounce(t: Time): Time {
	return 1 - (bounceOut(1 - (t as number)) as number);
}

/**
 * @ignore
 */
function bounceOut(t: Time): Time {
	t = t as number;
	if (t < b1) {
		return b0 * t * t;
	} else if (t < b3) {
		return b0 * (t -= b2) * t + b4;
	} else if (t < b6) {
		return b0 * (t -= b5) * t + b7;
	} else {
		return b0 * (t -= b8) * t + b9;
	}
}

/**
 * ============================================================================
 * ELASTIC
 * ============================================================================
 * @hidden
 */

/**
 * @ignore
 */
let tau = 2 * Math.PI;

/**
 * @ignore
 */
let amplitude = 1;

/**
 * @ignore
 */
let period = 0.3 / tau;

/**
 * @ignore
 */
let s = Math.asin(1 / amplitude) * period;

/**
 * Swings back and forth with growing swings before reaching the end, like a
 * spring. `out(elastic)` springs past the end and settles instead.
 */
export function elastic(t: Time): Time {
	let v = t as number;
	return amplitude * Math.pow(2, 10 * --v) * Math.sin((s - v) / period);
}

/**
 * Easing functions by name, for places a function cannot go - a JSON config.
 *
 * @ignore
 */
const namedEasings: { [name: string]: Easing } = { linear, quad, cubic, exp, sine, circle, bounce, elastic };

$object.each(namedEasings, (name, easing) => {
	named(easing, { easing: String(name) });
});

/**
 * Returns the easing function called `name` (`"linear"`, `"quad"`, `"cubic"`,
 * `"exp"`, `"sine"`, `"circle"`, `"bounce"` or `"elastic"`), eased in, out or
 * both ways. An unknown name gives `linear`.
 *
 * @param   name  Easing name
 * @param   mode  `"in"` (default), `"out"` or `"inOut"`
 * @return        Easing function
 * @since 5.20.8
 */
export function byName(name?: string, mode?: "in" | "out" | "inOut"): Easing {
	const ease = (name && namedEasings[name]) || linear;

	if (mode === "out") {
		return out(ease);
	}

	if (mode === "inOut") {
		return inOut(ease);
	}

	return ease;
}

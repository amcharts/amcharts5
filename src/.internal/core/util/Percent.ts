/**
 * ============================================================================
 * MAIN CLASS
 * ============================================================================
 * @hidden
 */

/**
 * Represents a relative value (percent).
 *
 * The Percent object, can be instantiated using two ways:
 *
 * * Via `new Percent(X)`.
 * * Via `am5.percent(X)`.
 *
 * You can also use shortcut functions for `0%`, `50%`, and `100%`:
 * * `am5.p0`
 * * `am5.p50`
 * * `am5.p100`
 */
export class Percent {

	/**
	 * Value in percent.
	 */
	protected _value: number;

	/**
	 * Constructor.
	 *
	 * @param percent  Percent value
	 */
	constructor(percent: number) {
		this._value = percent;
	}

	/**
	 * Relative value.
	 *
	 * E.g. 100% is 1, 50% is 0.5, etc.
	 *
	 * This is useful to apply transformations to other values. E.g.:
	 *
	 * ```TypeScript
	 * let value = 256;
	 * let percent = new am5.p50;
	 * console.log(value * percent.value); // outputs 128
	 * ```
	 * ```JavaScript
	 * var value = 256;
	 * var percent = new am5.p50;
	 * console.log(value * percent.value); // outputs 128
	 * ```
	 *
	 * Alternatively, you can use `am5.percent()` helper function:
	 *
	 * ```TypeScript
	 * let value = 256;
	 * let percent = am5.p50;
	 * console.log(value * percent.value); // outputs 128
	 * ```
	 * ```JavaScript
	 * var value = 256;
	 * var percent = am5.p50;
	 * console.log(value * percent.value); // outputs 128
	 * ```
	 *
	 * @readonly
	 * @return Relative value
	 */
	public get value(): number {
		return this._value / 100;
	}

	/**
	 * Value in percent.
	 *
	 * @readonly
	 * @return Percent
	 */
	public get percent(): number {
		return this._value;
	}

	public toString(): string {
		return "" + this._value + "%";
	}

	public interpolate(min: number, max: number): number {
		return min + (this.value * (max - min));
	}

	static normalize(percent: Percent | number, min: number, max: number): Percent {
		if (percent instanceof Percent) {
			return percent;

		} else {
			if (min === max) {
				return new Percent(0);

			} else {
				return new Percent(Math.min(Math.max((percent - min) * (1 / (max - min)), 0), 1) * 100);
			}
		}
	}

	/*public toNumber(): number {
		return this.percent;
	}*/

}


/**
 * Converts numeric percent value to a proper [[Percent]] object.
 *
 * ```TypeScript
 * pieSeries.set("radius", am5.percent(80));
 * ```
 * ```JavaScript
 * pieSeries.set("radius", am5.percent(80));
 * ```
 *
 * @param value  Percent
 * @return Percent object
 */
export function percent(value: number): Percent {
	return new Percent(value);
}

/**
 * A shortcut function to `am5.percent(0)`.
 */
export const p0 = percent(0);

/**
 * A shortcut function to `am5.percent(100)`.
 */
export const p100 = percent(100);

/**
 * A shortcut function to `am5.percent(50)`.
 */
export const p50 = percent(50);


/**
 * Checks if value is a [[Percent]] object.
 *
 * @ignore Exclude from docs
 * @param value  Input value
 * @return Is percent?
 */
export function isPercent(value: any): boolean {
	return value instanceof Percent;
}

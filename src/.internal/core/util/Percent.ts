/**
 * ============================================================================
 * MAIN CLASS
 * ============================================================================
 * @hidden
 */

/**
 * A relative value in percent, such as 50% of a container's width.
 *
 * Create one with `am5.percent(50)` or `new am5.Percent(50)`. For `0%`,
 * `50%` and `100%` there are ready-made `am5.p0`, `am5.p50` and `am5.p100`.
 */
export class Percent {

	/**
	 * Value in percent.
	 */
	protected _value: number;

	/**
	 * Creates a percent value.
	 *
	 * @param percent  Percent value, such as `50` for 50%
	 */
	constructor(percent: number) {
		this._value = percent;
	}

	/**
	 * The value as a fraction: `1` for 100%, `0.5` for 50%. Multiply by it to
	 * take a share of another value:
	 *
	 * ```TypeScript
	 * let value = 256;
	 * let percent = am5.percent(50);
	 * console.log(value * percent.value); // outputs 128
	 * ```
	 * ```JavaScript
	 * var value = 256;
	 * var percent = am5.percent(50);
	 * console.log(value * percent.value); // outputs 128
	 * ```
	 *
	 * The same with the `am5.p50` shortcut:
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
	 * The value in percent: `50` for 50%.
	 *
	 * @readonly
	 * @return Percent
	 */
	public get percent(): number {
		return this._value;
	}

	/**
	 * Returns the value as a string, such as `"50%"`.
	 *
	 * @return  String
	 */
	public toString(): string {
		return "" + this._value + "%";
	}

	/**
	 * Returns the number this percent of the way from `min` to `max`.
	 *
	 * @param   min  Value at 0%
	 * @param   max  Value at 100%
	 * @return       Value
	 */
	public interpolate(min: number, max: number): number {
		return min + (this.value * (max - min));
	}

	/**
	 * Returns where `percent` falls between `min` and `max` as a [[Percent]],
	 * from 0% to 100%. A [[Percent]] is returned as it is.
	 *
	 * @param   percent  Value
	 * @param   min      Value at 0%
	 * @param   max      Value at 100%
	 * @return           Percent
	 */
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
 * Creates a [[Percent]] from a number in percent: `am5.percent(80)` is 80%.
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
 * A ready-made `am5.percent(0)`.
 */
export const p0 = percent(0);

/**
 * A ready-made `am5.percent(100)`.
 */
export const p100 = percent(100);

/**
 * A ready-made `am5.percent(50)`.
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

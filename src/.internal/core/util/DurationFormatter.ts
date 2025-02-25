import type { TimeUnit } from "./Time";

import { Entity, IEntitySettings, IEntityPrivate } from "./Entity"
import { TextFormatter } from "./TextFormatter";

import * as $object from "./Object";
import * as $utils from "./Utils";
import * as $type from "./Type";


export interface IDurationFormatterSettings extends IEntitySettings {

	/**
	 * A universal duration format to use wherever number needs to be formatted
	 * as a duration.
	 */
	durationFormat?: string;

	/**
	 * A base value. Any number below it will be considered "negative".
	 *
	 * @default 0
	 */
	negativeBase?: number;

	/**
	 * Identifies what values are used in duration.
	 *
	 * Available options: `"millisecond"`, `"second"` (default), `"minute"`, `"hour"`, `"day"`, `"week"`, `"month"`, and `"year"`.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/formatters/formatting-durations/#Base_unit} for more info
	 * @default "second"
	 */
	baseUnit?: TimeUnit;

	/**
	 * Time unit dependent duration formats.
	 *
	 * Used be [[DurationAxis]].
	 */
	durationFormats?: Partial<Record<TimeUnit, Partial<Record<TimeUnit, string>>>>;

	/**
	 * An array of data fields that hold duration values and should be formatted
	 * with a [[DurationFormatter]].
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/formatters/data-placeholders/#Formatting_placeholders} for more info
	 */
	durationFields?: string[];

}

export interface IDurationFormatterPrivate extends IEntityPrivate {
}

/**
 * A class used to format numberic values as time duration.
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/formatters/formatting-durations/} for more info
 */
export class DurationFormatter extends Entity {
	declare public _settings: IDurationFormatterSettings;
	declare public _privateSettings: IDurationFormatterPrivate;

	protected _setDefaults() {
		const dmillisecond = "_duration_millisecond";
		const dsecond = "_duration_second";
		const dminute = "_duration_minute";
		const dhour = "_duration_hour";
		const dday = "_duration_day";
		const dweek = "_duration_week";
		const dmonth = "_duration_month";
		const dyear = "_duration_year";

		const asecond = "_second";
		const aminute = "_minute";
		const ahour = "_hour";
		const aday = "_day";
		const aweek = "_week";
		const amonth = "_week";
		const ayear = "_year";

		// Defaults
		this._setDefault("negativeBase", 0);
		this._setDefault("baseUnit", "second");
		this._setDefault("durationFormats", {
			"millisecond": {
				"millisecond": this._t(dmillisecond),
				"second": this._t((dmillisecond + asecond) as any),
				"minute": this._t((dmillisecond + aminute) as any),
				"hour": this._t((dmillisecond + ahour) as any),
				"day": this._t((dmillisecond + aday) as any),
				"week": this._t((dmillisecond + aweek) as any),
				"month": this._t((dmillisecond + amonth) as any),
				"year": this._t((dmillisecond + ayear) as any)
			},
			"second": {
				"second": this._t((dsecond) as any),
				"minute": this._t((dsecond + aminute) as any),
				"hour": this._t((dsecond + ahour) as any),
				"day": this._t((dsecond + aday) as any),
				"week": this._t((dsecond + aweek) as any),
				"month": this._t((dsecond + amonth) as any),
				"year": this._t((dsecond + ayear) as any)
			},
			"minute": {
				"minute": this._t((dminute) as any),
				"hour": this._t((dminute + ahour) as any),
				"day": this._t((dminute + aday) as any),
				"week": this._t((dminute + aweek) as any),
				"month": this._t((dminute + amonth) as any),
				"year": this._t((dminute + ayear) as any)
			},
			"hour": {
				"hour": this._t((dhour) as any),
				"day": this._t((dhour + aday) as any),
				"week": this._t((dhour + aweek) as any),
				"month": this._t((dhour + amonth) as any),
				"year": this._t((dhour + ayear) as any)
			},
			"day": {
				"day": this._t((dday) as any),
				"week": this._t((dday + aweek) as any),
				"month": this._t((dday + amonth) as any),
				"year": this._t((dday + ayear) as any)
			},
			"week": {
				"week": this._t((dweek) as any),
				"month": this._t((dweek + amonth) as any),
				"year": this._t((dweek + ayear) as any)
			},
			"month": {
				"month": this._t((dmonth) as any),
				"year": this._t((dmonth + ayear) as any)
			},
			"year": {
				"year": this._t(dyear)
			}
		});

		super._setDefaults();
	}


	/**
	 * Collection of aliases for units.
	 */
	protected _unitAliases: { [index: string]: string } = {
		"Y": "y",
		"D": "d",
		"H": "h",
		"K": "h",
		"k": "h",
		"n": "S"
	};

	public _beforeChanged() {
		super._beforeChanged();
	}

	/**
	 * Formats the number as duration.
	 *
	 * For example `1000` (base unit seconds) would be converted to `16:40` as in
	 * 16 minutes and 40 seconds.
	 *
	 * @param value   Value to format
	 * @param format  Format to apply
	 * @param base    Override base unit
	 * @return Formatted number
	 */
	public format(value: number | string, format?: string, base?: TimeUnit): string {

		// no base unit?
		let baseUnit = base || this.get("baseUnit");

		// no format passed in or empty
		if (typeof format === "undefined" || format === "") {
			if (this.get("durationFormat") != null) {
				format = this.get("durationFormat");
			}
			else {
				format = this.getFormat($type.toNumber(value), undefined, baseUnit);
			}
		}

		// Clean format
		format = $utils.cleanFormat(format!);

		// get format info (it will also deal with parser caching)
		let info = this.parseFormat(format, baseUnit);

		// cast to number just in case
		// TODO: maybe use better casting
		let source: number = Number(value);

		// format and replace the number
		let details;
		if (source > this.get("negativeBase")) {
			details = info.positive;
		}
		else if (source < this.get("negativeBase")) {
			details = info.negative;
		}
		else {
			details = info.zero;
		}


		// Format
		let formatted = this.applyFormat(source, details);

		// Apply color?
		if (details.color !== "") {
			formatted = "[" + details.color + "]" + formatted + "[/]";
		}

		return formatted;
	}

	/**
	 * Parses supplied format into structured object which can be used to format
	 * the number.
	 *
	 * @param format  Format string, i.e. "#,###.00"
	 * @param base    Override base unit
	 * @return Parsed information
	 */
	protected parseFormat(format: string, base?: TimeUnit): any {

		// Check cache
		// TODO
		// let cached = this.getCache(format);
		// if (cached != null) {
		// 	return cached;
		// }

		// no base unit?
		let baseUnit = base || this.get("baseUnit");

		// Initialize duration parsing info
		let info = {
			"positive": {
				"color": "",
				"template": "",
				"parts": <any>[],
				"source": "",
				"baseUnit": baseUnit,
				"parsed": false,
				"absolute": false
			},
			"negative": {
				"color": "",
				"template": "",
				"parts": <any>[],
				"source": "",
				"baseUnit": baseUnit,
				"parsed": false,
				"absolute": false
			},
			"zero": {
				"color": "",
				"template": "",
				"parts": <any>[],
				"source": "",
				"baseUnit": baseUnit,
				"parsed": false,
				"absolute": false
			}
		};

		// Escape double vertical bars (that mean display one vertical bar)
		format = format.replace("||", $type.PLACEHOLDER2);

		// Split it up and deal with different formats
		let parts = format.split("|");
		info.positive.source = parts[0];

		if (typeof parts[2] === "undefined") {
			info.zero = info.positive;
		}
		else {
			info.zero.source = parts[2];
		}

		if (typeof parts[1] === "undefined") {
			info.negative = info.positive;
		}
		else {
			info.negative.source = parts[1];
		}

		// Parse each
		$object.each(info, (_part, item) => {
			// Already parsed
			if (item.parsed) {
				return;
			}

			// Check cached
			// TODO
			// if (typeof this.getCache(item.source) !== "undefined") {
			// 	info[part] = this.getCache(item.source);
			// 	return;
			// }

			// Begin parsing
			let partFormat: string = item.source;

			// Check for [] directives
			let dirs: string[] | null = [];
			dirs = item.source.match(/^\[([^\]]*)\]/);
			if (dirs && dirs.length && dirs[0] !== "") {
				partFormat = item.source.substr(dirs[0].length);
				item.color = dirs[1];
			}


			// Let TextFormatter split into chunks
			let chunks = TextFormatter.chunk(partFormat, true);
			for (let i: number = 0; i < chunks.length; i++) {
				let chunk = chunks[i];

				// replace back double vertical bar
				chunk.text = chunk.text.replace($type.PLACEHOLDER2, "|");

				if (chunk.type === "value") {

					// Just "Duration"?
					// if (chunk.text.toLowerCase() === "duration") {
					// 	chunk.text = durationFormat;
					// }

					// Check for "a" (absolute) modifier
					if (chunk.text.match(/[yYMdDwhHKkmsSn]+a/)) {
						item.absolute = true;
						chunk.text = chunk.text.replace(/([yYMdDwhHKkmsSn]+)a/, "$1");
					}

					// Find all possible parts
					let matches = chunk.text.match(/y+|Y+|M+|d+|D+|w+|h+|H+|K+|k+|m+|s+|S+|n+/g);

					if (matches) {
						// Populate template
						for (let x = 0; x < matches.length; x++) {
							// Is it an alias?
							if (matches[x] == null) {
								matches[x] = this._unitAliases[matches[x]];
							}
							item.parts.push(matches[x]);
							chunk.text = chunk.text.replace(matches[x], $type.PLACEHOLDER);
						}
					}
				}

				// Apply to template
				item.template += chunk.text;
			}

			// Apply style formatting
			//item.template = TextFormatter.format(item.template, this.outputFormat);

			// Save cache
			// TODO
			//this.setCache(item.source, item);

			// Mark this as parsed
			item.parsed = true;
		});

		// Save cache (the whole thing)
		// TODO
		//this.setCache(format, info);

		return info;
	}

	/**
	 * Applies parsed format to a numeric value.
	 *
	 * @param value    Value
	 * @param details  Parsed format as returned by {parseFormat}
	 * @return Formatted duration
	 */
	protected applyFormat(value: number, details: any): string {

		// Use absolute values
		let negative = !details.absolute && (value < this.get("negativeBase"));
		value = Math.abs(value);


		// Recalculate to milliseconds
		let tstamp = this.toTimeStamp(value, details.baseUnit);

		// Init return value
		let res = details.template;
		const values: any  = {
			millisecond: 0,
			second: 0,
			minute: 0,
			hour: 0,
			day: 0,
			week: 0,
			month: 0,
			year: 0
		};

		// Iterate through duration parts
		for (let i = 0, len = details.parts.length; i < len; i++) {

			// Gather the part
			let part = details.parts[i];
			let unit: any = this._toTimeUnit(part.substr(0, 1));

			// Calculate current unit value
			let ints: number;
			const unitValue = this._getUnitValue(unit!);
			if (i < (len -1)) {
				ints = Math.floor(tstamp / unitValue);
			}
			else {
				ints = Math.round(tstamp / unitValue);
			}

			values[unit] += ints;

			// Reduce timestamp
			tstamp -= ints * unitValue;
		}

		// Check if we have full unit that we need to bump up to higher unit
		$object.each(values, (unit, value) => {
			if (unit == "millisecond" && value == 1000) {
				values["second"]++;
				values["millisecond"] = 0;
			}
			else if (unit == "second" && value == 60) {
				values["minute"]++;
				values["second"] = 0;
			}
			else if (unit == "minute" && value == 60) {
				values["hour"]++;
				values["minute"] = 0;
			}
			else if (unit == "hour" && value == 24) {
				values["day"]++;
				values["hour"] = 0;
			}
			else if (unit == "day" && value == 7) {
				values["week"]++;
				values["day"] = 0;
			}
			else if (unit == "day" && value == 30) {
				values["month"]++;
				values["day"] = 0;
			}
			else if (unit == "month" && value == 12) {
				values["year"]++;
				values["month"] = 0;
			}
			// if (val > 0) {
			// 	res = res.replace($type.PLACEHOLDER, $utils.padString(val, 2, "0"));
			// }
			// else {
			// 	res = res.replace($type.PLACEHOLDER, "");
			// }
		});

		// Iterate again
		for (let i = 0, len = details.parts.length; i < len; i++) {
			// Gather the part
			let part = details.parts[i];
			let unit: any = this._toTimeUnit(part.substr(0, 1));
			let digits = part.length;

			// Calculate current unit value
			res = res.replace($type.PLACEHOLDER, $utils.padString(values[unit], digits, "0"));
		}


		// Reapply negative sign
		if (negative) {
			res = "-" + res;
		}

		return res;
	}

	/**
	 * Converts numeric value to timestamp in milliseconds.
	 *
	 * @param value     A source value
	 * @param baseUnit  Base unit the source value is in: "q", "s", "i", "h", "d", "w", "m", "y"
	 * @return Value representation as a timestamp in milliseconds
	 */
	public toTimeStamp(value: number, baseUnit: TimeUnit): number {
		return value * this._getUnitValue(baseUnit);
	}

	protected _toTimeUnit(code: string): TimeUnit | undefined {
		switch (code) {
			case "S":
				return "millisecond";
			case "s":
				return "second";
			case "m":
				return "minute";
			case "h":
				return "hour";
			case "d":
				return "day";
			case "w":
				return "week";
			case "M":
				return "month";
			case "y":
				return "year";
		};
	}

	/**
	 * Returns appropriate default format for the value.
	 *
	 * If `maxValue` is sepcified, it will use that value to determine the time
	 * unit for the format.
	 *
	 * For example if your `baseUnit` is `"second"` and you pass in `10`, you
	 * will get `"10"`.
	 *
	 * However, you might want it to be formatted in the context of bigger scale,
	 * say 10 minutes (600 seconds). If you pass in `600` as `maxValue`, all
	 * values, including small ones will use format with minutes, e.g.:
	 * `00:10`, `00:50`, `12: 30`, etc.
	 *
	 * @param value     Value to format
	 * @param maxValue  Maximum value to be used to determine format
	 * @param baseUnit  Base unit of the value
	 * @return Format
	 */
	public getFormat(value: number, maxValue?: number, baseUnit?: TimeUnit): string {

		// Is format override set?
		if (this.get("durationFormat") != null) {
			return this.get("durationFormat")!;
		}

		// Get base unit
		if (!baseUnit) {
			baseUnit = this.get("baseUnit");
		}

		if (maxValue != null && value != maxValue) {
			value = Math.abs(value);
			maxValue = Math.abs(maxValue);
			let maxUnit = this.getValueUnit(Math.max(value, maxValue), baseUnit);
			return (<any>this.get("durationFormats"))[baseUnit!][maxUnit!];
		}
		else {
			let unit = this.getValueUnit(value, baseUnit);
			return (<any>this.get("durationFormats"))[baseUnit!][unit!];
		}

	}

	/**
	 * Returns value's closest denominator time unit, e.g 100 seconds is
	 * `"minute"`, while 59 seconds would still be `second`.
	 *
	 * @param value     Source duration value
	 * @param baseUnit  Base unit
	 * @return Denominator
	 */
	public getValueUnit(value: number, baseUnit?: TimeUnit): TimeUnit | undefined {

		// Get base unit
		if (!baseUnit) {
			baseUnit = this.get("baseUnit");
		}

		// Convert to milliseconds
		let currentUnit: any;
		let ms = this.getMilliseconds(value, baseUnit);
		$object.eachContinue(this._getUnitValues(), (key, val) => {
			if (key == baseUnit || currentUnit) {
				let num = ms / val;
				if (num <= 1) {
					if (!currentUnit) {
						currentUnit = key;
					}
					return false;
				}
				currentUnit = key;
			}
			return true;
		});

		return currentUnit;
	}

	/**
	 * Converts value to milliseconds according to `baseUnit`.
	 *
	 * @param value     Source duration value
	 * @param baseUnit  Base unit
	 * @return Value in milliseconds
	 */
	public getMilliseconds(value: number, baseUnit?: TimeUnit): number {

		// Get base unit
		if (!baseUnit) {
			baseUnit = this.get("baseUnit");
		}

		return value * this._getUnitValue(baseUnit!);
	}

	protected _getUnitValue(timeUnit: TimeUnit): number {
		return this._getUnitValues()[timeUnit];
	}

	protected _getUnitValues(): any {
		return {
			"millisecond": 1,
			"second": 1000,
			"minute": 60000,
			"hour": 3600000,
			"day": 86400000,
			"week": 604800000,
			"month": 2592000000,
			"year": 31536000000,
		};
	}

}

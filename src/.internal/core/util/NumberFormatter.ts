import type { Language } from "./Language";

import { Entity, IEntitySettings, IEntityPrivate } from "./Entity"
import { TextFormatter } from "./TextFormatter";

import * as $object from "./Object";
import * as $utils from "./Utils";
import * as $type from "./Type";

/**
 * @ignore
 */
export interface INumberSuffix {
	number: number;
	suffix: string;
}

export interface INumberFormatterSettings extends IEntitySettings {

	/**
	 * Number format to be used when formatting numbers.
	 *
	 * @default "#,###.#####"
	 */
	numberFormat?: string | Intl.NumberFormatOptions;

	/**
	 * A threshold value for negative numbers.
	 *
	 * @default 0
	 */
	negativeBase?: number;

	/**
	 * Prefixes and thresholds to group big numbers into, e.g. 1M.
	 *
	 * Used in conjunction with `a` modifier of the number format.
	 */
	bigNumberPrefixes?: INumberSuffix[];

	/**
	 * Prefixes and thresholds to group small numbers into, e.g. 1m.
	 *
	 * Used in conjunction with `a` modifier of the number format.
	 */
	smallNumberPrefixes?: INumberSuffix[];

	/**
	 * All numbers below this value are considered small.
	 *
	 * @default 1
	 */
	smallNumberThreshold?: number;

	/**
	 * Prefixes to and thresholds to use when grouping data size numbers, e.g. 1MB.
	 *
	 * Used in conjunction with `b` modifier of the number format.
	 */
	bytePrefixes?: INumberSuffix[];

	/**
	 * Indicates which fields in data should be considered numeric.
	 *
	 * It is used when formatting data placeholder values.
	 */
	numericFields?: string[];

	/**
	 * Locales if you are using date formats in `Intl.NumberFormatOptions` syntax.
	 *
	 * @see (@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NumberFormat) about using Intl for number formatting
	 * @param value Locales
	 */
	intlLocales?: string;

	/**
	 * If set to `true` will force the number string to be LTR, even if RTL is
	 * enabled.
	 * 
	 * @default false
	 * @since 5.3.13
	 */
	forceLTR?: boolean;

}

export interface INumberFormatterPrivate extends IEntityPrivate {
}

/**
 * Number formatter
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/formatters/formatting-numbers/} for more info
 * @important
 */
export class NumberFormatter extends Entity {
	declare public _settings: INumberFormatterSettings;
	declare public _privateSettings: INumberFormatterPrivate;

	protected _setDefaults() {
		// Defaults
		this._setDefault("negativeBase", 0);
		this._setDefault("numberFormat", "#,###.#####");
		this._setDefault("smallNumberThreshold", 1.00);

		const bns = "_big_number_suffix_";
		const sns = "_small_number_suffix_";
		const bs = "_byte_suffix_";

		this._setDefault("bigNumberPrefixes", [
			{ "number": 1e+3, "suffix": this._t(bns + "3") },
			{ "number": 1e+6, "suffix": this._t(bns + "6") },
			{ "number": 1e+9, "suffix": this._t(bns + "9") },
			{ "number": 1e+12, "suffix": this._t(bns + "12") },
			{ "number": 1e+15, "suffix": this._t(bns + "15") },
			{ "number": 1e+18, "suffix": this._t(bns + "18") },
			{ "number": 1e+21, "suffix": this._t(bns + "21") },
			{ "number": 1e+24, "suffix": this._t(bns + "24") }
		]);

		this._setDefault("smallNumberPrefixes", [
			{ "number": 1e-24, "suffix": this._t(sns + "24") },
			{ "number": 1e-21, "suffix": this._t(sns + "21") },
			{ "number": 1e-18, "suffix": this._t(sns + "18") },
			{ "number": 1e-15, "suffix": this._t(sns + "15") },
			{ "number": 1e-12, "suffix": this._t(sns + "12") },
			{ "number": 1e-9, "suffix": this._t(sns + "9") },
			{ "number": 1e-6, "suffix": this._t(sns + "6") },
			{ "number": 1e-3, "suffix": this._t(sns + "3") }
		]);

		this._setDefault("bytePrefixes", [
			{ "number": 1, suffix: this._t(bs + "B") },
			{ "number": 1024, suffix: this._t(bs + "KB") },
			{ "number": 1048576, suffix: this._t(bs + "MB") },
			{ "number": 1073741824, suffix: this._t(bs + "GB") },
			{ "number": 1099511627776, suffix: this._t(bs + "TB") },
			{ "number": 1125899906842624, suffix: this._t(bs + "PB") }
		]);

		super._setDefaults();
	}

	public _beforeChanged() {
		super._beforeChanged();
	}

	/**
	 * Formats the number according to specific format.
	 *
	 * @param value   Value to format
	 * @param format  Format to apply
	 * @return Formatted number
	 */
	public format(value: number | string, format?: string | Intl.NumberFormatOptions, precision?: number): string {

		// no format passed in or "Number"
		if (format == null || ($type.isString(format) && format.toLowerCase() === "number")) {
			format = this.get("numberFormat", "");
		}

		// Init return value
		let formatted;

		// Cast to number just in case
		// TODO: maybe use better casting
		let source: number = Number(value);

		// Is it a built-in format or Intl.NumberFormatOptions
		if ($type.isObject(format)) {
			try {
				if (this.get("intlLocales")) {
					return new Intl.NumberFormat(this.get("intlLocales"), <Intl.NumberFormatOptions>format).format(source);
				}
				else {
					return new Intl.NumberFormat(undefined, <Intl.NumberFormatOptions>format).format(source);
				}
			}
			catch (e) {
				return "Invalid";
			}

		}
		else {

			// Clean format
			format = $utils.cleanFormat(format!);

			// Get format info (it will also deal with parser caching)
			let info = this.parseFormat(format, this._root.language);


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

			// Adjust precision
			if (precision != null && !details.mod) {
				details = $object.copy(details);
				details.decimals.active = source == 0 ? 0 : precision;
			}

			// Format
			formatted = details.template.split($type.PLACEHOLDER).join(this.applyFormat(source, details));

		}

		if (this.get("forceLTR") === true) {
			formatted = "‎" + formatted;
		}

		return formatted;
	}

	/**
	 * Parses supplied format into structured object which can be used to format
	 * the number.
	 *
	 * @param format Format string, i.e. "#,###.00"
	 * @param language Language
	 * @ignore
	 */
	protected parseFormat(format: string, language: Language): any {

		// Check cache
		// TODO
		// let cached = this.getCache(format);
		// if (cached != null) {
		// 	return cached;
		// }

		const thousandSeparator = language.translateEmpty("_thousandSeparator");
		const decimalSeparator = language.translateEmpty("_decimalSeparator")

		// init format parse info holder
		let info: any = {
			"positive": {
				"thousands": {
					"active": -1,
					"passive": -1,
					"interval": -1,
					"separator": thousandSeparator
				},
				"decimals": {
					"active": -1,
					"passive": -1,
					"separator": decimalSeparator
				},
				"template": "",
				"source": "",
				"parsed": false
			},
			"negative": {
				"thousands": {
					"active": -1,
					"passive": -1,
					"interval": -1,
					"separator": thousandSeparator
				},
				"decimals": {
					"active": -1,
					"passive": -1,
					"separator": decimalSeparator
				},
				"template": "",
				"source": "",
				"parsed": false
			},
			"zero": {
				"thousands": {
					"active": -1,
					"passive": -1,
					"interval": -1,
					"separator": thousandSeparator
				},
				"decimals": {
					"active": -1,
					"passive": -1,
					"separator": decimalSeparator
				},
				"template": "",
				"source": "",
				"parsed": false
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
			let partFormat = item.source;

			// Just "Number"?
			if (partFormat.toLowerCase() === "number") {
				partFormat = this.get("numberFormat", "#,###.#####");
			}

			// Let TextFormatter split into chunks
			let chunks = TextFormatter.chunk(partFormat, true);
			for (let i: number = 0; i < chunks.length; i++) {
				let chunk = chunks[i];

				// replace back double vertical bar
				chunk.text = chunk.text.replace($type.PLACEHOLDER2, "|");

				if (chunk.type === "value") {
					// Parse format

					// Look for codes
					let matches: string[] | null = chunk.text.match(/[#0.,]+[ ]?[abespABESP%!]?[abespABESP‰!]?/);

					if (matches) {
						if (matches === null || matches[0] === "") {
							// no codes here - assume string
							// nothing to do here
							item.template += chunk.text;
						}
						else {

							// look for the format modifiers at the end
							let mods: string[] | null = matches[0].match(/[abespABESP%‰!]{2}|[abespABESP%‰]{1}$/);

							if (mods) {
								item.mod = mods[0].toLowerCase();
								item.modSpacing = matches[0].match(/[ ]{1}[abespABESP%‰!]{1}$/) ? true : false;
							}

							// break the format up
							let a = matches[0].split(".");

							// Deal with thousands
							if (a[0] === "") {
								// No directives for thousands
								// Leave default settings (no formatting)
							}
							else {
								// Counts
								item.thousands.active = (a[0].match(/0/g) || []).length;
								item.thousands.passive = (a[0].match(/\#/g) || []).length + item.thousands.active;

								// Separator interval
								let b = a[0].split(",");
								if (b.length === 1) {
									// No thousands separators
									// Do nothing
								}
								else {
									// Use length fo the last chunk as thousands length
									item.thousands.interval = (b.pop() || "").length;

									if (item.thousands.interval === 0) {
										item.thousands.interval = -1;
									}
								}
							}

							// Deal with decimals
							if (typeof (a[1]) === "undefined") {
								// No directives for decimals
								// Leave at defaults (no formatting)
							}
							else {
								// Counts
								item.decimals.active = (a[1].match(/0/g) || []).length;
								item.decimals.passive = (a[1].match(/\#/g) || []).length + item.decimals.active;
							}

							// Add special code to template
							item.template += chunk.text.split(matches[0]).join($type.PLACEHOLDER);

						}
					}
				}
				else {
					// Quoted string - take it as it is
					item.template += chunk.text;
				}
			}

			// Apply style formatting
			//item.template = getTextFormatter().format(item.template, this.outputFormat);

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
	 * @param details  Parsed format as returned by parseFormat()
	 * @return Formatted number
	 * @ignore
	 */
	protected applyFormat(value: number, details: any): string {

		// Use absolute values
		let negative: boolean = value < 0;
		value = Math.abs(value);

		// Recalculate according to modifier
		let prefix: string = "", suffix: string = "";
		let mods: string[] = details.mod ? details.mod.split("") : [];
		if (mods.indexOf("b") !== -1) {
			let a = this.applyPrefix(value, this.get("bytePrefixes")!, mods.indexOf("!") !== -1);
			value = a[0];
			prefix = a[1];
			suffix = a[2];
			if (details.modSpacing) {
				suffix = " " + suffix;
			}
		}
		else if (mods.indexOf("a") !== -1) {
			let a = this.applyPrefix(value, value < this.get("smallNumberThreshold")! ? this.get("smallNumberPrefixes")! : this.get("bigNumberPrefixes")!, mods.indexOf("!") !== -1);
			value = a[0];
			prefix = a[1];
			suffix = a[2];
			if (details.modSpacing) {
				suffix = " " + suffix;
			}
		}
		else if (mods.indexOf("p") !== -1) {
			let ol = Math.min(value.toString().length + 2, 21);
			//value *= 100;
			value = parseFloat(value.toPrecision(ol));
			prefix = this._root.language.translate("_percentPrefix");
			suffix = this._root.language.translate("_percentSuffix");
			if (prefix == "" && suffix == "") {
				suffix = "%";
			}
		}
		else if (mods.indexOf("%") !== -1) {
			let ol = Math.min(value.toString().length + 2, 21);
			value *= 100;
			value = parseFloat(value.toPrecision(ol));
			suffix = "%";
		}
		else if (mods.indexOf("‰") !== -1) {
			let ol = Math.min(value.toString().length + 3, 21);
			value *= 1000;
			value = parseFloat(value.toPrecision(ol));
			suffix = "‰";
		}

		// Round to passive
		if (mods.indexOf("e") !== -1) {
			// convert the value to exponential
			let exp: string[];
			if (details.decimals.passive >= 0) {
				exp = value.toExponential(details.decimals.passive).split("e");
			}
			else {
				exp = value.toExponential().split("e");
			}
			value = Number(exp[0]);
			suffix = "e" + exp[1];
			if (details.modSpacing) {
				suffix = " " + suffix;
			}
		}
		else if (details.decimals.passive === 0) {
			value = Math.round(value);
		}
		else if (details.decimals.passive > 0) {
			const decimals = $utils.decimalPlaces(value);
			if (decimals > 0) {
				const d = Math.pow(10, details.decimals.passive);
				value = Math.round(parseFloat((value * d).toFixed(decimals))) / d;
			}
		}

		// Init return value
		let res: string = "";

		// Calc integer and decimal parts
		let a = $type.numberToString(value).split(".");

		// Format integers
		let ints = a[0];

		// Pad integers to active length
		if (ints.length < details.thousands.active) {
			ints = Array(details.thousands.active - ints.length + 1).join("0") + ints;
		}

		// Insert thousands separators
		if (details.thousands.interval > 0) {
			let ip: string[] = [];
			let intsr: string = ints.split("").reverse().join("");
			for (let i = 0, len = ints.length; i <= len; i += details.thousands.interval) {
				let c: string = intsr.substr(i, details.thousands.interval).split("").reverse().join("");
				if (c !== "") {
					ip.unshift(c);
				}
			}
			ints = ip.join(details.thousands.separator);
		}

		// Add integers
		res += ints;

		// Add decimals
		if (a.length === 1) {
			a.push("");
		}
		let decs: string = a[1];

		// Fill zeros?
		if (decs.length < details.decimals.active) {
			decs += Array(details.decimals.active - decs.length + 1).join("0");
		}

		if (decs !== "") {
			res += details.decimals.separator + decs;
		}

		// Can't have empty return value
		if (res === "") {
			res = "0";
		}

		// Add minus sign back
		if (value !== 0 && negative && (mods.indexOf("s") === -1)) {
			res = "-" + res;
		}

		// Add suffixes/prefixes
		if (prefix) {
			res = prefix + res;
		}
		if (suffix) {
			res += suffix;
		}

		return res;
	}


	protected applyPrefix(value: number, prefixes: any[], force: boolean = false): any[] {
		let newvalue = value;
		let prefix = "";
		let suffix = "";
		let applied = false;
		let k = 1;

		for (let i = 0, len = prefixes.length; i < len; i++) {
			if (prefixes[i].number <= value) {
				if (prefixes[i].number === 0) {
					newvalue = 0;
				}
				else {
					newvalue = value / prefixes[i].number;
					k = prefixes[i].number;
				}
				prefix = prefixes[i].prefix;
				suffix = prefixes[i].suffix;
				applied = true;
			}
		}


		if (!applied && force && prefixes.length && value != 0) {
			// Prefix was not applied. Use the first prefix.
			newvalue = value / prefixes[0].number;
			prefix = prefixes[0].prefix;
			suffix = prefixes[0].suffix;
			applied = true;
		}

		if (applied) {
			newvalue = parseFloat(
				newvalue.toPrecision(
					Math.min(k.toString().length + Math.floor(newvalue).toString().replace(/[^0-9]*/g, "").length, 21)
				)
			);
		}

		return [newvalue, prefix, suffix];
	}

	/**
	 * Replaces brackets with temporary placeholders.
	 *
	 * @ignore Exclude from docs
	 * @param text  Input text
	 * @return Escaped text
	 */
	public escape(text: string): string {
		return text.replace("||", $type.PLACEHOLDER2);
	}

	/**
	 * Replaces placeholders back to brackets.
	 *
	 * @ignore Exclude from docs
	 * @param text  Escaped text
	 * @return Unescaped text
	 */
	public unescape(text: string): string {
		return text.replace($type.PLACEHOLDER2, "|");
	}

}

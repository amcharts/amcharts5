import type { ILocaleSettings } from "./Language"

import { Entity, IEntitySettings, IEntityPrivate } from "./Entity"
import { TextFormatter } from "./TextFormatter"
import { Timezone } from "./Timezone"

import * as $type from "./Type"
import * as $utils from "./Utils";

/**
 * Interface describing parsed date format definition.
 *
 * @ignore
 */
export interface DateFormatInfo {
	"template": string;
	"parts": any[];
}

export interface IDateFormatterSettings extends IEntitySettings {

	/**
	 * Should the first letter of the formatted date be capitalized?
	 *
	 * @default true
	 */
	capitalize?: boolean;

	/**
	 * A date format to be used when formatting dates.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/formatters/formatting-dates/} for more info
	 */
	dateFormat?: string | Intl.DateTimeFormatOptions;

	/**
	 * An array of data fields that hold date values and should be formatted
	 * with a [[DateFormatter]].
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/formatters/data-placeholders/#Formatting_placeholders} for more info
	 */
	dateFields?: string[];

	/**
	 * Locales to use when formatting using `Intl.DateFormatter`.
	 */
	intlLocales?: string;

}

export interface IDateFormatterPrivate extends IEntityPrivate {
}

type Months = "January" | "February" | "March" | "April" | "May" | "June" | "July" | "August" | "September" | "October" | "November" | "December";
type ShortMonths = "Jan" | "Feb" | "Mar" | "Apr" | "May(short)" | "Jun" | "Jul" | "Aug" | "Sep" | "Oct" | "Nov" | "Dec";
type Weekdays = "Sunday" | "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday";
type ShortWeekdays = "Sun" | "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat";


/**
 * Date formatter class.
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/formatters/formatting-dates/} for more info
 * @important
 */
export class DateFormatter extends Entity {
	declare public _settings: IDateFormatterSettings;
	declare public _privateSettings: IDateFormatterPrivate;

	protected _setDefaults() {
		// Defaults
		this._setDefault("capitalize", true);
		this._setDefault("dateFormat", "yyyy-MM-dd");

		super._setDefaults();
	}

	public _beforeChanged() {
		super._beforeChanged();
	}

	/**
	 * Formats a source `Date` object into string format
	 * @param   source          inpout date
	 * @param   format          Output format
	 * @param   ignoreTimezone  Ignore timezone?
	 * @return                  Formatted date
	 */
	public format(source: any, format?: string | Intl.DateTimeFormatOptions, ignoreTimezone: boolean = false): string {

		// Locale?
		// TODO

		// No format passed in or it's empty
		if (typeof format === "undefined" || format === "") {
			format = this.get("dateFormat", "yyyy-MM-dd");
		}

		// Init return value
		let formatted;

		// Cast?
		// TODO: decide if we need to cast
		let date: Date = source;


		// Is it a built-in format or Intl.DateTimeFormat
		if ($type.isObject(format)) {

			try {
				const locales = this.get("intlLocales");
				if (locales) {
					return new Intl.DateTimeFormat(locales, <Intl.DateTimeFormatOptions>format).format(date);
				}
				else {
					return new Intl.DateTimeFormat(undefined, <Intl.DateTimeFormatOptions>format).format(date);
				}
			}
			catch (e) {
				return "Invalid";
			}

		}

		// get format info (it will also deal with parser caching)
		let info = this.parseFormat(format);

		// Should we apply custom time zone?
		const timezone = this._root.timezone;
		let originalDate = date;
		if (timezone && !this._root.utc && !ignoreTimezone) {
			date = timezone.convertLocal(date);
		}

		// Check if it's a valid date
		if (!$type.isNumber(date.getTime())) {
			// TODO translation
			//return this._t("Invalid date");
			return "Invalid date";
		}

		// Apply format
		formatted = this.applyFormat(date, info, ignoreTimezone, originalDate);

		// Capitalize
		if (this.get("capitalize")) {
			formatted = formatted.replace(
				/^.{1}/, formatted.substr(0, 1).toUpperCase()
			);
		}

		// We're done
		return formatted;
	}

	/**
	 * Applies format to Date.
	 *
	 * @param date      Date object
	 * @param info      Parsed format information
	 * @return Formatted date string
	 */
	protected applyFormat(date: Date, info: DateFormatInfo, ignoreTimezone: boolean = false, originalDate?: Date): string {

		// Init return value
		let res = info.template;

		// Get values
		let fullYear: number,
			month: number,
			weekday: number,
			day: number,
			hours: number,
			minutes: number,
			seconds: number,
			milliseconds: number,
			timestamp: number = date.getTime();
		if (this._root.utc && !ignoreTimezone) {
			fullYear = date.getUTCFullYear();
			month = date.getUTCMonth();
			weekday = date.getUTCDay();
			day = date.getUTCDate();
			hours = date.getUTCHours();
			minutes = date.getUTCMinutes();
			seconds = date.getUTCSeconds();
			milliseconds = date.getUTCMilliseconds();
		}
		else {
			fullYear = date.getFullYear();
			month = date.getMonth();
			weekday = date.getDay();
			day = date.getDate();
			hours = date.getHours();
			minutes = date.getMinutes();
			seconds = date.getSeconds();
			milliseconds = date.getMilliseconds();
		}

		// Go through each part and format/replace it in template
		for (let i = 0, len = info.parts.length; i < len; i++) {
			let value: string = "";
			switch (info.parts[i]) {

				case "G":
					value = this._t(
						fullYear < 0
							? "_era_bc"
							: "_era_ad"
					);
					break;

				case "yyyy":
					value = Math.abs(fullYear).toString();
					if (fullYear < 0) {
						value += this._t("_era_bc");
					}
					break;

				case "yyy":
				case "yy":
				case "y":
					value = Math.abs(fullYear).toString().substr(-info.parts[i].length);
					if (fullYear < 0) {
						value += this._t("_era_bc");
					}
					break;

				case "YYYY":
				case "YYY":
				case "YY":
				case "Y":
					let year = $utils.getWeekYear(date, this._root.utc);
					if (info.parts[i] == "YYYY") {
						value = Math.abs(year).toString();
					}
					else {
						value = Math.abs(year).toString().substr(-info.parts[i].length);
					}
					if (year < 0) {
						value += this._t("_era_bc");
					}
					break;

				case "u":
					// @todo
					break;

				case "q":
					value = "" + Math.ceil((date.getMonth() + 1) / 3);
					break;

				case "MMMMM":
					value = this._t(this._getMonth(month)).substr(0, 1);
					break;

				case "MMMM":
					value = this._t(this._getMonth(month));
					break;

				case "MMM":
					value = this._t(this._getShortMonth(month));
					break;

				case "MM":
					value = $utils.padString(month + 1, 2, "0");
					break;

				case "M":
					value = (month + 1).toString();
					break;

				case "ww":
					value = $utils.padString($utils.getWeek(date, this._root.utc), 2, "0");
					break;

				case "w":
					value = $utils.getWeek(date, this._root.utc).toString();
					break;

				case "W":
					value = $utils.getMonthWeek(date, this._root.utc).toString();
					break;

				case "dd":
					value = $utils.padString(day, 2, "0");
					break;

				case "d":
					value = day.toString();
					break;

				case "DD":
				case "DDD":
					value = $utils.padString($utils.getYearDay(date, this._root.utc).toString(), info.parts[i].length, "0");
					break;

				case "D":
					value = $utils.getYearDay(date, this._root.utc).toString();
					break;

				case "F":
					// @todo
					break;

				case "g":
					// @todo
					break;

				case "t":
					value = this._root.language.translateFunc("_dateOrd").call(this, day);
					break;

				case "E":
					value = (weekday || 7).toString();
					break;

				case "EE":
					value = $utils.padString((weekday || 7).toString(), 2, "0");
					break;

				case "EEE":
				case "eee":
					value = this._t(this._getShortWeekday(weekday));
					break;

				case "EEEE":
				case "eeee":
					value = this._t(this._getWeekday(weekday));
					break;

				case "EEEEE":
				case "eeeee":
					value = this._t(this._getShortWeekday(weekday)).substr(0, 1);
					break;

				case "e":
				case "ee":
					value = (weekday - (this._root.locale.firstDayOfWeek || 1) + 1).toString();
					if (info.parts[i] == "ee") {
						value = $utils.padString(value, 2, "0");
					}
					break;

				case "a":
					if (hours >= 12) {
						value = this._t("PM");
					}
					else {
						value = this._t("AM");
					}
					break;

				case "aa":
					if (hours >= 12) {
						value = this._t("P.M.");
					}
					else {
						value = this._t("A.M.");
					}
					break;

				case "aaa":
					if (hours >= 12) {
						value = this._t("P");
					}
					else {
						value = this._t("A");
					}
					break;

				case "h":
					value = $utils.get12Hours(hours).toString();
					break;

				case "hh":
					value = $utils.padString($utils.get12Hours(hours), 2, "0");
					break;

				case "H":
					value = hours.toString();
					break;

				case "HH":
					value = $utils.padString(hours, 2, "0");
					break;

				case "K":
					value = $utils.get12Hours(hours, 0).toString();
					break;

				case "KK":
					value = $utils.padString($utils.get12Hours(hours, 0), 2, "0");
					break;

				case "k":
					value = (hours + 1).toString();
					break;

				case "kk":
					value = $utils.padString(hours + 1, 2, "0");
					break;

				case "m":
					value = minutes.toString();
					break;

				case "mm":
					value = $utils.padString(minutes, 2, "0");
					break;

				case "s":
					value = seconds.toString();
					break;

				case "ss":
					value = $utils.padString(seconds, 2, "0");
					break;

				case "S":
				case "SS":
				case "SSS":
					value = Math.round((milliseconds / 1000) * Math.pow(10, info.parts[i].length)).toString();
					break;

				case "x":
					value = timestamp.toString();
					break;

				case "n":
				case "nn":
				case "nnn":
					value = $utils.padString(milliseconds, info.parts[i].length, "0");
					break;

				case "z":
					value = $utils.getTimeZone(originalDate || date, false, false, this._root.utc, this._root.timezone ? this._root.timezone.name : undefined).replace(/[+-]+[0-9]+$/, "");
					break;

				case "zz":
					value = $utils.getTimeZone(originalDate || date, true, false, this._root.utc, this._root.timezone ? this._root.timezone.name : undefined);
					break;

				case "zzz":
					value = $utils.getTimeZone(originalDate || date, false, true, this._root.utc, this._root.timezone ? this._root.timezone.name : undefined).replace(/[+-]+[0-9]+$/, "");
					break;

				case "zzzz":
					value = $utils.getTimeZone(originalDate || date, true, true, this._root.utc, this._root.timezone ? this._root.timezone.name : undefined);
					break;

				case "Z":
				case "ZZ":
					let timezone = this._root.utc ? "UTC" : this._root.timezone;
					if (timezone instanceof Timezone) {
						timezone = timezone.name;
					}
					const offset = timezone ? $utils.getTimezoneOffset(timezone, originalDate || date) : date.getTimezoneOffset();

					let tz = Math.abs(offset) / 60;
					let tzh = Math.floor(tz);
					let tzm = tz * 60 - tzh * 60;

					if (this._root.utc) {
						tzh = 0;
						tzm = 0;
					}

					if (info.parts[i] == "Z") {
						value = "GMT";
						value += offset > 0 ? "-" : "+";
						value += $utils.padString(tzh, 2) + ":" + $utils.padString(tzm, 2);
					}
					else {
						value = offset > 0 ? "-" : "+";
						value += $utils.padString(tzh, 2) + $utils.padString(tzm, 2);
					}
					break;

				case "i":
					value = date.toISOString();
					break;

				case "I":
					value = date.toUTCString();
					break;

			}
			res = res.replace($type.PLACEHOLDER, value);
		}

		return res;
	}

	/**
	 * Parses format into structured infromation.
	 *
	 * @param format Format template
	 */
	protected parseFormat(format: string): DateFormatInfo {

		// Check cache
		// TODO: implement caching of the parsed format

		// Init format parse info holder
		let info: DateFormatInfo = {
			"template": "",
			"parts": <any>[]
		};

		// Let TextFormatter split into chunks
		let chunks = TextFormatter.chunk(format, true);
		for (let i: number = 0; i < chunks.length; i++) {
			let chunk = chunks[i];

			if (chunk.type === "value") {

				// Just "Date"?
				if (chunk.text.match(/^date$/i)) {
					let dateFormat = this.get("dateFormat", "yyyy-MM-dd");
					if (!$type.isString(dateFormat)) {
						dateFormat = "yyyy-MM-dd";
					}
					chunk.text = dateFormat;
				}

				// Find all possible parts
				let matches = chunk.text.match(/G|yyyy|yyy|yy|y|YYYY|YYY|YY|Y|u|q|MMMMM|MMMM|MMM|MM|M|ww|w|W|dd|d|DDD|DD|D|F|g|EEEEE|EEEE|EEE|EE|E|eeeee|eeee|eee|ee|e|aaa|aa|a|hh|h|HH|H|KK|K|kk|k|mm|m|ss|s|SSS|SS|S|A|zzzz|zzz|zz|z|ZZ|Z|t|x|nnn|nn|n|i|I/g);

				// Found?
				if (matches) {

					// Populate template
					for (let x = 0; x < matches.length; x++) {
						info.parts.push(matches[x]);
						chunk.text = chunk.text.replace(matches[x], $type.PLACEHOLDER);
					}

				}

			}

			// Apply to template
			info.template += chunk.text;
		}

		// Save cache
		// TODO

		return info;
	}

	protected _months(): Months[] {
		return ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
	}

	protected _getMonth(index: number): Months {
		return this._months()[index];
	}

	protected _shortMonths(): ShortMonths[] {
		return ["Jan", "Feb", "Mar", "Apr", "May(short)", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
	}

	protected _getShortMonth(index: number): ShortMonths {
		return this._shortMonths()[index];
	}

	protected _weekdays(): Weekdays[] {
		return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
	}

	protected _getWeekday(index: number): Weekdays {
		return this._weekdays()[index];
	}

	protected _shortWeekdays(): ShortWeekdays[] {
		return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
	}

	protected _getShortWeekday(index: number): ShortWeekdays {
		return this._shortWeekdays()[index];
	}

	public parse(source: any, format: string, utc?: boolean): Date {

		// If UTC is not supplied, use Root setting
		if (typeof utc === "undefined") {
			utc = this._root.utc;
		}

		// Is it already a Date
		if (source instanceof Date) {
			return source;
		}

		// Is it a numeric timestamp
		if ($type.isNumber(source)) {
			return new Date(source);
		}

		// Are we parsing a timestamp?
		if (format == "x") {
			return new Date(parseInt(source));
		}

		// No? Let's check if it's string, and try converting to it if nec
		if (!$type.isString(source)) {
			source = source.toString();
		}

		// Init return value
		let res: Date;

		// Init RegEx for parsing
		let reg: string = "";

		// Clean format
		format = $utils.cleanFormat(format);

		// Clip format to length of the source string
		format = format.substr(0, source.length);

		// Parse format
		let info = this.parseFormat(format);

		// Init parsed items holder
		let parsedIndexes = {
			"year": -1,
			"year3": -1,
			"year2": -1,
			"year1": -1,
			"month": -1,
			"monthShort": -1,
			"monthLong": -1,
			"weekdayShort": -1,
			"weekdayLong": -1,
			"day": -1,
			"yearDay": -1,
			"week": -1,
			"hourBase0": -1,
			"hour12Base0": -1,
			"hourBase1": -1,
			"hour12Base1": -1,
			"minute": -1,
			"second": -1,
			"millisecond": -1,
			"millisecondDigits": -1,
			"am": -1,
			"zone": -1,
			"timestamp": -1,
			"iso": -1
		};

		// Init values
		let resValues = {
			"year": 1970,
			"month": 0,
			"day": 1,
			"hour": 0,
			"minute": 0,
			"second": 0,
			"millisecond": 0,
			"timestamp": <any>null,
			"offset": 0,
			"utc": utc
		}

		// Index adjuster
		let indexAdjust: number = 0;
		let index: number = 0;

		// Iterate through all of the parts
		for (let i: number = 0; i < info.parts.length; i++) {

			// Set current match index
			index = i + indexAdjust + 1;

			switch (info.parts[i]) {

				case "yyyy":
				case "YYYY":
					reg += "([0-9]{4})";
					parsedIndexes.year = index;
					break;

				case "yyy":
				case "YYY":
					reg += "([0-9]{3})";
					parsedIndexes.year3 = index;
					break;

				case "yy":
				case "YY":
					reg += "([0-9]{2})";
					parsedIndexes.year2 = index;
					break;

				case "y":
				case "Y":
					reg += "([0-9]{1})";
					parsedIndexes.year1 = index;
					break;

				case "MMMM":
					reg += "(" + this.getStringList(this._months()).join("|") + ")";
					parsedIndexes.monthLong = index;
					break;

				case "MMM":
					reg += "(" + this.getStringList(this._shortMonths()).join("|") + ")";
					parsedIndexes.monthShort = index;
					break;

				case "MM":
				case "M":
					reg += "([0-9]{2}|[0-9]{1})";
					parsedIndexes.month = index;
					break;

				case "ww":
				case "w":
					reg += "([0-9]{2}|[0-9]{1})";
					parsedIndexes.week = index;
					break;

				case "dd":
				case "d":
					reg += "([0-9]{2}|[0-9]{1})";
					parsedIndexes.day = index;
					break;

				case "DDD":
				case "DD":
				case "D":
					reg += "([0-9]{3}|[0-9]{2}|[0-9]{1})";
					parsedIndexes.yearDay = index;
					break;


				case "dddd":
					reg += "(" + this.getStringList(this._weekdays()).join("|") + ")";
					parsedIndexes.weekdayLong = index;
					break;

				case "ddd":
					reg += "(" + this.getStringList(this._shortWeekdays()).join("|") + ")";
					parsedIndexes.weekdayShort = index;
					break;

				case "aaa":
				case "aa":
				case "a":
					// TODO: fix (escape regex)
					reg += "(" + this.getStringList(["AM", "PM", "A\.M\.", "P\.M\.", "A", "P"]).join("|") + ")";
					parsedIndexes.am = index;
					break;

				case "hh":
				case "h":
					reg += "([0-9]{2}|[0-9]{1})";
					parsedIndexes.hour12Base1 = index;
					break;

				case "HH":
				case "H":
					reg += "([0-9]{2}|[0-9]{1})";
					parsedIndexes.hourBase0 = index;
					break;

				case "KK":
				case "K":
					reg += "([0-9]{2}|[0-9]{1})";
					parsedIndexes.hour12Base0 = index;
					break;

				case "kk":
				case "k":
					reg += "([0-9]{2}|[0-9]{1})";
					parsedIndexes.hourBase1 = index;
					break;

				case "mm":
				case "m":
					reg += "([0-9]{2}|[0-9]{1})";
					parsedIndexes.minute = index;
					break;

				case "ss":
				case "s":
					reg += "([0-9]{2}|[0-9]{1})";
					parsedIndexes.second = index;
					break;

				case "SSS":
				case "SS":
				case "S":
					reg += "([0-9]{3}|[0-9]{2}|[0-9]{1})";
					parsedIndexes.millisecond = index;
					parsedIndexes.millisecondDigits = info.parts[i].length;
					break;

				case "nnn":
				case "nn":
				case "n":
					reg += "([0-9]{3}|[0-9]{2}|[0-9]{1})";
					parsedIndexes.millisecond = index;
					break;

				case "x":
					reg += "([0-9]{1,})";
					parsedIndexes.timestamp = index;
					break;

				case "Z":
					reg += "GMT([-+]+[0-9]{2}:[0-9]{2})";
					parsedIndexes.zone = index;
					break;

				case "ZZ":
					reg += "([\\-+]+[0-9]{2}[0-9]{2})";
					parsedIndexes.zone = index;
					break;

				case "i":
					reg += "([0-9]{4})-?([0-9]{2})-?([0-9]{2})T?([0-9]{2}):?([0-9]{2}):?([0-9]{2})\\.?([0-9]{0,3})([zZ]|[+\\-][0-9]{2}:?[0-9]{2}|$)";
					parsedIndexes.iso = index;
					indexAdjust += 7;
					break;

				case "G":
				case "YYYY":
				case "YYY":
				case "YY":
				case "Y":
				case "MMMMM":
				case "W":
				case "EEEEE":
				case "EEEE":
				case "EEE":
				case "EE":
				case "E":
				case "eeeee":
				case "eeee":
				case "eee":
				case "ee":
				case "e":
				case "zzzz":
				case "zzz":
				case "zz":
				case "z":
				case "t":
					// Ignore
					indexAdjust--;
					break;
			}

			reg += "[^0-9]*";
		}

		// Try matching
		let regex = new RegExp(reg);
		let matches: RegExpMatchArray = source.match(regex);

		if (matches) {
			// Populate the date object

			// Full year
			if (parsedIndexes.year > -1) {
				resValues.year = parseInt(matches[parsedIndexes.year]);
			}

			// 3-digit year
			if (parsedIndexes.year3 > -1) {
				let val = parseInt(matches[parsedIndexes.year3]);
				val += 1000;
				resValues.year = val;
			}

			// 2-digit year
			if (parsedIndexes.year2 > -1) {
				let val = parseInt(matches[parsedIndexes.year2]);
				if (val > 50) {
					val += 1000;
				}
				else {
					val += 2000;
				}
				resValues.year = val;
			}

			// 1-digit year
			if (parsedIndexes.year1 > -1) {
				let val = parseInt(matches[parsedIndexes.year1]);
				val = Math.floor((new Date().getFullYear()) / 10) * 10 + val;
				resValues.year = val;
			}

			// Full month
			if (parsedIndexes.monthLong > -1) {
				resValues.month = this.resolveMonth(<any>matches[parsedIndexes.monthLong]);
			}

			// Short month
			if (parsedIndexes.monthShort > -1) {
				resValues.month = this.resolveShortMonth(<any>matches[parsedIndexes.monthShort]);
			}

			// Numeric month
			if (parsedIndexes.month > -1) {
				resValues.month = parseInt(matches[parsedIndexes.month]) - 1;
			}

			// Weekday
			// @todo

			// Week
			if ((parsedIndexes.week > -1) && (parsedIndexes.day === -1)) {
				// We parse weeks ONLY if day is not explicitly set
				// TODO: this needs work
				// (but maybe later - I can hardly imagine anyone passing their dates in weeks)
				resValues.month = 0;
				resValues.day = $utils.getDayFromWeek(
					parseInt(matches[parsedIndexes.week]),
					resValues.year,
					1,
					utc
				);
			}

			// Day
			if (parsedIndexes.day > -1) {
				resValues.day = parseInt(matches[parsedIndexes.day]);
			}

			// Year day
			if (parsedIndexes.yearDay > -1) {
				resValues.month = 0;
				resValues.day = parseInt(matches[parsedIndexes.yearDay]);
			}

			// 24 Hour (0-23)
			if (parsedIndexes.hourBase0 > -1) {
				resValues.hour = parseInt(matches[parsedIndexes.hourBase0]);
			}

			// 24 Hour (1-24)
			if (parsedIndexes.hourBase1 > -1) {
				resValues.hour = parseInt(matches[parsedIndexes.hourBase1]) - 1;
			}

			// 12 Hour (0-11)
			if (parsedIndexes.hour12Base0 > -1) {
				let val = parseInt(matches[parsedIndexes.hour12Base0]);
				if (val == 11) {
					val = 0;
				}
				if ((parsedIndexes.am > -1) && !this.isAm(matches[parsedIndexes.am])) {
					val += 12;
				}
				resValues.hour = val;
			}

			// 12 Hour (1-12)
			if (parsedIndexes.hour12Base1 > -1) {
				let val = parseInt(matches[parsedIndexes.hour12Base1]);
				if (val == 12) {
					val = 0;
				}
				if ((parsedIndexes.am > -1) && !this.isAm(matches[parsedIndexes.am])) {
					val += 12;
				}
				resValues.hour = val;
			}

			// Minute
			if (parsedIndexes.minute > -1) {
				resValues.minute = parseInt(matches[parsedIndexes.minute]);
			}

			// Second
			if (parsedIndexes.second > -1) {
				resValues.second = parseInt(matches[parsedIndexes.second]);
			}

			// Millisecond
			if (parsedIndexes.millisecond > -1) {
				let val = parseInt(matches[parsedIndexes.millisecond]);
				if (parsedIndexes.millisecondDigits == 2) {
					val *= 10;
				}
				else if (parsedIndexes.millisecondDigits == 1) {
					val *= 100;
				}
				resValues.millisecond = val;
			}

			// Timestamp
			if (parsedIndexes.timestamp > -1) {
				resValues.timestamp = parseInt(matches[parsedIndexes.timestamp]);

				const ts = new Date(resValues.timestamp);
				resValues.year = ts.getUTCFullYear();
				resValues.month = ts.getUTCMonth();
				resValues.day = ts.getUTCDate();
				resValues.hour = ts.getUTCHours();
				resValues.minute = ts.getUTCMinutes();
				resValues.second = ts.getUTCSeconds();
				resValues.millisecond = ts.getUTCMilliseconds();
			}

			// Adjust time zone
			if (parsedIndexes.zone > -1) {
				resValues.offset = this.resolveTimezoneOffset(new Date(resValues.year, resValues.month, resValues.day), matches[parsedIndexes.zone]);
			}

			// ISO
			if (parsedIndexes.iso > -1) {

				resValues.year = $type.toNumber(matches[parsedIndexes.iso + 0]);
				resValues.month = $type.toNumber(matches[parsedIndexes.iso + 1]) - 1;
				resValues.day = $type.toNumber(matches[parsedIndexes.iso + 2]);
				resValues.hour = $type.toNumber(matches[parsedIndexes.iso + 3]);
				resValues.minute = $type.toNumber(matches[parsedIndexes.iso + 4]);
				resValues.second = $type.toNumber(matches[parsedIndexes.iso + 5]);
				resValues.millisecond = $type.toNumber(matches[parsedIndexes.iso + 6]);

				if (matches[parsedIndexes.iso + 7] == "Z" || matches[parsedIndexes.iso + 7] == "z") {
					resValues.utc = true;
				}
				else if (matches[parsedIndexes.iso + 7] != "") {
					resValues.offset = this.resolveTimezoneOffset(new Date(resValues.year, resValues.month, resValues.day), matches[parsedIndexes.iso + 7]);
				}
			}

			// Create Date object
			if (resValues.utc) {
				res = new Date(Date.UTC(
					resValues.year,
					resValues.month,
					resValues.day,
					resValues.hour,
					resValues.minute,
					resValues.second,
					resValues.millisecond
				));
			}
			else {
				res = new Date(
					resValues.year,
					resValues.month,
					resValues.day,
					resValues.hour,
					resValues.minute + resValues.offset,
					resValues.second,
					resValues.millisecond
				);
			}

		}
		else {
			// Didn't match anything
			// Let's try dropping it into Date constructor and hope for the best
			res = new Date(source);
		}

		return res;
	}

	protected resolveTimezoneOffset(date: Date, zone: string): number {
		let value = zone.match(/([+\-]?)([0-9]{2}):?([0-9]{2})/);
		if (value) {
			let match = zone.match(/([+\-]?)([0-9]{2}):?([0-9]{2})/)!;
			let dir = match[1];
			let hour = match[2];
			let minute = match[3];
			let offset = parseInt(hour) * 60 + parseInt(minute);

			// Adjust offset
			// Making it negative does not seem to make sense, but it's right
			// because of how JavaScript calculates GMT offsets
			if (dir == "+") {
				offset *= -1;
			}

			// Check the difference in offset
			let originalOffset = (date || new Date()).getTimezoneOffset();
			let diff = offset - originalOffset;
			return diff;
		}
		return 0;
	}

	/**
	 * Resolves month name (i.e. "December") into a month number (11).
	 *
	 * @param value  Month name
	 * @return Month number
	 */
	protected resolveMonth(value: Months): number {

		// Let's try English first
		let month: number = this._months().indexOf(value);
		if (month > -1) {
			return month;
		}

		// Try the translation
		if (!this._root.language.isDefault()) {
			month = this._root.language.translateAll(this._months()).indexOf(value);
			if (month > -1) {
				return month
			}
		}

		return 0;
	}

	/**
	 * Resolves short month name (i.e. "Dec") into a month number.
	 *
	 * @param value  Short month name
	 * @return Month number
	 */
	protected resolveShortMonth(value: ShortMonths): number {

		// Let's try English first
		let month: number = this._shortMonths().indexOf(value);
		if (month > -1) {
			return month;
		}

		// Maybe long month (workaround for May)
		month = this._months().indexOf(<any>value);
		if (month > -1) {
			return month;
		}

		// Try the translation
		if (this._root.language && !this._root.language.isDefault()) {
			month = this._root.language.translateAll(this._shortMonths()).indexOf(value);
			if (month > -1) {
				return month
			}
		}

		return 0;
	}

	/**
	 * Checks if passed in string represents AM/PM notation in many of its
	 * versions.
	 *
	 * @param value  Source string
	 * @return Is it AM/PM?
	 */
	protected isAm(value: string): boolean {
		let list = this.getStringList(["AM", "A.M.", "A"]);
		return list.indexOf(value.toUpperCase()) > -1;
	}

	/**
	 * Translates list of strings.
	 *
	 * @param list  Source strings
	 * @return Translated strings
	 */
	protected getStringList(list: Array<keyof ILocaleSettings>): Array<string> {
		let res: string[] = [];
		for (let i: number = 0; i < list.length; i++) {
			// translate?
			if (this._root.language) {
				res.push($utils.escapeForRgex(this._t(list[i])));
			}
			else {
				res.push($utils.escapeForRgex(list[i]));
			}
		}
		return res;
	}

}

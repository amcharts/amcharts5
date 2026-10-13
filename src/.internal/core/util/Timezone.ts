interface ParsedDate {
	year: number,
	month: number,
	day: number,
	hour: number,
	minute: number,
	second: number,
	millisecond: number,
	weekday: number
}

function parseDate(timezone: Intl.DateTimeFormat, date: Date): ParsedDate {
	let year = 0;
	let month = 0;
	let day = 1;
	let hour = 0;
	let minute = 0;
	let second = 0;
	let millisecond = 0;
	let weekday = 0;



	timezone.formatToParts(date).forEach((x) => {

		switch (x.type) {
			case "year":
				year = +x.value;
				break;
			case "month":
				month = (+x.value) - 1;
				break;
			case "day":
				day = +x.value;
				break;
			case "hour":
				hour = +x.value;
				break;
			case "minute":
				minute = +x.value;
				break;
			case "second":
				second = +x.value;
				break;
			case "fractionalSecond" as any:
				millisecond = +x.value;
				break;
			case "weekday":
				switch (x.value) {
					case "Sun":
						weekday = 0;
						break;
					case "Mon":
						weekday = 1;
						break;
					case "Tue":
						weekday = 2;
						break;
					case "Wed":
						weekday = 3;
						break;
					case "Thu":
						weekday = 4;
						break;
					case "Fri":
						weekday = 5;
						break;
					case "Sat":
						weekday = 6;
						break;
				}
		}
	});

	if (hour === 24) {
		hour = 0;
	}

	return { year, month, day, hour, minute, second, millisecond, weekday };
}


function toUTCDate(timezone: Intl.DateTimeFormat, date: Date): number {
	const { year, month, day, hour, minute, second, millisecond } = parseDate(timezone, date);
	return utcTime(year, month, day, hour, minute, second, millisecond);
}

/**
 * Same as `Date.UTC()`, but years `0` to `99` are not taken as 1900 to 1999.
 *
 * @ignore
 */
export function utcTime(year: number, month: number, day: number, hour: number, minute: number, second: number, millisecond: number): number {
	if (year >= 100 || year < 0) {
		return Date.UTC(year, month, day, hour, minute, second, millisecond);
	}
	// 400 years later has the same calendar
	const date = new Date(Date.UTC(year + 400, month, day, hour, minute, second, millisecond));
	date.setUTCFullYear(date.getUTCFullYear() - 400);
	return date.getTime();
}

const DAY = 86400000;


/**
 * A named timezone, such as `"America/New_York"`, used for `root.timezone`.
 */
export class Timezone {
	private _dtf: Intl.DateTimeFormat;

	// Intl is slow, and the offset only changes at DST and rule changes: the
	// offset of each UTC day used so far, or null for a day it changes in
	private _offsets: Map<number, number | null> = new Map();

	/**
	 * The IANA name of the timezone.
	 */
	public readonly name: string | undefined;

	/**
	 * Creates a timezone from its IANA name, such as `"America/New_York"`.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/getting-started/#New_element_syntax} for more info
	 * @param   timezone  IANA timezone
	 * @return            Instantiated object
	 */
	static new<C extends typeof Timezone, T extends InstanceType<C>>(this: C, timezone: string | undefined): T {
		return (new this(timezone, true)) as T;
	}

	constructor(timezone: string | undefined, isReal: boolean) {
		if (!isReal) {
			throw new Error("You cannot use `new Class()`, instead use `Class.new()`");
		}

		this.name = timezone;

		this._dtf = new Intl.DateTimeFormat("en-US", {
			hour12: false,
			timeZone: timezone,
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
			weekday: "short",
			fractionalSecondDigits: 3,
		} as any);
	}

	/**
	 * Returns a copy of `date` shifted so that its local time reads as the
	 * time in this timezone.
	 *
	 * @param   date  Date
	 * @return        Shifted date
	 */
	convertLocal(date: Date): Date {
		const offset = this.offsetUTC(date);
		const userOffset = date.getTimezoneOffset();
		const output = new Date(date);
		output.setUTCMinutes(output.getUTCMinutes() - (offset - userOffset));

		const newUserOffset = output.getTimezoneOffset();

		if (userOffset != newUserOffset) {
			output.setUTCMinutes(output.getUTCMinutes() + newUserOffset - userOffset)
		}

		return output;
	}

	/**
	 * Returns the timezone's offset from UTC at `date`, in minutes, signed as
	 * `Date.getTimezoneOffset()` is: positive west of UTC.
	 *
	 * @param   date  Date
	 * @return        Offset in minutes
	 */
	offsetUTC(date: Date): number {
		const time = date.getTime();
		// An invalid date has no offset
		if (!isFinite(time)) {
			return NaN;
		}
		const day = Math.floor(time / DAY);
		let offset = this._offsets.get(day);
		if (offset === undefined) {
			const start = this._offsetAt(day * DAY);
			const end = this._offsetAt(day * DAY + DAY - 1);
			offset = start === end ? start : null;
			this._offsets.set(day, offset);
		}
		return offset === null ? this._offsetAt(time) : offset;
	}

	/**
	 * The offset at `time`, worked out with Intl.
	 */
	protected _offsetAt(time: number): number {
		return (time - toUTCDate(this._dtf, new Date(time))) / 60000;
	}

	/**
	 * Returns the parts of `date` as seen in this timezone: year, month (from
	 * `0`), day, hour, minute, second, millisecond and weekday (`0` for
	 * Sunday).
	 *
	 * @param   date  Date
	 * @return        Date parts
	 */
	parseDate(date: Date): ParsedDate {
		// The wall clock is the time shifted by the offset, read as UTC
		const wall = new Date(date.getTime() - Math.round(this.offsetUTC(date) * 60000));
		return {
			year: wall.getUTCFullYear(),
			month: wall.getUTCMonth(),
			day: wall.getUTCDate(),
			hour: wall.getUTCHours(),
			minute: wall.getUTCMinutes(),
			second: wall.getUTCSeconds(),
			millisecond: wall.getUTCMilliseconds(),
			weekday: wall.getUTCDay()
		};
	}
}

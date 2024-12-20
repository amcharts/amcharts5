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
	return Date.UTC(year, month, day, hour, minute, second, millisecond);
}


export class Timezone {
	private _utc: Intl.DateTimeFormat;
	private _dtf: Intl.DateTimeFormat;

	public readonly name: string | undefined;

	/**
	 * Use this method to create an instance of this class.
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

		this._utc = new Intl.DateTimeFormat("en-US", {
			hour12: false,
			timeZone: "UTC",
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
			weekday: "short",
			fractionalSecondDigits: 3,
		} as any);

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

	offsetUTC(date: Date): number {
		const utc = toUTCDate(this._utc, date);
		const dtf = toUTCDate(this._dtf, date);
		return (utc - dtf) / 60000;
	}

	parseDate(date: Date): ParsedDate {
		return parseDate(this._dtf, date)
	}
}

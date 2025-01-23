/**
 * ============================================================================
 * IMPORTS
 * ============================================================================
 * @hidden
 */
import * as $type from "./Type";
import * as $utils from "./Utils";
import type { Timezone } from "./Timezone";
import type { Root } from "../Root";

export type TimeUnit = "millisecond" | "second" | "minute" | "hour" | "day" | "week" | "month" | "year";

export interface ITimeInterval {
	timeUnit: TimeUnit;
	count: number;
}


/**
 * Returns a `Promise` which can be used to execute code after number of
 * milliseconds.
 *
 * @param   ms  Sleep duration in ms
 * @return      Promise
 */
export function sleep(ms: number): Promise<void> {
	return new Promise((resolve, _reject) => {
		setTimeout(resolve, ms);
	});
}


/**
 * Maps time period names to their numeric representations in milliseconds.
 *
 * @ignore Exclude from docs
 */
export let timeUnitDurations: { [Key in TimeUnit]: number } = {
	millisecond: 1,
	second: 1000,
	minute: 60000,
	hour: 3600000,
	day: 86400000,
	week: 604800000,
	month: 365.242 / 12 * 86400000,
	year: 31536000000
};

/**
 * Returns the next time unit that goes after source `unit`.
 *
 * E.g. "hour" is the next unit after "minute", etc.
 *
 * @ignore Exclude from docs
 * @param unit  Source time unit
 * @return Next time unit
 */
export function getNextUnit(unit: TimeUnit): TimeUnit | undefined {
	switch (unit) {
		case "year":
			return;
		case "month":
			return "year";

		case "week":
			return "month";

		case "day":
			return "month"; // not a mistake

		case "hour":
			return "day";

		case "minute":
			return "hour";

		case "second":
			return "minute"

		case "millisecond":
			return "second";
	}
}

/**
 * Returns number of milliseconds in the `count` of time `unit`.
 *
 * Available units: "millisecond", "second", "minute", "hour", "day", "week",
 * "month", and "year".
 *
 * @param unit   Time unit
 * @param count  Number of units
 * @return Milliseconds
 */
export function getDuration(unit: TimeUnit, count?: number): number {
	if (count == null) {
		count = 1;
	}
	return timeUnitDurations[unit] * count;
}

/**
 * @ignore
 */
export function getIntervalDuration(interval: ITimeInterval | undefined) {
	if (interval) {
		return timeUnitDurations[interval.timeUnit] * interval.count;
	}
	return 0;
}


export function getDateIntervalDuration(interval: ITimeInterval, date: Date, firstDateOfWeek?: number, utc?: boolean, timezone?: Timezone) {
	const unit = interval.timeUnit;
	const count = interval.count;
	if (unit == "hour" || unit == "minute" || unit == "second" || unit == "millisecond") {
		return timeUnitDurations[interval.timeUnit] * interval.count;
	}
	else {
		const firstTime = round(new Date(date.getTime()), unit, count, firstDateOfWeek, utc, undefined, timezone).getTime();
		let lastTime = firstTime + count * getDuration(unit) * 1.05;
		lastTime = round(new Date(lastTime), unit, 1, firstDateOfWeek, utc, undefined, timezone).getTime();
		return lastTime - firstTime;
	}
}

/**
 * Returns current `Date` object.
 *
 * @return Current date
 */
export function now(): Date {
	return new Date();
}

/**
 * Returns current timestamp.
 *
 * @return Current timestamp
 */
export function getTime(): number {
	return now().getTime();
}

/**
 * Returns a copy of the `Date` object.
 *
 * @param date  Source date
 * @return Copy
 */
export function copy(date: Date): Date {
	return new Date(date.getTime()); // todo: check if this is ok. new Date(date) used to strip milliseconds on FF in v3
}

/**
 * Checks if the `unit` part of two `Date` objects do not match. Two dates
 * represent a "range" of time, rather the same time date.
 *
 * @param timeOne  timestamp
 * @param timeTwo  timestamp
 * @param unit     Time unit to check
 * @return Range?
 */
export function checkChange(timeOne: number, timeTwo: number, unit: TimeUnit, utc?: boolean, timezone?: Timezone): boolean {
	// quick
	if ((timeTwo - timeOne) > getDuration(unit, 1.2)) {
		return true;
	}

	let dateOne = new Date(timeOne);
	let dateTwo = new Date(timeTwo);

	if (timezone) {
		dateOne = timezone.convertLocal(dateOne);
		dateTwo = timezone.convertLocal(dateTwo);
	}

	let timeZoneOffset1 = 0;
	let timeZoneOffset2 = 0;

	if (!utc && unit != "millisecond") {
		timeZoneOffset1 = dateOne.getTimezoneOffset();
		dateOne.setUTCMinutes(dateOne.getUTCMinutes() - timeZoneOffset1);

		timeZoneOffset2 = dateTwo.getTimezoneOffset();
		dateTwo.setUTCMinutes(dateTwo.getUTCMinutes() - timeZoneOffset2);
	}

	let changed = false;
	switch (unit) {
		case "year":
			if (dateOne.getUTCFullYear() != dateTwo.getUTCFullYear()) {
				changed = true;
			}
			break;
		case "month":
			if (dateOne.getUTCFullYear() != dateTwo.getUTCFullYear()) {
				changed = true;
			}
			else if (dateOne.getUTCMonth() != dateTwo.getUTCMonth()) {
				changed = true;
			}
			break;

		case "day":
			if (dateOne.getUTCMonth() != dateTwo.getUTCMonth()) {
				changed = true;
			}
			else if (dateOne.getUTCDate() != dateTwo.getUTCDate()) {
				changed = true;
			}

			break;

		case "hour":
			if (dateOne.getUTCHours() != dateTwo.getUTCHours()) {
				changed = true;
			}
			break;

		case "minute":
			if (dateOne.getUTCMinutes() != dateTwo.getUTCMinutes()) {
				changed = true;
			}

			break;

		case "second":
			if (dateOne.getUTCSeconds() != dateTwo.getUTCSeconds()) {
				changed = true;
			}
			break;

		case "millisecond":
			if (dateOne.getTime() != dateTwo.getTime()) {
				changed = true;
			}
			break;
	}

	if (changed) {
		return changed;
	}

	let nextUnit = getNextUnit(unit);
	if (nextUnit) {
		return checkChange(timeOne, timeTwo, nextUnit, utc, timezone);
	}
	else {
		return false;
	}
}

/**
 * Adds `count` of time `unit` to the source date. Returns a modified `Date` object.
 *
 * @param date   Source date
 * @param unit   Time unit
 * @param count  Number of units to add
 * @return Modified date
 */
export function add(date: Date, unit: TimeUnit, count: number, utc?: boolean, timezone?: Timezone): Date {
	let timeZoneOffset = 0;

	if (!utc && unit != "millisecond") {
		timeZoneOffset = date.getTimezoneOffset();

		if (timezone) {
			timeZoneOffset -= timezone.offsetUTC(date);
		}

		date.setUTCMinutes(date.getUTCMinutes() - timeZoneOffset);
	}


	switch (unit) {
		case "day":
			let day: number = date.getUTCDate();
			date.setUTCDate(day + count);
			break;

		case "second":
			let seconds: number = date.getUTCSeconds();
			date.setUTCSeconds(seconds + count);
			break;

		case "millisecond":
			let milliseconds: number = date.getUTCMilliseconds();
			date.setUTCMilliseconds(milliseconds + count);
			break;

		case "hour":
			let hours: number = date.getUTCHours();
			date.setUTCHours(hours + count);
			break;

		case "minute":
			let minutes: number = date.getUTCMinutes();
			date.setUTCMinutes(minutes + count);
			break;

		case "year":
			let year: number = date.getUTCFullYear();
			date.setUTCFullYear(year + count);
			break;

		case "month":
			const endDays = date.getUTCDate();
			const startDays = new Date(date.getUTCFullYear(), date.getUTCMonth(), 0).getUTCDate();
			let month: number = date.getUTCMonth();
			if (endDays > startDays) {
				date.setUTCMonth(month + count, startDays);
			}
			else {
				date.setUTCMonth(month + count);
			}
			break;

		case "week":
			let wday: number = date.getUTCDate();
			date.setUTCDate(wday + count * 7);
			break;
	}


	if (!utc && unit != "millisecond") {
		date.setUTCMinutes(date.getUTCMinutes() + timeZoneOffset);
		if (unit == "day" || unit == "week" || unit == "month" || unit == "year") {

			let newTimeZoneOffset = date.getTimezoneOffset();

			if (timezone) {
				newTimeZoneOffset += timezone.offsetUTC(date);
			}

			if (newTimeZoneOffset != timeZoneOffset) {
				let diff = newTimeZoneOffset - timeZoneOffset;
				date.setUTCMinutes(date.getUTCMinutes() + diff);

				// solves issues if new time falls back to old time zone
				if (date.getTimezoneOffset() != newTimeZoneOffset) {
					date.setUTCMinutes(date.getUTCMinutes() - diff);
				}
			}
		}
	}

	return date;
}

/**
 * @ignore
 */
export function roun(time: number, unit: TimeUnit, count: number, root: Root, firstTime?: number): number {
	let firstDate;
	if (firstTime != null) {
		firstDate = new Date(firstTime);
	}
	return round(new Date(time), unit, count, root.locale.firstDayOfWeek, root.utc, firstDate, root.timezone).getTime();
}


/**
 * "Rounds" the date to specific time unit.
 *
 * @param date             Source date
 * @param unit             Time unit
 * @param count            Number of units to round to
 * @param firstDateOfWeek  First day of week
 * @param utc              Use UTC timezone
 * @param firstDate        First date to round to
 * @param roundMinutes     Minutes to round to (some timezones use non-whole hour)
 * @param timezone         Use specific named timezone when rounding
 * @return New date
 */
export function round(date: Date, unit: TimeUnit, count: number, firstDateOfWeek?: number, utc?: boolean, firstDate?: Date, timezone?: Timezone): Date {
	if (!timezone || utc) {

		let timeZoneOffset = 0;

		if (!utc && unit != "millisecond") {
			timeZoneOffset = date.getTimezoneOffset();
			date.setUTCMinutes(date.getUTCMinutes() - timeZoneOffset);
		}

		switch (unit) {

			case "day":
				let day = date.getUTCDate();

				if (count > 1) {
					//	day = Math.floor(day / count) * count;
					if (firstDate) {
						firstDate = round(firstDate, "day", 1);

						let difference = date.getTime() - firstDate.getTime();
						let unitCount = Math.floor(difference / getDuration("day") / count);
						let duration = getDuration("day", unitCount * count);
						date.setTime(firstDate.getTime() + duration - timeZoneOffset * getDuration("minute"));
					}
				}
				else {
					date.setUTCDate(day);
				}
				date.setUTCHours(0, 0, 0, 0);

				break;

			case "second":
				let seconds = date.getUTCSeconds();
				if (count > 1) {
					seconds = Math.floor(seconds / count) * count;
				}
				date.setUTCSeconds(seconds, 0);
				break;

			case "millisecond":
				if (count == 1) {
					return date; // much better for perf!
				}

				let milliseconds = date.getUTCMilliseconds();
				milliseconds = Math.floor(milliseconds / count) * count;
				date.setUTCMilliseconds(milliseconds);
				break;

			case "hour":

				let hours = date.getUTCHours();
				if (count > 1) {
					hours = Math.floor(hours / count) * count;
				}
				date.setUTCHours(hours, 0, 0, 0);

				break;

			case "minute":

				let minutes = date.getUTCMinutes();
				if (count > 1) {
					minutes = Math.floor(minutes / count) * count;
				}

				date.setUTCMinutes(minutes, 0, 0);

				break;

			case "month":

				let month = date.getUTCMonth();
				if (count > 1) {
					month = Math.floor(month / count) * count;
				}

				date.setUTCMonth(month, 1);
				date.setUTCHours(0, 0, 0, 0);

				break;

			case "year":

				let year = date.getUTCFullYear();
				if (count > 1) {
					year = Math.floor(year / count) * count;
				}
				date.setUTCFullYear(year, 0, 1);
				date.setUTCHours(0, 0, 0, 0);
				break;

			case "week":

				if (count > 1) {
					if (firstDate) {
						firstDate = round(firstDate, "week", 1);

						let difference = date.getTime() - firstDate.getTime();
						let unitCount = Math.floor(difference / getDuration("week") / count);
						let duration = getDuration("week", unitCount * count);

						date.setTime(firstDate.getTime() + duration - timeZoneOffset * getDuration("minute"));
					}
				}

				let wday = date.getUTCDate();
				let weekDay = date.getUTCDay();

				if (!$type.isNumber(firstDateOfWeek)) {
					firstDateOfWeek = 1;
				}

				if (weekDay >= firstDateOfWeek) {
					wday = wday - weekDay + firstDateOfWeek;
				} else {
					wday = wday - (7 + weekDay) + firstDateOfWeek;
				}

				date.setUTCDate(wday);
				date.setUTCHours(0, 0, 0, 0);

				break;
		}
		if (!utc && unit != "millisecond") {
			date.setUTCMinutes(date.getUTCMinutes() + timeZoneOffset);

			if (unit == "day" || unit == "week" || unit == "month" || unit == "year") {
				let newTimeZoneOffset = date.getTimezoneOffset();
				if (newTimeZoneOffset != timeZoneOffset) {
					let diff = newTimeZoneOffset - timeZoneOffset;

					date.setUTCMinutes(date.getUTCMinutes() + diff);
				}
			}
		}

		return date;
	}
	else {
		if (isNaN(date.getTime())) {
			return date;
		}
		let initialTime = date.getTime();
		let tzoffset = timezone.offsetUTC(date);
		let timeZoneOffset = date.getTimezoneOffset();
		let parsedDate = timezone.parseDate(date);
		let year = parsedDate.year;
		let month = parsedDate.month;
		let day = parsedDate.day;
		let hour = parsedDate.hour;
		let minute = parsedDate.minute;
		let second = parsedDate.second;
		let millisecond = parsedDate.millisecond;
		let weekday = parsedDate.weekday;

		let offsetDif = tzoffset - timeZoneOffset;

		switch (unit) {

			case "day":
				if (count > 1 && firstDate) {
					firstDate = round(firstDate, "day", 1, firstDateOfWeek, utc, undefined, timezone);
					let difference = date.getTime() - firstDate.getTime();
					let unitCount = Math.floor(difference / getDuration("day") / count);
					let duration = getDuration("day", unitCount * count);
					date.setTime(firstDate.getTime() + duration);

					parsedDate = timezone.parseDate(date);

					year = parsedDate.year;
					month = parsedDate.month;
					day = parsedDate.day;
				}

				hour = 0;
				minute = offsetDif;

				second = 0;
				millisecond = 0;

				break;

			case "second":
				minute += offsetDif;
				if (count > 1) {
					second = Math.floor(second / count) * count;
				}
				millisecond = 0;
				break;

			case "millisecond":
				minute += offsetDif;
				if (count > 1) {
					millisecond = Math.floor(millisecond / count) * count;
				}
				break;

			case "hour":
				if (count > 1) {
					hour = Math.floor(hour / count) * count;
				}

				minute = offsetDif;
				second = 0;
				millisecond = 0;
				break;

			case "minute":
				if (count > 1) {
					minute = Math.floor(minute / count) * count;
				}
				minute += offsetDif;
				second = 0;
				millisecond = 0;
				break;

			case "month":
				if (count > 1) {
					month = Math.floor(month / count) * count;
				}
				day = 1;
				hour = 0;
				minute = offsetDif;
				second = 0;
				millisecond = 0;
				break;

			case "year":
				if (count > 1) {
					year = Math.floor(year / count) * count;
				}
				month = 0;
				day = 1;
				hour = 0;
				minute = offsetDif;
				second = 0;
				millisecond = 0;
				break;

			case "week":
				if (!$type.isNumber(firstDateOfWeek)) {
					firstDateOfWeek = 1;
				}

				if (weekday >= firstDateOfWeek) {
					day = day - weekday + firstDateOfWeek;
				} else {
					day = day - (7 + weekday) + firstDateOfWeek;
				}

				hour = 0;
				minute = offsetDif;
				second = 0;
				millisecond = 0;
				break;
		}



		date = new Date(year, month, day, hour, minute, second, millisecond);

		// fix to solve #101989
		const newTime = date.getTime();
		let hDuration = 3600000;
		if (unit == "hour") {
			hDuration = 3600000 * count;
		}

		if (newTime + hDuration <= initialTime) {
			if (unit == "hour" || unit == "minute" || unit == "second" || unit == "millisecond") {
				date = new Date(newTime + hDuration);
			}
		}
		// end of fix

		let newTimeZoneOffset = date.getTimezoneOffset();
		let newTzoffset = timezone.offsetUTC(date);
		let newDiff = newTzoffset - newTimeZoneOffset;

		if (newDiff != offsetDif) {
			date.setTime(date.getTime() + (newDiff - offsetDif) * 60000);
		}

		return date;
	}
}



/**
 * @ignore
 */
export function chooseInterval(index: number, duration: number, gridCount: number, intervals: Array<ITimeInterval>): ITimeInterval {
	let gridInterval: ITimeInterval = intervals[index];
	let intervalDuration = getIntervalDuration(gridInterval);

	let lastIndex = intervals.length - 1;
	if (index >= lastIndex) {
		return { ...intervals[lastIndex] };
	}

	let count = Math.ceil(duration / intervalDuration);

	if (duration < intervalDuration && index > 0) {
		return { ...intervals[index - 1] };
	}
	if (count <= gridCount) {
		return { ...intervals[index] };
	} else {
		if (index + 1 < intervals.length) {
			return chooseInterval(index + 1, duration, gridCount, intervals);
		} else {
			return { ...intervals[index] };
		}
	}
}

/**
 * @ignore
 */
export function getUnitValue(date: Date, unit: TimeUnit) {
	switch (unit) {
		case "day":
			return date.getDate();
		case "second":
			return date.getSeconds();
		case "millisecond":
			return date.getMilliseconds();
		case "hour":
			return date.getHours();
		case "minute":
			return date.getMinutes();
		case "month":
			return date.getMonth();
		case "year":
			return date.getFullYear();
		case "week":
			return $utils.getWeek(date);
	}
}

import type { IGeoPoint } from "../../core/util/IGeoPoint";
import type { Entity } from "../../core/util/Entity";
import type { IDisposer } from "../../core/util/Disposer";

import { getSunPosition } from "./MapUtils";

/**
 * Settings shared by the series that show day and night.
 *
 * @since 5.21.0
 */
export interface ISunSettings {

	/**
	 * The point where the sun is directly overhead. `am5map.getSunPosition()`
	 * finds it for a date, or set `sunDate` to have the series find it.
	 */
	sunPosition?: IGeoPoint;

	/**
	 * Works out `sunPosition` for this date: `"now"`, a timestamp in
	 * milliseconds, a date string (e.g. `"2026-12-21T12:00:00Z"`) or a `Date`.
	 * With `"now"` the sun moves with the clock, once a minute. Overrides
	 * `sunPosition`.
	 *
	 * To change a `Date`, set a new one: a change made to the same object goes
	 * unnoticed.
	 *
	 * @since 5.21.0
	 */
	sunDate?: "now" | number | string | Date;

	/**
	 * How wide the twilight between day and night is, in degrees of the sun's
	 * height: day turns into night from half this above the horizon to half
	 * below it.
	 *
	 * @default 12
	 */
	twilight?: number;
}

/**
 * Keeps a series' `sunPosition` worked out from its `sunDate`.
 *
 * @ignore
 */
export class SunClock implements IDisposer {
	protected _timer?: number;
	protected _sunDate?: "now" | number | string | Date;
	protected _disposed: boolean = false;

	constructor(protected _entity: Entity) { }

	/**
	 * Applies the entity's `sunDate`; call it when that changes.
	 */
	public update(): void {
		const entity = this._entity as any;
		const sunDate = entity.get("sunDate");
		// Applied already: a setting stays dirty for the whole frame
		if (sunDate === this._sunDate) {
			return;
		}
		this._sunDate = sunDate;
		this._stop();
		if (sunDate != null) {
			// Worked out, not configured: never saved with the chart
			const apply = () => {
				const date = sunDate == "now" ? new Date() : new Date(sunDate);
				if (!isNaN(date.getTime())) {
					entity._setC("sunPosition", getSunPosition(date));
				}
			};
			apply();
			if (sunDate == "now") {
				// The sun moves a quarter of a degree a minute
				this._timer = window.setInterval(apply, 60000);
			}
		}
	}

	protected _stop() {
		if (this._timer !== undefined) {
			window.clearInterval(this._timer);
			this._timer = undefined;
		}
	}

	public isDisposed(): boolean {
		return this._disposed;
	}

	public dispose(): void {
		this._disposed = true;
		this._stop();
	}
}

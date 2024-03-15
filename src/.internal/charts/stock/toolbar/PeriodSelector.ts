import type { TimeUnit } from "../../../core/util/Time"
import type { DateAxis } from "../../xy/axes/DateAxis";
import type { AxisRenderer } from "../../xy/axes/AxisRenderer";

import { StockControl, IStockControlSettings, IStockControlPrivate, IStockControlEvents } from "./StockControl";
import { MultiDisposer, IDisposer } from "../../../core/util/Disposer";

import * as $utils from "../../../core/util/Utils";
import * as $time from "../../../core/util/Time";
import * as $array from "../../../core/util/Array";

export interface IPeriod {
	timeUnit: TimeUnit | "ytd" | "max" | "custom";
	count?: number;
	name?: string;
	start?: Date;
	end?: Date;
}

export interface IPeriodSelectorSettings extends IStockControlSettings {

	/**
	 * A list periods to choose from.
	 */
	periods?: IPeriod[];

	/**
	 * Hide periods that are longer than the actual data.
	 *
	 * @default false
	 * @since 5.3.9
	 */
	hideLongPeriods?: boolean;

	/**
	 * Indicates whether to select periods from the start or end of the axis
	 * scale.
	 *
	 * @default "end"
	 * @since 5.5.0
	 * @see {@link https://www.amcharts.com/docs/v5/charts/stock/toolbar/period-selector/#Zoom_anchor_point} for more info
	 */
	zoomTo?: "end" | "start";

}

export interface IPeriodSelectorPrivate extends IStockControlPrivate {

	/**
	 * @ignore
	 */
	axis?: DateAxis<AxisRenderer>;

	/**
	 * @ignore
	 */
	deferReset?: boolean;

	/**
	 * @ignore
	 */
	deferTimeout?: IDisposer;

}

export interface IPeriodSelectorEvents extends IStockControlEvents {
	/**
	 * Invoked when user selects certain period via control.
	 *
	 * @from 5.8.5
	 */
	periodselected: {
		period: IPeriod;
	}
}

/**
 * A pre-defined period selector control for [[StockToolback]].
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/stock/toolbar/period-selector/} for more info
 */
export class PeriodSelector extends StockControl {
	public static className: string = "PeriodSelector";
	public static classNames: Array<string> = StockControl.classNames.concat([PeriodSelector.className]);

	declare public _settings: IPeriodSelectorSettings;
	declare public _privateSettings: IPeriodSelectorPrivate;
	declare public _events: IPeriodSelectorEvents;

	protected _groupChangedDp: IDisposer | undefined;
	protected _groupChangedTo: IDisposer | undefined;

	protected _afterNew() {
		super._afterNew();

		const button = this.getPrivate("button")!;
		button.className = button.className + " am5stock-no-hover";

		this._initPeriodButtons();
	}

	protected _initPeriodButtons(): void {
		const container = this.getPrivate("label")!;
		container.style.display = "";

		const periods = this.get("periods", []);
		const axis = this._getAxis();
		axis.onPrivate("min", () => this._setPeriodButtonStatus());
		axis.onPrivate("max", () => this._setPeriodButtonStatus());
		$array.each(periods, (period) => {
			const button = document.createElement("a");
			button.innerHTML = period.name || (period.timeUnit.toUpperCase() + period.count || "1");
			button.className = "am5stock-link";
			button.setAttribute("data-period", period.timeUnit + (period.count || ""));
			container.appendChild(button);

			this._disposers.push($utils.addEventListener(button, "click", (_ev) => {
				this.setPrivate("deferReset", false);
				this._resetActiveButtons();
				this.selectPeriod(period);
				this.setPrivate("deferReset", true);
				$utils.addClass(button, "am5stock-active");
				const timeout = this.getPrivate("deferTimeout");
				if (timeout) {
					timeout.dispose();
				}
				this.setPrivate("deferTimeout", this.setTimeout(() => this.setPrivate("deferReset", false), axis.get("interpolationDuration", 1000) + 200));
			}));
		});

		if ($utils.supports("keyboardevents")) {
			this._disposers.push($utils.addEventListener(document, "keydown", (ev: KeyboardEvent) => {
				if (this.isAccessible()) {
					const button = this.getPrivate("button")!;
					if (document.activeElement && (document.activeElement === button || $utils.contains(button, document.activeElement))) {
						if ([37, 38, 39, 40].indexOf(ev.keyCode) !== -1) {
							const dir = ev.keyCode == 37 || ev.keyCode == 38 ? -1 : 1;
							const items = this._getPeriodButtons();
							const selected = container.querySelectorAll(".am5stock-link:focus");
							let index: number = -1;
							if (selected.length > 0) {
								//index = items.entries().indexOf(selected.item(0));
								items.forEach((item, key) => {
									if (item === selected.item(0)) {
										index = key;
									}
								})
							}
							index += dir;
							if (index < 0) {
								index = items.length - 1;
							}
							else if (index >= items.length) {
								index = 0;
							}
							$utils.focus(items.item(index) as HTMLElement);
						}
						else if (ev.keyCode == 13) {
							// ENTER
							(document.activeElement as HTMLElement).click();
						}
					}
				}
			}));
		}

		this._maybeMakeAccessible();

	}

	protected _resetActiveButtons(): void {
		if (this.getPrivate("deferReset") !== true) {
			const container = this.getPrivate("label")!;
			const buttons = container.getElementsByClassName("am5stock-active");
			$array.each(buttons, (b) => {
				$utils.removeClass(<HTMLElement>b, "am5stock-active");
			});

			let axis = this.getPrivate("axis");
			if (!axis) {
				axis = this._getAxis();
				this.setPrivate("axis", axis);
				this._disposers.push(new MultiDisposer([
					axis!.on("start", () => this._resetActiveButtons()),
					axis!.on("end", () => this._resetActiveButtons())
				]));
			}
		}
	}

	protected _setPeriodButtonStatus(): void {
		if (this.get("hideLongPeriods")) {
			let axis = this.getPrivate("axis");
			const container = this.getPrivate("label")!;
			const buttons = container.getElementsByTagName("a");
			if (!axis) {
				axis = this._getAxis();
				const min = axis!.getPrivate("min", 0);
				const max = axis!.getPrivate("max", 0);
				if (min && max) {
					const diff = max - min;
					const periods = this.get("periods", []);
					$array.each(periods, (period) => {
						if (period.timeUnit !== "ytd" && period.timeUnit !== "max") {
							const plen = $time.getDuration(period.timeUnit as TimeUnit, period.count || 1);
							const id = period.timeUnit + (period.count || "");
							for (let i = 0; i < buttons.length; i++) {
								const button = buttons[i];
								if (button.getAttribute("data-period") == id) {
									if (plen > diff) {
										$utils.addClass(button, "am5stock-hidden");
									}
									else {
										$utils.removeClass(button, "am5stock-hidden");
									}
								}
							}
						}
					});
				}
			}
		}
	}

	// protected _getDefaultIcon(): SVGElement {
	// 	return StockIcons.getIcon("Period");
	// }

	public _afterChanged() {
		super._afterChanged();
		if (this.isPrivateDirty("toolbar")) {
			this._maybeMakeAccessible();
		}
	}

	protected _getChart(): any {
		return this.get("stockChart").panels.getIndex(0)!;
	}

	protected _getAxis(): any {
		return this._getChart().xAxes.getIndex(0)!;
	}

	protected _getMaxOrMax(which: "min" | "max"): Date {
		const stockChart = this.get("stockChart");
		const series = stockChart.get("stockSeries");
		const axis = this._getAxis();
		let val = axis.getPrivate(which);
		if (series && (series.dataItems.length > 0)) {
			// Get last data item
			let baseInterval = axis.get("baseInterval");
			let mainDataSetId: string = baseInterval.timeUnit + baseInterval.count;
			const dataSet = series._dataSets[mainDataSetId] || series.dataItems;
			const dataItem = dataSet[which == "min" ? 0 : dataSet.length - 1];
			if (which == "min" && dataItem.open !== undefined && dataItem.open["valueX"] !== undefined) {
				val = dataItem.open["valueX"];
			}
			else if (which == "max" && dataItem.close !== undefined && dataItem.close["valueX"] !== undefined) {
				val = dataItem.close["valueX"] - 1;
			}
		}
		return new Date(val);
	}


	protected _getMax(): Date {
		return this._getMaxOrMax("max");
	}

	protected _getMin(): Date {
		return this._getMaxOrMax("min");
	}

	public selectPeriod(period: IPeriod): void {
		const type = "periodselected";
		if (this.events.isEnabled(type)) {
			this.events.dispatch(type, {
				type: type,
				target: this,
				period: period
			});
		}

		const fromStart = this.get("zoomTo", "end") == "start";
		this._highlightPeriod(period);
		if (period.timeUnit == "max") {
			this._getChart().zoomOut();
		}
		else if (period.timeUnit == "custom") {
			const axis = this._getAxis();
			let start = period.start || this._getMin();
			let end = period.end || this._getMax();
			axis.zoomToDates(start, end);
		}
		else {
			const axis = this._getAxis();
			let end = this._getMax();
			let start: Date;
			if (period.timeUnit == "ytd") {
				start = new Date(end.getFullYear(), 0, 1, 0, 0, 0, 0);
				//end = new Date(axis.getIntervalMax(axis.get("baseInterval")));
				end = this._getMax();
				if (axis.get("groupData")) {
					axis.zoomToDates(start, end, 0);
					setTimeout(() => {
						axis.zoomToDates(start, end, 0);
					}, 10);

					return;
				}
			}
			else {
				const timeUnit = period.timeUnit as TimeUnit;
				// some adjustments in case data is grouped
				if (axis.get("groupData")) {
					// find interval which will be used after zoom
					const interval = axis.getGroupInterval($time.getDuration(timeUnit, period.count))
					if (interval) {

						const firstDay = this._root.locale.firstDayOfWeek;
						const timezone = this._root.timezone;
						const utc = this._root.utc;

						if (fromStart) {
							start = this._getMin();
							//let startTime = axis.getIntervalMin(axis.get("baseInterval"));
							let startTime = start.getTime();

							if (startTime != null) {
								// round to the previuous interval
								start = $time.round(new Date(startTime), interval.timeUnit, interval.count, firstDay, utc, undefined, timezone);
								start.setTime(start.getTime() + $time.getDuration(interval.timeUnit, interval.count * .95));
								start = $time.round(start, interval.timeUnit, interval.count, firstDay, utc, undefined, timezone);
							}

							end = $time.add(new Date(start), timeUnit, (period.count || 1));
						}
						else {
							// find max of the base interval
							//let endTime = axis.getIntervalMax(axis.get("baseInterval"));
							let endTime = this._getMax().getTime();

							if (endTime != null) {
								// round to the future interval
								end = $time.round(new Date(endTime), interval.timeUnit, interval.count, firstDay, utc, undefined, timezone);
								end.setTime(end.getTime() + $time.getDuration(interval.timeUnit, interval.count * 1.05));
								end = $time.round(end, interval.timeUnit, interval.count, firstDay, utc, undefined, timezone);
							}

							start = $time.add(new Date(end), timeUnit, (period.count || 1) * -1);
						}

						if (this._groupChangedDp) {
							this._groupChangedDp.dispose();
							this._groupChangedDp = undefined;
						}

						if (this._groupChangedTo) {
							this._groupChangedTo.dispose();
						}

						this._groupChangedDp = axis.events.once("groupintervalchanged", () => {
							axis.zoomToDates(start, end, 0);
						});
						axis.zoomToDates(start, end, 0);

						this._groupChangedTo = this.setTimeout(() => {
							if (this._groupChangedDp) {
								this._groupChangedDp.dispose();
							}
							this._groupChangedTo = undefined;
						}, 500);

						return;
					}
				}

				if (fromStart) {
					start = this._getMin();
					end = $time.add(new Date(start), timeUnit, (period.count || 1));
				}
				else {
					start = $time.add(new Date(end), timeUnit, (period.count || 1) * -1);
				}
			}

			axis.zoomToDates(start, end);
		}
	}

	protected _highlightPeriod(period: IPeriod): void {
		const id = period.timeUnit + (period.count || "");
		const container = this.getPrivate("label")!;
		const buttons = container.getElementsByTagName("a");
		for (let i = 0; i < buttons.length; i++) {
			const button = buttons[i];
			if (button.getAttribute("data-period") == id && id != "custom") {
				$utils.addClass(button, "am5stock-active");
			}
			else {
				$utils.removeClass(button, "am5stock-active");
			}
		}
	}

	protected _maybeMakeAccessible(): void {
		super._maybeMakeAccessible();
		if (this.isAccessible()) {
			const button = this.getPrivate("button")!;
			button.setAttribute("aria-label", button.getAttribute("title") + "; " + this._t("Press ENTER or use arrow keys to navigate"));
			const items = this._getPeriodButtons();
			items.forEach((item) => {
				(item as HTMLElement).setAttribute("tabindex", "-1");
				(item as HTMLElement).setAttribute("aria-label", (item as HTMLElement).getAttribute("title") || "");
			});
		}
	}

	protected _getPeriodButtons(): NodeList {
		return this.getPrivate("label")!.querySelectorAll(".am5stock-link");
	}

}
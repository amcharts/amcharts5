import type { TimeUnit } from "../../../core/util/Time"
import type { DateAxis } from "../../xy/axes/DateAxis";
import type { AxisRenderer } from "../../xy/axes/AxisRenderer";

import { StockControl, IStockControlSettings, IStockControlPrivate, IStockControlEvents } from "./StockControl";
import { MultiDisposer, IDisposer } from "../../../core/util/Disposer";

import * as $utils from "../../../core/util/Utils";
import * as $time from "../../../core/util/Time";
import * as $array from "../../../core/util/Array";

export interface IPeriod {
	/**
	 * Time unit of the period, or `"ytd"` (year to date), `"max"` (all data)
	 * or `"custom"` (from `start` to `end`).
	 */
	timeUnit: TimeUnit | "ytd" | "max" | "custom";
	/**
	 * Number of `timeUnit`s in the period.
	 */
	count?: number;
	/**
	 * Label of the period's button.
	 */
	name?: string;
	/**
	 * Start of a `"custom"` period; the start of the data if not set.
	 */
	start?: Date;
	/**
	 * End of a `"custom"` period; the end of the data if not set.
	 */
	end?: Date;
}

export interface IPeriodSelectorSettings extends IStockControlSettings {

	/**
	 * Periods to show buttons for.
	 */
	periods?: IPeriod[];

	/**
	 * Hides the buttons of periods longer than the data.
	 *
	 * @default false
	 * @since 5.3.9
	 */
	hideLongPeriods?: boolean;

	/**
	 * Which end of the data a period is measured from: `"end"` shows the
	 * latest data, `"start"` the earliest.
	 *
	 * @default "end"
	 * @since 5.5.0
	 * @see {@link https://docs.amcharts.com/v5/charts/stock/toolbar/period-selector/#zoom-anchor-point} for more info
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
	 * A period was selected, by a click on its button or with
	 * `selectPeriod()`.
	 *
	 * @since 5.8.5
	 */
	periodselected: {
		period: IPeriod;
	}
}

/**
 * A [[StockToolbar]] control with buttons that zoom the chart to preset
 * periods, such as one month or year to date.
 *
 * @see {@link https://docs.amcharts.com/v5/charts/stock/toolbar/period-selector/} for more info
 */
export class PeriodSelector extends StockControl {
	public static className: string = "PeriodSelector";
	public static classNames: Array<string> = StockControl.classNames.concat([PeriodSelector.className]);

	declare public _settings: IPeriodSelectorSettings;
	declare public _privateSettings: IPeriodSelectorPrivate;
	declare public _events: IPeriodSelectorEvents;

	protected _groupChangedDp: IDisposer | undefined;
	protected _groupChangedTo: IDisposer | undefined;

	// on narrow screens (see the toolbar CSS) the links fold into one button showing the period chosen
	protected _summary?: HTMLSpanElement;

	protected _afterNew() {
		super._afterNew();

		const button = this.getPrivate("button")!;
		button.className = button.className + " am5stock-no-hover";

		this._makeSummary();
		this._initPeriodButtons();
	}

	// the one button the links fold into on narrow screens: hidden here, shown only by the toolbar's own
	// CSS, so a toolbar styled without it (useDefaultCSS: false) never shows it
	protected _makeSummary(): void {
		const button = this.getPrivate("button")!;
		const summary = document.createElement("span");
		summary.className = "am5stock-period-summary";
		summary.style.display = "none";
		button.insertBefore(summary, this.getPrivate("label")!);
		this._summary = summary;
		this._updateSummary();

		this._disposers.push($utils.addEventListener(summary, "click", () => {
			if (button.classList.contains("am5stock-periods-open")) {
				$utils.removeClass(button, "am5stock-periods-open");
			}
			else {
				$utils.addClass(button, "am5stock-periods-open");
				if (document.activeElement === summary) {
					this._focusPeriod();
				}
			}
			this._updateAria();
		}));

		if ($utils.supports("keyboardevents")) {
			this._disposers.push($utils.addEventListener(summary, "keydown", (ev: KeyboardEvent) => {
				const key = $utils.getEventKey(ev);
				if (key == "Enter" || key == " " || (key == "ArrowDown" && !button.classList.contains("am5stock-periods-open"))) {
					ev.preventDefault();
					summary.click();
				}
				else if (key == "Escape") {
					$utils.removeClass(button, "am5stock-periods-open");
					this._updateAria();
				}
			}));
		}

		// a tap anywhere else closes the list
		this._disposers.push($utils.addEventListener(document, "click", (ev: MouseEvent) => {
			if (!$utils.contains(button, ev.target as Element)) {
				$utils.removeClass(button, "am5stock-periods-open");
				this._updateAria();
			}
		}));
	}

	protected _makeTrigger(_button: HTMLDivElement): HTMLDivElement | undefined {
		// the periods are the buttons
		return undefined;
	}

	// focuses the active period, or the first one shown
	protected _focusPeriod(): void {
		const items = this._getShownPeriodButtons();
		let item = items[0];
		$array.each(items, (b) => {
			if (b.classList.contains("am5stock-active")) {
				item = b;
			}
		});
		if (item) {
			$utils.focus(item);
		}
	}

	protected _getShownPeriodButtons(): HTMLElement[] {
		const items: HTMLElement[] = [];
		this._getPeriodButtons().forEach((item) => {
			if (!(item as HTMLElement).classList.contains("am5stock-hidden")) {
				items.push(item as HTMLElement);
			}
		});
		return items;
	}

	// the folded button's text: the period chosen, or "Period" while none is
	protected _updateSummary(): void {
		const summary = this._summary;
		if (summary) {
			const active = this.getPrivate("label")!.getElementsByClassName("am5stock-active");
			summary.innerHTML = this._root._sanitizeHTML((active.length ? active[0].innerHTML : this._root.language.translateAny("Period")) + " <span aria-hidden=\"true\">&#9662;</span>");
		}
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
			const unit = period.timeUnit;
			button.innerHTML = this._root._sanitizeHTML(period.name || (unit.toUpperCase() + (unit == "ytd" || unit == "max" || unit == "custom" ? "" : (period.count || 1))));
			button.className = "am5stock-link";
			button.setAttribute("data-period", period.timeUnit + (period.count || ""));
			container.appendChild(button);

			this._disposers.push($utils.addEventListener(button, "click", (_ev) => {
				this.setPrivate("deferReset", false);
				this._resetActiveButtons();
				this.selectPeriod(period);
				this.setPrivate("deferReset", true);
				$utils.addClass(button, "am5stock-active");
				$utils.removeClass(this.getPrivate("button")!, "am5stock-periods-open");
				this._updateSummary();
				this._updateAria();
				// in the folded list, focus goes back to the button that opened it
				const summary = this._summary;
				if (document.activeElement === button && summary && summary.offsetParent) {
					$utils.focus(summary);
				}
				const timeout = this.getPrivate("deferTimeout");
				if (timeout) {
					timeout.dispose();
				}
				this.setPrivate("deferTimeout", this.setTimeout(() => this.setPrivate("deferReset", false), axis.get("interpolationDuration", 1000) + 200));
			}));
		});

		if ($utils.supports("keyboardevents")) {
			this._disposers.push($utils.addEventListener(container, "keydown", (ev: KeyboardEvent) => {
				if (this.isAccessible()) {
					const items = this._getShownPeriodButtons();
					const index = items.indexOf(document.activeElement as HTMLElement);
					if (index == -1) {
						return;
					}
					const key = $utils.getEventKey(ev);
					let next: number | undefined;
					if (key == "ArrowLeft" || key == "ArrowUp") {
						next = index == 0 ? items.length - 1 : index - 1;
					}
					else if (key == "ArrowRight" || key == "ArrowDown") {
						next = index == items.length - 1 ? 0 : index + 1;
					}
					else if (key == "Home") {
						next = 0;
					}
					else if (key == "End") {
						next = items.length - 1;
					}
					else if (key == "Enter" || key == " ") {
						ev.preventDefault();
						items[index].click();
					}
					else if (key == "Escape" && this._summary && this._summary.offsetParent) {
						$utils.removeClass(this.getPrivate("button")!, "am5stock-periods-open");
						this._updateAria();
						$utils.focus(this._summary);
					}
					if (next !== undefined) {
						ev.preventDefault();
						$utils.focus(items[next]);
						this._updateTabStop(items[next]);
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
			this._updateSummary();
			this._updateAria();

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
		this._updateAria();
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
			let baseInterval = axis.baseMainInterval();
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

	/**
	 * Zooms the chart to a period and highlights its button. Dispatches
	 * `periodselected`.
	 *
	 * @param  period  Period
	 */
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
			const firstDay = this._root.locale.firstDayOfWeek;
			const timezone = this._root.timezone;
			const utc = this._root.utc;
			if (period.timeUnit == "ytd") {
				// January 1 in the chart's timezone
				start = $time.round(new Date(end.getTime()), "year", 1, firstDay, utc, undefined, timezone);
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

							end = $time.add(new Date(start), timeUnit, (period.count || 1), utc, timezone);
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

							start = $time.add(new Date(end), timeUnit, (period.count || 1) * -1, utc, timezone);
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
					end = $time.add(new Date(start), timeUnit, (period.count || 1), utc, timezone);
				}
				else {
					start = $time.add(new Date(end), timeUnit, (period.count || 1) * -1, utc, timezone);
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
		this._updateAria();
	}

	protected _maybeMakeAccessible(): void {
		// a group of buttons, one TAB stop
		const button = this.getPrivate("button")!;
		button.removeAttribute("tabindex");
		const accessible = this.isAccessible();
		if (accessible) {
			button.setAttribute("role", "group");
		}
		else {
			button.removeAttribute("role");
		}
		this._getPeriodButtons().forEach((item) => {
			if (accessible) {
				(item as HTMLElement).setAttribute("role", "button");
			}
			else {
				(item as HTMLElement).removeAttribute("role");
				(item as HTMLElement).removeAttribute("tabindex");
			}
		});
		const summary = this._summary;
		if (summary) {
			if (accessible) {
				const label = this.getPrivate("label")!;
				if (!label.id) {
					label.id = "am5stock-periods-" + this.uid;
				}
				summary.setAttribute("role", "button");
				summary.setAttribute("tabindex", this._root.tabindex.toString());
				summary.setAttribute("aria-controls", label.id);
			}
			else {
				summary.removeAttribute("role");
				summary.removeAttribute("tabindex");
			}
		}
		this._updateAria();
	}

	protected _updateAria(): void {
		const button = this.getPrivate("button");
		if (!button || !this.getPrivate("label")) {
			return;
		}
		const title = button.getAttribute("title");
		if (title) {
			button.setAttribute("aria-label", title);
		}
		if (!this.isAccessible()) {
			return;
		}
		let active: HTMLElement | undefined;
		this._getPeriodButtons().forEach((item) => {
			const pressed = (item as HTMLElement).classList.contains("am5stock-active");
			(item as HTMLElement).setAttribute("aria-pressed", pressed ? "true" : "false");
			if (pressed) {
				active = item as HTMLElement;
			}
		});
		const focused = this._getShownPeriodButtons().indexOf(document.activeElement as HTMLElement) != -1;
		if (!focused) {
			this._updateTabStop(active);
		}
		const summary = this._summary;
		if (summary) {
			summary.setAttribute("aria-expanded", button.classList.contains("am5stock-periods-open") ? "true" : "false");
		}
	}

	// the one period button TAB stops at
	protected _updateTabStop(item?: HTMLElement): void {
		const items = this._getShownPeriodButtons();
		if (!item || items.indexOf(item) == -1) {
			item = items[0];
		}
		const tabindex = this._root.tabindex.toString();
		this._getPeriodButtons().forEach((b) => {
			(b as HTMLElement).setAttribute("tabindex", b === item ? tabindex : "-1");
		})
	}

	protected _getPeriodButtons(): NodeList {
		return this.getPrivate("label")!.querySelectorAll(".am5stock-link");
	}

}
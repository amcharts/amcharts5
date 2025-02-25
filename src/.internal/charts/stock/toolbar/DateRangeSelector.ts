import { StockControl, IStockControlSettings, IStockControlPrivate, IStockControlEvents } from "./StockControl";
import { Dropdown } from "./Dropdown";
import { StockIcons } from "./StockIcons";
import { StyleSheet } from "../../../core/util/Utils";
import flatpickr from "flatpickr";

import * as $utils from "../../../core/util/Utils";
import * as $type from "../../../core/util/Type";

export interface IDateRangeSelectorSettings extends IStockControlSettings {

	/**
	 * Date format to use for date input fields.
	 *
	 * Will use global date format if not set.
	 */
	dateFormat?: string;

	/**
	 * If set to `false` the control will not load default CSS for Flatpickr
	 * component. This would mean it would be unstyled, and would require
	 * custom CSS present on the page.
	 *
	 * @default true
	 * @since 5.2.4
	 */
	useDefaultCSS?: boolean;

	/**
	 * Minimum date to allow for selection.
	 *
	 * Accepts either a `Date` object or `"auto"` (smallest date available in
	 * chart).
	 *
	 * @default "auto"
	 * @since 5.3.7
	 */
	minDate?: Date | "auto" | null;

	/**
	 * Maximum date to allow for selection.
	 *
	 * Accepts either a `Date` object or `"auto"` (latest date available in
	 * chart).
	 *
	 * @default "auto"
	 * @since 5.3.7
	 */
	maxDate?: Date | "auto" | null;

	/**
	 * Set to array of days to disable in date picker dropdowns, with Sunday
	 * starting at 0, Monday - 1, etc.
	 * 
	 * @default []
	 * @since 5.11.1
	 */
	disableWeekDays?: number[];

}

export interface IDateRangeSelectorPrivate extends IStockControlPrivate {
	dropdown: Dropdown;

	fromField: HTMLInputElement;
	fromPicker: any;
	fromDate?: Date;

	toField: HTMLInputElement;
	toPicker: any;
	toDate?: Date;
}

export interface IDateRangeSelectorEvents extends IStockControlEvents {
	/**
	 * Invoked when user selects certain date range via control.
	 *
	 * @from 5.8.5
	 */
	rangeselected: {
		fromDate: Date;
		toDate: Date;
	}
}

/**
 * Date range selector control for [[StockChart]].
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/stock/toolbar/date-range-selector/} for more info
 */
export class DateRangeSelector extends StockControl {
	public static className: string = "DateRangeSelector";
	public static classNames: Array<string> = StockControl.classNames.concat([DateRangeSelector.className]);

	declare public _settings: IDateRangeSelectorSettings;
	declare public _privateSettings: IDateRangeSelectorPrivate;
	declare public _events: IDateRangeSelectorEvents;

	protected _afterNew() {

		// Do parent stuff
		super._afterNew();

		// Create list of tools
		const dropdown = Dropdown.new(this._root, {
			control: this,
			parent: this.getPrivate("button")
		});
		this.setPrivate("dropdown", dropdown);

		dropdown.events.on("opened", (_ev) => {
			this.set("active", true);
			this._updateInputs();
		});

		dropdown.events.on("closed", (_ev) => {
			this.set("active", false);
		});

		this.on("active", (active) => {
			if (active) {
				this.setTimeout(() => {
					dropdown.show();
				}, 10);
			}
			else {
				dropdown.hide();
			}
		});

		const button = this.getPrivate("button")!;
		button.className = button.className + " am5stock-control-dropdown";

		if (this.get("useDefaultCSS", true)) {
			this._loadDefaultCSS();
		}
		this._initDropdown();
	}

	protected _initDropdown(): void {
		const dropdown = this.getPrivate("dropdown");
		const container = dropdown.getPrivate("container")!;

		const content = document.createElement("div")
		content.className = "am5stock-row";
		container.appendChild(content);

		// From fields
		const fromColumn = document.createElement("div")
		fromColumn.className = "am5stock-column";
		content.appendChild(fromColumn);

		const fromGroup = document.createElement("div");
		fromGroup.className = "am5stock-group";
		fromColumn.appendChild(fromGroup);

		const fromLabel = document.createElement("div");
		fromLabel.className = "am5stock-small";
		fromLabel.innerHTML = this._root.language.translate("From %1", undefined, "");
		fromGroup.appendChild(fromLabel);

		const fromField = document.createElement("input");
		fromField.type = "text";
		fromGroup.appendChild(fromField);
		this.setPrivate("fromField", fromField);

		// To fields
		const toColumn = document.createElement("div")
		toColumn.className = "am5stock-column";
		content.appendChild(toColumn);

		const toGroup = document.createElement("div");
		toGroup.className = "am5stock-group";
		toColumn.appendChild(toGroup);

		const toLabel = document.createElement("div");
		toLabel.className = "am5stock-small";
		toLabel.innerHTML = this._root.language.translate("To %1", undefined, "");
		toGroup.appendChild(toLabel);

		const toField = document.createElement("input");
		toField.type = "text";
		toGroup.appendChild(toField);
		this.setPrivate("toField", toField);

		// Date pickers
		const pickerLocale = this._getPickerLocale();

		// Disable weekends?
		const disableWeekDays: number[] = this.get("disableWeekDays", []);
		const disable = disableWeekDays.length ? [
			function(date: Date) {
				return (disableWeekDays.indexOf(date.getDay()) !== -1);
			}
		] : [];

		const fromPicker = flatpickr(fromField, {
			inline: true,
			appendTo: fromColumn,
			allowInput: true,
			locale: pickerLocale,
			disable: disable,
			formatDate: (date) => {
				return this._formatDate(date);
			},
			parseDate: (date) => {
				return this._parseDate(date);
			}
		});

		this.setPrivate("fromPicker", fromPicker);

		const toPicker = flatpickr(toField, {
			inline: true,
			appendTo: toColumn,
			allowInput: true,
			locale: pickerLocale,
			disable: disable,
			formatDate: (date) => {
				return this._formatDate(date);
			},
			parseDate: (date) => {
				return this._parseDate(date);
			}
		});

		this.setPrivate("toPicker", toPicker);


		// Buttons
		const buttons = document.createElement("div")
		buttons.className = "am5stock-row";
		container.appendChild(buttons);

		const buttonsColumn = document.createElement("div")
		buttonsColumn.className = "am5stock-column";
		container.appendChild(buttonsColumn);

		const saveButton = document.createElement("input");
		saveButton.type = "button";
		saveButton.value = this._root.language.translateAny("Apply");
		saveButton.className = "am5-modal-button am5-modal-primary";
		buttonsColumn.appendChild(saveButton);

		const xAxis = this._getAxis();

		xAxis.onPrivate("selectionMin", () => {
			if (this.getPrivate("fromDate")) {
				this._updateInputs();
				this._updateLabel();
			}
		});

		xAxis.onPrivate("selectionMax", () => {
			if (this.getPrivate("toDate")) {
				this._updateInputs();
				this._updateLabel();
			}
		});

		xAxis.onPrivate("minFinal", () => {
			this._updatePickers();
		});

		xAxis.onPrivate("maxFinal", () => {
			this._updatePickers();
		});

		this._disposers.push($utils.addEventListener(saveButton, "click", () => {
			const from = this._parseDate(fromField.value);
			const to = this._parseDate(toField.value);
			to.setHours(23, 59, 59);
			this.setPrivate("fromDate", from);
			this.setPrivate("toDate", to);
			xAxis.zoomToDates(from, to);
			this._updateLabel();
			this.set("active", false);

			const type = "rangeselected";
			if (this.events.isEnabled(type)) {
				this.events.dispatch(type, {
					type: type,
					target: this,
					fromDate: from,
					toDate: to
				});
			}
		}));

		const cancelButton = document.createElement("input");
		cancelButton.type = "button";
		cancelButton.value = this._root.language.translateAny("Cancel");
		cancelButton.className = "am5-modal-button am5-modal-scondary";
		buttonsColumn.appendChild(cancelButton);

		this._disposers.push($utils.addEventListener(cancelButton, "click", () => {
			this.set("active", false);
		}));

	}

	protected _getDefaultIcon(): SVGElement {
		return StockIcons.getIcon("Calendar");
	}

	public _afterChanged() {
		super._afterChanged();
	}

	protected _updateInputs(): void {
		const xAxis = this._getAxis();
		const min = xAxis.getPrivate("selectionMin", 0);
		const max = xAxis.getPrivate("selectionMax", 0);

		if (!min || !max) {
			return;
		}

		const from = new Date(min + 1);
		const to = new Date(max - 1);

		this.setPrivate("fromDate", from);
		this.setPrivate("toDate", to);

		this.getPrivate("fromField").value = this._formatDate(from);
		this.getPrivate("toField").value = this._formatDate(to);

		const fromPicker = this.getPrivate("fromPicker");
		const minDate = fromPicker.config.minDate;
		if (!minDate || (minDate <= from)) {
			fromPicker.setDate(from);
		}
		else {
			fromPicker.setDate(minDate);
		}

		const toPicker = this.getPrivate("toPicker");
		const maxDate = toPicker.config.maxDate;
		if (!maxDate || (maxDate >= to)) {
			toPicker.setDate(to);
		}
		else {
			toPicker.setDate(maxDate);
		}
	}

	protected _updatePickers(): void {
		const xAxis = this._getAxis();

		const minDate = this.get("minDate");
		const maxDate = this.get("maxDate");
		const toPicker = this.getPrivate("toPicker");
		const fromPicker = this.getPrivate("fromPicker");

		if (minDate == "auto") {
			const min = xAxis.getPrivate("minFinal");
			if (min) {
				fromPicker.set("minDate", new Date(min + 1));
				toPicker.set("minDate", new Date(min + 1));
			}
		}
		else if (minDate instanceof Date) {
			fromPicker.set("minDate", minDate);
			toPicker.set("minDate", minDate);
		}
		else {
			fromPicker.set("minDate", undefined);
			toPicker.set("minDate", undefined);
		}

		if (maxDate == "auto") {
			const max = xAxis.getPrivate("maxFinal") - 1;
			if (max) {
				fromPicker.set("maxDate", new Date(max));
				toPicker.set("maxDate", new Date(max));
			}
		}
		else if (maxDate instanceof Date) {
			fromPicker.set("maxDate", maxDate);
			toPicker.set("maxDate", maxDate);
		}
		else {
			fromPicker.set("maxDate", undefined);
			toPicker.set("maxDate", undefined);
		}
	}

	protected _updateLabel(): void {
		const from = this.getPrivate("fromDate");
		const to = this.getPrivate("toDate");
		let label = "";
		if (from && to) {
			label = this._formatDate(from) + " -- " + this._formatDate(to);
		}
		else {
			label = this._root.language.translateAny("Date Range");
		}
		this.set("name", label);
	}

	protected _formatDate(date: Date): string {
		return this._root.dateFormatter.format(date, this._getDateFormat(), true);
	}

	protected _parseDate(date: string): Date {
		return this._root.dateFormatter.parse(date, this._getDateFormat(), false);
	}

	protected _getDateFormat(): string {
		const format = this.get("dateFormat", this._root.dateFormatter.get("dateFormat"));
		return $type.isString(format) ? format : "MM/dd/yyyy";
	}

	protected _getAxis(): any {
		const stockChart = this.get("stockChart");
		const chart = stockChart.panels.getIndex(0)!;
		const xAxis: any = chart.xAxes.getIndex(0)!;
		return xAxis;
	}

	protected _getPickerLocale(): any {
		const l = this._root.language;
		const locale: any = {
			weekdays: {
				shorthand: [
					l.translate("Sun"),
					l.translate("Mon"),
					l.translate("Tue"),
					l.translate("Wed"),
					l.translate("Thu"),
					l.translate("Fri"),
					l.translate("Sat")
				],
				longhand: [
					l.translate("Sunday"),
					l.translate("Monday"),
					l.translate("Tuesday"),
					l.translate("Wednesday"),
					l.translate("Thursday"),
					l.translate("Friday"),
					l.translate("Saturday"),
				],
			},
			months: {
				shorthand: [
					l.translate("Jan"),
					l.translate("Feb"),
					l.translate("Mar"),
					l.translate("Apr"),
					l.translate("May(short)"),
					l.translate("Jun"),
					l.translate("Jul"),
					l.translate("Aug"),
					l.translate("Sep"),
					l.translate("Oct"),
					l.translate("Nov"),
					l.translate("Dec"),
				],
				longhand: [
					l.translate("January"),
					l.translate("February"),
					l.translate("March"),
					l.translate("April"),
					l.translate("May"),
					l.translate("June"),
					l.translate("July"),
					l.translate("August"),
					l.translate("September"),
					l.translate("October"),
					l.translate("November"),
					l.translate("December"),
				],
			},
			firstDayOfWeek: this._root.locale.firstDayOfWeek,
			ordinal: l.translateFunc("_dateOrd"),
			rangeSeparator: " " + l.translateAny("to") + " ",
			weekAbbreviation: l.translateAny("Wk"),
			scrollTitle: l.translateAny("Scroll to increment"),
			toggleTitle: l.translateAny("Click to toggle"),
			amPM: [l.translate("AM"), l.translate("PM")],
			yearAriaLabel: l.translateAny("Year"),
			monthAriaLabel: l.translateAny("Month"),
			hourAriaLabel: l.translateAny("Hour"),
			minuteAriaLabel: l.translateAny("Minute"),
			time_24hr: true
		}

		return locale;
	}

	/**
	 * Loads the default CSS.
	 *
	 * @ignore Exclude from docs
	 */
	protected _loadDefaultCSS(): void {
		const ic = this._root.interfaceColors;
		//const active = ic.get("secondaryButton")!.toCSS();
		const primary = ic.get("primaryButton")!.toCSS();
		const primary2 = ic.get("primaryButtonHover")!.toCSS();
		const text = ic.get("text")!.toCSS();
		const border = ic.get("secondaryButtonActive")!.toCSS();
		const bg = ic.get("background")!.toCSS();

		this._disposers.push(new StyleSheet(null, `
.flatpickr-calendar {
  background: transparent;
  opacity: 0;
  display: none;
  text-align: center;
  visibility: hidden;
  padding: 0;
  -webkit-animation: none;
          animation: none;
  direction: ltr;
  border: 0;
  font-size: 12px;
  line-height: 24px;
  border-radius: 5px;
  position: absolute;
  width: 200px;
  -webkit-box-sizing: border-box;
          box-sizing: border-box;
  -ms-touch-action: manipulation;
      touch-action: manipulation;
  background: ${bg};
  margin-top: 0.5em;
}
.flatpickr-calendar.open,
.flatpickr-calendar.inline {
  opacity: 1;
  max-height: 640px;
  visibility: visible;
}
.flatpickr-calendar.open {
  display: inline-block;
  z-index: 99999;
}
.flatpickr-calendar.animate.open {
  -webkit-animation: fpFadeInDown 300ms cubic-bezier(0.23, 1, 0.32, 1);
          animation: fpFadeInDown 300ms cubic-bezier(0.23, 1, 0.32, 1);
}
.flatpickr-calendar.inline {
  display: block;
  position: relative;
  top: 2px;
}
.flatpickr-calendar.static {
  position: absolute;
  top: calc(100% + 2px);
}
.flatpickr-calendar.static.open {
  z-index: 999;
  display: block;
}
.flatpickr-calendar.multiMonth .flatpickr-days .dayContainer:nth-child(n+1) .flatpickr-day.inRange:nth-child(7n+7) {
  -webkit-box-shadow: none !important;
          box-shadow: none !important;
}
.flatpickr-calendar.multiMonth .flatpickr-days .dayContainer:nth-child(n+2) .flatpickr-day.inRange:nth-child(7n+1) {
  -webkit-box-shadow: -2px 0 0 #e6e6e6, 5px 0 0 #e6e6e6;
          box-shadow: -2px 0 0 #e6e6e6, 5px 0 0 #e6e6e6;
}
.flatpickr-calendar .hasWeeks .dayContainer,
.flatpickr-calendar .hasTime .dayContainer {
  border-bottom: 0;
  border-bottom-right-radius: 0;
  border-bottom-left-radius: 0;
}
.flatpickr-calendar .hasWeeks .dayContainer {
  border-left: 0;
}
.flatpickr-calendar.hasTime .flatpickr-time {
  height: 40px;
  border-top: 1px solid ${border};
}
.flatpickr-calendar.noCalendar.hasTime .flatpickr-time {
  height: auto;
}
.flatpickr-calendar:before,
.flatpickr-calendar:after {
  position: absolute;
  display: block;
  pointer-events: none;
  border: solid transparent;
  content: '';
  height: 0;
  width: 0;
  left: 22px;
}
.flatpickr-calendar.rightMost:before,
.flatpickr-calendar.arrowRight:before,
.flatpickr-calendar.rightMost:after,
.flatpickr-calendar.arrowRight:after {
  left: auto;
  right: 22px;
}
.flatpickr-calendar.arrowCenter:before,
.flatpickr-calendar.arrowCenter:after {
  left: 50%;
  right: 50%;
}
.flatpickr-calendar:before {
  border-width: 5px;
  margin: 0 -5px;
}
.flatpickr-calendar:after {
  border-width: 4px;
  margin: 0 -4px;
}
.flatpickr-calendar.arrowTop:before,
.flatpickr-calendar.arrowTop:after {
  bottom: 100%;
}
.flatpickr-calendar.arrowTop:before {
  border-bottom-color: ${border};
}
.flatpickr-calendar.arrowTop:after {
  border-bottom-color: ${bg};
}
.flatpickr-calendar.arrowBottom:before,
.flatpickr-calendar.arrowBottom:after {
  top: 100%;
}
.flatpickr-calendar.arrowBottom:before {
  border-top-color: ${border};
}
.flatpickr-calendar.arrowBottom:after {
  border-top-color: ${bg};
}
.flatpickr-calendar:focus {
  outline: 0;
}
.flatpickr-wrapper {
  position: relative;
  display: inline-block;
}
.flatpickr-months {
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
}
.flatpickr-months .flatpickr-month {
  background: transparent;
  color: ${text};
  fill: ${text};
  height: 34px;
  line-height: 1;
  text-align: center;
  position: relative;
  -webkit-user-select: none;
     -moz-user-select: none;
      -ms-user-select: none;
          user-select: none;
  overflow: hidden;
  -webkit-box-flex: 1;
  -webkit-flex: 1;
      -ms-flex: 1;
          flex: 1;
}
.flatpickr-months .flatpickr-prev-month,
.flatpickr-months .flatpickr-next-month {
  text-decoration: none;
  cursor: pointer;
  position: absolute;
  top: 0;
  height: 34px;
  padding: 10px;
  z-index: 3;
  color: ${text};
  fill: ${text};
}
.flatpickr-months .flatpickr-prev-month.flatpickr-disabled,
.flatpickr-months .flatpickr-next-month.flatpickr-disabled {
  display: none;
}
.flatpickr-months .flatpickr-prev-month i,
.flatpickr-months .flatpickr-next-month i {
  position: relative;
}
.flatpickr-months .flatpickr-prev-month.flatpickr-prev-month,
.flatpickr-months .flatpickr-next-month.flatpickr-prev-month {
/*
      /*rtl:begin:ignore*/
/*
      */
  left: 0;
/*
      /*rtl:end:ignore*/
/*
      */
}
/*
      /*rtl:begin:ignore*/
/*
      /*rtl:end:ignore*/
.flatpickr-months .flatpickr-prev-month.flatpickr-next-month,
.flatpickr-months .flatpickr-next-month.flatpickr-next-month {
/*
      /*rtl:begin:ignore*/
/*
      */
  right: 0;
/*
      /*rtl:end:ignore*/
/*
      */
}
/*
      /*rtl:begin:ignore*/
/*
      /*rtl:end:ignore*/
.flatpickr-months .flatpickr-prev-month:hover,
.flatpickr-months .flatpickr-next-month:hover {
  color: ${primary2};
}
.flatpickr-months .flatpickr-prev-month:hover svg,
.flatpickr-months .flatpickr-next-month:hover svg {
  fill: ${primary2};
}
.flatpickr-months .flatpickr-prev-month svg,
.flatpickr-months .flatpickr-next-month svg {
  width: 14px;
  height: 14px;
}
.flatpickr-months .flatpickr-prev-month svg path,
.flatpickr-months .flatpickr-next-month svg path {
  -webkit-transition: fill 0.1s;
  transition: fill 0.1s;
  fill: inherit;
}
.numInputWrapper {
  position: relative;
  height: auto;
}
.numInputWrapper input,
.numInputWrapper span {
  display: inline-block;
}
.numInputWrapper input {
  width: 100%;
}
.numInputWrapper input::-ms-clear {
  display: none;
}
.numInputWrapper input::-webkit-outer-spin-button,
.numInputWrapper input::-webkit-inner-spin-button {
  margin: 0;
  -webkit-appearance: none;
}
.numInputWrapper span {
  position: absolute;
  right: 0;
  width: 14px;
  padding: 0 4px 0 2px;
  height: 50%;
  line-height: 50%;
  opacity: 0;
  cursor: pointer;
  border: 1px solid rgba(64,72,72,0.15);
  -webkit-box-sizing: border-box;
          box-sizing: border-box;
}
.numInputWrapper span:hover {
  background: rgba(0,0,0,0.1);
}
.numInputWrapper span:active {
  background: rgba(0,0,0,0.2);
}
.numInputWrapper span:after {
  display: block;
  content: "";
  position: absolute;
}
.numInputWrapper span.arrowUp {
  top: 0;
  border-bottom: 0;
}
.numInputWrapper span.arrowUp:after {
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-bottom: 4px solid rgba(64,72,72,0.6);
  top: 26%;
}
.numInputWrapper span.arrowDown {
  top: 50%;
}
.numInputWrapper span.arrowDown:after {
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 4px solid rgba(64,72,72,0.6);
  top: 40%;
}
.numInputWrapper span svg {
  width: inherit;
  height: auto;
}
.numInputWrapper span svg path {
  fill: rgba(60,63,64,0.5);
}
.numInputWrapper:hover {
  background: rgba(0,0,0,0.05);
}
.numInputWrapper:hover span {
  opacity: 1;
}
.flatpickr-current-month {
  margin-top: 1px;
  font-size: 125%;
  line-height: inherit;
  font-weight: 300;
  color: inherit;
  position: absolute;
  width: 75%;
  left: 12.5%;
  padding: 7.48px 0 0 0;
  line-height: 1;
  height: 34px;
  display: inline-block;
  text-align: center;
  -webkit-transform: translate3d(0px, 0px, 0px);
          transform: translate3d(0px, 0px, 0px);
}
.flatpickr-current-month span.cur-month {
  font-family: inherit;
  font-weight: 700;
  color: inherit;
  display: inline-block;
  margin-left: 0.5ch;
  padding: 0;
}
.flatpickr-current-month span.cur-month:hover {
  background: rgba(0,0,0,0.05);
}
.flatpickr-current-month .numInputWrapper {
  width: 6ch;
  width: 7ch\\0;
  display: inline-block;
}
.flatpickr-current-month .numInputWrapper span.arrowUp:after {
  border-bottom-color: ${text};
}
.flatpickr-current-month .numInputWrapper span.arrowDown:after {
  border-top-color: ${text};
}
.flatpickr-current-month input.cur-year {
  background: transparent;
  -webkit-box-sizing: border-box;
          box-sizing: border-box;
  color: inherit;
  cursor: text;
  padding: 0 0 0 0.5ch;
  margin: 0;
  display: inline-block;
  font-size: inherit;
  font-family: inherit;
  font-weight: 300;
  line-height: inherit;
  height: auto;
  border: 0;
  border-radius: 0;
  vertical-align: initial;
  -webkit-appearance: textfield;
  -moz-appearance: textfield;
  appearance: textfield;
}
.flatpickr-current-month input.cur-year:focus {
  outline: 0;
}
.flatpickr-current-month input.cur-year[disabled],
.flatpickr-current-month input.cur-year[disabled]:hover {
  font-size: 100%;
  color: rgba(60,63,64,0.5);
  background: transparent;
  pointer-events: none;
}
.flatpickr-current-month .flatpickr-monthDropdown-months {
  appearance: menulist;
  background: transparent;
  border: none;
  border-radius: 0;
  box-sizing: border-box;
  color: inherit;
  cursor: pointer;
  font-size: inherit;
  font-family: inherit;
  font-weight: 300;
  height: auto;
  line-height: inherit;
  margin: -1px 0 0 0;
  outline: none;
  padding: 0 0 0 0.5ch;
  position: relative;
  vertical-align: initial;
  -webkit-box-sizing: border-box;
  -webkit-appearance: menulist;
  -moz-appearance: menulist;
  width: auto;
  max-width: 93px;
}
.flatpickr-current-month .flatpickr-monthDropdown-months:focus,
.flatpickr-current-month .flatpickr-monthDropdown-months:active {
  outline: none;
}
.flatpickr-current-month .flatpickr-monthDropdown-months:hover {
  background: rgba(0,0,0,0.05);
}
.flatpickr-current-month .flatpickr-monthDropdown-months .flatpickr-monthDropdown-month {
  background-color: ${bg};
  outline: none;
  padding: 0;
}
.flatpickr-weekdays {
  background: transparent;
  text-align: center;
  overflow: hidden;
  width: 100%;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-align: center;
  -webkit-align-items: center;
      -ms-flex-align: center;
          align-items: center;
  height: 28px;
}
.flatpickr-weekdays .flatpickr-weekdaycontainer {
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-flex: 1;
  -webkit-flex: 1;
      -ms-flex: 1;
          flex: 1;
}
span.flatpickr-weekday {
  cursor: default;
  font-size: 90%;
  background: transparent;
  color: ${text};
  line-height: 1;
  margin: 0;
  text-align: center;
  display: block;
  -webkit-box-flex: 1;
  -webkit-flex: 1;
      -ms-flex: 1;
          flex: 1;
  font-weight: bolder;
}
.dayContainer,
.flatpickr-weeks {
  padding: 1px 0 0 0;
}
.flatpickr-days {
  position: relative;
  overflow: hidden;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-align: start;
  -webkit-align-items: flex-start;
      -ms-flex-align: start;
          align-items: flex-start;
  width: 200px;
}
.flatpickr-days:focus {
  outline: 0;
}
.dayContainer {
  padding: 0;
  outline: 0;
  text-align: left;
  width: 200px;
  min-width: 200px;
  max-width: 200px;
  -webkit-box-sizing: border-box;
          box-sizing: border-box;
  display: inline-block;
  display: -ms-flexbox;
  display: -webkit-box;
  display: -webkit-flex;
  display: flex;
  -webkit-flex-wrap: wrap;
          flex-wrap: wrap;
  -ms-flex-wrap: wrap;
  -ms-flex-pack: justify;
  -webkit-justify-content: space-around;
          justify-content: space-around;
  -webkit-transform: translate3d(0px, 0px, 0px);
          transform: translate3d(0px, 0px, 0px);
  opacity: 1;
}
.dayContainer + .dayContainer {
  -webkit-box-shadow: -1px 0 0 ${border};
          box-shadow: -1px 0 0 ${border};
}
.flatpickr-day {
  background: none;
  border: 1px solid transparent;
  border-radius: 150px;
  -webkit-box-sizing: border-box;
          box-sizing: border-box;
  color: ${text};
  cursor: pointer;
  font-weight: 400;
  width: 14.2857143%;
  -webkit-flex-basis: 14.2857143%;
      -ms-flex-preferred-size: 14.2857143%;
          flex-basis: 14.2857143%;
  max-width: 32px;
  height: 32px;
  line-height: 30px;
  margin: 0;
  display: inline-block;
  position: relative;
  -webkit-box-pack: center;
  -webkit-justify-content: center;
      -ms-flex-pack: center;
          justify-content: center;
  text-align: center;
}
.flatpickr-day.inRange,
.flatpickr-day.prevMonthDay.inRange,
.flatpickr-day.nextMonthDay.inRange,
.flatpickr-day.today.inRange,
.flatpickr-day.prevMonthDay.today.inRange,
.flatpickr-day.nextMonthDay.today.inRange,
.flatpickr-day:hover,
.flatpickr-day.prevMonthDay:hover,
.flatpickr-day.nextMonthDay:hover,
.flatpickr-day:focus,
.flatpickr-day.prevMonthDay:focus,
.flatpickr-day.nextMonthDay:focus {
  cursor: pointer;
  outline: 0;
  background: ${primary2};
  border-color: ${primary2};
}
.flatpickr-day.today {
  border-color: ${primary2};
}
.flatpickr-day.today:hover,
.flatpickr-day.today:focus {
  border-color: ${primary2};
  background: ${primary2};
  color: ${bg};
}
.flatpickr-day.selected,
.flatpickr-day.startRange,
.flatpickr-day.endRange,
.flatpickr-day.selected.inRange,
.flatpickr-day.startRange.inRange,
.flatpickr-day.endRange.inRange,
.flatpickr-day.selected:focus,
.flatpickr-day.startRange:focus,
.flatpickr-day.endRange:focus,
.flatpickr-day.selected:hover,
.flatpickr-day.startRange:hover,
.flatpickr-day.endRange:hover,
.flatpickr-day.selected.prevMonthDay,
.flatpickr-day.startRange.prevMonthDay,
.flatpickr-day.endRange.prevMonthDay,
.flatpickr-day.selected.nextMonthDay,
.flatpickr-day.startRange.nextMonthDay,
.flatpickr-day.endRange.nextMonthDay {
  background: ${primary};
  -webkit-box-shadow: none;
          box-shadow: none;
  color: ${bg};
  border-color: ${primary};
}
.flatpickr-day.selected.startRange,
.flatpickr-day.startRange.startRange,
.flatpickr-day.endRange.startRange {
  border-radius: 50px 0 0 50px;
}
.flatpickr-day.selected.endRange,
.flatpickr-day.startRange.endRange,
.flatpickr-day.endRange.endRange {
  border-radius: 0 50px 50px 0;
}
.flatpickr-day.selected.startRange + .endRange:not(:nth-child(7n+1)),
.flatpickr-day.startRange.startRange + .endRange:not(:nth-child(7n+1)),
.flatpickr-day.endRange.startRange + .endRange:not(:nth-child(7n+1)) {
  -webkit-box-shadow: -10px 0 0 ${primary};
          box-shadow: -10px 0 0 ${primary};
}
.flatpickr-day.selected.startRange.endRange,
.flatpickr-day.startRange.startRange.endRange,
.flatpickr-day.endRange.startRange.endRange {
  border-radius: 50px;
}
.flatpickr-day.inRange {
  border-radius: 0;
  -webkit-box-shadow: -5px 0 0 ${primary2}, 5px 0 0 ${primary2};
          box-shadow: -5px 0 0 ${primary2}, 5px 0 0 ${primary2};
}
.flatpickr-day.flatpickr-disabled,
.flatpickr-day.flatpickr-disabled:hover,
.flatpickr-day.prevMonthDay,
.flatpickr-day.nextMonthDay,
.flatpickr-day.notAllowed,
.flatpickr-day.notAllowed.prevMonthDay,
.flatpickr-day.notAllowed.nextMonthDay {
  color: rgba(64,72,72,0.3);
  background: transparent;
  cursor: default;
}
.flatpickr-day.flatpickr-disabled,
.flatpickr-day.flatpickr-disabled:hover {
  cursor: not-allowed;
  color: rgba(64,72,72,0.1);
}
.flatpickr-day.week.selected {
  border-radius: 0;
  -webkit-box-shadow: -5px 0 0 ${primary}, 5px 0 0 ${primary};
          box-shadow: -5px 0 0 ${primary}, 5px 0 0 ${primary};
}
.flatpickr-day.hidden {
  visibility: hidden;
}
.rangeMode .flatpickr-day {
  margin-top: 1px;
}
.flatpickr-weekwrapper {
  float: left;
}
.flatpickr-weekwrapper .flatpickr-weeks {
  padding: 0 12px;
  -webkit-box-shadow: 1px 0 0 ${border};
          box-shadow: 1px 0 0 ${border};
}
.flatpickr-weekwrapper .flatpickr-weekday {
  float: none;
  width: 100%;
  line-height: 28px;
}
.flatpickr-weekwrapper span.flatpickr-day,
.flatpickr-weekwrapper span.flatpickr-day:hover {
  display: block;
  width: 100%;
  max-width: none;
  color: rgba(64,72,72,0.3);
  background: transparent;
  cursor: default;
  border: none;
}
.flatpickr-innerContainer {
  display: block;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-sizing: border-box;
          box-sizing: border-box;
  overflow: hidden;
}
.flatpickr-rContainer {
  display: inline-block;
  padding: 0;
  -webkit-box-sizing: border-box;
          box-sizing: border-box;
}
.flatpickr-time {
  text-align: center;
  outline: 0;
  display: block;
  height: 0;
  line-height: 40px;
  max-height: 40px;
  -webkit-box-sizing: border-box;
          box-sizing: border-box;
  overflow: hidden;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
}
.flatpickr-time:after {
  content: "";
  display: table;
  clear: both;
}
.flatpickr-time .numInputWrapper {
  -webkit-box-flex: 1;
  -webkit-flex: 1;
      -ms-flex: 1;
          flex: 1;
  width: 40%;
  height: 40px;
  float: left;
}
.flatpickr-time .numInputWrapper span.arrowUp:after {
  border-bottom-color: ${text};
}
.flatpickr-time .numInputWrapper span.arrowDown:after {
  border-top-color: ${text};
}
.flatpickr-time.hasSeconds .numInputWrapper {
  width: 26%;
}
.flatpickr-time.time24hr .numInputWrapper {
  width: 49%;
}
.flatpickr-time input {
  background: transparent;
  -webkit-box-shadow: none;
          box-shadow: none;
  border: 0;
  border-radius: 0;
  text-align: center;
  margin: 0;
  padding: 0;
  height: inherit;
  line-height: inherit;
  color: ${text};
  font-size: 14px;
  position: relative;
  -webkit-box-sizing: border-box;
          box-sizing: border-box;
  -webkit-appearance: textfield;
  -moz-appearance: textfield;
  appearance: textfield;
}
.flatpickr-time input.flatpickr-hour {
  font-weight: bold;
}
.flatpickr-time input.flatpickr-minute,
.flatpickr-time input.flatpickr-second {
  font-weight: 400;
}
.flatpickr-time input:focus {
  outline: 0;
  border: 0;
}
.flatpickr-time .flatpickr-time-separator,
.flatpickr-time .flatpickr-am-pm {
  height: inherit;
  float: left;
  line-height: inherit;
  color: ${text};
  font-weight: bold;
  width: 2%;
  -webkit-user-select: none;
     -moz-user-select: none;
      -ms-user-select: none;
          user-select: none;
  -webkit-align-self: center;
      -ms-flex-item-align: center;
          align-self: center;
}
.flatpickr-time .flatpickr-am-pm {
  outline: 0;
  width: 18%;
  cursor: pointer;
  text-align: center;
  font-weight: 400;
}
.flatpickr-time input:hover,
.flatpickr-time .flatpickr-am-pm:hover,
.flatpickr-time input:focus,
.flatpickr-time .flatpickr-am-pm:focus {
  background: #f1f1f1;
}
.flatpickr-input[readonly] {
  cursor: pointer;
}
@-webkit-keyframes fpFadeInDown {
  from {
    opacity: 0;
    -webkit-transform: translate3d(0, -20px, 0);
            transform: translate3d(0, -20px, 0);
  }
  to {
    opacity: 1;
    -webkit-transform: translate3d(0, 0, 0);
            transform: translate3d(0, 0, 0);
  }
}
@keyframes fpFadeInDown {
  from {
    opacity: 0;
    -webkit-transform: translate3d(0, -20px, 0);
            transform: translate3d(0, -20px, 0);
  }
  to {
    opacity: 1;
    -webkit-transform: translate3d(0, 0, 0);
            transform: translate3d(0, 0, 0);
  }
}
.flatpickr-calendar {
  width: 200px;
}
.dayContainer {
  padding: 0;
  border-right: 0;
}
span.flatpickr-day,
span.flatpickr-day.prevMonthDay,
span.flatpickr-day.nextMonthDay {
  border-radius: 0 !important;
  border: 1px solid ${primary2};
  max-width: none;
  border-right-color: transparent;
}
span.flatpickr-day:nth-child(n+8),
span.flatpickr-day.prevMonthDay:nth-child(n+8),
span.flatpickr-day.nextMonthDay:nth-child(n+8) {
  border-top-color: transparent;
}
span.flatpickr-day:nth-child(7n-6),
span.flatpickr-day.prevMonthDay:nth-child(7n-6),
span.flatpickr-day.nextMonthDay:nth-child(7n-6) {
  border-left: 0;
}
span.flatpickr-day:nth-child(n+36),
span.flatpickr-day.prevMonthDay:nth-child(n+36),
span.flatpickr-day.nextMonthDay:nth-child(n+36) {
  border-bottom: 0;
}
span.flatpickr-day:nth-child(-n+7),
span.flatpickr-day.prevMonthDay:nth-child(-n+7),
span.flatpickr-day.nextMonthDay:nth-child(-n+7) {
  margin-top: 0;
}
span.flatpickr-day.today:not(.selected),
span.flatpickr-day.prevMonthDay.today:not(.selected),
span.flatpickr-day.nextMonthDay.today:not(.selected) {
  border-color: ${primary2};
  border-right-color: transparent;
  border-top-color: transparent;
  border-bottom-color: ${primary2};
}
span.flatpickr-day.today:not(.selected):hover,
span.flatpickr-day.prevMonthDay.today:not(.selected):hover,
span.flatpickr-day.nextMonthDay.today:not(.selected):hover {
  border: 1px solid ${primary2};
}
span.flatpickr-day.startRange,
span.flatpickr-day.prevMonthDay.startRange,
span.flatpickr-day.nextMonthDay.startRange,
span.flatpickr-day.endRange,
span.flatpickr-day.prevMonthDay.endRange,
span.flatpickr-day.nextMonthDay.endRange {
  border-color: ${primary};
}
span.flatpickr-day.today,
span.flatpickr-day.prevMonthDay.today,
span.flatpickr-day.nextMonthDay.today,
span.flatpickr-day.selected,
span.flatpickr-day.prevMonthDay.selected,
span.flatpickr-day.nextMonthDay.selected {
  z-index: 2;
}
.rangeMode .flatpickr-day {
  margin-top: -1px;
}
.flatpickr-weekwrapper .flatpickr-weeks {
  -webkit-box-shadow: none;
          box-shadow: none;
}
.flatpickr-weekwrapper span.flatpickr-day {
  border: 0;
  margin: -1px 0 0 -1px;
}
.hasWeeks .flatpickr-days {
  border-right: 0;
}

	@media screen and (min-width:0\\0) and (min-resolution: +72dpi) {
		span.flatpickr-day {
			display: block;
			-webkit-box-flex: 1;
			-webkit-flex: 1 0 auto;
			    -ms-flex: 1 0 auto;
			        flex: 1 0 auto;
		}
	}
		`, this._root.nonce));
	}

}
import type { AxisRenderer } from "./AxisRenderer";
import type { IXYSeriesDataItem, XYSeries } from "../series/XYSeries";

import { DataItem } from "../../../core/render/Component";
import { Axis, IAxisSettings, IAxisPrivate, IAxisDataItem, IAxisEvents } from "./Axis";
import { MultiDisposer } from "../../../core/util/Disposer";

import * as $type from "../../../core/util/Type";
import * as $array from "../../../core/util/Array";
import * as $math from "../../../core/util/Math";
import * as $utils from "../../../core/util/Utils";

export interface IValueAxisSettings<R extends AxisRenderer> extends IAxisSettings<R> {

	/**
	 * Lowest value of the axis scale, instead of the lowest series value. The
	 * axis may round it to fit its grid, unless `strictMinMax` is `true`.
	 *
	 * @see {@link https://docs.amcharts.com/v5/charts/xy-chart/axes/value-axis/#custom-scope} for more info
	 */
	min?: number;

	/**
	 * Highest value of the axis scale, instead of the highest series value.
	 * The axis may round it to fit its grid, unless `strictMinMax` is `true`.
	 *
	 * @see {@link https://docs.amcharts.com/v5/charts/xy-chart/axes/value-axis/#custom-scope} for more info
	 */
	max?: number;

	/**
	 * Makes the scale start and end exactly at `min` and `max`, or where they
	 * aren't set, at the lowest and highest series values, without rounding.
	 * The axis then also stops rescaling to the values in view as the chart
	 * zooms. To rescale to the exact values in view, use
	 * `strictMinMaxSelection` instead.
	 *
	 * `extraMin` and `extraMax` still add padding.
	 *
	 * @see {@link https://docs.amcharts.com/v5/charts/xy-chart/axes/value-axis/#custom-scope} for more info
	 */
	strictMinMax?: boolean;

	/**
	 * Rescales the axis to exactly the lowest and highest values in view as
	 * the chart zooms, without rounding. Keeps series of derived values, such
	 * as `valueYChangeSelection`, from jumping around.
	 *
	 * Has no effect with `strictMinMax`, which stops the rescaling. `extraMin`
	 * and `extraMax` still add padding.
	 *
	 * @since 5.1.11
	 */
	strictMinMaxSelection?: boolean;

	/**
	 * Uses a logarithmic scale. It can show only values above zero; see
	 * `treatZeroAs`.
	 *
	 * @see {@link https://docs.amcharts.com/v5/charts/xy-chart/axes/value-axis/#logarithmic-scale} for more info
	 */
	logarithmic?: boolean;

	/**
	 * On a `logarithmic` axis, the value to plot zero and negative values at,
	 * since the scale can't show them.
	 *
	 * @see {@link https://docs.amcharts.com/v5/charts/xy-chart/axes/value-axis/#logarithmic-scale} for more info
	 */
	treatZeroAs?: number;

	/**
	 * Extends the scale below the lowest value by this share of the value
	 * range: with values from `0` to `1000`, `0.1` starts the axis at `-100`
	 * (before rounding to the grid). If not set, a `logarithmic` axis without
	 * `strictMinMax` uses `0.1`.
	 *
	 * @see {@link https://docs.amcharts.com/v5/charts/xy-chart/axes/value-axis/#relative-scope-extension} for more info
	 */
	extraMin?: number;

	/**
	 * Extends the scale above the highest value by this share of the value
	 * range: with values from `0` to `1000`, `0.1` ends the axis at `1100`
	 * (before rounding to the grid). If not set, a `logarithmic` axis without
	 * `strictMinMax` uses `0.2`.
	 *
	 * @see {@link https://docs.amcharts.com/v5/charts/xy-chart/axes/value-axis/#relative-scope-extension} for more info
	 */
	extraMax?: number;

	/**
	 * The value columns grow from, splitting "positive" from "negative"
	 * values. Its grid line gets the `"base"` theme tag.
	 *
	 * @default 0
	 * @see {@link https://docs.amcharts.com/v5/charts/xy-chart/axes/value-axis/#base-value} for more info
	 */
	baseValue?: number;

	/**
	 * Most decimal places the labels may have. It also limits the grid step:
	 * `0` allows whole-number steps only.
	 *
	 * @see {@link https://docs.amcharts.com/v5/charts/xy-chart/axes/value-axis/#label-format} for more info
	 */
	maxPrecision?: number;

	/**
	 * Function that decides which axis fills show; it is called for each grid
	 * step. The default fills every other step.
	 *
	 * @see {@link https://docs.amcharts.com/v5/charts/xy-chart/axes/#axis-fills} for more info
	 */
	fillRule?: (dataItem: DataItem<IValueAxisDataItem>) => void;

	/**
	 * Number format for the labels. If not set, the number formatter's default
	 * format is used, with as many decimals as the grid step needs.
	 *
	 * @see {@link https://docs.amcharts.com/v5/charts/xy-chart/axes/value-axis/#label-format} for more info
	 */
	numberFormat?: string;

	/**
	 * Number format for the axis tooltip. If not set, `numberFormat` is used.
	 *
	 * @see {@link https://docs.amcharts.com/v5/charts/xy-chart/axes/value-axis/#tooltip-number-format} for more info
	 */
	tooltipNumberFormat?: string | Intl.NumberFormatOptions;

	/**
	 * Extra decimal places for the axis tooltip, beyond those of the labels:
	 * with labels like `1.1` and `1.2`, `1` lets the tooltip show `1.15`.
	 *
	 * @see {@link https://docs.amcharts.com/v5/charts/xy-chart/axes/value-axis/#tooltip-number-format} for more info
	 */
	extraTooltipPrecision?: number;

	/**
	 * Calculates totals across the axis's series for each data item in view:
	 * `valueYTotal`, `valueYSum` and `valueYTotalPercent` (or the `valueX`
	 * ones on an X axis), as used by 100% stacked charts. Series with
	 * `excludeFromTotal` are left out.
	 *
	 * @see {@link https://docs.amcharts.com/v5/charts/xy-chart/axes/value-axis/#calculated-values} for more info
	 */
	calculateTotals?: boolean;

	/**
	 * Another [[ValueAxis]] whose grid this axis lines up with, by adjusting
	 * its own scale. A perfect match isn't always possible.
	 *
	 * @see {@link https://docs.amcharts.com/v5/charts/xy-chart/axes/value-axis/#syncing-grid} for more info
	 */
	syncWithAxis?: ValueAxis<AxisRenderer>;

	/**
	 * Lines up this axis's zero with the zero of `syncWithAxis`, spreading the
	 * other grid lines above and below it. Needs zero within the range of
	 * `syncWithAxis`, which has to extend to each side where this axis has
	 * values.
	 *
	 * @see {@link https://docs.amcharts.com/v5/charts/xy-chart/axes/value-axis/#syncing-grid} for more info
	 * @default false
	 * @since 5.16.2
	 */
	syncZeros?: boolean;

	/**
	 * Rescales the axis to fit the values in view as the chart zooms along the
	 * other axis. Works only when that axis is not a plain [[ValueAxis]]: a
	 * [[DateAxis]] or a [[CategoryAxis]], for example.
	 *
	 * @since 5.2.20
	 * @default true
	 */
	autoZoom?: boolean;

}

export interface IValueAxisDataItem extends IAxisDataItem {

	/**
	 * Value of the data item.
	 */
	value?: number;

	/**
	 * End value for axis items that span a range of values, like axis ranges.
	 */
	endValue?: number;

	/**
	 * @ignore
	 */
	labelEndValue?: number;

	/**
	 * Widens the axis scale to include this axis range's `value` and
	 * `endValue`.
	 *
	 * @since 5.1.4
	 */
	affectsMinMax?: boolean;

}

export interface IMinMaxStep {
	min: number;
	max: number;
	step: number;
}

export interface IValueAxisPrivate extends IAxisPrivate {

	/**
	 * Current lowest value of the whole axis scale, not just the part in view.
	 *
	 * @readonly
	 */
	min?: number;

	/**
	 * Current highest value of the whole axis scale, not just the part in
	 * view.
	 *
	 * @readonly
	 */
	max?: number;

	/**
	 * The lowest value of the axis scale once it settles. When the scale
	 * changes, `min` animates towards it.
	 *
	 * @readonly
	 */
	minFinal?: number;

	/**
	 * The highest value of the axis scale once it settles. When the scale
	 * changes, `max` animates towards it.
	 *
	 * @readonly
	 */
	maxFinal?: number;

	/**
	 * Lowest value of the visible (zoomed) part of the axis. Except on a
	 * [[DateAxis]], it is rounded down to the grid step.
	 *
	 * @readonly
	 */
	selectionMin?: number;

	/**
	 * Highest value of the visible (zoomed) part of the axis. Except on a
	 * [[DateAxis]], it is rounded up to the grid step.
	 *
	 * @readonly
	 */
	selectionMax?: number;

	/**
	 * The lowest visible value the axis is zooming to. During a zoom
	 * animation, `selectionMin` holds the value along the way.
	 *
	 * @readonly
	 */
	selectionMinFinal?: number;

	/**
	 * The highest visible value the axis is zooming to. During a zoom
	 * animation, `selectionMax` holds the value along the way.
	 *
	 * @readonly
	 */
	selectionMaxFinal?: number;

	/**
	 * The grid step the axis will have once the zoom animation ends.
	 *
	 * @readonly
	 */
	selectionStepFinal?: number;

	/**
	 * Value step between grid lines.
	 *
	 * @readonly
	 */
	step?: number;

	/**
	 * Decimal places used when formatting axis labels.
	 *
	 * @readonly
	 */
	stepDecimalPlaces?: number;

}

export interface IValueAxisEvents extends IAxisEvents {

}

/**
 * An axis with a numeric scale.
 *
 * @see {@link https://docs.amcharts.com/v5/charts/xy-chart/axes/value-axis/} for more info
 * @important
 */
export class ValueAxis<R extends AxisRenderer> extends Axis<R> {
	public static className: string = "ValueAxis";
	public static classNames: Array<string> = Axis.classNames.concat([ValueAxis.className]);

	declare public _settings: IValueAxisSettings<R>;
	declare public _privateSettings: IValueAxisPrivate;
	declare public _dataItemSettings: IValueAxisDataItem;
	declare public _events: IValueAxisEvents;

	protected _dirtyExtremes: boolean = false;
	protected _dirtySelectionExtremes: boolean = false;
	protected _dseHandled = false;
	protected _logWarned = false;
	protected _deltaMinMax: number = 1;
	public _minReal: number | undefined;
	public _maxReal: number | undefined;

	protected _minRealLog: number | undefined;

	protected _baseValue: number = 0;
	protected _syncDp?: MultiDisposer;
	protected _minLogAdjusted: number = 1;
	/**
	 * @ignore
	 */
	public markDirtyExtremes() {
		this._dirtyExtremes = true;
		this.markDirty();
	}

	/**
	 * @ignore
	 */
	public markDirtySelectionExtremes() {
		this._dirtySelectionExtremes = true;
		this.markDirty();
	}

	public _isSynced(): boolean {
		return this.get("syncWithAxis") != null;
	}

	protected _afterNew() {
		this._settings.themeTags = $utils.mergeTags(this._settings.themeTags, ["axis"]);
		this.setPrivateRaw("name", "value");
		this.addTag("value");
		super._afterNew();
	}

	public _prepareChildren() {
		super._prepareChildren();

		if (this.isDirty("syncWithAxis")) {
			let previousValue = this._prevSettings.syncWithAxis;
			if (previousValue) {
				if (this._syncDp) {
					this._syncDp.dispose();
				}
			}
			let syncWithAxis = this.get("syncWithAxis");
			if (syncWithAxis) {
				// Re-sync whenever any of the source axis's sync inputs change.
				// With autoZoom the sync target is the visible selection; without
				// it the axis holds its full range and only the full extremes
				// need recomputing. Mark dirty (not just a flag) so this axis is
				// queued even when the source publishes after its update pass.
				const resync = () => {
					if (this.get("autoZoom", true)) {
						this.markDirtySelectionExtremes();
					}
					else {
						this.markDirtyExtremes();
					}
				};
				this._syncDp = new MultiDisposer([
					syncWithAxis.onPrivate("selectionMinFinal", resync),
					syncWithAxis.onPrivate("selectionMaxFinal", resync),
					syncWithAxis.onPrivate("selectionStepFinal", resync),
					syncWithAxis.onPrivate("minFinal", resync),
					syncWithAxis.onPrivate("maxFinal", resync),
					// Step can change on its own (e.g. a resize changes
					// gridCount while min/max stay the same)
					syncWithAxis.onPrivate("step", resync)
				])
			}
		}

		// `syncZeros` changes how the synced axis' min/max align (via `_syncAxes`),
		// so re-run both the full and selection extremes when it changes. Set flags
		// directly to avoid re-entering `_prepareChildren` while it is still dirty.
		if (this.isDirty("syncZeros")) {
			this._dirtyExtremes = true;
			this._dirtySelectionExtremes = true;
		}

		let someDirty = false;
		if (this.isDirty("min") || this.isDirty("max") || this.isDirty("maxPrecision") || this.isDirty("numberFormat")) {
			someDirty = true;
			this.ghostLabel?.set("text", "");
		}

		// If a sync recompute only changes the step (e.g. a resize changed
		// gridCount while min/max stayed the same), nothing else marks the
		// range dirty, so track the step explicitly for the render gate below.
		const prevSelectionStepFinal = this.getPrivate("selectionStepFinal");

		//if (this._dirtyExtremes || this.isPrivateDirty("width") || this.isPrivateDirty("height") || this.isDirty("min") || this.isDirty("max") || this.isDirty("extraMin") || this.isDirty("extraMax") || this.isDirty("logarithmic") || this.isDirty("treatZeroAs") || this.isDirty("baseValue") || this.isDirty("strictMinMax") || this.isDirty("maxPrecision")) {
		if (this._sizeDirty || this._dirtyExtremes || this._valuesDirty || someDirty || this.isPrivateDirty("width") || this.isPrivateDirty("height") || this.isDirty("extraMin") || this.isDirty("extraMax") || this.isDirty("logarithmic") || this.isDirty("treatZeroAs") || this.isDirty("baseValue") || this.isDirty("strictMinMax") || this.isDirty("strictMinMaxSelection")) {
			this._getMinMax();
			this._dirtyExtremes = false;
		}

		this._handleSizeDirty();

		if (this._dirtySelectionExtremes && !this._isPanning && this.get("autoZoom", true)) {
			const chart = this.chart;
			let getMM = false;
			// #1563
			if (chart) {
				const letter = this.get("renderer").getPrivate("letter");
				if (letter == "Y") {
					chart.xAxes.each((axis) => {
						if (axis.className != "ValueAxis") {
							getMM = true;
						}
					})
				}
				else if (letter == "X") {
					chart.yAxes.each((axis) => {
						if (axis.className != "ValueAxis") {
							getMM = true;
						}
					})
				}
			}

			if (getMM) {
				this._getSelectionMinMax();
			}
			this._dirtySelectionExtremes = false;
		}

		this._groupData();

		if (this._sizeDirty || this._valuesDirty || this.isDirty("start") || this.isDirty("end") || this.isPrivateDirty("min") || this.isPrivateDirty("selectionMax") || this.isPrivateDirty("selectionMin") || this.isPrivateDirty("max") || this.isPrivateDirty("step") || this.isPrivateDirty("width") || this.isPrivateDirty("height") || this.isDirty("logarithmic") || prevSelectionStepFinal !== this.getPrivate("selectionStepFinal")) {
			this._handleRangeChange();
			this._prepareAxisItems();
			this._updateAxisRanges();
		}

		this._baseValue = this.baseValue();

	}

	protected _handleSizeDirty() {
		if (this._sizeDirty && !this._dseHandled) {
			this._dirtySelectionExtremes = true;
			this._dseHandled = true;

			if (this.getPrivate("selectionMinFinal") != this.getPrivate("selectionMin") || this.getPrivate("selectionMaxFinal") != this.getPrivate("selectionMax")) {
				this._dirtySelectionExtremes = false;
			}
		}
	}

	public _clearDirty(): void {
		super._clearDirty();
		this._dseHandled = false;
	}

	protected _groupData() {

	}

	/**
	 * Logarithmic grid values are computed via `Math.pow(10, ...)`, which
	 * carries floating-point noise (e.g. `4999.999999999999` instead of
	 * `5000`). Round to ~10 significant digits so the grid values (and their
	 * labels) come out clean; a format without a decimal directive (e.g.
	 * `"#,###"`) would otherwise pass the noisy fraction straight through.
	 */
	protected _cleanLogValue(value: number): number {
		if (!(value > 0)) {
			return value;
		}
		const decCount = 10 - Math.floor(Math.log(value) * Math.LOG10E);
		// $math.round computes Math.pow(10, decCount), which overflows to
		// Infinity for extremely small values and would turn the value into
		// NaN. Such values are off scale anyway, so leave them as is.
		if (decCount > 280) {
			return value;
		}
		return $math.round(value, decCount);
	}

	protected _formatText(value: number) {
		const numberFormat = this.get("numberFormat");
		const formatter = this.getNumberFormatter();

		let text = "";

		if (numberFormat) {
			text = formatter.format(value, numberFormat);
		}
		else {
			// On a logarithmic axis every grid label is a different magnitude,
			// and the default number format keeps at most 5 decimals, so a
			// smaller value (e.g. 1e-8) would be rounded away to "0". Give such
			// values a format with just enough decimals to show them in full.
			// Values the default format can show keep the regular path, so
			// their labels stay exactly as before.
			let logDecimals = 0;
			if (this.get("logarithmic") && $type.isNumber(value) && value != 0) {
				logDecimals = Math.min($utils.decimalPlaces(value), 20);
			}

			if (logDecimals > 5) {
				text = formatter.format(value, "#,###." + new Array(logDecimals + 1).join("#"));
			}
			else {
				text = formatter.format(value, undefined, this.getPrivate("stepDecimalPlaces"));
			}
		}
		return text;
	}

	protected _prepareAxisItems() {
		const min = this.getPrivate("min");
		const max = this.getPrivate("max");

		if ($type.isNumber(min) && $type.isNumber(max)) {

			const logarithmic = this.get("logarithmic");
			const step = this.getPrivate("step")!;
			const selectionMin = this.getPrivate("selectionMin")!;
			const selectionMax = this.getPrivate("selectionMax")! + step;

			const gridCount = this.get("renderer").gridCount();

			let value = selectionMin - step;
			let differencePower = 1;
			let minLog: number = min;

			// decades one major grid line jumps, and the power the grid starts at
			let logPowerStep = 1;
			let logStartPower = 0;

			if (logarithmic) {
				value = this._minLogAdjusted;

				if (value < selectionMin) {
					while (value < selectionMin) {
						value += step;
					}
				}

				minLog = value;

				if (minLog <= 0) {
					let minRealLog = this._minRealLog;
					if (!$type.isNumber(minRealLog)) {
						minRealLog = 1;
					}
					minLog = Math.pow(10, Math.log(minRealLog) * Math.LOG10E);

					if (step < 1) {
						if ($type.isNumber(this._minRealLog)) {
							minLog = this._minRealLog;
						}
						else {
							minLog = Math.pow(10, -50);
						}
					}
				}

				differencePower = Math.log(selectionMax - step) * Math.LOG10E - Math.log(minLog) * Math.LOG10E;

				if (differencePower > 2) {
					// Capped at the range itself, or a stride wider than the range
					// would step right over it and leave no grid at all.
					logPowerStep = Math.max(1, Math.min(Math.ceil(differencePower / Math.max(1, gridCount)), Math.floor(differencePower)));
					// Anchor the grid on round powers of ten - 1, 10, 100 - rather
					// than on the axis minimum, which gave labels like 3.01, 30.1, 301.
					logStartPower = Math.floor(Math.log(minLog) * Math.LOG10E / logPowerStep) * logPowerStep;
					value = Math.pow(10, logStartPower);
				}
			}

			/// minor grid
			const renderer = this.get("renderer");
			const minorLabelsEnabled = renderer.get("minorLabelsEnabled");
			const minorGridEnabled = renderer.get("minorGridEnabled", minorLabelsEnabled);

			let stepPower = Math.pow(10, Math.floor(Math.log(Math.abs(step)) * Math.LOG10E));

			const stepAdjusted = Math.round(step / stepPower);

			let minorGridCount = 2;

			if ($math.round(stepAdjusted / 5, 10) % 1 == 0) {
				minorGridCount = 5;
			}

			if ($math.round(stepAdjusted / 10, 10) % 1 == 0) {
				minorGridCount = 10;
			}

			let minorStep = step / minorGridCount;

			// end of minor grid
			let i = 0;
			let m = 0;
			let previous = -Infinity;

			while (value < selectionMax) {
				let dataItem: DataItem<this["_dataItemSettings"]>;
				if (this.dataItems.length < i + 1) {
					dataItem = new DataItem(this, undefined, {});
					this._dataItems.push(dataItem);
					this.processDataItem(dataItem);
				}
				else {
					dataItem = this.dataItems[i];
				}

				this._createAssets(dataItem, []);
				this._toggleDataItem(dataItem, true);

				const itemValue = logarithmic ? this._cleanLogValue(value) : value;
				dataItem.setRaw("value", itemValue);
				const label = dataItem.get("label");
				if (label) {
					label.set("text", this._formatText(itemValue));
				}

				this._prepareDataItem(dataItem);

				let nextValue = value;
				if (!logarithmic) {
					nextValue += step;
				}
				else {
					if (differencePower > 2) {
						nextValue = Math.pow(10, logStartPower + (i + 1) * logPowerStep);
					}
					else {
						nextValue += step;
					}
				}

				// minor grid
				if (minorGridEnabled) {
					let minorValue = value + minorStep;

					if (logarithmic) {
						if (differencePower > 2) {
							let minorMinMaxStep = this._adjustMinMax(value, nextValue, 10);
							minorStep = minorMinMaxStep.step;
						}
						minorValue = value + minorStep;
					}

					while (minorValue < nextValue - step * 0.00000000001) {
						let minorDataItem: DataItem<this["_dataItemSettings"]>;
						if (this.minorDataItems.length < m + 1) {
							minorDataItem = new DataItem(this, undefined, {});
							this.minorDataItems.push(minorDataItem);
							this.processDataItem(minorDataItem);
						}
						else {
							minorDataItem = this.minorDataItems[m];
						}

						this._createAssets(minorDataItem, ["minor"], true);
						this._toggleDataItem(minorDataItem, true);
						const minorItemValue = logarithmic ? this._cleanLogValue(minorValue) : minorValue;
						minorDataItem.setRaw("value", minorItemValue);

						const minorLabel = minorDataItem.get("label");
						if (minorLabel && minorLabelsEnabled) {
							minorLabel.set("text", this._formatText(minorItemValue));
						}

						this._prepareDataItem(minorDataItem);

						// Hide the minor label after `_prepareDataItem`: it calls
						// `toggleVisibility`, which would otherwise re-show the label.
						if (minorLabel && !minorLabelsEnabled) {
							minorLabel.setPrivate("visible", false);
						}
						minorValue += minorStep;
						m++;
					}
				}

				value = nextValue;

				if (previous == value) {
					break;
				}

				let stepPower = Math.pow(10, Math.floor(Math.log(Math.abs(step)) * Math.LOG10E));
				if (stepPower < 1 && !logarithmic) {
					// exponent is less then 1 too. Count decimals of exponent
					let decCount = Math.round(Math.abs(Math.log(Math.abs(stepPower)) * Math.LOG10E)) + 2;
					// round value to avoid floating point issues
					value = $math.round(value, decCount);
				}
				i++;

				// #103520
				if (logarithmic && differencePower <= 2) {
					if (value - step < step) {
						value = step;
					}
				}

				previous = value;
			}

			for (let j = i; j < this.dataItems.length; j++) {
				this._toggleDataItem(this.dataItems[j], false);
			}

			for (let j = m; j < this.minorDataItems.length; j++) {
				this._toggleDataItem(this.minorDataItems[j], false);
			}

			$array.each(this.series, (series) => {
				if (series.inited) {
					series._markDirtyAxes();
				}
			})

			this._updateGhost();
		}
	}


	public _prepareDataItem(dataItem: DataItem<this["_dataItemSettings"]>, count?: number) {
		let renderer = this.get("renderer");
		let value = dataItem.get("value")!;
		let endValue = dataItem.get("endValue");

		let position = this.valueToPosition(value);

		let endPosition = position;
		let fillEndPosition = this.valueToPosition(value + this.getPrivate("step")!);

		if ($type.isNumber(endValue)) {
			endPosition = this.valueToPosition(endValue);
			fillEndPosition = endPosition;
		}

		if (dataItem.get("isRange")) {
			if (endValue == null) {
				fillEndPosition = position;
			}
		}

		let labelEndPosition = endPosition;

		let labelEndValue = dataItem.get("labelEndValue");
		if (labelEndValue != null) {
			labelEndPosition = this.valueToPosition(labelEndValue);
		}

		renderer.updateLabel(dataItem.get("label"), position, labelEndPosition, count);

		const grid = dataItem.get("grid");
		renderer.updateGrid(grid, position, endPosition);
		if (grid) {
			if (value == this.get("baseValue", 0)) {
				grid.addTag("base");
				grid._applyThemes();
			}
			else if (grid.hasTag("base")) {
				grid.removeTag("base");
				grid._applyThemes();
			}
		}

		renderer.updateTick(dataItem.get("tick"), position, labelEndPosition, count);
		renderer.updateFill(dataItem.get("axisFill"), position, fillEndPosition);

		this._processBullet(dataItem);
		renderer.updateBullet(dataItem.get("bullet"), position, endPosition);

		if (!dataItem.get("isRange")) {
			const fillRule = this.get("fillRule");
			if (fillRule) {
				fillRule(dataItem)
			}
		}
	}


	protected _handleRangeChange() {
		let selectionMin: number = this.positionToValue(this.get("start", 0));
		let selectionMax: number = this.positionToValue(this.get("end", 1));

		let step: number;

		if (this._isSynced()) {
			// Honor the bounds/step that _syncAxes already computed; _adjustMinMax
			// would otherwise pick its own gridCount-driven step and silently
			// break the sync.
			selectionMin = this.getPrivate("selectionMinFinal", selectionMin);
			selectionMax = this.getPrivate("selectionMaxFinal", selectionMax);

			const stepFinal = this.getPrivate("selectionStepFinal");
			if ($type.isNumber(stepFinal) && stepFinal > 0 && stepFinal < Infinity) {
				step = stepFinal;
			}
			else {
				// Sync hasn't produced a usable step yet (e.g. first render
				// pass); a fixed or degenerate step here could make
				// _prepareAxisItems generate a near-infinite number of items.
				step = this._adjustMinMax(selectionMin, selectionMax, this.get("renderer").gridCount(), true).step;
			}

			const stepDecimalPlaces = $utils.decimalPlaces(step);
			this.setPrivateRaw("stepDecimalPlaces", stepDecimalPlaces);
		}
		else {
			const gridCount = this.get("renderer").gridCount();
			let minMaxStep: IMinMaxStep = this._adjustMinMax(selectionMin, selectionMax, gridCount, true);

			let stepDecimalPlaces = $utils.decimalPlaces(minMaxStep.step);
			this.setPrivateRaw("stepDecimalPlaces", stepDecimalPlaces);

			selectionMin = $math.round(selectionMin, stepDecimalPlaces);
			selectionMax = $math.round(selectionMax, stepDecimalPlaces);

			minMaxStep = this._adjustMinMax(selectionMin, selectionMax, gridCount, true);

			step = minMaxStep.step;
			selectionMin = minMaxStep.min;
			selectionMax = minMaxStep.max;
		}

		if (this.getPrivate("selectionMin") !== selectionMin || this.getPrivate("selectionMax") !== selectionMax || this.getPrivate("step") !== step) {
			// do not change to setPrivate, will cause SO
			this.setPrivateRaw("selectionMin", selectionMin);
			this.setPrivateRaw("selectionMax", selectionMax);

			this.setPrivateRaw("step", step);
		}
	}

	/**
	 * Converts a position on the axis (`0` to `1`, regardless of zoom) to a
	 * value.
	 *
	 * @param   position  Relative position
	 * @return            Value
	 */
	public positionToValue(position: number): number {
		const min = this.getPrivate("min")!;
		const max = this.getPrivate("max")!;

		if (!this.get("logarithmic")) {
			return position * (max - min) + min;
		}
		else {
			return Math.pow(Math.E, (position * ((Math.log(max) * Math.LOG10E - Math.log(min) * Math.LOG10E)) + Math.log(min) * Math.LOG10E) / Math.LOG10E);
		}
	}

	/**
	 * Converts a value to a position on the axis (`0` to `1`, regardless of
	 * zoom).
	 *
	 * @param   value  Value
	 * @return         Relative position
	 */
	public valueToPosition(value: number): number {

		const min = this.getPrivate("min")!;
		const max = this.getPrivate("max")!;

		if (!this.get("logarithmic")) {
			return (value - min) / (max - min);
		}
		else {
			if (value <= 0) {
				let treatZeroAs = this.get("treatZeroAs");
				if ($type.isNumber(treatZeroAs)) {
					value = treatZeroAs;
				}
			}
			return (Math.log(value) * Math.LOG10E - Math.log(min) * Math.LOG10E) / ((Math.log(max) * Math.LOG10E - Math.log(min) * Math.LOG10E));
		}
	}

	/**
	 * @ignore
	 */
	public valueToFinalPosition(value: number): number {

		const min = this.getPrivate("minFinal")!;
		const max = this.getPrivate("maxFinal")!;

		if (!this.get("logarithmic")) {
			return (value - min) / (max - min);
		}
		else {
			if (value <= 0) {
				let treatZeroAs = this.get("treatZeroAs");
				if ($type.isNumber(treatZeroAs)) {
					value = treatZeroAs;
				}
			}
			return (Math.log(value) * Math.LOG10E - Math.log(min) * Math.LOG10E) / ((Math.log(max) * Math.LOG10E - Math.log(min) * Math.LOG10E));
		}
	}

	/**
	 * Returns the X coordinate in pixels of a value, from the axis's left
	 * edge.
	 *
	 * @param   value     Numeric value
	 * @param   location  Where between `baseValue` (`0`) and `value` (`1`) to measure
	 * @param   baseValue Base value
	 * @return            X coordinate
	 */
	public getX(value: number, location: number, baseValue: number) {
		value = baseValue + (value - baseValue) * location;

		const position = this.valueToPosition(value);
		return this._settings.renderer.positionToCoordinate(position);
	}

	/**
	 * Returns the Y coordinate in pixels of a value, from the axis's top edge.
	 *
	 * @param   value     Numeric value
	 * @param   location  Where between `baseValue` (`0`) and `value` (`1`) to measure
	 * @param   baseValue Base value
	 * @return            Y coordinate
	 */
	public getY(value: number, location: number, baseValue: number) {
		value = baseValue + (value - baseValue) * location;

		const position = this.valueToPosition(value)
		return this._settings.renderer.positionToCoordinate(position);
	}

	/**
	 * @ignore
	 */
	public getDataItemCoordinateX(dataItem: DataItem<IXYSeriesDataItem>, field: string, _cellLocation: number, axisLocation: number): number {
		return this._settings.renderer.positionToCoordinate(this.getDataItemPositionX(dataItem, field, _cellLocation, axisLocation));
	}

	/**
	 * @ignore
	 */
	public getDataItemPositionX(dataItem: DataItem<IXYSeriesDataItem>, field: string, _cellLocation: number, axisLocation: number) {
		let value = dataItem.get(field as any);

		const stackToItem = dataItem.get("stackToItemX");
		if (stackToItem) {
			const series = dataItem.component as XYSeries;
			value = value * axisLocation + series.getStackedXValueWorking(dataItem, field);
		}
		else {
			value = this._baseValue + (value - this._baseValue) * axisLocation;
		}

		return this.valueToPosition(value);
	}

	/**
	 * @ignore
	 */
	public getDataItemCoordinateY(dataItem: DataItem<IXYSeriesDataItem>, field: string, _cellLocation: number, axisLocation: number): number {
		return this._settings.renderer.positionToCoordinate(this.getDataItemPositionY(dataItem, field, _cellLocation, axisLocation));
	}

	/**
	 * @ignore
	 */
	public getDataItemPositionY(dataItem: DataItem<IXYSeriesDataItem>, field: string, _cellLocation: number, axisLocation: number): number {
		let value = dataItem.get(field as any);

		const stackToItem = dataItem.get("stackToItemY");
		if (stackToItem) {
			const series = dataItem.component as XYSeries;
			value = value * axisLocation + series.getStackedYValueWorking(dataItem, field);
		}
		else {
			value = this._baseValue + (value - this._baseValue) * axisLocation;
		}

		return this.valueToPosition(value);
	}

	/**
	 * Returns the position (`0` to `1`) of the axis's base value.
	 *
	 * @return  Base value position
	 */
	public basePosition(): number {
		return this.valueToPosition(this.baseValue());
	}

	/**
	 * Returns the `baseValue` setting, kept within the axis's scale.
	 *
	 * @return Base value
	 */
	public baseValue(): number {
		const min = Math.min(this.getPrivate("minFinal", -Infinity), this.getPrivate("selectionMin", -Infinity));
		const max = Math.max(this.getPrivate("maxFinal", Infinity), this.getPrivate("selectionMax", Infinity));
		let baseValue = this.get("baseValue", 0);

		if (baseValue < min) {
			baseValue = min;
		}

		if (baseValue > max) {
			baseValue = max
		}

		return baseValue;
	}

	/**
	 * @ignore
	 */
	public cellEndValue(value: number): number {
		return value;
	}

	protected fixSmallStep(step: number): number {
		// happens because of floating point error
		if (1 + step === 1) {
			step *= 2;
			return this.fixSmallStep(step);
		}
		return step;
	}

	protected _fixMin(min: number) {
		return min;
	}

	protected _fixMax(max: number) {
		return max;
	}

	public _calculateTotals() {
		if (this.get("calculateTotals")) {
			let series = this.series[0];
			if (series) {
				let startIndex = series.startIndex();

				if (series.dataItems.length > 0) {

					if (startIndex > 0) {
						startIndex--;
					}
					let endIndex = series.endIndex();
					if (endIndex < series.dataItems.length) {
						endIndex++;
					}

					let field: string | undefined;
					let vc: string | undefined;

					if (series.get("yAxis") == this) {
						field = "valueY";
						vc = "vcy";
					}
					else if (series.get("xAxis") == this) {
						field = "valueX";
						vc = "vcx";
					}

					let fieldWorking = field + "Working";

					if (field) {
						let seriesCount = this.series.length;
						let includedSeries: XYSeries[] = [];
						let vcValues: number[] = [];
						for (let s = 0; s < seriesCount; s++) {
							let ser = this.series[s];
							if (!ser.get("excludeFromTotal")) {
								includedSeries.push(ser);
								vcValues.push(ser.get(vc as any));
							}
						}
						let len = includedSeries.length;

						let fieldTotal = (field + "Total") as any;
						let fieldSum = (field + "Sum") as any;
						let fieldTotalPercent = (field + "TotalPercent") as any;

						for (let i = startIndex; i < endIndex; i++) {
							let sum = 0;
							let total = 0;

							for (let s = 0; s < len; s++) {
								let dataItem = includedSeries[s].dataItems[i];
								if (dataItem) {
									let value = dataItem.get(fieldWorking as any) * vcValues[s];
									if (!$type.isNaN(value)) {
										sum += value;
										total += Math.abs(value);
									}
								}
							}

							for (let s = 0; s < len; s++) {
								let dataItem = includedSeries[s].dataItems[i];
								if (dataItem) {
									let value = dataItem.get(fieldWorking as any) * vcValues[s];
									if (!$type.isNaN(value)) {
										dataItem.set(fieldTotal, total);
										dataItem.set(fieldSum, sum);
										dataItem.set(fieldTotalPercent, total == 0 ? 0 : value / total * 100);
									}
								}
							}
						}
					}
				}
			}
		}
	}

	protected _getSelectionMinMax() {
		const min = this.getPrivate("minFinal");
		const max = this.getPrivate("maxFinal");

		const minDefined = this.get("min");
		const maxDefined = this.get("max");

		let extraMin = this.get("extraMin", 0);
		let extraMax = this.get("extraMax", 0);

		if (this.get("logarithmic")) {
			if (this.get("extraMin") == null) {
				extraMin = 0.1;
			}
			if (this.get("extraMax") == null) {
				extraMax = 0.2;
			}
		}

		const gridCount = this.get("renderer").gridCount();
		const selectionStrictMinMax = this.get("strictMinMaxSelection");
		let strictMinMax = this.get("strictMinMax");

		if ($type.isNumber(min) && $type.isNumber(max)) {
			let selectionMin = max;
			let selectionMax = min;

			$array.each(this.series, (series) => {
				if (!series.get("ignoreMinMax")) {
					let seriesMin: number | undefined;
					let seriesMax: number | undefined;
					const outOfSelection = series.getPrivate("outOfSelection");

					if (series.get("xAxis") === this) {
						if (!outOfSelection) {
							let minX = series.getPrivate("minX");
							let maxX = series.getPrivate("maxX");

							// solves #90085
							if (series.startIndex() != 0 || series.endIndex() != series.dataItems.length) {
								minX = undefined;
								maxX = undefined;
							}

							seriesMin = series.getPrivate("selectionMinX", minX);
							seriesMax = series.getPrivate("selectionMaxX", maxX);
						}
					}
					else if (series.get("yAxis") === this) {
						if (!outOfSelection) {

							let minY = series.getPrivate("minY");
							let maxY = series.getPrivate("maxY");

							// solves #90085
							if (series.startIndex() != 0 || series.endIndex() != series.dataItems.length) {
								minY = undefined;
								maxY = undefined;
							}

							seriesMin = series.getPrivate("selectionMinY", minY);
							seriesMax = series.getPrivate("selectionMaxY", maxY);
						}
					}

					if (!series.isHidden() && !series.isShowing()) {
						if ($type.isNumber(seriesMin)) {
							selectionMin = Math.min(selectionMin, seriesMin);
						}

						if ($type.isNumber(seriesMax)) {
							selectionMax = Math.max(selectionMax, seriesMax);
						}
					}
				}
			})

			this.axisRanges.each((range) => {
				if (range.get("affectsMinMax")) {
					let value = range.get("value");
					if (value != null) {
						selectionMin = Math.min(selectionMin, value);
						selectionMax = Math.max(selectionMax, value);
					}
					value = range.get("endValue");
					if (value != null) {
						selectionMin = Math.min(selectionMin, value);
						selectionMax = Math.max(selectionMax, value);
					}
				}
			})

			if (selectionMin > selectionMax) {
				[selectionMin, selectionMax] = [selectionMax, selectionMin]
			}

			if ($type.isNumber(minDefined)) {
				if (strictMinMax) {
					selectionMin = minDefined;
				}
				else {
					selectionMin = min;
				}
			}
			else if (strictMinMax) {
				if ($type.isNumber(this._minReal)) {
					selectionMin = this._minReal;
				}
			}

			if ($type.isNumber(maxDefined)) {
				if (strictMinMax) {
					selectionMax = maxDefined;
				}
				else {
					selectionMax = max;
				}
			}
			else if (strictMinMax) {
				if ($type.isNumber(this._maxReal)) {
					selectionMax = this._maxReal;
				}
			}

			if (selectionMin === selectionMax) {
				let smin = selectionMin;
				selectionMin -= this._deltaMinMax;
				selectionMax += this._deltaMinMax;

				if (selectionMin < min) {
					let d = smin - min;
					if (d == 0) {
						d = this._deltaMinMax;
					}

					selectionMin = smin - d;
					selectionMax = smin + d;

					strictMinMax = true;
				}

				let minMaxStep2 = this._adjustMinMax(selectionMin, selectionMax, gridCount, strictMinMax);
				selectionMin = minMaxStep2.min;
				selectionMax = minMaxStep2.max;
			}

			let selectionMinReal = selectionMin;
			let selectionMaxReal = selectionMax;

			let delta = selectionMax - selectionMin;

			selectionMin -= delta * extraMin;
			selectionMax += delta * extraMax;

			let minMaxStep: IMinMaxStep = this._adjustMinMax(selectionMin, selectionMax, gridCount);

			selectionMin = minMaxStep.min;
			selectionMax = minMaxStep.max;

			selectionMin = $math.fitToRange(selectionMin, min, max);
			selectionMax = $math.fitToRange(selectionMax, min, max);

			// do it for the second time !important
			minMaxStep = this._adjustMinMax(selectionMin, selectionMax, gridCount, true);

			if (!strictMinMax) {
				selectionMin = minMaxStep.min;
				selectionMax = minMaxStep.max;
			}

			const syncWithAxis = this.get("syncWithAxis");
			if (syncWithAxis) {
				minMaxStep = this._syncAxes(selectionMin, selectionMax, minMaxStep.step, syncWithAxis.getPrivate("selectionMinFinal", syncWithAxis.getPrivate("minFinal", 0)), syncWithAxis.getPrivate("selectionMaxFinal", syncWithAxis.getPrivate("maxFinal", 1)), syncWithAxis.getPrivate("selectionStepFinal", syncWithAxis.getPrivate("step", 1)));

				selectionMin = minMaxStep.min;
				selectionMax = minMaxStep.max;
			}

			if (strictMinMax && !syncWithAxis) {
				if ($type.isNumber(minDefined)) {
					selectionMin = Math.max(selectionMin, minDefined);
				}

				if ($type.isNumber(maxDefined)) {
					selectionMax = Math.min(selectionMax, maxDefined);
				}
			}

			if (selectionStrictMinMax && !syncWithAxis) {
				selectionMin = selectionMinReal - (selectionMaxReal - selectionMinReal) * extraMin;
				selectionMax = selectionMaxReal + (selectionMaxReal - selectionMinReal) * extraMax;
			}

			if (strictMinMax && !syncWithAxis) {
				if ($type.isNumber(minDefined)) {
					selectionMin = minDefined;
				}
				else {
					selectionMin = selectionMinReal;
				}

				if ($type.isNumber(maxDefined)) {
					selectionMax = maxDefined;
				}
				else {
					selectionMax = selectionMaxReal;
				}

				if (selectionMax - selectionMin <= 0.00000001) {
					selectionMin -= this._deltaMinMax;
					selectionMax += this._deltaMinMax;
				}

				let delta = selectionMax - selectionMin;

				selectionMin -= delta * extraMin;
				selectionMax += delta * extraMax;
			}

			if (this.get("logarithmic")) {

				if (selectionMin <= 0) {
					selectionMin = selectionMinReal * (1 - Math.min(extraMin, 0.99));
				}

				if (selectionMin < min) {
					selectionMin = min;
				}
				if (selectionMax > max) {
					selectionMax = max;
				}
			}

			let len = Math.min(20, Math.ceil(Math.log(this.getPrivate("maxZoomFactor", 100) + 1) / Math.LN10) + 2);

			let start = $math.round(this.valueToFinalPosition(selectionMin), len);
			let end = $math.round(this.valueToFinalPosition(selectionMax), len);

			this.setPrivateRaw("selectionMinFinal", selectionMin);
			this.setPrivateRaw("selectionMaxFinal", selectionMax);
			this.setPrivateRaw("selectionStepFinal", minMaxStep.step);

			this.zoom(start, end);
		}
	}


	protected _getMinMax() {
		let minDefined = this.get("min");
		let maxDefined = this.get("max");

		let min = Infinity;
		let max = -Infinity;

		let extraMin = this.get("extraMin", 0);
		let extraMax = this.get("extraMax", 0);

		if (this.get("logarithmic")) {
			if (!this.get("strictMinMax")) {
				if (this.get("extraMin") == null) {
					extraMin = 0.1;
				}
				if (this.get("extraMax") == null) {
					extraMax = 0.2;
				}
			}
		}

		let minDiff = Infinity;

		$array.each(this.series, (series) => {
			if (!series.get("ignoreMinMax")) {
				let seriesMin: number | undefined;
				let seriesMax: number | undefined;
				if (series.get("xAxis") === this) {
					seriesMin = series.getPrivate("minX");
					seriesMax = series.getPrivate("maxX");
				}
				else if (series.get("yAxis") === this) {
					seriesMin = series.getPrivate("minY");
					seriesMax = series.getPrivate("maxY");
				}

				if ($type.isNumber(seriesMin) && $type.isNumber(seriesMax)) {
					min = Math.min(min, seriesMin);
					max = Math.max(max, seriesMax);

					let diff = seriesMax - seriesMin;

					if (diff <= 0) {
						diff = Math.abs(seriesMax / 100);
					}

					if (diff < minDiff) {
						minDiff = diff;
					}
				}
			}
		})

		this.axisRanges.each((range) => {
			if (range.get("affectsMinMax")) {
				let value = range.get("value");
				if (value != null) {
					min = Math.min(min, value);
					max = Math.max(max, value);
				}
				value = range.get("endValue");
				if (value != null) {
					min = Math.min(min, value);
					max = Math.max(max, value);
				}
			}
		})

		if (this.get("logarithmic")) {
			let treatZeroAs = this.get("treatZeroAs");
			if ($type.isNumber(treatZeroAs)) {
				if (min <= 0) {
					min = treatZeroAs;
				}
			}
			// Once per axis, so a redraw doesn't flood the console
			if (min <= 0 && !this._logWarned) {
				this._logWarned = true;
				console.warn("ValueAxis: a logarithmic axis can not show values <= 0. Set `treatZeroAs` to show them.");
			}
		}

		if (min === 0 && max === 0) {
			max = 0.9;
			min = -0.9;
		}

		if ($type.isNumber(minDefined)) {
			min = minDefined;
		}
		if ($type.isNumber(maxDefined)) {
			max = maxDefined;
		}

		// meaning no min/max found on series/ranges and no min/max was defined
		if (min === Infinity || max === -Infinity) {
			this.setPrivate("minFinal", undefined);
			this.setPrivate("maxFinal", undefined);
			return;
		}

		if (min > max) {
			[min, max] = [max, min];
		}

		const initialMin = min;
		const initialMax = max;

		// adapter
		let minAdapted = this.adapters.fold("min", min);
		let maxAdapted = this.adapters.fold("max", max);

		this._minRealLog = min;

		if ($type.isNumber(minAdapted)) {
			min = minAdapted;
		}

		if ($type.isNumber(maxAdapted)) {
			max = maxAdapted;
		}

		// DateAxis does some magic here
		min = this._fixMin(min);
		max = this._fixMax(max);

		// this happens if starLocation and endLocation are 0.5 and DateAxis has only one date
		if (max - min <= 1 / Math.pow(10, 15)) {
			if (max - min !== 0) {
				this._deltaMinMax = (max - min) / 2;
			}
			else {
				this._getDelta(max);
			}

			min -= this._deltaMinMax;
			max += this._deltaMinMax;
		}

		// add extras
		min -= (max - min) * extraMin;
		max += (max - min) * extraMax;

		if (this.get("logarithmic")) {
			// don't let min go below 0 if real min is >= 0
			if (min < 0 && initialMin >= 0) {
				min = 0;
			}
			// don't let max go above 0 if real max is <= 0
			if (max > 0 && initialMax <= 0) {
				max = 0;
			}
		}

		this._minReal = min;
		this._maxReal = max;

		let strictMinMax = this.get("strictMinMax");
		let strictMinMaxSelection = this.get("strictMinMaxSelection", false);
		if (strictMinMaxSelection) {
			strictMinMax = strictMinMaxSelection;
		}

		let strict = strictMinMax;
		if ($type.isNumber(maxDefined)) {
			strict = true;
		}

		let gridCount = this.get("renderer").gridCount();

		let minMaxStep: IMinMaxStep = this._adjustMinMax(min, max, gridCount, strict);

		min = minMaxStep.min;
		max = minMaxStep.max;

		// do it for the second time with strict true (importat!)
		minMaxStep = this._adjustMinMax(min, max, gridCount, true);

		min = minMaxStep.min;
		max = minMaxStep.max;

		// return min max if strict
		if (strictMinMax) {
			if ($type.isNumber(minDefined)) {
				min = minDefined;
			}
			else {
				min = this._minReal;
			}

			if ($type.isNumber(maxDefined)) {
				max = maxDefined;
			}
			else {
				max = this._maxReal;
			}

			if (max - min <= 0.00000001) {
				min -= this._deltaMinMax;
				max += this._deltaMinMax;
			}

			let delta = max - min;
			min -= delta * extraMin;
			max += delta * extraMax;
		}

		minAdapted = this.adapters.fold("min", min);
		maxAdapted = this.adapters.fold("max", max);

		if ($type.isNumber(minAdapted)) {
			min = minAdapted;
		}

		if ($type.isNumber(maxAdapted)) {
			max = maxAdapted;
		}

		if (minDiff == Infinity) {
			minDiff = (max - min)
		}

		// this is to avoid floating point number error
		let decCount = Math.round(Math.abs(Math.log(Math.abs(max - min)) * Math.LOG10E)) + 5;

		min = $math.round(min, decCount);
		max = $math.round(max, decCount);



		const syncWithAxis = this.get("syncWithAxis");
		if (syncWithAxis) {
			minMaxStep = this._syncAxes(min, max, minMaxStep.step, syncWithAxis.getPrivate("minFinal", syncWithAxis.getPrivate("min", 0)), syncWithAxis.getPrivate("maxFinal", syncWithAxis.getPrivate("max", 1)), syncWithAxis.getPrivate("step", 1));
			min = minMaxStep.min;
			max = minMaxStep.max;

			// Without autoZoom the axis holds its full range, so the synced
			// full range is also its selection. Publish it so that
			// _handleRangeChange renders the synced step and so that axes
			// synced to this one get notified. With autoZoom the selection is
			// computed in _getSelectionMinMax instead.
			if (!this.get("autoZoom", true)) {
				this.setPrivateRaw("selectionMinFinal", min);
				this.setPrivateRaw("selectionMaxFinal", max);
				this.setPrivateRaw("selectionStepFinal", minMaxStep.step);
			}
		}


		this.setPrivateRaw("maxZoomFactor", Math.max(1, Math.ceil((max - min) / minDiff * this.get("maxZoomFactor", 100))));
		this._fixZoomFactor();

		if (this.get("logarithmic")) {
			this._minLogAdjusted = min;
			min = this._minReal;
			max = this._maxReal;

			if (min <= 0) {
				min = initialMin * (1 - Math.min(extraMin, 0.99));
			}
		}



		if ($type.isNumber(min) && $type.isNumber(max)) {
			if (this.getPrivate("minFinal") !== min || this.getPrivate("maxFinal") !== max) {

				this.setPrivate("minFinal", min);
				this.setPrivate("maxFinal", max);
				this._saveMinMax(min, max);

				const duration = this.get("interpolationDuration", 0);
				const easing = this.get("interpolationEasing");

				this.animatePrivate({ key: "min", to: min, duration, easing });
				this.animatePrivate({ key: "max", to: max, duration, easing });
			}
		}
	}

	protected _fixZoomFactor() {
	}

	protected _getDelta(max: number) {
		// the number by which we need to raise 10 to get difference
		let exponent: number = Math.log(Math.abs(max)) * Math.LOG10E;

		// here we find a number which is power of 10 and has the same count of numbers as difference has
		let power = Math.pow(10, Math.floor(exponent));

		// reduce this number by 10 times
		power = power / 10;

		this._deltaMinMax = power;
	}

	protected _saveMinMax(_min: number, _max: number) {

	}


	protected _adjustMinMax(min: number, max: number, gridCount: number, strictMode?: boolean): IMinMaxStep {
		// will fail if 0
		if (gridCount <= 1) {
			gridCount = 1;
		}

		gridCount = Math.round(gridCount);

		let initialMin: number = min;
		let initialMax: number = max;

		let difference = max - min;

		// in case min and max is the same, use max
		if (difference === 0) {
			difference = Math.abs(max);
		}

		// the number by which we need to raise 10 to get difference
		let exponent: number = Math.log(Math.abs(difference)) * Math.LOG10E;

		// here we find a number which is power of 10 and has the same count of numbers as difference has
		let power = Math.pow(10, Math.floor(exponent));

		// reduce this number by 10 times
		power = power / 10;

		let extra: number = power;
		if (strictMode) {
			extra = 0;
		}

		// round down min
		if (strictMode) {
			min = Math.floor(min / power) * power;
			// round up max
			max = Math.ceil(max / power) * power;
		}
		else {
			min = Math.ceil(min / power) * power - extra;
			// round up max
			max = Math.floor(max / power) * power + extra;
		}

		// don't let min go below 0 if real min is >= 0
		if (min < 0 && initialMin >= 0) {
			min = 0;
		}
		// don't let max go above 0 if real max is <= 0
		if (max > 0 && initialMax <= 0) {
			max = 0;
		}

		exponent = Math.log(Math.abs(difference)) * Math.LOG10E;
		power = Math.pow(10, Math.floor(exponent));
		power = power / 100; // used to be 10 in v4, but this caused issue that there could be limited number of grids with even very small minGridDistance

		// approximate difference between two grid lines
		let step = Math.ceil((difference / gridCount) / power) * power;
		let stepPower = Math.pow(10, Math.floor(Math.log(Math.abs(step)) * Math.LOG10E));

		// the step should divide by  2, 5, and 10.
		let stepDivisor: number = Math.ceil(step / stepPower); // number 0 - 10


		if (stepDivisor > 5) {
			stepDivisor = 10;
		}
		else if (stepDivisor <= 5 && stepDivisor > 2) {
			stepDivisor = 5;
		}

		// now get real step
		step = Math.ceil(step / (stepPower * stepDivisor)) * stepPower * stepDivisor;


		let maxPrecision = this.get("maxPrecision");
		if ($type.isNumber(maxPrecision)) {

			let ceiledStep = $math.ceil(step, maxPrecision);
			if (maxPrecision < Number.MAX_VALUE && step !== ceiledStep) {
				step = ceiledStep;
				if (step == 0) {
					step = 1;
				}
			}
		}

		let decCount: number = 0;
		// in case numbers are smaller than 1
		if (stepPower < 1) {
			// exponent is less then 1 too. Count decimals of exponent
			decCount = Math.round(Math.abs(Math.log(Math.abs(stepPower)) * Math.LOG10E)) + 1;
			// round step
			step = $math.round(step, decCount);
		}

		// final min and max
		let minCount = Math.floor(min / step);

		min = $math.round(step * minCount, decCount);

		let maxCount: number;

		if (!strictMode) {
			maxCount = Math.ceil(max / step);
		}
		else {
			maxCount = Math.floor(max / step);
		}

		if (maxCount === minCount) {
			maxCount++;
		}

		max = $math.round(step * maxCount, decCount);

		if (max < initialMax) {
			max = max + step;
		}

		if (min > initialMin) {
			min = min - step;
		}


		step = this.fixSmallStep(step);

		return { min: min, max: max, step: step };
	}

	/**
	 * Returns the text the axis tooltip shows at a position.
	 *
	 * @param   position  Position on the axis (`0` to `1`)
	 * @return            Tooltip text
	 */
	public getTooltipText(position: number, _adjustPosition?: boolean): string | undefined {
		const numberFormat = this.get("tooltipNumberFormat", this.get("numberFormat"));
		const formatter = this.getNumberFormatter();
		const extraDecimals = this.get("extraTooltipPrecision", 0);
		const decimals = this.getPrivate("stepDecimalPlaces", 0) + extraDecimals;
		const value = $math.round(this.positionToValue(position), decimals);

		if (numberFormat) {
			return formatter.format(value, numberFormat);
		}
		else {
			return formatter.format(value, undefined, decimals);
		}
	}

	/**
	 * Returns the series data item whose value is closest to a position on
	 * the axis.
	 *
	 * @param   series    Series
	 * @param   position  Position on the axis (`0` to `1`)
	 * @return            Data item
	 */
	public getSeriesItem(series: XYSeries, position: number): DataItem<IXYSeriesDataItem> | undefined {
		let fieldName = <any>(this.getPrivate("name")! + this.get("renderer").getPrivate("letter")!);
		let value = this.positionToValue(position);

		let index: number | undefined = undefined;
		let oldDiff: number;
		$array.each(series.dataItems, (dataItem, i) => {
			const diff = Math.abs(dataItem.get(fieldName) - value);
			if (index === undefined || diff < oldDiff) {
				index = i;
				oldDiff = diff;
			}
		});

		if (index != null) {
			return series.dataItems[index];
		}
	}

	/**
	 * Zooms the axis to the range between two values.
	 *
	 * @param  start     Start value
	 * @param  end       End value
	 * @param  duration  Animation duration in milliseconds
	 */
	public zoomToValues(start: number, end: number, duration?: number) {
		const min = this.getPrivate("minFinal", this.getPrivate("min", 0));
		const max = this.getPrivate("maxFinal", this.getPrivate("max", 1));

		if (this.getPrivate("min") != null && this.getPrivate("max") != null) {
			this.zoom((start - min) / (max - min), (end - min) / (max - min), duration);
		}
	}


	/**
	 * Syncs with a target axis.
	 *
	 * @param  min  Min
	 * @param  max  Max
	 * @param  step Step
	 */
	protected _syncAxes(min: number, max: number, step: number, syncMin: number, syncMax: number, syncStep: number) {
		let axis = this.get("syncWithAxis");
		if (axis) {
			let targetCount = Math.round((syncMax - syncMin) / syncStep);
			if ($type.isNumber(targetCount) && targetCount > 0 && targetCount < Infinity) {

				if (this.get("syncZeros") && syncMin <= 0 && syncMax >= 0) {
					// Count intervals below/above zero on source axis
					let belowCount = Math.round((0 - syncMin) / syncStep);
					let aboveCount = targetCount - belowCount;

					// The source has no room on a side this axis has data on - it
					// stops at zero where this one does not. Aligning anyway sets that
					// side of the range to zero, putting the data outside the axis,
					// where it is silently not drawn. Only the source can make the
					// room (give it `extraMin`/`extraMax`), so keep this axis's own
					// bounds instead: the zero lines will not line up, but nothing
					// disappears.
					const needsBelow = min < 0 && belowCount == 0;
					const needsAbove = max > 0 && aboveCount == 0;

					if (!needsBelow && !needsAbove) {
						// Find the smallest nice step that covers this axis's
						// data on both sides with the same below/above split
						let rawStep = 0;
						if (belowCount > 0 && min < 0) {
							rawStep = Math.abs(min) / belowCount;
						}
						if (aboveCount > 0 && max > 0) {
							rawStep = Math.max(rawStep, max / aboveCount);
						}

						// Fallback: if one side has no data but has intervals
						if (rawStep == 0) {
							rawStep = (max - min) / targetCount;
						}

						// A degenerate range would produce a zero/NaN step; keep
						// the axis's own min/max/step in that case
						if (rawStep > 0 && rawStep < Infinity) {
							step = this._niceStep(rawStep);
							min = -step * belowCount;
							max = step * aboveCount;
						}
					}
				}
				else {
					// Regular grid count sync (no zero alignment)
					let rawStep = (max - min) / targetCount;

					// A degenerate range would produce a zero/NaN step; keep
					// the axis's own min/max/step in that case
					if (rawStep > 0 && rawStep < Infinity) {
						step = this._niceStep(rawStep);

						// Snap min/max to step boundaries ensuring data coverage
						let newMin = Math.floor(min / step) * step;
						let newMax = newMin + step * targetCount;

						// Ensure max covers the data
						if (newMax < max) {
							newMin = Math.ceil(max / step) * step - step * targetCount;
							newMax = newMin + step * targetCount;
						}

						// Preserve zero boundaries
						if (min >= 0 && newMin < 0) {
							newMin = 0;
							newMax = step * targetCount;
						}
						if (max <= 0 && newMax > 0) {
							newMax = 0;
							newMin = -(step * targetCount);
						}

						min = newMin;
						max = newMax;
					}
				}
			}
		}

		return { min: min, max: max, step: step };
	}

	/**
	 * Rounds a raw step value up to the nearest "nice" number
	 * (1, 2, 5, 10, 20, 50, etc.), respecting maxPrecision.
	 */
	protected _niceStep(rawStep: number): number {
		// A zero/NaN/negative step would stall axis item generation downstream,
		// so never let one through
		if (!$type.isNumber(rawStep) || rawStep <= 0 || rawStep == Infinity) {
			return 1;
		}

		let stepPower = Math.pow(10, Math.floor(Math.log(Math.abs(rawStep)) * Math.LOG10E));
		let normalized = rawStep / stepPower;

		if (normalized <= 1) normalized = 1;
		else if (normalized <= 2) normalized = 2;
		else if (normalized <= 5) normalized = 5;
		else normalized = 10;

		let step = normalized * stepPower;

		// stepPower can underflow to 0 for extremely small raw steps
		if (!(step > 0 && step < Infinity)) {
			step = rawStep;
		}

		let maxPrecision = this.get("maxPrecision");
		if ($type.isNumber(maxPrecision)) {
			let ceiledStep = $math.ceil(step, maxPrecision);
			if (maxPrecision < Number.MAX_VALUE && step !== ceiledStep) {
				step = ceiledStep;
				if (step == 0) {
					step = 1;
				}
			}
		}

		return step;
	}

	/**
	 * Returns the distance between two grid lines as a share of the visible
	 * part of the axis.
	 *
	 * @return Distance (`0` to `1`)
	 */
	public getCellWidthPosition(): number {
		let max = this.getPrivate("selectionMax", this.getPrivate("max"));
		let min = this.getPrivate("selectionMin", this.getPrivate("min"));

		if ($type.isNumber(max) && $type.isNumber(min)) {
			return this.getPrivate("step", 1) / (max - min);
		}
		return 0.05;
	}

	/**
	 * @ignore
	 */
	public nextPosition(count?: number) {
		if (count == null) {
			count = 1;
		}

		if (this.get("renderer").getPrivate("letter") == "Y") {
			count *= -1;
		}

		let value = this.positionToValue(this.getPrivate("tooltipPosition", 0));
		value += this.getPrivate("step", 1) * count;
		value = $math.fitToRange(value, this.getPrivate("selectionMin", 0), this.getPrivate("selectionMax", 1));

		return this.toGlobalPosition(this.valueToPosition(value));
	}
}

import { Chart, IChartSettings, IChartPrivate, IChartEvents } from "./Chart";
import { Container } from "../../core/render/Container";
import { ListAutoDispose } from "../../core/util/List";
import { p100 } from "../../core/util/Percent";

import type { ColorSet } from "../../core/util/ColorSet";
import type { PatternSet } from "../../core/util/PatternSet";
import type { Series } from "./Series";

import { setSummaryDescription, renderDataTable, IDataTableColumn } from "./Series";

import * as $array from "../../core/util/Array";

export interface ISerialChartSettings extends IChartSettings {

	/**
	 * The [[ColorSet]] series take their colors from.
	 *
	 * @see {@link https://docs.amcharts.com/v5/charts/xy-chart/series/#series-colors} for more info
	 */
	colors?: ColorSet;

	/**
	 * The [[PatternSet]] series take their patterns from.
	 *
	 * @see {@link https://docs.amcharts.com/v5/concepts/colors-gradients-and-patterns/patterns/#pattern-sets} for more info
	 * @since 5.10.0
	 */
	patterns?: PatternSet;

	/**
	 * Describes the chart's data to screen readers: for each series, how many
	 * values it has, its highest and lowest, and where the data has an order
	 * (XY series) its first and last. Each series' summary also goes to its
	 * legend item.
	 *
	 * The chart has to be `focusable` for screen readers to read it. A series
	 * with `ariaSummary: false` is left out.
	 *
	 * @since 5.24.0
	 * @see {@link https://docs.amcharts.com/v5/concepts/accessibility/#data-summary} for more info
	 */
	ariaSummary?: boolean;

	/**
	 * Gives screen readers the chart's data as a table, hidden from view: a
	 * row for each category or date, a column for each series. Screen readers
	 * can move through it by row and column. It is captioned with the chart's
	 * `ariaLabel`.
	 *
	 * With grouped data (a date axis with `groupData`), the table has the
	 * groups shown when the chart is zoomed out all the way, whatever the
	 * zoom. A series with `ariaDataTable: false` is left out.
	 *
	 * @since 5.24.0
	 * @see {@link https://docs.amcharts.com/v5/concepts/accessibility/#data-table} for more info
	 */
	ariaDataTable?: boolean;

}

export interface ISerialChartPrivate extends IChartPrivate {
}

export interface ISerialChartEvents extends IChartEvents {
}

/**
 * A base class for all series-based charts.
 */
export abstract class SerialChart extends Chart {
	public static className: string = "SerialChart";
	public static classNames: Array<string> = Chart.classNames.concat([SerialChart.className]);

	declare public _settings: ISerialChartSettings;
	declare public _privateSettings: ISerialChartPrivate;
	declare public _seriesType: Series;
	declare public _events: ISerialChartEvents;

	/**
	 * The [[Container]] the chart's series are drawn in.
	 *
	 * @default Container.new()
	 */
	public readonly seriesContainer: Container = Container.new(this._root, { width: p100, height: p100, isMeasured: false });

	/**
	 * The chart's series: push a series here to add it to the chart. A series
	 * removed from the list is disposed.
	 */
	public readonly series: ListAutoDispose<this["_seriesType"]> = new ListAutoDispose();

	protected _afterNew() {
		super._afterNew();

		this._disposers.push(this.series);

		const children = this.seriesContainer.children;

		this._disposers.push(this.series.events.onAll((change) => {
			if (change.type === "clear") {
				$array.each(change.oldValues, (series) => {
					this._removeSeries(series);
				})
				const colors = this.get("colors");
				if (colors) {
					colors.reset();
				}

				const patterns = this.get("patterns");
				if (patterns) {
					patterns.reset();
				}

			} else if (change.type === "push") {
				children.moveValue(change.newValue);
				this._processSeries(change.newValue);
			} else if (change.type === "setIndex") {
				children.setIndex(change.index, change.newValue);
				this._processSeries(change.newValue);
			} else if (change.type === "insertIndex") {
				children.insertIndex(change.index, change.newValue);
				this._processSeries(change.newValue);
			} else if (change.type === "removeIndex") {
				this._removeSeries(change.oldValue);
			} else if (change.type === "moveIndex") {
				children.moveValue(change.value, change.newIndex);
				this._processSeries(change.value);
			} else if (change.type === "swap") {
				const a = change.a;
				const b = change.b;
				const aIndex = this.series.indexOf(a);
				const bIndex = this.series.indexOf(b);
				children.moveValue(a, bIndex);
				children.moveValue(b, aIndex);

				this.series.each((series) => {
					this._processSeries(series);
					series.markDirtyValues();
				})
			} else {
				throw new Error("Unknown IListEvent type");
			}
		}));
	}

	protected _processSeries(series: this["_seriesType"]) {
		series.chart = this;
		series._placeBulletsContainer(this);
		series._scheduleSummary();
	}

	protected _removeSeries(series: this["_seriesType"]) {
		series._handleRemoved();
		if (!series.isDisposed()) {
			this.seriesContainer.children.removeValue(series);
			series._removeBulletsContainer();
		}
		this._updateSummary();
		this._updateDataTable();
	}

	public _prepareChildren() {
		super._prepareChildren();

		if (this.isDirty("ariaSummary") || this.isDirty("ariaDataTable")) {
			this.series.each((series) => {
				series._scheduleSummary();
			});
			this._updateSummary();
			this._updateDataTable();
		}

		if (this.isDirty("ariaLabel") && this._dataTable) {
			this._updateDataTable();
		}
	}

	protected _dataTable: HTMLTableElement | undefined;

	/**
	 * Builds the chart's data table from its series' columns, or takes it away.
	 *
	 * @ignore
	 */
	public _updateDataTable(): void {
		const columns: Array<IDataTableColumn> = [];
		if (this.get("ariaDataTable") && !this.isDisposed()) {
			this.series.each((series, index) => {
				const items = series._tableItems;
				if (items && !series.isDisposed()) {
					columns.push({ name: "" + (series.get("name") || this._t("Series") + " " + (index + 1)), items: items });
				}
			});
		}
		this._dataTable = renderDataTable(this, this._dataTable, columns);
	}

	protected _dispose() {
		renderDataTable(this, this._dataTable, []);
		super._dispose();
	}

	/**
	 * Puts the series' summaries together as the chart's `ariaDescription`.
	 *
	 * @ignore
	 */
	public _updateSummary(): void {
		if (this.isDisposed()) {
			return;
		}
		const texts: Array<string> = [];
		if (this.get("ariaSummary")) {
			this.series.each((series) => {
				const text = series._summaryText;
				if (text && !series.isDisposed()) {
					const name = series.get("name");
					texts.push(name ? name + ". " + text : text);
				}
			});
		}
		setSummaryDescription(this, texts.join(" "));
	}
}

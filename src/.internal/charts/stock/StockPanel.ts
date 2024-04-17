import type { PanelControls } from "./PanelControls";
import type { StockChart } from "./StockChart"
import type { XYSeries } from "../xy/series/XYSeries";
import type { Rectangle } from "../../core/render/Rectangle";

import { XYChart, IXYChartPrivate, IXYChartSettings, IXYChartEvents } from "../xy/XYChart";
import { ListAutoDispose } from "../../core/util/List";

import * as $array from "../../core/util/Array";

export interface IStockPanelSettings extends IXYChartSettings {
}

export interface IStockPanelPrivate extends IXYChartPrivate {

	/**
	 * A target [[StockChart]].
	 */
	stockChart: StockChart;

}

export interface IStockPanelEvents extends IXYChartEvents {
	/**
	 * Kicks in when panels is moved up or down.
	 * 
	 * @since 5.9.2
	 */
	moved: {
		oldIndex: number;
		newIndex: number;
	};

	/**
	 * Kicks in when panel is closed (removed).
	 *
	 * @since 5.9.2
	 */
	closed: {};

	/**
	 * Kicks in when panel is expanded.
	 *
	 * @since 5.9.2
	 */
	expanded: {};

	/**
	 * Kicks in when panel is collapsed (returns to normal size).
	 *
	 * @since 5.9.2
	 */
	collapsed: {};
}

/**
 * A panel instance for the [[StockChart]].
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/stock/panels/} for more info
 * @important
 */
export class StockPanel extends XYChart {
	public static className: string = "StockPanel";
	public static classNames: Array<string> = XYChart.classNames.concat([StockPanel.className]);

	declare public _settings: IStockPanelSettings;
	declare public _privateSettings: IStockPanelPrivate;
	declare public _events: IStockPanelEvents;

	/**
	 * An instance of [[PanelControls]].
	 */
	public panelControls!: PanelControls;

	/**
	 * Panel resize grip element.
	 *
	 * @since 5.4.7
	 */
	public panelResizer?: Rectangle;

	/**
	 * A list of drawings on panel.
	 *
	 */
	public readonly drawings: ListAutoDispose<XYSeries> = new ListAutoDispose();

	protected _afterNew() {
		super._afterNew();

		this._disposers.push(this.drawings.events.onAll((change) => {
			if (change.type === "clear") {
				$array.each(change.oldValues, (series) => {
					this.series.removeValue(series);
				})
			} else if (change.type === "push") {
				this.series.push(change.newValue);
			} else if (change.type === "setIndex") {
				this.series.setIndex(change.index, change.newValue);
			} else if (change.type === "insertIndex") {
				this.series.insertIndex(change.index, change.newValue);
			} else if (change.type === "removeIndex") {
				this.series.removeIndex(change.index);
			} else {
				throw new Error("Unknown IListEvent type");
			}
		}));
	}

	/**
	 * Moves panel up.
	 */
	public moveUp(): void {
		const stockChart = this.getPrivate("stockChart");
		const children = stockChart.panelsContainer.children;

		const index = children.indexOf(this);
		if (index > 0) {
			children.moveValue(this, index - 1);
			const type = "moved";
			if (this.events.isEnabled(type)) {
				this.events.dispatch(type, {
					type: type,
					oldIndex: index,
					newIndex: index - 1,
					target: this
				});
			}
		}

		stockChart._updateControls();
	}

	/**
	 * Moves panel down.
	 */
	public moveDown(): void {
		const stockChart = this.getPrivate("stockChart");
		const children = stockChart.panelsContainer.children;

		const index = children.indexOf(this);
		if (index < children.length - 1) {
			children.moveValue(this, index + 1);
			const type = "moved";
			if (this.events.isEnabled(type)) {
				this.events.dispatch(type, {
					type: type,
					oldIndex: index,
					newIndex: index + 1,
					target: this
				});
			}
		}
		stockChart._updateControls();
	}

	/**
	 * Closes panel.
	 */
	public close(): void {
		const stockChart = this.getPrivate("stockChart");
		const type = "closed";
		if (this.events.isEnabled(type)) {
			this.events.dispatch(type, {
				type: type,
				target: this
			});
		}
		stockChart.panels.removeValue(this);
		stockChart._updateControls();
	}

	/**
	 * Toggles "full screen" mode of the panel on and off.
	 */
	public expand(): void {
		const stockChart = this.getPrivate("stockChart");

		const panels: Array<StockPanel> = [];
		stockChart.panels.each((panel) => {
			if (!panel.isVisible()) {
				panels.push(panel);
			}
		})

		$array.each(panels, (panel) => {
			panel.setPrivate("visible", true);
		});

		if (panels.length == 0) {
			stockChart.panels.each((panel) => {
				if (panel != this) {
					panel.setPrivate("visible", false);
				}
			});
			const type = "expanded";
			if (this.events.isEnabled(type)) {
				this.events.dispatch(type, {
					type: type,
					target: this
				});
			}
		}
		else {
			const type = "collapsed";
			if (this.events.isEnabled(type)) {
				this.events.dispatch(type, {
					type: type,
					target: this
				});
			}
		}

		stockChart._updateControls();

		if (panels.length == 0) {
			const panelControls = this.panelControls;
			panelControls.upButton.setPrivate("visible", false);
			panelControls.downButton.setPrivate("visible", false);
			panelControls.closeButton.setPrivate("visible", false);
		}
	}
}

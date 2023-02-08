import { StockControl, IStockControlSettings, IStockControlPrivate, IStockControlEvents } from "./StockControl";
import { StockIcons } from "./StockIcons";

export interface IResetControlSettings extends IStockControlSettings {
}

export interface IResetControlPrivate extends IStockControlPrivate {
}

export interface IResetControlEvents extends IStockControlEvents {
}

/**
 * Reset control.
 *
 * Removes all drawings and indicators when clicked.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/stock/toolbar/reset-control/} for more info
 */
export class ResetControl extends StockControl {
	public static className: string = "ResetControl";
	public static classNames: Array<string> = StockControl.classNames.concat([ResetControl.className]);

	declare public _settings: IResetControlSettings;
	declare public _privateSettings: IResetControlPrivate;
	declare public _events: IResetControlEvents;

	protected _afterNew() {
		super._afterNew();

		this.events.on("click", () => {
			const stockChart = this.get("stockChart");
			stockChart.panels.each((panel) => {
				panel.drawings.each((drawing) => {
					drawing.data.clear();
				});
			});

			stockChart.indicators.clear();
		});
	}

	protected _getDefaultIcon(): SVGElement {
		return StockIcons.getIcon("Reset");
	}

}
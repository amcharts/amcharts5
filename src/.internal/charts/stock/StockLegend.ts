import type { DataItem } from "../../core/render/Component";
import type { StockChart } from "./StockChart";
import type { StockPanel } from "./StockPanel";

import { Legend, ILegendPrivate, ILegendSettings, ILegendEvents, ILegendDataItem } from "../../core/render/Legend";
import { Button } from "../../core/render/Button";
import { Graphics } from "../../core/render/Graphics";
import { Template } from "../../core/util/Template";
import { ListTemplate } from "../../core/util/List";
import { Indicator } from "./indicators/Indicator";

import * as $utils from "../../core/util/Utils";

export interface IStockLegendDataItem extends ILegendDataItem {

	/**
	 * The item's close [[Button]]. Compared series and indicators drawn over
	 * the main series show it, so the user can remove them.
	 */
	closeButton: Button;

	/**
	 * The item's settings [[Button]], which opens the settings modal for the
	 * indicator or series.
	 */
	settingsButton: Button;

	/**
	 * The [[StockPanel]] the item belongs to.
	 */
	panel: StockPanel;

}


export interface IStockLegendSettings extends ILegendSettings {

	/**
	 * The [[StockChart]] the legend belongs to.
	 */
	stockChart: StockChart;

}

export interface IStockLegendPrivate extends ILegendPrivate {
}

export interface IStockLegendEvents extends ILegendEvents {
}

/**
 * A legend for a [[StockChart]] panel, with settings and close buttons on its
 * items.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/stock/#Legend} for more info
 * @important
 */
export class StockLegend extends Legend {

	public static className: string = "StockLegend";
	public static classNames: Array<string> = Legend.classNames.concat([StockLegend.className]);

	declare public _settings: IStockLegendSettings;
	declare public _privateSettings: IStockLegendPrivate;
	declare public _events: IStockLegendEvents;
	declare public _dataItemSettings: IStockLegendDataItem;

	protected _afterNew() {
		this._settings.themeTags = $utils.mergeTags(this._settings.themeTags, ["stocklegend"]);
		super._afterNew();
	}


	/**
	 * @ignore
	 */
	public makeCloseButton(): Button {
		const button = this.closeButtons.make();
		this.closeButtons.push(button);
		return button;
	}

	/**
	 * The items' close buttons. Settings on `closeButtons.template` apply to
	 * all of them.
	 */
	public readonly closeButtons: ListTemplate<Button> = this.addDisposer(new ListTemplate(
		Template.new({}),
		() => Button._new(this._root, {
			themeTags: $utils.mergeTags(this.closeButtons.template.get("themeTags", []), ["control", "close"]),
			icon: Graphics.new(this._root, {
				themeTags: ["icon", "button"]
			})
		}, [this.closeButtons.template])
	));


	/**
	 * @ignore
	 */
	public makeSettingsButton(): Button {
		const button = this.settingsButtons.make();
		this.settingsButtons.push(button);

		button.events.on("click", () => {

			const dataItem = button.dataItem as DataItem<IStockLegendDataItem>;

			if (dataItem) {
				const stockChart = this.get("stockChart");
				if (stockChart) {
					const indicator = button.getPrivate("customData");
					if (indicator instanceof Indicator) {
						stockChart.getPrivate("settingsModal").openIndicator(indicator);
					}
					else {
						stockChart.getPrivate("settingsModal").openSeries(dataItem.dataContext as any);
					}
				}
			}

			setTimeout(() => {
				button.unhover();
			}, 50)
		})

		return button;
	}

	/**
	 * The items' settings buttons. Settings on `settingsButtons.template`
	 * apply to all of them.
	 */
	public readonly settingsButtons: ListTemplate<Button> = this.addDisposer(new ListTemplate(
		Template.new({}),
		() => Button._new(this._root, {
			themeTags: $utils.mergeTags(this.settingsButtons.template.get("themeTags", []), ["control", "settings"]),
			icon: Graphics.new(this._root, {
				themeTags: ["icon", "button"]
			})
		}, [this.settingsButtons.template])
	));


	protected processDataItem(dataItem: DataItem<this["_dataItemSettings"]>) {
		super.processDataItem(dataItem);

		const itemContainer = dataItem.get("itemContainer");

		const settingsButton = this.makeSettingsButton();
		itemContainer.children.push(settingsButton);
		settingsButton._setDataItem(dataItem);
		dataItem.set("settingsButton", settingsButton);

		const closeButton = this.makeCloseButton();
		itemContainer.children.push(closeButton);
		closeButton._setDataItem(dataItem);
		dataItem.set("closeButton", closeButton);
	}
}

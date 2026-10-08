import type { IDropdownListItem } from "./DropdownList";

import { ValueAxis } from "../../xy/axes/ValueAxis";
import { DropdownListControl, IDropdownListControlSettings, IDropdownListControlPrivate, IDropdownListControlEvents } from "./DropdownListControl";
import { StockIcons } from "./StockIcons";
import { DataSaveControl } from "./DataSaveControl";
import * as $array from "../../../core/util/Array";

export interface ISettingsControlItem extends IDropdownListItem {
}

export interface ISettingsControlSettings extends IDropdownListControlSettings {
	/**
	 * Saves the chart's drawings and indicators to the browser's local storage
	 * whenever they change, and restores them on the next load. Needs an
	 * [[IndicatorControl]] or a [[DrawingControl]] on the chart.
	 *
	 * @default false
	 *
	 * @since 5.4.3
	 */
	autoSave?: boolean;

	/**
	 * Key for the data in local storage. If not set, the page URL plus the ID
	 * of the chart's container element is used.
	 *
	 * @since 5.4.3
	 */
	storageId?: string;
}

export interface ISettingsControlPrivate extends IDropdownListControlPrivate {
	dataSaveControl?: DataSaveControl;
}

export interface ISettingsControlEvents extends IDropdownListControlEvents {
}

/**
 * A settings dropdown for a [[StockChart]]: X axis fills, the Y axis scale
 * (regular, percent or logarithmic) and auto-saving of drawings and
 * indicators.
 */
export class SettingsControl extends DropdownListControl {
	public static className: string = "SettingsControl";
	public static classNames: Array<string> = DropdownListControl.classNames.concat([SettingsControl.className]);

	declare public _settings: ISettingsControlSettings;
	declare public _privateSettings: ISettingsControlPrivate;
	declare public _events: ISettingsControlEvents;

	protected _afterNew() {
		super._afterNew();

		const dropdown = this.getPrivate("dropdown")!;
		dropdown.events.on("changed", (ev) => {
			const stockChart = this.get("stockChart");
			const stockSeries = stockChart.get("stockSeries");
			if (stockSeries) {
				if (ev.item.id == "y-scale") {
					if (ev.item.value == "percent") {
						stockChart.setPercentScale(true);
						this._setLogarithmic(false);
					}
					else {
						stockChart.setPercentScale(false);
						this._setLogarithmic(ev.item.value == "logarithmic");
					}
				}
				else if (ev.item.id == "fills") {
					this._setFills((<any>ev).checked)
				}
			}

			if (ev.item.id == "autosave") {
				const autoSave = (<any>ev).checked;
				let dataSaveControl = this.getPrivate("dataSaveControl")!;
				dataSaveControl.set("autoSave", autoSave);
			}

		});

		this.on("active", () => {
			this._populateInputs();
		});

		this._disposers.push(this.root.events.on("frameended", () => {
			const stockChart = this.get("stockChart");
			const serializableTools = (stockChart.getControl("IndicatorControl") || stockChart.getControl("DrawingControl")) ? true : false;
			let dataSaveControl = stockChart.getControl("DataSaveControl");

			if (!serializableTools) {
				const exclude: any = dropdown.get("exclude", []);
				exclude.push("save");
				exclude.push("autosave");
				dropdown.set("exclude", ["save", "autosave"]);
			}
			else {
				if (!dataSaveControl) {
					dataSaveControl = DataSaveControl.new(this.root, {
						stockChart: stockChart,
						autoSave: this.get("autoSave", false),
						storageId: this.get("storageId")
					});
				}
				this.setPrivate("dataSaveControl", dataSaveControl as DataSaveControl);
				this.set("autoSave", (dataSaveControl as DataSaveControl).get("autoSave"));
				this._populateInputs();
			}
		}));

	}

	protected _getDefaultIcon(): SVGElement {
		return StockIcons.getIcon("Settings");
	}

	protected _populateInputs(): void {

		// Axes-related stuff
		const button = this.getPrivate("button")!;
		const inputs = button.getElementsByTagName("input");
		const currentScale = this._getYScale();
		for (let i = 0; i < inputs.length; i++) {
			const input = inputs[i];
			switch (input.id) {
				case "am5stock-list-autosave":
					input.checked = this.get("autoSave", this.getPrivate("dataSaveControl")!.get("autoSave", false));
					break;
				case "am5stock-list-fills":
					input.checked = this._getFillEnabled()
					break;
				case "am5stock-list-y-scale-percent":
				case "am5stock-list-y-scale-regular":
				case "am5stock-list-y-scale-logarithmic":
					input.checked = input.value == currentScale;
					break;
			}
		}

	}

	protected _getFillEnabled(): boolean {
		const stockChart = this.get("stockChart");
		const stockSeries = stockChart.get("stockSeries");
		if (stockSeries) {
			const xAxis = stockSeries.get("xAxis");
			const fills = xAxis.get("renderer").axisFills.values;
			return (fills.length > 0) && fills[0].get("visible", false);
		}
		return false;
	}

	protected _getYScale(): "percent" | "regular" | "logarithmic" {
		const stockChart = this.get("stockChart");
		const stockSeries = stockChart.get("stockSeries");
		if (stockSeries) {
			const yAxis = stockSeries.get("yAxis");
			if (yAxis instanceof ValueAxis) {
				if (stockSeries.get("valueYShow") == "valueYChangeSelectionPercent") {
					return "percent";
				}
				if (yAxis.get("logarithmic")) {
					return "logarithmic";
				}
			}
		}
		return "regular";
	}

	protected _setLogarithmic(value: boolean): void {
		const stockChart = this.get("stockChart");
		const stockSeries = stockChart.get("stockSeries");
		if (stockSeries) {
			const yAxis = stockSeries.get("yAxis");
			if (yAxis instanceof ValueAxis) {

				$array.each(yAxis.series, (series) => {
					series.resetExtremes();
					series.markDirtyValues();
				})

				yAxis.set("logarithmic", value);
			}
		}
	}

	protected _setFills(enabled: boolean): void {
		const stockChart = this.get("stockChart");
		stockChart.panels.each((panel) => {
			panel.xAxes.each((xAxis) => {
				xAxis.get("renderer").axisFills.template.set("visible", enabled);
				xAxis.get("renderer").grid.template.set("forceHidden", enabled);
			})
		});
	}

}
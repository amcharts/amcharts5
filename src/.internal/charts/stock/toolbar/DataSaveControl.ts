import type { IDropdownListItem } from "./DropdownList";

import { DropdownListControl, IDropdownListControlSettings, IDropdownListControlPrivate, IDropdownListControlEvents } from "./DropdownListControl";
import { DrawingControl } from "./DrawingControl";
import { IndicatorControl } from "./IndicatorControl";
import { StockIcons } from "./StockIcons";

import * as $array from "../../../core/util/Array";

export interface IDataSaveControlItem extends IDropdownListItem {
}

export interface IDataSaveControlSettings extends IDropdownListControlSettings {
	/**
	 * If set to `true`, all changes to chart's drawings and indicators will be
	 * automatically saved to browser local storage and restored on next load.
	 *
	 * @default false
	 */
	autoSave?: boolean;

	/**
	 * A unique indentifier for local storage.
	 *
	 * Will try to use chart's container ID if not set.
	 *
	 * Consider setting it if you have multipl [[StockChart]] on the same page.
	 */
	storageId?: string;
}

export interface IDataSaveControlPrivate extends IDropdownListControlPrivate {
	drawingControl?: DrawingControl;
	indicatorControl?: IndicatorControl;
	storageId?: string;
}

export interface IDataSaveControlEvents extends IDropdownListControlEvents {

	/**
	 * Invoked when drawing/indicator data is serialized and saved to local
	 * storage.
	 */
	saved: {
		drawings: string;
		indicators: string;
	};

	/**
	 * Invoked when drawing/indicator data is loaded from local storage and
	 * restored on chart.
	 */
	restored: {
		drawings: string;
		indicators: string;
	};

	/**
	 * Invoked when local storage is cleared.
	 */
	cleared: {};

}

/**
 * A control that can be used to serialize indicators and drawings, save them
 * to local storage, and restore as needed.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/stock/toolbar/data-save-control/} for more info
 * @since 5.7.0
 */
export class DataSaveControl extends DropdownListControl {
	public static className: string = "DataSaveControl";
	public static classNames: Array<string> = DropdownListControl.classNames.concat([DataSaveControl.className]);

	declare public _settings: IDataSaveControlSettings;
	declare public _privateSettings: IDataSaveControlPrivate;
	declare public _events: IDataSaveControlEvents;

	protected _afterNew() {
		super._afterNew();

		this.setPrivate("storageId", window.location.href + "-" + this.root.dom.id);

		const stockChart = this.get("stockChart");
		const dropdown = this.getPrivate("dropdown")!;

		// Load local storage
		if (localStorage && localStorage.getItem(this._getStorageId("autosave")) == "1") {
			this.root.events.once("frameended", () => {
				this.restoreData();
				this.set("autoSave", true);
			});
		}

		dropdown.events.on("changed", (ev) => {
			if (ev.item.id == "autosave") {
				const autoSave = !ev.item.checked;
				this.set("autoSave", autoSave);
				if (autoSave) {
					this.saveData();
				}
			}
		});

		dropdown.events.on("invoked", (ev) => {
			if (ev.item.id == "save") {
				this.saveData();
			}
			else if (ev.item.id == "restore") {
				this.restoreData();
			}
			else if (ev.item.id == "clear") {
				this.clearData();
			}

		});

		this.on("active", () => {
			this._populateInputs();
		});

		stockChart.events.on("drawingsupdated", (_ev) => {
			if (this.get("autoSave")) {
				this.saveData();
			}
		});

		stockChart.events.on("indicatorsupdated", (_ev) => {
			if (this.get("autoSave")) {
				this.saveData();
			}
		});

	}

	public _beforeChanged() {
		super._beforeChanged();

		if (this.isDirty("autoSave") && localStorage) {
			const autoSave = this.get("autoSave", false);
			if (autoSave) {
				localStorage.setItem(this._getStorageId("autosave"), "1");
				//this.saveData();
			}
			else {
				localStorage.removeItem(this._getStorageId("autosave"));
				//this.clearData();
			}
			this._populateInputs();
		}
	}

	public saveData(): void {
		if (localStorage) {
			const drawingControl = this._getDrawingControl();
			const indicatorControl = this._getIndicatorControl();
			const drawings = drawingControl.serializeDrawings("string", "  ") as string;
			const indicators = indicatorControl.serializeIndicators("string", "  ") as string;
			if (drawings == "[]") {
				localStorage.removeItem(this._getStorageId("drawings"));
			}
			else {
				localStorage.setItem(this._getStorageId("drawings"), drawings);
			}
			if (indicators == "[]") {
				localStorage.removeItem(this._getStorageId("indicators"));
			}
			else {
				localStorage.setItem(this._getStorageId("indicators"), indicators);
			}
			this.events.dispatch("saved", {
				target: this,
				type: "saved",
				drawings: drawings,
				indicators: indicators
			});
		}
	}

	public restoreData(): void {
		if (localStorage) {
			const stockChart = this.get("stockChart");
			stockChart.panels.each((panel) => {
				panel.drawings.each((drawing) => {
					drawing.data.clear();
				});
			});

			stockChart.indicators.clear();

			const drawingControl = this._getDrawingControl();
			const indicatorControl = this._getIndicatorControl();
			const drawings = localStorage.getItem(this._getStorageId("drawings")) || "[]";
			const indicators = localStorage.getItem(this._getStorageId("indicators")) || "[]";

			drawingControl.unserializeDrawings(drawings);
			indicatorControl.unserializeIndicators(indicators);
			this.events.dispatch("restored", {
				target: this,
				type: "restored",
				drawings: drawings,
				indicators: indicators
			});
		}
	}

	public clearData(): void {
		if (localStorage) {
			localStorage.removeItem(this._getStorageId("drawings"));
			localStorage.removeItem(this._getStorageId("indicators"));
			this.events.dispatch("cleared", {
				target: this,
				type: "cleared"
			});
		}
	}

	protected _getDefaultIcon(): SVGElement {
		return StockIcons.getIcon("Save");
	}

	protected _populateInputs(): void {
		const dropdown = this.getPrivate("dropdown")!;
		const items = dropdown.get("items", []);
		const autoSave = this.get("autoSave", false);
		const isSavedData = localStorage && (localStorage.getItem(this._getStorageId("drawings")) !== null || localStorage.getItem(this._getStorageId("indicators")) !== null);
		$array.each(items, (item) => {
			if (!localStorage) {
				item.disabled = true;
			}
			else if (item.id == "restore") {
				item.disabled = autoSave || !isSavedData;
			}
			else if (item.id == "clear") {
				item.disabled = !isSavedData;
			}
			else if (item.id == "save") {
				item.disabled = autoSave;
			}
			else if (item.id == "autosave") {
				item.checked = autoSave;
			}
		})
		dropdown.rebuildList();
	}

	protected _getStorageId(bucket: string): string {
		return "am5-stock-" + this.get("storageId", this.getPrivate("storageId", "")) + "-" + bucket;
	}

	protected _getDrawingControl(): DrawingControl {

		let drawingControl: DrawingControl | undefined = this.getPrivate("drawingControl");
		if (drawingControl) {
			return drawingControl;
		}

		const stockChart = this.get("stockChart");
		drawingControl = stockChart.getControl("DrawingControl") as DrawingControl;
		if (!drawingControl) {
			drawingControl = DrawingControl.new(this.root, {
				stockChart: stockChart
			});
			this.setPrivate("drawingControl", drawingControl);
		}
		return drawingControl;
	}

	protected _getIndicatorControl(): IndicatorControl {

		let indicatorControl: IndicatorControl | undefined = this.getPrivate("indicatorControl");
		if (indicatorControl) {
			return indicatorControl;
		}

		const stockChart = this.get("stockChart");
		indicatorControl = stockChart.getControl("IndicatorControl") as IndicatorControl;
		if (!indicatorControl) {
			indicatorControl = IndicatorControl.new(this.root, {
				stockChart: stockChart
			});
			this.setPrivate("indicatorControl", indicatorControl);
		}
		return indicatorControl;
	}

}
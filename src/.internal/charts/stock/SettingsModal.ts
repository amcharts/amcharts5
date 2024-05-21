import type { Indicator, IIndicatorEditableSetting } from "./indicators/Indicator";
import type { StockChart } from "./StockChart";
import type { XYSeries } from "../xy/series/XYSeries";

import { CandlestickSeries } from "../xy/series/CandlestickSeries";
import { LineSeries } from "../xy/series/LineSeries";
import { Modal, IModalSettings, IModalPrivate, IModalEvents } from "../../core/util/Modal";
import { ColorControl } from "./toolbar/ColorControl";

import * as $array from "../../core/util/Array";
import * as $object from "../../core/util/Object";
import * as $utils from "../../core/util/Utils";
import * as $type from "../../core/util/Type";


export interface ISettingsModalSettings extends IModalSettings {

	/**
	 * A target [[StockChart]].
	 */
	stockChart: StockChart;

	/**
	 * Show the "Reset to default" link?
	 *
	 * @default true
	 * @since 5.9.0
	 */
	showResetLink?: boolean;

}

export interface ISettingsModalPrivate extends IModalPrivate {
}

export interface ISettingsModalEvents extends IModalEvents {

	/**
	 * Invoked when modal is closed/saved.
	 */
	done: {
		settings?: any,
		settingsTarget?: Indicator | XYSeries
	}

}

/**
 * @ignore
 */
interface ISeriesEditableSetting extends IIndicatorEditableSetting {
	id?: string;
	target?: any;
	additionalKeys?: string[];
	currentValue?: any;
	invalidateTarget?: XYSeries;
}

/**
 * Used to display a modal dialog with HTML content.
 */
export class SettingsModal extends Modal {
	public static className: string = "SettingsModal";
	public static classNames: Array<string> = Modal.classNames.concat([Modal.className]);

	declare public _settings: ISettingsModalSettings;
	declare public _privateSettings: ISettingsModalPrivate;
	declare public _events: ISettingsModalEvents;

	protected _updatedSettings: { [index: string]: any } = {};
	protected _settingsTarget?: Indicator | XYSeries;
	protected _colorControl?: ColorControl;

	protected _afterNew() {
		super._afterNew();
	}

	public _beforeChanged() {
		super._beforeChanged();

		// if (this.isDirty("content")) {
		// 	this.getPrivate("content").innerHTML = this.get("content", "");
		// }
	}

	/**
	 * Opens settings modal for an [[Indicator]].
	 * 
	 * @param  target  Target indicator
	 */
	public openIndicator(target: Indicator): void {
		this._settingsTarget = target;
		this.initContent(target._editableSettings, target);
	}

	/**
	 * Opens settings editing for the any [[XYSeries]].
	 * 
	 * @param  series  target series
	 */
	public openSeries(series: XYSeries): void {
		this._settingsTarget = series;

		const l = this._root.language;
		const stockChart = this.get("stockChart");
		const isline = series instanceof LineSeries;

		let settings: ISeriesEditableSetting[] = [];

		if (series == stockChart.get("stockSeries") && !isline) {
			settings.push({
				id: "stockPositiveColor",
				key: "stockPositiveColor",
				name: l.translateAny("Increase"),
				type: "color",
				currentValue: stockChart.get("stockPositiveColor", this._root.interfaceColors.get("positive")),
				target: stockChart
			});

			settings.push({
				id: "stockNegativeColor",
				key: "stockNegativeColor",
				name: l.translateAny("Decrease"),
				type: "color",
				currentValue: stockChart.get("stockNegativeColor", this._root.interfaceColors.get("negative")),
				target: stockChart
			});
		}
		else if (series == stockChart.get("volumeSeries") && !isline) {
			settings.push({
				id: "volumePositiveColor",
				key: "volumePositiveColor",
				name: l.translateAny("Increase"),
				type: "color",
				currentValue: stockChart.get("volumePositiveColor", this._root.interfaceColors.get("positive")),
				target: stockChart
			});

			settings.push({
				id: "volumeNegativeColor",
				key: "volumeNegativeColor",
				name: l.translateAny("Decrease"),
				type: "color",
				currentValue: stockChart.get("volumeNegativeColor", this._root.interfaceColors.get("negative")),
				target: stockChart
			});
		}
		else if (series instanceof CandlestickSeries && series.columns.length) {
			const column = series.columns.getIndex(0);
			settings.push({
				id: "riseFromOpen.fill",
				key: "fill",
				additionalKeys: ["stroke"],
				name: l.translateAny("Increase"),
				type: "color",
				currentValue: column!.states.lookup("riseFromOpen")!.get("fill"),
				target: series.columns.template.states.create("riseFromOpen", {}),
				invalidateTarget: series
			});

			settings.push({
				id: "dropFromOpen.fill",
				key: "fill",
				additionalKeys: ["stroke"],
				name: l.translateAny("Decrease"),
				type: "color",
				currentValue: column!.states.lookup("dropFromOpen")!.get("fill"),
				target: series.columns.template.states.create("dropFromOpen", {}),
				invalidateTarget: series
			});
		}
		else if (isline) {
			settings = [{
				key: "stroke",
				name: l.translateAny("Line"),
				type: "color",
				additionalKeys: ["fill"],
				target: (<LineSeries>series),
			}, {
				key: "strokeWidth",
				name: l.translateAny("Line"),
				type: "dropdown",
				options: [
					{ value: 1, text: "1px" },
					{ value: 2, text: "2px" },
					{ value: 4, text: "4px" },
					{ value: 10, text: "10px" }
				],
				currentValue: (<LineSeries>series).strokes.template.get("strokeWidth", 1),
				target: (<LineSeries>series).strokes.template,
				invalidateTarget: series
			}];
			if ((<LineSeries>series).fills.template.get("visible")) {
				settings.push({
					key: "fill",
					name: l.translateAny("Fill"),
					type: "color"
				});
			}
		}
		else {
			settings = [{
				key: "stroke",
				name: l.translateAny("Line"),
				type: "color"
			}, {
				key: "fill",
				name: l.translateAny("Fill"),
				type: "color"
			}];
		}
		this.initContent(settings, series);
	}

	private initContent(settings: ISeriesEditableSetting[], target: any) {
		this._updatedSettings = {};
		const content = this.getPrivate("content");

		// Clear
		this.clear();

		// Title
		const title = document.createElement("h1");
		title.innerHTML = target.get("name");
		content.appendChild(title);

		// Add fields
		const table = document.createElement("div");
		table.className = "am5-modal-table";
		content.appendChild(table);

		// Log defaults
		let populateDefaults = false;
		let defaults: any = {};
		if (!target.get("userData")) {
			target.set("userData", {});
		}
		if (!target.get("userData")["__defaults"]) {
			target.get("userData")["__defaults"] = defaults;
			populateDefaults = true;
		}
		else {
			defaults = target.get("userData")["__defaults"];
		}

		const settingInputs: { [index: string]: HTMLInputElement | HTMLSelectElement } = {};
		const controls: { [index: string]: ColorControl } = {};
		const settingsWithTarget: { [index: string]: any } = {};
		let prevName = "";
		let prevLine: HTMLDivElement;
		$array.each(settings, (setting) => {
			const key = this._getSettingKey(setting);
			const keyTarget = setting.target || target;
			const currentValue = setting.currentValue || keyTarget.get(setting.key);

			if (populateDefaults) {
				defaults[key] = currentValue;
			}

			if (setting.target) {
				settingsWithTarget[key] = setting;
			}

			let element: HTMLElement | undefined;
			switch (setting.type) {
				case "dropdown":
					element = this.getDropdown(setting, currentValue);
					settingInputs[key] = <HTMLSelectElement>element;
					this._disposers.push($utils.addEventListener(element, "change", (ev: any) => {
						const input: HTMLSelectElement = ev.target!;
						const option = input.options[input!.selectedIndex];
						const extTarget = option.getAttribute("data-target");
						if (extTarget) {
							settingInputs[extTarget].value = option.getAttribute("data-target-value") + "";
							settingInputs[extTarget].setAttribute("data-min-value", option.getAttribute("data-target-min-value") + "");
						}
					}));
					break;
				case "number":
					element = this.getNumber(setting, currentValue);
					settingInputs[key] = <HTMLInputElement>element;
					if (setting.minValue !== undefined) {
						element.setAttribute("data-min-value", setting.minValue + "");
						this._disposers.push($utils.addEventListener(element, "change", (ev: any) => {
							const input: HTMLInputElement = ev.target!;
							const minValue = Number(input.getAttribute("data-min-value"));
							const value = Number(input.value);
							if (value < minValue) {
								input.value = minValue + "";
							}
						}));
					}
					break;
				case "color":
					const control = this.getColor(setting, currentValue);
					element = control.getPrivate("button")!;
					controls[key] = control;
					break;
				case "checkbox":
					element = this.getCheckbox(setting, currentValue);
					settingInputs[key] = <HTMLInputElement>element;
					break;
				// case "text":
				// 	element = this.getText(setting, currentValue);
				// 	break;
			}

			if (element) {

				let line: HTMLDivElement;
				if (setting.name == prevName && prevLine) {
					line = prevLine;
				}
				else {
					line = document.createElement("div");
					line.className = "am5-modal-table-row";
					table.appendChild(line);

					const heading = document.createElement("div");
					heading.className = "am5-modal-table-heading";
					heading.innerHTML = setting.name;
					line.appendChild(heading);
				}

				const cell = document.createElement("div");
				cell.className = "am5-modal-table-cell";
				line.appendChild(cell);
				cell.appendChild(element);

				prevName = setting.name;
				prevLine = line;
			}
		});

		// Reset
		if (this.get("showResetLink", true)) {
			const resetLink = document.createElement("a");
			resetLink.className = "am5-modal-link am5-modal-table-cell am5-modal-link-reset";
			resetLink.innerHTML = this._root.language.translateAny("Reset to default");
			table.appendChild(resetLink);

			this._disposers.push($utils.addEventListener(resetLink, "click", () => {
				const defaults = target.get("userData")["__defaults"];
				$object.each(settingInputs, (key, element) => {
					if (element.type === "checkbox") {
						(element as HTMLInputElement).checked = defaults[key];
					}
					else {
						element.value = defaults[key];
					}
				});
				$object.each(controls, (key, control) => {
					control.setColor(defaults[key]);
				});
			}));
		}

		// Buttons
		const saveButton = document.createElement("input");
		saveButton.type = "button";
		saveButton.value = this._root.language.translateAny("Save");
		saveButton.className = "am5-modal-button am5-modal-primary";
		content.appendChild(saveButton);

		this._disposers.push($utils.addEventListener(saveButton, "click", () => {
			$object.each(settingInputs, (key, element) => {
				if (element.type == "checkbox") {
					this._updatedSettings[key] = (<HTMLInputElement>element).checked;
				}
				else if (element.type == "number") {
					this._updatedSettings[key] = $type.toNumber(element.value);
				}
				else {
					this._updatedSettings[key] = element.value;
				}
			});
			$object.each(this._updatedSettings, (key, value) => {
				const targetKey = (<string>key).split(".").pop();
				if ($type.isObject(value) && value.value) {
					if (value.setting && value.setting.target) {
						value.setting.target.set(targetKey, value.value);
						if (value.setting.additionalKeys) {
							$array.each(value.setting.additionalKeys, (additionalKey) => {
								value.setting.target.set(additionalKey, value.value);
							});
						}
					}
					else {
						target.set(targetKey, value.value);
					}
				}
				else if (settingsWithTarget[targetKey!]) {
					settingsWithTarget[targetKey!].target.set(targetKey, value);
				}
				else {
					target.set(targetKey, value);
				}

				if (value.setting && value.setting.invalidateTarget) {
					value.setting.invalidateTarget.markDirtyValues();
				}
			});
			this.close();
		}));

		const cancelButton = document.createElement("input");
		cancelButton.type = "button";
		cancelButton.value = this._root.language.translateAny("Cancel");
		cancelButton.className = "am5-modal-button am5-modal-scondary";
		content.appendChild(cancelButton);

		this._disposers.push($utils.addEventListener(cancelButton, "click", () => {
			this.cancel();
		}));

		// Open modal
		this.open();

		// Auto-focus Save button
		this.setTimeout(() => {
			// Delayed so that pressing ENTER in the list does not trigger save, too
			saveButton.focus();
		}, 10);

	}

	private getDropdown(setting: any, currentValue: any): HTMLSelectElement {
		const element = document.createElement("select");
		$array.each(setting.options, (option) => {
			if (option) {
				const optionElement = document.createElement("option");
				let value;
				if ($type.isObject(option)) {
					optionElement.value = <string>((<any>option).value);
					optionElement.text = <string>((<any>option).text);
					value = ((<any>option).value);

					if ((option as any).minValue) {
						optionElement.setAttribute("data-min-value", (option as any).minValue);
					}
					if ((option as any).extTarget) {
						optionElement.setAttribute("data-target", (option as any).extTarget);
					}
					if ((option as any).extTargetValue) {
						optionElement.setAttribute("data-target-value", (option as any).extTargetValue);
					}
					if ((option as any).extTargetMinValue) {
						optionElement.setAttribute("data-target-min-value", (option as any).extTargetMinValue);
					}
				}
				else {
					optionElement.value = <string>option;
					optionElement.text = <string>option;
					value = option;
				}

				if (value == currentValue) {
					optionElement.selected = true;
				}

				element.appendChild(optionElement);
			}
		});
		return element;
	}

	private getNumber(_setting: any, currentValue: any): HTMLInputElement {
		const element = document.createElement("input");
		element.type = "number";
		element.value = currentValue;
		element.className = "am5-modal-input-narrow"
		return element;
	}

	private getCheckbox(_setting: any, currentValue: any): HTMLInputElement {
		const element = document.createElement("input");
		element.type = "checkbox";
		element.checked = currentValue === true;
		return element;
	}

	private getColor(setting: any, currentValue: any): ColorControl {
		const control = ColorControl.new(this.root, {
			stockChart: this.get("stockChart"),
			useOpacity: false
		});
		control.setPrivate("color", currentValue);
		control.events.on("selected", (ev) => {
			this._updatedSettings[this._getSettingKey(setting)] = {
				value: ev.color,
				setting: setting
			};
		});
		this._disposers.push(control);
		return control;
	}

	/**
	 * Closes the modal, saving settings.
	 */
	public close(): void {
		super.close();
		this.events.dispatch("done", {
			type: "done",
			settings: this._updatedSettings,
			settingsTarget: this._settingsTarget,
			target: this
		});
	}

	/**
	 * Closes the modal without applying any changes.
	 */
	public cancel(): void {
		super.cancel();
		this.events.dispatch("done", {
			type: "done",
			settings: null,
			target: this
		});
	}

	/**
	 * Clears contents of the modal.
	 */
	public clear(): void {
		const content = this.getPrivate("content");
		content.innerHTML = "";
		if (this._colorControl) {
			this._colorControl.dispose();
		}
	}

	private _getSettingKey(setting: ISeriesEditableSetting): string {
		return setting.id || setting.key;
	}

}
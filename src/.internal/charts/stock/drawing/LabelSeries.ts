import type { ISpritePointerEvent } from "../../../core/render/Sprite";
import type { Container } from "../../../core/render/Container";
import type { DataItem } from "../../../core/render/Component";
import type { SpriteResizer } from "../../../core/render/SpriteResizer";
import type { Graphics } from "../../../core/render/Graphics";
import type { IDrawingSeriesDataItem } from "./DrawingSeries";

import { PolylineSeries, IPolylineSeriesSettings, IPolylineSeriesPrivate, IPolylineSeriesDataItem } from "./PolylineSeries";
import { Label } from "../../../core/render/Label";
import { RoundedRectangle } from "../../../core/render/RoundedRectangle";
import { color, Color } from "../../../core/util/Color";
import { Template } from "../../../core/util/Template";

import * as $utils from "../../../core/util/Utils";
import * as $array from "../../../core/util/Array";
import * as $object from "../../../core/util/Object";

export interface ILabelSeriesDataItem extends IPolylineSeriesDataItem {
}

export interface ILabelSeriesSettings extends IPolylineSeriesSettings {

	/**
	 * Label font size.
	 */
	labelFontSize?: number | string | undefined;

	/**
	 * Label font damily.
	 */
	labelFontFamily?: string;

	/**
	 * Font weight.
	 */
	labelFontWeight?: "normal" | "bold" | "bolder" | "lighter" | "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900";

	/**
	 * Font style.
	 */
	labelFontStyle?: "normal" | "italic" | "oblique";

	/**
	 * Label color.
	 */
	labelFill?: Color;

}

export interface ILabelSeriesPrivate extends IPolylineSeriesPrivate {
	inputContainer: HTMLDivElement;
	input: HTMLTextAreaElement;
	label: Label;
}

export class LabelSeries extends PolylineSeries {
	public static className: string = "LabelSeries";
	public static classNames: Array<string> = PolylineSeries.classNames.concat([LabelSeries.className]);

	declare public _settings: ILabelSeriesSettings;
	declare public _privateSettings: ILabelSeriesPrivate;
	declare public _dataItemSettings: ILabelSeriesDataItem;

	public spriteResizer!: SpriteResizer;

	protected _clickEvent?: ISpritePointerEvent;

	protected _tag = "label";

	protected _afterNew() {
		super._afterNew();

		this.spriteResizer = this._getStockChart().spriteResizer;

		this.strokes.template.set("visible", false);
		this.fills.template.set("visible", false);

		this.addTag(this._tag);

		const div = document.createElement("div");
		//div.style.width = "300px";
		div.style.position = "absolute";
		div.style.display = "none";
		div.className = "am5stock-drawing-label-wrapper";
		this._root._inner.appendChild(div);
		this.setPrivate("inputContainer", div);

		const textArea = document.createElement("textarea");;
		//textArea.style.textAlign = "center";
		//textArea.rows = 2;
		textArea.className = "am5stock-drawing-label-input";
		this._disposers.push($utils.addEventListener(textArea, "input", () => {
			textArea.style.height = "auto";
			textArea.style.height = textArea.scrollHeight + "px";
		}, false));


		div.appendChild(textArea);
		div.appendChild(document.createElement("br"));
		this.setPrivate("input", textArea);

		const saveButton = document.createElement("input");
		saveButton.type = "button";
		saveButton.value = this._root.language.translateAny("Save");
		saveButton.className = "am5-modal-button am5-modal-primary";
		this._disposers.push($utils.addEventListener(saveButton, "click", () => {
			this.saveText();
		}));

		div.appendChild(saveButton);

		const cancelButton = document.createElement("input");
		cancelButton.type = "button";
		cancelButton.value = this._root.language.translateAny("Cancel");
		cancelButton.className = "am5-modal-button am5-modal-scondary";
		this._disposers.push($utils.addEventListener(cancelButton, "click", () => {
			this.getPrivate("inputContainer").style.display = "none";
			this.getPrivate("input").value = "";
		}));
		div.appendChild(cancelButton);
	}

	protected _dispatchAdded(): void {

	}

	protected _setContextSprite(_context: any) { }

	protected _tweakBullet(container: Container, dataItem: DataItem<ILabelSeriesDataItem>) {
		const dataContext = dataItem.dataContext as any;
		const text = dataContext.text;
		const template = dataContext.settings;
		if (template) {
			const label = container.children.push(Label.new(this._root, {
				themeTags: ["label"],
				text: text
			}, template));

			this.setPrivate("label", label);

			container.events.on("click", (_e) => {
				const spriteResizer = this.spriteResizer;
				if (spriteResizer.get("sprite") == label) {
					spriteResizer.set("sprite", undefined);
				}
				else {
					spriteResizer.set("sprite", label);
				}
			})

			container.events.on("pointerover", () => {
				this._isHover = true;
			})

			container.events.on("pointerout", () => {
				this._isHover = false;
			})

			label.on("scale", (scale) => {
				template.set("scale", scale);
			})

			label.on("rotation", (rotation) => {
				template.set("rotation", rotation)
			})

			label.events.on("boundschanged", () => {
				this.markDirty();
			})

			dataContext.sprite = container;
			dataContext.label = label;

			this._tweakBullet2(label, dataItem);
		}
	}

	protected _tweakBullet2(label: Label, _dataItem: DataItem<ILabelSeriesDataItem>) {
		label.set("background", RoundedRectangle.new(this._root, { fillOpacity: 0, strokeOpacity: 0, fill: color(0xffffff) }))
	}

	protected _handlePointerClick(event: ISpritePointerEvent) {
		if (this._selected.length > 0) {
			this._hideResizer();
			this.unselectAllDrawings();
		}
		else if (this._drawingEnabled) {
			if (!this._isHover) {

				this._increaseIndex();
				this._di[this._index] = {};

				const input = this.getPrivate("input");
				input.value = "";

				this._clickEvent = event;
				const inputDiv = this.getPrivate("inputContainer");
				inputDiv.style.display = "block";
				inputDiv.style.left = (event.point.x) + "px";
				inputDiv.style.top = (event.point.y) + "px";
				input.focus();
				this.spriteResizer.set("sprite", undefined);

				this._dispatchStockEvent("drawingadded", this._drawingId, this._index);
			}
		}
		this.isDrawing(false);
	}

	public saveText() {
		const clickEvent = this._clickEvent;
		if (clickEvent) {
			const text = this.getPrivate("input").value;
			if (text != undefined) {
				this._addPoint(clickEvent);
				const dataContext = this.data.getIndex(this.data.length - 1) as any;
				dataContext.text = text;
				dataContext.index = this._index;
				dataContext.corner = 0;
				dataContext.settings = this._getLabelTemplate();
				this._afterTextSave(dataContext);
			}
			this.getPrivate("inputContainer").style.display = "none";
		}
	}

	protected _afterTextSave(_dataContext: any) {

	}

	protected _getLabelTemplate(): Template<any> {
		const template: any = {};

		const labelFontSize = this.get("labelFontSize");
		if (labelFontSize != null) {
			template.fontSize = labelFontSize;
		}

		const labelFontFamily = this.get("labelFontFamily");
		if (labelFontFamily != null) {
			template.fontFamily = labelFontFamily;
		}

		const labelFontWeight = this.get("labelFontWeight");
		if (labelFontWeight != null) {
			template.fontWeight = labelFontWeight;
		}

		const labelFontStyle = this.get("labelFontStyle");
		if (labelFontStyle != null) {
			template.fontStyle = labelFontStyle;
		}

		const labelFill = this.get("labelFill");
		if (labelFill != null) {
			template.fill = labelFill;
		}

		return Template.new(template);
	}

	public disposeDataItem(dataItem: DataItem<this["_dataItemSettings"]>) {
		super.disposeDataItem(dataItem);
		this.spriteResizer.set("sprite", undefined);
		this._isHover = false;
	}

	protected _hideAllBullets() {

	}

	protected _updateSelector(selector: Graphics, index: number) {
		const context = this._getContext(index);
		if (context) {
			const sprite = context.sprite;

			if (sprite) {
				if (sprite.dataItem == this.spriteResizer.get("sprite")?.dataItem) {
					selector.hide(0);
				}
				else {
					if (this._selected.indexOf(index) != -1) {
						selector.show(0);
					}
				}

				const selectorPadding = this.get("selectorPadding", 5);

				let bounds = sprite.bounds();

				let w = (bounds.right - bounds.left) + selectorPadding * 2;
				let h = (bounds.bottom - bounds.top) + selectorPadding * 2;

				selector.setAll({
					width: w,
					height: h,
					x: bounds.left - selectorPadding,
					y: bounds.top - selectorPadding
				})
			}
		}
	}

	public _prepareChildren() {
		super._prepareChildren();
		if (this.isDirty("labelFontSize") || this.isDirty("labelFontFamily") || this.isDirty("labelFontWeight") || this.isDirty("labelFontStyle") || this.isDirty("labelFill")) {
			$array.each(this._selected, (i) => {
				this._applySettings(i);
			})
		}
	}

	protected _applySettings(index: number, _settings?: { [index: string]: any }) {
		let context = this._getContext(index);

		if (context) {
			let label = context.label;

			if (label) {
				let template = context.settings;

				const labelSettings = {
					fontSize: this.get("labelFontSize"),
					fontFamily: this.get("labelFontFamily"),
					fontWeight: this.get("labelFontWeight"),
					fontStyle: this.get("labelFontStyle"),
					fill: this.get("labelFill"),
					fillColor: this.get("fillColor")
				}

				const defaultState = label.states.lookup("default")!;
				if (labelSettings) {
					$object.each(labelSettings, (key, value) => {
						label.set(key as any, value);
						defaultState.set(key as any, value);
						if (template) {
							template.set(key, value);
						}
					})
				}
			}
		}
	}

	protected _handleBulletDragStart(event: ISpritePointerEvent) {
		// don't call super		
		const stockChart = this._getStockChart();
		if (stockChart) {
			stockChart._dragStartDrawing(event);
		}
	}

	protected _handleBulletDragStop(event: ISpritePointerEvent) {
		const stockChart = this._getStockChart();
		if (stockChart) {
			stockChart._dragStopDrawing(event);
		}

		this._root.events.once("frameended", () => {
			this._positionBullets(event.target.dataItem as DataItem<IDrawingSeriesDataItem>);
		})
	}
}
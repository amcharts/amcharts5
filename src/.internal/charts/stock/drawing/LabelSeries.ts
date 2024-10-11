import type { ISpritePointerEvent } from "../../../core/render/Sprite";
import type { Container } from "../../../core/render/Container";
import type { DataItem } from "../../../core/render/Component";
import type { SpriteResizer } from "../../../core/render/SpriteResizer";
import type { Graphics } from "../../../core/render/Graphics";
import type { IDrawingSeriesDataItem } from "./DrawingSeries";

import { PolylineSeries, IPolylineSeriesSettings, IPolylineSeriesPrivate, IPolylineSeriesDataItem } from "./PolylineSeries";
import { EditableLabel } from "../../../core/render/EditableLabel";
import type { Color } from "../../../core/util/Color";
import { Template } from "../../../core/util/Template";

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
	label: EditableLabel;
}

export class LabelSeries extends PolylineSeries {
	public static className: string = "LabelSeries";
	public static classNames: Array<string> = PolylineSeries.classNames.concat([LabelSeries.className]);

	declare public _settings: ILabelSeriesSettings;
	declare public _privateSettings: ILabelSeriesPrivate;
	declare public _dataItemSettings: ILabelSeriesDataItem;

	public spriteResizer!: SpriteResizer;

	protected _tag = "label";

	protected _isEditing: boolean = false;

	protected _isSelected: boolean = false;

	protected _afterNew() {
		super._afterNew();

		this.spriteResizer = this._getStockChart().spriteResizer;

		this.strokes.template.set("visible", false);
		this.fills.template.set("visible", false);

		this.addTag(this._tag);
	}

	protected _dispatchAdded(): void {

	}

	protected _setContextSprite(_context: any) { }

	protected _tweakBullet(container: Container, dataItem: DataItem<ILabelSeriesDataItem>) {
		const dataContext = dataItem.dataContext as any;
		const text = dataContext.text;
		const template = dataContext.settings;

		if (template) {
			const label = container.children.push(EditableLabel.new(this._root, {
				themeTags: ["label"],
				text: text,
				editOn: "none"
			}, template));

			label.on("text", (text) => {
				dataContext.text = text;
			});

			this.setPrivate("label", label);

			label.on("active", () => {
				this.setTimeout(() => {
					this._isEditing = label.get("active", false);
				}, 200)

				if (!label.get("active")) {
					this.setTimeout(() => {
						if (label) {
							if (label.get("text") == "") {
								this._disposeIndex(dataContext.index);
							}
						}
					}, 100);

					// Trigger a drawing updated event so that updated text is saved if
					// necessary
					const stockChart = this._getStockChart();
					const type = "drawingsupdated";
					if (stockChart.events.isEnabled(type)) {
						stockChart.events.dispatch(type, { type: type, target: stockChart });
					}
				}
			});

			container.events.on("click", (e) => {
				const spriteResizer = this.spriteResizer;
				if (spriteResizer.get("sprite") == label) {
					this._isEditing = true;
					label.set("active", true);
					this._selectDrawing(dataContext.index, (e.originalEvent as any).ctrlKey, true);
					spriteResizer.set("sprite", undefined);
				}
				else {
					this._isEditing = false;
					this._isSelected = true;
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

	protected _tweakBullet2(_label: EditableLabel, _dataItem: DataItem<ILabelSeriesDataItem>) {

	}

	protected _handlePointerClick(event: ISpritePointerEvent) {
		if (this._isEditing) {
			return;
		}
		if (this._selected.length > 0 || this._isSelected) {
			this._isSelected = false;
			this._hideResizer();
			this.unselectAllDrawings();
		}
		else if (this._drawingEnabled) {
			if (!this._isHover) {
				this.isDrawing(true);
				this._increaseIndex();
				this._di[this._index] = {};

				this._addPoint(event);

				const dataContext = this.data.getIndex(this.data.length - 1) as any;
				dataContext.text = "";
				dataContext.index = this._index;
				dataContext.corner = 0;
				dataContext.settings = this._getLabelTemplate();
				this._afterTextSave(dataContext);

				this._root.events.once("frameended", () => {
					dataContext.label.set("active", true);
					this._isEditing = true;
				});

				this.spriteResizer.set("sprite", undefined);

				this._dispatchStockEvent("drawingadded", this._drawingId, this._index);
			}
		}

		this.isDrawing(false);
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

	protected _applySettings(index: number, settings?: { [index: string]: any }) {
		super._applySettings(index, settings);
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

	public toggleDrawing(enabled?: boolean) {
		this.grips.each((grip) => {
			grip.set("forceInactive", !enabled);
		})
	}
}
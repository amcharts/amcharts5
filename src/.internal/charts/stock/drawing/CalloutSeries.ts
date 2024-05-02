import type { Label } from "../../../core/render/Label";
import type { Container } from "../../../core/render/Container";
import type { DataItem } from "../../../core/render/Component";

import { LabelSeries, ILabelSeriesSettings, ILabelSeriesPrivate, ILabelSeriesDataItem } from "./LabelSeries";
import { PointedRectangle } from "../../../core/render/PointedRectangle";
import { Template } from "../../../core/util/Template";

import * as $ease from "../../../core/util/Ease";


export interface ICalloutSeriesDataItem extends ILabelSeriesDataItem {
}

export interface ICalloutSeriesSettings extends ILabelSeriesSettings {
}

export interface ICalloutSeriesPrivate extends ILabelSeriesPrivate {
}

export class CalloutSeries extends LabelSeries {
	public static className: string = "CalloutSeries";
	public static classNames: Array<string> = LabelSeries.classNames.concat([CalloutSeries.className]);

	declare public _settings: ICalloutSeriesSettings;
	declare public _privateSettings: ICalloutSeriesPrivate;
	declare public _dataItemSettings: ICalloutSeriesDataItem;

	protected _tag = "callout";

	protected _tweakBullet2(label: Label, dataItem: DataItem<ICalloutSeriesDataItem>) {
		const dataContext = dataItem.dataContext as any;
		const background = label.set("background", PointedRectangle.new(this._root, { themeTags: ["callout"] }, dataContext.bgSettings));
		dataContext.background = background;
	}

	protected _tweakBullet(container: Container, dataItem: DataItem<ICalloutSeriesDataItem>) {
		super._tweakBullet(container, dataItem);

		container.events.off("click");

		const dataContext = dataItem.dataContext as any;
		const template = dataContext.settings;

		if (template) {
			const label = this.getPrivate("label");
			if (label) {
				label.events.on("positionchanged", () => {
					this._root.events.once("frameended", () => {
						this._updatePointer(label);
					})
				})

				label.events.on("click", (e) => {
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
						this._selectDrawing(dataContext.index, (e.originalEvent as any).ctrlKey, true);
						spriteResizer.set("sprite", label);
					}
					if (this._erasingEnabled) {
						this._disposeIndex(dataContext.index);
					}
				})

				label.on("scale", () => {
					this._updatePointer(label);
				})

				label.on("rotation", () => {
					this._updatePointer(label);
				})

				label.setAll({ draggable: true });

				label.on("x", (x) => {
					template.set("x", x);
				})

				label.on("y", (y) => {
					template.set("y", y);
				})

				const defaultState = label.states.lookup("default")!;
				setTimeout(() => {
					label.animate({ key: "y", to: -label.height() / 2 - 10, from: 0, duration: defaultState.get("stateAnimationDuration", 500), easing: defaultState.get("stateAnimationEasing", $ease.out($ease.cubic)) })
				}, 50)
			}
		}
	}

	protected _updatePointer(label: Label) {
		const background = label.get("background");
		if (background instanceof PointedRectangle) {
			const parent = label.parent;
			if (parent) {
				let point = parent.toGlobal({ x: 0, y: 0 });
				point = background.toLocal(point);
				background.setAll({ pointerX: point.x, pointerY: point.y });
			}
		}

		this.markDirty();
	}

	protected _afterTextSave(dataContext: any) {
		dataContext.bgSettings = this._getBgTemplate();
	}

	protected _hideAllBullets() {

	}

	protected _getBgTemplate(): Template<any> {
		const template: any = {};

		const fill = this.get("fillColor");
		if (fill != null) {
			template.fill = fill;
		}

		const fillOpacity = this.get("fillOpacity");
		if (fillOpacity != null) {
			template.fillOpacity = fillOpacity;
		}

		const strokeOpacity = this.get("strokeOpacity");
		if (strokeOpacity != null) {
			template.strokeOpacity = strokeOpacity;
		}

		const stroke = this.get("strokeColor");
		if (stroke != null) {
			template.stroke = stroke;
		}

		return Template.new(template);
	}

	protected _applySettings(index: number, settings?: { [index: string]: any }) {
		super._applySettings(index, settings);

		const context = this._getContext(index);
		if (context && settings) {
			const background = context.background;

			if (background) {
				let template = context.bgSettings;

				if (settings.fill != undefined) {
					background.set("fill", settings.fill);
					template.set("fill", settings.fill);
				}
				if (settings.fillOpacity != undefined) {
					background.set("fillOpacity", settings.fillOpacity);
					template.set("fillOpacity", settings.fillOpacity);
				}
				if (settings.strokeOpacity != undefined) {
					background.set("strokeOpacity", settings.strokeOpacity);
					template.set("strokeOpacity", settings.strokeOpacity);
				}

				if (settings.stroke != undefined) {
					background.set("stroke", settings.stroke);
					template.set("stroke", settings.stroke);
				}
			}
		}
	}
}
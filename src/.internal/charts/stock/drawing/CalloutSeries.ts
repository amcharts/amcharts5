import type { Label } from "../../../core/render/Label";
import type { Container } from "../../../core/render/Container";

import { LabelSeries, ILabelSeriesSettings, ILabelSeriesPrivate, ILabelSeriesDataItem } from "./LabelSeries";
import { PointedRectangle } from "../../../core/render/PointedRectangle";
import type { DataItem } from "../../../core/render/Component";
import { Template } from "../../../core/util/Template";

import * as $ease from "../../../core/util/Ease";

export interface ICalloutSeriesDataItem extends ILabelSeriesDataItem {

	/**
	 * Indicates whether callout will attach itself to the closest data item, as
	 * opposed to exact location of the click.
	 */
	snapToData?: boolean;

}

export interface ICalloutSeriesSettings extends ILabelSeriesSettings {

	/**
	 * If set to `true`, callout will attach itself to the closest data item, as
	 * opposed to exact location of the click.
	 *
	 * @default true
	 */
	snapToData?: boolean;

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

	protected _afterNew() {
		super._afterNew();
	}

	protected _tweakBullet2(label: Label, dataItem: DataItem<ICalloutSeriesDataItem>) {
		const dataContext = dataItem.dataContext as any;
		label.set("background", PointedRectangle.new(this._root, { themeTags: ["callout"] }, dataContext.bgSettings));
	}

	protected _tweakBullet(container: Container, dataItem: DataItem<ICalloutSeriesDataItem>) {
		super._tweakBullet(container, dataItem);

		container.events.off("click");

		const dataContext = dataItem.dataContext as any;
		const template = dataContext.settings;

		const label = this.getPrivate("label");
		if (label) {
			label.events.on("positionchanged", () => {
				this._updatePointer(label);
			})

			label.events.on("click", () => {
				const spriteResizer = this.spriteResizer;
				if (spriteResizer.get("sprite") == label) {
					spriteResizer.set("sprite", undefined);
				}
				else {
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

		return Template.new(template);
	}

	protected _setXLocation(dataItem: DataItem<this["_dataItemSettings"]>, value: number) {
		if (!this.get("snapToData")) {
			this._setXLocationReal(dataItem, value);
		}
	}
}
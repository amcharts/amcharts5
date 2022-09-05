import type { Label } from "../../../core/render/Label";
import type { Container } from "../../../core/render/Container";

import { LabelSeries, ILabelSeriesSettings, ILabelSeriesPrivate, ILabelSeriesDataItem } from "./LabelSeries";
import { PointedRectangle } from "../../../core/render/PointedRectangle";
import { Color, color } from "../../../core/util/Color";

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

	protected _tweakBullet2(label: Label) {
		const bgColor = this.get("fillColor", this.get("fill", color(0x000000)));
		label.set("background", PointedRectangle.new(this._root, { themeTags: ["callout"], strokeOpacity: 0, fill: bgColor }));
		label.set("fill", this.get("labelFill", Color.alternative(bgColor, this._root.interfaceColors.get("alternativeText"), this._root.interfaceColors.get("text"))));
	}

	protected _tweakBullet(container: Container) {
		super._tweakBullet(container);

		container.events.off("click");

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
			})

			label.on("scale", () => {
				this._updatePointer(label);
			})

			label.on("rotation", () => {
				this._updatePointer(label);
			})

			label.setAll({ draggable: true });

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

	protected _hideAllBullets() {

	}
}
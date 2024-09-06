import { SimpleLineSeries, ISimpleLineSeriesSettings, ISimpleLineSeriesPrivate, ISimpleLineSeriesDataItem } from "./SimpleLineSeries";

import * as $math from "../../../core/util/Math";
import type { IPoint } from "../../../core/util/IPoint";
import { ListTemplate } from "../../../core/util/List";
import { Triangle } from "../../../core/render/Triangle";
import { Template } from "../../../core/util/Template";

export interface ILineArrowSeriesDataItem extends ISimpleLineSeriesDataItem {
}

export interface ILineArrowSeriesSettings extends ISimpleLineSeriesSettings {

	/**
	 * Show a dotted line extending from both ends of the drawn line.
	 *
	 * @default true
	 */
	showExtension?: boolean;
}

export interface ILineArrowSeriesPrivate extends ISimpleLineSeriesPrivate {
}

/**
 * Used for Line Arrow drawing tool in [[StockChart]].
 *
 * @since 5.10.5
 */

export class LineArrowSeries extends SimpleLineSeries {
	public static className: string = "LineArrowSeries";
	public static classNames: Array<string> = SimpleLineSeries.classNames.concat([LineArrowSeries.className]);

	declare public _settings: ILineArrowSeriesSettings;
	declare public _privateSettings: ILineArrowSeriesPrivate;
	declare public _dataItemSettings: ILineArrowSeriesDataItem;

	protected _arrows: Array<Triangle> = [];

	protected _afterNew() {
		super._afterNew();

		this.lines.template.set("forceHidden", true);
	}

	/**
	 * @ignore
	 */
	public makeArrow(): Triangle {
		const arrow = this.arrows.make();
		this.mainContainer.children.push(arrow);
		this.arrows.push(arrow);
		return arrow;
	}

	public readonly arrows: ListTemplate<Triangle> = new ListTemplate(
		Template.new({}),
		() => Triangle._new(this._root, { themeTags: ["arrow"] }, [this.arrows.template])
	);

	protected _createElements(index: number) {
		super._createElements(index);
		if (!this._arrows[index]) {
			const arrow = this.makeArrow();
			this._arrows[index] = arrow;

			let color = this.get("strokeColor", this.get("stroke"));
			if (color) {
				arrow.set("fill", color);
			}
		}
	}


	protected _updateLine(index: number, p11: IPoint, p22: IPoint, p1: IPoint, p2: IPoint) {
		super._updateLine(index, p11, p22, p1, p2);
		const arrow = this._arrows[index];

		let angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

		// point by 11 pixels back on a line
		const p1x = p2.x - 11 * Math.cos(angle);
		const p1y = p2.y - 11 * Math.sin(angle);


		arrow.setAll({
			x: p1x,
			y: p1y,
			rotation: $math.DEGREES * angle + 90
		});
	}
}
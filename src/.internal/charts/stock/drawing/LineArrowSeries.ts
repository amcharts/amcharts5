import { SimpleLineSeries, ISimpleLineSeriesSettings, ISimpleLineSeriesPrivate, ISimpleLineSeriesDataItem } from "./SimpleLineSeries";
import { ListTemplate } from "../../../core/util/List";
import { Triangle } from "../../../core/render/Triangle";
import { Template } from "../../../core/util/Template";
import { Bullet } from "../../../core/render/Bullet";

import type { IPoint } from "../../../core/util/IPoint";
import type { Container } from "../../../core/render/Container";
import type { DataItem } from "../../../..";

import * as $math from "../../../core/util/Math";
import * as $array from "../../../core/util/Array";
import * as $object from "../../../core/util/Object";


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

		this.bullets.push((_root, _series, dataItem) => {
			const dataContext = dataItem.dataContext as any;
			if (dataContext.corner == "p2") {

				const index = dataContext.index;
				const di = this._di[index]["e"] as DataItem<ILineArrowSeriesDataItem>;
				let color = this.get("strokeColor", this.get("stroke"));

				if (di) {
					const dc = di.dataContext as any;
					if (dc) {
						const strokeTemplate = dc.stroke;
						if (strokeTemplate) {
							color = strokeTemplate.get("stroke");
						}
					}
				}


				const bullets = dataItem.bullets;
				if (bullets) {
					const bullet = bullets[0];
					if (bullet) {
						const container = bullet.get("sprite") as Container;
						if (container) {
							const child = container.children.getIndex(0);
							if (child) {
								child.set("scale", .1);
							}
						}
					}
				}

				const arrow = this.makeArrow();

				arrow.setAll({
					forceInactive: true,
					fill: color,
					userData: dataContext.index
				});

				return Bullet.new(this._root, {
					sprite: arrow,
					locationX: undefined
				});
			}
		})
	}

	public clearDrawings(): void {
		super.clearDrawings();
		this.arrows.clear();
	}

	public _changed() {
		super._changed();
		this.arrows.each((arrow) => {
			const index = arrow.get("userData");
			const di = this._di[index];
			if (di) {
				const di1 = this._di[index]["p1"];
				const di2 = this._di[index]["p2"];

				const p1 = di1.get("point");
				const p2 = di2.get("point");

				if (p1 && p2) {
					// rotate arrow
					const angle = $math.getAngle(p1, p2) + 90;
					arrow.set("rotation", angle);

					const w = arrow.width();

					const strokeIndex = this._getStrokeIndex(index);
					const stroke = this.strokes.getIndex(strokeIndex);
					if (stroke) {
						arrow.set("scale", (w + stroke.get("strokeWidth", 2) * 2) / w);
					}
				}
			}
		})
	}

	protected _applySettings(index: number, settings: { [index: string]: any }) {
		super._applySettings(index, settings);
		let template!: Template<any>;
		$array.each(this.dataItems, (dataItem) => {
			const dataContext = dataItem.dataContext as any;
			if (dataContext.index == index) {
				if (dataContext.settings) {
					template = dataContext.settings;
				}
			}
		})

		const settings2 = $object.copy(settings);

		if (settings.stroke != undefined) {
			settings2.fill = settings.stroke;
		}
		else {
			delete settings2.fill;
		}
		if (settings.strokeOpacity != undefined) {
			settings2.fillOpacity = settings.strokeOpacity;
		}
		else {
			delete settings2.fillOpacity;
		}

		settings2.strokeOpacity = 0;

		const arrow = this._getSprite(this.arrows, index);
		if (arrow) {
			const defaultState = arrow.states.lookup("default")!;
			$object.each(settings2, (key, value) => {
				arrow.set(key as any, value);
				defaultState.set(key as any, value);
				if (template) {
					template.set(key, value);
				}
			})
		}
	}


	/**
	 * @ignore
	 */
	public makeArrow(): Triangle {
		const arrow = this.arrows.make();
		this.arrows.push(arrow);
		return arrow;
	}

	public readonly arrows: ListTemplate<Triangle> = this.addDisposer(new ListTemplate(
		Template.new({}),
		() => Triangle._new(this._root, { themeTags: ["arrow"] }, [this.arrows.template])
	));


	protected _updateLine(index: number, p11: IPoint, p22: IPoint, p1: IPoint, p2: IPoint) {
		super._updateLine(index, p11, p22, p1, p2);
	}
}

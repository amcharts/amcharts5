import type { IPoint } from "../util/IPoint";

import { Container, IContainerSettings, IContainerPrivate } from "./Container";
import { Triangle } from "./Triangle";
import { OrthogonalLine } from "./OrthogonalLine";

import * as $math from "../util/Math";

export interface ILinkSettings extends IContainerSettings {
	/**
	 * Points the link goes through, in pixels. Between two points that differ
	 * in both x and y it goes horizontally first, then vertically.
	 */
	points?: Array<IPoint>;
	cornerRadius?: number;
}

export interface ILinkPrivate extends IContainerPrivate {
}

/**
 * A connector made of horizontal and vertical segments through `points`, with
 * an arrow at each end, such as a dependency line in a Gantt chart.
 *
 * @see {@link https://docs.amcharts.com/v5/concepts/common-elements/graphics/} for more info
 * @important
 */
export class Link extends Container {

	declare public _settings: ILinkSettings;
	declare public _privateSettings: ILinkPrivate;

	public static className: string = "Link";
	public static classNames: Array<string> = Container.classNames.concat([Link.className]);

	/**
	 * The visible line.
	 */
	public line: OrthogonalLine = this.children.push(OrthogonalLine.new(this._root, { themeTags: ["line"] }));
	/**
	 * A wider, invisible copy of the line that makes the link easier to hover
	 * and click.
	 */
	public hitLine: OrthogonalLine = this.children.push(OrthogonalLine.new(this._root, { themeTags: ["hit"] }));

	/**
	 * The arrow at the first point.
	 */
	public startArrow: Triangle = this.children.push(Triangle.new(this._root, {
		themeTags: ["start", "arrow"],
	}));

	/**
	 * The arrow at the last point.
	 */
	public endArrow: Triangle = this.children.push(Triangle.new(this._root, {
		themeTags: ["end", "arrow"],
	}));

	protected _afterNew() {
		this.addTag("link");
		super._afterNew();
	}

	public _updateChildren() {
		super._updateChildren();

		if (this.isDirty("points")) {
			let points = OrthogonalLine.makeOrthogonal(this.get("points", []));

			this.line.set("points", points);
			this.hitLine.set("points", points);

			const startArrow = this.startArrow;
			const endArrow = this.endArrow;

			const len = points.length;
			if (len > 1) {
				const [start, next] = points;
				startArrow.setAll({
					x: start.x,
					y: start.y,
					rotation: $math.getAngle(start, next) - 90
				});

				const last = points[len - 1];
				const prev = points[len - 2];
				endArrow.setAll({
					x: last.x,
					y: last.y,
					rotation: $math.getAngle(prev, last) + 90
				});
			} else if (len === 1) {
				const [pt] = points;
				startArrow.setAll({ x: pt.x, y: pt.y, rotation: 0 });
				endArrow.setAll({ x: pt.x, y: pt.y, rotation: 0 });
			}
		}
	}
}

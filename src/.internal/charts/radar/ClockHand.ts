import type { Axis } from "../xy/axes/Axis";
import type { AxisRendererCircular } from "../radar/AxisRendererCircular";
import type { RadarChart } from "../radar/RadarChart";

import { Container, IContainerPrivate, IContainerSettings } from "../../core/render/Container";
import { Graphics } from "../../core/render/Graphics";
import { Percent, percent } from "../../core/util/Percent";

import * as $utils from "../../core/util/Utils";


export interface IClockHandSettings extends IContainerSettings {

	/**
	 * A width of the tip of the clock hand, in pixels.
	 *
	 * @default 1
	 */
	topWidth?: number;

	/**
	 * A width of the base of the clock hand, in pixels.
	 *
	 * @default 10
	 */
	bottomWidth?: number;

	/**
	 * Radius of the hand, in pixels, or percent (relative to the axis radius).
	 *
	 * If set to negative number, will mean number of pixels inwards from the
	 * axis.
	 *
	 * @default 90%
	 */
	radius?: number | Percent;

	/**
	 * Inner radius of the hand, in pixels, or percent (relative to the axis
	 * radius).
	 *
	 * If set to negative number, will mean number of pixels inwards from the
	 * axis.
	 *
	 * @default 0
	 */
	innerRadius?: number | Percent;

	/**
	 * Radius of the hand pin (circle at the base of the hand), in pixels, or in
	 * percent (relative to the axis radius.)
	 *
	 * @default 10
	 */
	pinRadius?: number | Percent;

}

export interface IClockHandPrivate extends IContainerPrivate {
}

/**
 * A clock hand for use with [[RadarChart]].
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/radar-chart/gauge-charts/#Clock_hands} for more info
 * @important
 */
export class ClockHand extends Container {

	declare public _settings: IClockHandSettings;
	declare public _privateSettings: IClockHandPrivate;

	public static className: string = "ClockHand";
	public static classNames: Array<string> = Container.classNames.concat([ClockHand.className]);

	/**
	 * A "hand" element.
	 *
	 * @default Graphics.new()
	 */
	public readonly hand: Graphics = this.children.push(Graphics.new(this._root, { themeTags: ["hand"] }));

	/**
	 * A "pin" element (hand's base).
	 *
	 * @default Graphics.new()
	 */
	public readonly pin: Graphics = this.children.push(Graphics.new(this._root, { themeTags: ["pin"] }));

	protected _afterNew() {
		this._settings.themeTags = $utils.mergeTags(this._settings.themeTags, ["clock"]);

		super._afterNew();

		// to be redrawn when size changes
		this.set("width", percent(1));

		this.adapters.add("x", () => {
			return 0
		})

		this.adapters.add("y", () => {
			return 0
		})

		this.pin.set("draw", (display, graphics: Graphics) => {
			const parent = graphics.parent as ClockHand;
			if (parent) {
				const dataItem = parent.dataItem;
				if (dataItem) {
					const axis = dataItem.component as Axis<AxisRendererCircular>;
					if (axis) {
						const chart = axis.chart as RadarChart;
						if (chart) {
							const cr = chart.getPrivate("radius", 0);
							let r = $utils.relativeToValue(parent.get("pinRadius", 0), cr);
							if(r < 0){
								r = cr + r;
							}
							display.moveTo(r, 0)
							display.arc(0, 0, r, 0, 360);
						}
					}
				}
			}
		})

		this.hand.set("draw", (display, graphics: Graphics) => {
			const parent = graphics.parent as ClockHand;

			if (parent) {

				let bullet = parent.parent;
				// to be redrawn when size changes
				if (bullet) {
					bullet.set("width", percent(1));
				}

				const dataItem = parent.dataItem;

				if (dataItem) {
					const axis = dataItem.component as Axis<AxisRendererCircular>;
					if (axis) {
						const chart = axis.chart as RadarChart;
						if (chart) {
							const bw = parent.get("bottomWidth", 10) / 2;
							const tw = parent.get("topWidth", 0) / 2;
							const cr = chart.getPrivate("radius", 0);
							let r = $utils.relativeToValue(parent.get("radius", 0), cr);

							if(r < 0){
								r = cr + r;
							}

							let ir = parent.get("innerRadius", 0);

							if (ir instanceof Percent) {
								ir = $utils.relativeToValue(ir, cr);
							}
							else {
								if (ir < 0) {
									if (ir < 0) {
										ir = r + ir;
									}
								}
							}

							display.moveTo(ir, -bw);
							display.lineTo(r, -tw);
							display.lineTo(r, tw);
							display.lineTo(ir, bw);
							display.lineTo(ir, -bw);
						}
					}
				}
			}
		})
	}

	public _prepareChildren() {
		super._prepareChildren();
		this.hand._markDirtyKey("fill");
		this.pin._markDirtyKey("fill");
	}
}

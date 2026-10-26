import type { Axis } from "../xy/axes/Axis";
import type { AxisRendererCircular } from "../radar/AxisRendererCircular";
import type { RadarChart } from "../radar/RadarChart";

import { Container, IContainerPrivate, IContainerSettings } from "../../core/render/Container";
import { Graphics } from "../../core/render/Graphics";
import { Percent, percent } from "../../core/util/Percent";

import * as $utils from "../../core/util/Utils";


export interface IClockHandSettings extends IContainerSettings {

	/**
	 * Width of the hand's tip in pixels.
	 *
	 * @default 1
	 */
	topWidth?: number;

	/**
	 * Width of the hand's base in pixels.
	 *
	 * @default 10
	 */
	bottomWidth?: number;

	/**
	 * Distance from the center to the hand's tip, in pixels or as a percent of
	 * the chart's radius. A negative value is measured in from the chart's
	 * radius.
	 *
	 * @default 90%
	 */
	radius?: number | Percent;

	/**
	 * Distance from the center to the hand's base, in pixels or as a percent
	 * of the chart's radius. A negative number of pixels is measured back from
	 * the tip.
	 *
	 * @default 0
	 */
	innerRadius?: number | Percent;

	/**
	 * Radius of the pin, the circle at the center, in pixels or as a percent
	 * of the chart's radius.
	 *
	 * @default 10
	 */
	pinRadius?: number | Percent;

}

export interface IClockHandPrivate extends IContainerPrivate {
}

/**
 * A gauge needle for a [[RadarChart]]. Set it as the `sprite` of an axis
 * data item's [[AxisBullet]], and it points at that data item's value.
 *
 * @see {@link https://docs.amcharts.com/v5/charts/radar-chart/gauge-charts/#clock-hands} for more info
 * @important
 */
export class ClockHand extends Container {

	declare public _settings: IClockHandSettings;
	declare public _privateSettings: IClockHandPrivate;

	public static className: string = "ClockHand";
	public static classNames: Array<string> = Container.classNames.concat([ClockHand.className]);

	/**
	 * The hand itself, a tapered shape from `innerRadius` to `radius`.
	 *
	 * @default Graphics.new()
	 */
	public readonly hand: Graphics = this.children.push(Graphics.new(this._root, { themeTags: ["hand"] }));

	/**
	 * The pin: a circle at the center, of `pinRadius`.
	 *
	 * @default Graphics.new()
	 */
	public readonly pin: Graphics = this.children.push(Graphics.new(this._root, { themeTags: ["pin"] }));

	protected _afterNew() {
		this._settings.themeTags = $utils.mergeTags(this._settings.themeTags, ["clock"]);

		super._afterNew();

		// to be redrawn when size changes
		this._setC("width", percent(1));

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
					bullet._setC("width", percent(1));
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

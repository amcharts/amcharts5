import type { Root } from "../../core/Root";
import { Container, IContainerPrivate, IContainerSettings } from "../../core/render/Container";
import { Graphics } from "../../core/render/Graphics";
import type { Template } from "../../core/util/Template";
import { Percent, percent } from "../../core/util/Percent";
import type  { Axis } from "../xy/axes/Axis";
import type  { AxisRendererCircular } from "../radar/AxisRendererCircular";
import type { RadarChart } from "../radar/RadarChart";
import * as $utils from "../../core/util/Utils";


export interface IClockHandSettings extends IContainerSettings {
	topWidth?: number;
	bottomWidth?: number;
	radius?: number | Percent;
	innerRadius?: number | Percent;
	pinRadius?: number | Percent;
}

export interface IClockHandPrivate extends IContainerPrivate {
}

export class ClockHand extends Container {

	/**
	 * Use this method to create an instance of this class.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/getting-started/#New_element_syntax} for more info
	 * @param   root      Root element
	 * @param   settings  Settings
	 * @param   template  Template
	 * @return            Instantiated object
	 */
	public static new(root: Root, settings: ClockHand["_settings"], template?: Template<ClockHand>): ClockHand {
		settings.themeTags = $utils.mergeTags(settings.themeTags, ["clock"]);
		const x = new ClockHand(root, settings, true, template);
		x._afterNew();
		return x;
	}

	declare public _settings: IClockHandSettings;
	declare public _privateSettings: IClockHandPrivate;

	public static className: string = "ClockHand";
	public static classNames: Array<string> = Container.classNames.concat([ClockHand.className]);

	/**
	 * A "hand" elment.
	 */
	public readonly hand: Graphics = this.children.push(Graphics.new(this._root, { themeTags: ["hand"] }));

	/**
	 * A "pin" element (hand's base).
	 */
	public readonly pin: Graphics = this.children.push(Graphics.new(this._root, { themeTags: ["pin"] }));

	protected _afterNew() {
		super._afterNew();

		// to be redrawn when size changes
		this.set("width", percent(1));

		this.pin.set("draw", (display, graphics: Graphics) => {
			const parent = graphics.parent as ClockHand;
			if (parent) {
				const dataItem = parent.dataItem;
				if (dataItem) {
					const axis = dataItem.component as Axis<AxisRendererCircular>;
					if (axis) {
						const chart = axis.chart as RadarChart;
						if (chart) {
							const radius = $utils.relativeToValue(parent.get("pinRadius", 0), chart.getPrivate("radius", 0));;
							display.moveTo(5, 0)
							display.arc(0, 0, radius, 0, 360);
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
				if(bullet){
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
							const r = $utils.relativeToValue(parent.get("radius", 0), chart.getPrivate("radius", 0));
							const ir = $utils.relativeToValue(parent.get("innerRadius", 0), chart.getPrivate("innerRadius", 0));

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
	}

	public _setParent(parent: Container, updateChildren: boolean = false) {
		super._setParent(parent, updateChildren);

		if (parent) {
			parent.adapters.add("x", () => {
				return 0
			})

			parent.adapters.add("y", () => {
				return 0
			})
		}
	}
}

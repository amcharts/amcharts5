import type { Root } from "../../core/Root";
import { Scrollbar, IScrollbarPrivate, IScrollbarSettings } from "../../core/render/Scrollbar";
import { XYChart } from "./XYChart";
import { Graphics } from "../../core/render/Graphics";
import type { Template } from "../../core/util/Template";
import * as $utils from "../../core/util/Utils";

export interface IXYChartScrollbarSettings extends IScrollbarSettings {

}

export interface IXYChartScrollbarPrivate extends IScrollbarPrivate {
}

/**
 * Creates a scrollbar with chart preview in it.
 *
 * @see {@link https://www.amcharts.com/docs/v5/getting-started/xy-chart/scrollbars/#Scrollbar_with_chart_preview} for more info
 * @important
 */
export class XYChartScrollbar extends Scrollbar {

	/**
	 * Use this method to create an instance of this class.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/getting-started/#New_element_syntax} for more info
	 * @param   root      Root element
	 * @param   settings  Settings
	 * @param   template  Template
	 * @return            Instantiated object
	 */
	public static new(root: Root, settings: XYChartScrollbar["_settings"], template?: Template<XYChartScrollbar>): XYChartScrollbar {
		this._addOrientationClass(root, settings);
		settings.themeTags = $utils.mergeTags(settings.themeTags, ["scrollbar", "xy", settings.orientation]);
		const x = new XYChartScrollbar(root, settings, true, template);
		x._afterNew();
		return x;
	}

	declare public _settings: IXYChartScrollbarSettings;
	declare public _privateSettings: IXYChartScrollbarPrivate;

	public static className: string = "XYChartScrollbar";
	public static classNames: Array<string> = Scrollbar.classNames.concat([XYChartScrollbar.className]);

	/**
	 * An instance of an [[XYChart]] that is used to plot chart preview in
	 * scrollbar.
	 */
	public readonly chart: XYChart = this.children.push(XYChart.new(this._root, {
		themeTags: ["chart"],
		interactive: false,
		interactiveChildren: false,
		panX: false,
		panY: false,
		wheelX: "none",
		wheelY: "none"
	}));

	/**
	 * A graphics element that is displayed over inactive portion of the
	 * scrollbarpreview, to dim it down.
	 */
	public readonly overlay: Graphics = this.children.push(Graphics.new(this._root, {
		themeTags: ["overlay"],
		interactive: false
	}));

	protected _afterNew() {

		this.children.moveValue(this.thumb);
		this.children.moveValue(this.startGrip);
		this.children.moveValue(this.endGrip);
		this.thumb.set("opacity", 0);
		this.thumb.states.create("hover", { opacity: 0.2 });

		this.chart.plotContainer.set("interactive", false);
		this.chart.plotContainer.children.removeValue(this.chart.zoomOutButton);

		super._afterNew();
	}

	protected _updateThumb() {
		super._updateThumb();

		this.overlay.set("draw", (display) => {
			const startGrip = this.startGrip;
			const endGrip = this.endGrip;

			const x0 = startGrip.x();
			const y0 = startGrip.y();

			const x1 = endGrip.x();
			const y1 = endGrip.y();

			const h = this.height();
			const w = this.width();

			if (this.get("orientation") === "horizontal") {
				display.moveTo(0, 0);
				display.lineTo(x0, 0);
				display.lineTo(x0, h);
				display.lineTo(0, h);
				display.lineTo(0, 0);

				display.moveTo(x1, 0);
				display.lineTo(w, 0);
				display.lineTo(w, h);
				display.lineTo(x1, h);
				display.lineTo(x1, 0);
			}
			else {
				display.moveTo(0, 0);
				display.lineTo(0, y0);
				display.lineTo(w, y0);
				display.lineTo(w, 0);
				display.lineTo(0, 0);

				display.moveTo(0, y1);
				display.lineTo(0, h);
				display.lineTo(w, h);
				display.lineTo(w, y1);
				display.lineTo(0, y1);
			}
		})
	}
}

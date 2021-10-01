import { Scrollbar, IScrollbarPrivate, IScrollbarSettings } from "../../core/render/Scrollbar";
import { XYChart } from "./XYChart";
import { Graphics } from "../../core/render/Graphics";
import * as $utils from "../../core/util/Utils";

export interface IXYChartScrollbarSettings extends IScrollbarSettings {

}

export interface IXYChartScrollbarPrivate extends IScrollbarPrivate {
}

/**
 * Creates a scrollbar with chart preview in it.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/scrollbars/#Scrollbar_with_chart_preview} for more info
 * @important
 */
export class XYChartScrollbar extends Scrollbar {

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
		this._addOrientationClass();
		this._settings.themeTags = $utils.mergeTags(this._settings.themeTags, ["scrollbar", "xy", "chart", this._settings.orientation]);

		const children = this.children;
		children.moveValue(this.thumb);
		children.moveValue(this.startGrip);
		children.moveValue(this.endGrip);

		this.thumb.set("opacity", 0);
		this.thumb.states.create("hover", { opacity: 0.2 });

		const plotContainer = this.chart.plotContainer;
		plotContainer.set("interactive", false);
		plotContainer.remove("background");
		plotContainer.children.removeValue(this.chart.zoomOutButton);

		super._afterNew();
	}

	protected _updateThumb() {
		super._updateThumb();

		this.overlay.set("draw", (display) => {
			const startGrip = this.startGrip;
			const endGrip = this.endGrip;

			let x0 = startGrip.x();
			let y0 = startGrip.y();

			let x1 = endGrip.x();
			let y1 = endGrip.y();

			const h = this.height();
			const w = this.width();

			if (x0 > x1) {
				[x0, x1] = [x1, x0]
			}

			if (y0 > y1) {
				[y0, y1] = [y1, y0]
			}

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

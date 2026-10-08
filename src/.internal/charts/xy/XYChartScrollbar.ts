import { Scrollbar, IScrollbarPrivate, IScrollbarSettings } from "../../core/render/Scrollbar";
import { XYChart } from "./XYChart";
import { Graphics } from "../../core/render/Graphics";
import * as $utils from "../../core/util/Utils";

export interface IXYChartScrollbarSettings extends IScrollbarSettings {

}

export interface IXYChartScrollbarPrivate extends IScrollbarPrivate {
}

/**
 * A scrollbar with a small preview chart in it. Add axes and series to its
 * `chart` to draw the preview.
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
	 * The preview chart inside the scrollbar. It does not react to the
	 * pointer.
	 */
	public readonly chart: XYChart = this.children.push(XYChart.new(this._root, {
		themeTags: ["chart"],
		interactive: false,
		interactiveChildren: false,
		panX: false,
		panY: false,
		wheelX: "none",
		wheelY: "none"
	}))._markC("interactive", "interactiveChildren", "panX", "panY", "wheelX", "wheelY");

	/**
	 * Shading drawn over the parts of the preview outside the selected range.
	 */
	public readonly overlay: Graphics = this.children.push(Graphics.new(this._root, {
		themeTags: ["overlay"],
		interactive: false
	})._markC("interactive"));

	protected _afterNew() {
		this._addOrientationClass();
		this._settings.themeTags = $utils.mergeTags(this._settings.themeTags, ["scrollbar", "xy", "chart", this._settings.orientation]);

		const children = this.children;
		children.moveValue(this.thumb);
		children.moveValue(this.startGrip);
		children.moveValue(this.endGrip);

		this.thumb._setC("opacity", 0);
		this.thumb.states._createC("hover", { opacity: 0.2 });

		const plotContainer = this.chart.plotContainer;
		plotContainer._setC("interactive", false);
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

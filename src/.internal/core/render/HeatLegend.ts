import type { IPoint } from "../../core/util/IPoint";

import { Container, IContainerSettings, IContainerPrivate } from "./Container";
import { Label } from "../../core/render/Label";
import { percent, p100 } from "../../core/util/Percent";
import { RoundedRectangle } from "../../core/render/RoundedRectangle";
import { Template } from "../../core/util/Template";
import { ListTemplate } from "../../core/util/List";
import { Color } from "../../core/util/Color";
import { Tooltip } from "../../core/render/Tooltip";
import { LinearGradient } from "../../core/render/gradients/LinearGradient";

import * as $utils from "../../core/util/Utils";
import * as $type from "../../core/util/Type";

export interface IHeatLegendSettings extends IContainerSettings {

	/**
	 * Color at the start of the scale (the lowest value).
	 */
	startColor: Color;

	/**
	 * Color at the end of the scale (the highest value).
	 */
	endColor: Color;

	/**
	 * Opacity at the start of the scale (the lowest value).
	 *
	 * @default 1
	 * @since 5.14.0
	 */
	startOpacity?: number;

	/**
	 * Opacity at the end of the scale (the highest value).
	 *
	 * @default 1
	 * @since 5.14.0
	 */
	endOpacity?: number;

	/**
	 * The lowest value, at the start of the scale.
	 */
	startValue?: number;

	/**
	 * The highest value, at the end of the scale.
	 */
	endValue?: number;

	/**
	 * Text of the start label. If not set, it shows `startValue`.
	 */
	startText?: string;

	/**
	 * Text of the end label. If not set, it shows `endValue`.
	 */
	endText?: string;

	/**
	 * Number of color steps. At `1` the scale is a smooth gradient.
	 *
	 * @default 1
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/legend/heat-legend/#Gradient_or_steps} for more info
	 */
	stepCount?: number;

	/**
	 * Orientation of the scale: `"horizontal"` runs from start on the left to
	 * end on the right, `"vertical"` from start at the bottom to end at the top.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/legend/heat-legend/#Orientation} for more info
	 */
	orientation: "horizontal" | "vertical";

}

export interface IHeatLegendPrivate extends IContainerPrivate {
}

/**
 * A legend that shows a color scale from `startColor` to `endColor`, with the
 * values at its ends.
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/legend/heat-legend/} for more info
 */
export class HeatLegend extends Container {

	/**
	 * The [[Container]] that holds the start and end labels.
	 */
	public readonly labelContainer: Container = this.children.push(Container.new(this._root, {}));

	/**
	 * The [[Container]] that holds the markers.
	 */
	public readonly markerContainer: Container = this.children.push(Container.new(this._root, {}));

	/**
	 * The [[Label]] at the start of the scale.
	 */
	public readonly startLabel: Label = this.labelContainer.children.push(Label.new(this._root, { themeTags: ["start"] }));

	/**
	 * The [[Label]] at the end of the scale.
	 */
	public readonly endLabel: Label = this.labelContainer.children.push(Label.new(this._root, { themeTags: ["end"] }));

	public static className: string = "HeatLegend";
	public static classNames: Array<string> = Container.classNames.concat([HeatLegend.className]);

	declare public _settings: IHeatLegendSettings;
	declare public _privateSettings: IHeatLegendPrivate;


	protected _afterNew() {
		this._settings.themeTags = $utils.mergeTags(this._settings.themeTags, ["heatlegend", this._settings.orientation]);
		super._afterNew();
		this._setC("tooltip", Tooltip.new(this._root, {
			themeTags: ["heatlegend"]
		}));
	}

	/**
	 * @ignore
	 */
	public makeMarker(): RoundedRectangle {
		const marker = this.markers.make();
		marker.states.create("disabled", {});
		return marker;
	}

	/**
	 * The rectangles that make up the scale: one per step, or one with a
	 * gradient when `stepCount` is `1`.
	 */
	public readonly markers: ListTemplate<RoundedRectangle> = this.addDisposer(new ListTemplate(
		Template.new({}),
		() => RoundedRectangle._new(this._root, {
			themeTags: $utils.mergeTags(this.markers.template.get("themeTags", []), [this.get("orientation"), "heatlegend", "marker"])
		}, [this.markers.template])
	));


	/**
	 * Shows the tooltip, pointing at a value on the scale.
	 *
	 * @param  value  Value to point at
	 * @param  text   Tooltip text; the formatted value if not given
	 * @param  color  Tooltip background color; the value's color on the scale if not given
	 */
	public showValue(value: number, text?: string, color?: Color) {
		const tooltip = this.getTooltip();
		if (tooltip && $type.isNumber(value)) {

			const startValue = this.get("startValue", 0);
			const endValue = this.get("endValue", 1);

			let c = (value - startValue) / (endValue - startValue);

			if(c == Infinity || c == -Infinity || isNaN(c)) {
				c = 0.5;
			}

			const startColor = this.get("startColor")!;
			const endColor = this.get("endColor")!;

			if (!text) {
				text = this.getNumberFormatter().format(value);
			}

			if (!color) {
				color = Color.interpolate(c, startColor, endColor);
			}

			tooltip.label.set("text", text);
			let p:IPoint;

			if (this.get("orientation") == "vertical") {
				p = this.markerContainer.toGlobal({ x: 0, y: this.innerHeight() * (1 - c) });
			}
			else {
				p = this.markerContainer.toGlobal({ x: this.innerWidth() * c, y: 0 });
			}

			let background = tooltip.get("background");
			if (background) {
				background.set("fill", color)
			}
			tooltip.set("pointTo", p);
			tooltip.show();
		}
	}

	public _prepareChildren() {
		super._prepareChildren();

		const labelContainer = this.labelContainer;
		const orientation = this.get("orientation");
		const startLabel = this.startLabel;
		const endLabel = this.endLabel;
		const tooltip = this.getTooltip();

		if (this.isDirty("orientation")) {
			if (orientation == "vertical") {
				this.markerContainer._setCAll({ layout: this._root.verticalLayout, height: p100 });
				this._setC("layout", this._root.horizontalLayout);
				startLabel._setCAll({ y: p100, x: undefined, centerY: p100, centerX: p100 });
				endLabel._setCAll({ y: 0, x: undefined, centerY: 0, centerX: p100 });
				labelContainer._setCAll({ height: p100, width: undefined });
				if (tooltip) {
					tooltip._setC("pointerOrientation", "horizontal");
				}
			}
			else {
				this.markerContainer._setCAll({ layout: this._root.horizontalLayout, width: p100 });
				this._setC("layout", this._root.verticalLayout);
				startLabel._setCAll({ x: 0, y: undefined, centerX: 0, centerY: 0 });
				endLabel._setCAll({ x: p100, y: undefined, centerX: p100, centerY: 0 });
				labelContainer._setCAll({ width: p100, height: undefined });
				if (tooltip) {
					tooltip._setC("pointerOrientation", "vertical");
				}
			}
		}

		// The markers (colors, opacities, gradient rotation, step order) are all
		// (re)built here, so rebuild on any of the settings they depend on — not
		// just `stepCount`.
		if (this.isDirty("stepCount") || this.isDirty("startColor") || this.isDirty("endColor") || this.isDirty("startOpacity") || this.isDirty("endOpacity") || this.isDirty("orientation")) {
			const stepCount = this.get("stepCount", 1);
			const startColor = this.get("startColor")!;
			const endColor = this.get("endColor")!;

			const startOpacity = this.get("startOpacity", 1);
			const endOpacity = this.get("endOpacity", 1);

			this.markerContainer.children.clear();
			if (stepCount > 1) {
				for (let i = 0; i < stepCount; i++) {
					const marker = this.makeMarker();

					if (orientation == "vertical") {
						this.markerContainer.children.moveValue(marker, 0);
					}
					else {
						this.markerContainer.children.push(marker);
					}

					if (startColor && endColor) {
						marker._setCAll({
							fill: Color.interpolate(i / stepCount, startColor, endColor),
							fillOpacity: percent(i / stepCount * 100).interpolate(startOpacity, endOpacity)
						});
					}
				}
			}
			else if (stepCount == 1) {
				const marker = this.makeMarker();
				this.markerContainer.children.push(marker);
				const gradient = LinearGradient.new(this._root, {
					stops: [{
						color: startColor,
						opacity: startOpacity
					}, {
						color: endColor,
						opacity: endOpacity
					}]
				});

				if (orientation == "vertical") {
					gradient.set("rotation", 90);
					let stops = gradient.get("stops");
					if (stops) {
						stops.reverse();
					}
				}
				else {
					gradient.set("rotation", 0);
				}
				if (startColor && endColor) {
					marker._setC("fillGradient", gradient);
				}
			}
		}

		if (this.isDirty("startText") || this.isDirty("startValue")) {
			startLabel._setC("text", this.get("startText", this.getNumberFormatter().format(this.get("startValue", 0))));
		}

		if (this.isDirty("endText") || this.isDirty("endValue")) {
			endLabel._setC("text", this.get("endText", this.getNumberFormatter().format(this.get("endValue", 1))))
		}
	}
}

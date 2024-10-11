import type { IPoint } from "../../core/util/IPoint";

import { Container, IContainerSettings, IContainerPrivate } from "./Container";
import { Label } from "../../core/render/Label";
import { p100 } from "../../core/util/Percent";
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
	 * Starting (lowest value) color.
	 */
	startColor: Color;

	/**
	 * Ending (highest value) color.
	 */
	endColor: Color;

	/**
	 * Start (lowest) value.
	 */
	startValue?: number;

	/**
	 * End (highest) value.
	 */
	endValue?: number;

	/**
	 * Text for start label.
	 */
	startText?: string;

	/**
	 * Text for end label.
	 */
	endText?: string;

	/**
	 * Number of steps
	 *
	 * @default 1
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/legend/heat-legend/#Gradient_or_steps} for more info
	 */
	stepCount?: number;

	/**
	 * Orientation of the heat legend.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/legend/heat-legend/#Orientation} for more info
	 */
	orientation: "horizontal" | "vertical";

}

export interface IHeatLegendPrivate extends IContainerPrivate {
}

/**
 * Heat legend.
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/legend/heat-legend/} for more info
 */
export class HeatLegend extends Container {

	/**
	 * A [[Container]] that all labels are placed in.
	 *
	 * @default Container.new()
	 */
	public readonly labelContainer: Container = this.children.push(Container.new(this._root, {}));

	/**
	 * A [[Container]] that all markers are placed in.
	 *
	 * @default Container.new()
	 */
	public readonly markerContainer: Container = this.children.push(Container.new(this._root, {}));

	/**
	 * A start [[Label]].
	 *
	 * @default Label.new()
	 */
	public readonly startLabel: Label = this.labelContainer.children.push(Label.new(this._root, { themeTags: ["start"] }));

	/**
	 * An end [[Label]].
	 *
	 * @default Label.new()
	 */
	public readonly endLabel: Label = this.labelContainer.children.push(Label.new(this._root, { themeTags: ["end"] }));

	public static className: string = "HeatLegend";
	public static classNames: Array<string> = Container.classNames.concat([HeatLegend.className]);

	declare public _settings: IHeatLegendSettings;
	declare public _privateSettings: IHeatLegendPrivate;


	protected _afterNew() {
		this._settings.themeTags = $utils.mergeTags(this._settings.themeTags, ["heatlegend", this._settings.orientation]);
		super._afterNew();
		this.set("tooltip", Tooltip.new(this._root, {
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
	 * List of rectangle elements used for default legend markers.
	 *
	 * @default new ListTemplate<RoundedRectangle>
	 */
	public readonly markers: ListTemplate<RoundedRectangle> = this.addDisposer(new ListTemplate(
		Template.new({}),
		() => RoundedRectangle._new(this._root, {
			themeTags: $utils.mergeTags(this.markers.template.get("themeTags", []), [this.get("orientation"), "heatlegend", "marker"])
		}, [this.markers.template])
	));


	/**
	 * Moves and shows tooltip at specific value.
	 *
	 * Can also specify optional text to show in tooltip, as well as the color.
	 *
	 * @param  value  Value
	 * @param  text   Text
	 * @param  color  Color
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
				this.markerContainer.setAll({ layout: this._root.verticalLayout, height: p100 });
				this.set("layout", this._root.horizontalLayout);
				startLabel.setAll({ y: p100, x: undefined, centerY: p100, centerX: p100 });
				endLabel.setAll({ y: 0, x: undefined, centerY: 0, centerX: p100 });
				labelContainer.setAll({ height: p100, width: undefined });
				if (tooltip) {
					tooltip.set("pointerOrientation", "horizontal");
				}
			}
			else {
				this.markerContainer.setAll({ layout: this._root.horizontalLayout, width: p100 });
				this.set("layout", this._root.verticalLayout);
				startLabel.setAll({ x: 0, y: undefined, centerX: 0, centerY: 0 });
				endLabel.setAll({ x: p100, y: undefined, centerX: p100, centerY: 0 });
				labelContainer.setAll({ width: p100, height: undefined });
				if (tooltip) {
					tooltip.set("pointerOrientation", "vertical");
				}
			}
		}

		if (this.isDirty("stepCount")) {
			const stepCount = this.get("stepCount", 1);
			const startColor = this.get("startColor")!;
			const endColor = this.get("endColor")!;
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
						marker.set("fill", Color.interpolate(i / stepCount, startColor, endColor));
					}
				}
			}
			else if (stepCount == 1) {
				const marker = this.makeMarker();
				this.markerContainer.children.push(marker);
				const gradient = LinearGradient.new(this._root, { stops: [{ color: startColor }, { color: endColor }] });

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
					marker.set("fillGradient", gradient);
				}
			}
		}

		if (this.isDirty("startText") || this.isDirty("startValue")) {
			startLabel.set("text", this.get("startText", this.getNumberFormatter().format(this.get("startValue", 0))));
		}

		if (this.isDirty("endText") || this.isDirty("endValue")) {
			endLabel.set("text", this.get("endText", this.getNumberFormatter().format(this.get("endValue", 1))))
		}
	}
}

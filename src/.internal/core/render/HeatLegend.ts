import { Container, IContainerSettings, IContainerPrivate } from "./Container";
import type { Root } from "../../core/Root";
import { Label } from "../../core/render/Label";
import { p100 } from "../../core/util/Percent";
import { RoundedRectangle } from "../../core/render/RoundedRectangle";
import { Template } from "../../core/util/Template";
import { Color } from "../../core/util/Color";
import * as $utils from "../../core/util/Utils";
import type { IPoint } from "../../core/util/IPoint";
import { Tooltip } from "../../core/render/Tooltip";
import { LinearGradient } from "../../core/render/gradients/LinearGradient";

export interface IHeatLegendSettings extends IContainerSettings {
	startColor: Color;
	endColor: Color;
	startValue?: number;
	endValue?: number;
	startText?: string;
	endText?: string;
	stepCount?: number;
	orientation: "horizontal" | "vertical";
}

export interface IHeatLegendPrivate extends IContainerPrivate {
}

export class HeatLegend extends Container {

	/**
	 * Use this method to create an instance of this class.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/getting-started/#New_element_syntax} for more info
	 * @param   root      Root element
	 * @param   settings  Settings
	 * @param   template  Template
	 * @return            Instantiated object
	 */
	public static new(root: Root, settings: HeatLegend["_settings"], template?: Template<HeatLegend>): HeatLegend {
		settings.themeTags = $utils.mergeTags(settings.themeTags, ["heatlegend", settings.orientation]);
		const x = new HeatLegend(root, settings, true, template);
		x._afterNew();
		return x;
	}

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
		super._afterNew();
		this.set("tooltip", Tooltip.new(this._root, {
			themeTags: ["heatlegend"]
		}));
	}

	/**
	 * A template that can be used to configure heat legend's markers.
	 */
	public readonly markerTemplate: Template<Container> = Template.new({});

	/**
	 * @ignore
	 */
	public makeMarker(): Container {
		const tags = this.markerTemplate.get("themeTags", []);
		const marker = Container.new(this._root, {
			themeTags: $utils.mergeTags(tags, [this.get("orientation"), "heatlegend", "marker"]),
			background: RoundedRectangle.new(this._root, {
				themeTags: $utils.mergeTags(tags, [this.get("orientation"), "heatlegend", "marker", "background"])
			})
		}, this.markerTemplate);
		marker.states.create("disabled", {});
		console.log(marker.get("themeTags"))
		return marker;
	}

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
		if (tooltip) {

			const startValue = this.get("startValue", 0);
			const endValue = this.get("endValue", 1);

			const c = (value - startValue) / (endValue - startValue);
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
				background.set("fill", Color.interpolate(c, startColor, endColor))
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
					const bg = marker.get("background");

					if (orientation == "vertical") {
						this.markerContainer.children.moveValue(marker, 0);
					}
					else {
						this.markerContainer.children.push(marker);
					}

					if (bg && startColor && endColor) {
						bg.set("fill", Color.interpolate(i / stepCount, startColor, endColor));
					}
				}
			}
			else if (stepCount == 1) {
				const marker = this.makeMarker();
				this.markerContainer.children.push(marker);
				const bg = marker.get("background");
				const gradient = LinearGradient.new(this._root, { stops: [{ color: startColor }, { color: endColor }] });

				if (orientation == "vertical") {
					gradient.set("rotation", 90);
					let stops = gradient.get("stops");
					if (stops) {
						stops.reverse();
					}
				}
				if (bg && startColor && endColor) {
					bg.set("fillGradient", gradient);
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

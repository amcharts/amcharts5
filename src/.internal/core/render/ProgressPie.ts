import { Label } from "../../core/render/Label";
import { Container, IContainerPrivate, IContainerSettings } from "../../core/render/Container";
import { Slice } from "../../core/render/Slice";
import { p100, percent, Percent } from "../../core/util/Percent";
import { Circle } from "./Circle";

import * as $utils from "../../core/util/Utils";

export interface IProgressPieSettings extends IContainerSettings {
	/**
	 * Progress from `0` to `1`.
	 */
	value?: number; // 0 - 1
	/**
	 * Outer radius in pixels, or as a percent of half the smaller of the
	 * pie's width and height.
	 */
	radius?: number | Percent;
	/**
	 * Inner radius in pixels, or as a percent of `radius`.
	 */
	innerRadius?: number | Percent;
	/**
	 * Number format for the label, which shows `value` times 100.
	 */
	numberFormat?: string;
}

export interface IProgressPiePrivate extends IContainerPrivate {
}

/**
 * A ring that fills clockwise from the top as `value` goes from `0` to `1`,
 * with the percent shown in the middle.
 *
 * @important
 * @since 5.14.0
 */
export class ProgressPie extends Container {

	/**
	 * The circle behind the ring.
	 */
	public circle: Circle = this.children.push(Circle.new(this._root, {
		themeTags: ["background"]
	}));

	/**
	 * The label in the middle that shows the percent.
	 */
	public label: Label = this.children.push(Label.new(this._root, {}));

	/**
	 * The slice that shows the progress.
	 */
	public slice: Slice = this.children.push(Slice.new(this._root, { isMeasured: false }));

	/**
	 * The full ring behind `slice`.
	 */
	public backgroundSlice: Slice = this.children.push(Slice.new(this._root, { themeTags: ["background"] }));

	protected _afterNew() {
		this.addTag("progresspie");

		super._afterNew();
	}

	declare public _settings: IProgressPieSettings;
	declare public _privateSettings: IProgressPiePrivate;

	public static className: string = "ProgressPie";
	public static classNames: Array<string> = Container.classNames.concat([ProgressPie.className]);


	public _updateChildren(): void {
		super._updateChildren();

		if (this.isDirty("width") || this.isDirty("height") || this.isDirty("radius") || this.isDirty("innerRadius")) {
			const width = this.innerWidth();
			const height = this.innerHeight();

			const radius = $utils.relativeToValue(this.get("radius", p100), Math.min(width, height) / 2);
			const innerRadius = $utils.relativeToValue(this.get("innerRadius", percent(80)), radius);

			this.slice.setAll({
				radius: radius,
				innerRadius: innerRadius,
			});

			this.backgroundSlice.setAll({
				radius: radius,
				innerRadius: innerRadius,
			});

			this.circle.set("radius", radius);
		}

		if (this.isDirty("value")) {
			const value = this.get("value", 0);
			this.slice.set("arc", value * 360);
			this.backgroundSlice.set("arc", 360);

			this.label.setAll({
				text: this.getNumberFormatter().format(value * 100, this.get("numberFormat", "#'"))
			});

			this.root.events.once("frameended", () => {
				this.label.markDirtyKey("text");
			})
		}
	}
}

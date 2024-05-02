// import * as $object from "../util/Object";
import { p50, Percent } from "../util/Percent";
import { Label, ILabelPrivate, ILabelSettings } from "./Label";
import { RadialText } from "./RadialText";

import * as $math from "../util/Math";
import * as $utils from "../util/Utils";


export interface IRadialLabelSettings extends ILabelSettings {

	/**
	 * Pixel value to adjust radius with.
	 *
	 * Will add to (or subtract from if negative) whatever value `baseRadius` evaluates
	 * to.
	 */
	radius?: number;

	/**
	 * Radius of the label's position.
	 *
	 * Can be either set in absolute pixel value, or percent.
	 *
	 * Relative value, depending on the situation, will most often mean its
	 * position within certain circular object, like a slice: 0% meaning inner
	 * edge, and 100% - the outer edge.
	 *
	 * @default 100%
	 */
	baseRadius?: number | Percent;

	/**
	 * Label anngle in degrees.
	 *
	 * In most cases it will be set by the chart/series and does not need to
	 * be set manually.
	 */
	labelAngle?: number;

	/**
	 * Should the text "face" inward or outward from the arc the text is
	 * following.
	 *
	 * `"auto"` means that facing will be chosen automatically based on the angle
	 * to enhance readbility.
	 *
	 * Only applies if `type = "circluar"`.
	 * 
	 * @default "auto"
	 */
	orientation?: "inward" | "outward" | "auto";

	/**
	 * Should label be drawn inside (`true`) or outside (`false`) the arc.
	 *
	 * @default false
	 */
	inside?: boolean;

	/**
	 * Label type.
	 *
	 * * `"regular"` (default) - normal horizontal label.
	 * * `"circular"` - arched label.
	 * * `"radial"` - label radiating from the center of the arc.
	 * * `"aligned"` - horizontal label aligned with other labels horizontally.
	 * * `"adjusted"` - horizontal label adjusted in postion.
	 *
	 * **IMPORTANT!** If the label is used in a [[PieSeries]], its `alignLabels` setting
	 * (default: `true`) takes precedence over `textType`. If you need to set this
	 * to anything else than `regular`, make sure you also set `alignLabels: falese` on
	 * `PieSeries`.
	 *
	 * @default "regular"
	 */
	textType?: "regular" | "circular" | "radial" | "aligned" | "adjusted";

	/**
	 * Extra spacing between characters, in pixels.
	 *
	 * @default 0
	 */
	kerning?: number;

}

export interface IRadialLabelPrivate extends ILabelPrivate {

	/**
	 * @ignore
	 */
	left?: boolean;

	/**
	 * @ignore
	 */
	radius?: number;

	/**
	 * @ignore
	 */
	innerRadius?: number;

}

export class RadialLabel extends Label {

	declare public _settings: IRadialLabelSettings;
	declare public _privateSettings: IRadialLabelPrivate;

	declare protected _text: RadialText;

	public static className: string = "RadialLabel";
	public static classNames: Array<string> = Label.classNames.concat([RadialLabel.className]);

	protected _flipped: boolean = false;

	protected _afterNew() {
		this._textKeys.push("textType", "kerning");
		super._afterNew();
	}


	public _makeText() {
		this._text = this.children.push(RadialText.new(this._root, {}));
	}

	/**
	 * Returns base radius in pixels.
	 * 
	 * @return Base radius
	 */
	public baseRadius(): number {
		const radiusPrivate = this.getPrivate("radius", 0);
		const innerRadiusPrivate = this.getPrivate("innerRadius", 0);
		const baseRadius = this.get("baseRadius", 0);
		return innerRadiusPrivate + $utils.relativeToValue(baseRadius, radiusPrivate - innerRadiusPrivate);
	}

	/**
	 * Returns radius adjustment in pixels.
	 * 
	 * @return Radius
	 */
	public radius(): number {
		const inside = this.get("inside", false);
		return this.baseRadius() + this.get("radius", 0) * (inside ? -1 : 1);
	}

	public _updateChildren() {
		super._updateChildren();

		if (this.isDirty("baseRadius") || this.isPrivateDirty("radius") || this.isPrivateDirty("innerRadius") || this.isDirty("labelAngle") || this.isDirty("radius") || this.isDirty("inside") || this.isDirty("orientation") || this.isDirty("textType")) {

			const textType = this.get("textType", "adjusted");

			const inside = this.get("inside", false);

			const orientation = this.get("orientation");
			let labelAngle = $math.normalizeAngle(this.get("labelAngle", 0));

			this._text.set("startAngle", this.get("labelAngle", 0));
			this._text.set("inside", inside);

			const sin = $math.sin(labelAngle);
			const cos = $math.cos(labelAngle);

			let baseRadius = this.baseRadius();
			let radius = this.radius();

			this._display.angle = 0;

			if (textType == "circular") {

				this.setAll({
					paddingTop: 0,
					paddingBottom: 0,
					paddingLeft: 0,
					paddingRight: 0
				});

				this.setRaw("x", undefined);
				this.setRaw("y", undefined);				

				// Circular labels are handled and positioned differently

				this._text.set("orientation", orientation);
				this._text.set("radius", radius);

			}
			else {
				if (baseRadius == 0) {
					labelAngle = 0;
					radius = 0;
				}

				// Positioning of radial/regular labels are teh same
				let x = radius * cos;
				let y = radius * sin;

				if (textType == "radial") {

					this.setRaw("x", x);
					this.setRaw("y", y);

					if ((labelAngle < 90) || (labelAngle > 270) || orientation != "auto") {
						this._display.angle = labelAngle;// + 90;
						this._flipped = false;
					}
					else {
						this._display.angle = labelAngle + 180;
						this._flipped = true;
					}
					this._dirty.rotation = false;
				}
				else if (textType == "adjusted") {
					this.setRaw("centerX", p50);
					this.setRaw("centerY", p50);
					this.setRaw("x", x);
					this.setRaw("y", y);
				}
				else if (textType == "regular") {
					this.setRaw("x", x);
					this.setRaw("y", y);
				}
			}

			this.markDirtyPosition();
			this.markDirtyBounds();
		}
	}


	public _updatePosition() {

		const textType = this.get("textType", "regular");
		const inside = this.get("inside", false);

		let dx = 0;
		let dy = 0;
		let labelAngle = this.get("labelAngle", 0);
		let bounds = this.localBounds();
		let w = bounds.right - bounds.left;
		let h = bounds.bottom - bounds.top;

		if (textType == "radial") {
			if (this._flipped) {
				let centerX = this.get("centerX");
				if (centerX instanceof Percent) {
					w = w * (1 - centerX.value * 2);
				}

				dx = w * $math.cos(labelAngle);
				dy = w * $math.sin(labelAngle);
			}
		}
		else if (!inside && textType == "adjusted") {
			dx = w / 2 * $math.cos(labelAngle);
			dy = h / 2 * $math.sin(labelAngle);
		}


		this.setRaw("dx", dx);
		this.setRaw("dy", dy);

		super._updatePosition();
	}

	/**
	 * @ignore
	 */
	public get text(): RadialText {
		return this._text;
	}

}

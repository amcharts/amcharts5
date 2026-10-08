// import * as $object from "../util/Object";
import { p50, Percent } from "../util/Percent";
import { Label, ILabelPrivate, ILabelSettings } from "./Label";
import { RadialText } from "./RadialText";

import * as $math from "../util/Math";
import * as $utils from "../util/Utils";


export interface IRadialLabelSettings extends ILabelSettings {

	/**
	 * Distance in pixels from `baseRadius`: outward, or inward when `inside`
	 * is `true`. A negative value goes the other way.
	 */
	radius?: number;

	/**
	 * Where the label sits across the arc it belongs to, such as a slice: a
	 * percent, `0%` being the inner edge and `100%` the outer one, or pixels
	 * from the inner edge.
	 *
	 * @default 100%
	 */
	baseRadius?: number | Percent;

	/**
	 * Angle in degrees of the label's position around the center: `0` points
	 * right, and angles grow clockwise. Usually set by the series.
	 */
	labelAngle?: number;

	/**
	 * Which way the text faces with `textType` `"circular"`: `"inward"`,
	 * `"outward"`, or `"auto"` to pick whichever reads better at its angle.
	 * With `"radial"`, `"auto"` turns text on the left half so that it does
	 * not read upside down.
	 *
	 * @default "auto"
	 */
	orientation?: "inward" | "outward" | "auto";

	/**
	 * Places the label inside the arc instead of outside: `radius` then counts
	 * inward.
	 *
	 * @default false
	 */
	inside?: boolean;

	/**
	 * How the label is placed:
	 *
	 * * `"regular"` - horizontal, at its position on the arc.
	 * * `"circular"` - curved along the arc.
	 * * `"radial"` - rotated to run along the radius.
	 * * `"aligned"` - horizontal, lined up in columns with the other labels.
	 * * `"adjusted"` - horizontal, moved outward so that its edge, not its
	 *   center, is at its position.
	 *
	 * **IMPORTANT!** In a [[PieSeries]], `alignLabels` (`true` by default)
	 * overrides `textType`. To use a type other than `"aligned"`, also set
	 * `alignLabels: false` on the series.
	 *
	 * @default "regular"
	 */
	textType?: "regular" | "circular" | "radial" | "aligned" | "adjusted";

	/**
	 * Extra spacing between characters in pixels, for `"circular"` text.
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

/**
 * A label placed around a center at an angle and radius, such as a pie
 * slice's label. It can also curve along the arc (`textType`).
 */
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
	 * Returns the radius in pixels that `baseRadius` points to.
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
	 * Returns the label's radius in pixels: the base radius plus the `radius`
	 * adjustment.
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

				// a circular label positions itself, so this is the label's own doing
				this._setCAll({
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


		// the label placing itself along its radius
		this._setCRaw("dx", dx);
		this._setCRaw("dy", dy);

		super._updatePosition();
	}

	/**
	 * @ignore
	 */
	public get text(): RadialText {
		return this._text;
	}

}

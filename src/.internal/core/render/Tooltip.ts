import type { Root } from "../Root";
import type { IBounds } from "../util/IBounds";
import { Label } from "../render/Label";
import { PointedRectangle } from "../render/PointedRectangle";
import { Container, IContainerPrivate, IContainerSettings } from "./Container";
import type { IPoint } from "../util/IPoint";
import type { Pattern } from "../render/patterns/Pattern";
import * as $math from "../util/Math";
import * as $array from "../util/Array";
import * as $utils from "../util/Utils";
import { Percent } from "../util/Percent";
import type { Time } from "../util/Animation";
import type { Sprite } from "../render/Sprite";
import type { Template } from "../../core/util/Template";
import type { MultiDisposer, IDisposer } from "../util/Disposer";
import { Color } from "../util/Color";
//import * as $utils from "../util/Utils";



export interface ITooltipSettings extends IContainerSettings {

	/**
	 * A direction of the tooltip pointer.
	 *
	 * https://www.amcharts.com/docs/v5/concepts/common-elements/tooltips/#Orientation
	 */
	pointerOrientation?: "left" | "right" | "up" | "down" | "vertical" | "horizontal";

	/**
	 * If set to `true` will use the same `fill` color for its background as
	 * its `tooltipTarget`.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/common-elements/tooltips/#Colors} for more info
	 * @defaul false
	 */
	getFillFromSprite?: boolean;

	/**
	 * If set to `true` will use the same `fill` color as its `tooltipTarget`.
	 * 
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/common-elements/tooltips/#Colors} for more info
	 * @defaul false
	 */
	getLabelFillFromSprite?: boolean;

	/**
	 * If set to `true` will use the same `stroke` color as its `tooltipTarget`.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/common-elements/tooltips/#Colors} for more info
	 * @default false
	 */
	getStrokeFromSprite?: boolean;

	/**
	 * Scree bounds to constring tooltip within.
	 */
	bounds?: IBounds;

	/**
	 * If set to `true` tooltip will adjust its text color for better visibility
	 * on its background.
	 *
	 * @default true
	 */
	autoTextColor?: boolean;

	/**
	 * Screen coordinates the tooltip show point to.
	 */
	pointTo?: IPoint;

	/**
	 * Duration in milliseconds for tooltip position change, e.g. when tooltip
	 * is jumping from one target to another.
	 */
	animationDuration?: number;

	/**
	 * Easing function for tooltip animation.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/animations/#Easing_functions} for more info
	 */
	animationEasing?: (t: Time) => Time;

	/**
	 * A target element tooltip is shown fow.
	 */
	tooltipTarget?: Sprite;

}

export interface ITooltipPrivate extends IContainerPrivate {
}

/**
 * Creates a tooltip.
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/common-elements/tooltips/} for more info
 * @important
 */
export class Tooltip extends Container {

	protected _arrangeDisposer: MultiDisposer | undefined;

	public _fx: number = 0;
	public _fy: number = 0;

	/**
	 * Use this method to create an instance of this class.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/getting-started/#New_element_syntax} for more info
	 * @param   root      Root element
	 * @param   settings  Settings
	 * @param   template  Template
	 * @return            Instantiated object
	 */
	public static new(root: Root, settings: Tooltip["_settings"], template?: Template<Tooltip>): Tooltip {
		settings.themeTags = $utils.mergeTags(settings.themeTags, ["tooltip"]);
		const x = new Tooltip(root, settings, true, template);
		x._afterNew();
		return x;
	}

	declare public _settings: ITooltipSettings;
	declare public _privateSettings: ITooltipPrivate;

	protected _label!: Label;
	public static className: string = "Tooltip";
	public static classNames: Array<string> = Container.classNames.concat([Tooltip.className]);

	protected _fillDp: IDisposer | undefined;
	protected _strokeDp: IDisposer | undefined;
	protected _labelDp: IDisposer | undefined;

	protected _afterNew() {
		super._afterNew();

		this.set("background", PointedRectangle.new(this._root, {
			themeTags: ["tooltip", "background"]
		}));

		this._label = this.children.push(Label.new(this._root, {}));

		this._disposers.push(this._label.events.on("boundschanged", () => {
			this._updateBackground();
		}))

		this.on("bounds", () => {
			this._updateBackground();
		})

		this._updateTextColor();

		this._root.tooltipContainer.children.push(this);
		this.hide(0);

		this._root._tooltips.push(this);
	}

	/**
	 * A [[Label]] element for the tooltip.
	 *
	 * @readonly
	 * @return Label
	 */
	public get label(): Label {
		return this._label;
	}

	/**
	 * Permanently disposes the tooltip.
	 */
	public dispose() {
		super.dispose();
		$array.remove(this._root._tooltips, this);
	}

	public _changed() {
		super._changed();

		// if (this.isDirty("textProperties")) {
		// 	let properties = this.get("textProperties")!;
		// 	if (properties) {
		// 		this._text.setAll(properties);
		// 	}
		// }

		if (this.isDirty("pointTo")) {

			let pointTo = this.get("pointTo");
			let previous = this._prevSettings.pointTo;

			if (pointTo && previous && previous.x == pointTo.x && previous.y == pointTo.y) {
				// void
			}
			else {
				this._updateBackground();
			}

			// not good for maps
			//const pointTo = this.get("pointTo");
			//const parent = this.parent;
			//if (parent && pointTo && (pointTo.x < 0 || pointTo.x > parent.maxWidth() || pointTo.y < 0 || pointTo.y > parent.maxHeight())) {
			//	this.hide();
			//}
		}

		if (this.isDirty("tooltipTarget")) {
			this.updateBackgroundColor();
		}
	}

	protected _onShow() {
		super._onShow();
		this.updateBackgroundColor();
	}


	public updateBackgroundColor() {
		let tooltipTarget = this.get("tooltipTarget");
		const background = this.get("background");
		let fill: Color | undefined;
		let stroke: Color | undefined;


		if (tooltipTarget && background) {

			fill = tooltipTarget.get("fill" as any);
			stroke = tooltipTarget.get("stroke" as any);

			if (fill == null) {
				fill = stroke;
			}

			if (this.get("getFillFromSprite")) {

				if (this._fillDp) {
					this._fillDp.dispose();
				}

				if (fill != null) {
					background.set("fill", fill as any);
				}

				this._fillDp = tooltipTarget.on("fill" as any, (fill) => {
					if (fill != null) {
						background.set("fill", fill as any);
						this._updateTextColor(fill);
					}
				})
			}

			if (this.get("getStrokeFromSprite")) {

				if (this._strokeDp) {
					this._strokeDp.dispose();
				}

				if (fill != null) {
					background.set("stroke", fill as any);
				}

				this._strokeDp = tooltipTarget.on("fill" as any, (fill) => {
					if (fill != null) {
						background.set("stroke", fill as any);
					}
				})
			}

			if (this.get("getLabelFillFromSprite")) {

				if (this._labelDp) {
					this._labelDp.dispose();
				}

				if (fill != null) {
					this.label.set("fill", fill as any);
				}

				this._labelDp = tooltipTarget.on("fill" as any, (fill) => {
					if (fill != null) {
						this.label.set("fill", fill as any);
					}
				})
			}
		}

		this._updateTextColor(fill);
	}


	protected _updateTextColor(fill?: Color | Pattern) {
		if (this.get("autoTextColor")) {
			if (fill == null) {
				fill = this.get("background")!.get("fill") as Color;
			}

			if (fill == null) {
				fill = this._root.interfaceColors.get("background");
			}

			if (fill instanceof Color) {
				if ($utils.isLight(fill)) {
					this.label.set("fill", this._root.interfaceColors.get("text"));
				}
				else {
					this.label.set("fill", this._root.interfaceColors.get("alternativeText"));
				}
			}
		}
	}


	protected _updateBackground() {
		super.updateBackground();
		const parent = this._root.container;

		if (parent) {

			let cw = 0.5;
			let ch = 0.5;

			let centerX = this.get("centerX");
			if (centerX instanceof Percent) {
				cw = centerX.value;
			}

			let centerY = this.get("centerY");
			if (centerY instanceof Percent) {
				ch = centerY.value;
			}

			let parentW = parent.width();
			let parentH = parent.height();

			const bounds = this.get("bounds", { left: 0, top: 0, right: parentW, bottom: parentH });

			this._updateBounds();

			let w = this.width();
			let h = this.height();

			let pointTo = this.get("pointTo", { x: parentW / 2, y: parentH / 2 });
			let x = pointTo.x;
			let y = pointTo.y;

			let pointerOrientation = this.get("pointerOrientation");

			let background = this.get("background");
			let pointerLength = 0;
			if (background instanceof PointedRectangle) {
				pointerLength = background.get("pointerLength", 0);
			}

			let pointerX = 0;
			let pointerY = 0;

			let boundsW = bounds.right - bounds.left;
			let boundsH = bounds.bottom - bounds.top;

			// horizontal
			if (pointerOrientation == "horizontal" || pointerOrientation == "left" || pointerOrientation == "right") {
				if (pointerOrientation == "horizontal") {
					if (x > bounds.left + boundsW / 2) {
						x -= (w * (1 - cw) + pointerLength);
					}
					else {
						x += (w * cw + pointerLength);
					}
				}
				else if (pointerOrientation == "left") {
					x += (w * (1 - cw) + pointerLength);
				}
				else {
					x -= (w * cw + pointerLength);
				}
			}
			// vertical pointer
			else {
				if (pointerOrientation == "vertical") {
					if (y > bounds.top + h / 2 + pointerLength) {
						y -= (h * (1 - ch) + pointerLength);
					}
					else {
						y += (h * ch + pointerLength);
					}
				}
				else if (pointerOrientation == "down") {
					y -= (h * (1 - ch) + pointerLength);
				}
				else {
					y += (h * ch + pointerLength);
				}
			}

			x = $math.fitToRange(x, bounds.left + w * cw, bounds.left + boundsW - w * (1 - cw));
			y = $math.fitToRange(y, bounds.top + h * ch, bounds.top + boundsH - h * (1 - ch));

			pointerX = pointTo.x - x + w * cw;
			pointerY = pointTo.y - y + h * ch;

			this._fx = x;
			this._fy = y;

			const animationDuration = this.get("animationDuration", 0);
			if (animationDuration > 0 && this.get("visible") && this.get("opacity") > 0) {
				const animationEasing = this.get("animationEasing");
				this.animate({ key: "x", to: x, duration: animationDuration, easing: animationEasing });
				this.animate({ key: "y", to: y, duration: animationDuration, easing: animationEasing });
			}
			else {
				this.set("x", x);
				this.set("y", y);
			}

			if (background instanceof PointedRectangle) {
				background.set("pointerX", pointerX);
				background.set("pointerY", pointerY);
			}
		}
	}
}

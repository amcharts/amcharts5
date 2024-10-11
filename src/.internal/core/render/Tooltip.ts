import type { IBounds } from "../util/IBounds";
import type { IPoint } from "../util/IPoint";
import type { Pattern } from "../render/patterns/Pattern";
import type { Time } from "../util/Animation";
import type { Sprite } from "../render/Sprite";
import type { Graphics } from "../render/Graphics";
import type { IPointerEvent } from "../render/backend/Renderer";
import type { DataItem, IComponentDataItem } from "./Component";
import type { Root } from "../Root";
import type { Template } from "../util/Template";
import type { Entity } from "../util/Entity";

import { MultiDisposer, IDisposer } from "../util/Disposer";
import { Label } from "../render/Label";
import { PointedRectangle } from "../render/PointedRectangle";
import { Container, IContainerPrivate, IContainerSettings } from "./Container";
import { Percent } from "../util/Percent";
import { Color } from "../util/Color";

import * as $math from "../util/Math";
import * as $array from "../util/Array";
import * as $utils from "../util/Utils";


export interface ITooltipSettings extends IContainerSettings {

	/**
	 * Text to use for tooltip's label.
	 */
	labelText?: string;

	/**
	 * HTML content to use for tooltip's label.
	 *
	 * @since 5.2.11
	 */
	labelHTML?: string;

	/**
	 * A screen reader content for the label.
	 *
	 * Used in conjuction with `readerAnnounce`. If it is set to `true`, and
	 * `labelAriaLabel` is set, its contents will be read out by a screen reader
	 * when tooltip is shown or its data item changes.
	 *
	 * Otherwise, regular `labelText` (or `text` set directly on tooltip label) will
	 * be used for scree reader announcement.
	 *
	 * @since 5.9.2
	 */
	labelAriaLabel?: string;

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
	 * @default false
	 */
	getFillFromSprite?: boolean;

	/**
	 * If set to `true` will use the same `fill` color as its `tooltipTarget`.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/common-elements/tooltips/#Colors} for more info
	 * @default false
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
	 * Screen bounds to constrain the tooltip within.
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

	/**
	 * If set to `true`, tooltip's target element will considered to be hovered
	 * when mouse pointer is over tooltip itself.
	 *
	 * @since 5.2.14
	 */
	keepTargetHover?: boolean;

	/**
	 * If set to `true` the tooltip contents will be read out by a screen reader
	 * when displayed or changed.
	 *
	 * @default false
	 * @since 5.9.2
	 */
	readerAnnounce?: boolean;

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

	public _fx: number = 0;
	public _fy: number = 0;

	declare public _settings: ITooltipSettings;
	declare public _privateSettings: ITooltipPrivate;

	protected _label!: Label;
	public static className: string = "Tooltip";
	public static classNames: Array<string> = Container.classNames.concat([Tooltip.className]);

	protected _fillDp: IDisposer | undefined;
	protected _strokeDp: IDisposer | undefined;
	protected _labelDp: IDisposer | undefined;

	protected _w: number = 0;
	protected _h: number = 0;

	protected _keepHoverDp: MultiDisposer | undefined;
	protected _htmlContentHovered: boolean = false;

	constructor(root: Root, settings: Entity["_settings"], isReal: boolean, templates: Array<Template<Entity>> = []) {
		super(root, settings, isReal, templates);
	}

	protected _afterNew() {
		this._settings.themeTags = $utils.mergeTags(this._settings.themeTags, ["tooltip"]);

		super._afterNew();

		const background: Graphics = this._setDefaultFn("background", () => {
			return PointedRectangle.new(this._root, {});
		});

		background.set("themeTags", ["tooltip", "background"]);

		this._label = this.children.push(Label.new(this._root, {}));

		this._disposers.push(this._label.events.on("boundschanged", () => {
			this._updateBackground();
		}))

		this._disposers.push(this.on("bounds", () => {
			this._updateBackground();
		}))

		this._updateTextColor();

		this._root.tooltipContainer.children.push(this);
		this.hide(0);

		this._disposers.push(this.label.onPrivate("htmlElement", (htmlElement) => {
			if (htmlElement) {
				this._disposers.push($utils.addEventListener(htmlElement, "pointerover", (_ev) => {
					this._htmlContentHovered = true;
				}));
				this._disposers.push($utils.addEventListener(htmlElement, "pointerout", (_ev) => {
					this._htmlContentHovered = false;
				}));
			}
		}))

		this.on("visible", (_ev) => {
			this._handleReaderAnnouncement();
		});

		this.label.events.on("dataitemchanged", (_ev) => {
			this._handleReaderAnnouncement();
		});

		this._root._tooltips.push(this);
	}

	protected _handleReaderAnnouncement() {
		if (this.get("readerAnnounce") && this.isVisibleDeep()) {
			this._root.readerAlert(this.label.getAccessibleText());
		}
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
	protected _dispose() {
		super._dispose();
		$array.remove(this._root._tooltips, this);
	}

	public _updateChildren() {
		super._updateChildren();

		if (this.isDirty("pointerOrientation") || this.isPrivateDirty("minWidth") || this.isPrivateDirty("minHeight")) {
			this.get("background")!._markDirtyKey("width");
		}

		const labelText = this.get("labelText");
		if (labelText != null) {
			this.label.set("text", this.get("labelText"));
		}
		const labelHTML = this.get("labelHTML");
		if (labelHTML != null) {
			this.label.set("html", this.get("labelHTML"));
		}
		const labelAriaLabel = this.get("labelAriaLabel");
		if (labelAriaLabel != null) {
			this.label.set("ariaLabel", this.get("labelAriaLabel"));
		}
	}

	public _changed() {
		super._changed();

		if (this.isDirty("pointTo") || this.isDirty("pointerOrientation")) {
			// can't compare to previous, as sometimes pointTo is set twice (when pointer moves, so the position won't be udpated)
			this._updateBackground();
		}

		if (this.isDirty("tooltipTarget")) {
			this.updateBackgroundColor();
		}

		if (this.isDirty("keepTargetHover")) {
			const keephover = this.get("keepTargetHover");
			if (keephover) {
				const bg = this.get("background")!;
				this._keepHoverDp = new MultiDisposer([
					bg.events.on("pointerover", (_ev) => {
						let target = this.get("tooltipTarget");
						if (target) {
							if (target.parent && target.parent.getPrivate("tooltipTarget") == target) {
								target = target.parent;
							}
							target.hover();
						}
					}),
					bg.events.on("pointerout", (_ev) => {
						let target = this.get("tooltipTarget");
						if (target) {
							if (target.parent && target.parent.getPrivate("tooltipTarget") == target) {
								target = target.parent;
							}
							if (!this._htmlContentHovered) {
								target.unhover();
							}
						}
					})
				]);

				this.label.onPrivate("htmlElement", (htmlElement: any) => {
					if (this._keepHoverDp && htmlElement) {
						this._keepHoverDp.disposers.push($utils.addEventListener<PointerEvent | MouseEvent>(htmlElement, "pointerleave", (ev: IPointerEvent) => {
							const outEvent = this.root._renderer.getEvent(ev);
							bg.events.dispatch("pointerout", {
								type: "pointerout",
								originalEvent: outEvent.event,
								point: outEvent.point,
								simulated: false,
								target: bg
							});
						}));
					}
				})
			}
			else {
				if (this._keepHoverDp) {
					this._keepHoverDp.dispose();
					this._keepHoverDp = undefined;
				}
			}
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
				this._disposers.push(this._fillDp);
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

				this._disposers.push(this._strokeDp);
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

				this._disposers.push(this._labelDp);
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
				this.label.set("fill", Color.alternative(fill, this._root.interfaceColors.get("alternativeText"), this._root.interfaceColors.get("text")));
			}
		}
	}

	public _setDataItem(dataItem?: DataItem<IComponentDataItem>): void {
		super._setDataItem(dataItem);
		this.label._setDataItem(dataItem);
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

			let tooltipContainer = this.parent;
			let xx = 0;
			let yy = 0;
			if (tooltipContainer) {
				xx = tooltipContainer.x();
				yy = tooltipContainer.y();

				const layerMargin = tooltipContainer.get("layerMargin");
				if (layerMargin) {
					xx += layerMargin.left || 0;
					yy += layerMargin.top || 0;
					parentW += (layerMargin.left || 0) + (layerMargin.right || 0);
					parentH += (layerMargin.top || 0) + (layerMargin.bottom || 0);
				}
			}

			const bounds = this.get("bounds", { left: -xx, top: -yy, right: parentW - xx, bottom: parentH - yy });

			this._updateBounds();

			let w = this.width();
			let h = this.height();

			// use old w and h,as when tooltip is hidden, these are 0 and unneeded animation happens
			if (w === 0) {
				w = this._w;
			}

			if (h === 0) {
				h = this._h;
			}

			let pointTo = this.get("pointTo", { x: parentW / 2, y: parentH / 2 });
			let x = pointTo.x;
			let y = pointTo.y;

			let pointerOrientation = this.get("pointerOrientation");

			let background = this.get("background");
			let pointerLength = 0;
			let bgStrokeSizeY = 0;
			let bgStrokeSizeX = 0;

			if (background instanceof PointedRectangle) {
				pointerLength = background.get("pointerLength", 0);
				bgStrokeSizeY = background.get("strokeWidth", 0) / 2;
				bgStrokeSizeX = bgStrokeSizeY;
				background.set("width", w);
				background.set("height", h);
			}

			let pointerX = 0;
			let pointerY = 0;

			let boundsW = bounds.right - bounds.left;
			let boundsH = bounds.bottom - bounds.top;


			// horizontal
			if (pointerOrientation == "horizontal" || pointerOrientation == "left" || pointerOrientation == "right") {
				bgStrokeSizeY = 0;
				if (pointerOrientation == "horizontal") {
					if (x > bounds.left + boundsW / 2) {
						x -= (w * (1 - cw) + pointerLength);
						bgStrokeSizeX *= -1;
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
					bgStrokeSizeX *= -1;
				}
			}
			// vertical pointer
			else {
				bgStrokeSizeX = 0;
				if (pointerOrientation == "vertical") {
					if (y > bounds.top + h / 2 + pointerLength) {
						y -= (h * (1 - ch) + pointerLength);
					}
					else {
						y += (h * ch + pointerLength);
						bgStrokeSizeY *= -1;
					}
				}
				else if (pointerOrientation == "down") {
					y -= (h * (1 - ch) + pointerLength);
				}
				else {
					y += (h * ch + pointerLength);
					bgStrokeSizeY *= -1;
				}
			}

			x = $math.fitToRange(x, bounds.left + w * cw, bounds.left + boundsW - w * (1 - cw)) + bgStrokeSizeX;
			y = $math.fitToRange(y, bounds.top + h * ch, bounds.top + boundsH - h * (1 - ch)) - bgStrokeSizeY;

			pointerX = pointTo.x - x + w * cw + bgStrokeSizeX;
			pointerY = pointTo.y - y + h * ch - bgStrokeSizeY;

			this._fx = x;
			this._fy = y;

			const animationDuration = this.get("animationDuration", 0);

			if (animationDuration > 0 && this.get("visible") && this.get("opacity") > 0.1) {
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

			if (w > 0) {
				this._w = w;
			}
			if (h > 0) {
				this._h = h;
			}
		}
	}
}

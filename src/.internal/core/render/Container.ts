import type { Graphics } from "./Graphics";
import type { Layout } from "./Layout";
import type { IContainer } from "./backend/Renderer";
import type { IBounds } from "../util/IBounds";
import type { Scrollbar } from "./Scrollbar";
import type { DataItem, IComponentDataItem } from "./Component";

import { Children } from "../util/Children";
import { Percent } from "../util/Percent";
import { Sprite, ISpriteSettings, ISpritePrivate, ISpriteEvents } from "./Sprite";
import { Rectangle } from "./Rectangle";
import { HorizontalLayout } from "./HorizontalLayout";
import { VerticalLayout } from "./VerticalLayout";
import { GridLayout } from "./GridLayout";
import { populateString } from "../util/PopulateString";
import type { IDisposer } from "../util/Disposer";

import * as $array from "../util/Array";
import * as $type from "../util/Type";
import * as $utils from "../util/Utils";

export interface IContainerSettings extends ISpriteSettings {

	/**
	 * Left padding in pixels.
	 */
	paddingLeft?: number;

	/**
	 * Right padding in pixels.
	 */
	paddingRight?: number;

	/**
	 * Top padding in pixels.
	 */
	paddingTop?: number;

	/**
	 * Bottom padding in pixels.
	 */
	paddingBottom?: number;

	/**
	 * Element drawn behind the container's content, sized to fill the
	 * container.
	 *
	 * @see {@link https://docs.amcharts.com/v5/concepts/common-elements/containers/#background} for more info
	 */
	background?: Graphics;

	/**
	 * How children are arranged, e.g. `root.horizontalLayout`,
	 * `root.verticalLayout` or `root.gridLayout`. Without a layout, children
	 * are placed by their own `x` and `y`.
	 *
	 * @see {@link https://docs.amcharts.com/v5/concepts/common-elements/containers/#layout} for more info
	 */
	layout?: Layout | null;

	/**
	 * An element whose shape clips the container's children.
	 *
	 * @see {@link https://docs.amcharts.com/v5/concepts/common-elements/containers/#masks} for more info
	 */
	mask?: Graphics | null;

	/**
	 * Clips all content that goes outside the container's bounds.
	 */
	maskContent?: boolean;

	/**
	 * Makes every descendant, not just direct children, interactive when the
	 * container itself is interactive.
	 *
	 * @default true
	 */
	interactiveChildren?: boolean;

	/**
	 * Applies every state set on the container to its children too.
	 *
	 * @see {@link https://docs.amcharts.com/v5/concepts/common-elements/containers/} for more info
	 *
	 * @default false
	 */
	setStateOnChildren?: boolean;

	/**
	 * A [[Scrollbar]] that scrolls the content vertically when it does not fit
	 * in the container.
	 *
	 * @see {@link https://docs.amcharts.com/v5/concepts/common-elements/containers/#scrollbar} for more info
	 */
	verticalScrollbar?: Scrollbar;

	/**
	 * Lays out the children in reverse order.
	 *
	 * @since 5.1.1
	 */
	reverseChildren?: boolean;

	/**
	 * With `"rtl"`, a horizontal or grid layout places the children from right
	 * to left, as a mirror image of `"ltr"`: a child's `marginLeft` ends up on
	 * its right. Rows of a grid still go from top to bottom. A vertical layout
	 * lines up children with no `x` of their own on the right. For right-to-left
	 * languages, e.g. on a legend:
	 * `am5.Legend.new(root, { direction: "rtl" })`.
	 *
	 * A container with a width of its own starts at its right edge; one sized
	 * by its content keeps its size.
	 *
	 * Not set, a legend follows the root element's `direction`, and a legend's
	 * items follow their legend; other containers are left to right.
	 *
	 * @since 5.22.0
	 */
	direction?: "ltr" | "rtl";

	/**
	 * HTML content of the container. It can hold data placeholders, such as
	 * `{category}`.
	 *
	 * @see {@link https://docs.amcharts.com/v5/concepts/common-elements/html-content/} for more info
	 * @since 5.2.11
	 */
	html?: string;

}

export interface IContainerEvents extends ISpriteEvents {
}

export interface IContainerPrivate extends ISpritePrivate {
	/**
	 * The `<div>` element that holds the container's `html` content.
	 */
	htmlElement?: HTMLDivElement;

	/**
	 * A wrapper `<div>` for `htmlElement`.
	 *
	 * @since 5.11.2
	 */
	htmlElementWrapper?: HTMLDivElement;

	/**
	 * @ignore
	 */
	wrapperContainer?: Container;
}

/**
 * An element that holds child elements, arranges them with a layout, and can
 * have a background.
 *
 * Its children can be any [[Sprite]], from basic shapes to whole charts.
 *
 * @see {@link https://docs.amcharts.com/v5/concepts/common-elements/containers/} for more info
 * @important
 */
export class Container extends Sprite {

	declare public _settings: IContainerSettings;
	declare public _privateSettings: IContainerPrivate;
	declare public _events: IContainerEvents;

	public _display: IContainer = this._root._renderer.makeContainer();

	public _childrenDisplay: IContainer = this._root._renderer.makeContainer();

	/**
	 * The container's child elements.
	 */
	public children: Children<Sprite> = new Children(this);

	public _percentageSizeChildren: Array<Sprite> = [];
	public _percentagePositionChildren: Array<Sprite> = [];

	public static className: string = "Container";
	public static classNames: Array<string> = Sprite.classNames.concat([Container.className]);

	public _prevWidth: number = 0;
	public _prevHeight: number = 0;

	protected _contentWidth: number = 0;
	protected _contentHeight: number = 0;

	protected _contentMask: Rectangle | undefined;

	protected _vsbd0: IDisposer | undefined;
	protected _vsbd1: IDisposer | undefined;

	protected _hsbd0: IDisposer | undefined;
	protected _hsbd1: IDisposer | undefined;

	// what the author set that a `verticalScrollbar` takes over, to put back when it goes
	protected _scrollbarRestore: { maskContent?: boolean, paddingRight?: number } | undefined;

	public _childrenPrep: boolean = false;
	public _childrenUpdt: boolean = false;

	protected _afterNew() {
		super._afterNew();
		this._display.addChild(this._childrenDisplay);
	}

	/**
	 * Returns the sub-element held in `key`, creating it with `f` if there is
	 * none, and merging `themeTags` into whichever element ends up there.
	 *
	 * The tags describe the role the element plays within this class, so an
	 * element passed in by a user (or by a parsed config) needs them just as
	 * much as a default one - without them the theme rules keyed on those tags
	 * never match and the element renders unstyled.
	 *
	 * @ignore
	 */
	public _setDefaultTagged<Key extends keyof this["_settings"], Value extends this["_settings"][Key]>(key: Key, themeTags: Array<string>, f: () => Value): NonNullable<this["_settings"][Key]> | Value {
		const value = this._setDefaultFn(key, f);
		const sprite = value as unknown as Sprite;

		sprite.set("themeTags", $utils.mergeTags(sprite.get("themeTags", []), themeTags));

		return value;
	}

	public _afterChanged(): void {
		super._afterChanged();

		this._childrenPrep = false;
		this._childrenUpdt = false;
	}

	protected _dispose() {
		$array.eachReverse(this.allChildren(), (child) => {
			child.dispose();
		});

		if (this.getPrivate("htmlElement")) {
			this._root._removeHTMLContent(this);
		}

		super._dispose();
	}

	public _beforeChanged(): void {

		if (!this._childrenPrep) {
			this._prepareChildren();
		}

		if (!this._childrenUpdt) {
			this._updateChildren();
		}
		super._beforeChanged();
	}

	public _changed() {
		super._changed();

		if (this.isDirty("interactiveChildren")) {
			this._display.interactiveChildren = this.get("interactiveChildren", false);
		}

		if (this.isDirty("layout")) {
			this._prevWidth = 0;
			this._prevHeight = 0;
			this.markDirtyBounds();
			if (this._prevSettings.layout) {
				this.children.each((child) => {
					child.removePrivate("x");
					child.removePrivate("y");
				})
			}
		}

		if (this.isDirty("direction")) {
			this.markDirtyBounds();
			// children that follow this direction, such as a legend's items, lay out again
			this.children.each((child) => {
				child.markDirtyBounds();
			});
		}

		if (this.isDirty("paddingTop") || this.isDirty("paddingBottom") || this.isDirty("paddingLeft") || this.isDirty("paddingRight")) {
			this.children.each((child) => {
				child.markDirtyPosition();
			})
			this.markDirtyBounds();
		}

		if (this.isDirty("maskContent")) {

			const childrenDisplay = this._childrenDisplay;

			let contentMask = this._contentMask;
			if (this.get("maskContent")) {
				if (!contentMask) {
					contentMask = Rectangle.new(this._root, {
						x: -.5,
						y: -.5,
						width: this.width() + 1,
						height: this.height() + 1
					});
					this._contentMask = contentMask;
					childrenDisplay.addChildAt(contentMask._display, 0);
					childrenDisplay.mask = contentMask._display;
				}
			}
			else {
				if (contentMask) {
					childrenDisplay.removeChild(contentMask._display);
					childrenDisplay.mask = null;
					contentMask.dispose();
					this._contentMask = undefined;
				}
			}
		}
	}

	public _updateSize() {
		super._updateSize();

		$array.each(this._percentageSizeChildren, (child) => {
			child._updateSize();
		});

		$array.each(this._percentagePositionChildren, (child) => {
			child.markDirtyPosition();
			child._updateSize();
		});

		this.updateBackground();
	}

	protected updateBackground() {
		const background = this.get("background");
		let bounds = this._localBounds;

		if (bounds && !this.isHidden()) {
			let x = bounds.left;
			let y = bounds.top;
			let w = bounds.right - x;
			let h = bounds.bottom - y;

			let maxWidth = this.get("maxWidth");
			let maxHeight = this.get("maxHeight");

			if (maxHeight) {
				if (h > maxHeight) {
					h = maxHeight;
				}
			}

			if (maxWidth) {
				if (w > maxWidth) {
					w = maxWidth;
				}
			}

			// in its own units: a size measured from its content includes its scale
			let width = this.width();
			let height = this.height();
			if (this.get("scale", 1) != 1) {
				if (this.get("width") == null && this.getPrivate("width") == null) {
					width = w;
				}
				if (this.get("height") == null && this.getPrivate("height") == null) {
					height = h;
				}
			}

			if (background) {
				background._setCAll({ width: w, height: h, x: x, y: y });
				if (this._display.interactive) {
					background._display.interactive = true;
				}
			}

			const contentMask = this._contentMask;
			if (contentMask) {
				contentMask.setAll({ width: width + 1, height: height + 1 });
			}

			const verticalScrollbar = this.get("verticalScrollbar")!;
			if (verticalScrollbar) {
				// placed by the container
				verticalScrollbar._setC("height", height);
				verticalScrollbar._setC("x", width - verticalScrollbar.width() - verticalScrollbar.get("marginRight", 0));

				const visibleRatio = Math.min(1, height / this._contentHeight);
				const maxStart = Math.max(0, 1 - visibleRatio);
				let start = verticalScrollbar.get("start", 0);

				// The viewport can grow past the current scroll position, e.g. when the
				// container is resized while scrolled to the bottom. Without pulling the
				// position back the content stays pushed up, leaving a gap below it.
				// Only an out of range position is written, so a scroll animation that
				// stays in range runs on - one that does not is stopped by `set`.
				if (start > maxStart) {
					start = maxStart;
					verticalScrollbar._setC("start", start);
				}

				verticalScrollbar._setC("end", start + visibleRatio);
				const bg = verticalScrollbar.get("background");
				if (bg) {
					bg._setCAll({ width: verticalScrollbar.width(), height: height })
				}

				let visible = true;
				if (this._contentHeight <= height) {
					visible = false;
				}
				verticalScrollbar.setPrivate("visible", visible);
			}
		}
	}

	public _applyThemes(force: boolean = false): boolean {
		if (super._applyThemes(force)) {
			this.eachChildren((child) => {
				child._applyThemes(force);
			});

			return true;

		} else {
			return false;
		}
	}

	public _applyState(name: string): void {
		super._applyState(name);

		if (this.get("setStateOnChildren")) {
			this.eachChildren((child) => {
				child.states.apply(name);
			});
		}
	}

	public _applyStateAnimated(name: string, duration?: number): void {
		super._applyStateAnimated(name, duration);

		if (this.get("setStateOnChildren")) {
			this.eachChildren((child) => {
				child.states.applyAnimate(name, duration);
			});
		}
	}

	/**
	 * Returns the container's width without padding, in pixels.
	 *
	 * @return Inner width (px)
	 */
	public innerWidth(): number {
		return this.width() - this.get("paddingRight", 0) - this.get("paddingLeft", 0);
	}

	/**
	 * Returns the container's height without padding, in pixels.
	 *
	 * @return Inner height (px)
	 */
	public innerHeight(): number {
		return this.height() - this.get("paddingTop", 0) - this.get("paddingBottom", 0);
	}

	public _getBounds() {
		if (!this.get("html")) {
			let width = this.get("width");
			let height = this.get("height");

			let pWidth = this.getPrivate("width");
			let pHeight = this.getPrivate("height");

			let bounds: IBounds = {
				left: 0,
				top: 0,
				right: this.width(),
				bottom: this.height()
			};

			let layout = this.get("layout");
			let horizontal = false;
			let vertical = false;
			if (layout instanceof HorizontalLayout || layout instanceof GridLayout) {
				horizontal = true;
			}

			if (layout instanceof VerticalLayout) {
				vertical = true;
			}

			if ((width != null || pWidth != null) && (height != null || pHeight != null) && !this.get("verticalScrollbar")) {
				// void
			}
			else {
				let m = Number.MAX_VALUE;

				let l = m;
				let r = -m;
				let t = m;
				let b = -m;

				const paddingLeft = this.get("paddingLeft", 0);
				const paddingTop = this.get("paddingTop", 0);
				const paddingRight = this.get("paddingRight", 0);
				const paddingBottom = this.get("paddingBottom", 0);
				// a right-to-left layout mirrors the children with their margins
				const rtl = horizontal && this._isRtl();

				this.children.each((child) => {
					// A hidden child takes no room, as the layouts already skip it
					if (child.get("position") != "absolute" && child.get("isMeasured") && child.isVisible()) {
						let childBounds = child.adjustedLocalBounds();
						let childX = child.x();
						let childY = child.y();
						let cl = childX + childBounds.left;
						let cr = childX + childBounds.right;
						let ct = childY + childBounds.top;
						let cb = childY + childBounds.bottom;

						if (horizontal) {
							cl -= child.get(rtl ? "marginRight" : "marginLeft", 0);
							cr += child.get(rtl ? "marginLeft" : "marginRight", 0);
						}

						if (vertical) {
							ct -= child.get("marginTop", 0);
							cb += child.get("marginBottom", 0);
						}

						if (cl < l) {
							l = cl;
						}
						if (cr > r) {
							r = cr;
						}
						if (ct < t) {
							t = ct;
						}
						if (cb > b) {
							b = cb;
						}
					}
				})

				if (l == m) {
					l = 0;
				}

				if (r == -m) {
					r = 0;
				}

				if (t == m) {
					t = 0;
				}

				if (b == -m) {
					b = 0;
				}

				bounds.left = l - paddingLeft;
				bounds.top = t - paddingTop;
				bounds.right = r + paddingRight;
				bounds.bottom = b + paddingBottom;

				const minWidth = this.get("minWidth");

				if ($type.isNumber(minWidth) && minWidth > 0) {
					if (bounds.right - bounds.left < minWidth) {
						if (bounds.right >= minWidth) {
							bounds.left = bounds.right - minWidth;
						}
						else {
							bounds.right = bounds.left + minWidth;
						}
					}
				}

				const minHeight = this.get("minHeight");

				if ($type.isNumber(minHeight) && minHeight > 0) {
					if (bounds.bottom - bounds.top < minHeight) {
						if (bounds.bottom >= minHeight) {
							bounds.top = bounds.bottom - minHeight;
						}
						else {
							bounds.bottom = bounds.top + minHeight;
						}
					}
				}
			}

			this._contentWidth = bounds.right - bounds.left;
			this._contentHeight = bounds.bottom - bounds.top;

			if ($type.isNumber(width)) {
				bounds.left = 0;
				bounds.right = width;
			}

			if ($type.isNumber(pWidth)) {
				bounds.left = 0;
				bounds.right = pWidth;
			}

			if ($type.isNumber(height)) {
				bounds.top = 0;
				bounds.bottom = height;
			}

			if ($type.isNumber(pHeight)) {
				bounds.top = 0;
				bounds.bottom = pHeight;
			}

			this._localBounds = bounds;
		}
		else {
			let bounds = this._localBounds;
			if (bounds) {
				this._contentWidth = bounds.right - bounds.left;
				this._contentHeight = bounds.bottom - bounds.top;
			}
		}
	}

	/**
	 * Whether a horizontal or grid layout places the children from the right:
	 * the container's own `direction`, else the root's for a legend, and the
	 * legend's for its items.
	 *
	 * @ignore
	 */
	public _isRtl(): boolean {
		const direction = this.get("direction");
		if (direction) {
			return direction == "rtl";
		}
		const parent = this.parent;
		const tags: Array<string> | undefined = this.get("themeTagsSelf");
		if (this.isType("Legend")) {
			return this._root.settings.direction == "rtl";
		}
		// a legend's items follow their legend
		if (parent && parent.isType("Legend") && tags && tags.indexOf("itemcontainer") != -1) {
			return parent._isRtl();
		}
		return false;
	}

	public _updateBounds() {
		const layout = this.get("layout");

		if (layout) {
			layout.updateContainer(this);
		}

		super._updateBounds();

		this.updateBackground();
	}

	/**
	 * @ignore
	 */
	public markDirty(): void {
		super.markDirty();
		this._root._addDirtyParent(this);
	}

	public _prepareChildren() {

		this._applyDeclaredAnimations();
		this._applyAutoAppear();

		this._childrenPrep = true;

		const innerWidth = this.innerWidth();
		const innerHeight = this.innerHeight();

		if (innerWidth != this._prevWidth || innerHeight != this._prevHeight) {
			let layout = this.get("layout");
			let horizontal = false;
			let vertical = false;
			if (layout) {
				if (layout instanceof HorizontalLayout || layout instanceof GridLayout) {
					horizontal = true;
				}
				if (layout instanceof VerticalLayout) {
					vertical = true;
				}
			}

			$array.each(this._percentageSizeChildren, (child) => {
				if (!horizontal) {
					let width = child.get("width");
					if (width instanceof Percent) {
						child.setPrivate("width", width.value * innerWidth);
					}
				}
				if (!vertical) {
					let height = child.get("height");
					if (height instanceof Percent) {
						child.setPrivate("height", height.value * innerHeight);
					}
				}
			})

			$array.each(this._percentagePositionChildren, (child) => {
				child.markDirtyPosition();
				child.markDirtyBounds();
			})

			this._prevWidth = innerWidth;
			this._prevHeight = innerHeight;

			this._sizeDirty = true;
			this.updateBackground();
		}

		//this._handleStates();
	}

	public _updateHTMLContent() {
		const html = this.get("html", "");
		if (html && html !== "") {
			this._root._setHTMLContent(this, populateString(this, html));
		}
		else {
			this._root._removeHTMLContent(this);
		}
		this._root._positionHTMLElement(this);
	}

	/**
	 * Scrolls the container so that the child comes into view, if it is out of
	 * view. Works only on a container with a `verticalScrollbar`.
	 *
	 * @param  child  Child to scroll to
	 * @since 5.10.5
	 */
	public scrollToChild(child: Sprite) {
		const verticalScrollbar = this.get("verticalScrollbar")!;
		if (verticalScrollbar) {
			let y = child.y();
			let h = this.innerHeight();
			let ch = child.height();
			let contentH = this._contentHeight;
			// scrolled all the way down is the last child sitting on the bottom edge -
			// going past that only opens a gap below the content. Measured against
			// the full height, same as the scroll position is clamped to.
			let max = Math.max(0, 1 - this.height() / contentH);

			if (y + ch * .7 + this._childrenDisplay.y > h || y - ch * .3 + this._childrenDisplay.y < 0) {
				let pos = Math.max(0, Math.min(max, (y - ch / 2) / contentH));
				verticalScrollbar.animate({ key: "start", to: pos, duration: verticalScrollbar.get("animationDuration", 0), easing: verticalScrollbar.get("animationEasing") });
			}
		}
	}

	/**
	 * @ignore
	 */
	public _nameForExport(parentName?: string): string | undefined {
		const name = super._nameForExport(parentName);
		this.children.each((child) => {
			child._nameForExport(name);
		});
		return name;
	}

	public _updateChildren() {

		this._childrenUpdt = true;

		if (this.isDirty("html")) {
			this._updateHTMLContent();
		}

		if (this.isDirty("verticalScrollbar")) {
			const verticalScrollbar = this.get("verticalScrollbar")!;
			if (verticalScrollbar) {
				verticalScrollbar._setParent(this);

				verticalScrollbar.startGrip.setPrivate("visible", false);
				verticalScrollbar.endGrip.setPrivate("visible", false);

				// the room the scrollbar takes is the container's own doing; what the
				// author set is kept to be put back when the scrollbar goes
				if (!this._scrollbarRestore) {
					const own = (key: "maskContent" | "paddingRight") => this.isUserSetting(key) && !this.isComputedSetting(key);
					this._scrollbarRestore = {
						maskContent: own("maskContent") ? this.get("maskContent") : undefined,
						paddingRight: own("paddingRight") ? this.get("paddingRight") : undefined
					};
				}
				this._setC("maskContent", true);
				this._setC("paddingRight", verticalScrollbar.width() + verticalScrollbar.get("marginRight", 0) + verticalScrollbar.get("marginLeft", 0));

				this._setDefaultTagged("background", ["background"], () => {
					return Rectangle.new(this._root, {
						fillOpacity: 0,
						fill: this._root.interfaceColors.get("alternativeBackground")
					})._markC("fillOpacity", "fill");
				});

				this._vsbd0 = this.events.on("wheel", (event) => {
					const wheelEvent = event.originalEvent;

					// Ignore wheel event if it is happening on a non-chart element, e.g. if
					// some page element is over the chart.
					if ($utils.isLocalEvent(wheelEvent, this)) {
						wheelEvent.preventDefault();
					}
					else {
						return;
					}

					let shiftY = wheelEvent.deltaY / 5000;
					const start = verticalScrollbar.get("start", 0);
					const end = verticalScrollbar.get("end", 1);

					if (start + shiftY <= 0) {
						shiftY = -start;
					}
					if (end + shiftY >= 1) {
						shiftY = 1 - end;
					}

					if (start + shiftY >= 0 && end + shiftY <= 1) {
						verticalScrollbar._setC("start", start + shiftY);
						verticalScrollbar._setC("end", end + shiftY);
					}

				})

				this._disposers.push(this._vsbd0);

				this._vsbd1 = verticalScrollbar.events.on("rangechanged", () => {
					let h = this._contentHeight;
					const childrenDisplay = this._childrenDisplay;
					const contentMask = this._contentMask;

					childrenDisplay.y = -verticalScrollbar.get("start", 0) * h;
					childrenDisplay.markDirtyLayer();

					if (contentMask) {
						contentMask._display.y = -childrenDisplay.y;
						childrenDisplay.mask = contentMask._display;
					}
				})

				this._disposers.push(this._vsbd1);

				this._display.addChild(verticalScrollbar._display);
			}
			else {
				const previous = this._prevSettings.verticalScrollbar
				if (previous) {
					this._display.removeChild(previous._display);
					if (this._vsbd0) {
						this._vsbd0.dispose();
						$array.remove(this._disposers, this._vsbd0);
						this._vsbd0 = undefined;
					}
					if (this._vsbd1) {
						this._vsbd1.dispose();
						$array.remove(this._disposers, this._vsbd1);
						this._vsbd1 = undefined;
					}
					const childrenDisplay = this._childrenDisplay;
					childrenDisplay.y = 0;

					this.setPrivate("height", undefined);
					// back to what the author, or else a theme, set
					const restore = this._scrollbarRestore || {};
					this._scrollbarRestore = undefined;
					if (this.isComputedSetting("maskContent")) {
						if (restore.maskContent != null) {
							this.set("maskContent", restore.maskContent);
						}
						else {
							this.remove("maskContent");
						}
					}
					if (this.isComputedSetting("paddingRight")) {
						if (restore.paddingRight != null) {
							this.set("paddingRight", restore.paddingRight);
						}
						else {
							this.remove("paddingRight");
						}
					}
				}
			}


		}

		if (this.isDirty("background")) {
			// TODO maybe this should dispose ?
			const previous = this._prevSettings["background"];
			if (previous) {
				this._display.removeChild(previous._display);
			}

			const background = this.get("background");
			if (background instanceof Sprite) {
				background._setC("isMeasured", false);
				background._setParent(this);
				// reads the container's data item, so a per-item background works
				if (background.get("templateField")) {
					background._processTemplateField();
				}
				this._display.addChildAt(background._display, 0);
				// Rectangle / RoundedRectangle backgrounds render sharper edges and
				// strokes when crisp; default it on unless the user set it explicitly.
				if (background instanceof Rectangle && !background.isUserSetting("crisp")) {
					background._setC("crisp", true);
				}
			}
		}

		if (this.isDirty("mask")) {

			const mask = this.get("mask");

			const previous = this._prevSettings["mask"];
			if (previous) {
				this._display.removeChild(previous._display);
				if (previous != mask) {
					previous.dispose();
				}
			}

			if (mask) {
				const parent = mask.parent;
				if (parent) {
					parent.children.removeValue(mask);
				}

				mask._setParent(this);
				this._display.addChildAt(mask._display, 0);
				this._childrenDisplay.mask = mask._display;
			}
			else {
				// mask removed: clear the clip, otherwise the children keep being
				// clipped by the (now disposed) previous mask display. Fall back to
				// the content mask if `maskContent` is in effect.
				this._childrenDisplay.mask = this._contentMask ? this._contentMask._display : null;
			}
		}
	}

	public _processTemplateField(): void {
		super._processTemplateField();
		this.children.each((child) => {
			child._processTemplateField();
		})
	}

	/**
	 * @ignore
	 */
	public walkChildren(f: (child: Sprite, index?: number) => void): void {
		this.children.each((child, index) => {
			if (child instanceof Container) {
				child.walkChildren(f);
			}
			f(child, index);
		});
	}

	/**
	 * Calls `f` for each child, including the background, vertical scrollbar
	 * and mask.
	 */
	public eachChildren(f: (child: Sprite) => void): void {
		const background = this.get("background");
		if (background) {
			f(background);
		}

		const verticalScrollbar = this.get("verticalScrollbar");
		if (verticalScrollbar) {
			f(verticalScrollbar);
		}

		const mask = this.get("mask");
		if (mask) {
			f(mask);
		}

		this.children.values.forEach((child) => {
			f(child);
		});
	}

	/**
	 * Returns all children, including the background, vertical scrollbar and
	 * mask.
	 */
	public allChildren(): Array<Sprite> {
		const output: Array<Sprite> = [];

		this.eachChildren((x) => {
			output.push(x);
		});

		return output;
	}

	public _setDataItem(dataItem?: DataItem<IComponentDataItem>): void {
		const updated = (dataItem !== this._dataItem);
		super._setDataItem(dataItem);
		const background = this.get("background");
		if (background && background.get("templateField")) {
			background._processTemplateField();
		}
		const html = this.get("html", "");
		if (html && html !== "" && updated) {
			this._root._setHTMLContent(this, populateString(this, html));
		}
	}

	public contentWidth(): number {
		return this._contentWidth;
	}

	public contentHeight(): number {
		return this._contentHeight;
	}
}

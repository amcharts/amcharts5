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
	 * Background element.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/containers/#Background} for more info
	 */
	background?: Graphics;

	/**
	 * A method to layout
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/containers/#Layout} for more info
	 */
	layout?: Layout | null;

	/**
	 * An element to use as a container's mask (clipping region).
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/containers/#Masks} for more info
	 */
	mask?: Graphics | null;

	/**
	 * If set to `true` all content going outside the bounds of the container
	 * will be clipped.
	 */
	maskContent?: boolean;

	/**
	 * If set to `true` all descendants - not just direct children, but every
	 * element in it - will become "interactive".
	 */
	interactiveChildren?: boolean;

	/**
	 * If set to `true`, applying a state on a container will also apply the same
	 * state on its children.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/containers/#States} for more info
	 */
	setStateOnChildren?: boolean;

	/**
	 * Setting this to an instance of [[Scrollbar]] will enable vertical
	 * scrolling of content if it does not fit into the Container.
	 * 
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/containers/#Scrollbar} for more info
	 */
	verticalScrollbar?: Scrollbar;

	/**
	 * If set to `true` its children will be laid out in opposite order.
	 *
	 * @since 5.1.1
	 */
	reverseChildren?: boolean;

	html?: string;

}

export interface IContainerEvents extends ISpriteEvents {
}

export interface IContainerPrivate extends ISpritePrivate {
	/**
	 * @todo review
	 */
	htmlElement?: HTMLDivElement;
}

export interface IContainerEvents extends ISpriteEvents {
}

/**
 * A basic element that can have child elements, maintain their layout, and
 * have a background.
 *
 * It can have any [[Sprite]] element as a child, from very basic shapes, to
 * full-fledged charts.
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/common-elements/containers/} for more info
 * @important
 */
export class Container extends Sprite {

	declare public _settings: IContainerSettings;
	declare public _privateSettings: IContainerPrivate;
	declare public _events: IContainerEvents;

	public _display: IContainer = this._root._renderer.makeContainer();

	public _childrenDisplay: IContainer = this._root._renderer.makeContainer();

	/**
	 * List of Container's child elements.
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

	protected _afterNew() {
		super._afterNew();
		this._display.addChild(this._childrenDisplay);
	}

	protected _dispose() {
		$array.eachReverse(this.allChildren(), (child) => {
			child.dispose();
		});

		super._dispose();
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

		if (this.isDirty("paddingTop") || this.isDirty("paddingBottom") || this.isDirty("paddingLeft") || this.isDirty("paddingRight")) {
			this.children.each((child) => {
				child.markDirtyPosition();
			})
		}

		if (this.isDirty("maskContent")) {

			const childrenDisplay = this._childrenDisplay;

			let contentMask = this._contentMask;
			if (this.get("maskContent")) {
				if (!contentMask) {
					contentMask = Rectangle.new(this._root, {
						width: this.width(),
						height: this.height()
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
				}
			}
		}

		if (this.isDirty("html")) {
			const html = this.get("html");
			if (html && html !== "") {
				this._root._setHTMLContent(this, populateString(this, this.get("html", "")));
			}
			else {
				this._root._removeHTMLContent(this);
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

			let width = this.width();
			let height = this.height();

			if (background) {
				background.setAll({ width: w, height: h, x: x, y: y });
				if (this._display.interactive) {
					background._display.interactive = true;
				}
			}

			const contentMask = this._contentMask;
			if (contentMask) {
				contentMask.setAll({ width, height });
			}

			const verticalScrollbar = this.get("verticalScrollbar")!;
			if (verticalScrollbar) {
				verticalScrollbar.set("height", height);
				verticalScrollbar.set("x", width - verticalScrollbar.width() - verticalScrollbar.get("marginRight", 0));
				verticalScrollbar.set("end", verticalScrollbar.get("start", 0) + height / this._contentHeight);

				const bg = verticalScrollbar.get("background");
				if (bg) {
					bg.setAll({ width: verticalScrollbar.width(), height: height })
				}

				let visible = true;
				if (this._contentHeight <= height) {
					visible = false;
				}
				verticalScrollbar.setPrivate("visible", visible);
			}
		}
	}

	public _applyThemes(): boolean {
		if (super._applyThemes()) {
			this.eachChildren((child) => {
				child._applyThemes();
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
	 * Returns container's inner width (width without padding) in pixels.
	 *
	 * @return Inner width (px)
	 */
	public innerWidth(): number {
		return this.width() - this.get("paddingRight", 0) - this.get("paddingLeft", 0);
	}

	/**
	 * Returns container's inner height (height without padding) in pixels.
	 *
	 * @return Inner height (px)
	 */
	public innerHeight(): number {
		return this.height() - this.get("paddingTop", 0) - this.get("paddingBottom", 0);
	}

	protected _getBounds() {

		let width = this.get("width");
		let height = this.get("height");
		let pWidth = this.getPrivate("width");
		let pHeight = this.getPrivate("height");

		let bounds: IBounds = {
			left: 0,
			top: 0,
			right: this.width(),
			bottom: this.height(),
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

			this.children.each((child) => {
				if (child.get("position") != "absolute" && child.get("isMeasured")) {
					let childBounds = child.adjustedLocalBounds();
					let childX = child.x();
					let childY = child.y();
					let cl = childX + childBounds.left;
					let cr = childX + childBounds.right;
					let ct = childY + childBounds.top;
					let cb = childY + childBounds.bottom;

					if (horizontal) {
						cl -= child.get("marginLeft", 0);
						cr += child.get("marginRight", 0);
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

		this._handleStates();
	}

	public _updateChildren() {

		if (this.isDirty("verticalScrollbar")) {
			const verticalScrollbar = this.get("verticalScrollbar")!;
			if (verticalScrollbar) {
				verticalScrollbar._setParent(this);
				verticalScrollbar.children.removeValue(verticalScrollbar.startGrip);
				verticalScrollbar.children.removeValue(verticalScrollbar.endGrip);

				this.set("maskContent", true);
				this.set("paddingRight", verticalScrollbar.width() + verticalScrollbar.get("marginRight", 0) + verticalScrollbar.get("marginLeft", 0));

				let background = this.get("background");

				if (!background) {
					background = this.set("background", Rectangle.new(this._root, {
						themeTags: ["background"],
						fillOpacity: 0,
						fill: this._root.interfaceColors.get("alternativeBackground")
					}));
				}

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

					const shiftY = wheelEvent.deltaY / 5000;
					const start = verticalScrollbar.get("start", 0);
					const end = verticalScrollbar.get("end", 1);
					if (start + shiftY > 0 && end + shiftY < 1) {
						verticalScrollbar.set("start", start + shiftY);
						verticalScrollbar.set("end", end + shiftY);
					}
				})

				this._disposers.push(this._vsbd0);

				this._vsbd1 = verticalScrollbar.events.on("rangechanged", () => {
					let h = this._contentHeight;
					const childrenDisplay = this._childrenDisplay;
					const contentMask = this._contentMask;

					childrenDisplay.y = -verticalScrollbar.get("start") * h;
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
					}
					if (this._vsbd1) {
						this._vsbd1.dispose();
					}

					this.set("maskContent", false);
					this.set("paddingRight", undefined);					
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
				background.set("isMeasured", false);
				background._setParent(this);
				this._display.addChildAt(background._display, 0);
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
				var parent = mask.parent;
				if (parent) {
					parent.children.removeValue(mask);
				}

				mask._setParent(this);
				this._display.addChildAt(mask._display, 0);
				this._childrenDisplay.mask = mask._display;
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
	public walkChildren(f: (child: Sprite) => void): void {
		this.children.each((child) => {
			if (child instanceof Container) {
				child.walkChildren(f);
			}
			f(child);
		});
	}

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
		const html = this.get("html", "");
		if (html && html !== "" && updated) {
			this._root._setHTMLContent(this, populateString(this, html));
		}
	}
}
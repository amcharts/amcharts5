import type { IDisplayObject, IRendererEvents, IRendererEvent, IPointerEvent, IMargin, IDeform } from "./backend/Renderer";
import type { IBounds } from "../util/IBounds";
import type { Container } from "./Container";
import type { Role, AriaLive } from "../util/Accessibility";
import type { NumberFormatter } from "../util/NumberFormatter";
import type { DateFormatter } from "../util/DateFormatter";
import type { DurationFormatter } from "../util/DurationFormatter";
import type { DataItem, IComponentDataItem } from "./Component";
import type { Graphics } from "./Graphics";
import type { IPoint } from "../util/IPoint";
import type { ListTemplate } from "../util/List";

import type { Tooltip } from "./Tooltip";
import { Entity, IEntitySettings, IEntityPrivate, IEntityEvents } from "../util/Entity";
import { Template } from "../util/Template";
import { Percent } from "../util/Percent";
import { EventDispatcher, Events, EventListener } from "../util/EventDispatcher";
import { IDisposer, MultiDisposer, CounterDisposer } from "../util/Disposer";
import { waitForAnimations } from "../util/Animation";

import * as $utils from "../util/Utils";
import * as $array from "../util/Array";
import * as $type from "../util/Type";
import * as $object from "../util/Object";
import * as $math from "../util/Math";
//import { populateString } from "../util/PopulateString";


/**
 * An [[EventDispatcher]] for [[Sprite]].
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/events/} for more info
 */
class SpriteEventDispatcher<Target, E extends Events<Target, ISpriteEvents>> extends EventDispatcher<E> {
	protected static RENDERER_EVENTS: { [K in keyof IRendererEvents]?: <E extends Events<Sprite, ISpriteEvents>>(this: SpriteEventDispatcher<Sprite, E>, event: IRendererEvents[K]) => void } = {
		"click": function (event) {
			if (this.isEnabled("click") && !this._sprite.isDragging() && this._sprite._hasDown() && !this._sprite._hasMoved(this._makePointerEvent("click", event))) {
				this.dispatch("click", this._makePointerEvent("click", event));
			}
		},

		"rightclick": function (event) {
			if (this.isEnabled("rightclick")) {
				this.dispatch("rightclick", this._makePointerEvent("rightclick", event));
			}
		},

		"middleclick": function (event) {
			if (this.isEnabled("middleclick")) {
				this.dispatch("middleclick", this._makePointerEvent("middleclick", event));
			}
		},

		"dblclick": function (event) {
			this.dispatchParents("dblclick", this._makePointerEvent("dblclick", event));
		},

		"pointerover": function (event) {

			const sprite = this._sprite;
			let dispatch = true;

			if (sprite.getPrivate("trustBounds")) {
				sprite._getBounds()
				const bounds = sprite.globalBounds();

				if (sprite.isType<Graphics>("Graphics")) {
					const strokeWidth = sprite.get("strokeWidth", 1) / 2;
					if (strokeWidth >= 1) {
						bounds.left -= strokeWidth;
						bounds.right += strokeWidth;
						bounds.top -= strokeWidth;
						bounds.bottom += strokeWidth;
					}
				}

				if (!$math.inBounds(event.point, bounds)) {
					dispatch = false;
					sprite._root._renderer.removeHovering(sprite._display);
				}
			}

			if (dispatch && this.isEnabled("pointerover")) {
				this.dispatch("pointerover", this._makePointerEvent("pointerover", event));
			}
		},

		"pointerout": function (event) {
			if (this.isEnabled("pointerout")) {
				this.dispatch("pointerout", this._makePointerEvent("pointerout", event));
			}
		},

		"pointerdown": function (event) {
			this.dispatchParents("pointerdown", this._makePointerEvent("pointerdown", event));
		},

		"pointerup": function (event) {
			if (this.isEnabled("pointerup")) {
				this.dispatch("pointerup", this._makePointerEvent("pointerup", event));
			}
		},

		"globalpointerup": function (event) {
			if (this.isEnabled("globalpointerup")) {
				this.dispatch("globalpointerup", this._makePointerEvent("globalpointerup", event));
			}
		},

		"globalpointermove": function (event) {
			if (this.isEnabled("globalpointermove")) {
				this.dispatch("globalpointermove", this._makePointerEvent("globalpointermove", event));
			}
		},

		"globalpointerdown": function (event) {
			if (this.isEnabled("globalpointerdown")) {
				this.dispatch("globalpointerdown", this._makePointerEvent("globalpointerdown", event));
			}
		},

		"wheel": function (event) {
			this.dispatchParents("wheel", {
				type: "wheel",
				target: this._sprite,
				originalEvent: event.event,
				point: event.point,
			});
		},
	};

	protected _sprite: Sprite;

	protected _rendererDisposers: { [K in keyof IRendererEvents]?: CounterDisposer } = {};

	protected _dispatchParents: boolean = true;

	constructor(sprite: Sprite) {
		super();
		this._sprite = sprite;
	}

	protected _makePointerEvent<K extends keyof E>(key: K, event: IRendererEvent<IPointerEvent>): ISpritePointerEvent & { type: K } {
		return {
			type: key,
			originalEvent: event.event,
			point: event.point,
			simulated: event.simulated,
			native: event.native,
			target: this._sprite
		};
	}

	protected _onRenderer<Key extends keyof IRendererEvents>(key: Key, dispatch: (this: this, event: IRendererEvents[Key]) => void): IDisposer {
		// TODO: is this OK? it'd be good not to require to set this on each individual element
		this._sprite._setC("interactive", true);
		this._sprite._display.interactive = true;

		let events = this._rendererDisposers[key];

		if (events === undefined) {
			const disposer = this._sprite._display.on(key, (e) => {
				dispatch.call(this, e);
			});

			events = this._rendererDisposers[key] = new CounterDisposer(() => {
				delete this._rendererDisposers[key];
				disposer.dispose();
			});
		}

		return events.increment();
	}

	protected _on<C, Key extends keyof E>(once: boolean, type: Key | null, callback: any, context: C, shouldClone: boolean, dispatch: (type: Key, event: E[Key]) => void, debounceDelay?: number): EventListener {
		const info = super._on(once, type, callback, context, shouldClone, dispatch, debounceDelay);

		const rendererEvent = (SpriteEventDispatcher.RENDERER_EVENTS as any)[type];
		if (rendererEvent !== undefined) {
			info.disposer = new MultiDisposer([
				info.disposer,
				this._onRenderer(type as any, rendererEvent),
			]);
		}

		return info;
	}

	/**
	 * Stops the event being handled from being dispatched on the element's
	 * parents. Call it in an event handler, e.g.:
	 *
	 * ```TypeScript
	 * element.events.on("pointerdown", function(ev) {
	 *   // Do something here and prevent from "pointerdown" bubbling up
	 *   // ...
	 *   ev.target.events.stopParentDispatch();
	 * });
	 * ```
	 * ```JavaScript
	 * element.events.on("pointerdown", function(ev) {
	 *   // Do something here and prevent from "pointerdown" bubbling up
	 *   // ...
	 *   ev.target.events.stopParentDispatch();
	 * });
	 * ```
	 */
	public stopParentDispatch() {
		this._dispatchParents = false;
	}

	/**
	 * @ignore
	 */
	public dispatchParents<Key extends keyof E>(type: Key, event: E[Key]): void {
		const old = this._dispatchParents;

		this._dispatchParents = true;

		try {
			this.dispatch(type, event);

			if (this._dispatchParents && this._sprite.parent) {
				this._sprite.parent.events.dispatchParents(type as any, event);
			}

		} finally {
			this._dispatchParents = old;
		}
	}
}


export interface ISpriteSettings extends IEntitySettings {

	/**
	 * X position in the parent: pixels from its left edge, or a [[Percent]] of
	 * its inner width, measured from inside its left padding.
	 */
	x?: number | Percent | null;

	/**
	 * Y position in the parent: pixels from its top edge, or a [[Percent]] of
	 * its inner height, measured from inside its top padding.
	 */
	y?: number | Percent | null;

	/**
	 * Width in pixels, or a [[Percent]] of the parent's inner width. In a
	 * horizontal layout, a percent width is a share of the width the other
	 * children leave.
	 */
	width?: number | Percent | null;

	/**
	 * Height in pixels, or a [[Percent]] of the parent's inner height. In a
	 * vertical layout, a percent height is a share of the height the other
	 * children leave.
	 */
	height?: number | Percent | null;

	/**
	 * Maximum allowed width in pixels.
	 */
	maxWidth?: number | null;

	/**
	 * Maximum allowed height in pixels.
	 */
	maxHeight?: number | null;

	/**
	 * Minimum allowed width in pixels.
	 */
	minWidth?: number | null;

	/**
	 * Minimum allowed height in pixels.
	 */
	minHeight?: number | null;

	/**
	 * Opacity, from `0` (transparent) to `1` (opaque).
	 *
	 * @default 1
	 */
	opacity?: number;

	/**
	 * Rotation in degrees, clockwise, around the point set by `centerX` and
	 * `centerY`.
	 *
	 * @default 0
	 */
	rotation?: number;

	/**
	 * Scale, around the point set by `centerX` and `centerY`: below `1`
	 * shrinks the element, above `1` enlarges it.
	 *
	 * @default 1
	 */
	scale?: number;

	/**
	 * The point of the element that is placed at its `x` position, and that
	 * it rotates and scales around: pixels from its left edge, or a percent of
	 * its width.
	 */
	centerX?: number | Percent;

	/**
	 * The point of the element that is placed at its `y` position, and that
	 * it rotates and scales around: pixels from its top edge, or a percent of
	 * its height.
	 */
	centerY?: number | Percent;

	/**
	 * Left margin in pixels.
	 */
	marginLeft?: number;

	/**
	 * Right margin in pixels.
	 */
	marginRight?: number;

	/**
	 * Top margin in pixels.
	 */
	marginTop?: number;

	/**
	 * Bottom margin in pixels.
	 */
	marginBottom?: number;

	/**
	 * Whether the element is shown. Unlike `show()` and `hide()`, it does not
	 * animate.
	 *
	 * @default true
	 */
	visible?: boolean;

	/**
	 * Positioning of the element.
	 *
	 * `"absolute"` leaves the element out of its parent's layout and size: it
	 * is placed by its `x` and `y` only.
	 *
	 * @default "relative"
	 */
	position?: "absolute" | "relative";

	/**
	 * Horizontal shift in pixels. Can be negative to shift leftward.
	 */
	dx?: number;

	/**
	 * Vertical shift in pixels. Can be negative to shift upward.
	 */
	dy?: number;

	/**
	 * Makes the element respond to the pointer. Adding a pointer event
	 * listener to it turns this on.
	 */
	interactive?: boolean;

	/**
	 * Text of the element's tooltip. It can hold data placeholders, such as
	 * `{value}`.
	 */
	tooltipText?: string;

	/**
	 * HTML content of the element's tooltip, shown in place of `tooltipText`.
	 *
	 * @since 5.2.11
	 */
	tooltipHTML?: string;

	/**
	 * Where on the element the tooltip points, horizontally: pixels from its
	 * left edge, or a percent of its width.
	 *
	 * @default am5.percent(50)
	 */
	tooltipX?: number | Percent;

	/**
	 * Where on the element the tooltip points, vertically: pixels from its top
	 * edge, or a percent of its height.
	 *
	 * @default am5.percent(50)
	 */
	tooltipY?: number | Percent;

	/**
	 * The [[Tooltip]] to show for the element. If not set, the nearest
	 * parent's is used.
	 */
	tooltip?: Tooltip;

	/**
	 * Where the tooltip points: `"fixed"` at `tooltipX` and `tooltipY`, or
	 * `"pointer"` at the pointer, following it.
	 *
	 * @default "fixed"
	 */
	tooltipPosition?: "fixed" | "pointer";

	/**
	 * If `false`, the element's bounds are not measured, so it takes no part
	 * in its parent's layout or size.
	 *
	 * @default true
	 */
	isMeasured?: boolean;

	/**
	 * Field in the data item's data object that holds settings for this
	 * element, applied over its template's.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/settings/template-fields/} for more info
	 */
	templateField?: string;

	/**
	 * Lets the user drag the element. Touches that start on it no longer
	 * scroll the page.
	 */
	draggable?: boolean;

	/**
	 * Makes the element receive mouse wheel events. While the pointer is over
	 * it, the wheel no longer scrolls the page.
	 */
	wheelable?: boolean;

	/**
	 * A [[NumberFormatter]] to use for this element instead of the root's.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/using-formatters/} for more info
	 */
	numberFormatter?: NumberFormatter | undefined;

	/**
	 * A [[DateFormatter]] to use for this element instead of the root's.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/using-formatters/} for more info
	 */
	dateFormatter?: DateFormatter | undefined;

	/**
	 * A [[DurationFormatter]] to use for this element instead of the root's.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/using-formatters/} for more info
	 */
	durationFormatter?: DurationFormatter | undefined;

	/**
	 * Setting that a click or tap toggles between `true` and `false`:
	 * `"active"` or `"disabled"`. `"none"` turns toggling off.
	 */
	toggleKey?: "disabled" | "active" | "none" | undefined;

	/**
	 * Applies the element's `"active"` state while `true`.
	 */
	active?: boolean;

	/**
	 * Applies the element's `"disabled"` state while `true`. It changes only
	 * the look: the element still responds to the pointer.
	 */
	disabled?: boolean;

	/**
	 * An SVG filter to apply to the element.
	 *
	 * IMPORTANT: SVG filters are not supported in some browsers, e.g. Safari.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/colors-gradients-and-patterns/filters/#SVG_filters} for more info
	 * @ignore todo: figure out if we still need this
	 */
	filter?: string;

	/**
	 * CSS cursor to show while the pointer is over the element, e.g.
	 * `"pointer"`.
	 *
	 * @see {@link https://developer.mozilla.org/en-US/docs/Web/CSS/cursor} for more info
	 */
	cursorOverStyle?: string;

	/**
	 * If `false`, the element is left out of exported images of the chart.
	 */
	exportable?: boolean;

	/**
	 * Layer to draw the element on: elements on higher layers show in front of
	 * those on lower ones. If not set, the element is on its parent's layer.
	 */
	layer?: number;

	/**
	 * Margins in pixels that make the element's layer larger than the chart,
	 * or, when negative, smaller.
	 *
	 * @since @5.2.39
	 */
	layerMargin?: IMargin;

	/**
	 * Hides the element whatever its `visible` setting, even when `show()` is
	 * called.
	 */
	forceHidden?: boolean;

	/**
	 * Plays the element's reveal animation, as `appear()` does, when it is
	 * first drawn: a chart fades in, a series grows its columns or lines from
	 * the base. A series waits for its first data. It plays once: data updates
	 * do not replay it, but turning the setting off and on again does.
	 * Elements made from a template play as each one is made.
	 *
	 * An element that starts hidden (`visible: false`, or hidden in code before
	 * it is drawn) stays hidden. An `animations` entry on the same setting,
	 * such as a pulsing `opacity`, keeps playing.
	 *
	 * This is how a JSON config gets the opening animation, as a config cannot
	 * call `appear()`.
	 *
	 * ```TypeScript
	 * chart.setAll({ autoAppear: true, appearDuration: 1000, appearDelay: 100 });
	 * series.setAll({ autoAppear: true, appearDuration: 1000 });
	 * ```
	 * ```JavaScript
	 * chart.setAll({ autoAppear: true, appearDuration: 1000, appearDelay: 100 });
	 * series.setAll({ autoAppear: true, appearDuration: 1000 });
	 * ```
	 *
	 * @default false
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/animations/} for more info
	 * @since 5.21.0
	 */
	autoAppear?: boolean;

	/**
	 * Duration of the `autoAppear` animation, in milliseconds. Without it, the
	 * element's `stateAnimationDuration` is used.
	 *
	 * @since 5.21.0
	 */
	appearDuration?: number;

	/**
	 * Milliseconds to wait before the `autoAppear` animation starts. The
	 * element stays hidden until then.
	 *
	 * @default 0
	 * @since 5.21.0
	 */
	appearDelay?: number;

	/**
	 * Makes the element and its children ignore the pointer, even with
	 * `interactive: true` or event listeners set.
	 *
	 * @since 5.0.21
	 */
	forceInactive?: boolean;

	/**
	 * When the element's tooltip shows:
	 * * `"hover"` (default) - while the pointer is over the element, or after
	 *   a tap on it until a tap elsewhere.
	 * * `"always"` - all the time. To show tooltips of several elements at
	 *   once, give each its own [[Tooltip]] (`tooltip`).
	 * * `"click"` - after a click or tap on the element, until a click
	 *   anywhere else on the page.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/common-elements/tooltips/#Sticky_tooltips} for more info
	 * @default "hover"
	 * @since 5.0.16
	 */
	showTooltipOn?: "hover" | "always" | "click";

	/**
	 * Draws the element sharply, with minimal anti-aliasing: its position is
	 * rounded to whole pixels, and `strokeWidth` is adjusted to the device
	 * pixel ratio, so lines may look thinner than expected.
	 *
	 * NOTE: it may not work well on several elements that are meant to fit
	 * together exactly.
	 *
	 * @default false
	 * @since 5.3.0
	 */
	crisp?: boolean;

	/**
	 * Blur radius in pixels, from `0` (no blur) up.
	 *
	 * IMPORTANT: This setting is not supported in Safari browsers.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/colors-gradients-and-patterns/filters/} for more info
	 * @since 5.5.0
	 */
	blur?: number;

	/**
	 * Brightness.
	 *
	 * * `0` - completely black
	 * * `1` - no changes (default)
	 * * `>1` - brighter
	 *
	 * IMPORTANT: This setting is not supported in Safari browsers.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/colors-gradients-and-patterns/filters/} for more info
	 * @since 5.5.0
	 */
	brightness?: number;

	/**
	 * Contrast.
	 *
	 * * `0` - completely gray
	 * * `1` - no changes (default)
	 * * `>1` - more contrast
	 *
	 * IMPORTANT: This setting is not supported in Safari browsers.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/colors-gradients-and-patterns/filters/} for more info
	 * @since 5.5.0
	 */
	contrast?: number;

	/**
	 * Saturation.
	 *
	 * * `0` - grayscale
	 * * `1` - no changes (default)
	 * * `>1` - more saturated
	 *
	 * IMPORTANT: This setting is not supported in Safari browsers.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/colors-gradients-and-patterns/filters/} for more info
	 * @since 5.5.0
	 */
	saturate?: number;

	/**
	 * Sepia tone, from `0` (no changes) to `1` (full sepia).
	 *
	 * IMPORTANT: This setting is not supported in Safari browsers.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/colors-gradients-and-patterns/filters/} for more info
	 * @since 5.5.0
	 */
	sepia?: number;

	/**
	 * Color inversion, from `0` (no changes) to `1` (fully inverted colors).
	 *
	 * IMPORTANT: This setting is not supported in Safari browsers.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/colors-gradients-and-patterns/filters/} for more info
	 * @since 5.5.0
	 */
	invert?: number;

	/**
	 * Rotates the hue of all colors by this many degrees, from `0` to `360`.
	 *
	 * IMPORTANT: This setting is not supported in Safari browsers.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/colors-gradients-and-patterns/filters/} for more info
	 * @since 5.5.0
	 */
	hue?: number;

	/**
 * An internal order by which focusable elements will be selected within the
 * chart.
 * 
 * @see {@link https://www.amcharts.com/docs/v5/concepts/accessibility/#Focusing_elements} for more info
 */
	tabindexOrder?: number;

	/**
	 * Simulate hover on an element when it gains focus, including changing hover
	 * appearance and displaying a tooltip if applicable.
	 * 
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/accessibility/#Focusing_elements} for more info
	 */
	hoverOnFocus?: boolean;

	/**
	 * Can element be focused, i.e. selected using TAB key.
	 * 
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/accessibility/#Focusing_elements} for more info
	 */
	focusable?: boolean;

	/**
	 * An identifier by which to group common elements into focusable groups.
	 *
	 * If set, only the first element in he group will be focusable via TAB key.
	 * When it is selected, the rest of the elements in the same group can be
	 * selected using arrow keys.
	 *
	 * It allows users to TAB-through chart elements quickly without the need
	 * to TAB into each and every element.
	 *
	 * It's up to implementer of the charts to provide meaningful `ariaLabel` to
	 * the element, which advertises this capability and provides adequate
	 * instructions.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/accessibility/#Grouping_focusable_elements} for more info
	 * @since 5.0.6
	 */
	focusableGroup?: string | number;

	/**
	 * If set, the text will be read out (announced) by a screen reader when
	 * focused element is "clicked" (by pressing ENTER or SPACE).
	 * 
	 * @since 5.10.8
	 */
	clickAnnounceText?: string;

	/**
	 * Element's role.
	 * 
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/accessibility/#Roles} for more info
	 */
	role?: Role;

	/**
	 * `aria-live` setting.
	 */
	ariaLive?: AriaLive;

	/**
	 * `aria-checked` setting.
	 *
	 * This setting is ignored unless `role` is one of the following:
	 * * `"checkbox"`
	 * * `"option"`
	 * * `"radio"`
	 * * `"menuitemcheckbox"`
	 * * `"menuitemradio"`
	 * * `"treeitem"`
	 *
	 * On a toggle `"button"` (one with `toggleKey`) it is exposed as
	 * `aria-pressed`.
	 */
	ariaChecked?: boolean;

	/**
	 * `aria-expanded` setting: whether the content the element shows or hides
	 * (e.g. a task's subtasks, a node's children) is shown.
	 *
	 * @see {@link https://w3c.github.io/aria/#aria-expanded} for more info
	 * @since 5.21.0
	 */
	ariaExpanded?: boolean;

	/**
	 * `aria-current` setting.
	 * 
	 * @see {@link https://w3c.github.io/aria/#aria-current} for more info
	 * @since 5.9.8
	 */
	ariaCurrent?: string;

	/**
	 * `aria-selected` setting.
	 * 
	 * @see {@link https://w3c.github.io/aria/#aria-selected} for more info
	 * @since 5.9.8
	 */
	ariaSelected?: boolean;

	/**
	 * `aria-hidden` setting.
	 */
	ariaHidden?: boolean;

	/**
	 * Label for the element to use for screen readers.
	 * 
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/accessibility/#Screen_reader} for more info
	 */
	ariaLabel?: string;

	/**
	 * `aria-orientation` setting.
	 */
	ariaOrientation?: string;

	/**
	 * `aria-valuenow` setting.
	 */
	ariaValueNow?: string;

	/**
	 * `aria-valuemin` setting.
	 */
	ariaValueMin?: string;

	/**
	 * `aria-valuemax` setting.
	 */
	ariaValueMax?: string;

	/**
	 * `aria-valuetext` setting.
	 */
	ariaValueText?: string;

	/**
	 * `aria-controls` setting.
	 */
	ariaControls?: string;

	//ariaDescription?: string;
	//readerControls?: string;

}

export interface ISpritePrivate extends IEntityPrivate {
	/**
	 * @ignore
	 */
	customData?: any;

	/**
	 * A 2x2 transform applied around the element's position after its
	 * rotation and scale.
	 *
	 * @ignore
	 */
	deform?: IDeform | null;

	/**
	 * @ignore
	 */
	x?: number;

	/**
	 * @ignore
	 */
	y?: number;

	/**
	 * @ignore
	 */
	width?: number;

	/**
	 * @ignore
	 */
	height?: number;

	/**
	 * @ignore
	 */
	visible?: boolean;

	/**
	 * `true` while the element shows its tooltip.
	 */
	showingTooltip?: boolean;

	/**
	 * @ignore
	 */
	touchHovering?: boolean;

	/**
	 * @ignore
	 */
	focusElement?: {
		dom: HTMLDivElement,
		disposers: Array<IDisposer>,
	};

	/**
	 * An element whose tooltip point and colors the tooltip uses, in place of
	 * this element's.
	 */
	tooltipTarget?: Graphics;

	/**
	 * @ignore
	 */
	list?: ListTemplate<Sprite>;

	/**
	 * @ignore
	 */
	maxWidth?: number | null;

	/**
	 * @ignore
	 */
	maxHeight?: number | null;

	/**
	 * @ignore
	 */
	minWidth?: number | null;

	/**
	 * @ignore
	 */
	minHeight?: number | null;

	/**
	 * If set to `false`, its tabindex will be set to -1, so it does not get
	 * focused with TAB, regardless whether its public setting `focusable` is
	 * set to `true`.
	 *
	 * @since 5.3.16
	 */
	focusable?: boolean;

	/**
	 * If set to `true`, the sprite gets no focus element, so it is left out of
	 * keyboard navigation and screen readers even if `focusable` is `true`.
	 *
	 * Used for map objects that their series leaves out with `include` or
	 * `exclude`.
	 *
	 * @ignore
	 */
	focusExcluded?: boolean;

	/**
	 * If set to `true`, the sprite is outside the visible area (e.g. a map
	 * object panned or zoomed away): it is not a TAB stop, but screen readers
	 * can still read it.
	 *
	 * @ignore
	 */
	focusOutOfView?: boolean;

	/**
	 * Checks that the pointer is within the element's bounds before
	 * dispatching `"pointerover"`. This prevents ghost tooltips that sometimes
	 * appear while the pointer moves over interactive elements.
	 *
	 * It is `true` by default on `Rectangle` and `Circle`.
	 *
	 * @since 5.5.0
	 */
	trustBounds?: boolean;

	/**
	 * The last point the tooltip was shown at, so it is not shown again at the
	 * same place.
	 *
	 * @since 5.11.3
	 */
	lastTooltipCoords?: IPoint;

}

/**
 * Event object of a pointer interaction.
 */
export interface ISpritePointerEvent {

	/**
	 * Original event object that caused the interaction, e.g. [[MouseEvent]].
	 */
	originalEvent: IPointerEvent;

	/**
	 * The point of the event, relative to the root.
	 */
	point: IPoint;

	/**
	 * `true` if the event was generated by code rather than by user
	 * interaction.
	 */
	simulated: boolean;

	/**
	 * Whether event originated in chart's container or its children.
	 */
	native?: boolean;

	/**
	 * The element on which the event occurred.
	 */
	target: Sprite;

}

export interface ISpriteEvents extends IEntityEvents {

	/**
	 * The element's data item changed.
	 */
	dataitemchanged: {
		oldDataItem: DataItem<IComponentDataItem> | undefined,
		newDataItem: DataItem<IComponentDataItem> | undefined
	};

	/**
	 * The element's position changed.
	 */
	positionchanged: {};

	/**
	 * The element's bounds changed.
	 */
	boundschanged: {};

	/**
	 * Dragging of the element started: the pointer moved more than 5 pixels
	 * after pressing on it.
	 */
	dragstart: ISpritePointerEvent;

	/**
	 * Dragging of the element stopped.
	 */
	dragstop: ISpritePointerEvent;

	/**
	 * The element moved while being dragged.
	 */
	dragged: ISpritePointerEvent;

	/**
	 * The element was clicked or tapped. A press and release more than 5
	 * pixels apart is not a click.
	 */
	click: ISpritePointerEvent;

	/**
	 * The element was clicked with the right mouse button.
	 */
	rightclick: ISpritePointerEvent;

	/**
	 * The element was clicked with the middle mouse button.
	 */
	middleclick: ISpritePointerEvent;

	/**
	 * The element was double-clicked or double-tapped. Also dispatched on its
	 * parents.
	 */
	dblclick: ISpritePointerEvent;

	/**
	 * The pointer moved over the element.
	 */
	pointerover: ISpritePointerEvent;

	/**
	 * The pointer left the element.
	 */
	pointerout: ISpritePointerEvent;

	/**
	 * A pointer button was pressed, or a touch started, over the element. Also
	 * dispatched on its parents.
	 */
	pointerdown: ISpritePointerEvent;

	/**
	 * A pointer button was released, or a touch ended, over the element.
	 */
	pointerup: ISpritePointerEvent;

	/**
	 * A pointer button was released, or a touch ended, anywhere in the window,
	 * even outside the chart.
	 */
	globalpointerup: ISpritePointerEvent;

	/**
	 * The pointer moved anywhere in the window, even outside the chart.
	 */
	globalpointermove: ISpritePointerEvent;

	/**
	 * A pointer button was pressed, or a touch started, anywhere in the
	 * window, even outside the chart.
	 */
	globalpointerdown: ISpritePointerEvent;

	/**
	 * The mouse wheel turned while the pointer was over the element. Also
	 * dispatched on its parents.
	 */
	wheel: {
		originalEvent: WheelEvent;
		point: IPoint;
	};

	/**
	 * Invoked when element gains focus.
	 */
	focus: {
		originalEvent: FocusEvent;
		target: Sprite;
	};

	/**
	 * Invoked when element loses focus.
	 */
	blur: {
		originalEvent: FocusEvent;
		target: Sprite;
	};

}

/**
 * Base class of all visual elements.
 *
 * @important
 */
export abstract class Sprite extends Entity {
	declare public _settings: ISpriteSettings;
	declare public _privateSettings: ISpritePrivate;
	declare public _events: ISpriteEvents;

	declare public events: SpriteEventDispatcher<this, Events<this, this["_events"]>>;

	public abstract _display: IDisplayObject;

	public _adjustedLocalBounds: IBounds = { left: 0, right: 0, top: 0, bottom: 0 };

	public _localBounds: IBounds = { left: 0, right: 0, top: 0, bottom: 0 };

	public static className: string = "Sprite";
	public static classNames: Array<string> = Entity.classNames.concat([Sprite.className]);

	public _parent: Container | undefined;
	protected _dataItem: DataItem<IComponentDataItem> | undefined;

	protected _templateField: Template<this> | undefined;

	protected _sizeDirty: boolean = false;

	// Will be true only when dragging
	public _isDragging: boolean = false;

	// The event when the dragging starts
	protected _dragEvent: ISpritePointerEvent | undefined;

	// The position when dragging starts
	protected _dragPoint: IPoint | undefined;

	protected _isHidden: boolean = false;

	protected _isShowing: boolean = false;

	protected _isHiding: boolean = false;

	protected _isDown: boolean = false;
	public _downPoint: IPoint | undefined;

	public _downPoints: { [index: number]: IPoint } = {};

	public _toggleDp: IDisposer | undefined;

	protected _dragDp: MultiDisposer | undefined;

	protected _tooltipDp: MultiDisposer | undefined;

	protected _hoverDp: MultiDisposer | undefined;

	protected _focusDp: MultiDisposer | undefined;

	protected _tooltipMoveDp: IDisposer | undefined;

	protected _tooltipPointerDp: MultiDisposer | undefined;

	//protected _statesHandled: boolean = false;

	protected _virtualParent: Container | undefined;

	protected _afterNew() {
		this.setPrivateRaw("visible", true);
		super._afterNew();
	}

	/**
	 * Marks a setting as changed, so the element reads it again, running its
	 * adapters, on the next frame.
	 *
	 * @param  key  Setting key
	 */
	public markDirtyKey<Key extends keyof this["_settings"]>(key: Key) {
		this._markDirtyKey(key);
	}

	public _markDirtyKey<Key extends keyof this["_settings"]>(key: Key) {
		super._markDirtyKey(key);
		if (key == "x" || key == "y" || key == "dx" || key == "dy") {
			this.markDirtyBounds();
			this._addPercentagePositionChildren();
			this.markDirtyPosition();
		}
	}

	public _markDirtyPrivateKey<Key extends keyof this["_privateSettings"]>(key: Key) {
		super._markDirtyPrivateKey(key);
		if (key == "x" || key == "y") {
			this.markDirtyPosition();
		}
	}

	protected _removeTemplateField(): void {
		if (this._templateField) {
			this._templateField._removeObjectTemplate(this);
		}
	}

	protected _createEvents(): SpriteEventDispatcher<this, Events<this, this["_events"]>> {
		return new SpriteEventDispatcher(this);
	}

	public _processTemplateField(): void {
		let template;

		const field = this.get("templateField");

		if (field) {
			const dataItem = this.dataItem;
			if (dataItem) {
				const context = dataItem.dataContext;
				if (context) {
					template = (context as any)[field];

					if (!(template instanceof Template) && template) {
						template = Template.new(template);
					}
				}
			}
		}

		if (this._templateField !== template) {
			this._removeTemplateField();

			this._templateField = template;

			if (template) {
				template._setObjectTemplate(this);
			}

			this._applyTemplates();
		}
	}

	// TODO change this to run before the element is added to the parent, so that way
	//      it doesn't need to apply the themes twice
	public _setDataItem(dataItem?: DataItem<IComponentDataItem>): void {
		const oldDataItem = this._dataItem
		this._dataItem = dataItem;
		this._processTemplateField();
		const eventType = "dataitemchanged";
		if (dataItem != oldDataItem) {
			// Animations of the data item's values move to the new one
			const animations = this.get("animations");
			if (animations && animations.some((a) => a.target === "dataItem")) {
				this._markDirtyKey("animations");
			}

			if (this.events.isEnabled(eventType)) {
				this.events.dispatch(eventType, {
					type: eventType,
					target: this,
					oldDataItem: oldDataItem,
					newDataItem: dataItem
				});
			}
		}
	}

	/**
	 * The element's [[DataItem]], or, if it has none, its nearest parent's.
	 *
	 * NOTE: data items are assigned automatically in most cases where it
	 * matters. Set one only if you know what you are doing.
	 *
	 * @param  value  Data item
	 */
	public set dataItem(value: DataItem<IComponentDataItem> | undefined) {
		this._setDataItem(value);
	}

	/**
	 * @return DataItem
	 */
	public get dataItem(): DataItem<IComponentDataItem> | undefined {
		if (this._dataItem) {
			return this._dataItem;

		} else {
			let parent = this._parent;

			while (parent) {
				if (parent._dataItem) {
					return parent._dataItem;

				} else {
					parent = parent._parent;
				}
			}
		}
	}

	protected _addPercentageSizeChildren() {
		let parent = this.parent;
		if (parent) {
			if (this.get("width") instanceof Percent || this.get("height") instanceof Percent) {
				$array.pushOne(parent._percentageSizeChildren, this);
			} else {
				$array.removeFirst(parent._percentageSizeChildren, this);
			}
		}
	}

	protected _addPercentagePositionChildren() {
		let parent = this.parent;
		if (parent) {
			if (this.get("x") instanceof Percent || this.get("y") instanceof Percent) {
				$array.pushOne(parent._percentagePositionChildren, this);
			} else {
				$array.removeFirst(parent._percentagePositionChildren, this);
			}
		}
	}

	/**
	 * @ignore
	 */
	public markDirtyPosition() {
		this._root._addDirtyPosition(this);
	}

	protected updatePivotPoint() {
		const bounds = this._localBounds;
		if (bounds) {
			const centerX = this.get("centerX");
			if (centerX != null) {
				this._display.pivot.x = bounds.left + $utils.relativeToValue(centerX!, bounds.right - bounds.left);
			}

			const centerY = this.get("centerY");
			if (centerY != null) {
				this._display.pivot.y = bounds.top + $utils.relativeToValue(centerY!, bounds.bottom - bounds.top);
			}
		}
	}

	public _beforeChanged() {
		super._beforeChanged();

		this._applyAutoAppear();

		// handling states in beforeChanged, otherwise states is not applied without animated theme
		this._handleStates();

		if (this.isDirty("tooltip")) {
			const previous = this._prevSettings.tooltip;
			if (previous) {
				previous.dispose();
			}
		}

		if (this.isDirty("layer") || this.isDirty("layerMargin")) {
			this._display.setLayer(this.get("layer"), this.get("layerMargin"));
			this.markDirtyLayer();
		}

		if (this.isDirty("tooltipPosition")) {
			const tooltipMoveDp = this._tooltipMoveDp;
			if (tooltipMoveDp) {
				tooltipMoveDp.dispose();
				this._tooltipMoveDp = undefined;
			}

			const tooltipPointerDp = this._tooltipPointerDp;
			if (tooltipPointerDp) {
				tooltipPointerDp.dispose();
				this._tooltipPointerDp = undefined;
			}

			if (this.get("tooltipPosition") == "pointer") {

				if (this.isHover()) {
					this._tooltipMoveDp = this.events.on("globalpointermove", (e) => {
						this.showTooltip(e.point);
					})
				}

				this._tooltipPointerDp = new MultiDisposer([
					this.events.on("pointerover", () => {
						const tooltipMoveDp = this._tooltipMoveDp;
						if (tooltipMoveDp) {
							tooltipMoveDp.dispose();
							this._tooltipMoveDp = undefined;
						}
						this._tooltipMoveDp = this.events.on("globalpointermove", (e) => {
							this.showTooltip(e.point);
						})
					}),

					this.events.on("pointerout", () => {
						const tooltipMoveDp = this._tooltipMoveDp;
						if (tooltipMoveDp) {
							tooltipMoveDp.dispose();
							this._tooltipMoveDp = undefined;
						}
					})])
			}
		}
	}

	protected _handleStates() {
		//if (!this._statesHandled) {
		if (this.isDirty("active")) {

			if (this.get("active")) {
				this.states.applyAnimate("active");
				this._setC("ariaChecked", true);
			}
			else {
				if (!this.isHidden()) {
					this.states.applyAnimate("default");
				}
				this._setC("ariaChecked", false);
			}
			this.markDirtyAccessibility();
		}

		if (this.isDirty("disabled")) {
			if (this.get("disabled")) {
				this.states.applyAnimate("disabled");
				this._setC("ariaChecked", false);
			}
			else {
				if (!this.isHidden()) {
					this.states.applyAnimate("default");
				}
				this._setC("ariaChecked", true);
			}
			this.markDirtyAccessibility();
		}
		//	this._statesHandled = true;
		//}
	}

	public _changed() {
		super._changed();

		const display = this._display;
		const events = this.events;

		if (this.isDirty("draggable")) {
			const draggable = this.get("draggable");
			if (draggable) {
				this._setC("interactive", true);

				this._dragDp = new MultiDisposer([
					events.on("pointerdown", (ev) => {
						this.dragStart(ev);
					}),

					events.on("globalpointermove", (ev) => {
						this.dragMove(ev);
					}),

					events.on("globalpointerup", (ev) => {
						this.dragStop(ev);
					})])

			}
			else {
				if (this._dragDp) {
					this._dragDp.dispose();
					this._dragDp = undefined;
				}
			}
			display.cancelTouch = draggable ? true : false;
		}

		if (this.isDirty("tooltipText") || this.isDirty("tooltipHTML") || this.isDirty("showTooltipOn")) {
			const tooltipText = this.get("tooltipText");
			const tooltipHTML = this.get("tooltipHTML");
			const showTooltipOn = this.get("showTooltipOn", "hover");
			if (this._tooltipDp) {
				this._tooltipDp.dispose();
				this._tooltipDp = undefined;
			}
			if (tooltipText || tooltipHTML) {
				if (showTooltipOn == "click") {
					this._tooltipDp = new MultiDisposer([
						events.on("click", () => {
							this.setTimeout(() => {
								const tooltip = this.getTooltip();
								if (tooltip && !tooltip.isHidden() && tooltip.get("tooltipTarget") === this) {
									this.hideTooltip();
								}
								else {
									this.showTooltip();
								}
							}, 10);
						}),
						$utils.addEventListener(document, "click", (_ev: MouseEvent) => {
							this.hideTooltip();
						})
					]);
					this._disposers.push(this._tooltipDp);
				}
				else if (showTooltipOn == "always") {
					// nothing
				}
				else {
					this._tooltipDp = new MultiDisposer([
						events.on("pointerover", () => {
							this.showTooltip();
						}),
						events.on("pointerout", () => {
							this.hideTooltip();
						})
					]);
					this._disposers.push(this._tooltipDp);
				}
			}
		}

		if (this.isDirty("toggleKey")) {
			let toggleKey = this.get("toggleKey") as any;
			if (toggleKey && toggleKey != "none") {
				this._toggleDp = events.on("click", () => {
					if (!this._isDragging) {
						this.set(toggleKey, !this.get(toggleKey));
					}
				})
			}
			else {
				if (this._toggleDp) {
					this._toggleDp.dispose();
					this._toggleDp = undefined;
				}
			}
		}


		if (this.isDirty("opacity")) {
			display.alpha = Math.max(0, this.get("opacity", 1));
			if (this.get("focusable")) {
				this.markDirtyAccessibility();
			}
		}

		if (this.isDirty("rotation")) {
			this.markDirtyBounds();
			display.angle = this.get("rotation", 0);
		}

		if (this.isDirty("scale")) {
			this.markDirtyBounds();
			display.scale = this.get("scale", 0);
		}

		if (this.isPrivateDirty("deform")) {
			this.markDirtyBounds();
			display.deform = (this.getPrivate("deform") as IDeform | null | undefined) || null;
		}

		if (this.isDirty("centerX") || this.isDirty("centerY")) {
			this.markDirtyBounds();
			this.updatePivotPoint();
		}

		if (this.isDirty("visible") || this.isPrivateDirty("visible") || this.isDirty("forceHidden")) {
			if (!this.get("visible") || !this.getPrivate("visible") || this.get("forceHidden")) {
				display.visible = false;
				this.hideTooltip();
			}
			else {
				display.visible = true;
			}

			this.markDirtyBounds();
			if (this.get("focusable")) {
				this.markDirtyAccessibility();
			}
		}

		if (this.isDirty("width") || this.isDirty("height")) {
			this.markDirtyBounds();
			this._addPercentageSizeChildren();

			const parent = this.parent;
			if (parent) {
				if ((this.isDirty("width") && this.get("width") instanceof Percent) || (this.isDirty("height") && this.get("height") instanceof Percent)) {
					parent.markDirty();
					parent._prevWidth = 0;
				}
			}

			this._sizeDirty = true;
		}

		if (this.isDirty("maxWidth") || this.isDirty("maxHeight") || this.isPrivateDirty("width") || this.isPrivateDirty("height") || this.isDirty("minWidth") || this.isDirty("minHeight") || this.isPrivateDirty("maxWidth") || this.isPrivateDirty("maxHeight") || this.isPrivateDirty("minWidth") || this.isPrivateDirty("minHeight") || this.isDirty("marginLeft") || this.isDirty("marginTop") || this.isDirty("marginRight") || this.isDirty("marginBottom")) {
			this.markDirtyBounds();
			this._sizeDirty = true;
		}

		if (this._sizeDirty) {
			this._updateSize();
		}

		if (this.isDirty("wheelable")) {
			const wheelable = this.get("wheelable");
			if (wheelable) {
				this._setC("interactive", true);
			}
			display.wheelable = wheelable ? true : false;
		}

		// Accessibility
		if (this.isPrivateDirty("focusExcluded") && this.get("focusable")) {
			this._root._registerTabindexOrder(this);
			this.markDirtyAccessibility();
		}

		if (this.isDirty("tabindexOrder") || this.isDirty("focusableGroup")) {
			if (this.get("focusable")) {
				this._root._registerTabindexOrder(this);
			}
			else {
				this._root._unregisterTabindexOrder(this);
			}
		}

		if (this.isDirty("filter") || this.isDirty("blur") || this.isDirty("saturate") || this.isDirty("brightness") || this.isDirty("contrast") || this.isDirty("sepia") || this.isDirty("hue") || this.isDirty("invert")) {
			// Built from all of them, so changing one keeps the rest and a neutral value clears
			let filter = this.get("filter", "");

			const blur = this.get("blur", 0);
			if (blur != 0) {
				filter += " blur(" + blur + "px)";
			}

			const saturate = this.get("saturate", 1);
			if (saturate != 1) {
				filter += " saturate(" + saturate + ")";
			}

			const brightness = this.get("brightness", 1);
			if (brightness != 1) {
				filter += " brightness(" + brightness + ")";
			}

			const contrast = this.get("contrast", 1);
			if (contrast != 1) {
				filter += " contrast(" + contrast + ")";
			}

			const sepia = this.get("sepia", 0);
			if (sepia != 0) {
				filter += " sepia(" + sepia + ")";
			}

			const hue = this.get("hue", 0);
			if (hue != 0) {
				filter += " hue-rotate(" + hue + "deg)";
			}

			const invert = this.get("invert", 0);
			if (invert != 0) {
				filter += " invert(" + invert + ")";
			}

			display.filter = filter.trim();
		}

		if (this.isDirty("cursorOverStyle")) {
			display.cursorOverStyle = this.get("cursorOverStyle");
		}

		if (this.isDirty("hoverOnFocus")) {
			if (this.get("hoverOnFocus")) {
				this._focusDp = new MultiDisposer([
					events.on("focus", () => {
						// TODO: proper hover, not just tooltip
						// A tooltip brought up by keyboard focus is read out
						const tooltip = this.getTooltip();
						if (tooltip) {
							tooltip._focusAnnounce = true;
						}
						this.showTooltip();
					}),

					events.on("blur", () => {
						// TODO: proper hover, not just tooltip
						const tooltip = this.getTooltip();
						if (tooltip) {
							tooltip._focusAnnounce = false;
						}
						this.hideTooltip();
					})]);
			}
			else {
				if (this._focusDp) {
					this._focusDp.dispose();
					this._focusDp = undefined;
				}
			}
		}

		if (this.isDirty("focusable")) {
			if (this.get("focusable")) {
				this._root._registerTabindexOrder(this);
			}
			else {
				this._root._unregisterTabindexOrder(this);
			}
			this.markDirtyAccessibility();
			this._disposers.push(events.on("blur", () => {
				this.setPrivateRaw("touchHovering", false);
			}));
			this._disposers.push(events.once("boundschanged", () => {
				// We might need to do this to re-evaluate accessibility attributes
				// once the element gains size (bounds)
				this.markDirtyAccessibility();
			}));
		}

		if (this.isPrivateDirty("focusable") || this.isPrivateDirty("focusOutOfView")) {
			this.markDirtyAccessibility();
		}

		if (this.isDirty("role") || this.isDirty("ariaLive") || this.isDirty("ariaChecked") || this.isDirty("ariaCurrent") || this.isDirty("ariaSelected") || this.isDirty("ariaExpanded") || this.isDirty("ariaHidden") || this.isDirty("ariaOrientation") || this.isDirty("ariaValueNow") || this.isDirty("ariaValueMin") || this.isDirty("ariaValueMax") || this.isDirty("ariaValueText") || this.isDirty("ariaLabel") || this.isDirty("ariaControls")) {
			// display.accessibility.ariaLabel = populateString(this, this.get("ariaLabel", ""));
			// @todo make sure ariaLabel gets populated in Root
			this.markDirtyAccessibility();
		}

		if (this.isDirty("exportable")) {
			display.exportable = this.get("exportable");
		}

		if (this.isDirty("interactive")) {
			const events = this.events;
			if (this.get("interactive") && !events.isDisposed()) {
				this._hoverDp = new MultiDisposer([
					events.on("click", (ev) => {
						if ($utils.isTouchEvent(ev.originalEvent)) {
							if (!this.getPrivate("touchHovering")) {
								this.setTimeout(() => {
									this._handleOver();
									if (this.get("tooltipText") || this.get("tooltipHTML")) {
										this.showTooltip();
									}
									this.setPrivateRaw("touchHovering", true);
									this.events.dispatch("pointerover", {
										type: "pointerover",
										target: ev.target,
										originalEvent: ev.originalEvent,
										point: ev.point,
										simulated: ev.simulated
									});
								}, 10)
							}
						}
					}),

					events.on("globalpointerup", (ev) => {
						if ($utils.isTouchEvent(ev.originalEvent)) {
							// Only "out" if the tap landed away from this element. A tap
							// on the same element keeps it hovered (isHover), so the tooltip
							// stays put and simply repositions, instead of hiding.
							if (this.getPrivate("touchHovering") && !this.isHover()) {
								this._handleOut();
								if (this.get("tooltipText") || this.get("tooltipHTML")) {
									this.hideTooltip();
								}
								this.setPrivateRaw("touchHovering", false);
								this.events.dispatch("pointerout", {
									type: "pointerout",
									target: ev.target,
									originalEvent: ev.originalEvent,
									point: ev.point,
									simulated: ev.simulated
								});
							}
						}

						if (this._isDown) {
							this._handleUp(ev);
						}
						//this._isDown = false;
					}),

					events.on("pointerover", () => {
						this._handleOver();
					}),

					events.on("pointerout", () => {
						this._handleOut();
					}),

					events.on("pointerdown", (e) => {
						this._handleDown(e);
					})
				])
			}
			else {
				this._display.interactive = false;
				if (this._hoverDp) {
					this._hoverDp.dispose();
					this._hoverDp = undefined;
				}
			}
		}

		if (this.isDirty("forceInactive")) {
			this._display.inactive = this.get("forceInactive", null);
		}

		if (this.get("showTooltipOn") == "always" && this._display.visible) {
			this.showTooltip();
		}
	}

	/**
	 * @ignore
	 * @todo should this be user-accessible?
	 */
	public dragStart(e: ISpritePointerEvent) {
		this._dragEvent = e;
		this.events.stopParentDispatch();
	}

	/**
	 * @ignore
	 * @todo should this be user-accessible?
	 */
	public dragStop(e: ISpritePointerEvent) {
		this._dragEvent = undefined;
		this._dragPoint = undefined;
		this.events.stopParentDispatch();

		if (this._isDragging) {
			this._isDragging = false;

			const type = "dragstop";
			if (this.events.isEnabled(type)) {
				this.events.dispatch(type, {
					type: type,
					target: this,
					originalEvent: e.originalEvent,
					point: e.point,
					simulated: e.simulated,
				});
			}
		}
	}

	protected _handleOver() {
		if (!this.isHidden()) {
			if (this.get("active") && this.states.lookup("hoverActive")) {
				this.states.applyAnimate("hoverActive");
			}
			else if (this.get("disabled") && this.states.lookup("hoverDisabled")) {
				this.states.applyAnimate("hoverDisabled");
			}
			else {
				this.states.applyAnimate("hover");
			}
			if (this.get("draggable") && this._isDown && this.states.lookup("down")) {
				this.states.applyAnimate("down");
			}
		}
	}

	protected _handleOut() {
		if (!this.isHidden()) {
			if (this.get("active") && this.states.lookup("active")) {
				this.states.applyAnimate("active");
			}
			else if (this.get("disabled") && this.states.lookup("disabled")) {
				this.states.applyAnimate("disabled");
			}
			else {
				if (this.states.lookup("hover") || this.states.lookup("hoverActive")) {
					this.states.applyAnimate("default");
				}
			}
			if (this.get("draggable") && this._isDown && this.states.lookup("down")) {
				this.states.applyAnimate("down");
			}
		}
	}

	protected _handleUp(e: ISpritePointerEvent) {
		if (!this.isHidden()) {
			if (this.get("active") && this.states.lookup("active")) {
				this.states.applyAnimate("active");
			}
			else if (this.get("disabled") && this.states.lookup("disabled")) {
				this.states.applyAnimate("disabled");
			}
			else if (this.states.lookup("down")) {
				if (this.isHover()) {
					this.states.applyAnimate("hover");
				}
				else {
					this.states.applyAnimate("default");
				}
			}


			// @todo remove this once migrated to _downPoints
			this._downPoint = undefined;

			const pointerId = $utils.getPointerId(e.originalEvent);
			delete this._downPoints[pointerId];

			if ($object.keys(this._downPoints).length == 0) {
				this._isDown = false;
			}
		}
	}

	public _hasMoved(e: ISpritePointerEvent): boolean {
		// @todo remove this once migrated to _downPoints
		// if (this._downPoint) {
		// 	const x = Math.abs(this._downPoint.x - e.point.x);
		// 	const y = Math.abs(this._downPoint.y - e.point.y);
		// 	return (x > 5) || (y > 5);
		// }

		const pointerId = $utils.getPointerId(e.originalEvent);
		const downPoint = this._downPoints[pointerId];
		if (downPoint) {
			const x = Math.abs(downPoint.x - e.point.x);
			const y = Math.abs(downPoint.y - e.point.y);
			return (x > 5) || (y > 5);
		}

		return false;
	}

	public _hasDown(): boolean {
		return $object.keys(this._downPoints).length > 0;
	}

	protected _handleDown(e: ISpritePointerEvent) {

		const parent = this.parent;
		if (parent && !this.get("draggable")) {
			parent._handleDown(e);
		}

		if (this.get("interactive") && !this.isHidden()) {
			if (this.states.lookup("down")) {
				this.states.applyAnimate("down");
			}
			this._downPoint = {
				x: e.point.x,
				y: e.point.y
			};


			// @todo remove this once migrated to _downPoints
			this._isDown = true;

			const pointerId = $utils.getPointerId(e.originalEvent);
			this._downPoints[pointerId] = {
				x: e.point.x,
				y: e.point.y
			};
		}
	}

	/**
	 * @ignore
	 * @todo should this be user-accessible?
	 */
	public dragMove(e: ISpritePointerEvent) {
		let dragEvent = this._dragEvent;

		if (dragEvent) {

			if (dragEvent.simulated && !e.simulated) {
				return true;
			}

			let angle = 0;

			let parent = this.parent;
			let scale = 1;

			while (parent != null) {
				angle += parent.get("rotation", 0);
				scale *= parent.get("scale", 1);
				parent = parent.parent;
			}

			let x = (e.point.x - dragEvent.point.x) / scale;
			let y = (e.point.y - dragEvent.point.y) / scale;

			const events = this.events;

			if (dragEvent.simulated && !this._isDragging) {
				this._isDragging = true;
				this._dragEvent = e;

				this._dragPoint = {
					x: this.x(),
					y: this.y()
				};

				const type = "dragstart";
				if (events.isEnabled(type)) {
					events.dispatch(type, {
						type: type,
						target: this,
						originalEvent: e.originalEvent,
						point: e.point,
						simulated: e.simulated,
					});
				}
			}

			if (this._isDragging) {
				let dragPoint = this._dragPoint!;

				this.set("x", dragPoint.x + x * $math.cos(angle) + y * $math.sin(angle));
				this.set("y", dragPoint.y + y * $math.cos(angle) - x * $math.sin(angle));

				const type = "dragged";
				if (events.isEnabled(type)) {
					events.dispatch(type, {
						type: type,
						target: this,
						originalEvent: e.originalEvent,
						point: e.point,
						simulated: e.simulated,
					});
				}

			} else {
				if (Math.hypot(x, y) > 5) {
					this._isDragging = true;
					this._dragEvent = e;

					this._dragPoint = {
						x: this.x(),
						y: this.y()
					};

					const type = "dragstart";
					if (events.isEnabled(type)) {
						events.dispatch(type, {
							type: type,
							target: this,
							originalEvent: e.originalEvent,
							point: e.point,
							simulated: e.simulated
						});
					}
				}
			}
		}
	}

	public _updateSize() {

	}

	public _getBounds() {
		this._localBounds = this._display.getLocalBounds();
	}

	/**
	 * Returns how deep the element is in the tree: the number of parents it
	 * has.
	 *
	 * @return Depth
	 */
	public depth(): number {
		let self: Container | undefined = this.parent;
		let depth = 0;

		while (true) {
			if (self) {
				++depth;
				self = self.parent;

			} else {
				return depth;
			}
		}
	}

	/**
	 * @ignore
	 */
	public markDirtySize(): void {
		this._sizeDirty = true;
		this.markDirty();
	}

	/**
	 * @ignore
	 */
	public markDirtyBounds(): void {
		const display = this._display;
		if (this.get("isMeasured")) {
			this._root._addDirtyBounds(this);
			display.isMeasured = true;
			display.invalidateBounds();

			const parent = this.parent;

			if (parent && this.get("position") != "absolute") {
				if (parent.get("width") == null || parent.get("height") == null || parent.get("layout")) {
					parent.markDirtyBounds();
				}
			}

			if (this.get("focusable")) {
				this.markDirtyAccessibility();
			}
		}
	}

	/**
	 * @ignore
	 */
	public markDirtyAccessibility(): void {
		//if (this._root.focused(this)) {
		this._root._invalidateAccessibility(this);
		//}
	}

	/**
	 * @ignore
	 */
	public markDirtyLayer() {
		//this._display.markDirtyLayer(this.isDirty("opacity") || this.isDirty("visible")); https://codepen.io/team/amcharts/pen/gOWZPmP <- problems
		this._display.markDirtyLayer(true);
	}

	/**
	 * @ignore
	 */
	public markDirty() {
		super.markDirty();
		this.markDirtyLayer();
	}

	public _updateBounds() {
		const oldBounds = this._adjustedLocalBounds;

		let newBounds: IBounds;

		// if display.visible == false, it still returns bounds
		if (!this.get("visible") || !this.getPrivate("visible") || this.get("forceHidden")) {
			newBounds = {
				left: 0,
				right: 0,
				top: 0,
				bottom: 0
			};
			this._localBounds = newBounds;
			this._adjustedLocalBounds = newBounds;
		}
		else {
			this._getBounds();
			this._fixMinBounds(this._localBounds);
			this.updatePivotPoint();
			this._adjustedLocalBounds = this._display.getAdjustedBounds(this._localBounds);
			newBounds = this._adjustedLocalBounds!;
		}

		if (!oldBounds || (oldBounds.left !== newBounds.left || oldBounds.top !== newBounds.top || oldBounds.right !== newBounds.right || oldBounds.bottom !== newBounds.bottom)) {
			const eventType = "boundschanged";
			if (this.events.isEnabled(eventType)) {
				this.events.dispatch(eventType, { type: eventType, target: this });
			}
			if (this.parent) {
				this.parent.markDirty();
				this.parent.markDirtyBounds();
			}

			// Update tooltip position together with the Sprite
			if (this.getPrivate("showingTooltip")) {
				this.showTooltip();
			}

			// Accessibility depends on size (zero-sized elements are hidden from
			// screen readers), so re-evaluate it now that bounds are known
			if (this.get("focusable")) {
				this.markDirtyAccessibility();
			}
		}
	}

	public _fixMinBounds(bounds: IBounds) {
		let minWidth = this.get("minWidth", this.getPrivate("minWidth"));
		let minHeight = this.get("minHeight", this.getPrivate("minHeight"));

		if ($type.isNumber(minWidth)) {
			if (bounds.right - bounds.left < minWidth) {
				bounds.right = bounds.left + minWidth;
			}
		}

		if ($type.isNumber(minHeight)) {
			if (bounds.bottom - bounds.top < minHeight) {
				bounds.bottom = bounds.top + minHeight;
			}
		}

		let privateWidth = this.getPrivate("width");
		let privateHeight = this.getPrivate("height");

		if ($type.isNumber(privateWidth)) {
			if (privateWidth > 0) {
				bounds.right = bounds.left + privateWidth;
			}
			else {
				bounds.left = bounds.right + privateWidth;
			}
		}

		if ($type.isNumber(privateHeight)) {
			if (privateHeight > 0) {
				bounds.bottom = bounds.top + privateHeight;
			}
			else {
				bounds.top = bounds.bottom + privateHeight;
			}
		}
	}

	protected _removeParent(parent: Container | undefined) {
		if (parent) {
			parent.children.removeValue(this);
			$array.removeFirst(parent._percentageSizeChildren, this);
			$array.removeFirst(parent._percentagePositionChildren, this);
		}
	}

	// autoAppear: played once already, and played in this frame
	protected _appeared: boolean = false;
	protected _appearApplied: boolean = false;

	/**
	 * Hidden by `appear()` or `autoAppear` until it shows: not hidden on purpose.
	 *
	 * @ignore
	 */
	public _appearPending: boolean = false;

	/**
	 * Whether `autoAppear` can play yet. A series waits for its data.
	 */
	protected _autoAppearReady(): boolean {
		return true;
	}

	/**
	 * Plays `autoAppear` the first time the element is drawn, and again when
	 * the setting is turned off and on. A container does this before it
	 * prepares its children, so that hiding it and its data items is part of
	 * the same frame.
	 */
	protected _applyAutoAppear(): void {
		if (this.isDirty("autoAppear") && !this.get("autoAppear")) {
			this._appeared = false;
		}
		if (this._appearApplied || this._appeared || !this.get("autoAppear") || !this._autoAppearReady()) {
			return;
		}
		this._appearApplied = true;
		this._appeared = true;

		// Hidden on purpose: it shows the usual way when it is shown. Already
		// showing: appear() was called in code
		if (this.get("visible") === false || this.isHidden() || this.isShowing()) {
			return;
		}

		const duration = this.get("appearDuration");
		const delay = this.get("appearDelay", 0);
		this._appearPending = true;
		this.hide(0).then(() => {
			const show = () => {
				this._appearPending = false;
				if (!this.isDisposed()) {
					this.show(duration);
					this._replayDeclaredAnimations();
				}
			};
			if (delay) {
				this.setTimeout(show, delay);
			}
			else {
				show();
			}
		});
	}

	// An `animations` entry on what showing animates (opacity, say) keeps
	// playing, as it does next to appear() called in code
	protected _replayDeclaredAnimations(): void {
		const declared = this.get("animations");
		const hidden = this.states.lookup("hidden");
		if (declared && hidden) {
			const keys = Object.keys(hidden._settings);
			if (declared.some((animation) => animation.target !== "dataItem" && keys.indexOf(animation.key) !== -1)) {
				this._playDeclaredAnimations();
			}
		}
	}

	public _clearDirty() {
		super._clearDirty();
		this._appearApplied = false;
		this._sizeDirty = false;
		//this._statesHandled = false;
	}

	/**
	 * Hovers the element as if the pointer were over it: applies its hover
	 * state and shows its tooltip.
	 */
	public hover() {
		if (!this.isDisposed()) {
			this.showTooltip();
			this._handleOver();
		}
	}

	/**
	 * Ends a hover, as if the pointer left the element: hides its tooltip and
	 * takes it out of its hover state.
	 */
	public unhover(): void {
		if (!this.isDisposed()) {
			this.hideTooltip();
			this._handleOut();
		}
	}

	/**
	 * Shows the element's [[Tooltip]]. Does nothing if the element has no
	 * `tooltipText` or `tooltipHTML`.
	 *
	 * @param   point  Point to point at, relative to the root; used only with `tooltipPosition: "pointer"`
	 * @return         Promise
	 */
	public showTooltip(point?: IPoint): Promise<void> | undefined {
		if (!this.isDisposed()) {
			const tooltip = this.getTooltip();
			const tooltipText = this.get("tooltipText");
			const tooltipHTML = this.get("tooltipHTML");

			if ((tooltipText || tooltipHTML) && tooltip) {
				const tooltipPosition = this.get("tooltipPosition");
				const tooltipTarget = this.getPrivate("tooltipTarget", this);

				// A point-less call on a "pointer"-positioned tooltip (e.g. from the
				// boundschanged/positionchanged handlers keeping it glued to a moving
				// target) must keep it at the last pointer location, not snap it to the
				// element's anchor.
				if (tooltipPosition == "pointer" && !point) {
					point = this.getPrivate("lastTooltipCoords");
				}

				if (tooltipPosition == "fixed" || !point) {
					this._display._setMatrix();
					point = this.toGlobal(tooltipTarget._getTooltipPoint());
				}

				if (tooltipPosition == "pointer") {
					const lastTooltipCoords = this.getPrivate("lastTooltipCoords");
					if (lastTooltipCoords && lastTooltipCoords.x == point.x && lastTooltipCoords.y == point.y) {
						return;
					}
					else {
						this.setPrivate("lastTooltipCoords", point);
					}
				}

				tooltip.set("pointTo", point);
				tooltip.set("tooltipTarget", tooltipTarget);

				if (!tooltip.get("x")) {
					tooltip.set("x", point.x);
				}
				if (!tooltip.get("y")) {
					tooltip.set("y", point.y);
				}

				if (tooltipText) {
					tooltip.label.set("text", tooltipText);
				}
				if (tooltipHTML) {
					tooltip.label.set("html", tooltipHTML);
				}
				const dataItem = this.dataItem;
				if (dataItem) {
					tooltip.label._setDataItem(dataItem);
				}

				if (this.get("showTooltipOn") == "always" && (point.x < 0 || point.x > this._root.width() || point.y < 0 || point.y > this._root.height())) {
					this.hideTooltip();
					return;
				}

				tooltip.label.text.markDirtyText();
				const promise = tooltip.show();
				this.setPrivateRaw("showingTooltip", true);
				return promise;
			}
		}
	}

	/**
	 * Hides the element's [[Tooltip]].
	 *
	 * @return  Promise
	 */
	public hideTooltip(): Promise<void> | undefined {
		const tooltip = this.getTooltip();
		if (tooltip) {
			this.removePrivate("lastTooltipCoords");
			if (tooltip.get("tooltipTarget") == this.getPrivate("tooltipTarget", this) || this.get("tooltip") == tooltip) {
				let timeout = tooltip.get("keepTargetHover") && tooltip.get("stateAnimationDuration", 0) == 0 ? 400 : undefined;
				const promise = tooltip.hide(timeout);
				this.setPrivateRaw("showingTooltip", false);
				return promise;
			}
		}
	}

	public _getTooltipPoint(): IPoint {
		const bounds = this._localBounds!;

		if (bounds) {
			let x = 0;
			let y = 0;

			if (!this.get("isMeasured")) {
				x = $utils.relativeToValue(this.get("tooltipX", 0), this.width());
				y = $utils.relativeToValue(this.get("tooltipY", 0), this.height());
			}
			else {
				x = bounds.left + $utils.relativeToValue(this.get("tooltipX", 0), bounds.right - bounds.left);
				y = bounds.top + $utils.relativeToValue(this.get("tooltipY", 0), bounds.bottom - bounds.top);
			}

			return { x, y };
		}
		return { x: 0, y: 0 };
	}

	/**
	 * Returns the element's [[Tooltip]]: its own `tooltip`, or else the nearest
	 * parent's.
	 *
	 * @return Tooltip
	 */
	public getTooltip(): Tooltip | undefined {
		let tooltip = this.get("tooltip");
		if (!tooltip) {
			let parent = this.parent;
			if (parent) {
				return parent.getTooltip();
			}
		}
		else {
			return tooltip;
		}
	}

	public _updatePosition() {

		const parent = this.parent;

		let dx = this.get("dx", 0);
		let dy = this.get("dy", 0);

		let x = this.get("x");
		let _x = this.getPrivate("x");

		let xx = 0;
		let yy = 0;

		const position = this.get("position");

		if (x instanceof Percent) {
			if (parent) {
				x = parent.innerWidth() * x.value + parent.get("paddingLeft", 0);
			}
			else {
				x = 0;
			}
		}
		if ($type.isNumber(x)) {
			xx = x + dx;
		}
		else {
			if (_x != null) {
				xx = _x;
			}
			else if (parent) {
				if (position == "relative") {
					xx = parent.get("paddingLeft", 0) + dx;
				}
			}
		}


		let y = this.get("y");
		let _y = this.getPrivate("y");

		if (y instanceof Percent) {
			if (parent) {
				y = parent.innerHeight() * y.value + parent.get("paddingTop", 0);
			}
			else {
				y = 0;
			}
		}
		if ($type.isNumber(y)) {
			yy = y + dy;
		}
		else {
			if (_y != null) {
				yy = _y;
			}
			else if (parent) {
				if (position == "relative") {
					yy = parent.get("paddingTop", 0) + dy;
				}
			}
		}

		const display = this._display;

		if (display.x != xx || display.y != yy) {
			display.invalidateBounds();
			display.x = xx;
			display.y = yy;

			const eventType = "positionchanged";
			if (this.events.isEnabled(eventType)) {
				this.events.dispatch(eventType, { type: eventType, target: this });
			}
		}

		// Update tooltip position together with the Sprite
		if (this.getPrivate("showingTooltip")) {
			this.showTooltip();
		}
	}

	/**
	 * Returns the element's X position in pixels, relative to its parent,
	 * without `dx`.
	 *
	 * @return X (px)
	 */
	public x(): number {
		let x = this.get("x");
		let _x = this.getPrivate("x");

		const parent = this.parent;
		if (parent) {
			if (x instanceof Percent) {
				return $utils.relativeToValue(x, parent.innerWidth()) + parent.get("paddingLeft", 0);
			}
			else {
				if (!$type.isNumber(x)) {
					if (_x != null) {
						return _x;
					}
					else {
						return parent.get("paddingLeft", this._display.x)
					}
				}
				else {
					return x;
				}
			}
		}

		return this._display.x;
	}

	/**
	 * Returns the element's Y position in pixels, relative to its parent,
	 * without `dy`.
	 *
	 * @return Y (px)
	 */
	public y(): number {

		let _y = this.getPrivate("y");

		if (_y != null) {
			return _y;
		}

		let y = this.get("y");
		const parent = this.parent;

		if (parent) {
			if (y instanceof Percent) {
				return $utils.relativeToValue(y, parent.innerHeight()) + parent.get("paddingTop", 0);
			}
			else {
				if (!$type.isNumber(y)) {
					if (_y != null) {
						return _y;
					}
					else {
						return parent.get("paddingTop", this._display.y)
					}
				}
				else {
					return y;
				}
			}
		}

		return this._display.y;
	}

	protected _dispose() {
		super._dispose();
		this._display.dispose();
		this._removeTemplateField();
		this._removeParent(this.parent);
		this._root._removeFocusElement(this);

		const tooltip = this.get("tooltip");
		if (tooltip) {
			tooltip.dispose();
		}

		this.markDirty();
	}

	/**
	 * @ignore
	 */
	public adjustedLocalBounds(): IBounds {
		this._fixMinBounds(this._adjustedLocalBounds);
		return this._adjustedLocalBounds;
	}

	/**
	 * Returns local coordinates of the element's bounds.
	 *
	 * @ignore
	 * @return Local bounds
	 */
	public localBounds(): IBounds {
		return this._localBounds;
	}

	/**
	 * Returns the element's bounds in its parent's coordinates.
	 *
	 * @ignore
	 * @return Bounds
	 */
	public bounds(): IBounds {
		const bounds = this._adjustedLocalBounds;
		const x = this.x();
		const y = this.y();
		return { left: bounds.left + x, right: bounds.right + x, top: bounds.top + y, bottom: bounds.bottom + y };
	}

	/**
	 * Returns global coordinates of the element's bounds.
	 *
	 * @ignore
	 * @return Global bounds
	 */
	public globalBounds(): IBounds {
		return this._toGlobalBounds(this.localBounds());
	}

	/**
	 * Returns global bounds of the element's shape, for its focus element.
	 *
	 * Same as `globalBounds()`, except that an element that is not measured
	 * (a pie slice, a map polygon) is measured here, so that it can be focused.
	 *
	 * @ignore
	 * @return Global bounds
	 */
	public _focusBounds(): IBounds {
		if (this.get("isMeasured")) {
			return this.globalBounds();
		}
		return this._toGlobalBounds(this._display.getContentBounds());
	}

	protected _toGlobalBounds(bounds: IBounds): IBounds {
		const p0 = this.toGlobal({ x: bounds.left, y: bounds.top });
		const p1 = this.toGlobal({ x: bounds.right, y: bounds.top });
		const p2 = this.toGlobal({ x: bounds.right, y: bounds.bottom });
		const p3 = this.toGlobal({ x: bounds.left, y: bounds.bottom });

		return {
			left: Math.min(p0.x, p1.x, p2.x, p3.x),
			top: Math.min(p0.y, p1.y, p2.y, p3.y),
			right: Math.max(p0.x, p1.x, p2.x, p3.x),
			bottom: Math.max(p0.y, p1.y, p2.y, p3.y)
		}
	}

	protected _onShow(_duration?: number) {

	}

	protected _onHide(_duration?: number) {

	}

	/**
	 * Plays the reveal animation: hides the element at once, then shows it,
	 * whether it was hidden or not.
	 *
	 * @param   duration  Duration of the animation in milliseconds
	 * @param   delay     Milliseconds to wait before showing the element
	 * @return            Promise
	 */
	public async appear(duration?: number, delay?: number): Promise<void> {
		// Hidden only until it shows: not hidden on purpose, for a saved config
		this._appearPending = true;
		await this.hide(0);
		if (delay) {
			return new Promise<void>((success, _error) => {
				this.setTimeout(() => {
					this._appearPending = false;
					success(this.show(duration));
				}, delay);
			});

		}
		else {
			this._appearPending = false;
			return this.show(duration);
		}
	}

	/**
	 * Shows the element and returns a `Promise` that resolves when its
	 * showing animations finish.
	 *
	 * ```TypeScript
	 * series.show().then(function(ev) {
	 *   console.log("Series is now fully visible");
	 * })
	 * ```
	 * ```JavaScript
	 * series.show().then(function(ev) {
	 *   console.log("Series is now fully visible");
	 * })
	 * ```
	 *
	 * @param   duration  Animation duration in milliseconds
	 * @return            Promise
	 */
	public async show(duration?: number): Promise<void> {
		if (!this._isShowing) {
			this._isHidden = false;
			this._isShowing = true;
			this._isHiding = false;

			if (this.states.lookup("default")!.get("visible")) {
				this._setC("visible", true);
			}
			this._onShow(duration);

			const animations = this.states.applyAnimate("default", duration);
			await waitForAnimations(animations);

			this._isShowing = false;
		}
	}

	/**
	 * Hides the element and returns a `Promise` that resolves when its hiding
	 * animations finish.
	 *
	 * ```TypeScript
	 * series.hide().then(function(ev) {
	 *   console.log("Series finished hiding");
	 * })
	 * ```
	 * ```JavaScript
	 * series.hide().then(function(ev) {
	 *   console.log("Series finished hiding");
	 * })
	 * ```
	 *
	 * @param   duration  Animation duration in milliseconds
	 * @return            Promise
	 */
	public async hide(duration?: number): Promise<void> {
		if (!this._isHiding && !this._isHidden) {
			this._isHiding = true;
			this._isShowing = false;
			let state = this.states.lookup("hidden");
			if (!state) {
				state = this.states._createC("hidden", {
					"opacity": 0,
					"visible": false
				});
			}
			this._isHidden = true;
			this._onHide(duration);

			const animations = this.states.applyAnimate("hidden", duration);

			await waitForAnimations(animations);

			this._isHiding = false;
		}
	}

	/**
	 * Returns `true` if the element was hidden with `hide()`, even while its
	 * hiding animation still plays. For the `visible` setting, use
	 * `isVisible()`.
	 *
	 * @return Is hidden?
	 */
	public isHidden(): boolean {
		return this._isHidden;
	}

	/**
	 * Returns `true` while the element's showing animation plays.
	 *
	 * @return Is showing?
	 */
	public isShowing(): boolean {
		return this._isShowing;
	}

	/**
	 * Returns `true` while the element's hiding animation plays.
	 *
	 * @return Is hiding?
	 */
	public isHiding(): boolean {
		return this._isHiding;
	}

	/**
	 * Returns `true` if the pointer is over the element.
	 *
	 * @return Is hovered?
	 */
	public isHover(): boolean {
		return this._display.hovering();
	}

	/**
	 * Returns `true` if this element does currently have focus.
	 *
	 * @return Is focused?
	 */
	public isFocus(): boolean {
		return this._root.focused(this);
	}

	/**
	 * Returns `true` while the element is being dragged.
	 *
	 * @return Is dragged?
	 */
	public isDragging(): boolean {
		return this._isDragging;
	}

	/**
	 * Returns `false` if either the public or the private setting `visible` is
	 * `false`, or `forceHidden` is `true`.
	 *
	 * @return Visible?
	 */
	public isVisible(): boolean {
		if (this.get("visible") && this.getPrivate("visible") && !this.get("forceHidden")) {
			return true;
		}
		return false;
	}

	/**
	 * Same as `isVisible()`, except it checks all ascendants, too.
	 *
	 * @since 5.2.7
	 * @return Visible?
	 */
	public isVisibleDeep(): boolean {
		return this._parent ? (this._parent.isVisibleDeep() && this.isVisible()) : this.isVisible();
	}

	/**
	 * Returns the element's opacity multiplied by those of all its parents.
	 *
	 * @return Opacity
	 * @since 5.2.11
	 */
	public compositeOpacity(): number {
		const opacity = this.get("opacity", 1);
		return this._parent ? (this._parent.compositeOpacity() * opacity) : opacity;
	}

	/**
	 * Returns the element's scale multiplied by those of all its parents.
	 *
	 * @return Scale
	 * @since 5.9.2
	 */
	public compositeScale(): number {
		const scale = this.get("scale", 1);
		return this._parent ? (this._parent.compositeScale() * scale) : scale;
	}

	/**
	 * Returns the element's rotation plus those of all its parents, in
	 * degrees.
	 *
	 * @return Rotation
	 * @since 5.9.2
	 */
	public compositeRotation(): number {
		const rotation = this.get("rotation", 0);
		return this._parent ? (this._parent.compositeRotation() + rotation) : rotation;
	}

	/**
	 * Returns the element's width in pixels.
	 *
	 * @return Width (px)
	 */
	public width(): number {
		let width = this.get("width");
		let maxWidth = this.get("maxWidth", this.getPrivate("maxWidth"));
		let minWidth = this.get("minWidth", this.getPrivate("minWidth"));
		let privateWidth = this.getPrivate("width");
		let w = 0;

		if ($type.isNumber(privateWidth)) {
			w = privateWidth;
		}
		else {
			if (width == null) {
				if (this._adjustedLocalBounds) {
					w = this._adjustedLocalBounds.right - this._adjustedLocalBounds.left;
				}
			}
			else {
				if (width instanceof Percent) {
					const parent = this.parent;
					if (parent) {
						w = parent.innerWidth() * width.value;
					}
					else {
						w = this._root.width() * width.value;
					}
				}
				else if ($type.isNumber(width)) {
					w = width;
				}
			}
		}

		if ($type.isNumber(minWidth)) {
			w = Math.max(minWidth, w);
		}
		if ($type.isNumber(maxWidth)) {
			w = Math.min(maxWidth, w);
		}

		return w;
	}

	/**
	 * Returns the most width the element may take, in pixels: its `maxWidth`,
	 * a fixed `width`, or else its parent's inner width.
	 *
	 * @return Maximum width (px)
	 */
	public maxWidth(): number {
		let maxWidth = this.get("maxWidth", this.getPrivate("maxWidth"));
		if ($type.isNumber(maxWidth)) {
			return maxWidth;
		}
		else {
			let width = this.get("width")
			if ($type.isNumber(width)) {
				return width;
			}
		}
		const parent = this.parent;
		if (parent) {
			return parent.innerWidth();
		}
		return this._root.width();
	}

	/**
	 * Returns the most height the element may take, in pixels: its
	 * `maxHeight`, a fixed `height`, or else its parent's inner height.
	 *
	 * @return Maximum height (px)
	 */
	public maxHeight(): number {
		let maxHeight = this.get("maxHeight", this.getPrivate("maxHeight"));
		if ($type.isNumber(maxHeight)) {
			return maxHeight;
		}
		else {
			let height = this.get("height")
			if ($type.isNumber(height)) {
				return height;
			}
		}
		const parent = this.parent;
		if (parent) {
			return parent.innerHeight();
		}
		return this._root.height();
	}

	/**
	 * Returns the element's height in pixels.
	 *
	 * @return Height (px)
	 */
	public height(): number {
		let height = this.get("height");
		let maxHeight = this.get("maxHeight", this.getPrivate("maxHeight"));
		let minHeight = this.get("minHeight", this.getPrivate("minHeight"));
		let privateHeight = this.getPrivate("height");
		let h = 0;

		if ($type.isNumber(privateHeight)) {
			h = privateHeight;
		}
		else {
			if (height == null) {
				if (this._adjustedLocalBounds) {
					h = this._adjustedLocalBounds.bottom - this._adjustedLocalBounds.top;
				}
			}
			else {
				if (height instanceof Percent) {
					const parent = this.parent;
					if (parent) {
						h = parent.innerHeight() * height.value;
					}
					else {
						h = this._root.height() * height.value;
					}
				}
				else if ($type.isNumber(height)) {
					h = height;
				}
			}
		}

		if ($type.isNumber(minHeight)) {
			h = Math.max(minHeight, h);
		}
		if ($type.isNumber(maxHeight)) {
			h = Math.min(maxHeight, h);
		}

		return h;
	}

	protected _findStaticTemplate(f: (template: Template<this>) => boolean): Template<this> | undefined {
		// templateField overrides template
		if (this._templateField && f(this._templateField)) {
			return this._templateField;
		}

		return super._findStaticTemplate(f);
	}

	public _walkParents(f: (parent: Sprite) => void): void {
		if (this._parent || this._virtualParent) {
			this._walkParent(f);
		}
	}

	protected _walkParent(f: (parent: Sprite) => void): void {
		if (this._parent) {
			this._parent._walkParent(f);
		}
		else {
			if (this._virtualParent) {
				this._virtualParent._walkParent(f);
			}
		}

		f(this);
	}

	public set virtualParent(parent: Container | undefined) {
		if(this._virtualParent !== parent){
			this._virtualParent = parent;
			this._applyThemes();
		}		
	}

	/**
	 * Parent [[Container]] of this element.
	 *
	 * @return Parent container
	 */
	public get parent(): Container | undefined {
		return this._parent;
	}

	public _setParent(parent: Container, updateChildren: boolean = false) {
		const prevParent = this._parent;
		if (parent !== prevParent) {
			this.markDirtyBounds();

			parent.markDirty();

			this._parent = parent;

			if (updateChildren) {
				this._removeParent(prevParent);

				if (parent) {
					this._addPercentageSizeChildren();
					this._addPercentagePositionChildren();
				}
			}

			this.markDirtyPosition();
			this._applyThemes();
		}
	}

	/**
	 * Returns the [[NumberFormatter]] of the element: its own
	 * `numberFormatter`, or else the one of the [[Root]].
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/using-formatters/} for more info
	 * @return NumberFormatter instance
	 */
	public getNumberFormatter(): NumberFormatter {
		return this.get("numberFormatter", this._root.numberFormatter);
	}

	/**
	 * Returns the [[DateFormatter]] of the element: its own `dateFormatter`,
	 * or else the one of the [[Root]].
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/using-formatters/} for more info
	 * @return DateFormatter instance
	 */
	public getDateFormatter(): DateFormatter {
		return this.get("dateFormatter", this._root.dateFormatter);
	}

	/**
	 * Returns the [[DurationFormatter]] of the element: its own
	 * `durationFormatter`, or else the one of the [[Root]].
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/using-formatters/} for more info
	 * @return DurationFormatter instance
	 */
	public getDurationFormatter(): DurationFormatter {
		return this.get("durationFormatter", this._root.durationFormatter);
	}

	/**
	 * Converts a point within the element to a point relative to the root.
	 *
	 * @param  point  Point within the element
	 * @return        Point relative to the root
	 */
	public toGlobal(point: IPoint): IPoint {
		return this._display.toGlobal(point);
	}

	/**
	 * Converts a point relative to the root to a point within the element.
	 *
	 * @param  point  Point relative to the root
	 * @return        Point within the element
	 */
	public toLocal(point: IPoint): IPoint {
		return this._display.toLocal(point);
	}

	public _getDownPoint(): IPoint | undefined {
		const id = this._getDownPointId();
		if (id) {
			return this._downPoints[id];
		}

	}

	public _getDownPointId(): number | undefined {
		if (this._downPoints) {
			return $object.keysOrdered(this._downPoints, (a, b) => {
				if (a > b) {
					return 1;
				}
				if (a < b) {
					return -1;
				}
				return 0;
			})[0];
		}
	}

	/**
	 * Moves the element to the end of its parent's children, so it is drawn
	 * over its siblings, or, in a layout, placed last.
	 */
	public toFront() {
		const parent = this.parent;
		if (parent) {
			parent.children.moveValue(this, parent.children.length - 1);
		}
	}

	/**
	 * Moves the element to the start of its parent's children, so it is drawn
	 * under its siblings, or, in a layout, placed first.
	 */
	public toBack() {
		const parent = this.parent;
		if (parent) {
			parent.children.moveValue(this, 0);
		}
	}

}

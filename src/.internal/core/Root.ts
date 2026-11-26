import type { IAnimation } from "./util/Animation";
import type { Entity } from "./util/Entity";
import type { Sprite } from "./render/Sprite";
import type { Theme } from "./Theme";
import type { IPoint } from "./util/IPoint";
import type { IRenderer, IRendererClass, IPointerEvent, TouchGestures } from "./render/backend/Renderer";
import type { Timezone } from "./util/Timezone";

import { AnimationState } from "./util/Animation";
import { Container } from "./render/Container";
import { Text } from "./render/Text";
import { HorizontalLayout } from "./render/HorizontalLayout";
import { VerticalLayout } from "./render/VerticalLayout";
import { GridLayout } from "./render/GridLayout";
import { IDisposer, Disposer } from "./util/Disposer";
import { ResizeSensor } from "./util/ResizeSensor";
import { InterfaceColors, IInterfaceColorsSettings } from "./util/InterfaceColors";
import { Graphics } from "./render/Graphics";
import { Rectangle } from "./render/Rectangle";
import { Tooltip } from "./render/Tooltip";
import { NumberFormatter } from "./util/NumberFormatter";
import { DateFormatter } from "./util/DateFormatter";
import { DurationFormatter } from "./util/DurationFormatter";
import { ILocale, Language } from "./util/Language";
import { Events, EventDispatcher } from "./util/EventDispatcher";
import { DefaultTheme } from "../themes/DefaultTheme";
import { CanvasRenderer } from "./render/backend/CanvasRenderer";
import { p100, isPercent, Percent } from "./util/Percent";
import { Color, color } from "./util/Color";
import { populateString } from "./util/PopulateString";
import { registry } from "./Registry";

import * as $order from "./util/Order";
import * as $array from "./util/Array";
import * as $object from "./util/Object";
import * as $utils from "./util/Utils";
import * as $type from "./util/Type";
import * as $ease from "./util/Ease";


import en from "../../locales/en";


// Sets an attribute, or removes it for `null`, only if that changes it: a
// write that changes nothing still costs the browser work
function setAttr(element: Element, name: string, value: string | null): void {
	if (element.getAttribute(name) !== value) {
		if (value === null) {
			element.removeAttribute(name);
		}
		else {
			element.setAttribute(name, value);
		}
	}
}

function rAF(fps: number | undefined, callback: (currentTime: number) => void): void {
	if (fps == null) {
		requestAnimationFrame(callback);

	} else {
		setTimeout(() => {
			requestAnimationFrame(callback);
		}, 1000 / fps);
	}
}


/**
 * @ignore
 */
interface IParent extends Entity {
	_prepareChildren(): void;
	_updateChildren(): void;
	_childrenUpdt: boolean;
	_childrenPrep: boolean;
}

interface IBounds extends Entity {
	depth(): number;
	_updateBounds(): void;
}


export interface ISize {
	width: number,
	height: number,
}


export interface IRootEvents {
	/**
	 * A frame started rendering. `timestamp` is the frame's time in milliseconds.
	 */
	framestarted: {
		timestamp: number;
	};
	/**
	 * A frame finished rendering. `timestamp` is the frame's time in milliseconds.
	 */
	frameended: {
		timestamp: number;
	};
}


export interface IRootSettings {

	/**
	 * Draws the chart at a resolution of `1` on iOS and iPadOS devices instead
	 * of the screen's pixel ratio, to stay within their memory limits. Set to
	 * `false` for sharper charts there.
	 *
	 * @default true
	 */
	useSafeResolution?: boolean;

	/**
	 * Extra space in pixels on each side of the chart where tooltips can still
	 * be drawn, letting them go outside the chart's container.
	 *
	 * @since 5.2.24
	 */
	tooltipContainerBounds?: { top: number, left: number, right: number, bottom: number };

	/**
	 * Set to `false` to disable all accessibility features.
	 *
	 * NOTE: once disabled, accessibility cannot be re-enabled on a live `Root` object.
	 *
	 * @default true
	 * @since 5.3.0
	 */
	accessible?: boolean;

	/**
	 * If set to `true`, the parent inner `<div>` element will become a focusable
	 * element.
	 *
	 * @since 5.3.17
	 * @default false
	 * @see {@link https://docs.amcharts.com/v5/concepts/accessibility/#accessibility-of-root-element} for more info
	 */
	focusable?: boolean;

	/**
	 * Distance between focused element and its highlight square in pixels.
	 *
	 * @since 5.6.0
	 * @default 2
	 */
	focusPadding?: number;

	/**
	 * If set to some string, it will be used as inner `<div>` ARIA-LABEL.
	 *
	 * Should be used in conjunction with `focusable`.
	 *
	 * @since 5.3.17
	 * @see {@link https://docs.amcharts.com/v5/concepts/accessibility/#accessibility-of-root-element} for more info
	 */
	ariaLabel?: string;

	/**
	 * Allows setting a "role" for the inner `<div>`.
	 *
	 * @since 5.3.17
	 * @see {@link https://docs.amcharts.com/v5/concepts/accessibility/#accessibility-of-root-element} for more info
	 */
	role?: string;

	/**
	 * A function that returns the width and height in pixels to draw the chart
	 * at, given the container's measured box. It runs when the chart is created
	 * and on every resize.
	 */
	calculateSize?: (dimensions: DOMRect) => ISize;

	/**
	 * Cleans potentially malicious code out of HTML content (`html` and
	 * `labelHTML` settings, HTML tooltips, modals, export menu labels, stock
	 * toolbar labels) before it goes on the page.
	 *
	 * Turn it off only if you trust all HTML content: unsanitized HTML from
	 * untrusted data can lead to XSS attacks.
	 *
	 * @default true
	 * @since 5.19.0
	 */
	sanitizeHTML?: boolean;

	/**
	 * The corner of the chart that shows the amCharts logo, when there is no
	 * licence: `"bl"` (bottom left), `"br"` (bottom right), `"tl"` (top left)
	 * or `"tr"` (top right).
	 *
	 * @default "bl"
	 * @since 5.24.0
	 */
	logoPosition?: "bl" | "br" | "tl" | "tr";

	/**
	 * Font family for all labels. It overrides the theme's, but not a
	 * `fontFamily` set on a label itself.
	 *
	 * @since 5.20.2
	 */
	fontFamily?: string;

	/**
	 * Font size for all labels: a number in pixels, or a CSS size such as
	 * `"1.2em"`. It overrides the theme's, but not a `fontSize` set on a label
	 * itself.
	 *
	 * @since 5.20.2
	 */
	fontSize?: number | string;

	/**
	 * Font weight for all labels. It overrides the theme's, but not a
	 * `fontWeight` set on a label itself.
	 *
	 * @since 5.20.2
	 */
	fontWeight?: "normal" | "bold" | "bolder" | "lighter" | "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900";

	/**
	 * The renderer that draws the chart. Defaults to `Root.defaultRenderer`,
	 * which is `CanvasRenderer` unless changed.
	 *
	 * To draw with SVG, use `am5.SVGRenderer`:
	 *
	 * ```TypeScript
	 * const root = am5.Root.new("chartdiv", {
	 *   renderer: am5.SVGRenderer
	 * });
	 * ```
	 * ```JavaScript
	 * var root = am5.Root.new("chartdiv", {
	 *   renderer: am5.SVGRenderer
	 * });
	 * ```
	 *
	 * Can only be set when the Root is created.
	 *
	 * @since 5.21.0
	 */
	renderer?: IRendererClass;

	/**
	 * Makes the chart's interface colors (labels, grid, axes, buttons) follow
	 * the system colors when the page is in a forced colors mode, such as
	 * Windows High Contrast, so they stay visible. Series colors are kept.
	 *
	 * @default true
	 * @since 5.21.0
	 */
	forcedColors?: boolean;

	/**
	 * The chart's text and legend direction. Set to `"rtl"` for a
	 * right-to-left language: text with no `direction` of its own is drawn
	 * right to left, and legends lay out from the right, each marker on the
	 * right of its name. `"ltr"` keeps everything left to right, e.g. an
	 * English chart on a `dir="rtl"` page.
	 *
	 * Not set, text follows the CSS direction of the chart's element and
	 * legends stay left to right.
	 *
	 * Unlike a container's `direction`, which lays out its children only, this
	 * applies to text and legends across the chart.
	 *
	 * ```TypeScript
	 * const root = am5.Root.new("chartdiv", {
	 *   direction: "rtl"
	 * });
	 * ```
	 * ```JavaScript
	 * var root = am5.Root.new("chartdiv", {
	 *   direction: "rtl"
	 * });
	 * ```
	 *
	 * Set it when the Root is created (or in a JSON config's `root` section);
	 * it has no setter of its own.
	 *
	 * @see {@link https://docs.amcharts.com/v5/concepts/locales/right-to-left-support/} for more info
	 * @since 5.22.0
	 */
	direction?: "ltr" | "rtl";
}

// Interface colors that follow the system colors in a forced colors mode
const FORCED_COLORS: { [K in keyof IInterfaceColorsSettings]?: string } = {
	text: "CanvasText",
	grid: "CanvasText",
	alternativeBackground: "CanvasText",
	stroke: "CanvasText",
	background: "Canvas",
	alternativeText: "Canvas",
	fill: "Canvas",
	// Hover and active stay ButtonFace: ButtonText on Highlight can be unreadable
	primaryButton: "ButtonFace",
	primaryButtonHover: "ButtonFace",
	primaryButtonDown: "ButtonFace",
	primaryButtonActive: "ButtonFace",
	primaryButtonDisabled: "ButtonFace",
	secondaryButton: "ButtonFace",
	secondaryButtonHover: "ButtonFace",
	secondaryButtonDown: "ButtonFace",
	secondaryButtonActive: "ButtonFace",
	primaryButtonText: "ButtonText",
	primaryButtonStroke: "ButtonText",
	secondaryButtonText: "ButtonText",
	secondaryButtonStroke: "ButtonText",
	primaryButtonTextDisabled: "GrayText",
	disabled: "GrayText"
};

// One media query and one color lookup for all charts on the page
let forcedColorsQuery: MediaQueryList | null | undefined;
let systemColors: { [name: string]: Color } | undefined;

function getForcedColorsQuery(): MediaQueryList | null {
	if (forcedColorsQuery === undefined) {
		forcedColorsQuery = window.matchMedia ? window.matchMedia("(forced-colors: active)") : null;
	}
	return forcedColorsQuery;
}

// Resolves system color keywords (CanvasText, ...) to colors
function getSystemColors(): { [name: string]: Color } {
	if (!systemColors) {
		const colors: { [name: string]: Color } = {};
		const probe = document.createElement("div");
		// Not forced itself, so it reports the system color asked for
		probe.style.cssText = "position:absolute;width:0;height:0;overflow:hidden;forced-color-adjust:none";
		document.body.appendChild(probe);
		$array.each(["Canvas", "CanvasText", "ButtonFace", "ButtonText", "GrayText"], (name) => {
			probe.style.color = name;
			colors[name] = Color.fromCSS(getComputedStyle(probe).color);
		});
		document.body.removeChild(probe);
		systemColors = colors;
	}
	return systemColors;
}


// TODO implement Disposer
/**
 * The amCharts logo of a chart without a licence, kept here and not on the root.
 */
interface IBranding {
	// amCharts keys known when it was first shown
	keys: number;
	started: boolean;
	licensed: boolean;
	small: boolean;
	// corner it is in: "bl", "br", "tl" or "tr"
	corner: string;
	mark?: Container;
	checks: Array<(introOver: boolean) => boolean>;
	introEnd: number;
	timer?: number;
	listener?: IDisposer;
}

const brandings: WeakMap<Root, IBranding> = new WeakMap();

function brandingOf(root: Root): IBranding {
	let state = brandings.get(root);
	if (!state) {
		state = { keys: 0, started: false, licensed: false, small: false, corner: "bl", checks: [], introEnd: 0 };
		brandings.set(root, state);
	}
	return state;
}

// amCharts licence keys added so far
function brandingKeys(): number {
	let count = 0;
	$array.each(registry.licenses, (key) => {
		if (/^AM5[A-Z].{5,}/i.test(String(key))) {
			count++;
		}
	});
	return count;
}

// taken out of `parent`, hidden or faded
function brandingPartOff(sprite: Sprite, parent?: Container): boolean {
	return sprite.isDisposed() || (parent !== undefined && parent.children.indexOf(sprite) == -1) || !!sprite.get("forceHidden") || sprite.get("visible") === false || sprite.isHidden() || sprite.get("opacity", 1) < 1 || sprite.get("scale", 1) !== 1 || sprite.get("dy", 0) !== 0;
}

// the corner the root's `logoPosition` asks for
function brandingCorner(root: Root): string {
	const corner = (root as any)._settings.logoPosition;
	return corner == "br" || corner == "tl" || corner == "tr" ? corner : "bl";
}

function brandingRight(state: IBranding): boolean {
	return state.corner.charAt(1) == "r";
}

function brandingTop(state: IBranding): boolean {
	return state.corner.charAt(0) == "t";
}

// puts it in its corner
function placeBranding(mark: Container, state: IBranding): void {
	const right = brandingRight(state);
	const top = brandingTop(state);
	mark.setAll({
		x: right ? p100 : 0,
		centerX: right ? p100 : 0,
		y: top ? 0 : p100,
		centerY: top ? 0 : p100,
		tooltipX: right ? 0 : p100,
		tooltipY: top ? p100 : 10
	});
}

// at 0 (or not set), or at the far end (100%)
function brandingAt(value: any, end: boolean): boolean {
	return end ? (value instanceof Percent && value.value == 1) : (value == null || value === 0);
}

// `again`: shown again after it was taken away, at once without the intro
function buildBranding(root: Root, state: IBranding, again?: boolean): void {
	const mark = root.tooltipContainer.children.push(Container.new(root, {
		interactive: true,
		interactiveChildren: false,
		position: "absolute",
		tooltipText: "Created using amCharts 5",
		cursorOverStyle: "pointer",
		setStateOnChildren: true,
		paddingTop: 9,
		paddingRight: 9,
		paddingBottom: 9,
		paddingLeft: 9,
		scale: .6,
		background: Rectangle.new(root, {
			fill: color(0x474758),
			fillOpacity: 0,
			tooltipY: 5
		})
	}));

	mark.states.create("hover", {});

	const m = mark.children.push(Graphics.new(root, {
		stroke: color(0xcccccc),
		strokeWidth: 3,
		svgPath: "M5 25 L13 25h13.6c3.4 0 6 0 10.3-4.3s5.2-12 8.6-12c3.4 0 4.3 8.6 7.7 8.6M83.4 25H79.8c-3.4 0-6 0-10.3-4.3s-5.2-12-8.6-12-4.3 8.6-7.7 8.6",
		dx: again ? 0 : -50,
		strokeOpacity: again ? 1 : 0
	}));

	m.states._createC("hover", { stroke: color(0x3CABFF) });

	const a = mark.children.push(Graphics.new(root, {
		stroke: color(0x888888),
		strokeWidth: 3,
		svgPath: "M83.4 25h-31C37 25 39.5 4.4 28.4 4.4S18.9 24.2 4.3 25H0",
		dx: again ? 0 : 50,
		strokeOpacity: again ? 1 : 0
	}));

	a.states.create("hover", { stroke: color(0x474758) });

	if (again) {
		state.introEnd = 0;
	}
	else {
		const easing = $ease.out($ease.cubic);
		const duration = 1500;

		mark.setTimeout(() => {
			$array.each([a, m], (part) => {
				part.animate({ key: "strokeOpacity", to: 1, duration: duration, easing: easing });
				part.animate({ key: "dx", to: 0, duration: duration, easing: easing });
			});
		}, 3000);

		// the lines fade and slide in from 3 s for 1.5 s
		state.introEnd = Date.now() + 5000;
	}

	const parts = [m, a].map((part) => ({ part, path: part.get("svgPath")! }));
	// its lines: taken out, hidden or changed; faded or moved only once their intro is over
	state.checks = [(introOver: boolean) => {
		return parts.some(({ part, path }) => {
			return brandingPartOff(part, mark) || part.get("strokeWidth", 0) < 3 || part.get("svgPath") !== path ||
				(introOver && (part.get("strokeOpacity", 0) < 1 || part.get("dx", 0) !== 0));
		});
	}];

	state.corner = brandingCorner(root);
	placeBranding(mark, state);

	mark.set("tooltip", root.systemTooltip);
	// tagged so the website's analytics can count logo clicks
	mark.events.on("click", () => {
		window.open("https://www.amcharts.com/?utm_source=amcharts-chart&utm_medium=referral&utm_campaign=chart-logo&utm_content=logo", "_blank", "noopener");
	});

	state.mark = mark;
	brandingSize(root);
}

// gone, hidden, moved or changed
function brandingOff(root: Root, state: IBranding): boolean {
	const mark = state.mark;
	if (!mark || mark.isDisposed() || root.tooltipContainer.children.indexOf(mark) == -1) {
		return true;
	}
	const right = brandingRight(state);
	const top = brandingTop(state);
	if (mark.get("forceHidden") || mark.get("scale", 1) !== .6 || mark.get("dx", 0) !== 0 || mark.get("dy", 0) !== 0 ||
		!brandingAt(mark.get("x"), right) || !brandingAt(mark.get("centerX"), right) || !brandingAt(mark.get("y"), !top) || !brandingAt(mark.get("centerY"), !top)) {
		return true;
	}
	if (state.small) {
		return false;
	}
	if (mark.get("visible") === false || mark.isHidden() || mark.get("opacity", 1) < 1) {
		return true;
	}
	const introOver = Date.now() > state.introEnd;
	return $array.any(state.checks, (check) => check(introOver));
}

function brandingGone(root: Root, state: IBranding): boolean {
	return !state.licensed && !root.isDisposed() && brandingOff(root, state) && brandingKeys() <= state.keys;
}

// after each frame; shown again a little later if it is still gone then
function checkBranding(root: Root, state: IBranding): void {
	// `logoPosition` changed after the chart was made, e.g. by a JSON config
	const corner = brandingCorner(root);
	const mark = state.mark;
	if (corner !== state.corner && mark && !mark.isDisposed()) {
		state.corner = corner;
		placeBranding(mark, state);
	}
	if (state.timer === undefined && brandingGone(root, state)) {
		state.timer = setTimeout(() => {
			state.timer = undefined;
			const tooltipContainer = root.tooltipContainer;
			if (brandingGone(root, state) && tooltipContainer && !tooltipContainer.isDisposed()) {
				// only taken out of the chart: code may still hold it
				const mark = state.mark;
				if (mark && !mark.isDisposed()) {
					tooltipContainer.children.removeValue(mark);
				}
				state.mark = undefined;
				buildBranding(root, state, true);
			}
		}, 3000) as any;
	}
}

function showBranding(root: Root): void {
	const state = brandingOf(root);
	if (!state.started) {
		state.started = true;
		state.keys = brandingKeys();
		state.listener = root.events.on("frameended", () => {
			checkBranding(root, state);
		});
		// code that reaches for the logo gets a placeholder
		root._logo = root.tooltipContainer.children.push(Container.new(root, { position: "absolute", isMeasured: false }));
	}
	if (!state.mark) {
		buildBranding(root, state);
	}
}

// hidden on a small root
function brandingSize(root: Root): void {
	const state = brandings.get(root);
	const mark = state && state.mark;
	if (state && mark) {
		const w = root.dom.offsetWidth;
		const h = root.dom.offsetHeight;
		state.small = (w <= 150) || (h <= 60);
		if (state.small) {
			mark.hide();
		}
		else {
			mark.show();
		}
	}
}

function endBranding(root: Root): void {
	const state = brandings.get(root);
	if (state) {
		if (state.timer !== undefined) {
			clearTimeout(state.timer);
			state.timer = undefined;
		}
		if (state.listener) {
			state.listener.dispose();
		}
		brandings.delete(root);
	}
}

/**
 * A chart of a product that has a licence on the page: its root shows no
 * logo.
 *
 * @ignore
 */
export function _brandingLicensed(root: Root): void {
	const state = brandingOf(root);
	state.licensed = true;
	if (state.mark) {
		state.mark.set("forceHidden", true);
	}
}

/**
 * The root of a chart: it ties the chart to an HTML element and holds its
 * global settings, formatters, locale and themes.
 *
 * @see {@link https://docs.amcharts.com/v5/getting-started/#root-element} for more info
 */
export class Root implements IDisposer {

	/**
	 * The HTML element the chart is in.
	 */
	public dom: HTMLElement;
	public _inner: HTMLElement;

	protected _settings: IRootSettings;

	/**
	 * Settings the Root filled in for itself, so that serializing can leave them
	 * out - a `Root` is not an `Entity`, so it has no `_computedProperties`.
	 *
	 * @ignore
	 */
	public _computedSettings: { [K in keyof IRootSettings]?: boolean } = {};
	protected _isDirty: boolean = false;
	protected _isDirtyParents: boolean = false;
	protected _isDirtyAnimation: boolean = false;
	protected _dirty: { [id: number]: Entity } = {};
	protected _dirtyParents: { [id: number]: IParent } = {};
	protected _dirtyBounds: { [id: number]: IBounds } = {};
	protected _dirtyPositions: { [id: number]: Sprite } = {};

	protected _ticker: ((currentTime: number) => void) | null = null;
	protected _tickers: Array<(currentTime: number) => void> = [];

	protected _updateTick: boolean = true;
	public skipRenderFrame: boolean = false;

	/**
	 * Root's event dispatcher.
	 *
	 * @see {@link https://docs.amcharts.com/v5/concepts/events/} for more info
	 */
	public events: EventDispatcher<Events<this, IRootEvents>> = new EventDispatcher();

	/**
	 * Time in milliseconds of the frame being rendered, or `null` while no
	 * frames run.
	 *
	 * @ignore
	 */
	public animationTime: number | null = null;

	private _animations: Array<IAnimation> = [];

	public _renderer: IRenderer;

	public _rootContainer!: Container;

	/**
	 * The main container: charts and other elements go into its `children`.
	 */
	public container!: Container;

	/**
	 * The [[Container]] tooltips are drawn in, above the chart.
	 */
	public tooltipContainer!: Container
	protected _tooltipContainerSettings!: { top: number, left: number, right: number, bottom: number };

	public _tooltip!: Tooltip;

	// Locale-related

	/**
	 * @ignore
	 */
	public language: Language = Language.new(this, {});

	/**
	 * Locale for the chart's texts and formatting. English by default.
	 *
	 * @see {@link https://docs.amcharts.com/v5/concepts/locales/}
	 */
	public locale: ILocale = en;

	// Date-time related

	/**
	 * Treats dates as UTC instead of the user's local time, when formatting
	 * and parsing them and when placing date axis grid. It takes precedence
	 * over `timezone`.
	 *
	 * @see {@link https://docs.amcharts.com/v5/concepts/formatters/formatting-dates/#utc-and-time-zones} for more info
	 */
	public utc: boolean = false;

	/**
	 * Time zone to show dates in, instead of the user's local one. Set it to a
	 * [[Timezone]] with an IANA name, e.g.
	 * `am5.Timezone.new("America/Vancouver")`. For UTC, `utc` is faster.
	 *
	 * Every date is converted, which can slow down charts with large data sets.
	 *
	 * @see {@link https://docs.amcharts.com/v5/getting-started/root-element/#time-zone} for more info
	 * @since 5.1.0
	 */
	public timezone?: Timezone;

	protected _pageDirection?: "ltr" | "rtl";

	/**
	 * Direction of text with no `direction` of its own: the `direction`
	 * setting, else the chart element's, as the browser would draw it.
	 *
	 * @ignore
	 */
	public _direction(): "ltr" | "rtl" {
		const own = this._settings.direction;
		if (own == "rtl" || own == "ltr") {
			return own;
		}
		if (this._pageDirection == null) {
			let direction: "ltr" | "rtl" = "ltr";
			try {
				if (getComputedStyle(this.dom).direction == "rtl") {
					direction = "rtl";
				}
			}
			catch (e) {
				// no style to read, as on a server
			}
			this._pageDirection = direction;
		}
		return this._pageDirection;
	}

	/**
	 * Maximum frames per second. When not set, the chart renders on every
	 * animation frame of the browser.
	 *
	 * Each frame waits `1000 / fps` milliseconds after the previous one is
	 * drawn, then for the screen's next refresh, so the rate achieved is lower:
	 * `fps: 30` gives about 20 on a 60 Hz screen.
	 *
	 * @see {@link https://docs.amcharts.com/v5/getting-started/root-element/#performance} for more info
	 */
	public fps: number | undefined;

	/**
	 * Number formatter.
	 *
	 * @see {@link https://docs.amcharts.com/v5/concepts/formatters/formatting-numbers/} for more info
	 */
	public numberFormatter: NumberFormatter = NumberFormatter.new(this, {});

	/**
	 * Date/time formatter.
	 *
	 * @see {@link https://docs.amcharts.com/v5/concepts/formatters/formatting-dates/} for more info
	 */
	public dateFormatter: DateFormatter = DateFormatter.new(this, {});

	/**
	 * Duration formatter.
	 *
	 * @see {@link https://docs.amcharts.com/v5/concepts/formatters/formatting-dates/} for more info
	 */
	public durationFormatter: DurationFormatter = DurationFormatter.new(this, {});


	// Accessibility

	/**
	 * Tab index for the whole chart.
	 *
	 * @see {@link https://docs.amcharts.com/v5/concepts/accessibility/} for more info
	 */
	public tabindex: number = 0;

	//@todo maybe make this better
	protected _tabindexes: Sprite[] = [];

	protected _a11yD: boolean = false;
	protected _focusElementDirty: boolean = false;
	protected _focusElementContainer: HTMLDivElement | undefined;
	protected _focusedSprite: Sprite | undefined;
	protected _isShift: boolean | undefined;
	protected _keyboardDragPoint: IPoint | undefined;

	/**
	 * The step of the last arrow key move (x and y: -6, 0 or 6), for elements
	 * that move a whole step whichever way the key points
	 *
	 * @ignore
	 */
	public _keyboardDragStep: IPoint = { x: 0, y: 0 };

	// The arrow key last pressed to move in a focusable group, until released
	protected _groupKey: string | undefined;
	protected _tooltipElementContainer: HTMLDivElement | undefined;
	protected _readerAlertElement: HTMLDivElement | undefined;

	// Each `focusableGroup` is one TAB stop: the member that is it, and groups
	// to re-check before the next frame
	protected _groupStops: { [group: string]: Sprite } = {};
	// Groups left with no TAB stop until one of their members is focused
	protected _groupNoStop: { [group: string]: boolean } = {};
	// Groups whose TAB stop was focused or set: kept. Otherwise it is the
	// first member that can take focus
	protected _groupStopKept: { [group: string]: boolean } = {};
	protected _dirtyGroups: { [group: string]: string | number } = {};

	// Focus work is collected and done once per frame: the TAB order, and
	// elements to decorate in full (`true`) or only re-check whether they can
	// take focus (`false`)
	protected _tabindexesDirty: boolean = false;
	protected _dirtyA11y: { [uid: number]: { target: Sprite, full: boolean } } = {};
	protected _focusElementSprites: WeakMap<Element, Sprite> = new WeakMap();

	/**
	 * @ignore
	 */
	public _logo?: Container;

	public _tooltipDiv: HTMLDivElement | undefined;

	/**
	 * Nonce for the `<style>` elements the chart adds to the page, for pages
	 * with a strict Content Security Policy.
	 */
	public nonce?: string;

	/**
	 * Colors of the chart's interface: text, grid, buttons and other controls.
	 *
	 * @see {@link https://docs.amcharts.com/v5/concepts/colors-gradients-and-patterns/#interface-colors} for more info
	 */
	public interfaceColors: InterfaceColors;

	/**
	 * A shared [[VerticalLayout]] for a [[Container]]'s `layout` setting.
	 *
	 * @default VerticalLayout.new()
	 */
	public verticalLayout: VerticalLayout = VerticalLayout.new(this, {});

	/**
	 * A shared [[HorizontalLayout]] for a [[Container]]'s `layout` setting.
	 *
	 * @default HorizontalLayout.new()
	 */
	public horizontalLayout: HorizontalLayout = HorizontalLayout.new(this, {});

	/**
	 * A shared [[GridLayout]] for a [[Container]]'s `layout` setting.
	 *
	 * @default GridLayout.new()
	 */
	public gridLayout: GridLayout = GridLayout.new(this, {});

	public _paused: boolean = false;

	/**
	 * Resizes the chart automatically when its container's size changes. With
	 * `false`, call `resize()` to resize it.
	 */
	public autoResize: boolean = true;

	protected _fontHash: string = "";
	protected _styles?: CSSStyleDeclaration;

	protected _isDisposed: boolean = false;

	/**
	 * Counts the web fonts loaded after text was measured.
	 *
	 * @ignore
	 */
	public _fontLoads: number = 0;

	/**
	 * Counts the frames in which every fitting pass runs, and waits for the next.
	 *
	 * @ignore
	 */
	public _passRound: number = 0;
	public _passTimer?: IDisposer;
	protected _disposers: Array<IDisposer> = [];

	protected _resizeSensorDisposer?: IDisposer;

	public _tooltips: Array<Tooltip> = [];

	protected _htmlElementContainer: HTMLDivElement | undefined;
	protected _htmlEnabledContainers: Container[] = [];

	/**
	 * Objects of this root that have an `id` setting, by that `id`.
	 *
	 * @since 5.11.0
	 */
	public entitiesById: { [index: string]: any } = {};

	/**
	 * @ignore
	 */
	public _systemTooltip?: Tooltip;

	protected constructor(id: string | HTMLElement, settings: IRootSettings = {}, isReal: boolean) {

		if (!isReal) {
			throw new Error("You cannot use `new Class()`, instead use `Class.new()`");
		}

		this._settings = settings;

		if (settings.accessible == false) {
			this._a11yD = true;
		}

		if (settings.useSafeResolution == null) {
			settings.useSafeResolution = true;
			this._computedSettings.useSafeResolution = true;
		}

		if (settings.sanitizeHTML == null) {
			settings.sanitizeHTML = true;
			this._computedSettings.sanitizeHTML = true;
		}

		let resolution;

		if (settings.useSafeResolution) {
			resolution = $utils.getSafeResolution();
		}

		const RendererClass = settings.renderer || Root.defaultRenderer;
		this._renderer = new RendererClass(resolution);

		const dom = Root._getDOM(id);

		this.interfaceColors = InterfaceColors.new(this, {});

		this.dom = dom;

		let inner: HTMLDivElement = document.createElement("div");
		inner.style.position = "relative";
		inner.style.width = "100%";
		inner.style.height = "100%";
		dom.appendChild(inner);

		const tooltipContainerBounds = settings.tooltipContainerBounds;
		if (tooltipContainerBounds) {
			this._tooltipContainerSettings = tooltipContainerBounds;
		}

		this._inner = inner;

		this._updateComputedStyles();

		registry.rootElements.push(this);
	}


	/**
	 * Renderer for Roots that do not set `renderer`.
	 *
	 * @default CanvasRenderer
	 * @since 5.21.0
	 */
	public static defaultRenderer: IRendererClass = CanvasRenderer;

	/**
	 * Creates a Root in an HTML element. An element can hold only one Root:
	 * creating another one there throws an error, unless
	 * `am5.registry.autoDispose` is `true`.
	 *
	 * @param   id        The element, or its `id`
	 * @param   settings  Settings
	 * @return            Root
	 */
	public static new(id: string | HTMLElement, settings?: IRootSettings): Root {
		// Before the constructor: its fields already start the ticker
		const dom = Root._getDOM(id);

		$array.each(registry.rootElements, (root) => {
			if (root.dom === dom) {
				if (registry.autoDispose) {
					root.dispose();
				}
				else {
					throw new Error("You cannot have multiple Roots on the same DOM node");
				}
			}
		});

		const root = new Root(id, settings, true);
		root._init();
		return root;
	}

	protected static _getDOM(id: string | HTMLElement): HTMLElement {
		const dom = id instanceof HTMLElement ? id : document.getElementById(id);
		if (dom === null) {
			throw new Error("Could not find HTML element with id `" + id + "`");
		}
		return dom;
	}

	/**
	 * Moves the chart to another HTML element and resizes it to fit there.
	 * Nothing happens if no element with that `id` exists.
	 *
	 * @param  id  The element, or its `id`
	 */
	public moveDOM(id: string | HTMLElement): void {
		let dom: HTMLElement | null;

		if (id instanceof HTMLElement) {
			dom = id;
		}
		else {
			dom = document.getElementById(id);
		}

		if (dom) {
			while (this.dom.childNodes.length > 0) {
				dom.appendChild(this.dom.childNodes[0]);
			}
			this.dom = dom;
			// The cached computed style belongs to the old element
			this._styles = undefined;
			this._initResizeSensor();
			this.resize();
		}

	}


	protected _handleLogo(): void {
		brandingSize(this);
	}

	public _showBranding(): void {
		showBranding(this);
	}

	protected _getRealSize(): DOMRect {
		return this.dom.getBoundingClientRect();
	}

	protected _getCalculatedSize(rect: DOMRect): ISize {
		if (this._settings.calculateSize) {
			return this._settings.calculateSize(rect);

		} else {
			// Drawn at the size before CSS transforms, which the browser then applies
			const dom = this.dom;
			const width = dom.offsetWidth;
			const height = dom.offsetHeight;
			if (Math.abs(width - rect.width) > 1 || Math.abs(height - rect.height) > 1) {
				return { width, height };
			}
			return {
				width: rect.width,
				height: rect.height,
			};
		}
	}

	protected _init(): void {

		const settings = this._settings;
		if (settings.accessible !== false) {
			if (settings.focusable) {
				this._inner.setAttribute("focusable", "true");
				this._inner.setAttribute("tabindex", this.tabindex + "");
			}

			if (settings.ariaLabel) {
				this._inner.setAttribute("aria-label", settings.ariaLabel);
			}

			if (settings.role) {
				this._inner.setAttribute("role", settings.role);
			}
		}

		const renderer = this._renderer;

		const rect = this._getRealSize();
		const size = this._getCalculatedSize(rect);

		const width = Math.floor(size.width);
		const height = Math.floor(size.height);

		const realWidth = Math.floor(rect.width);
		const realHeight = Math.floor(rect.height);

		const rootContainer = Container.new(this, {
			visible: true,
			width: width,
			height: height,
		});
		this._rootContainer = rootContainer;
		this._rootContainer._defaultThemes.push(DefaultTheme.new(this));
		rootContainer.on("themes", () => {
			this._themeTouchGestures();
		});

		// the size is needed to rebuild this from a config, `visible` is the default
		const container = rootContainer.children.push(Container.new(this, { width: p100, height: p100 }));
		container._setC("visible", true);
		this.container = container;

		renderer.resize(realWidth, realHeight, width, height);

		//@todo: better appendChild - refer
		this._inner.appendChild(renderer.view);

		// TODO: TMP TMP TMP for testing only, remove
		//renderer.debugGhostView = true;

		this._initResizeSensor();

		// Web fonts that finish loading after text was measured
		const fonts = (<any>document).fonts;
		if (fonts && fonts.addEventListener) {
			const loadedFonts = () => {
				let count = 0;
				fonts.forEach((font: any) => {
					if (font.status == "loaded") {
						count++;
					}
				});
				return count;
			};

			// Only when a font did load: Firefox also fires loadingdone without one
			let loaded = loadedFonts();
			const remeasure = () => {
				const count = loadedFonts();
				if (count > loaded && !this._isDisposed) {
					this._fontLoads++;
					this._invalidateLabelBounds(this._rootContainer, true);
					$array.each(this._tooltips, (tooltip) => {
						this._invalidateLabelBounds(tooltip, true);
					});
				}
				loaded = count;
			};
			this._disposers.push($utils.addEventListener(fonts, "loadingdone", remeasure));
			// WebKit fires no loadingdone
			this._disposers.push($utils.addEventListener(fonts, "loading", () => {
				fonts.ready.then(remeasure);
			}));
			if (fonts.status == "loading") {
				fonts.ready.then(remeasure);
			}
		}

		// HTML content holder
		const htmlElementContainer = document.createElement("div");
		this._htmlElementContainer = htmlElementContainer;
		htmlElementContainer.className = "am5-html-container";
		htmlElementContainer.style.position = "absolute";
		htmlElementContainer.style.pointerEvents = "none";
		if (!this._tooltipContainerSettings) {
			htmlElementContainer.style.overflow = "hidden";
		}
		this._inner.appendChild(htmlElementContainer);

		if (this._a11yD !== true) {

			// Create element which is used to make announcements to screen reader
			const readerAlertElement = document.createElement("div");
			readerAlertElement.className = "am5-reader-container";
			readerAlertElement.setAttribute("role", "alert");
			// readerAlertElement.style.zIndex = "-100000";
			// readerAlertElement.style.opacity = "0";
			// readerAlertElement.style.top = "0";
			readerAlertElement.style.position = "absolute";
			readerAlertElement.style.width = "1px";
			readerAlertElement.style.height = "1px";
			readerAlertElement.style.overflow = "hidden";
			readerAlertElement.style.clip = "rect(1px, 1px, 1px, 1px)";
			this._readerAlertElement = readerAlertElement;
			this._inner.appendChild(this._readerAlertElement);

			const focusElementContainer = document.createElement("div");
			focusElementContainer.className = "am5-focus-container";
			focusElementContainer.style.position = "absolute";
			focusElementContainer.style.pointerEvents = "none";
			focusElementContainer.style.top = "0px";
			focusElementContainer.style.left = "0px";
			focusElementContainer.style.overflow = "hidden";
			focusElementContainer.style.width = width + "px";
			focusElementContainer.style.height = height + "px";

			focusElementContainer.setAttribute("role", "graphics-document");
			if (settings.ariaLabel) {
				focusElementContainer.setAttribute("aria-label", settings.ariaLabel);
			}

			$utils.setInteractive(focusElementContainer, false);
			this._focusElementContainer = focusElementContainer;
			this._inner.appendChild(this._focusElementContainer);

			const tooltipElementContainer = document.createElement("div");
			this._tooltipElementContainer = tooltipElementContainer;
			tooltipElementContainer.className = "am5-tooltip-container";
			this._inner.appendChild(tooltipElementContainer);

			// Add keyboard events for accessibility, e.g. simulating drag with arrow
			// keys and click with ENTER
			if ($utils.supports("keyboardevents")) {

				this._disposers.push($utils.addEventListener(window, "keydown", (ev: KeyboardEvent) => {
					const eventKey = $utils.getEventKey(ev);
					if (eventKey == "Shift") {
						this._isShift = true;
					}
					else if (eventKey == "Tab") {
						this._isShift = ev.shiftKey;
					}
				}));

				this._disposers.push($utils.addEventListener(window, "keyup", (ev: KeyboardEvent) => {
					const eventKey = $utils.getEventKey(ev);
					if (eventKey == "Shift") {
						this._isShift = false;
					}
				}));

				this._disposers.push($utils.addEventListener(focusElementContainer, "click", () => {
					// Some screen readers convert ENTER (and some SPACE) press whil on
					// focused element to a "click" event, preventing actual "keydown"
					// event from firing. We're using this "click" event to still
					// generate internal click events.
					const focusedSprite = this._focusedSprite;
					if (focusedSprite) {
						const announceText = focusedSprite.get("clickAnnounceText", "");
						if (announceText !== "") {
							this.readerAlert(announceText);
						}
						const downEvent = renderer.getEvent(new MouseEvent("click"));
						focusedSprite.events.dispatch("click", {
							type: "click",
							originalEvent: downEvent.event,
							point: downEvent.point,
							simulated: true,
							target: focusedSprite
						});
					}
				}));

				this._disposers.push($utils.addEventListener(focusElementContainer, "keydown", (ev: KeyboardEvent) => {
					const focusedSprite = this._focusedSprite;
					if (focusedSprite) {
						if (ev.key == "Escape") {
							// ESC dismisses what focus brought up (a tooltip, a keyboard
							// drag) but keeps focus where it is
							if (focusedSprite.isDragging()) {
								this._stopKeyboardDrag(focusedSprite);
							}
							focusedSprite.hideTooltip();
							return;
						}
						let dragOffsetX = 0;
						let dragOffsetY = 0;
						// TODO: figure out if using bogus MouseEvent is fine, or it will
						// fail on some platforms
						const eventKey = $utils.getEventKey(ev);
						switch (eventKey) {
							case "Enter":
							case " ":
								// SPACE clicks what a browser would click with it: buttons,
								// checkboxes and the like. The role is the one written to the
								// page, e.g. "button" for a focusable slice that toggles
								const focusDom = focusedSprite.getPrivate("focusElement");
								const domRole = (focusDom && focusDom.dom.getAttribute("role")) || "";
								if (eventKey == " " && ["button", "checkbox", "switch", "radio", "tab", "option", "menuitem", "menuitemcheckbox", "menuitemradio"].indexOf(domRole) === -1) {
									return;
								}
								const announceText = focusedSprite.get("clickAnnounceText", "");
								if (announceText !== "") {
									this.readerAlert(announceText);
								}
								ev.preventDefault();
								const downEvent = renderer.getEvent(new MouseEvent("mouse"));
								focusedSprite.events.dispatch("click", {
									type: "click",
									originalEvent: downEvent.event,
									point: downEvent.point,
									simulated: true,
									target: focusedSprite
								});
								return;
							case "ArrowLeft":
								dragOffsetX = -6;
								break;
							case "ArrowRight":
								dragOffsetX = 6;
								break;
							case "ArrowUp":
								dragOffsetY = -6;
								break;
							case "ArrowDown":
								dragOffsetY = 6;
								break;
							default:
								return;
						}

						if (dragOffsetX != 0 || dragOffsetY != 0) {
							ev.preventDefault();

							// In a focusable group arrow keys move between its members (on
							// key up); SHIFT + arrows drag a draggable member. In a vertical
							// group up and down move between members, left and right drag
							if (focusedSprite.get("focusableGroup") && !focusedSprite.isDragging()) {
								if (focusedSprite.getPrivate("focusGroupVertical") ? dragOffsetY != 0 : !ev.shiftKey) {
									this._groupKey = eventKey;
									return;
								}
							}

							if (!focusedSprite.isDragging()) {
								// Start dragging, as if pressed in the middle of the element, so
								// that events carry pointer positions where it is
								const bounds = focusedSprite._focusBounds();
								this._keyboardDragPoint = this.rootPointToDocument({
									x: (bounds.left + bounds.right) / 2,
									y: (bounds.top + bounds.bottom) / 2
								});

								const downEvent = renderer.getEvent(new MouseEvent("mousedown", {
									clientX: this._keyboardDragPoint.x,
									clientY: this._keyboardDragPoint.y
								}));

								if (focusedSprite.events.isEnabled("pointerdown")) {
									focusedSprite.events.dispatch("pointerdown", {
										type: "pointerdown",
										originalEvent: downEvent.event,
										point: downEvent.point,
										simulated: true,
										target: focusedSprite
									});
								}

							}
							else {
								// Move focus marker
								//this._positionFocusElement(focusedSprite);
							}

							// Move incrementally
							this._keyboardDragStep = { x: dragOffsetX, y: dragOffsetY };
							const dragPoint = this._keyboardDragPoint!;
							dragPoint.x += dragOffsetX;
							dragPoint.y += dragOffsetY;
							// measured from the chart, as the press is, so a step is exactly
							// the offset whatever the page around the chart
							const moveEvent = renderer.getEvent(new MouseEvent("mousemove", {
								clientX: dragPoint.x,
								clientY: dragPoint.y
							}));

							if (focusedSprite.events.isEnabled("globalpointermove")) {
								focusedSprite.events.dispatch("globalpointermove", {
									type: "globalpointermove",
									originalEvent: moveEvent.event,
									point: moveEvent.point,
									simulated: true,
									target: focusedSprite
								});
							}
						}
					}
				}));

				this._disposers.push($utils.addEventListener(focusElementContainer, "keyup", (ev: KeyboardEvent) => {
					if (this._focusedSprite) {
						const focusedSprite = this._focusedSprite;
						const eventKey = $utils.getEventKey(ev);
						switch (eventKey) {
							case "ArrowLeft":
							case "ArrowRight":
							case "ArrowUp":
							case "ArrowDown":
								// Only a key whose press the page got too: in browse mode a
								// screen reader keeps the press and moves its own cursor (and
								// with it the focus), but lets the release through
								const pressed = this._groupKey === eventKey;
								this._groupKey = undefined;
								if (focusedSprite.isDragging()) {
									this._stopKeyboardDrag(focusedSprite);
									return;
								}
								else if (pressed && focusedSprite.get("focusableGroup") && !(focusedSprite.getPrivate("focusGroupVertical") && (eventKey == "ArrowLeft" || eventKey == "ArrowRight"))) {
									// Find next item in focusable group
									this._updateTabindexes();
									const group = focusedSprite.get("focusableGroup");
									const items = this._tabindexes.filter((item) => {
										return item === focusedSprite || (item.get("focusableGroup") == group && item.getPrivate("focusElement") && this._canTab(item));
									});
									let index = items.indexOf(focusedSprite);
									const lastIndex = items.length - 1;
									index += (eventKey == "ArrowRight" || eventKey == "ArrowDown") ? 1 : -1;
									if (index < 0) {
										index = lastIndex;
									}
									else if (index > lastIndex) {
										index = 0;
									}
									$utils.focus(items[index].getPrivate("focusElement")!.dom);
								}
								break;
						}
					}
				}));
			}
		}

		this._startTicker();
		this.setThemes([]);
		this._initForcedColors();

		this._addTooltip();

		if (!this._hasLicense()) {
			this._showBranding();
		}
	}

	/**
	 * A shared [[Tooltip]] (theme tag `"system"`) for interface elements such
	 * as the logo and buttons, created on first use.
	 * @since 5.14.0
	 */
	public get systemTooltip() {
		if (!this._systemTooltip || this._systemTooltip.isDisposed()) {
			const tooltip = Tooltip.new(this, {
				themeTags: ["system"]
			});

			this._systemTooltip = tooltip;
		}
		return this._systemTooltip;
	}

	private _initResizeSensor(): void {
		if (this._resizeSensorDisposer) {
			this._resizeSensorDisposer.dispose();
		}
		this._resizeSensorDisposer = new ResizeSensor(this.dom, () => {
			if (this.autoResize) {
				this.resize();
			}
		});
		this._disposers.push(this._resizeSensorDisposer);
	}

	/**
	 * Resizes the chart to fit its container. Call it after the container's
	 * size changes when `autoResize` is `false`.
	 */
	public resize(): void {
		const rect = this._getRealSize();
		const size = this._getCalculatedSize(rect);
		const w = Math.floor(size.width);
		const h = Math.floor(size.height);

		if (w > 0 && h > 0) {
			const realWidth = Math.floor(rect.width);
			const realHeight = Math.floor(rect.height);

			const htmlElementContainer = this._htmlElementContainer!;
			htmlElementContainer.style.width = w + "px";
			htmlElementContainer.style.height = h + "px";

			if (this._a11yD !== true) {
				const focusElementContainer = this._focusElementContainer!;
				focusElementContainer.style.width = w + "px";
				focusElementContainer.style.height = h + "px";
			}

			this._renderer.resize(realWidth, realHeight, w, h);

			const rootContainer = this._rootContainer;

			rootContainer.setPrivate("width", w);
			rootContainer.setPrivate("height", h);
			this._render();
			this._handleLogo();
		}
	}

	/**
	 * Re-applies the current `_settings` to the live `Root` and its sub-objects
	 * without tearing anything down.
	 *
	 * Unlike `_init()`, this creates no new containers, DOM elements, or event
	 * listeners. Use it after changing settings on an already-initialized `Root`
	 * (e.g. from a parsed `root` config section).
	 *
	 * NOTE: `accessible` can only be turned off (matching constructor behavior);
	 * it cannot be re-enabled on a live `Root`.
	 *
	 * @ignore
	 */
	public _reapplySettings(): void {
		const settings = this._settings;

		// Renderer resolution (`useSafeResolution`). `getSafeResolution()` returns
		// `undefined` off iOS, which means "use the device pixel ratio".
		const safeResolution = $utils.getSafeResolution();
		this._renderer.resolution = (settings.useSafeResolution && safeResolution != null) ? safeResolution : window.devicePixelRatio;

		// Tooltip container bounds.
		if (settings.tooltipContainerBounds) {
			this._tooltipContainerSettings = settings.tooltipContainerBounds;
		}
		if (this._htmlElementContainer) {
			this._htmlElementContainer.style.overflow = settings.tooltipContainerBounds ? "" : "hidden";
		}

		// Accessibility can only be disabled, never re-enabled on a live `Root`.
		if (settings.accessible === false) {
			this._a11yD = true;
		}

		// Inner element ARIA / focus attributes.
		if (!this._a11yD) {
			const inner = this._inner;

			if (settings.focusable) {
				inner.setAttribute("focusable", "true");
				inner.setAttribute("tabindex", this.tabindex + "");
			}
			else {
				inner.removeAttribute("focusable");
				inner.removeAttribute("tabindex");
			}

			if (settings.ariaLabel != null) {
				inner.setAttribute("aria-label", settings.ariaLabel);
			}
			else {
				inner.removeAttribute("aria-label");
			}

			if (settings.role != null) {
				inner.setAttribute("role", settings.role);
			}
			else {
				inner.removeAttribute("role");
			}
		}

		this._updateForcedColors();

		// `focusPadding`, `sanitizeHTML` and `calculateSize` are read from
		// `_settings` on demand, so they need no explicit re-application.

		// Force every element to re-run its update cycle so values derived from
		// Root settings downstream (e.g. label fonts pulled from `fontFamily`/
		// `fontSize`/`fontWeight`) are re-applied. `markDirty()` on a `Container`
		// re-runs its `_updateChildren()`, which is where those values are pushed.
		if (this._rootContainer) {
			this._rootContainer.markDirty();
			this._rootContainer.walkChildren((child) => {
				child.markDirty();
				// a `direction` from a config moves text and legend items
				child.markDirtyBounds();
			});
		}

		// Push the new resolution / calculated size to the renderer and re-render.
		this._render();
	}

	/**
	 * The Root's settings.
	 */
	public get settings(): IRootSettings {
		return this._settings;
	}

	private _render() {
		if (this.skipRenderFrame) {
			this.skipRenderFrame = false;
			return;
		}
		this._renderer.render(this._rootContainer._display);

		if (this._focusElementDirty) {
			this._visibleMemo = {};
			this._updateTabindexes();
			this._updateDirtyA11y();
			this._updateCurrentFocus();
			this._updateDirtyGroups();
			this._visibleMemo = undefined;
			this._focusElementDirty = false;
		}

		// Readable elements never take focus, so they are placed over their
		// elements here, wherever layout moved them: screen readers highlight
		// what they read
		$array.each(this._readables, (item) => {
			const focusElement = item.getPrivate("focusElement");
			if (focusElement && focusElement.dom.getAttribute("aria-hidden") != "true") {
				this._positionFocusElement(item);
			}
		});
	}

	private _runTickers(currentTime: number) {
		$array.each(this._tickers, (f) => {
			f(currentTime);
		});
	}

	private _runAnimations(currentTime: number): boolean {
		let running = 0;

		$array.keepIf(this._animations, (animation) => {
			const state = animation._runAnimation(currentTime);

			if (state === AnimationState.Stopped) {
				return false;

			} else if (state === AnimationState.Playing) {
				++running;
				return true;

			} else {
				return true;
			}
		});

		this._isDirtyAnimation = false;

		return running === 0;
	}

	private _runDirties() {
		//console.time("tick");
		let allParents: { [id: number]: IParent } = {};

		while (this._isDirtyParents) {
			// This must be before calling _prepareChildren
			this._isDirtyParents = false;

			$object.entries(this._dirtyParents).forEach(([key, parent]) => {
				delete this._dirtyParents[key];

				if (!parent.isDisposed()) {
					allParents[parent.uid] = parent;
					parent._prepareChildren();
				}
			});
		}

		$object.entries(allParents).forEach(([_key, parent]) => {
			parent._updateChildren();
		});

		const objects: Array<Entity> = [];

		//		console.log("_beforeChanged")
		$object.entries(this._dirty).forEach(([key, entity]) => {
			if (entity.isDisposed()) {
				delete this._dirty[key];

			} else {
				objects.push(entity);
				entity._beforeChanged();
			}
		});

		//		console.log("_changed")
		objects.forEach((entity) => {
			entity._changed();
			delete this._dirty[entity.uid];
			entity._clearDirty();
		});

		this._isDirty = false;

		const depths: { [id: number]: number } = {};
		const bounds: Array<IBounds> = [];

		$object.entries(this._dirtyBounds).forEach(([key, entity]) => {
			delete this._dirtyBounds[key];

			if (!entity.isDisposed()) {
				depths[entity.uid] = entity.depth();
				bounds.push(entity);
			}
		});


		this._positionHTMLElements();

		// High depth -> low depth
		bounds.sort((x, y) => {
			return $order.compare(depths[y.uid], depths[x.uid]);
		});

		//		console.log("_updateBounds")
		bounds.forEach((entity) => {
			entity._updateBounds();
		});

		//		console.log("_updatePosition")
		const dirtyPositions = this._dirtyPositions;

		$object.entries(dirtyPositions).forEach(([key, sprite]) => {
			delete dirtyPositions[key];

			if (!sprite.isDisposed()) {
				sprite._updatePosition();
			}
		});

		//		console.log("_afterChanged")
		objects.forEach((entity) => {
			entity._afterChanged();
		});

		$object.entries(allParents).forEach(([_key, parent]) => {
			parent._childrenPrep = false;
			parent._childrenUpdt = false;
		});
		//console.timeEnd("tick");
	}

	private _renderFrame(currentTime: number): boolean {
		if (this._updateTick) {
			if (this.events.isEnabled("framestarted")) {
				this.events.dispatch("framestarted", {
					type: "framestarted",
					target: this,
					timestamp: currentTime,
				});
			}

			this._checkComputedStyles();
			this._runTickers(currentTime);

			const animationDone = this._runAnimations(currentTime);

			this._runDirties();
			this._render();
			this._renderer.resetImageArray();
			this._positionHTMLElements();

			if (this.events.isEnabled("frameended")) {
				this.events.dispatch("frameended", {
					type: "frameended",
					target: this,
					timestamp: currentTime,
				});
			}

			return this._tickers.length === 0 &&
				animationDone &&
				!this._isDirtyAnimation &&
				!this._isDirty;

		} else {
			return true;
		}
	}

	public _runTicker(currentTime: number, now?: boolean) {
		if (!this.isDisposed()) {
			this.animationTime = currentTime;

			const done = this._renderFrame(currentTime);

			// No more work to do
			if (done) {
				this._ticker = null;
				this.animationTime = null;

			} else {
				if (!this._paused) {
					if (now) {
						this._ticker!
					}
					else {
						rAF(this.fps, this._ticker!);
					}
				}
			}
		}
	}

	public _runTickerNow(timeout: number = 10000) {
		if (!this.isDisposed()) {
			const endTime = performance.now() + timeout;

			for (; ;) {
				const currentTime = performance.now();

				if (currentTime >= endTime) {
					this.animationTime = null;
					break;
				}

				this.animationTime = currentTime;

				const done = this._renderFrame(currentTime);

				if (done) {
					this.animationTime = null;
					break;
				}
			}
		}
	}

	private _startTicker() {
		if (this._ticker === null) {
			this.animationTime = null;

			this._ticker = (currentTime) => {
				this._runTicker(currentTime);
			};

			rAF(this.fps, this._ticker!);
		}
	}

	/**
	 * Whether the chart updates and redraws.
	 */
	public get updateTick(): boolean {
		return this._updateTick;
	}

	/**
	 * Stops the chart from updating and redrawing with `false`, until set back
	 * to `true`.
	 */
	public set updateTick(value: boolean) {
		this._updateTick = value;

		if (value) {
			this._startTicker();
		}
	}

	/**
	 * Returns `true` if `entity` is already queued, as an entity and as a
	 * parent, for the next frame.
	 *
	 * @ignore
	 */
	public _isQueuedDirty(entity: Entity): boolean {
		return this._isDirty && this._ticker !== null && this._dirty[entity.uid] !== undefined && this._dirtyParents[entity.uid] !== undefined;
	}

	public _addDirtyEntity(entity: Entity) {
		this._isDirty = true;

		if (this._dirty[entity.uid] === undefined) {
			this._dirty[entity.uid] = entity;
		}

		this._startTicker();
	}

	public _addDirtyParent(parent: IParent) {
		this._isDirty = true;
		this._isDirtyParents = true;

		if (this._dirtyParents[parent.uid] === undefined) {
			this._dirtyParents[parent.uid] = parent;
		}

		this._startTicker();
	}

	public _addDirtyBounds(entity: IBounds) {
		this._isDirty = true;

		if (this._dirtyBounds[entity.uid] === undefined) {
			this._dirtyBounds[entity.uid] = entity;
		}

		this._startTicker();
	}

	public _addDirtyPosition(sprite: Sprite) {
		this._isDirty = true;

		if (this._dirtyPositions[sprite.uid] === undefined) {
			this._dirtyPositions[sprite.uid] = sprite;
		}

		this._startTicker();
	}

	public _addAnimation(animation: IAnimation) {
		this._isDirtyAnimation = true;

		// TODO use numeric id instead
		if (this._animations.indexOf(animation) === -1) {
			this._animations.push(animation);
		}

		this._startTicker();
	}

	public _markDirty() {
		this._isDirty = true;
	}

	public _markDirtyRedraw() {
		this.events.once("frameended", () => {
			this._isDirty = true;
			this._startTicker();
		})
	}

	/**
	 * Calls a function on every frame, which keeps the chart rendering, until
	 * the returned disposer is disposed.
	 *
	 * @param   f  Function, given the frame's time in milliseconds
	 * @return     Disposer that stops the calls
	 */
	public eachFrame(f: (currentTime: number) => void): IDisposer {
		this._tickers.push(f);
		this._startTicker();

		return new Disposer(() => {
			$array.removeFirst(this._tickers, f);
		});
	}

	/**
	 * Makes every element inside a container update and re-measure on the next
	 * frame.
	 *
	 * @param  container  Container; the main `container` if not given
	 */
	public markDirtyGlobal(container?: Container): void {
		if (!container) {
			container = this.container;
		}
		container.walkChildren((child) => {
			if (child instanceof Container) {
				this.markDirtyGlobal(child);
			}
			child.markDirty();
			child.markDirtyBounds();
		});
	}

	/**
	 * Returns the chart's width in pixels: the container's, or the one from
	 * `calculateSize` if set.
	 *
	 * @return Width
	 */
	public width(): number {
		// TODO make this more efficient, maybe just return the renderer's width ?
		return Math.floor(this._getCalculatedSize(this._getRealSize()).width);
	}

	/**
	 * Returns the chart's height in pixels: the container's, or the one from
	 * `calculateSize` if set.
	 *
	 * @return Height
	 */
	public height(): number {
		// TODO make this more efficient, maybe just return the renderer's height ?
		return Math.floor(this._getCalculatedSize(this._getRealSize()).height);
	}

	/**
	 * Disposes the Root and everything in it, and removes the chart from the
	 * page.
	 */
	public dispose(): void {
		if (!this._isDisposed) {
			this._isDisposed = true;
			endBranding(this);

			this._rootContainer.dispose();
			this._renderer.dispose();
			this.horizontalLayout.dispose();
			this.verticalLayout.dispose();
			this.interfaceColors.dispose();

			$array.each(this._disposers, (x) => {
				x.dispose();
			});

			if (this._inner) {
				$utils.removeElement(this._inner);
			}

			$array.remove(registry.rootElements, this);
		}
	}

	/**
	 * Returns `true` if the Root is disposed.
	 *
	 * @return Disposed?
	 */
	public isDisposed(): boolean {
		return this._isDisposed;
	}

	/**
	 * Makes screen readers read out a message.
	 *
	 * @see {@link https://docs.amcharts.com/v5/concepts/accessibility/} for more info
	 * @param  text  Alert text
	 */
	public readerAlert(text: string): void {
		if (this._a11yD !== true) {
			const element = this._readerAlertElement!;
			text = $utils.stripTags(text);
			if (element.innerHTML == text) {
				element.innerHTML = "";
			}
			element.innerHTML = text;
		}
	}

	/**
	 * Sets the chart's themes, replacing any set before.
	 *
	 * @see {@link https://docs.amcharts.com/v5/concepts/themes/} for more info
	 * @param  themes  A list of themes
	 */
	public setThemes(themes: Array<Theme>): void {
		this._rootContainer.set("themes", themes);

		// otherwise new themes are not applied
		const tooltipContainer = this.tooltipContainer;
		if (tooltipContainer) {
			tooltipContainer._applyThemes();
		}

		// @todo review this
		const interfaceColors = this.interfaceColors;
		if (interfaceColors) {
			interfaceColors._applyThemes();
		}


	}

	protected _addTooltip() {
		if (!this.tooltipContainer) {
			const tooltipContainerSettings = this._tooltipContainerSettings;
			const tooltipContainer = this._rootContainer.children.push(Container.new(this, {
				position: "absolute",
				isMeasured: false,
				width: p100,
				height: p100,
				layer: tooltipContainerSettings ? 35 : 30,
				layerMargin: tooltipContainerSettings ? tooltipContainerSettings : undefined
			}));
			this.tooltipContainer = tooltipContainer;

			const tooltip = Tooltip.new(this, {});
			this.container._setC("tooltip", tooltip);
			tooltip.hide(0);
			this._tooltip = tooltip;
		}
	}

	/**
	 * Accessibility
	 */

	public _registerTabindexOrder(target: Sprite): void {
		if (this._a11yD == true) {
			return;
		}

		if (this._hasFocusElement(target)) {
			if (!this._tabindexUids[target.uid]) {
				this._tabindexUids[target.uid] = true;
				this._tabindexes.push(target);
				if (this._tabindexRanks[target.uid] === undefined) {
					this._tabindexRanks[target.uid] = this._tabindexRank++;
				}
			}
			// Readable (not focusable) or no longer
			const readable = !target.get("focusable");
			if (readable != (this._readables.indexOf(target) != -1)) {
				if (readable) {
					this._readables.push(target);
				}
				else {
					$array.remove(this._readables, target);
				}
			}
		}
		else {
			this._removeTabindex(target);
		}
		this._invalidateTabindexes();
	}

	// Not focusable, but read by screen readers: its `ariaLabel` was set by
	// the user (not by a theme or the library), e.g. an axis title. It gets
	// a focus element that is not a TAB stop
	public _isReadable(target: Sprite): boolean {
		if (target.get("focusable") || !target.get("ariaLabel") || target.get("role") == "tooltip") {
			return false;
		}
		if (target.isUserSetting("ariaLabel") && !target.isComputedSetting("ariaLabel")) {
			return true;
		}
		const template = target.template;
		return template && template.get("ariaLabel") && !template._computedSettings.ariaLabel ? true : false;
	}

	// Whether the element gets a focus element: focusable or readable
	protected _hasFocusElement(target: Sprite): boolean {
		return (target.get("focusable") || this._isReadable(target)) && !target.getPrivate("focusExcluded") ? true : false;
	}

	public _unregisterTabindexOrder(target: Sprite): void {
		if (this._a11yD == true) {
			return;
		}

		this._removeTabindex(target);
		this._invalidateTabindexes();
	}

	protected _tabindexUids: { [uid: number]: boolean } = {};

	// The readable elements in `_tabindexes` (not focusable)
	protected _readables: Sprite[] = [];

	// The order elements first became focusable in: one made focusable again
	// (e.g. Gantt task names when editing is turned back on) goes back to its place
	protected _tabindexRanks: { [uid: number]: number } = {};
	protected _tabindexRank: number = 0;

	protected _removeTabindex(target: Sprite): void {
		if (this._tabindexUids[target.uid]) {
			delete this._tabindexUids[target.uid];
			$array.remove(this._tabindexes, target);
			$array.remove(this._readables, target);
		}
	}

	/**
	 * The TAB order is worked out again before the next frame.
	 *
	 * @ignore
	 */
	public _invalidateTabindexes(): void {
		if (this._a11yD == true) {
			return;
		}
		this._tabindexesDirty = true;
		this._focusElementDirty = true;
	}

	// Sorts the focusable elements by `tabindexOrder` and puts their focus
	// elements in that order, moving only those out of place
	protected _updateTabindexes(): void {
		if (!this._tabindexesDirty || this._a11yD == true) {
			return;
		}
		this._tabindexesDirty = false;

		// Equal `tabindexOrder` keeps the order elements first became focusable in
		const order = this._tabindexRanks;
		this._tabindexes.sort((a: Sprite, b: Sprite) => {
			const aindex = a.get("tabindexOrder", 0);
			const bindex = b.get("tabindexOrder", 0);
			if (aindex == bindex) {
				return order[a.uid] - order[b.uid];
			}
			return aindex > bindex ? 1 : -1;
		});

		const container = this._focusElementContainer!;
		let next: ChildNode | null = container.firstChild;
		$array.each(this._tabindexes, (item) => {
			let focusElement = item.getPrivate("focusElement");
			if (!focusElement) {
				this._makeFocusElement(item);
				focusElement = item.getPrivate("focusElement")!;
			}
			const dom = focusElement.dom;
			if (dom === next) {
				next = next.nextSibling;
			}
			else {
				container.insertBefore(dom, next);
			}
			const group = item.get("focusableGroup");
			if (group) {
				this._dirtyGroups[group] = group;
			}
		});
	}

	// Whether the element can take focus now: shown (with all its parents),
	// sized and not opted out. `ariaHidden` opts out too: a hidden element must
	// not take focus
	public _canFocus(target: Sprite): boolean {
		return target.get("opacity") !== 0 && target.get("role") != "tooltip" && !target.get("ariaHidden") && !target.isHidden() && target.getPrivate("focusable") !== false && this._isVisibleDeep(target) && this._hasFocusSize(target) ? true : false;
	}

	// Whether the element is a keyboard stop: it can take focus and is in view.
	// Out of view (e.g. a map object panned away) it is still there for screen
	// readers, just not a TAB stop. The focused element stays one until left
	public _canTab(target: Sprite, canFocus?: boolean): boolean {
		return (canFocus != null ? canFocus : this._canFocus(target)) && !!target.get("focusable") && (this._focusedSprite === target || (!target.getPrivate("focusOutOfView") && !target.getPrivate("focusDisabled")));
	}

	// Visibility of containers, remembered while focus elements are updated
	// for a frame: many elements share the same parents
	protected _visibleMemo: { [uid: number]: boolean } | undefined;

	protected _isVisibleDeep(target: Sprite): boolean {
		const memo = this._visibleMemo;
		if (!memo) {
			return target.isVisibleDeep();
		}
		if (!target.isVisible()) {
			return false;
		}
		const parent = target.parent;
		if (!parent) {
			return true;
		}
		let visible = memo[parent.uid];
		if (visible === undefined) {
			visible = this._isVisibleDeep(parent);
			memo[parent.uid] = visible;
		}
		return visible;
	}

	protected _invalidateGroup(group: string | number): void {
		this._dirtyGroups[group] = group;
		this._focusElementDirty = true;
	}

	protected _updateDirtyGroups(): void {
		const groups = this._dirtyGroups;
		const keys = Object.keys(groups);
		if (keys.length == 0) {
			return;
		}
		this._dirtyGroups = {};

		// Members of all dirty groups, in one pass
		const members: { [group: string]: Sprite[] } = {};
		$array.each(keys, (key) => {
			members[key] = [];
		});
		$array.each(this._tabindexes, (item) => {
			const group = item.get("focusableGroup");
			if (group != null) {
				const list = members[group];
				if (list && item.getPrivate("focusElement")) {
					list.push(item);
				}
			}
		});

		$array.each(keys, (key) => {
			this._updateGroup(groups[key], members[key]);
		});
	}

	// Gives a group one TAB stop: the member focused last, or the first one
	// that can take focus. The rest are reached with arrow keys
	protected _updateGroup(group: string | number, items?: Sprite[]): void {
		if (!items) {
			items = this._tabindexes.filter((item) => item.get("focusableGroup") == group && item.getPrivate("focusElement"));
		}

		const canTab = $array.map(items, (item) => this._canTab(item));

		let stop: Sprite | undefined = this._groupStops[group];
		const stopIndex = stop ? items.indexOf(stop) : -1;
		if (this._groupNoStop[group]) {
			stop = undefined;
		}
		else if (stopIndex == -1 || (stop !== this._focusedSprite && (!canTab[stopIndex] || !this._groupStopKept[group]))) {
			const index = canTab.indexOf(true);
			stop = index == -1 ? undefined : items[index];
		}

		if (stop) {
			this._groupStops[group] = stop;
		}
		else {
			delete this._groupStops[group];
		}

		$array.each(items, (item, index) => {
			const dom = item.getPrivate("focusElement")!.dom;
			if (canTab[index] || item !== this._focusedSprite) {
				setAttr(dom, "tabindex", canTab[index] ? (item === stop ? "" + this.tabindex : "-1") : null);
			}
		});
	}

	public _updateCurrentFocus(): void {
		if (this._a11yD == true) {
			return;
		}

		if (this._focusedSprite) {
			this._decorateFocusElement(this._focusedSprite);
			this._positionFocusElement(this._focusedSprite);
		}
	}

	public _decorateFocusElement(target: Sprite, focusElement?: HTMLDivElement): void {

		if (this._a11yD == true) {
			return;
		}

		// Decorate with proper accessibility attributes
		if (!focusElement) {
			const element = target.getPrivate("focusElement");
			focusElement = element && element.dom;
		}

		if (!focusElement) {
			return;
		}

		// An element clicked to switch a state (`toggleKey`), e.g. a pie slice
		// pulling out. An image (or figure) cannot tell its state, so a
		// focusable one that toggles is a toggle button to assistive technology
		const toggleKey = target.get("toggleKey");
		const toggles = toggleKey == "active" || toggleKey == "disabled";
		let role = target.get("role");
		// A focusable element with no role of its own (e.g. a shape made
		// focusable by hand) is read as an image, the role every screen reader
		// reads the name of; without one its name isn't allowed or not read
		if (!role && target.get("focusable")) {
			role = "img";
		}
		if ((role == "img" || role == "figure") && toggles && target.get("focusable")) {
			role = "button";
		}

		setAttr(focusElement, "role", role || null);

		// Expanded / collapsed wins over pressed for the same toggle
		const ariaExpanded = target.get("ariaExpanded");
		setAttr(focusElement, "aria-expanded", ariaExpanded != null ? (ariaExpanded ? "true" : "false") : null);

		let pressed: string | null = null;
		if (role == "button" && toggles && ariaExpanded == null) {
			pressed = (toggleKey == "disabled" ? !target.get("disabled") : !!target.get("active")) ? "true" : "false";
		}
		setAttr(focusElement, "aria-pressed", pressed);
		setAttr(focusElement, "aria-disabled", target.getPrivate("focusDisabled") ? "true" : null);

		const ariaLabel = target.get("ariaLabel");
		// values being animated are read as they will be, not in between
		const labelText = ariaLabel ? populateString(target, ariaLabel, true) : "";

		// A readable element with no role is plain text: its label is the text
		// of a visually hidden child (`aria-label` is not read on plain elements)
		let readerText = <HTMLElement | null>focusElement.querySelector(".am5-reader-text");
		if (!role && !target.get("focusable")) {
			setAttr(focusElement, "aria-label", null);
			if (!readerText) {
				readerText = document.createElement("span");
				readerText.className = "am5-reader-text";
				const style = readerText.style;
				style.position = "absolute";
				style.width = "1px";
				style.height = "1px";
				style.overflow = "hidden";
				style.whiteSpace = "nowrap";
				style.clip = "rect(1px, 1px, 1px, 1px)";
				focusElement.insertBefore(readerText, focusElement.firstChild);
			}
			if (readerText.textContent !== labelText) {
				readerText.textContent = labelText;
			}
		}
		else {
			if (readerText) {
				focusElement.removeChild(readerText);
			}
			setAttr(focusElement, "aria-label", labelText || null);
		}

		setAttr(focusElement, "aria-live", target.get("ariaLive") || null);

		const ariaChecked = target.get("ariaChecked");
		setAttr(focusElement, "aria-checked", ariaChecked != null && role && ["checkbox", "option", "radio", "menuitemcheckbox", "menuitemradio", "treeitem"].indexOf(role) !== -1 ? (ariaChecked ? "true" : "false") : null);

		const ariaCurrent = target.get("ariaCurrent");
		setAttr(focusElement, "aria-current", ariaCurrent != null ? ariaCurrent : null);

		const ariaSelected = target.get("ariaSelected");
		setAttr(focusElement, "aria-selected", ariaSelected != null && role && ["gridcell", "option", "row", "tab", "columnheader", "rowheader", "treeitem"].indexOf(role) !== -1 ? (ariaSelected ? "true" : "false") : null);

		setAttr(focusElement, "aria-orientation", target.get("ariaOrientation") || null);
		setAttr(focusElement, "aria-valuenow", target.get("ariaValueNow") || null);
		setAttr(focusElement, "aria-valuemin", target.get("ariaValueMin") || null);
		setAttr(focusElement, "aria-valuemax", target.get("ariaValueMax") || null);
		setAttr(focusElement, "aria-valuetext", target.get("ariaValueText") || null);
		setAttr(focusElement, "aria-controls", target.get("ariaControls") || null);

		// A description is text in a hidden element the focus element points to:
		// screen readers read it after the label, but not on its own
		const ariaDescription = target.get("ariaDescription");
		let description = <HTMLElement | null>focusElement.querySelector(".am5-description");
		if (ariaDescription) {
			if (!description) {
				description = document.createElement("div");
				description.className = "am5-description";
				description.id = "am5-description-" + target.uid;
				description.hidden = true;
				focusElement.appendChild(description);
			}
			const text = populateString(target, ariaDescription, true);
			if (description.textContent !== text) {
				description.textContent = text;
			}
			setAttr(focusElement, "aria-describedby", description.id);
		}
		else if (description) {
			focusElement.removeChild(description);
			setAttr(focusElement, "aria-describedby", null);
		}

		this._updateFocusStatus(target, focusElement);
	}

	// Whether the element can take focus and is a TAB stop: `tabindex` and
	// `aria-hidden`. Cheaper than decorating it in full, so it is all that is
	// done when only its size, position or visibility changed
	protected _updateFocusStatus(target: Sprite, focusElement: HTMLDivElement): void {
		const group = target.get("focusableGroup");
		const canFocus = this._canFocus(target);
		const canTab = this._canTab(target, canFocus);
		if (canFocus) {
			if (!canTab) {
				// Out of view: readable, not a TAB stop
				setAttr(focusElement, "tabindex", null);
			}
			else if (group) {
				// One TAB stop per group: which member it is is decided per group
				setAttr(focusElement, "tabindex", this._groupStops[group] === target ? "" + this.tabindex : "-1");
			}
			else {
				setAttr(focusElement, "tabindex", "" + this.tabindex);
			}
			setAttr(focusElement, "aria-hidden", null);

			// A group with no TAB stop gets this one, as does a group whose stop
			// was not chosen and comes after it
			if (group && canTab && !this._groupNoStop[group]) {
				const stop = this._groupStops[group];
				if (!stop || (stop !== target && !this._groupStopKept[group] && this._tabindexRanks[target.uid] < this._tabindexRanks[stop.uid])) {
					this._invalidateGroup(group);
				}
			}
		}
		else if (this._focusedSprite !== target) {
			setAttr(focusElement, "tabindex", null);
			setAttr(focusElement, "aria-hidden", "true");
		}
		// The focused element keeps focus while it can't take it, e.g. a Gantt
		// task moved off the plot until the axis catches up: without a tabindex
		// the browser would drop focus to the page

		// The group's TAB stop can no longer take focus: it moves to another member
		if (group && this._groupStops[group] === target && !canTab) {
			this._invalidateGroup(group);
		}
	}

	// Interface colors replaced while a forced colors mode is on, to put back
	protected _forcedColorsBackup?: { [key: string]: { value: any, user: boolean } };

	protected _initForcedColors(): void {
		const query = getForcedColorsQuery();
		if (query && query.addEventListener) {
			// High Contrast switched on or off, or its theme changed
			this._disposers.push($utils.addEventListener(query, "change", () => {
				systemColors = undefined;
				this._updateForcedColors();
			}));
		}
		this._updateForcedColors();
	}

	/**
	 * Applies or removes system interface colors for a forced colors mode.
	 *
	 * @ignore
	 */
	public _updateForcedColors(): void {
		const query = getForcedColorsQuery();
		const active = query && query.matches && this._settings.forcedColors !== false;
		const ic = this.interfaceColors;

		if (active) {
			const colors = getSystemColors();
			if (!this._forcedColorsBackup) {
				const backup: { [key: string]: { value: any, user: boolean } } = {};
				$object.each(FORCED_COLORS, (key) => {
					backup[key] = { value: ic.get(key), user: ic.isUserSetting(key) && !ic.isComputedSetting(key) };
				});
				this._forcedColorsBackup = backup;
			}
			$object.each(FORCED_COLORS, (key, name) => {
				ic._setC(key, colors[name!]);
			});
		}
		else if (this._forcedColorsBackup) {
			// Back to the colors set in code, or else the themes'
			const backup = this._forcedColorsBackup;
			this._forcedColorsBackup = undefined;
			$object.each(backup, (key, saved) => {
				if (saved.user) {
					ic.set(<any>key, saved.value);
				}
				else {
					ic.remove(<any>key);
				}
			});
			ic._applyThemes();
		}
	}

	// Ends a drag made with arrow keys, as releasing the mouse would
	protected _stopKeyboardDrag(target: Sprite): void {
		const dragPoint = this._keyboardDragPoint || { x: 0, y: 0 };
		const upEvent = this._renderer.getEvent(new MouseEvent("mouseup", {
			clientX: dragPoint.x,
			clientY: dragPoint.y
		}));

		if (target.events.isEnabled("globalpointerup")) {
			target.events.dispatch("globalpointerup", {
				type: "globalpointerup",
				originalEvent: upEvent.event,
				point: upEvent.point,
				simulated: true,
				target: target
			});
		}
		this._keyboardDragPoint = undefined;
	}

	// A zero-sized element can't be focused. One with no width or height (an
	// unmeasured pie slice or map polygon, or a radar column whose percent size
	// is of a parent with none) is measured by what it draws instead.
	// The focused element keeps focus even if it loses its size (a polygon
	// turning to the far side of a globe), until focus moves on
	public _hasFocusSize(target: Sprite): boolean {
		if (this._focusedSprite === target || target.height() || target.width()) {
			return true;
		}
		const bounds = target._focusBounds();
		return bounds.right > bounds.left || bounds.bottom > bounds.top;
	}

	// Creates the element's focus element. The caller puts it in the container
	public _makeFocusElement(target: Sprite): void {

		if (target.getPrivate("focusElement") || this._a11yD == true) {
			return;
		}

		// Init
		const focusElement = document.createElement("div");
		if (target.get("role") != "tooltip" && target.get("focusable")) {
			focusElement.tabIndex = this.tabindex;
		}
		focusElement.style.position = "absolute";
		$utils.setInteractive(focusElement, false);

		const disposers: Array<IDisposer> = [];

		target.setPrivate("focusElement", {
			dom: focusElement,
			disposers,
		});

		this._focusElementSprites.set(focusElement, target);

		this._decorateFocusElement(target);
		delete this._dirtyA11y[target.uid];

		disposers.push($utils.addEventListener(focusElement, "focus", (ev: FocusEvent) => {
			this._handleFocus(ev);
		}));

		disposers.push($utils.addEventListener(focusElement, "blur", (ev: FocusEvent) => {
			this._handleBlur(ev);
		}));
	}

	public _removeFocusElement(target: Sprite): void {
		if (this._a11yD == true) {
			return;
		}

		this._removeTabindex(target);
		delete this._dirtyA11y[target.uid];
		if (target.isDisposed()) {
			delete this._tabindexRanks[target.uid];
		}
		const focusElement = target.getPrivate("focusElement");
		if (focusElement) {
			const container = this._focusElementContainer!;
			if (focusElement.dom.parentNode === container) {
				container.removeChild(focusElement.dom);
			}
			this._focusElementSprites.delete(focusElement.dom);
			$array.each(focusElement.disposers, (x) => {
				x.dispose();
			});
			target.removePrivate("focusElement");

			// Its group needs a new TAB stop
			const group = target.get("focusableGroup");
			if (group) {
				if (this._groupStops[group] === target) {
					delete this._groupStops[group];
				}
				this._invalidateGroup(group);
			}
		}
	}

	public _hideFocusElement(target: Sprite): void {
		if (this._a11yD == true) {
			return;
		}

		const focusElement = target.getPrivate("focusElement")!;
		focusElement.dom.style.display = "none";
	}

	protected _positionFocusElement(target: Sprite): void {
		if (this._a11yD == true || target == undefined) {
			return;
		}
		this._focusElementContainer!.scrollTop = 0;

		const bounds = target._focusBounds();

		let width = bounds.right == bounds.left ? target.width() : bounds.right - bounds.left;
		let height = bounds.top == bounds.bottom ? target.height() : bounds.bottom - bounds.top;

		const padding = this._settings.focusPadding !== undefined ? this._settings.focusPadding : 2;

		let x = bounds.left - padding;
		let y = bounds.top - padding;

		if (width < 0) {
			x += width;
			width = Math.abs(width);
		}

		if (height < 0) {
			y += height;
			height = Math.abs(height);
		}

		const focusElement = target.getPrivate("focusElement")!.dom;
		focusElement.style.top = y + "px";
		focusElement.style.left = x + "px";
		focusElement.style.width = (width + padding * 2) + "px";
		focusElement.style.height = (height + padding * 2) + "px";

	}

	protected _getSpriteByFocusElement(target: any): Sprite | undefined {
		return target ? this._focusElementSprites.get(target) : undefined;
	}

	protected _handleFocus(ev: FocusEvent): void {
		if (this._a11yD == true) {
			return;
		}

		// Get element
		//const focused = this._tabindexes[index];
		const focused = this._getSpriteByFocusElement(ev.target);

		if (!focused) {
			return;
		}

		// Jump over hidden elements
		if (!focused.isVisibleDeep()) {
			this._focusNext(<HTMLDivElement>ev.target, this._isShift ? -1 : 1);
			return;
		}

		// Size and position
		this._positionFocusElement(focused);

		this._focusedSprite = focused;

		// The label may use values that changed since it was last filled in
		this._decorateFocusElement(focused);

		if (focused.events.isEnabled("focus")) {
			focused.events.dispatch("focus", {
				type: "focus",
				originalEvent: ev,
				target: focused
			});
		}

		// The focused member is its group's TAB stop, so TAB and SHIFT+TAB leave
		// the group from here and come back to it
		const group = focused.get("focusableGroup");
		if (group) {
			this._groupStops[group] = focused;
			this._groupStopKept[group] = true;
			delete this._groupNoStop[group];
			this._updateGroup(group);
		}
	}

	protected _focusNext(el: HTMLDivElement, direction: 1 | -1, group?: string | number): void {
		if (this._a11yD == true) {
			return;
		}

		const rootNode = this.dom.getRootNode ? this.dom.getRootNode() : null;
		let queryRoot: Document | ShadowRoot = this.dom.ownerDocument || document;

		if (rootNode) {
			if (typeof ShadowRoot !== "undefined" && rootNode instanceof ShadowRoot) {
				queryRoot = rootNode;
			}
			else if (rootNode instanceof Document) {
				queryRoot = rootNode;
			}
		}

		const focusableElements = Array.from(queryRoot.querySelectorAll([
			'a[href]',
			'area[href]',
			'button:not([disabled])',
			'details',
			'input:not([disabled])',
			'iframe:not([disabled])',
			'select:not([disabled])',
			'textarea:not([disabled])',
			'[contentEditable=""]',
			'[contentEditable="true"]',
			'[contentEditable="TRUE"]',
			'[tabindex]:not([tabindex^="-"])',
			//':not([disabled])'
		].join(',')));

		let index = focusableElements.indexOf(el) + direction;

		if (index < 0) {
			index = focusableElements.length - 1;
		}
		else if (index >= focusableElements.length) {
			index = 0;
		}

		const targetElement = (<HTMLDivElement>focusableElements[index]);

		if (group && direction == -1) {
			const target = this._getSpriteByFocusElement(targetElement);
			if (target && target.get("focusableGroup") == group) {
				this._focusNext(targetElement, direction);
				return;
			}
		}

		if (targetElement) {
			targetElement.focus();
		}
	}

	protected _handleBlur(ev: FocusEvent): void {
		if (this._a11yD == true) {
			return;
		}

		const focused = this._focusedSprite;
		if (focused && !focused.isDisposed() && focused.events.isEnabled("blur")) {
			focused.events.dispatch("blur", {
				type: "blur",
				originalEvent: ev,
				target: focused
			});
		}

		this._focusedSprite = undefined;

		// It may have lost its size while focused
		if (focused && !focused.isDisposed() && focused.getPrivate("focusElement")) {
			this._decorateFocusElement(focused);
		}
	}

	/**
	 * @ignore
	 */
	public updateTooltip(target: Text): void {
		if (this._a11yD == true) {
			return;
		}

		const text = $utils.stripFormatTags($utils.stripTags(target._getText()));
		let tooltipElement = target.getPrivate("tooltipElement");
		if (target.get("role") == "tooltip" && text != "") {
			if (!tooltipElement) {
				tooltipElement = this._makeTooltipElement(target);
			}
			if (tooltipElement.innerHTML != text) {
				tooltipElement.innerHTML = text!;
			}
			this._updateTooltipElementHidden(target);
		}
		else if (tooltipElement) {
			tooltipElement.remove();
			target.removePrivate("tooltipElement");
		}
	}

	/**
	 * Hides a tooltip's text from screen readers while the tooltip is hidden,
	 * so reading through the page doesn't find the last one shown.
	 *
	 * @ignore
	 */
	public _updateTooltipElementHidden(target: Text): void {
		const tooltipElement = target.getPrivate("tooltipElement");
		if (tooltipElement) {
			// hidden with `hide()` (a tooltip fading out) or not visible
			let hidden = !target.isVisibleDeep();
			let sprite: Sprite | undefined = target;
			while (sprite && !hidden) {
				hidden = sprite.isHidden();
				sprite = sprite.parent;
			}
			tooltipElement.setAttribute("aria-hidden", hidden ? "true" : "false");
		}
	}

	public _makeTooltipElement(target: Text): HTMLDivElement {
		const container = this._tooltipElementContainer!;
		const tooltipElement = document.createElement("div");
		tooltipElement.style.position = "absolute";
		tooltipElement.style.width = "1px";
		tooltipElement.style.height = "1px";
		tooltipElement.style.overflow = "hidden";
		tooltipElement.style.clip = "rect(1px, 1px, 1px, 1px)";

		$utils.setInteractive(tooltipElement, false);

		this._decorateFocusElement(target, tooltipElement);
		container.append(tooltipElement);
		target.setPrivate("tooltipElement", tooltipElement);

		return tooltipElement;
	}

	public _removeTooltipElement(target: Text): void {
		if (this._a11yD == true) {
			return;
		}
		const tooltipElement = target.getPrivate("tooltipElement");
		if (tooltipElement) {
			const parent = tooltipElement.parentElement;
			if (parent) {
				parent.removeChild(tooltipElement);
			}
		}
	}

	/**
	 * The element's focus element is updated before the next frame: in full, or
	 * with `statusOnly` only whether it can take focus and is a TAB stop (for a
	 * change of size, position or visibility).
	 *
	 * @ignore
	 */
	public _invalidateAccessibility(target: Sprite, statusOnly?: boolean): void {
		if (this._a11yD == true) {
			return;
		}
		if (this._hasFocusElement(target)) {
			const dirty = this._dirtyA11y[target.uid];
			if (dirty) {
				dirty.full = dirty.full || !statusOnly;
			}
			else {
				this._dirtyA11y[target.uid] = { target, full: !statusOnly };
			}
			this._focusElementDirty = true;
		}
		else if (target.getPrivate("focusElement")) {
			this._removeFocusElement(target);
			this._focusElementDirty = true;
		}
	}

	/**
	 * Focusable elements inside `container` are checked again before the next
	 * frame, as it was shown or hidden.
	 *
	 * @ignore
	 */
	public _invalidateFocusInside(container: Sprite): void {
		if (this._a11yD == true) {
			return;
		}
		// Collected for the frame: many containers can change at once (bullets
		// hidden on zoom), and the focusable elements are walked through once
		this._dirtyFocusContainers[container.uid] = true;
		this._focusElementDirty = true;
	}

	protected _dirtyFocusContainers: { [uid: number]: boolean } = {};

	protected _updateDirtyA11y(): void {
		const containers = this._dirtyFocusContainers;
		if (Object.keys(containers).length) {
			this._dirtyFocusContainers = {};
			$array.each(this._tabindexes, (item) => {
				let parent = item.parent;
				while (parent) {
					if (containers[parent.uid]) {
						this._invalidateAccessibility(item, true);
						break;
					}
					parent = parent.parent;
				}
			});
		}

		const dirty = this._dirtyA11y;
		this._dirtyA11y = {};
		$object.each(dirty, (_uid, entry) => {
			const target = entry.target;
			if (target.isDisposed()) {
				return;
			}
			const focusElement = target.getPrivate("focusElement");
			if (focusElement) {
				if (entry.full) {
					this._decorateFocusElement(target);
				}
				else {
					this._updateFocusStatus(target, focusElement.dom);
				}
			}
		});
	}

	/**
	 * Returns `true` if `target` is currently focused.
	 *
	 * @param   target  Target
	 * @return          Focused?
	 */
	public focused(target: Sprite): boolean {
		return this._focusedSprite === target;
	}

	/**
	 * Makes `target` the TAB stop of `group`, if it can take focus. With no
	 * `target`, the group has no TAB stop until one of its members is focused.
	 *
	 * @ignore
	 */
	public _setGroupStop(group: string | number, target?: Sprite): void {
		if (target) {
			if (this._groupStops[group] === target && !this._groupNoStop[group]) {
				return;
			}
			this._groupStops[group] = target;
			this._groupStopKept[group] = true;
			delete this._groupNoStop[group];
		}
		else {
			if (this._groupNoStop[group]) {
				return;
			}
			this._groupNoStop[group] = true;
		}
		// now, as a TAB right after the focus that set it must find it
		this._updateTabindexes();
		this._updateGroup(group);
	}

	/**
	 * Moves keyboard focus to `target` after the next frame, once its focus
	 * element can take it.
	 *
	 * @ignore
	 */
	public _focusSprite(target: Sprite): void {
		this.events.once("frameended", () => {
			const focusElement = target.getPrivate("focusElement");
			if (focusElement && !target.isDisposed()) {
				$utils.focus(focusElement.dom);
			}
		});
	}

	protected _readerContainer: HTMLDivElement | undefined;

	/**
	 * A container for content only screen readers get, such as data tables:
	 * hidden from view but not from them. `undefined` with `accessible: false`.
	 *
	 * @ignore
	 */
	public _getReaderContainer(): HTMLDivElement | undefined {
		if (this._a11yD == true) {
			return;
		}
		if (!this._readerContainer) {
			const container = document.createElement("div");
			container.className = "am5-reader-container";
			const style = container.style;
			style.position = "absolute";
			style.width = "1px";
			style.height = "1px";
			style.overflow = "hidden";
			style.clip = "rect(1px, 1px, 1px, 1px)";
			style.whiteSpace = "nowrap";
			$utils.setInteractive(container, false);
			this._inner.appendChild(container);
			this._readerContainer = container;
		}
		return this._readerContainer;
	}

	/**
	 * Moves `point` onto the part of `target` that is in view: inside the root
	 * and any container above it that masks its content. Left as it is if no
	 * part of `target` is in view.
	 *
	 * @ignore
	 */
	public _pointInView(target: Sprite, point: IPoint): IPoint {
		const bounds = target._focusBounds();
		let left = Math.max(bounds.left, 0);
		let top = Math.max(bounds.top, 0);
		let right = Math.min(bounds.right, this.width());
		let bottom = Math.min(bounds.bottom, this.height());

		let parent = target.parent;
		while (parent) {
			if (parent.get("maskContent") || parent.get("mask")) {
				const p0 = parent.toGlobal({ x: 0, y: 0 });
				const p1 = parent.toGlobal({ x: parent.width(), y: parent.height() });
				left = Math.max(left, Math.min(p0.x, p1.x));
				top = Math.max(top, Math.min(p0.y, p1.y));
				right = Math.min(right, Math.max(p0.x, p1.x));
				bottom = Math.min(bottom, Math.max(p0.y, p1.y));
			}
			parent = parent.parent;
		}

		if (right < left || bottom < top) {
			return point;
		}
		return {
			x: Math.max(left, Math.min(right, point.x)),
			y: Math.max(top, Math.min(bottom, point.y))
		};
	}

	/**
	 * Converts a point from viewport coordinates, such as a pointer event's
	 * `clientX` and `clientY`, to coordinates within the root.
	 *
	 * @param   point  Viewport point
	 * @return         Root point
	 */
	public documentPointToRoot(point: IPoint): IPoint {
		const rect = this._getRealSize();
		const size = this._getCalculatedSize(rect);

		const scaleWidth = size.width / rect.width;
		const scaleHeight = size.height / rect.height;

		return {
			x: (point.x - rect.left) * scaleWidth,
			y: (point.y - rect.top) * scaleHeight,
		};
	}

	/**
	 * Converts a point from coordinates within the root to viewport
	 * coordinates, as in a pointer event's `clientX` and `clientY`.
	 *
	 * @param   point  Root point
	 * @return         Viewport point
	 */
	public rootPointToDocument(point: IPoint): IPoint {
		const rect = this._getRealSize();
		const size = this._getCalculatedSize(rect);

		const scaleWidth = size.width / rect.width;
		const scaleHeight = size.height / rect.height;

		return {
			x: (point.x / scaleWidth) + rect.left,
			y: (point.y / scaleHeight) + rect.top
		};
	}

	/**
	 * @ignore
	 */
	public addDisposer<T extends IDisposer>(disposer: T): T {
		this._disposers.push(disposer);
		return disposer;
	}

	protected _updateComputedStyles(): boolean {
		// Live: it follows the element's style, so it is read once
		if (!this._styles) {
			this._styles = window.getComputedStyle(this.dom);
		}
		const styles = this._styles;
		const fonts = [styles.fontFamily, styles.fontSize, styles.fontStyle, styles.fontWeight, styles.fontVariant, styles.fontStretch].join();

		if (fonts !== this._fontHash) {
			this._fontHash = fonts;
			return true;
		}
		return false;
	}

	protected _checkComputedStyles(): void {
		if (this._updateComputedStyles()) {
			this._invalidateLabelBounds(this.container);
		}
	}

	protected _invalidateLabelBounds(target: Sprite, remeasure?: boolean): void {
		if (target instanceof Container) {
			target.children.each((child) => {
				this._invalidateLabelBounds(child, remeasure);
			});
		}
		else if (target instanceof Text) {
			target.markDirtyBounds();
			if (remeasure) {
				target._display.invalidateBounds();
				target.markDirty();
			}
		}
	}

	/**
	 * To all the clever heads out there. Yes, we did not make any attempts to
	 * scramble this.
	 *
	 * This is a part of a tool meant for our users to manage their commercial
	 * licenses for removal of amCharts branding from charts.
	 *
	 * The only legit way to do so is to purchase a commercial license for amCharts:
	 * https://www.amcharts.com/pricing/
	 *
	 * Removing or altering this code, or disabling amCharts branding in any other
	 * way is against the license and thus illegal.
	 */
	protected _hasLicense(): boolean {
		for (let i = 0; i < registry.licenses.length; i++) {
			if (registry.licenses[i].match(/^AM5C.{5,}/i)) {
				return true;
			}
		}
		return false;
	}

	/**
	 * @ignore
	 */
	public _licenseApplied(): void {
		// charts with a licence of their own call _brandingLicensed()
	}

	/**
	 * @ignore
	 */
	public get debugGhostView(): boolean {
		return this._renderer.debugGhostView;
	}

	/**
	 * @ignore
	 */
	public set debugGhostView(value: boolean) {
		this._renderer.debugGhostView = value;
	}

	/**
	 * Makes touch gestures such as zoom and pan work only after a tap on the
	 * chart, so the page can still be scrolled over it.
	 *
	 * The same as setting `touchGestures` to `"tap"`; `false` sets it back to
	 * `"chart"`, or to `"auto"` with the ResponsiveMax theme (an `"auto"` is
	 * left as it is).
	 *
	 * @see {@link https://docs.amcharts.com/v5/getting-started/root-element/#touch-related-options} for more info
	 * @default false
	 * @since 5.2.9
	 * @param  value  Needs a tap to activate touch functions
	 */
	public set tapToActivate(value: boolean) {
		if (value) {
			if (!this._renderer.tapToActivate) {
				// what turning it off goes back to: a value set in code, or else the themes' choice
				this._touchGesturesBefore = this._touchGesturesSet ? this._renderer.touchGestures : undefined;
			}
			this._touchGesturesSet = true;
			this._renderer.tapToActivate = true;
		}
		else if (this._renderer.tapToActivate) {
			this._renderer.tapToActivate = false;
			const before = this._touchGesturesBefore;
			this._touchGesturesBefore = undefined;
			if (before) {
				this._renderer.touchGestures = before;
			}
			else {
				this._touchGesturesSet = false;
				this._themeTouchGestures();
			}
		}
	}

	/**
	 * Who gets a touch gesture that starts on the chart, the chart or the page
	 * around it:
	 *
	 * * `"chart"`: the chart, wherever it drags, pans, zooms or selects.
	 * * `"tap"`: the page, until the chart is tapped; then the chart, until
	 *   `tapToActivateTimeout` passes without a touch (as `tapToActivate`).
	 * * `"auto"`: a vertical swipe scrolls the page. A swipe that starts
	 *   sideways, and any made with two fingers, goes to the chart, which
	 *   then follows it both ways: a chart that pans vertically, a map or a
	 *   globe also moves or turns up and down. Scrollbar grips, buttons and
	 *   other things that are dragged, drawing on a stock chart, a cursor
	 *   selecting only up and down and a radar chart take any swipe that
	 *   starts on them.
	 *
	 * With `"tap"` and `"auto"`, a swipe the page scrolls with does not move
	 * the chart.
	 *
	 * The ResponsiveMax theme, set on the root with `setThemes()`, sets
	 * `"auto"`, unless `touchGestures` or `tapToActivate` is set in code.
	 * Turning `tapToActivate` off again goes back to what was there before it:
	 * the value set in code, or else the theme's choice.
	 *
	 * @default "chart"
	 * @since 5.23.0
	 * @param  value  Who gets touch gestures
	 */
	public set touchGestures(value: TouchGestures) {
		this._touchGesturesSet = true;
		this._renderer.touchGestures = value;
	}

	// set in code, so the themes' choice is not used
	protected _touchGesturesSet: boolean = false;
	protected _touchGesturesBefore?: TouchGestures;

	// the themes' choice of touchGestures while code has not set it
	protected _themeTouchGestures(): void {
		if (!this._touchGesturesSet) {
			let value: TouchGestures = "chart";
			$array.each(this._rootContainer.get("themes", []), (theme) => {
				if (theme._touchGestures) {
					value = theme._touchGestures;
				}
			});
			if (this._renderer.touchGestures != value) {
				this._renderer.touchGestures = value;
			}
		}
	}

	/**
	 * @return Who gets touch gestures
	 */
	public get touchGestures(): TouchGestures {
		return this._renderer.touchGestures;
	}

	/**
	 * @return Needs a tap to activate touch functions
	 */
	public get tapToActivate(): boolean {
		return this._renderer.tapToActivate;
	}

	/**
	 * How long in milliseconds the chart stays active after the last touch,
	 * with `tapToActivate`, before handing touch gestures back to the page.
	 * `0` keeps it active until a tap outside the chart.
	 *
	 * @see {@link https://docs.amcharts.com/v5/getting-started/root-element/#touch-related-options} for more info
	 * @default 3000
	 * @since 5.2.9
	 * @param  value  Timeout
	 */
	public set tapToActivateTimeout(value: number) {
		this._renderer.tapToActivateTimeout = value;
	}

	/**
	 * @return Timeout
	 */
	public get tapToActivateTimeout(): number {
		return this._renderer.tapToActivateTimeout;
	}

	public _makeHTMLElement(target: Container): HTMLDivElement {

		// Get container
		const container = this._htmlElementContainer!;

		// Init
		const htmlElement = document.createElement("div");
		target.setPrivate("htmlElement", htmlElement);

		// Should we put this into a wrapper?
		let needWrapper: Boolean = false;
		let wrapperTarget: Container;
		target._walkParents((parent) => {
			if ((parent as Container).get("verticalScrollbar")) {
				needWrapper = true;
				wrapperTarget = parent as Container;
				return false;
			}
		});
		let htmlElementWrapper: HTMLDivElement;

		if (needWrapper) {
			htmlElementWrapper = document.createElement("div");
			target.setPrivate("htmlElementWrapper", htmlElementWrapper);
			target.setPrivate("wrapperContainer", wrapperTarget!);

			htmlElementWrapper.style.position = "absolute";
			htmlElementWrapper.style.overflow = "hidden";
			htmlElementWrapper.style.boxSizing = "border-box";
			htmlElementWrapper.style.top = "0px";
			htmlElementWrapper.style.left = "0px";
			htmlElementWrapper.style.width = "100%";
			htmlElementWrapper.style.height = "100%";

			wrapperTarget!.events.on("boundschanged", () => {
				this._positionHTMLElement(target);
			});
		}

		//htmlElement.tabIndex = this.tabindex;
		htmlElement.style.position = "absolute";
		htmlElement.style.overflow = "auto";
		htmlElement.style.boxSizing = "border-box";
		$utils.setInteractive(htmlElement, target.get("interactive", false));

		// Translate events
		if (target.events.isEnabled("click")) {
			$utils.setInteractive(htmlElement, true);
			this._disposers.push($utils.addEventListener<PointerEvent | MouseEvent>(htmlElement, "click", (ev: IPointerEvent) => {
				const downEvent = this._renderer.getEvent(ev);
				target.events.dispatch("click", {
					type: "click",
					originalEvent: downEvent.event,
					point: downEvent.point,
					simulated: false,
					target: target
				});
			}));
		}

		this._positionHTMLElement(target);

		if (needWrapper) {
			htmlElementWrapper!.append(htmlElement);
			container.append(htmlElementWrapper!);
		}
		else {
			container.append(htmlElement);
		}

		$array.pushOne(this._htmlEnabledContainers, target);

		return htmlElement;
	}

	public _positionHTMLElements(): void {
		$array.each(this._htmlEnabledContainers, (target) => {
			this._positionHTMLElement(target);
		});
	}

	public _positionHTMLElement(target: Container): void {
		const htmlElementWrapper = target.getPrivate("htmlElementWrapper");
		if (htmlElementWrapper) {
			const wrapperTarget = target.getPrivate("wrapperContainer");
			if (wrapperTarget) {
				const bounds = wrapperTarget.globalBounds();
				htmlElementWrapper.style.clipPath = "rect(" + bounds.top + "px " + bounds.right + "px " + bounds.bottom + "px " + bounds.left + "px)";
			}
		}

		const htmlElement = target.getPrivate("htmlElement");
		if (htmlElement) {

			// hidden: nothing to place, and measuring it would force a page layout every frame
			if (!target.isVisibleDeep()) {
				if (htmlElement.style.display != "none") {
					htmlElement.style.display = "none";
				}
				return;
			}

			// Translate settings
			const visualSettings = [
				"paddingTop",
				"paddingRight",
				"paddingBottom",
				"paddingLeft",
				"minWidth",
				"minHeight",
				"maxWidth",
				"maxHeight"
			];
			$array.each(visualSettings, (setting: any) => {
				const value = target.get(setting);
				if (value) {
					htmlElement.style[setting] = value + "px";
				}
				else {
					htmlElement.style[setting] = "";
				}
			});

			const strtingSettings = [
				"fontFamily",
				"fontSize",
				"fontStyle",
				"fontWeight",
				"fontStyle",
				"fontVariant",
				"textDecoration"
			];
			$array.each(strtingSettings, (setting: any) => {
				const value = target.get(setting);
				if (value) {
					if (setting == "fontSize" && !$type.isString(value)) {
						htmlElement.style[setting] = value + "px";
					}
					else {
						htmlElement.style[setting] = value + "";
					}
				}
				else {
					htmlElement.style[setting] = "";
				}
			});

			// Init and reset scale / rotation
			const scale = target.compositeScale() || 1;
			const rotation = target.compositeRotation() || 0;
			htmlElement.style.transform = "";
			htmlElement.style.transformOrigin = "";

			// Deal with opacity
			const opacity = target.compositeOpacity();
			setTimeout(() => {
				htmlElement.style.opacity = opacity + "";
			}, 10);

			const visible = target.isVisibleDeep();
			if (visible) {
				htmlElement.style.display = "block";
			}

			// Deal with position
			// const bounds = target.globalBounds();
			// htmlElement.style.top = (bounds.top) + "px";
			// htmlElement.style.left = (bounds.left) + "px";
			let pos = {
				x: target.x() + target.get("dx", 0),
				y: target.y() + target.get("dy", 0)
			}
			if (target.parent) {
				pos = target.parent.toGlobal(pos)
			}
			htmlElement.style.top = pos.y + "px";
			htmlElement.style.left = pos.x + "px";

			// Use width/height if those are set
			const width = target.get("width");
			const height = target.get("height");

			let w: number = 0;
			let h: number = 0;

			if (width) {
				w = target.width();
			}

			if (height) {
				h = target.height();
			}


			if (!width || !height) {
				htmlElement.style.position = "fixed";
				htmlElement.style.width = "";
				htmlElement.style.height = "";
				const bbox = htmlElement.getBoundingClientRect();
				htmlElement.style.position = "absolute";
				if (!width) w = bbox.width;
				if (!height) h = bbox.height;

				let lw = w / scale;
				let lh = h / scale;

				let cx = target.get("centerX", 0);
				let cy = target.get("centerY", 0);

				let ll = 0;
				let lr = 0;
				let lt = 0;
				let lb = 0;

				if (cx instanceof Percent) {
					ll = -cx.value * lw;
					lr = (1 - cx.value) * lw;
				}
				else {
					ll = -cx;
					lr = lw - cx;
				}

				if (cy instanceof Percent) {
					lt = -cy.value * lh;
					lb = (1 - cy.value) * lh;
				}
				else {
					lt = -cy;
					lb = lh - cy;
				}

				target._localBounds = { left: ll, right: lr, top: lt, bottom: lb };

				let previousBounds = target._adjustedLocalBounds;
				let newBounds = target._display.getAdjustedBounds(target._localBounds);
				target._adjustedLocalBounds = newBounds;

				// compare each value of the bounds
				if (previousBounds.left !== newBounds.left || previousBounds.right !== newBounds.right || previousBounds.top !== newBounds.top || previousBounds.bottom !== newBounds.bottom) {
					target.markDirtyBounds();
				}
			}

			if (w > 0) {
				htmlElement.style.minWidth = (w) + "px";
			}
			if (h > 0) {
				htmlElement.style.minHeight = (h) + "px";
			}

			// Hide or show
			if (!visible || opacity == 0) {
				htmlElement.style.display = "none";
			}

			// Center position
			const x = target.get("centerX", 0);
			const originX = isPercent(x) ? (x as Percent).percent + "%" : x + "px";
			const y = target.get("centerY", 0);
			const originY = isPercent(y) ? (y as Percent).percent + "%" : y + "px";

			if (x || y) {
				htmlElement.style.transform = "translate(-" + originX + ", -" + originY + ")" + htmlElement.style.transform;
			}

			// Deal with scale
			if (scale != 1) {
				htmlElement.style.transform += "scale(" + scale + ")";
			}

			if (rotation != 0) {
				htmlElement.style.transform += " rotate(" + rotation + "deg)";
			}

			if (htmlElement.style.transform != "") {
				htmlElement.style.transformOrigin = originX + " " + originY;
				//htmlElement.style.transformOrigin = "0% 0%";
			}


		}
	}

	/**
	 * Sanitizes HTML content before it gets injected via `innerHTML`, unless
	 * sanitization is disabled via the `sanitizeHTML` setting.
	 *
	 * @ignore
	 */
	public _sanitizeHTML(html: string): string {
		return this._settings.sanitizeHTML ? $utils.sanitizeHTML(html) : html;
	}

	public _setHTMLContent(target: Container, html: string): void {
		let htmlElement = target.getPrivate("htmlElement");
		if (!htmlElement) {
			htmlElement = this._makeHTMLElement(target);
			if (!this.autoResize) {
				this.resize();
			}
		}
		const sanitized = this._sanitizeHTML(html);
		if (htmlElement.innerHTML != sanitized) {
			htmlElement.innerHTML = sanitized;
		}
	}

	public _removeHTMLContent(target: Container): void {
		const htmlElementWrapper = target.getPrivate("htmlElementWrapper");
		const htmlElement = target.getPrivate("htmlElement");
		if (htmlElementWrapper) {
			this._htmlElementContainer!.removeChild(htmlElementWrapper);
			target.removePrivate("htmlElement");
			target.removePrivate("htmlElementWrapper");
			target.removePrivate("wrapperContainer");
		}
		else if (htmlElement) {
			this._htmlElementContainer!.removeChild(htmlElement);
			target.removePrivate("htmlElement");
			target.removePrivate("wrapperContainer");
		}
		$array.remove(this._htmlEnabledContainers, target);
	}
}

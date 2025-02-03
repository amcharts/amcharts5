import type { IAnimation } from "./util/Animation";
import type { Entity } from "./util/Entity";
import type { Sprite } from "./render/Sprite";
import type { Theme } from "./Theme";
import type { IPoint } from "./util/IPoint";
import type { IRenderer, IPointerEvent } from "./render/backend/Renderer";
import type { Timezone } from "./util/Timezone";

import { AnimationState } from "./util/Animation";
import { Container } from "./render/Container";
import { Text } from "./render/Text";
import { HorizontalLayout } from "./render/HorizontalLayout";
import { VerticalLayout } from "./render/VerticalLayout";
import { GridLayout } from "./render/GridLayout";
import { IDisposer, Disposer } from "./util/Disposer";
import { ResizeSensor } from "./util/ResizeSensor";
import { InterfaceColors } from "./util/InterfaceColors";
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
import { p100, percent, isPercent, Percent } from "./util/Percent";
import { color } from "./util/Color";
import { populateString } from "./util/PopulateString";
import { registry } from "./Registry";

import * as $order from "./util/Order";
import * as $array from "./util/Array";
import * as $object from "./util/Object";
import * as $utils from "./util/Utils";
import * as $type from "./util/Type";


import en from "../../locales/en";


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
	framestarted: {
		timestamp: number;
	};
	frameended: {
		timestamp: number;
	};
}


export interface IRootSettings {

	/**
	 * Indicates whether chart should use "safe" resolution on some memory-limiting
	 * platforms such as Safari.
	 *
	 * @default true
	 */
	useSafeResolution?: boolean;

	/**
	 * Allows defining margins around chart area for tooltips to go outside the
	 * chart itself.
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
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/accessibility/#Accessibility_of_Root_element} for more info
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
	 * Should be used in conjuction with `focusable`.
	 *
	 * @since 5.3.17
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/accessibility/#Accessibility_of_Root_element} for more info
	 */
	ariaLabel?: string;

	/**
	 * Allows setting a "role" for the inner `<div>`.
	 *
	 * @since 5.3.17
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/accessibility/#Accessibility_of_Root_element} for more info
	 */
	role?: string;

	/**
	 * Allows for specifying a custom width / height for the chart.
	 *
	 * This function will be called automatically when the chart is resized.
	 */
	calculateSize?: (dimensions: DOMRect) => ISize;
}


// TODO implement Disposer
/**
 * Root element of the chart.
 *
 * @see {@link https://www.amcharts.com/docs/v5/getting-started/#Root_element} for more info
 */
export class Root implements IDisposer {

	/**
	 * A reference to original chart container (div element).
	 */
	public dom: HTMLElement;
	public _inner: HTMLElement;

	protected _settings: IRootSettings;
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

	/**
	 * Root's event dispatcher.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/events/} for more info
	 */
	public events: EventDispatcher<Events<this, IRootEvents>> = new EventDispatcher();

	/**
	 * @ignore
	 * @todo needs description
	 */
	public animationTime: number | null = null;

	private _animations: Array<IAnimation> = [];

	public _renderer: IRenderer;

	public _rootContainer!: Container;

	/**
	 * Main content container.
	 */
	public container!: Container;

	/**
	 * A [[Container]] used to display tooltips in.
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
	 * Locale used by the chart.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/locales/}
	 */
	public locale: ILocale = en;

	// Date-time related

	/**
	 * Use UTC when formatting date/time.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/formatters/formatting-dates/#utc-and-time-zones} for more info
	 */
	public utc: boolean = false;

	/**
	 * If set, will format date/time in specific time zone.
	 *
	 * The value should be named time zone, e.g.:
	 * `"America/Vancouver"`, `"Australia/Sydney"`, `"UTC"`.
	 *
	 * NOTE: Using time zone feature may noticeable affect performance of the
	 * chart, especially with large data sets, since every single date will need
	 * to be recalculated.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/getting-started/root-element/#time-zone} for more info
	 * @since 5.1.0
	 */
	public timezone?: Timezone;

	/**
	 * The maximum FPS that the Root will run at.
	 *
	 * If `undefined` it will run at the highest FPS.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/getting-started/root-element/#Performance} for more info
	 */
	public fps: number | undefined;

	/**
	 * Number formatter.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/formatters/formatting-numbers/} for more info
	 */
	public numberFormatter: NumberFormatter = NumberFormatter.new(this, {});

	/**
	 * Date/time formatter.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/formatters/formatting-dates/} for more info
	 */
	public dateFormatter: DateFormatter = DateFormatter.new(this, {});

	/**
	 * Duration formatter.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/formatters/formatting-dates/} for more info
	 */
	public durationFormatter: DurationFormatter = DurationFormatter.new(this, {});


	// Accessibility

	/**
	 * Global tab index for using for the whole chart
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/accessibility/} for more info
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
	protected _tooltipElementContainer: HTMLDivElement | undefined;
	protected _readerAlertElement: HTMLDivElement | undefined;

	public _logo?: Container;

	public _tooltipDiv: HTMLDivElement | undefined;

	/**
	 * Used for dynamically-created CSS and JavaScript with strict source policies.
	 */
	public nonce?: string;

	/**
	 * Special color set to be used for various controls.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/colors-gradients-and-patterns/#Interface_colors} for more info
	 */
	public interfaceColors: InterfaceColors;

	/**
	 * An instance of vertical layout object that can be used to set `layout` setting
	 * of a [[Container]].
	 *
	 * @default VerticalLayout.new()
	 */
	public verticalLayout: VerticalLayout = VerticalLayout.new(this, {});

	/**
	 * An instance of horizontal layout object that can be used to set `layout` setting
	 * of a [[Container]].
	 *
	 * @default HorizontalLayout.new()
	 */
	public horizontalLayout: VerticalLayout = HorizontalLayout.new(this, {});

	/**
	 * An instance of grid layout object that can be used to set `layout` setting
	 * of a [[Container]].
	 *
	 * @default VerticalLayout.new()
	 */
	public gridLayout: VerticalLayout = GridLayout.new(this, {});

	public _paused: boolean = false;

	/**
	 * Indicates whether chart should resized automatically when parent container
	 * width and/or height changes.
	 *
	 * If disabled (`autoResize = false`) you can make the chart resize manually
	 * by calling root element's `resize()` method.
	 */
	public autoResize: boolean = true;

	protected _fontHash: string = "";

	protected _isDisposed: boolean = false;
	protected _disposers: Array<IDisposer> = [];

	protected _resizeSensorDisposer?: IDisposer;

	public _tooltips: Array<Tooltip> = [];

	protected _htmlElementContainer: HTMLDivElement | undefined;
	protected _htmlEnabledContainers: Container[] = [];

	/**
	 * Entities that have their `id` setting set.
	 *
	 * @since 5.11.0
	 */
	public entitiesById: { [index: string]: any } = {};

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
		}

		let resolution;

		if (settings.useSafeResolution) {
			resolution = $utils.getSafeResolution();
		}

		this._renderer = new CanvasRenderer(resolution);

		let dom: HTMLElement | null;

		if (id instanceof HTMLElement) {
			dom = id;
		}
		else {
			dom = document.getElementById(id);
		}

		$array.each(registry.rootElements, (root) => {
			if (root.dom === dom) {
				throw new Error("You cannot have multiple Roots on the same DOM node");
			}
		});

		this.interfaceColors = InterfaceColors.new(this, {});

		if (dom === null) {
			throw new Error("Could not find HTML element with id `" + id + "`");
		}

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


	public static new(id: string | HTMLElement, settings?: IRootSettings): Root {
		const root = new Root(id, settings, true);
		root._init();
		return root;
	}

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
			this._initResizeSensor();
			this.resize();
		}

	}


	protected _handleLogo(): void {
		if (this._logo) {
			const w = this.dom.offsetWidth;
			const h = this.dom.offsetHeight;
			if ((w <= 150) || (h <= 60)) {
				this._logo.hide();
			}
			else {
				this._logo.show();
			}
		}
	}

	public _showBranding(): void {
		if (!this._logo) {
			const logo = this.tooltipContainer.children.push(Container.new(this, {
				interactive: true,
				interactiveChildren: false,
				position: "absolute",
				setStateOnChildren: true,
				paddingTop: 9,
				paddingRight: 9,
				paddingBottom: 9,
				paddingLeft: 9,
				scale: .6,
				y: percent(100),
				centerY: p100,
				tooltipText: "Created using amCharts 5",
				tooltipX: p100,
				cursorOverStyle: "pointer",
				background: Rectangle.new(this, {
					fill: color(0x474758),
					fillOpacity: 0,
					tooltipY: 5
				})
			}));

			const tooltip = Tooltip.new(this, {
				pointerOrientation: "horizontal",
				paddingTop: 4,
				paddingRight: 7,
				paddingBottom: 4,
				paddingLeft: 7
			});
			tooltip.label.setAll({
				fontSize: 12
			});
			tooltip.get("background")!.setAll({
				fill: this.interfaceColors.get("background"),
				stroke: this.interfaceColors.get("grid"),
				strokeOpacity: 0.3
			})
			logo.set("tooltip", tooltip);

			logo.events.on("click", () => {
				window.open("https://www.amcharts.com/", "_blank");
			});

			logo.states.create("hover", {});

			const m = logo.children.push(Graphics.new(this, {
				stroke: color(0xcccccc),
				strokeWidth: 3,
				svgPath: "M5 25 L13 25h13.6c3.4 0 6 0 10.3-4.3s5.2-12 8.6-12c3.4 0 4.3 8.6 7.7 8.6M83.4 25H79.8c-3.4 0-6 0-10.3-4.3s-5.2-12-8.6-12-4.3 8.6-7.7 8.6"
			}));

			m.states.create("hover", { stroke: color(0x3CABFF) });

			const a = logo.children.push(Graphics.new(this, {
				stroke: color(0x888888),
				strokeWidth: 3,
				svgPath: "M83.4 25h-31C37 25 39.5 4.4 28.4 4.4S18.9 24.2 4.3 25H0"
			}));

			a.states.create("hover", { stroke: color(0x474758) });

			//logo.set("tooltip", this._tooltip);
			//logo.setPrivate("tooltipTarget", logo.get("background"));
			this._logo = logo;

			this._handleLogo();
		}
	}

	protected _getRealSize(): DOMRect {
		return this.dom.getBoundingClientRect();
	}

	protected _getCalculatedSize(rect: DOMRect): ISize {
		if (this._settings.calculateSize) {
			return this._settings.calculateSize(rect);

		} else {
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

		const container = rootContainer.children.push(Container.new(this, { visible: true, width: p100, height: p100 }));
		this.container = container;

		renderer.resize(realWidth, realHeight, width, height);

		//@todo: better appendChild - refer
		this._inner.appendChild(renderer.view);

		// TODO: TMP TMP TMP for testing only, remove
		//renderer.debugGhostView = true;

		this._initResizeSensor();

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
							// ESC pressed - lose current focus
							$utils.blur();
							this._focusedSprite = undefined;
						}
						let dragOffsetX = 0;
						let dragOffsetY = 0;
						// TODO: figure out if using bogus MouseEvent is fine, or it will
						// fail on some platforms
						const eventKey = $utils.getEventKey(ev);
						switch (eventKey) {
							case "Enter":
							case " ":
								const announceText = focusedSprite.get("clickAnnounceText", "");
								if (announceText !== "") {
									this.readerAlert(announceText);
								}
								if (eventKey == " " && focusedSprite.get("role") != "checkbox") {
									return;
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

							if (!focusedSprite.isDragging()) {
								// Start dragging
								this._keyboardDragPoint = {
									x: 0,
									y: 0
								}

								const downEvent = renderer.getEvent(new MouseEvent("mousedown", {
									clientX: 0,
									clientY: 0
								}));

								downEvent.point = {
									x: 0,
									y: 0
								};

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
							const dragPoint = this._keyboardDragPoint!;
							dragPoint.x += dragOffsetX;
							dragPoint.y += dragOffsetY;
							const moveEvent = renderer.getEvent(new MouseEvent("mousemove", {
								clientX: dragPoint.x,
								clientY: dragPoint.y
							}), false);

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
								if (focusedSprite.isDragging()) {
									// Simulate drag stop
									const dragPoint = this._keyboardDragPoint!;
									const upEvent = renderer.getEvent(new MouseEvent("mouseup", {
										clientX: dragPoint.x,
										clientY: dragPoint.y
									}));

									if (focusedSprite.events.isEnabled("globalpointerup")) {
										focusedSprite.events.dispatch("globalpointerup", {
											type: "globalpointerup",
											originalEvent: upEvent.event,
											point: upEvent.point,
											simulated: true,
											target: focusedSprite
										});
									}
									//this._positionFocusElement(focusedSprite);
									this._keyboardDragPoint = undefined;
									// @todo dispatch mouseup event instead of calling dragStop?
									// this._dispatchEvent("globalpointerup", target, upEvent);
									return;
								}
								else if (focusedSprite.get("focusableGroup")) {
									// Find next item in focusable group
									const group = focusedSprite.get("focusableGroup");
									const items = this._tabindexes.filter((item) => {
										return item.get("focusableGroup") == group && item.getPrivate("focusable") !== false && item.isVisibleDeep() ? true : false;
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
							case "Tab":
								const group = focusedSprite.get("focusableGroup");
								if (group && this._isShift) {
									this._focusNext(focusedSprite.getPrivate("focusElement")!.dom, -1, group);
									return;
								}
								break;
						}
					}
				}));
			}
		}

		this._startTicker();
		this.setThemes([]);

		this._addTooltip();

		if (!this._hasLicense()) {
			this._showBranding();
		}
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
	 * If automatic resizing of char is disabled (`root.autoResize = false`), it
	 * can be resized manually by calling this method.
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

	private _render() {
		this._renderer.render(this._rootContainer._display);

		if (this._focusElementDirty) {
			this._updateCurrentFocus();
			this._focusElementDirty = false;
		}
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
		//console.log("tick **************************************************************");
		let allParents: { [id: number]: IParent } = {};

		while (this._isDirtyParents) {
			// This must be before calling _prepareChildren
			this._isDirtyParents = false;

			$object.keys(this._dirtyParents).forEach((key) => {
				const parent = this._dirtyParents[key];

				delete this._dirtyParents[key];

				if (!parent.isDisposed()) {
					allParents[parent.uid] = parent;
					parent._prepareChildren();
				}
			});
		}

		$object.keys(allParents).forEach((key) => {
			allParents[key]._updateChildren();
		});


		const objects: Array<Entity> = [];

		//		console.log("_beforeChanged")
		$object.keys(this._dirty).forEach((key) => {
			const entity = this._dirty[key];

			if (entity.isDisposed()) {
				delete this._dirty[entity.uid];

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

		$object.keys(this._dirtyBounds).forEach((key) => {
			const entity = this._dirtyBounds[key];

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
		$object.keys(dirtyPositions).forEach((key) => {
			const sprite = dirtyPositions[key];

			delete dirtyPositions[key];

			if (!sprite.isDisposed()) {
				sprite._updatePosition();
			}
		});

		//		console.log("_afterChanged")
		objects.forEach((entity) => {
			entity._afterChanged();
		});
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
	 * Returns whether the root is updating or not.
	 */
	public get updateTick(): boolean {
		return this._updateTick;
	}

	/**
	 * Enables or disables the root updating.
	 */
	public set updateTick(value: boolean) {
		this._updateTick = value;

		if (value) {
			this._startTicker();
		}
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

	public eachFrame(f: (currentTime: number) => void): IDisposer {
		this._tickers.push(f);
		this._startTicker();

		return new Disposer(() => {
			$array.removeFirst(this._tickers, f);
		});
	}

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
	 * Returns width of the target container, in pixels.
	 *
	 * @return Width
	 */
	public width(): number {
		// TODO make this more efficient, maybe just return the renderer's width ?
		return Math.floor(this._getCalculatedSize(this._getRealSize()).width);
	}

	/**
	 * Returns height of the target container, in pixels.
	 *
	 * @return Height
	 */
	public height(): number {
		// TODO make this more efficient, maybe just return the renderer's height ?
		return Math.floor(this._getCalculatedSize(this._getRealSize()).height);
	}

	/**
	 * Disposes root and all the content in it.
	 */
	public dispose(): void {
		if (!this._isDisposed) {
			this._isDisposed = true;

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
	 * Returns `true` if root element is disposed.
	 *
	 * @return Disposed?
	 */
	public isDisposed(): boolean {
		return this._isDisposed;
	}

	/**
	 * Triggers screen reader read out a message.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/accessibility/} for more info
	 * @param  text  Alert text
	 */
	public readerAlert(text: string): void {
		if (this._a11yD !== true) {
			this._readerAlertElement!.innerHTML = $utils.stripTags(text);
		}
	}

	/**
	 * Sets themes to be used for the chart.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/themes/} for more info
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
			this.container.set("tooltip", tooltip);
			tooltip.hide(0);
			this._tooltip = tooltip;
		}
	}

	/**
	 * Accesibility
	 */

	public _registerTabindexOrder(target: Sprite): void {
		if (this._a11yD == true) {
			return;
		}

		if (target.get("focusable")) {
			$array.pushOne(this._tabindexes, target);
		}
		else {
			$array.remove(this._tabindexes, target);
		}
		this._invalidateTabindexes();
	}

	public _unregisterTabindexOrder(target: Sprite): void {
		if (this._a11yD == true) {
			return;
		}

		$array.remove(this._tabindexes, target);
		this._invalidateTabindexes();
	}

	public _invalidateTabindexes(): void {
		if (this._a11yD == true) {
			return;
		}

		this._tabindexes.sort((a: Sprite, b: Sprite) => {
			const aindex = a.get("tabindexOrder", 0);
			const bindex = b.get("tabindexOrder", 0);
			if (aindex == bindex) {
				return 0;
			}
			else if (aindex > bindex) {
				return 1;
			}
			else {
				return -1;
			}
		});

		const groups: Array<string | number> = [];
		$array.each(this._tabindexes, (item, index) => {
			if (!item.getPrivate("focusElement")) {
				this._makeFocusElement(index, item);
			}
			else {
				this._moveFocusElement(index, item);
			}
			const group = item.get("focusableGroup");
			if (group && item.getPrivate("focusable") !== false) {
				if (groups.indexOf(group) !== -1) {
					// Non-first element in the group, make it not directly focusable
					item.getPrivate("focusElement")!.dom.setAttribute("tabindex", "-1");
				}
				else {
					groups.push(group);
				}
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
			focusElement = target.getPrivate("focusElement")!.dom;
		}

		if (!focusElement) {
			return;
		}

		const role = target.get("role");
		if (role) {
			focusElement.setAttribute("role", role);
		}
		else {
			focusElement.removeAttribute("role");
		}

		const ariaLabel = target.get("ariaLabel");
		if (ariaLabel) {
			const label = populateString(target, ariaLabel);
			focusElement.setAttribute("aria-label", label);
		}
		else {
			focusElement.removeAttribute("aria-label");
		}

		const ariaLive = target.get("ariaLive");
		if (ariaLive) {
			focusElement.setAttribute("aria-live", ariaLive);
		}
		else {
			focusElement.removeAttribute("aria-live");
		}

		const ariaChecked = target.get("ariaChecked");
		if (ariaChecked != null && role && ["checkbox", "option", "radio", "menuitemcheckbox", "menuitemradio", "treeitem"].indexOf(role) !== -1) {
			focusElement.setAttribute("aria-checked", ariaChecked ? "true" : "false");
		}
		else {
			focusElement.removeAttribute("aria-checked");
		}

		const ariaCurrent = target.get("ariaCurrent");
		if (ariaCurrent != null) {
			focusElement.setAttribute("aria-current", ariaCurrent);
		}
		else {
			focusElement.removeAttribute("aria-current");
		}

		const ariaSelected = target.get("ariaSelected");
		if (ariaSelected != null && role && ["gridcell", "option", "row", "tab", "columnheader", "rowheader", "treeitem"].indexOf(role) !== -1) {
			focusElement.setAttribute("aria-selected", ariaSelected ? "true" : "false");
		}
		else {
			focusElement.removeAttribute("aria-selected");
		}

		if (target.get("ariaHidden")) {
			focusElement.setAttribute("aria-hidden", "true");
		}
		else {
			focusElement.removeAttribute("aria-hidden");
		}

		const ariaOrientation = target.get("ariaOrientation");
		if (ariaOrientation) {
			focusElement.setAttribute("aria-orientation", ariaOrientation);
		}
		else {
			focusElement.removeAttribute("aria-orientation");
		}

		const ariaValueNow = target.get("ariaValueNow");
		if (ariaValueNow) {
			focusElement.setAttribute("aria-valuenow", ariaValueNow);
		}
		else {
			focusElement.removeAttribute("aria-valuenow");
		}

		const ariaValueMin = target.get("ariaValueMin");
		if (ariaValueMin) {
			focusElement.setAttribute("aria-valuemin", ariaValueMin);
		}
		else {
			focusElement.removeAttribute("aria-valuemin");
		}

		const ariaValueMax = target.get("ariaValueMax");
		if (ariaValueMax) {
			focusElement.setAttribute("aria-valuemax", ariaValueMax);
		}
		else {
			focusElement.removeAttribute("aria-valuemax");
		}

		const ariaValueText = target.get("ariaValueText");
		if (ariaValueText) {
			focusElement.setAttribute("aria-valuetext", ariaValueText);
		}
		else {
			focusElement.removeAttribute("aria-valuetext");
		}

		const ariaControls = target.get("ariaControls");
		if (ariaControls) {
			focusElement.setAttribute("aria-controls", ariaControls);
		}
		else {
			focusElement.removeAttribute("aria-controls");
		}

		if (target.get("visible") && target.get("opacity") !== 0 && target.get("role") != "tooltip" && !target.isHidden() && target.getPrivate("focusable") !== false && (target.height() || target.width())) {
			if (focusElement.getAttribute("tabindex") != "-1") {
				focusElement.setAttribute("tabindex", "" + this.tabindex);
			}
			focusElement.removeAttribute("aria-hidden");
		}
		else {
			focusElement.removeAttribute("tabindex");
			focusElement.setAttribute("aria-hidden", "true");
		}
	}

	public _makeFocusElement(index: number, target: Sprite): void {

		if (target.getPrivate("focusElement") || this._a11yD == true) {
			return;
		}

		// Init
		const focusElement = document.createElement("div");
		if (target.get("role") != "tooltip") {
			focusElement.tabIndex = this.tabindex;
		}
		focusElement.style.position = "absolute";
		$utils.setInteractive(focusElement, false);

		const disposers: Array<IDisposer> = [];

		target.setPrivate("focusElement", {
			dom: focusElement,
			disposers,
		});

		this._decorateFocusElement(target);

		disposers.push($utils.addEventListener(focusElement, "focus", (ev: FocusEvent) => {
			this._handleFocus(ev);
		}));

		disposers.push($utils.addEventListener(focusElement, "blur", (ev: FocusEvent) => {
			this._handleBlur(ev);
		}));

		this._moveFocusElement(index, target);

	}

	public _removeFocusElement(target: Sprite): void {
		if (this._a11yD == true) {
			return;
		}

		$array.remove(this._tabindexes, target);
		const focusElement = target.getPrivate("focusElement");
		if (focusElement) {
			const container = this._focusElementContainer!;
			container.removeChild(focusElement.dom);
			$array.each(focusElement.disposers, (x) => {
				x.dispose();
			});
		}
	}

	public _hideFocusElement(target: Sprite): void {
		if (this._a11yD == true) {
			return;
		}

		const focusElement = target.getPrivate("focusElement")!;
		focusElement.dom.style.display = "none";
	}

	protected _moveFocusElement(index: number, target: Sprite): void {
		if (this._a11yD == true) {
			return;
		}

		// Get container
		const container = this._focusElementContainer!;
		const focusElement = target.getPrivate("focusElement")!.dom;

		if (focusElement === this._focusElementContainer!.children[index]) {
			// Nothing to do
			return;
		}

		const next = this._focusElementContainer!.children[index + 1];
		if (next) {
			container.insertBefore(focusElement, next);
		}
		else {
			container.append(focusElement);
		}
	}

	protected _positionFocusElement(target: Sprite): void {
		if (this._a11yD == true || target == undefined) {
			return;
		}

		const bounds = target.globalBounds();

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
		let found: Sprite | undefined;
		$array.eachContinue(this._tabindexes, (item, _index) => {
			if (item.getPrivate("focusElement")!.dom === target) {
				found = item;
				return false;
			}
			return true;
		});
		return found;
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
		//this._decorateFocusElement(focused);

		this._focusedSprite = focused;

		if (focused.events.isEnabled("focus")) {
			focused.events.dispatch("focus", {
				type: "focus",
				originalEvent: ev,
				target: focused
			});
		}
	}

	protected _focusNext(el: HTMLDivElement, direction: 1 | -1, group?: string | number): void {
		if (this._a11yD == true) {
			return;
		}

		const focusableElements = Array.from(document.querySelectorAll([
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

		targetElement.focus();
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
	}

	/**
	 * @ignore
	 */
	public updateTooltip(target: Text): void {
		if (this._a11yD == true) {
			return;
		}

		const text = $utils.stripTags(target._getText());
		let tooltipElement = target.getPrivate("tooltipElement");
		if (target.get("role") == "tooltip" && text != "") {
			if (!tooltipElement) {
				tooltipElement = this._makeTooltipElement(target);
			}
			if (tooltipElement.innerHTML != text) {
				tooltipElement.innerHTML = text!;
			}
			tooltipElement.setAttribute("aria-hidden", target.isVisibleDeep() ? "false" : "true");
		}
		else if (tooltipElement) {
			tooltipElement.remove();
			target.removePrivate("tooltipElement");
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

	public _invalidateAccessibility(target: Sprite): void {
		if (this._a11yD == true) {
			return;
		}
		this._focusElementDirty = true;
		const focusElement = target.getPrivate("focusElement");
		if (target.get("focusable")) {
			if (focusElement) {
				this._decorateFocusElement(target);
				this._positionFocusElement(target);
			}
			// else {
			// 	this._renderer._makeFocusElement(0, this);
			// }
		}
		else if (focusElement) {
			this._removeFocusElement(target);
		}
		//this.updateCurrentFocus();
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
	 * Converts document coordinates to coordinates withing root element.
	 *
	 * @param   point  Document point
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
	 * Converts root coordinates to document
	 *
	 * @param   point  Document point
	 * @return         Root point
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
		const styles = window.getComputedStyle(this.dom);
		let fontHash = "";
		$object.each(styles, (key, val) => {
			if ($type.isString(key) && key.match(/^font/)) {
				fontHash += val;
			}
		})
		const changed = fontHash != this._fontHash;
		if (changed) {
			this._fontHash = fontHash;
		}
		return changed;
	}

	protected _checkComputedStyles(): void {
		if (this._updateComputedStyles()) {
			this._invalidateLabelBounds(this.container);
		}
	}

	protected _invalidateLabelBounds(target: Sprite): void {
		if (target instanceof Container) {
			target.children.each((child) => {
				this._invalidateLabelBounds(child);
			});
		}
		else if (target instanceof Text) {
			target.markDirtyBounds();
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
	 * https://www.amcharts.com/online-store/
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

	public _licenseApplied(): void {
		if (this._logo) {
			this._logo.set("forceHidden", true);
		}
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
	 * Set this to `true` if you need chart to require first a tap onto it before
	 * touch gesture related functionality like zoom/pan is turned on.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/getting-started/root-element/#Touch_related_options} for more info
	 * @default false
	 * @since 5.2.9
	 * @param  value  Needs a tap to activate touch functions
	 */
	public set tapToActivate(value: boolean) {
		this._renderer.tapToActivate = value;
	}

	/**
	 * @return Needs a tap to activate touch functions
	 */
	public get tapToActivate(): boolean {
		return this._renderer.tapToActivate;
	}

	/**
	 * If `tapToActivate` is set to `true`, this setting will determine number
	 * of milliseconds the chart will stay "active", before releasing the
	 * controls back to the page.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/getting-started/root-element/#Touch_related_options} for more info
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

		container.append(htmlElement);

		$array.pushOne(this._htmlEnabledContainers, target);

		return htmlElement;
	}

	public _positionHTMLElements(): void {
		$array.each(this._htmlEnabledContainers, (target) => {
			this._positionHTMLElement(target);
		});
	}

	public _positionHTMLElement(target: Container): void {
		const htmlElement = target.getPrivate("htmlElement");
		if (htmlElement) {

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

	public _setHTMLContent(target: Container, html: string): void {
		let htmlElement = target.getPrivate("htmlElement");
		if (!htmlElement) {
			htmlElement = this._makeHTMLElement(target);
		}
		if (htmlElement.innerHTML != html) {
			htmlElement.innerHTML = html;
		}
	}

	public _removeHTMLContent(target: Container): void {
		let htmlElement = target.getPrivate("htmlElement");
		if (htmlElement) {
			this._htmlElementContainer!.removeChild(htmlElement);
			target.removePrivate("htmlElement");
		}
		$array.remove(this._htmlEnabledContainers, target);
	}
}

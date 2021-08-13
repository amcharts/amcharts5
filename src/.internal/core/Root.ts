import { Container } from "./render/Container";
import { HorizontalLayout } from "./render/HorizontalLayout";
import { VerticalLayout } from "./render/VerticalLayout";
import { GridLayout } from "./render/GridLayout";
import type { IAnimation } from "./util/Animation";
import { IDisposer, Disposer } from "./util/Disposer";
import { ResizeSensor } from "./util/ResizeSensor";
import type { Entity } from "./util/Entity";
import { InterfaceColors } from "./util/InterfaceColors";
import type { Sprite } from "./render/Sprite";
import type { Text } from "./render/Text";
import { Tooltip } from "./render/Tooltip";
import type { Theme } from "./Theme";
import { NumberFormatter } from "./util/NumberFormatter";
import { DateFormatter } from "./util/DateFormatter";
import { DurationFormatter } from "./util/DurationFormatter";
import { ILocale, Language } from "./util/Language";
import { Events, EventDispatcher } from "./util/EventDispatcher";
import { DefaultTheme } from "../themes/DefaultTheme";
import type { IPoint } from "./util/IPoint";
import type { IRenderer } from "./render/backend/Renderer";
import { CanvasRenderer } from "./render/backend/CanvasRenderer";
import * as $order from "./util/Order";
import { p100 } from "./util/Percent";
import * as $array from "./util/Array";
import * as $object from "./util/Object";
import * as $utils from "./util/Utils";
import en from "../../locales/en";
import { populateString } from "./util/PopulateString";


interface IParent extends Entity {
	_prepareChildren(): void;
	_updateChildren(): void;
}


interface IBounds extends Entity {
	depth(): number;
	_updateBounds(): void;
}


export interface IRootEvents {
	framestarted: {};
	frameended: {};
}


// TODO implement Disposer
export class Root implements IDisposer {
	public _dom: HTMLElement;

	protected _isDirty: boolean = false;
	protected _isDirtyParents: boolean = false;
	protected _dirty: { [id: number]: Entity } = {};
	protected _dirtyParents: { [id: number]: IParent } = {};
	protected _dirtyBounds: { [id: number]: IBounds } = {};
	protected _dirtyPositions: { [id: number]: Sprite } = {};

	protected _ticker: ((currentTime: number) => void) | null = null;
	protected _tickers: Array<(currentTime: number) => void> = [];

	/**
	 * Root's event dispatcher.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/events/} for more info
	 */
	public events: EventDispatcher<Events<this, IRootEvents>> = new EventDispatcher();

	/**
	 * @todo needs description
	 */
	public animationTime: number | null = null;

	private _animations: Array<IAnimation> = [];

	public _renderer: IRenderer = new CanvasRenderer();

	public _rootContainer!: Container;

	public container!: Container;

	/**
	 * A [[Container]] used to display tooltips in.
	 */
	public tooltipContainer!: Container

	/**
	 * @ignore deprecated?
	 */
	public static useCanvas: boolean = false;

	/**
	 * Default theme.
	 *
	 * You can use it modify defaults.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/themes/#Modifying_default_theme} for more info
	 */
	public defaultTheme!: DefaultTheme;

	// Locale-related

	/**
	 * @ignore
	 * @todo is this need to be user-facing?
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
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/formatters/formatting-dates/#UTC_and_time_zones} for more info
	 */
	public utc: boolean = false;

	/**
	 * Use specific time zone when formatting date/time.
	 *
	 * @ignore timezones are not yet supported
	 */
	public timezone: string | null = null;

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
	 * @ignore
	 * @todo will use at some point in the future
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

	protected _focusElementDirty: boolean = false;
	protected _focusElementContainer: HTMLDivElement | undefined;
	protected _focusedSprite: Sprite | undefined;
	protected _keyboardDragPoint: IPoint | undefined;
	protected _tooltipElementContainer: HTMLDivElement | undefined;
	protected _readerAlertElement: HTMLDivElement | undefined;

	/**
	 * Used for dynamically-created CSS and JavaScript with strict source policies.
	 */
	public nonce?: string;


	public interfaceColors: InterfaceColors;

	public verticalLayout: VerticalLayout = VerticalLayout.new(this, {});

	public horizontalLayout: VerticalLayout = HorizontalLayout.new(this, {});

	public gridLayout: VerticalLayout = GridLayout.new(this, {});

	protected _isDisposed: boolean = false;
	protected _disposers: Array<IDisposer> = [];

	public _tooltips: Array<Tooltip> = [];

	protected constructor(id: string, isReal: boolean) {

		if (!isReal) {
			throw new Error("You cannot use `new Class()`, instead use `Class.new()`");
		}

		const dom = document.getElementById(id);

		this.interfaceColors = InterfaceColors.new(this, {});

		if (dom === null) {
			throw new Error("Could not find HTML element with id `" + id + "`");
		}

		// TODO: is this right? We need chart container to be "positioned"
		if (!dom.style.position) {
			dom.style.position = "relative";
		}

		this._dom = dom;
	}

	public static new(id: string): Root {
		const root = new Root(id, true);
		root._init();
		return root;
	}

	protected _init(): void {
		const renderer = this._renderer;
		const rootContainer = Container.new(this, { visible: true, width: this._dom.clientWidth, height: this._dom.clientHeight });
		this._rootContainer = rootContainer;

		const container = rootContainer.children.push(Container.new(this, { visible: true, width: p100, height: p100 }));
		this.container = container;

		renderer.resize(this._dom.clientWidth, this._dom.clientHeight);

		//@todo: better appendChild - refer
		this._dom.appendChild(renderer.view);

		// TODO: TMP TMP TMP for testing only, remove
		//document.body.appendChild((<any>renderer)._ghostView);


		this._disposers.push(new ResizeSensor(this._dom, () => {
			const dom = this._dom;
			renderer.resize(dom.clientWidth, dom.clientHeight);
			this._rootContainer.set("width", dom.clientWidth);
			this._rootContainer.set("height", dom.clientHeight);
			this._render();
		}));

		// Create element which is used to make announcements to screen reader
		this._readerAlertElement = document.createElement("div");
		this._readerAlertElement.setAttribute("role", "alert");
		this._readerAlertElement.style.zIndex = "-100000";
		this._readerAlertElement.style.opacity = "0";
		this._readerAlertElement.style.position = "absolute";
		this._readerAlertElement.style.top = "0";
		this._dom.appendChild(this._readerAlertElement);

		this._focusElementContainer = document.createElement("div");
		this._dom.appendChild(this._focusElementContainer);

		this._tooltipElementContainer = document.createElement("div");
		this._dom.appendChild(this._tooltipElementContainer);

		// Add keyboard events for accessibility, e.g. simulating drag with arrow
		// keys and click with ENTER
		if ($utils.supports("keyboardevents")) {
			this._disposers.push($utils.addEventListener(document, "keydown", (ev: KeyboardEvent) => {
				const focusedSprite = this._focusedSprite;
				if (focusedSprite) {
					if (ev.keyCode == 27) {
						// ESC pressed - lose current focus
						$utils.blur();
						this._focusedSprite = undefined;
					}
					let dragOffsetX = 0;
					let dragOffsetY = 0;
					// TODO: figure out if using bogus MouseEvent is fine, or it will
					// fail on some platforms
					switch (ev.keyCode) {
						case 13:
							ev.preventDefault();
							const downEvent = renderer.getEvent(new MouseEvent("click"));
							focusedSprite.events.dispatch("click", {
								type: "click",
								originalEvent: downEvent.event,
								point: downEvent.point,
								simulated: true,
								target: focusedSprite
							});
							return;
						case 37:
							dragOffsetX = -6;
							break;
						case 39:
							dragOffsetX = 6;
							break;
						case 38:
							dragOffsetY = -6;
							break;
						case 40:
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

			document.addEventListener("keyup", (ev: KeyboardEvent) => {
				if (this._focusedSprite) {
					const focusedSprite = this._focusedSprite;
					switch (ev.keyCode) {
						case 37:
						case 39:
						case 38:
						case 40:
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
							break;
					}
				}
			});
		}

		this._startTicker();
		this.setThemes([]);

		this._addTooltip();
	}

	private _render() {
		this._renderer.render(this._rootContainer._display);

		if (this._focusElementDirty) {
			this.updateCurrentFocus();
			this._focusElementDirty = false;
		}
	}

	private _runTickers(currentTime: number) {
		$array.each(this._tickers, (f) => {
			f(currentTime);
		});
	}

	private _runAnimations(currentTime: number) {
		$array.keepIf(this._animations, (animation) => {
			return !animation._runAnimation(currentTime);
		});
	}

	private _runDirties() {
		console.log("tick **************************************************************");

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
			const parent = allParents[key];
			parent._updateChildren();
		});

		const objects: Array<Entity> = [];

		//		console.log("_beforeChanged")
		$object.keys(this._dirty).forEach((key) => {
			const entity = this._dirty[key];

			if (!entity.isDisposed()) {
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

		// High depth -> low depth
		bounds.sort((x, y) => {
			return $order.compare(depths[y.uid], depths[x.uid]);
		});

		//		console.log("_updateBounds")
		bounds.forEach((entity) => {
			entity._updateBounds();
		});

		//		console.log("_updatePosition")
		$object.keys(this._dirtyPositions).forEach((key) => {
			const sprite = this._dirtyPositions[key];

			delete this._dirtyPositions[key];

			if (!sprite.isDisposed()) {
				sprite._updatePosition();
			}
		});

		//		console.log("_afterChanged")
		objects.forEach((entity) => {
			entity._afterChanged();
		});
	}

	private _runTicker(currentTime: number) {
		if (!this.isDisposed()) {
			this.animationTime = currentTime;

			this._runTickers(currentTime);
			this._runAnimations(currentTime);
			this._runDirties();
			this._render();

			// No more work to do
			if (this._tickers.length === 0 &&
				this._animations.length === 0 &&
				!this._isDirty) {

				this._ticker = null;
				this.animationTime = null;

			} else {
				requestAnimationFrame(this._ticker!);
			}
		}
	}

	private _startTicker() {
		if (this._ticker === null) {
			this.animationTime = null;

			this._ticker = (currentTime) => {
				this._runTicker(currentTime);
			};

			requestAnimationFrame(this._ticker);
		}
	}

	public _addDirtyEntity(entity: Entity) {
		if (this._dirty[entity.uid] === undefined) {
			this._isDirty = true;
			this._dirty[entity.uid] = entity;
			this._startTicker();
		}
	}

	public _addDirtyParent(parent: IParent) {
		if (this._dirtyParents[parent.uid] === undefined) {
			this._isDirty = true;
			this._isDirtyParents = true;
			this._dirtyParents[parent.uid] = parent;
			this._startTicker();
		}
	}

	public _addDirtyBounds(entity: IBounds) {
		if (this._dirtyBounds[entity.uid] === undefined) {
			this._isDirty = true;
			this._dirtyBounds[entity.uid] = entity;
			this._startTicker();
		}
	}

	public _addDirtyPosition(sprite: Sprite) {
		if (this._dirtyPositions[sprite.uid] === undefined) {
			this._isDirty = true;
			this._dirtyPositions[sprite.uid] = sprite;
			this._startTicker();
		}
	}

	public _addAnimation(animation: IAnimation) {
		// TODO use numeric id instead
		if (this._animations.indexOf(animation) === -1) {
			this._animations.push(animation);
			this._startTicker();
		}
	}

	public eachFrame(f: (currentTime: number) => void): IDisposer {
		this._tickers.push(f);
		this._startTicker();

		return new Disposer(() => {
			$array.removeFirst(this._tickers, f);
		});
	}

	public width(): number {
		return this._dom.clientWidth;
	}

	public height(): number {
		return this._dom.clientHeight;
	}

	public dispose(): void {
		if (!this._isDisposed) {
			this._isDisposed = true;

			this._renderer.dispose();
			this.horizontalLayout.dispose();
			this.verticalLayout.dispose();
			this.interfaceColors.dispose();

			$array.each(this._disposers, (x) => {
				x.dispose();
			});
		}
	}

	public isDisposed(): boolean {
		return this._isDisposed;
	}

	/**
	 * Triggers screen reader read out a message.
	 *
	 * @param  text  Alert text
	 */
	public readerAlert(text: string): void {
		this._readerAlertElement!.innerHTML = text;
	}

	/**
	 * Sets themes to be used for the chart.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/themes/} for more info
	 * @param  themes  A list of themes
	 */
	public setThemes(themes: Array<Theme>): void {
		if (!this.defaultTheme) {
			this.defaultTheme = DefaultTheme.new(this);
		}
		themes.unshift(this.defaultTheme);
		this._rootContainer.set("themes", themes);

		// otherwise new themes are not applied
		const tooltipContainer = this.tooltipContainer;
		if (tooltipContainer) {
			tooltipContainer._applyThemes();
		}
	}

	protected _addTooltip() {
		if (!this.tooltipContainer) {
			const tooltipContainer = this._rootContainer.children.push(Container.new(this, { position: "absolute", isMeasured: false }));
			tooltipContainer.set("layer", 100);
			this.tooltipContainer = tooltipContainer;

			const tooltip = tooltipContainer.children.push(Tooltip.new(this, {}));
			this.container.set("tooltip", tooltip);
			tooltip.hide(0);
		}
	}

	/**
	 * Accesibility
	 */

	public registerTabindexOrder(target: Sprite): void {
		if (target.get("focusable")) {
			$array.pushOne(this._tabindexes, target);
		}
		else {
			$array.remove(this._tabindexes, target);
		}
		this.invalidateTabindexes();
	}

	public unregisterTabindexOrder(target: Sprite): void {
		$array.remove(this._tabindexes, target);
		this.invalidateTabindexes();
	}

	public invalidateTabindexes(): void {

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

		$array.each(this._tabindexes, (item, index) => {
			if (!item.getPrivate("focusElement")) {
				this._makeFocusElement(index, item);
			}
			else {
				this._moveFocusElement(index, item);
			}
		});

		//this._makeFocusElement(0, this._tabindexes[0], false);
		// }
	}

	public updateCurrentFocus(): void {
		if (this._focusedSprite) {
			this._decorateFocusElement(this._focusedSprite);
			this._positionFocusElement(this._focusedSprite);
		}
	}

	public _decorateFocusElement(target: Sprite, focusElement?: HTMLDivElement): void {

		// Decorate with proper accessibility attributes
		if (!focusElement) {
			focusElement = target.getPrivate("focusElement")!;
		}

		if (!focusElement) {
			return;
		}

		if (target.get("visible") && target.get("role") != "tooltip" && !target.isHidden()) {
			focusElement.setAttribute("tabindex", "" + this.tabindex);
		}
		else {
			focusElement.removeAttribute("tabindex")
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
		if (ariaChecked != null) {
			focusElement.setAttribute("aria-checked", ariaChecked ? "true" : "false");
		}
		else {
			focusElement.removeAttribute("aria-checked");
		}

		if (target.get("ariaHidden")) {
			focusElement.setAttribute("aria-hidden", "hidden");
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

		const ariaValueText = target.get("ariaValueText");
		if (ariaValueText) {
			focusElement.setAttribute("aria-valuetext", ariaValueText);
		}
		else {
			focusElement.removeAttribute("aria-valuetext");
		}
	}

	public _makeFocusElement(index: number, target: Sprite): void {

		if (target.getPrivate("focusElement")) {
			return;
		}

		// Init
		const focusElement = document.createElement("div");
		if (target.get("role") != "tooltip") {
			focusElement.tabIndex = this.tabindex;
		}
		focusElement.style.position = "absolute";
		$utils.setInteractive(focusElement, false);

		target.setPrivate("focusElement", focusElement);

		this._decorateFocusElement(target);

		focusElement.addEventListener("focus", (ev: FocusEvent) => {
			this._handleFocus(ev, index);
		});

		focusElement.addEventListener("blur", (ev: FocusEvent) => {
			this._handleBlur(ev, index);
		});

		this._moveFocusElement(index, target);

	}

	public _removeFocusElement(target: Sprite): void {

		// Init
		const container = this._focusElementContainer!;
		const focusElement = target.getPrivate("focusElement")!;
		container.removeChild(focusElement);

	}

	protected _moveFocusElement(index: number, target: Sprite): void {

		// Get container
		const container = this._focusElementContainer!;
		const focusElement = target.getPrivate("focusElement")!;

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
		const bounds = target.globalBounds();

		//const bounds = target._display.getGlobalBounds();
		const focusElement = target.getPrivate("focusElement")!;
		focusElement.style.top = (bounds.top - 2) + "px";
		focusElement.style.left = (bounds.left - 2) + "px";
		focusElement.style.width = (bounds.right - bounds.left + 4) + "px";
		focusElement.style.height = (bounds.bottom - bounds.top + 4) + "px";
	}

	protected _handleFocus(ev: FocusEvent, index: number): void {
		// Get element
		const focused = this._tabindexes[index];

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

	protected _handleBlur(ev: FocusEvent, _index: number): void {
		const focused = this._focusedSprite;
		if (focused && focused.events.isEnabled("blur")) {
			focused.events.dispatch("blur", {
				type: "blur",
				originalEvent: ev,
				target: focused
			});
		}
		this._focusedSprite = undefined;
	}


	public updateTooltip(target: Text): void {
		const text = target._getText();
		let tooltipElement = target.getPrivate("tooltipElement");
		if (target.get("role") == "tooltip" && text != "") {
			if (!tooltipElement) {
				tooltipElement = this._makeTooltipElement(target);
			}
			if (tooltipElement.innerHTML != text) {
				tooltipElement.innerHTML = text!;
			}
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
		tooltipElement.style.opacity = "0.0000001";

		$utils.setInteractive(tooltipElement, false);

		this._decorateFocusElement(target, tooltipElement);
		container.append(tooltipElement);
		target.setPrivate("tooltipElement", tooltipElement);
		return tooltipElement;
	}

	public invalidateAccessibility(target: Sprite): void {
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

	public focused(target: Sprite): boolean {
		return this._focusedSprite === target;
	}

	public documentPointToRoot(point: IPoint): IPoint {
		const bbox = this._dom.getBoundingClientRect();
		return {
			x: point.x - bbox.left,
			y: point.y - bbox.top
		};
	}

	public addDisposer<T extends IDisposer>(disposer: T): T {
		this._disposers.push(disposer);
		return disposer;
	}

}

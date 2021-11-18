import type { IDisplayObject, IRendererEvents, IRendererEvent, IPointerEvent } from "./backend/Renderer";
import type { IBounds } from "../util/IBounds";
import type { Container } from "./Container";
import type { IAccessibilitySettings } from "../util/Accessibility";
import type { NumberFormatter } from "../util/NumberFormatter";
import type { DateFormatter } from "../util/DateFormatter";
import type { DurationFormatter } from "../util/DurationFormatter";
import type { DataItem, IComponentDataItem } from "./Component";
import type { Tooltip } from "./Tooltip";
import type { Graphics } from "./Graphics";
import type { IPoint } from "../util/IPoint";
import type { ListTemplate } from "../util/List";

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
//import { populateString } from "../util/PopulateString";


/**
 * An [[EventDispatcher]] for [[Sprite]].
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/events/} for more info
 */
class SpriteEventDispatcher<Target, E extends Events<Target, ISpriteEvents>> extends EventDispatcher<E> {
	protected static RENDERER_EVENTS: { [K in keyof IRendererEvents]?: <E extends Events<Sprite, ISpriteEvents>>(this: SpriteEventDispatcher<Sprite, E>, event: IRendererEvents[K]) => void } = {
		"click": function(event) {
			if (this.isEnabled("click") && !this._sprite.isDragging() && !this._sprite._hasMoved(this._makePointerEvent("click", event))) {
				this.dispatch("click", this._makePointerEvent("click", event));
			}
		},

		"rightclick": function(event) {
			if (this.isEnabled("rightclick")) {
				this.dispatch("rightclick", this._makePointerEvent("rightclick", event));
			}
		},

		"middleclick": function(event) {
			if (this.isEnabled("middleclick")) {
				this.dispatch("middleclick", this._makePointerEvent("middleclick", event));
			}
		},

		"dblclick": function(event) {
			this.dispatchParents("dblclick", this._makePointerEvent("dblclick", event));
		},

		"pointerover": function(event) {
			if (this.isEnabled("pointerover")) {
				this.dispatch("pointerover", this._makePointerEvent("pointerover", event));
			}
		},

		"pointerout": function(event) {
			if (this.isEnabled("pointerout")) {
				this.dispatch("pointerout", this._makePointerEvent("pointerout", event));
			}
		},

		"pointerdown": function(event) {
			this.dispatchParents("pointerdown", this._makePointerEvent("pointerdown", event));
		},

		"pointerup": function(event) {
			if (this.isEnabled("pointerup")) {
				this.dispatch("pointerup", this._makePointerEvent("pointerup", event));
			}
		},

		"globalpointerup": function(event) {
			if (this.isEnabled("globalpointerup")) {
				this.dispatch("globalpointerup", this._makePointerEvent("globalpointerup", event));
			}
		},

		"globalpointermove": function(event) {
			if (this.isEnabled("globalpointermove")) {
				this.dispatch("globalpointermove", this._makePointerEvent("globalpointermove", event));
			}
		},

		"wheel": function(event) {
			if (this.isEnabled("wheel")) {
				this.dispatch("wheel", {
					type: "wheel",
					target: this._sprite,
					originalEvent: event.event,
					point: event.point,
				});
			}
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
		this._sprite.set("interactive", true);
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

	protected _on<C, Key extends keyof E>(once: boolean, type: Key | null, callback: any, context: C, shouldClone: boolean, dispatch: (type: Key, event: E[Key]) => void): EventListener {
		const info = super._on(once, type, callback, context, shouldClone, dispatch);

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
	 * Will stop any bubbling up of the event to element's parents.
	 *
	 * Should be called in an event handler, e.g.:
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


export interface ISpriteSettings extends IEntitySettings, IAccessibilitySettings {

	/**
	 * X position relative to parent.
	 */
	x?: number | Percent;

	/**
	 * Y position relative to parent.
	 */
	y?: number | Percent;

	/**
	 * Element's absolute width in pixels (numeric value) or relative width to
	 * parent ([[Percent]]);
	 */
	width?: number | Percent;

	/**
	 * Element's absolute height in pixels (numeric value) or relative height to
	 * parent ([[Percent]]);
	 */
	height?: number | Percent;

	/**
	 * Maximum allowed width in pixels.
	 */
	maxWidth?: number;

	/**
	 * Maximum allowed height in pixels.
	 */
	maxHeight?: number;

	/**
	 * Minimum allowed width in pixels.
	 */
	minWidth?: number;

	/**
	 * Minimum allowed height in pixels.
	 */
	minHeight?: number;

	/**
	 * Opacity. 0 - fully transparent; 1 - fully opaque.
	 */
	opacity?: number;

	/**
	 * Rotation in degrees.
	 */
	rotation?: number;

	/**
	 * Scale.
	 *
	 * Setting to a value less than 1 will shrink object.
	 */
	scale?: number;

	/**
	 * X coordinate of the center of the element relative to itself.
	 *
	 * Center coordinates will affect placement as well as rotation pivot point.
	 */
	centerX?: number | Percent;

	/**
	 * Y coordinate of the center of the element relative to itself.
	 *
	 * Center coordinates will affect placement as well as rotation pivot point.
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
	 * Is element visible?
	 */
	visible?: boolean;

	/**
	 * Positioning of the element.
	 *
	 * `"absolute"` means element will not participate in parent layout scheme,
	 * and will be positioned solely accoridng its `x` and `y` settings.
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
	 * Should this element accept user interaction events?
	 */
	interactive?: boolean;

	/**
	 * Text to show in a tooltip when hovered.
	 */
	tooltipText?: string;

	/**
	 * Tooltip pointer X coordinate relative to the element itself.
	 */
	tooltipX?: number | Percent;

	/**
	 * Tooltip pointer Y coordinate relative to the element itself.
	 */
	tooltipY?: number | Percent;

	/**
	 * [[Tooltip]] instance.
	 */
	tooltip?: Tooltip;

	/**
	 * Tooltip position.
	 */
	tooltipPosition?: "fixed" | "pointer";

	/**
	 * If set to `false` element will not be measured and cannot participate in
	 * layout schemes.
	 */
	isMeasured?: boolean;

	/**
	 * Allows binding element's settings to data.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/settings/template-fields/} for more info
	 */
	templateField?: string;

	/**
	 * If set to `true`, user will be able to drag this element. It will also
	 * disable default drag events over the area of this element.
	 */
	draggable?: boolean;

	/**
	 * If set to `true`, mouse wheel events will be triggered over the element. It
	 * will also disable page scrolling using mouse wheel when pointer is over
	 * the element.
	 */
	wheelable?: boolean;

	/**
	 * An instance of [[NumberFormatter]] that should be used instead of global
	 * formatter object.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/using-formatters/} for more info
	 */
	numberFormatter?: NumberFormatter | undefined;

	/**
	 * An instance of [[DateFormatter]] that should be used instead of global
	 * formatter object.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/using-formatters/} for more info
	 */
	dateFormatter?: DateFormatter | undefined;

	/**
	 * An instance of [[DurationFormatter]] that should be used instead of global
	 * formatter object.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/using-formatters/} for more info
	 */
	durationFormatter?: DurationFormatter | undefined;

	/**
	 * If set, element will toggle specified boolean setting between `true` and
	 * `false` when clicked/touched.
	 */
	toggleKey?: "disabled" | "active" | "none" | undefined;

	/**
	 * Indicates if element is currently active.
	 */
	active?: boolean;

	/**
	 * Indicates if element is disabled.
	 */
	disabled?: boolean;

	/**
	 * An SVG filter to apply to the element.
	 *
	 * IMPORTANT: SVG filters are not supported in some browsers, e.g. Safari.
	 *
	 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/filter} for more info
	 * @ignore todo: figure out if we still need this
	 */
	filter?: string;

	/**
	 * A named mouse cursor style to show when hovering this element.
	 *
	 * @see {@link https://developer.mozilla.org/en-US/docs/Web/CSS/cursor} for more info
	 */
	cursorOverStyle?: string;

	/**
	 * If set to `false` this element will not appear in exported snapshots of
	 * the chart.
	 */
	exportable?: boolean;

	/**
	 * Numeric layer to put element in.
	 *
	 * Elements with higher number will appear in front of the ones with lower
	 * numer.
	 *
	 * If not set, will inherit layer from its ascendants.
	 */
	layer?: number;

	/**
	 * If set to `true` the element will be hidden regardless of `visible` or
	 * even if `show()` is called.
	 */
	forceHidden?: boolean;

}

export interface ISpritePrivate extends IEntityPrivate {

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
	 * Is element currently showing a tooltip?
	 */
	showingTooltip?: boolean;

	/**
	 * @ignore
	 */
	touchHovering?: boolean;

	/**
	 * @ignore
	 */
	focusElement?: HTMLDivElement;

	/**
	 * An element tooltip should inherit its colors from.
	 */
	tooltipTarget?: Graphics;

	/**
	 * @ignore
	 */
	list?: ListTemplate<Sprite>;

}

/**
 * An interface defining event objects that originate from pinter interactions.
 */
export interface ISpritePointerEvent {

	/**
	 * Original event object that caused the interaction, e.g. [[MouseEvent]].
	 */
	originalEvent: IPointerEvent;

	/**
	 * A point where event originated.
	 */
	point: IPoint;

	/**
	 * Is it a simulated event, e.g. if the event was generated by code rather
	 * then actual user interaction.
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
	 * Invoked when element's data item changes.
	 */
	dataitemchanged: {
		oldDataItem: DataItem<IComponentDataItem> | undefined,
		newDataItem: DataItem<IComponentDataItem> | undefined
	};

	/**
	 * Invoked when element's position (X/Y) changes.
	 */
	positionchanged: {};

	/**
	 * Invoked when element's bounds change due to any manipulation to it.
	 */
	boundschanged: {};

	/**
	 * Invoked when element dragging starts.
	 */
	dragstart: ISpritePointerEvent;

	/**
	 * Invoked when element dragging stops.
	 */
	dragstop: ISpritePointerEvent;

	/**
	 * Invoked when element ois being dragged.
	 */
	dragged: ISpritePointerEvent;

	/**
	 * Invoked when element is clicked or tapped.
	 */
	click: ISpritePointerEvent;

	/**
	 * Invoked when element is clicked width the right mouse button.
	 */
	rightclick: ISpritePointerEvent;

	/**
	 * Invoked when element is clicked with the middle mouse button.
	 */
	middleclick: ISpritePointerEvent;

	/**
	 * Invoked when element is doubleclicked or tapped twice quickly.
	 */
	dblclick: ISpritePointerEvent;

	/**
	 * Invoked when pointer moves over the element.
	 */
	pointerover: ISpritePointerEvent;

	/**
	 * Invoked when pointer moves outside the element.
	 */
	pointerout: ISpritePointerEvent;

	/**
	 * Invoked when pointer button is pressed or touch starts over the element.
	 */
	pointerdown: ISpritePointerEvent;

	/**
	 * Invoked when pointer button is released or touch stops over the element.
	 */
	pointerup: ISpritePointerEvent;

	/**
	 * Invoked when pointer button is released or touch stops in the window, even
	 * outside of the element or even chart area.
	 */
	globalpointerup: ISpritePointerEvent;

	/**
	 * Invoked when pointer is moving anywhere in the window, even outside of the
	 * element or even chart area.
	 */
	globalpointermove: ISpritePointerEvent;

	/**
	 * Invoked when mouse wheel is spinned while pointer is over the element.
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
 * A base class for all visual elements.
 *
 * @important
 */
export abstract class Sprite extends Entity {
	declare public _settings: ISpriteSettings;
	declare public _privateSettings: ISpritePrivate;
	declare public _events: ISpriteEvents;

	declare public events: SpriteEventDispatcher<this, Events<this, this["_events"]>>;

	public abstract _display: IDisplayObject;

	protected _adjustedLocalBounds: IBounds = { left: 0, right: 0, top: 0, bottom: 0 };

	protected _localBounds: IBounds = { left: 0, right: 0, top: 0, bottom: 0 };

	public static className: string = "Sprite";
	public static classNames: Array<string> = Entity.classNames.concat([Sprite.className]);

	public _parent: Container | undefined;
	protected _dataItem: DataItem<IComponentDataItem> | undefined;

	protected _templateField: Template<this> | undefined;

	protected _sizeDirty: boolean = false;

	// Will be true only when dragging
	protected _isDragging: boolean = false;

	// The event when the dragging starts
	protected _dragEvent: ISpritePointerEvent | undefined;

	// The position when dragging starts
	protected _dragPoint: IPoint | undefined;

	protected _isHidden: boolean = false;

	protected _isShowing: boolean = false;

	protected _isHiding: boolean = false;

	protected _isDown: boolean = false;
	protected _downPoint: IPoint | undefined;

	public _downPoints: { [index: number]: IPoint } = {};

	public _toggleDp: IDisposer | undefined;

	protected _dragDp: MultiDisposer | undefined;

	protected _tooltipDp: MultiDisposer | undefined;

	protected _hoverDp: MultiDisposer | undefined;

	protected _focusDp: MultiDisposer | undefined;

	protected _tooltipMoveDp: IDisposer | undefined;

	protected _tooltipPointerDp: MultiDisposer | undefined;

	protected _afterNew() {
		this.setPrivateRaw("visible", true);
		super._afterNew();
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
	public _setDataItem(dataItem: DataItem<IComponentDataItem> | undefined): void {
		const oldDataItem = this._dataItem
		this._dataItem = dataItem;
		this._processTemplateField();
		const eventType = "dataitemchanged";
		if (this.events.isEnabled(eventType)) {
			this.events.dispatch(eventType, {
				type: eventType,
				target: this,
				oldDataItem: oldDataItem,
				newDataItem: dataItem
			});
		}
	}

	/**
	 * A [[DataItem]] used for this element.
	 *
	 * NOTE: data item is being assigned automatically in most cases where it
	 * matters. Use this accessor to set data item only if you know what you're
	 * doing.
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

		if (this.isDirty("tooltip")) {
			const previous = this._prevSettings.tooltip;
			if (previous) {
				previous.dispose();
			}
		}

		if (this.isDirty("layer")) {
			this._display.setLayer(this.get("layer"));
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
				this._tooltipPointerDp = new MultiDisposer([
					this.events.on("pointerover", () => {
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

	public _changed() {
		super._changed();

		const display = this._display;
		const events = this.events;

		if (this.isDirty("draggable")) {
			const draggable = this.get("draggable");
			if (draggable) {
				this.set("interactive", true);

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
		}

		if (this.isDirty("tooltipText")) {
			const tooltipText = this.get("tooltipText");
			if (tooltipText) {
				this._tooltipDp = new MultiDisposer([
					events.on("pointerover", () => {
						this.showTooltip()
					}),
					events.on("pointerout", () => {
						this.hideTooltip()
					})])
			}
			else {
				if (this._tooltipDp) {
					this._tooltipDp.dispose();
					this._tooltipDp = undefined;
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

		if (this.isDirty("active")) {
			if (this.get("active")) {
				this.states.applyAnimate("active");
				this.set("ariaChecked", true);
			}
			else {
				if (!this.isHidden()) {
					this.states.applyAnimate("default");
				}
				this.set("ariaChecked", false);
			}
			this.markDirtyAccessibility();
		}

		if (this.isDirty("disabled")) {
			if (this.get("disabled")) {
				this.states.applyAnimate("disabled");
				this.set("ariaChecked", false);
			}
			else {
				if (!this.isHidden()) {
					this.states.applyAnimate("default");
				}
				this.set("ariaChecked", true);
			}
			this.markDirtyAccessibility();
		}

		if (this.isDirty("opacity")) {
			display.alpha = Math.max(0, this.get("opacity", 1));
		}

		if (this.isDirty("rotation")) {
			this.markDirtyBounds();
			display.angle = this.get("rotation", 0);
		}

		if (this.isDirty("scale")) {
			this.markDirtyBounds();
			display.scale = this.get("scale", 0);
		}

		if (this.isDirty("centerX") || this.isDirty("centerY")) {
			this.markDirtyBounds();
			this.updatePivotPoint();
		}

		if (this.isDirty("visible") || this.isPrivateDirty("visible") || this.isDirty("forceHidden")) {
			if (!this.get("visible") || !this.getPrivate("visible") || this.get("forceHidden")) {
				display.visible = false;
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

		if (this.isDirty("maxWidth") || this.isDirty("maxHeight") || this.isPrivateDirty("width") || this.isPrivateDirty("height")) {
			this.markDirtyBounds();
			this._sizeDirty = true;
		}

		if (this._sizeDirty) {
			this._updateSize();
		}

		if (this.isDirty("wheelable")) {
			const wheelable = this.get("wheelable");
			if (wheelable) {
				this.set("interactive", true);
			}
			display.wheelable = wheelable ? true : false;
		}

		// Accessibility
		if (this.isDirty("tabindexOrder") || this.isDirty("focusableGroup")) {
			if (this.get("focusable")) {
				this._root._registerTabindexOrder(this);
			}
			else {
				this._root._unregisterTabindexOrder(this);
			}
		}

		if (this.isDirty("filter")) {
			//this.markDirtyBounds();
			display.filter = this.get("filter");
		}

		if (this.isDirty("cursorOverStyle")) {
			display.cursorOverStyle = this.get("cursorOverStyle");
		}

		if (this.isDirty("hoverOnFocus")) {
			if (this.get("hoverOnFocus")) {
				this._focusDp = new MultiDisposer([
					events.on("focus", () => {
						// TODO: proper hover, not just tooltip
						this.showTooltip();
					}),

					events.on("blur", () => {
						// TODO: proper hover, not just tooltip
						this.hideTooltip();
					})])
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
		}

		if (this.isDirty("role") || this.isDirty("ariaLive") || this.isDirty("ariaChecked") || this.isDirty("ariaHidden") || this.isDirty("ariaOrientation") || this.isDirty("ariaValueNow") || this.isDirty("ariaValueText") || this.isDirty("ariaLabel")) {
			// display.accessibility.ariaLabel = populateString(this, this.get("ariaLabel", ""));
			// @todo make sure ariaLabel gets populated in Root
			this.markDirtyAccessibility();
		}

		if (this.isDirty("exportable")) {
			display.exportable = this.get("exportable");
		}

		if (this.isDirty("interactive")) {
			const events = this.events;
			if (this.get("interactive")) {
				this._hoverDp = new MultiDisposer([
					events.on("click", (ev) => {
						if ($utils.isTouchEvent(ev.originalEvent)) {
							if (!this.getPrivate("touchHovering")) {
								this.setTimeout(() => {
									this._handleOver();
									if (this.get("tooltipText")) {
										this.showTooltip();
									}
									this.setPrivateRaw("touchHovering", true);
								}, 10)
							}
						}
					}),

					events.on("globalpointerup", (ev) => {
						if ($utils.isTouchEvent(ev.originalEvent)) {
							if (this.getPrivate("touchHovering")) {
								this._handleOut();
								if (this.get("tooltipText")) {
									this.hideTooltip();
								}
							}
							this.setPrivateRaw("touchHovering", false);
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
				if (this._hoverDp) {
					this._hoverDp.dispose();
					this._hoverDp = undefined;
				}
			}
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

	protected _handleDown(e: ISpritePointerEvent) {
		if (!this.isHidden() && !this.get("disabled")) {
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
			const x = e.point.x - dragEvent.point.x;
			const y = e.point.y - dragEvent.point.y;

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

				this.set("x", dragPoint.x + x);
				this.set("y", dragPoint.y + y);

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

	protected _getBounds() {
		this._localBounds = this._display.getLocalBounds();
	}

	/**
	 * Returns depth (how deep in the hierachy of the content tree) of this
	 * element.
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

			if (this.get("focusable") && this.isFocus()) {
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
		}
	}

	public _fixMinBounds(bounds: IBounds) {
		let minWidth = this.get("minWidth");
		let minHeight = this.get("minHeight");

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
			bounds.right = bounds.left + privateWidth;
		}

		if ($type.isNumber(privateHeight)) {
			bounds.bottom = bounds.top + privateHeight;
		}
	}

	protected _removeParent(parent: Container | undefined) {
		if (parent) {
			parent.children.removeValue(this);
			$array.removeFirst(parent._percentageSizeChildren, this);
			$array.removeFirst(parent._percentagePositionChildren, this);
		}
	}

	public _clearDirty() {
		super._clearDirty();
		this._sizeDirty = false;
	}

	/**
	 * Simulate hover over element.
	 */
	public hover() {
		this.showTooltip();
		this._handleOver();
	}

	/**
	 * Simulate unhover over element.
	 */
	public unhover(): void {
		this.hideTooltip();
		this._handleOut();
	}

	/**
	 * Shows element's [[Tooltip]].
	 */
	public showTooltip(point?: IPoint): Promise<void> | undefined {
		const tooltip = this.getTooltip();
		const tooltipText = this.get("tooltipText");

		if (tooltipText && tooltip) {
			const tooltipPosition = this.get("tooltipPosition");
			const tooltipTarget = this.getPrivate("tooltipTarget", this);

			if (tooltipPosition == "fixed" || !point) {
				point = this._display.toGlobal(tooltipTarget._getTooltipPoint());
			}

			tooltip.set("pointTo", point);
			tooltip.set("tooltipTarget", tooltipTarget);

			if (!tooltip.get("x")) {
				tooltip.set("x", point.x);
			}
			if (!tooltip.get("y")) {
				tooltip.set("y", point.y);
			}

			tooltip.label.set("text", tooltipText);
			const dataItem = this.dataItem;
			if (dataItem) {
				tooltip.label._setDataItem(dataItem);
			}
			tooltip.label.text.markDirtyText();
			const promise = tooltip.show();
			this.setPrivateRaw("showingTooltip", true);
			return promise;
		}
	}


	/**
	 * Hides element's [[Tooltip]].
	 */
	public hideTooltip(): Promise<void> | undefined {
		const tooltip = this.getTooltip();
		if (tooltip) {
			const promise = tooltip.hide();
			this.setPrivateRaw("showingTooltip", false);
			return promise;
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
	 * Returns [[Tooltip]] used for this element.
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
	 * Returns element's actual X position in pixels.
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
	 * Returns element's actual Y position in pixels.
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
	 * @return Global bounds
	 */
	public localBounds(): IBounds {
		return this._localBounds;
	}

	/**
	 * Returns adjusted local coordinates of the element's bounds.
	 *
	 * @ignore
	 * @return Global bounds
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
		const bounds = this.localBounds();
		const display = this._display;

		const p0 = display.toGlobal({ x: bounds.left, y: bounds.top });
		const p1 = display.toGlobal({ x: bounds.right, y: bounds.top });
		const p2 = display.toGlobal({ x: bounds.right, y: bounds.bottom });
		const p3 = display.toGlobal({ x: bounds.left, y: bounds.bottom });

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
	 * Plays initial reveal animation regardless if element is currently hidden
	 * or visible.
	 *
	 * @param   duration  Duration of the animation in milliseconds
	 * @param   delay     Delay showing of the element by X milliseconds
	 * @return            Promise
	 */
	public async appear(duration?: number, delay?: number): Promise<void> {
		await this.hide(0);
		if (delay) {
			return new Promise<void>((success, _error) => {
				this.setTimeout(() => {
					success(this.show(duration));
				}, delay);
			});

		}
		else {
			return this.show(duration);
		}
	}

	/**
	 * Shows currently hidden element and returns a `Promise` which completes
	 * when all showing animations are finished.
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
	 * @return Promise
	 */
	public async show(duration?: number): Promise<void> {
		if (!this._isShowing) {
			this._isHidden = false;
			this._isShowing = true;
			this._isHiding = false;

			if (this.states.lookup("default")!.get("visible")) {
				this.set("visible", true);
			}
			this._onShow(duration);

			const animations = this.states.applyAnimate("default", duration);
			await waitForAnimations(animations);

			this._isShowing = false;
		}
	}

	/**
	 * Hides the element and returns a `Promise` which completes when all hiding
	 * animations are finished.
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
	 * @return Promise
	 */
	public async hide(duration?: number): Promise<void> {
		if (!this._isHiding && !this._isHidden) {
			this._isHiding = true;
			this._isShowing = false;
			let state = this.states.lookup("hidden");
			if (!state) {
				state = this.states.create("hidden", {
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
	 * Returns `true` if this element is currently hidden.
	 *
	 * @return Is hidden?
	 */
	public isHidden(): boolean {
		return this._isHidden;
	}

	/**
	 * Returns `true` if this element is currently animating to a default state.
	 *
	 * @return Is showing?
	 */
	public isShowing(): boolean {
		return this._isShowing;
	}

	/**
	 * Returns `true` if this element is currently animating to a hidden state.
	 *
	 * @return Is hiding?
	 */
	public isHiding(): boolean {
		return this._isHiding;
	}

	/**
	 * Returns `true` if this element is currently hovered by a pointer.
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
	 * Returns `true` if this element is currently being dragged.
	 *
	 * @return Is dragged?
	 */
	public isDragging(): boolean {
		return this._isDragging;
	}

	/**
	 * Returns width of this element in pixels.
	 *
	 * @return Width (px)
	 */
	public width(): number {
		let width = this.get("width");
		let maxWidth = this.get("maxWidth");
		let minWidth = this.get("minWidth");
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
	 * Returns maximum allowed width of this element in pixels.
	 *
	 * @return Maximum width (px)
	 */
	public maxWidth(): number {
		let maxWidth = this.get("maxWidth");
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
	 * Returns maximum allowed height of this element in pixels.
	 *
	 * @return Maximum height (px)
	 */
	public maxHeight(): number {
		let maxHeight = this.get("maxHeight");
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
	 * Returns height of this element in pixels.
	 *
	 * @return Height (px)
	 */
	public height(): number {
		let height = this.get("height");
		let maxHeight = this.get("maxHeight");
		let minHeight = this.get("minHeight");
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

	protected _walkParents(f: (parent: Entity) => void): void {
		if (this._parent) {
			this._walkParent(f);
		}
	}

	protected _walkParent(f: (parent: Entity) => void): void {
		if (this._parent) {
			this._parent._walkParent(f);
		}

		f(this);
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
	 * Returns an instance of [[NumberFormatter]] used in this element.
	 *
	 * If this element does not have it set, global one form [[Root]] is used.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/using-formatters/} for more info
	 * @return NumberFormatter instace
	 */
	public getNumberFormatter(): NumberFormatter {
		return this.get("numberFormatter", this._root.numberFormatter);
	}

	/**
	 * Returns an instance of [[DateFormatter]] used in this element.
	 *
	 * If this element does not have it set, global one form [[Root]] is used.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/using-formatters/} for more info
	 * @return DateFormatter instace
	 */
	public getDateFormatter(): DateFormatter {
		return this.get("dateFormatter", this._root.dateFormatter);
	}

	/**
	 * Returns an instance of [[DurationFormatter]] used in this element.
	 *
	 * If this element does not have it set, global one form [[Root]] is used.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/using-formatters/} for more info
	 * @return DurationFormatter instace
	 */
	public getDurationFormatter(): DurationFormatter {
		return this.get("durationFormatter", this._root.durationFormatter);
	}

	/**
	 * Converts X/Y coordinate within this element to a global coordinate.
	 *
	 * @param  point  Local coordinate
	 * @return        Global coordinate
	 * @ignore
	 */
	public toGlobal(point: IPoint): IPoint {
		return this._display.toGlobal(point);
	}

	/**
	 * Converts global X/Y coordinate to a coordinate within this element.
	 *
	 * @param  point  Global coordinate
	 * @return        Local coordinate
	 * @ignore
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
	 * Moves sprite to the end of the parent's children array.
	 *
	 * Depending on `layout` setting of the parten container, it may effect the
	 * positioning or overlapping order of the elements.
	 */
	public toFront() {
		const parent = this.parent;
		if (parent) {
			parent.children.moveValue(this, parent.children.length - 1);
		}
	}

	/**
	 * Moves sprite to the beginning of the parent's children array.
	 *
	 * Depending on `layout` setting of the parten container, it may effect the
	 * positioning or overlapping order of the elements.
	 */
	public toBack() {
		const parent = this.parent;
		if (parent) {
			parent.children.moveValue(this, 0);
		}
	}

}

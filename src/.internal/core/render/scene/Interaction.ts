/** @ignore *//** */

import type { IPoint } from "../../util/IPoint";
import type { IRendererEvent, IRendererEvents, IPointerEvent, Id } from "../backend/Renderer";
import { ArrayDisposer, Disposer, IDisposer, CounterDisposer, MultiDisposer } from "../../util/Disposer";
import * as $utils from "../../util/Utils";
import * as $array from "../../util/Array";
import * as $object from "../../util/Object";


/**
 * A display object as the interaction code sees it.
 *
 * @ignore
 */
export interface IInteractiveNode<N> {
	interactive: boolean;
	wheelable: boolean;
	cursorOverStyle?: string;
	_replacedCursorStyle?: string;
	_parent: N | undefined;
	contains(child: N): boolean;
	shouldCancelTouch(): boolean;
}

/**
 * @ignore
 */
export interface IInteractionEvent<A> extends IRendererEvent<A> {
	originalPoint: IPoint;
	bbox: DOMRect;
}

/**
 * What the renderer provides: its DOM element, DOM event to chart
 * coordinates, and a hit test.
 *
 * @ignore
 */
export interface IInteractionHost<N> {
	readonly view: HTMLElement;
	getEvent<A extends IPointerEvent>(originalEvent: A): IInteractionEvent<A>;

	/**
	 * The object under `point`: `false` over empty chart area, `undefined`
	 * outside the chart or when `target` is not the renderer's own element.
	 */
	_getHitTarget(point: IPoint, bbox: DOMRect, target: Node | null): N | undefined | false;
}

/**
 * @ignore
 */
interface IEvent<N, Key extends keyof IRendererEvents> {
	object: N;
	context: unknown;
	callback: (event: IRendererEvents[Key]) => void;
	disposed: boolean;
}

/**
 * @ignore
 */
interface IEvents<N, Key extends keyof IRendererEvents> {
	disposer: IDisposer;
	callbacks: Array<IEvent<N, Key>>;
	dispatching: boolean;
	cleanup: boolean;
}

/**
 * @ignore
 */
function eachTargets<N extends IInteractiveNode<N>>(hitTarget: N, f: (target: N) => boolean): void {
	for (; ;) {
		if (hitTarget.interactive) {
			if (!f(hitTarget)) {
				break;
			}
		}

		if (hitTarget._parent) {
			hitTarget = hitTarget._parent;

		} else {
			break;
		}
	}
}

// TODO feature detection for mouse/touch/pointer
/**
 * @ignore
 */
function onPointerEvent(element: EventTarget, name: string, f: (event: Array<IPointerEvent>, target: Node | null) => void): IDisposer {
	return $utils.addEventListener(element, $utils.getRendererEvent(name), (event: MouseEvent | TouchEvent) => {
		const target = $utils.getEventTarget(event);

		let touches = (<any>event).touches;
		if (touches) {
			if (touches.length == 0) {
				touches = (<any>event).changedTouches;
			}

			f($array.copy(<TouchList>touches), target);

		} else {
			f([<MouseEvent>event], target);
		}
	});
}

/**
 * Pointer input for one renderer: DOM listeners, hover, drag, click,
 * double-click, wheel, cursor and tap-to-activate. Renderer-neutral; the
 * host supplies coordinates and the hit test.
 *
 * @ignore
 */
export class InteractionManager<N extends IInteractiveNode<N>> extends ArrayDisposer {
	public interactionsEnabled: boolean = true;

	public tapToActivate: boolean = false;
	public tapToActivateTimeout: number = 3000;
	public _touchActive: boolean = false;
	protected _touchActiveTimeout?: number;

	// TODO this should store the Id as well
	public _hovering: Set<N> = new Set();
	public _dragging: Array<{ id: Id, value: N }> = [];
	public _mousedown: Array<{ id: Id, value: N }> = [];

	protected _listeners: { [key: string]: CounterDisposer } = {};
	protected _events: { [Key in keyof IRendererEvents]?: IEvents<N, Key> } = {};

	protected _lastPointerMoveEvent: { events: Array<IPointerEvent>, target: Node | null, native: boolean } | undefined;

	constructor(protected _host: IInteractionHost<N>) {
		super();

		const view = _host.view;

		this._disposers.push(new Disposer(() => {
			$object.each(this._events, (_key, events) => {
				events.disposer.dispose();
			});
		}));

		// We need this in order top prevent default touch gestures when dragging
		// draggable elements
		if ($utils.supports("touchevents")) {
			const listener = (ev: any) => {
				if (this._dragging.length !== 0) {
					$array.eachContinue(this._dragging, (item) => {
						if (item.value.shouldCancelTouch()) {
							ev.preventDefault();
							return false;
						}
						return true;
					});
				}

				// If touch down happends, delay touch out
				if (this._touchActiveTimeout) {
					this._delayTouchDeactivate();
				}
			};

			this._disposers.push($utils.addEventListener(window, "touchstart", listener, { passive: false }));
			this._disposers.push($utils.addEventListener(view, "touchstart", listener, { passive: false }));

			this._disposers.push($utils.addEventListener(view, "touchmove", () => {
				// If touch is moving, delay touch out
				if (this._touchActiveTimeout) {
					this._delayTouchDeactivate();
				}
			}, { passive: true }));

			this._disposers.push($utils.addEventListener(window, "click", (_ev: any) => {
				this._touchActive = false;
			}, { passive: true }));

			this._disposers.push($utils.addEventListener(view, "click", (_ev: any) => {
				window.setTimeout(() => {
					this._touchActive = true;
					this._delayTouchDeactivate();
				}, 100);
			}, { passive: true }));

		}

		// Prevent scrolling of the window when hovering on "wheelable" object
		if ($utils.supports("wheelevents")) {
			this._disposers.push($utils.addEventListener(view, "wheel", (ev) => {
				let prevent = false;
				this._hovering.forEach((obj) => {
					if (obj.wheelable) {
						prevent = true;
						return false;
					}
				});
				if (prevent) {
					ev.preventDefault();
				}
			}, { passive: false }));
		}
	}

	protected _delayTouchDeactivate(): void {
		if (this._touchActiveTimeout) {
			clearTimeout(this._touchActiveTimeout);
		}
		if (this.tapToActivateTimeout > 0) {
			this._touchActiveTimeout = window.setTimeout(() => {
				this._touchActive = false;
			}, this.tapToActivateTimeout);
		}
	}

	/**
	 * Re-runs hover for the last pointer position, after a render may have
	 * moved things under it.
	 */
	public afterRender(): void {
		if (this._hovering.size && this._lastPointerMoveEvent) {
			const { events, target, native } = this._lastPointerMoveEvent;

			$array.each(events, (event) => {
				this._dispatchGlobalMousemove(event, target, native);
			});
		}
	}

	_withEvents<Key extends keyof IRendererEvents>(key: Key, f: (events: IEvents<N, Key>) => void): void {
		const events = this._events[key] as IEvents<N, Key> | undefined;

		if (events !== undefined) {
			events.dispatching = true;

			try {
				f(events);

			} finally {
				events.dispatching = false;

				if (events.cleanup) {
					events.cleanup = false;

					$array.keepIf(events.callbacks, (callback) => {
						return !callback.disposed;
					});

					if (events.callbacks.length === 0) {
						events.disposer.dispose();
						delete this._events[key];
					}
				}
			}
		}
	}

	_dispatchEventAll<Key extends keyof IRendererEvents>(key: Key, event: IRendererEvents[Key]): void {
		if (!this.interactionsEnabled) {
			return;
		}

		this._withEvents(key, (events) => {
			$array.each(events.callbacks, (callback) => {
				if (!callback.disposed) {
					callback.callback.call(callback.context, event);
				}
			});
		});
	}

	_dispatchEvent<Key extends keyof IRendererEvents>(key: Key, target: N, event: IRendererEvents[Key]): boolean {
		if (!this.interactionsEnabled) {
			return false;
		}

		let dispatched = false;

		this._withEvents(key, (events) => {
			$array.each(events.callbacks, (callback) => {
				if (!callback.disposed && callback.object === target) {
					callback.callback.call(callback.context, event);
					dispatched = true;
				}
			});
		});

		return dispatched;
	}

	_dispatchMousedown(originalEvent: IPointerEvent, originalTarget: Node | null): void {
		const button = (<PointerEvent>originalEvent).button;
		if (button != 0 && button != 2 && button != 1 && button !== undefined) {
			// Ignore non-primary mouse buttons
			return;
		}

		const event = this._host.getEvent(originalEvent);
		const target = this._host._getHitTarget(event.originalPoint, event.bbox, originalTarget);


		if (target) {
			const id = event.id;

			let dragged = false;

			eachTargets(target, (obj) => {
				const info = { id: id, value: obj };

				this._mousedown.push(info);

				if (!dragged && this._dispatchEvent("pointerdown", obj, event)) {
					// Only dispatch the first element which matches
					dragged = true;

					const has = this._dragging.some((x) => {
						return x.value === obj && x.id === id;
					});

					if (!has) {
						this._dragging.push(info);
					}

				}

				return true;
			});
		}

		// Target-independent, mirroring globalpointermove/globalpointerup.
		this._dispatchEventAll("globalpointerdown", event);
	}

	_dispatchGlobalMousemove(originalEvent: IPointerEvent, originalTarget: Node | null, native: boolean): void {
		const event = this._host.getEvent(originalEvent);

		const target = this._host._getHitTarget(event.originalPoint, event.bbox, originalTarget);
		event.native = native;

		if (target) {
			this._hovering.forEach((obj) => {
				if (!obj.contains(target)) {
					this._hovering.delete(obj);
					if (obj.cursorOverStyle) {
						$utils.setStyle(document.body, "cursor", obj._replacedCursorStyle!);
					}
					this._dispatchEvent("pointerout", obj, event);
				}
			});

			if (event.native) {
				eachTargets(target, (obj) => {
					if (!this._hovering.has(obj)) {
						this._hovering.add(obj);
						if (obj.cursorOverStyle) {
							obj._replacedCursorStyle = $utils.getStyle(document.body, "cursor");
							$utils.setStyle(document.body, "cursor", obj.cursorOverStyle);
						}
						this._dispatchEvent("pointerover", obj, event);
					}

					return true;
				});
			}

			//} else if (target === false) {
		} else {
			this._hovering.forEach((obj) => {
				if (obj.cursorOverStyle) {
					$utils.setStyle(document.body, "cursor", obj._replacedCursorStyle!);
				}
				this._dispatchEvent("pointerout", obj, event);
			});

			this._hovering.clear();
		}
		this._dispatchEventAll("globalpointermove", event);
	}

	removeHovering(obj: N) {
		this._hovering.delete(obj);
		if (obj.cursorOverStyle) {
			$utils.setStyle(document.body, "cursor", obj._replacedCursorStyle!);
		}
	}

	_dispatchGlobalMouseup(originalEvent: IPointerEvent, native: boolean): void {
		const event = this._host.getEvent(originalEvent);
		event.native = native;
		this._dispatchEventAll("globalpointerup", event);
	}

	_dispatchDragMove(originalEvent: IPointerEvent): void {
		if (this._dragging.length !== 0) {
			const event = this._host.getEvent(originalEvent);
			const id = event.id;

			this._dragging.forEach((obj) => {
				if (obj.id === id) {
					this._dispatchEvent("pointermove", obj.value, event);
				}
			});
		}
	}

	_dispatchDragEnd(originalEvent: IPointerEvent, originalTarget: Node | null): void {
		const button = (<PointerEvent>originalEvent).button;
		let clickevent: "click" | "rightclick" | "middleclick";
		if (button == 0 || button === undefined) {
			clickevent = "click";
		}
		else if (button == 2) {
			clickevent = "rightclick";
		}
		else if (button == 1) {
			clickevent = "middleclick";
		}
		else {
			// Ignore non-primary mouse buttons
			return;
		}

		const event = this._host.getEvent(originalEvent);
		const id = event.id;

		if (this._mousedown.length !== 0) {
			const target = this._host._getHitTarget(event.originalPoint, event.bbox, originalTarget);

			if (target) {
				this._mousedown.forEach((obj) => {
					if (obj.id === id && obj.value.contains(target)) {
						this._dispatchEvent(clickevent, obj.value, event);
					}
				});
			}

			this._mousedown.length = 0;
		}

		if (this._dragging.length !== 0) {
			this._dragging.forEach((obj) => {
				if (obj.id === id) {
					this._dispatchEvent("pointerup", obj.value, event);
				}
			});

			this._dragging.length = 0;
		}
	}

	_dispatchDoubleClick(originalEvent: IPointerEvent, originalTarget: Node | null): void {
		const event = this._host.getEvent(originalEvent);
		const target = this._host._getHitTarget(event.originalPoint, event.bbox, originalTarget);

		if (target) {
			eachTargets(target, (obj) => {
				if (this._dispatchEvent("dblclick", obj, event)) {
					return false;
				} else {
					return true;
				}
			});
		}
	}

	_dispatchWheel(originalEvent: WheelEvent, originalTarget: Node | null): void {
		const event = this._host.getEvent(originalEvent);
		const target = this._host._getHitTarget(event.originalPoint, event.bbox, originalTarget);

		if (target) {
			eachTargets(target, (obj) => {
				if (this._dispatchEvent("wheel", obj, event)) {
					return false;
				} else {
					return true;
				}
			});
		}
	}

	_makeSharedEvent(key: string, f: () => IDisposer): IDisposer {
		if (this._listeners[key] === undefined) {
			const listener = f();

			this._listeners[key] = new CounterDisposer(() => {
				delete this._listeners[key];
				listener.dispose();
			});
		}

		return this._listeners[key].increment();
	}

	_onPointerEvent(name: string, f: (event: Array<IPointerEvent>, target: Node | null, native: boolean) => void): IDisposer {
		let native = false;
		let timer: number | null = null;

		function clear() {
			timer = null;
			native = false;
		}

		return new MultiDisposer([
			new Disposer(() => {
				if (timer !== null) {
					clearTimeout(timer);
				}

				clear();
			}),

			$utils.addEventListener(this._host.view, $utils.getRendererEvent(name), (_) => {
				native = true;

				if (timer !== null) {
					clearTimeout(timer);
				}

				timer = window.setTimeout(clear, 0);
			}),

			onPointerEvent(window, name, (ev, target) => {
				if (timer !== null) {
					clearTimeout(timer);
					timer = null;
				}

				f(ev, target, native);

				native = false;
			}),
		]);
	}

	// This ensures that only a single DOM event is added (e.g. only a single mousemove event listener)
	_initEvent(key: keyof IRendererEvents): IDisposer | undefined {
		switch (key) {
			case "globalpointermove":
			case "pointerover":
			case "pointerout":
				return this._makeSharedEvent("pointermove", () => {
					const listener = (events: Array<IPointerEvent>, target: Node | null, native: boolean) => {
						this._lastPointerMoveEvent = { events, target, native };

						$array.each(events, (event) => {
							this._dispatchGlobalMousemove(event, target, native);
						});
					};

					return new MultiDisposer([
						this._onPointerEvent("pointerdown", listener),
						this._onPointerEvent("pointermove", listener),
					]);
				});
			case "globalpointerup":
				return this._makeSharedEvent("pointerup", () => {
					const mouseup = this._onPointerEvent("pointerup", (events, target, native) => {
						$array.each(events, (event) => {
							this._dispatchGlobalMouseup(event, native);
						});
						this._lastPointerMoveEvent = { events, target, native };
					});

					const pointercancel = this._onPointerEvent("pointercancel", (events, target, native) => {
						$array.each(events, (event) => {
							this._dispatchGlobalMouseup(event, native);
						});
						this._lastPointerMoveEvent = { events, target, native };
					});

					return new Disposer(() => {
						mouseup.dispose();
						pointercancel.dispose();
					});
				});
			case "click":
			case "rightclick":
			case "middleclick":
			case "pointerdown":
			// Must share the "pointerdown" bundle: a separate one would win the
			// slot and leave later subscribers without dragmove/dragend.
			case "globalpointerdown":
			case "pointermove":
			case "pointerup":
				return this._makeSharedEvent("pointerdown", () => {
					const mousedown = this._onPointerEvent("pointerdown", (events, target) => {
						$array.each(events, (ev) => {
							this._dispatchMousedown(ev, target);
						});
					});

					// TODO handle throttling properly for multitouch
					const mousemove = this._onPointerEvent("pointermove", (ev: Array<IPointerEvent>) => {
						$array.each(ev, (ev) => {
							this._dispatchDragMove(ev);
						});
					});

					const mouseup = this._onPointerEvent("pointerup", (ev: Array<IPointerEvent>, target) => {
						$array.each(ev, (ev) => {
							this._dispatchDragEnd(ev, target);
						});
					});

					const pointercancel = this._onPointerEvent("pointercancel", (ev: Array<IPointerEvent>, target) => {
						$array.each(ev, (ev) => {
							this._dispatchDragEnd(ev, target);
						});
					});

					return new Disposer(() => {
						mousedown.dispose();
						mousemove.dispose();
						mouseup.dispose();
						pointercancel.dispose();
					});
				});
			case "dblclick":
				return this._makeSharedEvent("dblclick", () => {
					return this._onPointerEvent("dblclick", (ev, target) => {
						$array.each(ev, (ev) => {
							this._dispatchDoubleClick(ev, target);
						});
					});
				});
			case "wheel":
				return this._makeSharedEvent("wheel", () => {
					return $utils.addEventListener(this._host.view, $utils.getRendererEvent("wheel"), (event: WheelEvent) => {
						this._dispatchWheel(event, $utils.getEventTarget(event));
					}, { passive: false });
				});
		}
	}

	addEvent<C, Key extends keyof IRendererEvents>(object: N, key: Key, callback: (this: C, event: IRendererEvents[Key]) => void, context?: C): IDisposer {
		let events: IEvents<N, Key> | undefined = this._events[key] as any;

		if (events === undefined) {
			events = this._events[key] = {
				disposer: this._initEvent(key)!,
				callbacks: [],
				dispatching: false,
				cleanup: false,
			} as any;
		}

		const listener = { object, context, callback, disposed: false };

		events!.callbacks.push(listener);

		return new Disposer(() => {
			listener.disposed = true;

			if (events!.dispatching) {
				events!.cleanup = true;

			} else {
				$array.removeFirst(events!.callbacks, listener);

				if (events!.callbacks.length === 0) {
					events!.disposer.dispose();
					delete this._events[key];
				}
			}
		});
	}
}

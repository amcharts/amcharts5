import type { Time } from "../../core/util/Animation";
import type { Animation } from "../../core/util/Entity";
import type { IDisposer } from "../../core/util/Disposer";
import type { IPoint } from "../../core/util/IPoint";
import type { ISpritePointerEvent } from "../../core/render/Sprite";

import { Container, IContainerSettings, IContainerPrivate, IContainerEvents } from "../../core/render/Container";
import { p100 } from "../../core/util/Percent";
import { Rectangle } from "../../core/render/Rectangle";
import { color } from "../../core/util/Color";

import * as $utils from "../../core/util/Utils";
import * as $math from "../../core/util/Math";
import * as $object from "../../core/util/Object";
import * as $type from "../../core/util/Type";

export interface IZoomableContainerSettings extends IContainerSettings {

	/**
	 * Maximum zoom-in level.
	 * 
	 * @default 32
	 */
	maxZoomLevel?: number;

	/**
	 * Maximum zoom-out level.
	 * 
	 * @default 1
	 */
	minZoomLevel?: number;

	/**
	 * Zoom level increase/decrease factor with each zoom action.
	 * 
	 * @defult 2
	 */
	zoomStep?: number;

	/**
	 * Pinch-zooming is enabled on touch devices.
	 *
	 * @default true
	 */
	pinchZoom?: boolean;

	/**
	 * Animation duration (ms) for zoom animations.
	 *
	 * @default 600
	 */
	animationDuration?: number;

	/**
	 * Easing function to use for zoom animations.
	 * 
	 * @default am5.ease.out(am5.ease.cubic)
	 */
	animationEasing?: (t: Time) => Time;

	/**
	 * How much of a content can go outside the viewport.
	 *
	 * @default 0.4
	 */
	maxPanOut?: number;

}

export interface IZoomableContainerPrivate extends IContainerPrivate {
}

export interface IZoomableContainerEvents extends IContainerEvents {
}

/**
 * A version of [[Container]] which adds zooming capabilities.
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/common-elements/containers/#Zoomable_container} for more info
 * @since 5.8.0
 * @important
 */
export class ZoomableContainer extends Container {
	public static className: string = "ZoomableContainer";
	public static classNames: Array<string> = Container.classNames.concat([ZoomableContainer.className]);

	declare public _settings: IZoomableContainerSettings;
	declare public _privateSettings: IZoomableContainerPrivate;
	declare public _events: IZoomableContainerEvents;

	protected _za?: Animation<this["_settings"]["scale"]>;
	protected _txa?: Animation<this["_settings"]["x"]>;
	protected _tya?: Animation<this["_settings"]["y"]>;


	protected _movePoints: { [index: number]: IPoint } = {};
	protected _downScale: number = 1;
	protected _downX: number = 0;
	protected _downY: number = 0;

	protected _pinchDP?: IDisposer;

	/**
	 * All elements must be added to `contents.children` instead of `children` of
	 * [[ZoomableContainer]].
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/common-elements/containers/#Zoomable_container} for more info
	 */
	public contents = this.children.push(Container.new(this._root, {
		width: p100,
		height: p100,
		x: 0,
		y: 0,
		draggable: true,
		background: Rectangle.new(this._root, {
			fill: color(0xffffff),
			fillOpacity: 0
		})
	}))

	protected _wheelDp: IDisposer | undefined;

	protected _afterNew(): void {
		super._afterNew();

		const events = this.contents.events;

		this._disposers.push(events.on("pointerdown", (event) => {
			this._handleThisDown(event);
		}));

		this._disposers.push(events.on("globalpointerup", (event) => {
			this._handleThisUp(event);
		}));

		this._disposers.push(events.on("globalpointermove", (event) => {
			this._handleThisMove(event);
		}));

		const bg = this.contents.get("background");
		if (bg) {
			bg.adapters.add("width", (width) => {
				return Number(width) * 20;
			})
			bg.adapters.add("height", (height) => {
				return Number(height) * 20;
			})
			bg.adapters.add("x", (x) => {
				return Number(x) - bg.width() / 2;
			})
			bg.adapters.add("y", (y) => {
				return Number(y) - bg.height() / 2;
			})
		}

		const contents = this.contents;

		contents.adapters.add("x", (x) => {
			const scale = contents.get("scale", 1);
			if($type.isNumber(x) && scale >= 1){
				let maxPanOut = this.get("maxPanOut", 0.4);
				let w = contents.width();

				x = Math.min(w * maxPanOut, x);
				x = Math.max(this.width() - w * scale * (1 + maxPanOut), x);
			}
			return x;
		})

		contents.adapters.add("y", (y) => {
			const scale = contents.get("scale", 1);
			if($type.isNumber(y) && scale >= 1){
				let maxPanOut = this.get("maxPanOut", 0.4);
				let h = contents.height();

				y = Math.min(h * maxPanOut, y);
				y = Math.max(this.height() - h * scale * (1 + maxPanOut), y);
			}
			return y;
		})
	}

	public _prepareChildren() {
		super._prepareChildren();
		if (this.isDirty("wheelable")) {
			this._handleSetWheel();
		}

		this.contents._display.cancelTouch = this.get("pinchZoom", false);
	}


	protected _handleSetWheel() {
		if (this.get("wheelable")) {
			if (this._wheelDp) {
				this._wheelDp.dispose();
			}

			this._wheelDp = this.events.on("wheel", (event) => {
				const wheelEvent = event.originalEvent;

				// Ignore wheel event if it is happening on a non-ZoomableContainer element, e.g. if
				// some page element is over the ZoomableContainer.
				if ($utils.isLocalEvent(wheelEvent, this)) {
					wheelEvent.preventDefault();
				}
				else {
					return;
				}

				const point = this.toLocal(event.point);

				this._handleWheelZoom(wheelEvent.deltaY, point);
			});

			this._disposers.push(this._wheelDp);
		}
		else {
			if (this._wheelDp) {
				this._wheelDp.dispose();
			}
		}
	}

	protected _handleWheelZoom(delta: number, point: IPoint) {
		let step = this.get("zoomStep", 2);
		let zoomLevel = this.contents.get("scale", 1);

		let newZoomLevel = zoomLevel;
		if (delta > 0) {
			newZoomLevel = zoomLevel / step;
		}
		else if (delta < 0) {
			newZoomLevel = zoomLevel * step;
		}

		if (newZoomLevel != zoomLevel) {
			this.zoomToPoint(point, newZoomLevel)
		}
	}

	/**
	 * Zooms to specific X/Y point.
	 * 
	 * @param   point  Center point
	 * @param   level  Zoom level
	 * @return         Zoom Animation object
	 */
	public zoomToPoint(point: IPoint, level: number): Animation<this["_settings"]["scale"]> | undefined {
		if (level) {
			level = $math.fitToRange(level, this.get("minZoomLevel", 1), this.get("maxZoomLevel", 32));
		}

		const zoomLevel = this.contents.get("scale", 1);

		let x = point.x;
		let y = point.y;

		let cx = x;
		let cy = y;

		const contents = this.contents;

		let tx = contents.x();
		let ty = contents.y();

		let xx = cx - ((x - tx) / zoomLevel * level);
		let yy = cy - ((y - ty) / zoomLevel * level);

		this._animateTo(xx, yy, level);

		return this._za;
	}

	/**
	 * Zooms the container contents in by `zoomStep`.
	 * 
	 * @return Zoom Animation object
	 */
	public zoomIn(): Animation<this["_settings"]["scale"]> | undefined {
		return this.zoomToPoint({ x: this.width() / 2, y: this.height() / 2 }, this.contents.get("scale", 1) * this.get("zoomStep", 2));
	}

	/**
	 * Zooms the container contents out by `zoomStep`.
	 * 
	 * @return Zoom Animation object
	 */
	public zoomOut(): Animation<this["_settings"]["scale"]> | undefined {
		return this.zoomToPoint({ x: this.width() / 2, y: this.height() / 2 }, this.contents.get("scale", 1) / this.get("zoomStep", 2));
	}

	/**
	 * Fully zooms out the container contents.
	 * 
	 * @return Zoom Animation object
	 */
	public goHome() {
		return this._animateTo(0, 0, 1);
	}

	protected _animateTo(x: number, y: number, scale: number) {
		const duration = this.get("animationDuration", 0);
		const easing = this.get("animationEasing");

		const contents = this.contents;
		this._txa = contents.animate({ key: "x", to: x, duration: duration, easing: easing });
		this._tya = contents.animate({ key: "y", to: y, duration: duration, easing: easing });
		this._za = contents.animate({ key: "scale", to: scale, duration: duration, easing: easing });
	}


	protected _handleThisUp(_event: ISpritePointerEvent) {
		this._downPoints = {}
	}

	protected _handleThisDown(event: ISpritePointerEvent) {

		const contents = this.contents;

		this._downScale = contents.get("scale", 1);
		const downPoints = contents._downPoints;

		let count = $object.keys(downPoints).length;

		if (count == 1) {
			// workaround to solve a problem when events are added to some children of chart container (rotation stops working)
			let downPoint = downPoints[1];
			if (!downPoint) {
				downPoint = downPoints[0];
			}

			if (downPoint && (downPoint.x == event.point.x && downPoint.y == event.point.y)) {
				count = 0;
			}
		}

		if (count > 0) {
			this._downX = contents.x();
			this._downY = contents.y();

			const downId = contents._getDownPointId();
			if (downId) {
				let movePoint = this._movePoints[downId];
				if (movePoint) {
					contents._downPoints[downId] = movePoint;
				}
			}
		}
	}


	protected _handleThisMove(event: ISpritePointerEvent) {
		const originalEvent = event.originalEvent as any;

		const pointerId = originalEvent.pointerId;

		if (this.get("pinchZoom")) {
			if (pointerId) {
				this._movePoints[pointerId] = event.point;

				if ($object.keys(this.contents._downPoints).length > 1) {
					this._handlePinch();
					return;
				}
			}
		}
	}

	protected _handlePinch() {
		let i = 0;
		let downPoints: Array<IPoint> = [];
		let movePoints: Array<IPoint> = [];

		$object.each(this.contents._downPoints, (k, point) => {
			downPoints[i] = point;
			let movePoint = this._movePoints[k];
			if (movePoint) {
				movePoints[i] = movePoint;
			}
			i++;
		});

		if (downPoints.length > 1 && movePoints.length > 1) {

			this.contents._isDragging = false;

			let downPoint0 = downPoints[0];
			let downPoint1 = downPoints[1];

			let movePoint0 = movePoints[0];
			let movePoint1 = movePoints[1];

			if (downPoint0 && downPoint1 && movePoint0 && movePoint1) {
				downPoint0 = this.toLocal(downPoint0);
				downPoint1 = this.toLocal(downPoint1);

				movePoint0 = this.toLocal(movePoint0);
				movePoint1 = this.toLocal(movePoint1);

				let initialDistance = Math.hypot(downPoint1.x - downPoint0.x, downPoint1.y - downPoint0.y);
				let currentDistance = Math.hypot(movePoint1.x - movePoint0.x, movePoint1.y - movePoint0.y);

				let level = currentDistance / initialDistance * this._downScale;
				let moveCenter = { x: movePoint0.x + (movePoint1.x - movePoint0.x) / 2, y: movePoint0.y + (movePoint1.y - movePoint0.y) / 2 };
				let downCenter = { x: downPoint0.x + (downPoint1.x - downPoint0.x) / 2, y: downPoint0.y + (downPoint1.y - downPoint0.y) / 2 };

				let tx = this._downX || 0;
				let ty = this._downY || 0;

				let zoomLevel = this._downScale;

				let xx = moveCenter.x - (- tx + downCenter.x) / zoomLevel * level;
				let yy = moveCenter.y - (- ty + downCenter.y) / zoomLevel * level;

				this.contents.setAll({
					x: xx,
					y: yy,
					scale: level
				});
			}
		}
	}
}
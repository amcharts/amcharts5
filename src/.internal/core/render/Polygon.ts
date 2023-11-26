import { Graphics, IGraphicsSettings, IGraphicsPrivate } from "./Graphics";
import type { IPoint } from "../util/IPoint";
import * as $array from "../util/Array";

import type { Time } from "../util/Animation";
import type { Animation } from "../util/Entity";

export interface IPolygonSettings extends IGraphicsSettings {

	/**
	 * An array of polygon corner coordinates.
	 */
	points?: Array<IPoint>;

	/**
	 * Corodinates.
	 */
	coordinates?: Array<Array<number>>;

	/**
	 * Number of milliseconds to play morph animation.
	 */
	animationDuration?: number;

	/**
	 * Easing function to use for animations.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/animations/#Easing_functions} for more info
	 */
	animationEasing?: (t: Time) => Time;

}

export interface IPolygonPrivate extends IGraphicsPrivate {
	points?: Array<IPoint>;

	previousPoints?: Array<IPoint>;

	morphProgress?: number;

	minX?: number;

	maxX?: number;

	minY?: number;

	maxY?: number;
}

/**
 * Draws a polygon.
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/common-elements/polygon/} for more info
 * @important
 * @since 5.4.0
 */
export class Polygon extends Graphics {

	declare public _settings: IPolygonSettings;
	declare public _privateSettings: IPolygonPrivate;

	public static className: string = "Polygon";
	public static classNames: Array<string> = Graphics.classNames.concat([Polygon.className]);

	public morphAnimation?: Animation<this["_privateSettings"]["morphProgress"]>;

	public _beforeChanged() {
		super._beforeChanged();
		if (this.isDirty("coordinates")) {
			const points: Array<IPoint> = [];
			const coordinates = this.get("coordinates");
			if (coordinates) {
				$array.each(coordinates, (coord) => {
					points.push({ x: coord[0], y: coord[1] });
				})
			}
			this.set("points", points);
		}
		if (this.isPrivateDirty("points")) {
			this._clear = true;
		}

		if (this.isDirty("points")) {
			this._clear = true;

			const points = this.get("points");
			const prevPoints = this._prevSettings.points;
			if (prevPoints) {
				if (points) {
					let copy = $array.copy(points);
					let prevCopy = $array.copy(prevPoints);
					let cl = copy.length;
					let pl = prevCopy.length;

					if (cl > pl) {
						let newCopy = $array.copy(copy);
						for (let i = 0; i < cl; i++) {
							let index = Math.floor(i / cl * pl);
							newCopy[i] = { x: prevCopy[index].x, y: prevCopy[index].y };
						}
						prevCopy = newCopy;
					}
					else if (pl > cl) {
						let newCopy = $array.copy(prevCopy);
						for (let i = 0; i < pl; i++) {
							let index = Math.floor(i / pl * cl);
							newCopy[i] = { x: copy[index].x, y: copy[index].y };
						}
						copy = newCopy;
					}

					this.setPrivateRaw("previousPoints", prevCopy);
					this.setPrivateRaw("points", copy);
					this.morphAnimation = this.animatePrivate({ key: "morphProgress", from: 0, to: 1, duration: this.get("animationDuration", 0), easing: this.get("animationEasing") });
					// solves no animated theme
					this._root.events.once("frameended", ()=>{
						this._markDirtyPrivateKey("morphProgress");
					})
				}
			}
			else {
				this.setPrivateRaw("previousPoints", points);
				this.setPrivateRaw("points", points);
			}
			let minX = Infinity;
			let maxX = -Infinity;
			let minY = Infinity;
			let maxY = -Infinity;

			if (points) {
				for (let i = 1, len = points.length; i < len; i++) {
					const point = points[i];
					minX = Math.min(minX, point.x);
					maxX = Math.max(maxX, point.x);

					minY = Math.min(minY, point.y);
					maxY = Math.max(maxY, point.y);
				}
			}

			this.setPrivate("minX", minX);
			this.setPrivate("maxX", maxX);
			this.setPrivate("minY", minY);
			this.setPrivate("maxY", minY);
		}



		if (this.isPrivateDirty("morphProgress")) {
			this._clear = true;
		}
	}

	public _changed() {
		super._changed();

		if (this._clear) {
			this._draw();
		}
	}

	protected _draw() {
		const previousPoints = this.getPrivate("previousPoints");
		const points = this.getPrivate("points");
		const morphProgress = this.getPrivate("morphProgress", 1);

		if (points && previousPoints) {
			const first = points[0];
			const prevFirst = previousPoints[0];
			if (first) {
				this._display.moveTo(prevFirst.x + (first.x - prevFirst.x) * morphProgress, prevFirst.y + (first.y - prevFirst.y) * morphProgress);
			}
			for (let i = 1, len = points.length; i < len; i++) {
				const point = points[i];
				const prevPoint = previousPoints[i];
				this._display.lineTo(prevPoint.x + (point.x - prevPoint.x) * morphProgress, prevPoint.y + (point.y - prevPoint.y) * morphProgress);
			}
			this._display.closePath();
		}
	}

	public _updateSize() {
		this.markDirty()
		this._clear = true;
	}
}

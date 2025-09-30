import { Graphics, IGraphicsSettings, IGraphicsPrivate } from "./Graphics";
import type { IPoint } from "../util/IPoint";

export interface IOrthogonalLineSettings extends IGraphicsSettings {

	/**
	 * A list of [[IPoint]] (x/y coordinates) points for the Orthogonal Line.
	 */
	points?: Array<IPoint>;

	/**
	 * Corner radius between segments.
	 */
	cornerRadius?: number;
}

export interface IOrthogonalLinePrivate extends IGraphicsPrivate {
}

/**
 * Draws an Orthogonal line.
 *
 * @important
 * @since 5.14.0
 */
export class OrthogonalLine extends Graphics {

	declare public _settings: IOrthogonalLineSettings;
	declare public _privateSettings: IOrthogonalLinePrivate;

	public static className: string = "OrthogonalLine";
	public static classNames: Array<string> = Graphics.classNames.concat([OrthogonalLine.className]);

	public _beforeChanged() {
		super._beforeChanged();

		if (this.isDirty("points")) {
			this._clear = true;
		}
	}

	public static makeOrthogonal(points: Array<IPoint>): Array<IPoint> {
		// Insert intermediate points to ensure only orthogonal (horizontal/vertical) segments
		if (points.length > 1) {
			const orthogonalPoints: Array<IPoint> = [];
			for (let i = 0; i < points.length - 1; i++) {
				const curr = points[i];
				const next = points[i + 1];
				orthogonalPoints.push(curr);

				// If the segment is not orthogonal, insert an intermediate point
				if (curr.x !== next.x && curr.y !== next.y) {
					orthogonalPoints.push({ x: next.x, y: curr.y });
				}
			}
			orthogonalPoints.push(points[points.length - 1]);
			points = orthogonalPoints;
		}
		return points;
	}

	/**
	 * Handles changes and redraws the orthogonal line with optional rounded corners.
	 */
	public _changed() {
		super._changed();

		if (this._clear) {
			const display = this._display;
			let points: Array<IPoint> = this.get("points", []);


			// Early exit if no points
			if (points.length === 0) {
				return;
			}

			points = OrthogonalLine.makeOrthogonal(points);

			display.moveTo(points[0].x, points[0].y);

			// Draw the orthogonal line with optional rounded corners
			for (let i = 1; i < points.length; i++) {
				let cornerRadius = this.get("cornerRadius", 0);
				const prev = points[i - 1];
				const curr = points[i];
				const next = points[i + 1];

				const isHorizontal = curr.y === prev.y && curr.x !== prev.x;
				const isVertical = curr.x === prev.x && curr.y !== prev.y;

				// Only add rounded corners if direction changes
				const directionChanged =
					next &&
					((isHorizontal && next.y !== curr.y) ||
						(isVertical && next.x !== curr.x));

				if (
					cornerRadius > 0 &&
					next &&
					directionChanged
				) {
					if (isVertical) {
						cornerRadius = Math.min(cornerRadius, Math.abs(curr.x - next.x) / 2, Math.abs(curr.y - prev.y) / 2);
						const signY = Math.sign(curr.y - prev.y);
						display.lineTo(curr.x, curr.y - cornerRadius * signY);

						const signX = next.x < curr.x ? -1 : 1;
						display.arcTo(
							curr.x,
							curr.y,
							curr.x + cornerRadius * signX,
							curr.y,
							cornerRadius
						);
					} else if (isHorizontal) {
						cornerRadius = Math.min(cornerRadius, Math.abs(curr.y - next.y) / 2, Math.abs(curr.x - prev.x) / 2);
						const signX = Math.sign(curr.x - prev.x);
						display.lineTo(curr.x - cornerRadius * signX, curr.y);

						const signY = next.y < curr.y ? -1 : 1;
						display.arcTo(
							curr.x,
							curr.y,
							curr.x,
							curr.y + cornerRadius * signY,
							cornerRadius
						);
					}
				} else {
					// Draw straight segment
					display.lineTo(curr.x, curr.y);
				}
			}

		}
	}

}

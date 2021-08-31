import type { Root } from "../../core/Root";
import { Graphics, IGraphicsSettings, IGraphicsPrivate } from "../../core/render/Graphics";
import type { MapLineSeries } from "./MapLineSeries";
import type { IGeoPoint } from "../../core/util/IGeoPoint";
import type { Template } from "../../core/util/Template";
import { geoLength, geoInterpolate, geoDistance } from "d3-geo";

export interface IMapLineSettings extends IGraphicsSettings {

	/**
	 * A GeoJSON representation of the polygons geometry.
	 */
	geometry?: GeoJSON.LineString | GeoJSON.MultiLineString;

	/**
	 * @todo needs description
	 * @default 0.5
	 */
	precision?: number;

}

export interface IMapLinePrivate extends IGraphicsPrivate {

	/**
	 * @ignore
	 */
	series: MapLineSeries;

}

/**
 * A line object in a [[MapLineSeries]].
 */
export class MapLine extends Graphics {

	/**
	 * Use this method to create an instance of this class.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/getting-started/#New_element_syntax} for more info
	 * @param   root      Root element
	 * @param   settings  Settings
	 * @param   template  Template
	 * @return            Instantiated object
	 */
	public static new(root: Root, settings: MapLine["_settings"], template?: Template<MapLine>): MapLine {
		const x = new MapLine(root, settings, true, template);
		x._afterNew();
		return x;
	}

	declare public _settings: IMapLineSettings;
	declare public _privateSettings: IMapLinePrivate;

	public static className: string = "MapLine";
	public static classNames: Array<string> = Graphics.classNames.concat([MapLine.className]);
	protected _projectionDirty: boolean = false;

	public _beforeChanged() {
		super._beforeChanged();

		if (this._projectionDirty || this.isDirty("geometry") || this.isDirty("precision")) {
			const geometry = this.get("geometry")!;
			if (geometry) {
				const series = this.getPrivate("series");
				if (series) {
					const chart = series.chart;
					if (chart) {
						const projection = chart.get("projection");
						let clipAngle: number | null = null;

						if (projection) {
							clipAngle = projection.clipAngle();
							projection.precision(this.get("precision", 0.5));
						}

						const geoPath = chart.getPrivate("geoPath");
						if (geoPath) {
							this._clear = true;

							this.set("draw", (_display) => {
								if (projection && series.get("clipBack") === false) {
									projection.clipAngle(180);
								}

								geoPath.context(this._display as any);
								geoPath(geometry);
								geoPath.context(null);

								if (projection) {
									projection.clipAngle(clipAngle as any);
								}
							})
						}
					}
				}
			}
		}
	}

	/**
	 * @ignore
	 */
	public markDirtyProjection() {
		this.markDirty();
		this._projectionDirty = true;
	}

	public _clearDirty() {
		super._clearDirty();
		this._projectionDirty = false;
	}

	/**
	 * Converts relative position along the line (0-1) into pixel coordinates.
	 *
	 * @param position  Position (0-1)
	 * @return Coordinates
	 */
	public positionToGeoPoint(position: number): IGeoPoint {

		const geometry = this.get("geometry")!;

		if (geometry) {
			let totalDistance: number = geoLength(geometry);
			let currentDistance: number = 0;

			let distanceAB: number;
			let positionA: number = 0;
			let positionB: number = 0;
			let pointA!: [number, number];
			let pointB!: [number, number];

			let coordinates = geometry.coordinates;
			if (coordinates) {

				let segments!: number[][][];

				if (geometry.type == "LineString") {
					segments = [coordinates] as number[][][];
				}
				else if (geometry.type == "MultiLineString") {
					segments = coordinates as number[][][];
				}

				for (let s = 0; s < segments.length; s++) {
					let segment = segments[s];
					if (segment.length > 1) {
						for (let p = 1; p < segment.length; p++) {
							pointA = segment[p - 1] as [number, number];
							pointB = segment[p] as [number, number];

							positionA = currentDistance / totalDistance;
							distanceAB = geoDistance(pointA, pointB);
							currentDistance += distanceAB;
							positionB = currentDistance / totalDistance;

							if (positionA <= position && positionB > position) {
								s = segments.length;
								break;
							}
						}
					}
					else if (segment.length == 1) {
						pointA = segment[0] as [number, number];;
						pointB = segment[0] as [number, number];;
						positionA = 0;
						positionB = 1;
					}
				}

				if (pointA && pointB) {
					let positionAB: number = (position - positionA) / (positionB - positionA);
					let location = geoInterpolate(pointA, pointB)(positionAB);
					return { longitude: location[0], latitude: location[1] }
				}
			}
		}
		return { longitude: 0, latitude: 0 };
	}
}

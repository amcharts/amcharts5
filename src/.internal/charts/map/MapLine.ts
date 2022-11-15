import type { MapLineSeries, IMapLineSeriesDataItem } from "./MapLineSeries";
import type { IGeoPoint } from "../../core/util/IGeoPoint";
import type { DataItem } from "../../core/render/Component";


import { Graphics, IGraphicsSettings, IGraphicsPrivate } from "../../core/render/Graphics";
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
						const dataItem = this.dataItem as DataItem<IMapLineSeriesDataItem>;
						const geoPath = chart.getPrivate("geoPath");
						if (geoPath && dataItem) {
							this._clear = true;
							if (dataItem.get("lineType", series.get("lineType")) == "straight") {

								const geometry = this.get("geometry")!;

								if (geometry) {
									let coordinates = geometry.coordinates;
									if (coordinates) {

										let segments!: number[][][];

										if (geometry.type == "LineString") {
											segments = [coordinates] as number[][][];
										}
										else if (geometry.type == "MultiLineString") {
											segments = coordinates as number[][][];
										}

										this.set("draw", (display) => {
											for (let s = 0; s < segments.length; s++) {
												let segment = segments[s];
												if (segment.length > 0) {
													const gp0 = segment[0];
													const p0 = chart.convert({ longitude: gp0[0], latitude: gp0[1] })
													display.lineTo(p0.x, p0.y);

													for (let p = 0; p < segment.length; p++) {
														const gp = segment[p];
														const pn = chart.convert({ longitude: gp[0], latitude: gp[1] })
														display.lineTo(pn.x, pn.y);
													}
												}
											}
										})
									}
								}
							}
							else {
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
		const series = this.getPrivate("series");
		const chart = series.chart;
		const dataItem = this.dataItem as DataItem<IMapLineSeriesDataItem>;

		if (geometry && series && chart && dataItem) {
			const lineType = dataItem.get("lineType", series.get("lineType"));
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
						pointA = segment[0] as [number, number];
						pointB = segment[0] as [number, number];
						positionA = 0;
						positionB = 1;
					}
				}

				if (pointA && pointB) {
					let positionAB: number = (position - positionA) / (positionB - positionA);
					let location: number[];

					if (lineType == "straight") {
						let p0 = chart.convert({ longitude: pointA[0], latitude: pointA[1] });
						let p1 = chart.convert({ longitude: pointB[0], latitude: pointB[1] });

						let x = p0.x + (p1.x - p0.x) * positionAB;
						let y = p0.y + (p1.y - p0.y) * positionAB;

						return chart.invert({ x: x, y: y });
					}
					else {
						location = geoInterpolate(pointA, pointB)(positionAB);
						return { longitude: location[0], latitude: location[1] }
					}

				}
			}
		}
		return { longitude: 0, latitude: 0 };
	}
}

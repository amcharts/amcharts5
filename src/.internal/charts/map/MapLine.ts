import type { MapLineSeries, IMapLineSeriesDataItem } from "./MapLineSeries";
import type { MapSeries } from "./MapSeries";
import type { IGeoPoint } from "../../core/util/IGeoPoint";
import type { DataItem } from "../../core/render/Component";
import type { IPoint } from "../../core/util/IPoint";
import type { IGraphics } from "../../core/render/backend/Renderer";
import * as $type from "../../core/util/Type";
import * as $math from "../../core/util/Math";
import { Percent } from "../../core/util/Percent";
import { projectAltitude, isGlobe } from "./MapUtils";

import { Graphics, IGraphicsSettings, IGraphicsPrivate, IGraphicsEvents } from "../../core/render/Graphics";
import { geoLength, geoInterpolate, geoDistance } from "d3-geo";

export interface IMapLineSettings extends IGraphicsSettings {

	/**
	 * The line's path, as GeoJSON geometry.
	 */
	geometry?: GeoJSON.LineString | GeoJSON.MultiLineString;

	/**
	 * How far, in pixels, the drawn line may stray from the curve the
	 * projection bends it into (d3-geo's resampling precision). Smaller is
	 * more accurate but slower.
	 *
	 * @default 0.5
	 */
	precision?: number;

	/**
	 * Raises the line above the surface so it arcs like a trajectory: each leg,
	 * from one point to the next, rises this many metres in its middle.
	 * `400000` is about the height of the International Space Station.
	 *
	 * Once it is set (`0` included), the ends sit at the `altitude` of the
	 * points the line connects, or at the third value of their coordinates, in
	 * metres too. Without it, the line stays on the surface. On flat maps it
	 * rises up the screen.
	 *
	 * Does not apply to `lineType: "straight"`.
	 *
	 * @since 5.21.0
	 */
	altitude?: number;
}

export interface IMapLinePrivate extends IGraphicsPrivate {

	/**
	 * @ignore
	 */
	series: MapLineSeries;
}

export interface IMapLineEvents extends IGraphicsEvents {

	/**
	 * The line's shape was worked out again, as after its geometry or the
	 * map's projection changed.
	 */
	linechanged: {};
}

// Where a line meets the globe's edge, between a shown and a hidden position
function edgePoint(sample: (t: number) => IPoint | undefined, shown: number, hidden: number): IPoint | undefined {
	let point: IPoint | undefined;
	for (let i = 0; i < 12; i++) {
		const middle = (shown + hidden) / 2;
		const p = sample(middle);
		if (p) {
			point = p;
			shown = middle;
		}
		else {
			hidden = middle;
		}
	}
	return point;
}

/**
 * A line in a [[MapLineSeries]].
 */
export class MapLine extends Graphics {

	declare public _settings: IMapLineSettings;
	declare public _privateSettings: IMapLinePrivate;
	declare public _events: IMapLineEvents;

	public static className: string = "MapLine";
	public static classNames: Array<string> = Graphics.classNames.concat([MapLine.className]);
	protected _projectionDirty: boolean = false;

	public _beforeChanged() {
		super._beforeChanged();

		// Made focusable: the chart checks whether it is in view
		if (this.isDirty("focusable") && this.get("focusable")) {
			const series = this.dataItem && <MapSeries>this.dataItem.component;
			const chart = series && series.chart;
			if (chart) {
				chart._scheduleFocusView();
			}
		}

		if (this._projectionDirty || this.isDirty("geometry") || this.isDirty("precision") || this.isDirty("altitude")) {
			const geometry = this.get("geometry")!;
			if (geometry) {
				const series = this.getPrivate("series");
				if (series) {
					const chart = series.chart;
					if (chart) {
						const projection = chart.get("projection");
						let clipAngle: number | null = null;

						if (projection && projection.clipAngle) {
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
							else if (this._hasAltitude()) {
								this._setC("draw", (display) => {
									this._drawRaised(display);
								});
							}
							else {
								this.set("draw", (_display) => {
									if (projection && series.get("clipBack") === false) {
										projection.clipAngle(180);
									}

									geoPath.context(this._display as any);
									geoPath(geometry);
									geoPath.context(null);

									if (projection && projection.clipAngle) {
										projection.clipAngle(clipAngle as any);
									}
								})
							}
						}
					}
				}
			}
			const type = "linechanged";
			if (this.events.isEnabled(type)) {
				this.events.dispatch(type, { type: type, target: this });
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

	protected _segments(): Array<Array<Array<number>>> {
		const geometry = this.get("geometry");
		if (geometry && geometry.coordinates) {
			if (geometry.type == "LineString") {
				return [geometry.coordinates as Array<Array<number>>];
			}
			if (geometry.type == "MultiLineString") {
				return geometry.coordinates as Array<Array<Array<number>>>;
			}
		}
		return [];
	}

	// Raised lines opt in with an altitude; coordinates' third values alone do not count
	protected _hasAltitude(): boolean {
		return this.get("altitude") != null;
	}

	/**
	 * Returns the line's altitude at a position along it. A line without
	 * `altitude` gives `0`.
	 *
	 * @param position  Position from `0` (start) to `1` (end)
	 * @return Altitude in metres
	 * @since 5.21.0
	 */
	public positionToAltitude(position: number): number {
		if (!this._hasAltitude()) {
			return 0;
		}
		const segments = this._segments();
		const total = geoLength(this.get("geometry")!) || 1;
		const arc = this.get("altitude", 0);

		let base = 0;
		let distance = 0;
		for (let s = 0; s < segments.length; s++) {
			const segment = segments[s];
			if (segment.length == 1) {
				base = segment[0][2] || 0;
			}
			for (let p = 1; p < segment.length; p++) {
				const a = segment[p - 1];
				const b = segment[p];
				const length = geoDistance(a as [number, number], b as [number, number]) / total;
				if (position <= distance + length || (s == segments.length - 1 && p == segment.length - 1)) {
					// The leg's ends' altitudes, and its own arc, highest in its middle
					const t = length ? Math.max(0, Math.min(1, (position - distance) / length)) : 0;
					return (a[2] || 0) + ((b[2] || 0) - (a[2] || 0)) * t + arc * 4 * t * (1 - t);
				}
				distance += length;
			}
		}
		return base;
	}

	/**
	 * Draws the line along the globe, raised by its altitude, leaving out the
	 * parts the globe hides.
	 */
	protected _drawRaised(display: IGraphics) {
		const series = this.getPrivate("series");
		const chart = series ? series.chart : undefined;
		const geometry = this.get("geometry");
		const projection = chart ? chart.get("projection") : undefined;
		if (!projection || !geometry) {
			return;
		}
		const showHidden = series.get("clipBack") === false;
		const globe = isGlobe(projection);

		// Jumps longer than this cross a flat map's edge
		const wrap = Math.PI * projection.scale();

		const segments = this._segments();
		const arc = this.get("altitude", 0);

		for (let s = 0; s < segments.length; s++) {
			const segment = segments[s];
			let prev: IPoint | undefined;
			for (let p = 1; p < segment.length; p++) {
				const a = segment[p - 1];
				const b = segment[p];
				const length = geoDistance(a as [number, number], b as [number, number]);
				const interpolate = geoInterpolate(a as [number, number], b as [number, number]);

				// The point at t (0-1) along this leg, when the globe does not hide it;
				// each leg is an arc of its own
				const sample = (t: number): IPoint | undefined => {
					const location = interpolate(t);
					const altitude = (a[2] || 0) + ((b[2] || 0) - (a[2] || 0)) * t + arc * 4 * t * (1 - t);
					const point = projectAltitude(projection, location[0], location[1], altitude);
					return point && (showHidden || !point.hidden) ? point : undefined;
				};

				// About a degree apart
				const steps = Math.max(2, Math.ceil(length / $math.RADIANS));
				let prevT = 0;
				for (let k = p == 1 ? 0 : 1; k <= steps; k++) {
					const t = k / steps;
					const point = sample(t);
					if (point) {
						if (prev && (globe || Math.abs(point.x - prev.x) < wrap)) {
							display.lineTo(point.x, point.y);
						}
						else {
							// Coming out from behind the globe: start at its edge
							const edge = !prev && k > 0 && globe ? edgePoint(sample, t, prevT) : undefined;
							if (edge) {
								display.moveTo(edge.x, edge.y);
								display.lineTo(point.x, point.y);
							}
							else {
								display.moveTo(point.x, point.y);
							}
						}
					}
					else if (prev && globe) {
						// Going behind the globe: end at its edge
						const edge = edgePoint(sample, prevT, t);
						if (edge) {
							display.lineTo(edge.x, edge.y);
						}
					}
					prev = point;
					prevT = t;
				}
			}
		}
	}

	public _getTooltipPoint(): IPoint {
		let tooltipX = this.get("tooltipX");
		let tooltipY = this.get("tooltipY");

		let x = 0;
		let y = 0;

		if ($type.isNumber(tooltipX)) {
			x = tooltipX;
		}

		if ($type.isNumber(tooltipY)) {
			y = tooltipY;
		}

		if (tooltipX instanceof Percent) {
			const geoPoint = this.positionToGeoPoint(tooltipX.value)
			const series = this.getPrivate("series");
			if (series) {
				const chart = series.chart;
				if (chart) {
					const point = chart.convert(geoPoint);
					x = point.x;
					y = point.y;
				}
			}
		}
		
		return { x, y };
	}

	/**
	 * Returns the geographic point at a position along the line.
	 *
	 * @param position  Position from `0` (start) to `1` (end)
	 * @return Geographic point
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

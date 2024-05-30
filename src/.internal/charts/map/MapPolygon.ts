import { Graphics, IGraphicsSettings, IGraphicsPrivate } from "../../core/render/Graphics";
import type { MapPolygonSeries } from "./MapPolygonSeries";
import type { IGeoPoint } from "../../core/util/IGeoPoint";
import type { IPoint } from "../../core/util/IPoint";
import * as $mapUtils from "./MapUtils";
import $polylabel from "polylabel";
import { geoArea } from "d3-geo";

export interface IMapPolygonSettings extends IGraphicsSettings {

	/**
	 * A GeoJSON representation of the polygons geometry.
	 */
	geometry?: GeoJSON.MultiPolygon | GeoJSON.Polygon;

	/**
	 * @todo needs description
	 * @default 0.5
	 */
	precision?: number;

}

export interface IMapPolygonPrivate extends IGraphicsPrivate {
}

/**
 * A polygon in a [[MapPolygonSeries]].
 */
export class MapPolygon extends Graphics {

	declare public _settings: IMapPolygonSettings;
	declare public _privateSettings: IMapPolygonPrivate;

	public static className: string = "MapPolygon";
	public static classNames: Array<string> = Graphics.classNames.concat([MapPolygon.className]);
	protected _projectionDirty: boolean = false;

	protected _afterNew(): void {
		super._afterNew();
		this.setPrivate("trustBounds", true);
	}

	/**
	 * A [[MapPolygonSeries]] polygon belongs to.
	 */
	public series: MapPolygonSeries | undefined;

	public _beforeChanged() {
		super._beforeChanged();

		if (this._projectionDirty || this.isDirty("geometry") || this.isDirty("precision")) {
			const geometry = this.get("geometry")!;

			if (geometry) {
				const series = this.series;
				if (series) {
					const projection = series.projection();
					if (projection) {
						projection.precision(this.get("precision", 0.5));
					}

					const geoPath = series.geoPath();

					if (geoPath) {
						this._clear = true;

						this.set("draw", (_display) => {
							geoPath.context(this._display as any);
							geoPath(geometry);
							geoPath.context(null);
						})

						if (this.isHover()) {
							this.showTooltip();
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
	 * Returns latitude/longitude of the geometrical center of the polygon.
	 *
	 * @return Center
	 */
	public geoCentroid(): IGeoPoint {
		const geometry = this.get("geometry")!;
		if (geometry) {
			return $mapUtils.getGeoCentroid(geometry);
		}
		else {
			return { latitude: 0, longitude: 0 };
		}
	}

	/**
	 * Returns latitude/longitude of the visual center of the polygon.
	 *
	 * @return Center
	 */
	public visualCentroid(): IGeoPoint {

		let biggestArea = 0;
		let coordinates: number[][][] = [];
		const geometry = this.get("geometry")!;

		if (geometry) {
			if (geometry.type == "Polygon") {
				coordinates = geometry.coordinates as number[][][];
			}
			else if (geometry.type == "MultiPolygon") {
				for (let i = 0; i < geometry.coordinates.length; i++) {
					let coords = geometry.coordinates[i] as number[][][];
					let area = geoArea({ type: "Polygon", coordinates: coords });
					if (area > biggestArea) {
						coordinates = coords;
						biggestArea = area;
					}
				}
			}
			if (coordinates) {
				let center = $polylabel(coordinates as number[][][]);
				return { longitude: center[0], latitude: center[1] };
			}
		}
		return { longitude: 0, latitude: 0 };
	}


	public _getTooltipPoint(): IPoint {
		const series = this.series;

		if (series) {
			const projection = series.projection();
			if (projection) {
				const geoPoint = this.visualCentroid();
				const xy = projection([geoPoint.longitude, geoPoint.latitude]);

				if (xy) {
					return { x: xy[0], y: xy[1] }
				}
			}
		}
		return { x: 0, y: 0 };
	}
}

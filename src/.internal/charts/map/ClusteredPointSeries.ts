import { MapPointSeries, IMapPointSeriesSettings, IMapPointSeriesPrivate, IMapPointSeriesDataItem } from "./MapPointSeries";
import { Component, DataItem, IComponentDataItem } from "../../core/render/Component";
import type { Root } from "../../core/Root";
import type { Bullet } from "../../core/render/Bullet";
import { Container } from "../../core/render/Container";
import { Label } from "../../core/render/Label";
import type { IDisposer } from "../../core/util/Disposer";

import * as $array from "../../core/util/Array";
import * as $object from "../../core/util/Object";
import * as d3hierarchy from "d3-hierarchy";
import * as $math from "../../core/util/Math";


export interface IClusteredDataItem extends IComponentDataItem {
	/**
	 * All the data items of this cluster
	 */
	children?: Array<DataItem<IMapPointSeriesDataItem>>;

	/**
	 * Bullet of clustered data item
	 */
	bullet?: Bullet;

	/**
	 * An ID of a group.
	 */
	groupId?: string

	/**
	 * Longitude.
	 */
	longitude?: number;

	/**
	 * Latitude.
	 */
	latitude?: number;
}

export interface IClusteredPointSeriesDataItem extends IMapPointSeriesDataItem {
	/**
	 * An ID of a bullet's group.
	 */
	groupId?: string

	/**
	 * Clustered data item (if available)
	 * @readonly
	 */
	cluster?: DataItem<IClusteredDataItem>;

	/**
	 * How much bullet was moved from its original position
	 */
	dx?: number;

	/**
	 * How much bullet was moved from its original position
	 */
	dy?: number;
}

export interface IClusteredPointSeriesPrivate extends IMapPointSeriesPrivate {

}

export interface IClusteredPointSeriesSettings extends IMapPointSeriesSettings {
	/**
	 * Series data can contain a field with an ID of a virtual group the bullet
	 * belongs to.
	 *
	 * For example, we migth want bullets to group with other bullets from the
	 * same continent.
	 *
	 * `groupIdField` specifies which field in source data holds group IDs.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/map-chart/clustered-point-series/#Group_segregation} for more info
	 * @default groupID
	 */
	groupIdField?: string;

	/**
	 * Bullets that are closer than X pixels apart, will be automatically grouped.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/map-chart/clustered-point-series/#Minimal_distance} for more info
	 * @default 20
	 */
	minDistance?: number;

	/**
	 * Set this to a [[Bullet]] instance which will be used to show groups.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/map-chart/clustered-point-series/#Group_bullet} for more info
	 */
	clusteredBullet?: (root: Root, series: ClusteredPointSeries, dataItem: DataItem<IClusteredDataItem>) => Bullet | undefined;

	/**
	 * If bullets are closer to each other than `scatterDistance`, they will be
	 * scattered so that all are visible.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/map-chart/clustered-point-series/#Scatter_settings} for more info
	 * @default 5
	 * @since 5.5.7
	 */
	scatterDistance?: number;

	/**
	 * Presumed radius of a each bullet when scattering them.
	 * 
	 * @see {@link https://www.amcharts.com/docs/v5/charts/map-chart/clustered-point-series/#Scatter_settings} for more info
	 * @default 8
	 * @since 5.5.7
	 */
	scatterRadius?: number;

	/**
	 * If a map is zoomed to a maxZoomLevel * stopClusterZoom, clusters will be
	 * disabled.
	 * 
	 * @see {@link https://www.amcharts.com/docs/v5/charts/map-chart/clustered-point-series/#Scatter_settings} for more info
	 * @default 0.95
	 * @since 5.5.7
	 */
	stopClusterZoom?: number


	/**
	 * Delay in milliseconds before clustering is made.
	 * 
	 * This is useful if you have many data items and want to avoid re-clustering
	 * on every zoom/position change.
	 * 
	 * @default 0
	 * @since 5.9.11
	 */
	clusterDelay?: number;
}

/**
 * A version of [[MapPointSeries]] which can automatically group closely located
 * bullets into groups.
 * 
 * @see {@link https://www.amcharts.com/docs/v5/charts/map-chart/clustered-point-series/} for more info
 * @since 5.5.6
 * @important
 */
export class ClusteredPointSeries extends MapPointSeries {

	public static className: string = "ClusteredPointSeries";
	public static classNames: Array<string> = MapPointSeries.classNames.concat([ClusteredPointSeries.className]);

	declare public _settings: IClusteredPointSeriesSettings;
	declare public _privateSettings: IClusteredPointSeriesPrivate;
	declare public _dataItemSettings: IClusteredPointSeriesDataItem;

	protected _dataItem: DataItem<this["_dataItemSettings"]> = this.makeDataItem({});
	protected _clusterIndex: number = 0;
	protected _clusters: Array<Array<DataItem<this["_dataItemSettings"]>>> = [];
	public clusteredDataItems: Array<DataItem<IClusteredDataItem>> = [];

	protected _scatterIndex: number = 0;
	protected _scatters: Array<Array<DataItem<this["_dataItemSettings"]>>> = [];

	public _packLayout = d3hierarchy.pack();

	protected _spiral: Array<{ x: number, y: number }> = [];

	protected _clusterDP?: IDisposer;

	protected _previousZL: number = 0;

	protected _afterNew() {
		this.fields.push("groupId");
		this._setRawDefault("groupIdField", "groupId");

		super._afterNew();
	}

	public _updateChildren() {
		super._updateChildren();

		if (this.isDirty("scatterRadius")) {
			this._spiral = $math.spiralPoints(0, 0, 300, 300, 0, 3, 3, 0, 0)
		}

		const chart = this.chart;

		if (chart) {

			const zoomLevel = chart.get("zoomLevel", 1);

			if (zoomLevel != this._previousZL) {
				const clusterDelay = this.get("clusterDelay", 0);
				if (clusterDelay) {
					if (this._clusterDP) {
						this._clusterDP.dispose();

						this._clusterDP = this.setTimeout(() => {
							this._doTheCluster();
						}, clusterDelay)
					}
					else {
						// first time without delay
						this._doTheCluster();
						this._clusterDP = this.setTimeout(() => { }, 0);
					}
				}
				else {
					this._doTheCluster();
				}

				this._previousZL = zoomLevel;
			}

			$array.each(this.clusteredDataItems, (dataItem) => {
				const bullet = dataItem.get("bullet" as any);
				const longitude = dataItem.get("longitude", 0);
				const latitude = dataItem.get("latitude", 0);
				this._positionBulletReal(bullet, { type: "Point", coordinates: [longitude, latitude] }, [longitude, latitude]);
			})			
		}
	}


	protected _doTheCluster() {
		const groups: { [index: string]: Array<DataItem<IClusteredPointSeriesDataItem>> } = {};
		// distribute to groups
		$array.each(this.dataItems, (dataItem) => {
			const groupId = dataItem.get("groupId", "_default");

			if (!groups[groupId]) {
				groups[groupId] = [];
			}
			groups[groupId].push(dataItem);
		})

		this._scatterIndex = -1;
		this._scatters = [];
		this._clusterIndex = -1;
		this._clusters = [];

		$array.each(this.clusteredDataItems, (dataItem) => {
			dataItem.setRaw("children", undefined);
		})

		$array.each(this.dataItems, (dataItem) => {
			dataItem.setRaw("cluster", undefined);
		})

		$object.each(groups, (_key, group) => {
			this._scatterGroup(group);
		})


		$object.each(groups, (_key, group) => {
			this._clusterGroup(group);
		})

		$array.each(this.dataItems, (dataItem) => {
			if (!dataItem.get("cluster")) {
				const bullets = dataItem.bullets;
				if (bullets) {
					$array.each(bullets, (bullet) => {
						const sprite = bullet.get("sprite");
						if (sprite) {
							sprite.set("forceHidden", false);
						}
					})
				}
			}
		})
	}

	/**
	 * Zooms to the area so that all clustered data items of a cluster would be
	 * visible.
	 *
	 * Pass in `true` as a second parameter to rotate that map so that the group
	 * is in the center. This is especially useful in the maps that use
	 * Orthographic (globe) projection.
	 *
	 * @param  dataItem  Group data item
	 * @param  rotate    Rotate the map so that group is in the center?
	 * @see {@link https://www.amcharts.com/docs/v5/charts/map-chart/clustered-point-series/#Drill_down} for more info
	 */
	public zoomToCluster(dataItem: DataItem<IClusteredDataItem>, rotate?: boolean) {
		this.zoomToDataItems(dataItem.get("children", []), rotate);
	}

	protected _clusterGroup(dataItems: Array<DataItem<IClusteredPointSeriesDataItem>>) {
		const chart = this.chart;
		if (chart && chart.get("zoomLevel", 1) >= chart.get("maxZoomLevel", 100) * this.get("stopClusterZoom", 0.95)) {
			// void
		}
		else {

			dataItems.sort((a, b) => {
				const pointA = a.get("point");
				const pointB = b.get("point");
				if (pointA && pointB) {
					return Math.hypot(pointA.x - pointB.x, pointA.y - pointB.y);
				}

				return 0;
			})

			while (dataItems.length > 0) {
				this._clusterIndex++;
				this._clusters[this._clusterIndex] = [];
				const cluster = this._clusters[this._clusterIndex];
				const dataItem = dataItems[0];

				cluster.push(dataItem);
				$array.removeFirst(dataItems, dataItem);

				this._clusterDataItem(dataItem, dataItems);
			}
		}

		let i = 0;

		const bulletMethod = this.get("clusteredBullet");
		if (bulletMethod) {
			$array.each(this._clusters, (cluster) => {
				let sumX = 0;
				let sumY = 0;

				let len = cluster.length;

				if (len > 1) {

					let clusteredDataItem = this.clusteredDataItems[i];
					if (!clusteredDataItem) {
						clusteredDataItem = new DataItem(this, undefined, {});

						const bullet = clusteredDataItem.set("bullet" as any, bulletMethod(this._root, this, clusteredDataItem));

						if (bullet) {
							const sprite = bullet.get("sprite");
							if (sprite) {
								this.bulletsContainer.children.push(sprite);
								sprite._setDataItem(clusteredDataItem);

								this.root.events.once("frameended", () => {
									if (sprite instanceof Container) {
										sprite.walkChildren((child) => {
											if (child instanceof Component) {
												child.markDirtyValues();
											}
										});
									}
								})
							}
						}

						this.clusteredDataItems.push(clusteredDataItem)
					}

					let groupId;

					$array.each(cluster, (dataItem) => {
						dataItem.setRaw("cluster", clusteredDataItem);

						const point = dataItem.get("point");
						if (point) {
							sumX += point.x;
							sumY += point.y;
						}

						const bullets = dataItem.bullets;
						if (bullets) {
							$array.each(bullets, (bullet) => {
								const sprite = bullet.get("sprite");
								if (sprite) {
									sprite.set("forceHidden", true);
								}
							})
						}
						groupId = dataItem.get("groupId");
					})

					let averageX = sumX / len;
					let averageY = sumY / len;

					clusteredDataItem.setRaw("children" as any, cluster);
					clusteredDataItem.setRaw("groupId", groupId);

					const prevLen = clusteredDataItem.get("value" as any);
					clusteredDataItem.setRaw("value" as any, len);

					const bullet = clusteredDataItem.get("bullet" as any);
					if (bullet) {

						let geoPoint = this.chart!.invert({ x: averageX, y: averageY });
						if (geoPoint) {
							clusteredDataItem.setAll({
								longitude: geoPoint.longitude,
								latitude: geoPoint.latitude,
							});
						}

						this._positionBullets(clusteredDataItem)

						const sprite = bullet.get("sprite");
						if (sprite) {
							sprite.set("forceHidden", false);
							//sprite.setAll({ x: averageX, y: averageY });

							if (prevLen != len) {
								if (sprite instanceof Container) {
									sprite.walkChildren((child) => {
										if (child instanceof Label) {
											child.text.markDirtyText();
										}
									})
								}
							}
						}
					}
					i++;
				}
			})
		}

		$array.each(this.clusteredDataItems, (dataItem) => {
			let children = dataItem.get("children");
			if (!children || children.length == 0) {
				const bullet = dataItem.get("bullet" as any);
				if (bullet) {
					const sprite = bullet.get("sprite");
					if (sprite) {
						sprite.set("forceHidden", true);
					}
				}
			}
		})
	}

	protected _onDataClear() {
		super._onDataClear();

		$array.each(this.clusteredDataItems, (dataItem) => {
			const bullet = dataItem.get("bullet" as any);
			if (bullet) {
				const sprite = bullet.get("sprite");
				if (sprite) {
					sprite.dispose();
				}
			}
		})
		this.clusteredDataItems = [];

	}

	protected _clusterDataItem(dataItem: DataItem<IClusteredPointSeriesDataItem>, dataItems: Array<DataItem<IClusteredPointSeriesDataItem>>) {
		const point = dataItem.get("point");
		if (point) {
			let minDistance = this.get("minDistance", 20);
			const cluster = this._clusters[this._clusterIndex];

			for (let i = dataItems.length - 1; i >= 0; i--) {
				const di = dataItems[i];
				if (di && !di.get("clipped")) {
					const diPoint = di.get("point");
					if (diPoint) {
						if (Math.hypot(diPoint.x - point.x, diPoint.y - point.y) < minDistance) {
							cluster.push(di);
							$array.removeFirst(dataItems, di);
							this._clusterDataItem(di, dataItems);
						}
					}
				}
			}
		}
	}

	protected _scatterGroup(dataItems: Array<DataItem<IClusteredPointSeriesDataItem>>) {
		const chart = this.chart;
		if (chart && chart.get("zoomLevel", 1) >= chart.get("maxZoomLevel", 100) * this.get("stopClusterZoom", 0.95)) {
			while (dataItems.length > 0) {
				this._scatterIndex++;
				this._scatters[this._scatterIndex] = [];
				const scatter = this._scatters[this._scatterIndex];
				const dataItem = dataItems[0];

				scatter.push(dataItem);
				$array.remove(dataItems, dataItem);

				this._scatterDataItem(dataItem, dataItems);
			}

			$array.each(this._scatters, (scatter) => {
				let len = scatter.length;

				if (len > 1) {
					let previousCircles: Array<{ x: number, y: number, radius: number }> = [];
					let s = 0;
					let radius = this.get("scatterRadius", 8);
					$array.each(scatter, (dataItem) => {
						let spiralPoint = this._spiral[s];
						let intersects = true;

						if (previousCircles.length > 0) {
							while (intersects) {
								$array.each(previousCircles, (previousCircle) => {
									intersects = false;
									while ($math.circlesOverlap({ x: spiralPoint.x, y: spiralPoint.y, radius: radius }, previousCircle)) {
										s++;

										if (this._spiral[s] == undefined) {
											intersects = false;
										}
										else {
											intersects = true;
											spiralPoint = this._spiral[s];
										}
									}
								})
							}
						}

						const dx = spiralPoint.x;
						const dy = spiralPoint.y;

						previousCircles.push({ x: dx, y: dy, radius: radius });

						dataItem.set("dx", dx);
						dataItem.set("dy", dy);

						const bullets = dataItem.bullets;
						if (bullets) {
							$array.each(bullets, (bullet) => {
								const sprite = bullet.get("sprite");
								if (sprite) {
									sprite.setAll({ dx: dx, dy: dy });
								}
							})
						}
					})
				}
			})
		}
	}

	protected _scatterDataItem(dataItem: DataItem<IClusteredPointSeriesDataItem>, dataItems: Array<DataItem<IClusteredPointSeriesDataItem>>) {
		const point = dataItem.get("point");
		if (point) {
			const scatterDistance = this.get("scatterDistance", 5)
			const scatter = this._scatters[this._scatterIndex];
			$array.each(dataItems, (di) => {
				if (di && !di.get("clipped")) {
					const diPoint = di.get("point");

					if (diPoint) {
						if (Math.hypot(diPoint.x - point.x, diPoint.y - point.y) < scatterDistance) {
							scatter.push(di);
							$array.removeFirst(dataItems, di);
							this._scatterDataItem(di, dataItems);
						}
					}
				}
			})
		}
	}
}

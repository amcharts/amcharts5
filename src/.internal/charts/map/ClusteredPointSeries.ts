import { MapPointSeries, IMapPointSeriesSettings, IMapPointSeriesPrivate, IMapPointSeriesDataItem } from "./MapPointSeries";
import { DataItem, IComponentDataItem } from "../../core/render/Component";
import type { Root } from "../../core/Root";
import type { Bullet } from "../../core/render/Bullet";
import { Container } from "../../core/render/Container";
import { Label } from "../../core/render/Label";

import * as $array from "../../core/util/Array";
import * as $object from "../../core/util/Object";


export interface IClusteredDataItem extends IComponentDataItem {
	/**
	 * All the data items of this cluster
	 */
	children?: Array<DataItem<IMapPointSeriesDataItem>>;

	/**
	 * Bullet of clustered data item
	 */
	bullet?: Bullet;
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
	clusteredBullet?: (root: Root, series: ClusteredPointSeries, dataItem: DataItem<IClusteredPointSeriesDataItem>) => Bullet | undefined;
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

	protected _afterNew() {
		this.fields.push("groupId");
		this._setRawDefault("groupIdField", "groupId");

		super._afterNew();
	}

	public _updateChildren() {
		super._updateChildren();

		const groups: { [index: string]: Array<DataItem<IClusteredPointSeriesDataItem>> } = {};
		// distribute to groups
		$array.each(this.dataItems, (dataItem) => {
			const groupId = dataItem.get("groupId", "_default");

			if (!groups[groupId]) {
				groups[groupId] = [];
			}
			groups[groupId].push(dataItem);
		})

		this._clusterIndex = -1;
		this._clusters = [];

		$array.each(this.clusteredDataItems, (dataItem) => {
			dataItem.setRaw("children", undefined);
		})

		$array.each(this.dataItems, (dataItem) => {
			dataItem.setRaw("cluster", undefined);
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
		if (chart && chart.get("zoomLevel", 1) >= chart.get("maxZoomLevel", 100) * 0.95) {
			// void
		}
		else {
			while (dataItems.length > 0) {
				this._clusterIndex++;
				this._clusters[this._clusterIndex] = [];
				const cluster = this._clusters[this._clusterIndex];
				const dataItem = dataItems[0];

				cluster.push(dataItem);
				$array.remove(dataItems, dataItem);

				this._clusterDataItem(dataItem, dataItems);
			}
		}

		let i = 0;

		$array.each(this._clusters, (cluster) => {
			let sumX = 0;
			let sumY = 0;

			let len = cluster.length;

			if (len > 1) {

				let clusteredDataItem = this.clusteredDataItems[i];
				if (!clusteredDataItem) {
					clusteredDataItem = new DataItem(this, undefined, {});

					const bulletMethod = this.get("clusteredBullet");
					if (bulletMethod) {
						const bullet = clusteredDataItem.set("bullet" as any, bulletMethod(this._root, this, clusteredDataItem));

						if (bullet) {
							const sprite = bullet.get("sprite");
							if (sprite) {
								this.bulletsContainer.children.push(sprite);
								sprite._setDataItem(clusteredDataItem);
							}
						}
					}

					this.clusteredDataItems.push(clusteredDataItem)
				}

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
				})

				let averageX = sumX / len;
				let averageY = sumY / len;

				clusteredDataItem.setRaw("children" as any, cluster);

				const prevLen = clusteredDataItem.get("value" as any);
				clusteredDataItem.setRaw("value" as any, len);

				const bullet = clusteredDataItem.get("bullet" as any);
				if (bullet) {
					const sprite = bullet.get("sprite");
					if (sprite) {
						sprite.set("forceHidden", false);
						sprite.setAll({ x: averageX, y: averageY });

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

	protected _clusterDataItem(dataItem: DataItem<IClusteredPointSeriesDataItem>, dataItems: Array<DataItem<IClusteredPointSeriesDataItem>>) {
		const point = dataItem.get("point");
		if (point) {
			$array.each(dataItems, (di) => {
				if (di && !di.get("clipped")) {
					const diPoint = di.get("point");
					if (diPoint) {
						if (Math.hypot(diPoint.x - point.x, diPoint.y - point.y) < this.get("minDistance", 20)) {
							const cluster = this._clusters[this._clusterIndex];
							cluster.push(di);
							$array.remove(dataItems, di);
							this._clusterDataItem(di, dataItems);
						}
					}
				}
			})
		}
	}
}

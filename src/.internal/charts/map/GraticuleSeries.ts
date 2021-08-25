import { MapLineSeries, IMapLineSeriesSettings, IMapLineSeriesPrivate, IMapLineSeriesDataItem } from "./MapLineSeries";
import type { Root } from "../../core/Root";
import type { DataItem } from "../../core/render/Component";
import type { Template } from "../../core/util/Template";
import { geoGraticule } from "d3-geo";


export interface IGraticuleSeriesDataItem extends IMapLineSeriesDataItem {
}

export interface IGraticuleSeriesPrivate extends IMapLineSeriesPrivate {
}

export interface IGraticuleSeriesSettings extends IMapLineSeriesSettings {

	/**
	 * Place a grid line every Xth latitude/longitude.
	 *
	 * @default 10
	 */
	step?: number;
}

/**
 * A [[MapChart]] series to draw a map grid.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/map-chart/graticule-series/} for more info
 * @important
 */
export class GraticuleSeries extends MapLineSeries {

	/**
	 * Use this method to create an instance of this class.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/getting-started/#New_element_syntax} for more info
	 * @param   root      Root element
	 * @param   settings  Settings
	 * @param   template  Template
	 * @return            Instantiated object
	 */
	public static new(root: Root, settings: GraticuleSeries["_settings"], template?: Template<GraticuleSeries>): GraticuleSeries {
		const x = new GraticuleSeries(root, settings, true, template);
		x._afterNew();
		return x;
	}

	public static className: string = "GraticuleSeries";
	public static classNames: Array<string> = MapLineSeries.classNames.concat([GraticuleSeries.className]);

	declare public _settings: IGraticuleSeriesSettings;
	declare public _privateSettings: IGraticuleSeriesPrivate;

	protected _dataItem: DataItem<this["_dataItemSettings"]> = this.makeDataItem({});

	protected _afterNew() {
		super._afterNew();
		this.dataItems.push(this._dataItem);
		this._generate();
	}

	public _updateChildren() {
		super._updateChildren();

		if (this.isDirty("step")) {
			this._generate();
		}
	}

	protected _generate() {
		let graticule = geoGraticule();

		if (graticule) {
			const step = this.get("step", 10);

			graticule.stepMinor([360, 360]);
			graticule.stepMajor([step, step]);
			this._dataItem.set("geometry", graticule());
		}
	}
}

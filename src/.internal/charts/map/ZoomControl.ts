import type { MapChart } from "./MapChart";

import { ZoomTools, IZoomToolsPrivate, IZoomToolsSettings } from "../../core/render/ZoomTools";

export interface IZoomControlSettings extends IZoomToolsSettings {
}

export interface IZoomControlPrivate extends IZoomToolsPrivate {
	/**
	 * @ignore
	 */
	chart?: MapChart;
}

/**
 * A control that displays button for zooming [[MapChart]] in and out.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/map-chart/map-pan-zoom/#Zoom_control} for more information
 * @important
 */
export class ZoomControl extends ZoomTools {
	public static className: string = "ZoomControl";
	public static classNames: Array<string> = ZoomTools.classNames.concat([ZoomControl.className]);

	declare public _settings: IZoomControlSettings;
	declare public _privateSettings: IZoomControlPrivate;

	protected _afterNew() {
		super._afterNew();
		this.addTag("zoomtools");
	}

	public _prepareChildren() {
		super._prepareChildren();

		if (this.isPrivateDirty("chart")) {
			this.set("target", this.getPrivate("chart"));
		}
	}
}

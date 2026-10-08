import { SerialChart, ISerialChartSettings, ISerialChartPrivate, ISerialChartEvents } from "./SerialChart";
import { ZoomableContainer } from "./ZoomableContainer";
import { p100 } from "../../core/util/Percent";

import type { Series } from "./Series";
import type { ZoomTools } from "./ZoomTools";

export interface ISerialChartContainerSettings extends ISerialChartSettings {

	/**
	 * A [[ZoomTools]] to add to the chart. Its `target` is set to the chart's
	 * `zoomableContainer`.
	 */
	zoomTools?: ZoomTools;

}

export interface ISerialChartContainerPrivate extends ISerialChartPrivate {
}

export interface ISerialChartContainerEvents extends ISerialChartEvents {
}

/**
 * A chart for series of any kind, such as a force-directed tree, that can be
 * zoomed and panned: its series sit in a [[ZoomableContainer]].
 *
 * @since 5.20.2
 */
export class SerialChartContainer extends SerialChart {
	public static className: string = "SerialChartContainer";
	public static classNames: Array<string> = SerialChart.classNames.concat([SerialChartContainer.className]);

	declare public _settings: ISerialChartContainerSettings;
	declare public _privateSettings: ISerialChartContainerPrivate;
	declare public _seriesType: Series;
	declare public _events: ISerialChartContainerEvents;

	/**
	 * The [[ZoomableContainer]] that holds the series and their bullets, so they
	 * can be zoomed and panned.
	 */
	public readonly zoomableContainer: ZoomableContainer = ZoomableContainer.new(this._root, { width: p100, height: p100, isMeasured: false })._markC("width", "height", "isMeasured");

	protected _afterNew() {
		super._afterNew();
		this.addTag("serialchartcontainer");
		this.zoomableContainer.contents.children.push(this.seriesContainer);
		// Bullets sit alongside the series, so they zoom and pan with it and stay
		// drawn on top of it
		this.zoomableContainer.contents.children.push(this.bulletsContainer);
		this.chartContainer.children.push(this.zoomableContainer);
	}

	public _prepareChildren() {
		super._prepareChildren();
		if (this.isDirty("zoomTools")) {
			const previous = this._prevSettings.zoomTools;
			const zoomTools = this.get("zoomTools");
			if (zoomTools !== previous) {
				if (previous) {
					previous.dispose();
				}
				if (zoomTools) {
					zoomTools.set("target", this.zoomableContainer);
					this.children.push(zoomTools);
				}
				this._prevSettings.zoomTools = zoomTools;
			}
		}
	}
}

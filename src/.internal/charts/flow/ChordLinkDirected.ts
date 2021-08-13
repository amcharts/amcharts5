import type { Root } from "../../core/Root";
import type { DataItem } from "../../core/render/Component";
import type { ChordDirected, IChordDirectedDataItem } from "./ChordDirected";
import type { Template } from "../../core/util/Template";

import { ChordLink, IChordLinkPrivate, IChordLinkSettings } from "./ChordLink";

import * as $utils from "../../core/util/Utils";


export interface IChordLinkDirectedSettings extends IChordLinkSettings {

	/**
	 * Length of the link arrow in pixels.
	 *
	 * @default 10
	 */
	headRadius?: number;

}

export interface IChordLinkDirectedPrivate extends IChordLinkPrivate {
}

/**
 * A link element used in [[ChordDirected]] chart.
 */
export class ChordLinkDirected extends ChordLink {

	/**
	 * Use this method to create an instance of this class.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/getting-started/#New_element_syntax} for more info
	 * @param   root      Root element
	 * @param   settings  Settings
	 * @param   template  Template
	 * @return            Instantiated object
	 */
	public static new(root: Root, settings: ChordLinkDirected["_settings"], template?: Template<ChordLinkDirected>): ChordLinkDirected {
		settings.themeTags = $utils.mergeTags(settings.themeTags, ["chord", "link", "directed"]);
		const x = new ChordLinkDirected(root, settings, true, template);
		x._afterNew();
		return x;
	}

	declare public _settings: IChordLinkDirectedSettings;
	declare public _privateSettings: IChordLinkDirectedPrivate;

	public static className: string = "ChordLinkDirected";
	public static classNames: Array<string> = ChordLink.classNames.concat([ChordLinkDirected.className]);

	declare protected _dataItem: DataItem<IChordDirectedDataItem> | undefined;

	declare public series: ChordDirected | undefined;

}

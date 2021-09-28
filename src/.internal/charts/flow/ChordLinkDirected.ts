import type { DataItem } from "../../core/render/Component";
import type { ChordDirected, IChordDirectedDataItem } from "./ChordDirected";

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
	declare public _settings: IChordLinkDirectedSettings;
	declare public _privateSettings: IChordLinkDirectedPrivate;

	public static className: string = "ChordLinkDirected";
	public static classNames: Array<string> = ChordLink.classNames.concat([ChordLinkDirected.className]);

	declare protected _dataItem: DataItem<IChordDirectedDataItem> | undefined;

	declare public series: ChordDirected | undefined;

	protected _afterNew() {
		this._settings.themeTags = $utils.mergeTags(this._settings.themeTags, ["chord", "link", "directed"]);

		super._afterNew();
	}
}

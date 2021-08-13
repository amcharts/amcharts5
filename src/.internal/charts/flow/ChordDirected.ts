import type { Root } from "../../core/Root";
import type { DataItem } from "../../core/render/Component";

import { Chord, IChordSettings, IChordDataItem, IChordPrivate, IChordEvents } from "./Chord";
import { ChordLinkDirected } from "./ChordLinkDirected";
import { chordDirected, ribbonArrow, ribbon, RibbonArrowGenerator, Ribbon, RibbonSubgroup } from "d3-chord";
import { Template } from "../../core/util/Template";
import { ListTemplate } from "../../core/util/List";

import * as $utils from "../../core/util/Utils";

export interface IChordDirectedDataItem extends IChordDataItem {

}

export interface IChordDirectedSettings extends IChordSettings {

	/**
	 * Length of the link arrow in pixels.
	 *
	 * Set to `null` to disable arrowheads.
	 *
	 * @default 10
	 */
	linkHeadRadius?: number | undefined;

}

export interface IChordDirectedPrivate extends IChordPrivate {
}

export interface IChordDirectedEvents extends IChordEvents {
}

/**
 * Directed chord series.
 *
 * @see {@link https://www.amcharts.com/docs/v5/getting-started/flow-charts/} for more information
 * @important
 */
export class ChordDirected extends Chord {

	public static className: string = "ChordDirected";
	public static classNames: Array<string> = Chord.classNames.concat([ChordDirected.className]);

	/**
	 * Use this method to create an instance of this class.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/getting-started/#New_element_syntax} for more info
	 * @param   root      Root element
	 * @param   settings  Settings
	 * @param   template  Template
	 * @return            Instantiated object
	 */
	public static new(root: Root, settings: ChordDirected["_settings"], template?: Template<ChordDirected>): ChordDirected {
		settings.themeTags = $utils.mergeTags(settings.themeTags, ["directed"]);
		const x = new ChordDirected(root, settings, true, template);
		x._afterNew();
		return x;
	}

	declare public _settings: IChordDirectedSettings;
	declare public _privateSettings: IChordDirectedPrivate;
	declare public _dataItemSettings: IChordDirectedDataItem;
	declare public _events: IChordDirectedEvents;

	public _d3chord = chordDirected();
	public _ribbonArrow: RibbonArrowGenerator<any, Ribbon, RibbonSubgroup> = ribbonArrow();

	/**
	 * List of link elements.
	 *
	 * @default new ListTemplate<ChordLinkDirected>
	 */
	public readonly links: ListTemplate<ChordLinkDirected> = new ListTemplate(
		Template.new({}),
		() => ChordLinkDirected.new(this._root, {themeTags:["link", "shape"]}, this.links.template)
	);
	/**
	 * @ignore
	 */
	public makeLink(dataItem: DataItem<this["_dataItemSettings"]>): ChordLinkDirected {
		const link = this.linksContainer.children.push(this.links.make());
		link._setDataItem(dataItem);
		link.set("source", dataItem.get("source"));
		link.set("target", dataItem.get("target"));

		link.series = this;

		return link;
	}

	protected _afterNew() {
		super._afterNew();
		this._markDirtyKey("linkHeadRadius");
	}

	public _prepareChildren() {
		if (this.isDirty("linkHeadRadius")) {
			const headRadius = this.get("linkHeadRadius");
			if (headRadius == null) {
				this._ribbon = ribbon();
			}
			else {
				let ribbon = ribbonArrow();
				ribbon.headRadius(this.get("linkHeadRadius", 0));
				this._ribbon = ribbon;
			}
		}

		super._prepareChildren();
	}
}

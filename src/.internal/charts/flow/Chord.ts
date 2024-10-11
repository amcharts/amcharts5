import type { DataItem } from "../../core/render/Component";

import { Flow, IFlowSettings, IFlowDataItem, IFlowPrivate, IFlowEvents } from "./Flow";
import { chord, ribbon, RibbonGenerator, RibbonSubgroup, Ribbon } from "d3-chord";
import { ascending, descending } from "d3";
import { Template } from "../../core/util/Template";
import { ListTemplate } from "../../core/util/List";
import { ChordNodes, IChordNodesDataItem } from "./ChordNodes";
import { ChordLink } from "./ChordLink";
import { Percent, p100, p50 } from "../../core/util/Percent";

import * as $array from "../../core/util/Array";
import * as $utils from "../../core/util/Utils";
import * as $math from "../../core/util/Math";


export interface IChordDataItem extends IFlowDataItem {

	/**
	 * A link element.
	 */
	link: ChordLink;

	/**
	 * Source node data item.
	 */
	source: DataItem<IChordNodesDataItem>;

	/**
	 * Target node data item.
	 */
	target: DataItem<IChordNodesDataItem>;

}

export interface IChordSettings extends IFlowSettings {

	/**
	 * Angle of a gap between each node, in degrees.
	 *
	 * @default 1
	 */
	padAngle?: number;

	/**
	 * Radius of the diagram in percent or pixels.
	 *
	 * If set in percent, it will be relative to the whole area available for
	 * the series.
	 *
	 * @default 90%
	 */
	radius?: number | Percent;

	/**
	 * The thickness of node strip in pixels.
	 *
	 * @default 10
	 */
	nodeWidth?: number;

	/**
	 * Starting angle in degrees.
	 *
	 * @default 0
	 */
	startAngle?: number;

	/**
	 * How to sort nodes by their value.
	 *
	 * @default "descending"
	 */
	sort?: "ascending" | "descending" | "none"

}

export interface IChordPrivate extends IFlowPrivate {
}

export interface IChordEvents extends IFlowEvents {
}

/**
 * Regular chord series.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/flow-charts/} for more information
 * @important
 */
export class Chord extends Flow {

	public static className: string = "Chord";
	public static classNames: Array<string> = Flow.classNames.concat([Chord.className]);

	/**
	 * List of link elements.
	 *
	 * @default new ListTemplate<ChordLink>
	 */
	public readonly links: ListTemplate<ChordLink> = this.addDisposer(new ListTemplate(
		Template.new({}),
		() => ChordLink._new(this._root, { themeTags: ["link", "shape"] }, [this.links.template])
	));

	/**
	 * A series for all chord nodes.
	 *
	 * @default ChordNodes.new()
	 */
	public readonly nodes: ChordNodes = this.children.push(ChordNodes.new(this._root, {}));

	declare public _settings: IChordSettings;
	declare public _privateSettings: IChordPrivate;
	declare public _dataItemSettings: IChordDataItem;
	declare public _events: IChordEvents;

	public _d3chord = chord();
	public _chordLayout: { source: { index: number, startAngle: number, endAngle: number, value: number }, target: { index: number, startAngle: number, endAngle: number, value: number } }[] = [];
	public _ribbon = ribbon();

	protected _afterNew() {
		this._settings.themeTags = $utils.mergeTags(this._settings.themeTags, ["chord"]);
		this.linksContainer.setAll({ x: p50, y: p50 })
		this.bulletsContainer.setAll({ x: p50, y: p50 });
		super._afterNew();
	}

	protected _fixRibbon(ribbon: RibbonGenerator<any, Ribbon, RibbonSubgroup>) {
		ribbon.startAngle((d) => {
			return d.startAngle + this.get("startAngle", 0) * $math.RADIANS + Math.PI / 2;
		})

		ribbon.endAngle((d) => {
			return d.endAngle + this.get("startAngle", 0) * $math.RADIANS + Math.PI / 2;
		})
	}

	/**
	 * @ignore
	 */
	public makeLink(dataItem: DataItem<this["_dataItemSettings"]>): ChordLink {
		const link = this.linksContainer.children.push(this.links.make());
		this.links.push(link);
		link._setDataItem(dataItem);
		link.set("source", dataItem.get("source"));
		link.set("target", dataItem.get("target"));
		link.series = this;
		return link;
	}

	protected _makeMatrix(): number[][] {
		const matrix: number[][] = [];
		$array.each(this.nodes.dataItems, (sourceDataItem) => {
			const group: number[] = [];
			matrix.push(group);
			let outgoing = sourceDataItem.get("outgoingLinks");

			$array.each(this.nodes.dataItems, (targetDataItem) => {
				let value = 0;
				if (outgoing) {
					$array.each(outgoing, (outgoingLink) => {
						if (outgoingLink.get("target") === targetDataItem) {
							value = outgoingLink.get("valueWorking");
						}

						let valueSum = this.getPrivate("valueSum", 0);
						let minSize = this.get("minSize", 0);
						if(value > 0 && minSize > 0){
							if(value < valueSum * minSize){
								value = valueSum * minSize;
							}
						}
					})
				}

				group.push(value);
			})
		})
		return matrix;
	}

	public _prepareChildren() {
		super._prepareChildren();

		this._fixRibbon(this._ribbon);

		let chordChanged = false;

		if (this._valuesDirty || this._sizeDirty || this.isDirty("padAngle") || this.isDirty("startAngle")) {

			const matrix = this._makeMatrix();

			this._d3chord.padAngle(this.get("padAngle", 0) * $math.RADIANS);
			const sort = this.get("sort");

			if (sort === "ascending") {
				this._d3chord.sortGroups(ascending);
			}
			else if (sort === "descending") {
				this._d3chord.sortGroups(descending);
			}
/*
			this._d3chord.sortSubgroups((a, b)=>{
				if (a != Math.round(a)) return false
				if (b != Math.round(b)) return true
				return b < a ? -1 : b > a ? 1 : 0;
			})
*/
			this._chordLayout = this._d3chord(matrix);

			chordChanged = true;
		}

		if (chordChanged || this.isDirty("radius") || this.isDirty("nodeWidth")) {
			let radius = $utils.relativeToValue(this.get("radius", 0), Math.min(this.innerWidth(), this.innerHeight())) / 2;

			let i = 0;

			const chordStartAngle = this.get("startAngle", 0);
			const nodeWidth = this.get("nodeWidth", 0);

			$array.each(this.nodes.dataItems, (dataItem) => {
				const slice = dataItem.get("slice");
				const chordGroup = (this._chordLayout as any).groups[i];
				const startAngle = chordGroup.startAngle * $math.DEGREES + chordStartAngle;
				const endAngle = chordGroup.endAngle * $math.DEGREES + chordStartAngle;
				slice.setAll({ radius: radius, innerRadius: radius - nodeWidth, startAngle: startAngle as number, arc: endAngle - startAngle })

				const label = dataItem.get("label");
				label.setAll({ labelAngle: startAngle + (endAngle - startAngle) / 2 });
				label.setPrivate("radius", radius);
				label.setPrivate("innerRadius", 0.1);
				i++;
			})

			const linkRadius = radius - this.get("nodeWidth", 0);

			$array.each(this._chordLayout, (chord) => {

				let dataItem = this._linksByIndex[chord.source.index + "_" + chord.target.index];

				if (!dataItem) {
					dataItem = this._linksByIndex[chord.target.index + "_" + chord.source.index];
				}

				if (dataItem) {
					const link = dataItem.get("link");
					this._getLinkPoints(link, linkRadius, chord);
					this._updateLink(this._ribbon, link, linkRadius, chord);
				}
			})
		}
	}

	protected _getLinkPoints(link: ChordLink, linkRadius: number, chordLayoutItem: any) {
		const source = chordLayoutItem.source;
		const target = chordLayoutItem.target;

		const chordStartAngle = this.get("startAngle", 0) * $math.RADIANS;

		if (source && target) {
			const startAngle0 = source.startAngle;
			const endAngle0 = source.endAngle
			const angle0 = startAngle0 + (endAngle0 - startAngle0) / 2 + chordStartAngle;

			const startAngle1 = target.startAngle;
			const endAngle1 = target.endAngle
			const angle1 = startAngle1 + (endAngle1 - startAngle1) / 2 + chordStartAngle;

			link._p0 = { x: linkRadius * Math.cos(angle0), y: linkRadius * Math.sin(angle0) };
			link._p1 = { x: linkRadius * Math.cos(angle1), y: linkRadius * Math.sin(angle1) };
		}
	}

	protected _updateLink(ribbon: RibbonGenerator<any, Ribbon, RibbonSubgroup>, link: ChordLink, linkRadius: number, chordLayoutItem: any) {
		if (chordLayoutItem) {
			ribbon.sourceRadius($utils.relativeToValue(link.get("sourceRadius", p100), linkRadius));
			ribbon.targetRadius($utils.relativeToValue(link.get("targetRadius", p100), linkRadius));

			link.set("draw", (display) => {
				ribbon.context(display as any);
				ribbon(chordLayoutItem);
			})
		}
	}
}

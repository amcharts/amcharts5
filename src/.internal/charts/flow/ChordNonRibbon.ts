import type { ChordLink } from "./ChordLink";
import type { RibbonGenerator, RibbonSubgroup, Ribbon } from "d3-chord";

import { Chord, IChordSettings, IChordDataItem, IChordPrivate, IChordEvents } from "./Chord";

import * as $array from "../../core/util/Array";
import * as $math from "../../core/util/Math";
import * as $utils from "../../core/util/Utils";

export interface IChordNonRibbonDataItem extends IChordDataItem {

}

export interface IChordNonRibbonSettings extends IChordSettings {

	/**
	 * Type of the link:
	 *
	 * `"curve"` (default) will display link as a curved line.
	 * `"line"` will display link as a straight line.
	 *
	 * @default "curve"
	 */
	linkType?: "curve" | "line"

}

export interface IChordNonRibbonPrivate extends IChordPrivate {
}

export interface IChordNonRibbonEvents extends IChordEvents {
}

/**
 * Chord series with think line links.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/flow-charts/} for more information
 * @important
 */
export class ChordNonRibbon extends Chord {

	public static className: string = "ChordNonRibbon";
	public static classNames: Array<string> = Chord.classNames.concat([ChordNonRibbon.className]);

	declare public _settings: IChordNonRibbonSettings;
	declare public _privateSettings: IChordNonRibbonPrivate;
	declare public _dataItemSettings: IChordNonRibbonDataItem;

	protected _afterNew() {
		this._settings.themeTags = $utils.mergeTags(this._settings.themeTags, ["chord", "basic"]);

		super._afterNew();
	}

	protected _makeMatrix(): number[][] {
		const matrix: number[][] = [];
		$array.each(this.nodes.dataItems, (sourceDataItem) => {
			const group: number[] = [];
			matrix.push(group);

			$array.each(this.nodes.dataItems, (targetDataItem) => {
				let value = 1;

				if (sourceDataItem === targetDataItem) {
					value = 0;
				}

				group.push(value);
			})
		})
		return matrix;
	}

	protected _updateLink(_ribbon: RibbonGenerator<any, Ribbon, RibbonSubgroup>, link: ChordLink, _linkRadius: number, chordLayoutItem: any) {
		link._type = this.get("linkType");
		if (chordLayoutItem) {
			const linkType = this.get("linkType");

			link.set("draw", (display) => {
				let p0 = link._p0;
				let p1 = link._p1;
				if (p0 && p1) {
					display.moveTo(p0.x, p0.y);
					if (linkType == "line") {
						display.lineTo(p1.x, p1.y);
					}
					else {
						display.quadraticCurveTo(0, 0, p1.x, p1.y);
					}
				}
			})
		}
	}

	protected _getLinkPoints(link: ChordLink, linkRadius: number, _chordLayoutItem: any) {
		const source = link.get("source");
		const target = link.get("target");

		if (source && target) {

			const sourceSlice = source.get("slice");
			const targetSlice = target.get("slice");

			const startAngle0 = sourceSlice.get("startAngle", 0);
			const arc0 = sourceSlice.get("arc", 0)
			const angle0 = startAngle0 + arc0 / 2;

			const startAngle1 = targetSlice.get("startAngle", 0);
			const arc1 = targetSlice.get("arc", 0)
			const angle1 = startAngle1 + arc1 / 2;

			link._p0 = { x: linkRadius * $math.cos(angle0), y: linkRadius * $math.sin(angle0) };
			link._p1 = { x: linkRadius * $math.cos(angle1), y: linkRadius * $math.sin(angle1) };
		}
	}
}

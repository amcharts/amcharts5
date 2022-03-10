import { FlowLink, IFlowLinkPrivate, IFlowLinkSettings } from "./FlowLink";
import type { DataItem } from "../../core/render/Component";
import type { IChordNodesDataItem } from "./ChordNodes";
import type { Percent } from "../../core/util/Percent";
import type { Chord, IChordDataItem } from "./Chord";
import type { IOrientationPoint, IPoint } from "../../core/util/IPoint";
import * as $math from "../../core/util/Math";

export interface IChordLinkSettings extends IFlowLinkSettings {

	/**
	 * Source data item.
	 */
	source?: DataItem<IChordNodesDataItem>;

	/**
	 * target data item.
	 */
	target?: DataItem<IChordNodesDataItem>;

	/**
	 * Radius of the link at the source.
	 */
	sourceRadius?: number | Percent;

	/**
	 * Radius of the link at the end (target).
	 */
	targetRadius?: number | Percent;

}

export interface IChordLinkPrivate extends IFlowLinkPrivate {
}

/**
 * A link element used in [[Chord]] chart.
 */
export class ChordLink extends FlowLink {

	public _p0: IPoint | undefined;
	public _p1: IPoint | undefined;

	public _type: "line" | "curve" | undefined;

	declare public _settings: IChordLinkSettings;
	declare public _privateSettings: IChordLinkPrivate;

	public static className: string = "ChordLink";
	public static classNames: Array<string> = FlowLink.classNames.concat([ChordLink.className]);

	declare protected _dataItem: DataItem<IChordDataItem> | undefined;

	declare public series: Chord | undefined;

	public getPoint(location: number): IOrientationPoint {
		if (this._p0 && this._p1) {
			if (this._type === "line") {
				let p = $math.getPointOnLine(this._p0, this._p1, location);
				return { x: p.x, y: p.y, angle: $math.getAngle(this._p0, this._p1) };
			}
			else {
				let p0 = $math.getPointOnQuadraticCurve(this._p0, this._p1, { x: 0, y: 0 }, Math.max(0, location - 0.01));
				let p1 = $math.getPointOnQuadraticCurve(this._p0, this._p1, { x: 0, y: 0 }, Math.min(1, location + 0.01));
				let p = $math.getPointOnQuadraticCurve(this._p0, this._p1, { x: 0, y: 0 }, location);

				return { x: p.x, y: p.y, angle: $math.getAngle(p0, p1) };
			}
		}
		return { x: 0, y: 0, angle: 0 };
	}
}

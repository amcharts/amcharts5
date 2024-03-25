import type { DataItem } from "../../core/render/Component";
import type { FlowNode } from "./FlowNode";
import type { Sankey, ISankeyDataItem } from "./Sankey";
import type { ISankeyNodesDataItem } from "./SankeyNodes";
import type { IOrientationPoint } from "../../core/util/IPoint";

import { FlowLink, IFlowLinkPrivate, IFlowLinkSettings } from "./FlowLink";
import type { IPoint } from "../../core/util/IPoint";
import * as $math from "../../core/util/Math";


export interface ISankeyLinkSettings extends IFlowLinkSettings {

	/**
	 * Source node data item.
	 */
	source?: DataItem<ISankeyNodesDataItem>;

	/**
	 * Source node data item.
	 */
	target?: DataItem<ISankeyNodesDataItem>;

	/**
	 * Type of fill to use for links.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/flow-charts/sankey-diagram/#Color_mode} for more info
	 * @default "gradient"
	 */
	fillStyle?: "solid" | "gradient" | "source" | "target";

	/**
	 * A relative distance from node for link "elbow" (bend point).
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/flow-charts/sankey-diagram/#Bend_point} for more info
	 * @default 0.2
	 */
	controlPointDistance?: number;

}

export interface ISankeyLinkPrivate extends IFlowLinkPrivate {

	/**
	 * Link orientation.
	 */
	orientation?: "horizontal" | "vertical";

}

export class SankeyLink extends FlowLink {
	declare public _settings: ISankeyLinkSettings;
	declare public _privateSettings: ISankeyLinkPrivate;

	public static className: string = "SankeyLink";
	public static classNames: Array<string> = FlowLink.classNames.concat([SankeyLink.className]);

	declare protected _dataItem: DataItem<ISankeyDataItem> | undefined;

	declare public series: Sankey | undefined;

	protected _svgPath: SVGPathElement = document.createElementNS("http://www.w3.org/2000/svg", "path");
	protected _totalLength: number = 0;


	public _beforeChanged() {
		super._beforeChanged();

		if (this.isDirty("source")) {
			const source = this.get("source");
			if (source) {
				const sourceNode = source.get("node");
				this._disposers.push(sourceNode.events.on("positionchanged", () => {
					this.markDirty();
				}))
			}
		}
		if (this.isDirty("target")) {
			const target = this.get("target");
			if (target) {
				const targetNode = target.get("node");
				this._disposers.push(targetNode.events.on("positionchanged", () => {
					this.markDirty();
				}))
			}
		}

		if (this.isPrivateDirty("orientation")) {
			const series = this.series;
			const dataItem = this.dataItem as DataItem<ISankeyDataItem>;
			if (dataItem && series) {
				series._updateLinkColor(dataItem);
			}
		}

		const target = this.get("target");
		const source = this.get("source");

		let sourceNode: FlowNode | undefined;
		let targetNode: FlowNode | undefined;

		if (source && target) {
			this._clear = true;
			sourceNode = source.get("node");
			targetNode = target.get("node");

			let x0 = 0;
			let x1 = 0;
			let y0 = 0;
			let y1 = 0;

			let xt0 = 0;
			let yt0 = 0;

			let xt1 = 0;
			let yt1 = 0;

			let xb0 = 0;
			let xb1 = 0;

			let yb0 = 0;
			let yb1 = 0;

			let xm0 = 0;
			let xm1 = 0;

			let ym0 = 0;
			let ym1 = 0;

			let angle0 = 0;
			let angle1 = 0;


			const dataItem = this.dataItem as DataItem<ISankeyDataItem>;
			if (dataItem) {
				const d3SankeyLink = dataItem.get("d3SankeyLink");
				if (d3SankeyLink) {

					let w = d3SankeyLink.width || 0;

					let orientation = this.getPrivate("orientation");

					if (orientation == "vertical") {
						if (sourceNode) {
							y0 = sourceNode.y() + sourceNode.get("dy", 0);
						}
						if (targetNode) {
							y1 = targetNode.y() + targetNode.get("dy", 0);
						}

						angle0 = 90;
						angle1 = 90;

						x0 = d3SankeyLink.y0 || 0;
						x1 = d3SankeyLink.y1 || 0;

						x0 += sourceNode.get("dx", 0);
						x1 += targetNode.get("dx", 0);

						if (y1 < y0) {
							[x0, x1] = [x1, x0];
							[y0, y1] = [y1, y0];
						}

						if (source.get("unknown")) {
							x0 = x1;
							y0 = y0 + (y1 - y0) / 2;
						}

						if (target.get("unknown")) {
							x1 = x0;
							y1 = y0 + (y1 - y0) / 2;
						}


						xt0 = x0 - w / 2;
						yt0 = y0;

						xt1 = x1 - w / 2;
						yt1 = y1;

						xb0 = x0 + w / 2;
						xb1 = x1 + w / 2;

						yb0 = y0;
						yb1 = y1;

						xm0 = x0;
						xm1 = x1;

						ym0 = y0;
						ym1 = y1;
					}
					else {
						if (sourceNode) {
							x0 = sourceNode.x() + sourceNode.get("dx", 0);
						}
						if (targetNode) {
							x1 = targetNode.x() + targetNode.get("dx", 0);
						}

						y0 = d3SankeyLink.y0 || 0;
						y1 = d3SankeyLink.y1 || 0;

						y0 += sourceNode.get("dy", 0);
						y1 += targetNode.get("dy", 0);

						if (x1 < x0) {
							[x0, x1] = [x1, x0];
							[y0, y1] = [y1, y0];
						}

						if (source.get("unknown")) {
							y0 = y1;
							x0 = x0 + (x1 - x0) / 2;
						}

						if (target.get("unknown")) {
							y1 = y0;
							x1 = x0 + (x1 - x0) / 2;
						}

						xt0 = x0;
						yt0 = y0 - w / 2;

						xt1 = x1;
						yt1 = y1 - w / 2;

						xb0 = x0;
						xb1 = x1;

						yb0 = y0 + w / 2;
						yb1 = y1 + w / 2;

						xm0 = x0;
						xm1 = x1;

						ym0 = y0;
						ym1 = y1;
					}

					if ($math.round(xt0, 3) == $math.round(xt1, 3)) {
						xt1 += 0.01;
					}

					if ($math.round(yt0, 3) == $math.round(yt1, 3)) {
						yt1 += 0.01;
					}

					if ($math.round(xb0, 3) == $math.round(xb1, 3)) {
						xb1 += 0.01;
					}

					if ($math.round(yb0, 3) == $math.round(yb1, 3)) {
						yb1 += 0.01;
					}

					let cpd = this.get("controlPointDistance", 0.2);
					cpd = Math.min(0.4999, cpd);

					let kxt0 = xt0 + (xt1 - xt0) * cpd * $math.cos(angle0);
					let kyt0 = yt0 + (yt1 - yt0) * cpd * $math.sin(angle0);

					let kxt1 = xt1 - (xt1 - xt0) * cpd * $math.cos(angle1);
					let kyt1 = yt1 - (yt1 - yt0) * cpd * $math.sin(angle1);

					let kxm0 = xm0 + (xm1 - xm0) * cpd * $math.cos(angle0);
					let kym0 = ym0 + (ym1 - ym0) * cpd * $math.sin(angle0);

					let kxm1 = xm1 - (xm1 - xm0) * cpd * $math.cos(angle1);
					let kym1 = ym1 - (ym1 - ym0) * cpd * $math.sin(angle1);

					let angle = $math.getAngle({ x: kxt0, y: kyt0 }, { x: kxt1, y: kyt1 });

					let dx = (w / $math.cos(angle) - w) / $math.tan(angle) * $math.cos(angle0);
					let dy = (w / $math.sin(angle) - w) * $math.tan(angle) * $math.sin(angle0);

					let kxb0 = -dx / 2 + xb0 + (xb1 - xb0) * cpd * $math.cos(angle0);
					let kyb0 = -dy / 2 + yb0 + (yb1 - yb0) * cpd * $math.sin(angle0);

					let kxb1 = -dx / 2 + xb1 - (xb1 - xb0) * cpd * $math.cos(angle1);
					let kyb1 = -dy / 2 + yb1 - (yb1 - yb0) * cpd * $math.sin(angle1);

					kxt0 += dx / 2;
					kyt0 += dy / 2;

					kxt1 += dx / 2;
					kyt1 += dy / 2;

					if (orientation == "vertical") {
						kyt0 = Math.min(yt1, Math.max(yt0 + 1, kyt0));
						kyb0 = Math.min(yb1, Math.max(yb0 + 1, kyb0));

						kyt1 = Math.max(yt0, Math.min(yt1 - 1, kyt1));
						kyb1 = Math.max(yb0, Math.min(yb1 - 1, kyb1));
					}
					else {
						kxt0 = Math.min(xt1, Math.max(xt0 + 1, kxt0));
						kxb0 = Math.min(xb1, Math.max(xb0 + 1, kxb0));

						kxt1 = Math.max(xt0, Math.min(xt1 - 1, kxt1));
						kxb1 = Math.max(xb0, Math.min(xb1 - 1, kxb1));
					}

					let segment = [[xt0, yt0, xb0, yb0], [kxt0, kyt0, kxb0, kyb0], [kxt1, kyt1, kxb1, kyb1], [xt1, yt1, xb1, yb1]];

					this.set("draw", (display) => {
						const series = this.series!;
						series._fillGenerator.context(display as any);
						series._fillGenerator(segment as [number, number][]);
					})

					let middleSegment = [[xm0, ym0], [kxm0, kym0], [kxm1, kym1], [xm1, ym1]];

					const path = this.series!._strokeGenerator(middleSegment as [number, number][]);

					if (path) {
						this._svgPath.setAttribute("d", path);
						this._totalLength = this._svgPath.getTotalLength();
					}
				}
			}
		}
		if (this.series && this.dataItem) {
			this.series._positionBullets(this.dataItem as any);
		}
	}

	public getPoint(location: number): IOrientationPoint {
		if (this._svgPath) {
			if (this._svgPath.getAttribute("d")) {
				let p0 = this._svgPath.getPointAtLength(location * this._totalLength - 0.1);
				let p1 = this._svgPath.getPointAtLength(location * this._totalLength + 0.1);
				let p = this.toGlobal(this._svgPath.getPointAtLength(location * this._totalLength));
				return { x: p.x, y: p.y, angle: $math.getAngle(p0, p1) };
			}
		}
		return { x: 0, y: 0, angle: 0 }
	}

	public _getTooltipPoint(): IPoint {
		return this.toLocal(super._getTooltipPoint());
	}
}

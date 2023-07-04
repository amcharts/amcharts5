import { FlowLink, IFlowLinkPrivate, IFlowLinkSettings } from "./FlowLink";
import type { DataItem } from "../../core/render/Component";
import type { IArcDiagramNodesDataItem } from "./ArcDiagramNodes";
import type { ArcDiagram, IArcDiagramDataItem } from "./ArcDiagram";
import type { IOrientationPoint, IPoint } from "../../core/util/IPoint";
import * as $math from "../../core/util/Math";


export interface IArcDiagramLinkSettings extends IFlowLinkSettings {

	/**
	 * Source data item.
	 */
	source?: DataItem<IArcDiagramNodesDataItem>;

	/**
	 * target data item.
	 */
	target?: DataItem<IArcDiagramNodesDataItem>;
}

export interface IArcDiagramLinkPrivate extends IFlowLinkPrivate {
	/**
	 * Link orientation.
	 */
	orientation?: "horizontal" | "vertical";
}

/**
 * A link element used in [[ArcDiagram]] chart.
 */
export class ArcDiagramLink extends FlowLink {

	public _p0: IPoint | undefined;
	public _p1: IPoint | undefined;
	public _radius: number = 0;

	declare public _settings: IArcDiagramLinkSettings;
	declare public _privateSettings: IArcDiagramLinkPrivate;

	public static className: string = "ArcDiagramLink";
	public static classNames: Array<string> = FlowLink.classNames.concat([ArcDiagramLink.className]);

	declare protected _dataItem: DataItem<IArcDiagramDataItem> | undefined;

	declare public series: ArcDiagram | undefined;

	public _beforeChanged() {
		super._beforeChanged();

		if (this.isDirty("source")) {
			const source = this.get("source");
			if (source) {
				const sourceNode = source.get("node");
				this._disposers.push(sourceNode.events.on("positionchanged", () => {
					this._markDirtyKey("stroke");
				}))
			}
		}
		if (this.isDirty("target")) {
			const target = this.get("target");
			if (target) {
				const targetNode = target.get("node");
				this._disposers.push(targetNode.events.on("positionchanged", () => {
					this._markDirtyKey("stroke");
				}))
			}
		}

		if (this.isPrivateDirty("orientation")) {
			const series = this.series;
			const dataItem = this.dataItem as DataItem<IArcDiagramDataItem>;
			if (dataItem && series) {
				series._updateLinkColor(dataItem);
			}
		}

		if (this.series && this.dataItem) {
			this.series._positionBullets(this.dataItem as any);
		}

		if (this.get("strokeStyle") == "gradient") {
			this.set("isMeasured", true);
		}
		else {
			this.set("isMeasured", false);
		}
	}

	public _changed() {
		super._changed();

		if (this._clear) {
			this._draw();
		}
	}

	public _draw() {
		const target = this.get("target");
		const source = this.get("source");

		if (source && target) {
			let sourceNode = source.get("node");
			let targetNode = target.get("node");

			const x0 = sourceNode.x();
			const y0 = sourceNode.y();

			const x1 = targetNode.x();
			const y1 = targetNode.y();

			this._p0 = { x: x0, y: y0 };
			this._p1 = { x: x1, y: y1 };

			let radius = 0;

			if (this.getPrivate("orientation") == "vertical") {
				radius = (y1 - y0) / 2;
				let d = 1;
				if (y0 > y1) {
					d = -1;
				}

				this._display.arc(x0, y0 + radius, radius * d, -Math.PI / 2, Math.PI / 2);
			}
			else {
				radius = (x1 - x0) / 2;
				let d = 1;
				if (x0 > x1) {
					d = -1;
				}
				this._display.arc(x0 + radius, y0, radius * d, -Math.PI, 0);
			}
			this._radius = radius;
		}
	}


	public getPoint(location: number): IOrientationPoint {
		if (this._p0 && this._p1) {
			const radius = this._radius;

			if (this.getPrivate("orientation") == "vertical") {
				let angle = -90 + 180 * location;
				return { y: this._p0.y + radius + radius * $math.sin(angle), x: radius * $math.cos(angle), angle: angle + 90 };
			}
			else {
				let angle = 180 + 180 * location;
				return { x: this._p0.x + radius + radius * $math.cos(angle), y: radius * $math.sin(angle), angle: angle + 90 };
			}
		}
		return { x: 0, y: 0, angle: 0 };
	}
}

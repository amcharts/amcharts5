import { SimpleLineSeries, ISimpleLineSeriesSettings, ISimpleLineSeriesPrivate, ISimpleLineSeriesDataItem } from "./SimpleLineSeries";

export interface IQuadrantLineSeriesDataItem extends ISimpleLineSeriesDataItem {
}

export interface IQuadrantLineSeriesSettings extends ISimpleLineSeriesSettings {

	/**
	 * Value field to use for calculations.
	 *
	 * @default "value"
	 */
	field: "open" | "value" | "low" | "high";

}

export interface IQuadrantLineSeriesPrivate extends ISimpleLineSeriesPrivate {
}

export class QuadrantLineSeries extends SimpleLineSeries {
	public static className: string = "QuadrantLineSeries";
	public static classNames: Array<string> = SimpleLineSeries.classNames.concat([QuadrantLineSeries.className]);

	declare public _settings: IQuadrantLineSeriesSettings;
	declare public _privateSettings: IQuadrantLineSeriesPrivate;
	declare public _dataItemSettings: IQuadrantLineSeriesDataItem;

	protected _tag = "quadrant";

	protected _afterNew() {
		super._afterNew();
		this.strokes.template.set("visible", false);
	}

	protected _updateSegment(index: number) {
		const movePoint = this._movePointerPoint;
		const diP1 = this._di[index]["p1"];
		const diP2 = this._di[index]["p2"];

		const series = this.get("series");

		if (series && movePoint) {
			const xAxis = this.get("xAxis");

			let x1 = this._getXValue(diP1.get("valueX" as any));
			let x2 = this._getXValue(diP2.get("valueX" as any));

			const di1 = xAxis.getSeriesItem(series, Math.max(0, xAxis.valueToPosition(x1)));
			const di2 = xAxis.getSeriesItem(series, Math.min(1, xAxis.valueToPosition(x2)));

			const field = this.get("field") + "Y";

			if (di1 && di2) {
				let y1 = di1.get(field as any);
				let y2 = di2.get(field as any);

				diP1.set("valueY", y1);
				diP1.set("valueYWorking", y1);

				diP2.set("valueY", y2);
				diP2.set("valueYWorking", y2);

				diP1.set("valueX", x1);
				diP2.set("valueX", x2);

				this._positionBullets(diP1);
				this._positionBullets(diP2);
			}
		}
	}

	public _updateChildren() {

		super._updateChildren();

		const chart = this.chart;
		this.fills.clear();
		if (chart) {
			for (let i = 0; i < this._lines.length; i++) {
				const line = this._lines[i];
				if(line){
					const diP1 = this._di[i]["p1"];
					const diP2 = this._di[i]["p2"];

					const fill1 = this.makeFill(this.fills);
					const fill2 = this.makeFill(this.fills);

					const index = this.dataItems.indexOf(diP1);
					for (let j = index; j >= 0; j--) {
						const dataContext = this.dataItems[j].dataContext as any;
						const template = dataContext.fill;
						if (template) {
							fill1.template = template;
							fill2.template = template;
						}
					}

					const userData = [this.dataItems.indexOf(diP1), this.dataItems.indexOf(diP2)];
					const settings = { userData: userData };

					fill1.setAll(settings);
					fill2.setAll(settings);
					fill2.set("forceInactive", true);

					const p1 = diP1.get("point");
					const p2 = diP2.get("point");

					if (p1 && p2) {
						const dy = (p2.y - p1.y) / 4;
						const m1y = p1.y + dy;
						const m2y = p1.y + dy * 2;
						const m3y = p1.y + dy * 3;

						line.set("draw", (display) => {
							display.moveTo(p1.x, p1.y);
							display.lineTo(p2.x, p1.y);

							display.moveTo(p1.x, m1y);
							display.lineTo(p2.x, m1y);

							display.moveTo(p1.x, m2y);
							display.lineTo(p2.x, m2y);

							display.moveTo(p1.x, m3y);
							display.lineTo(p2.x, m3y);

							display.moveTo(p1.x, p2.y);
							display.lineTo(p2.x, p2.y);
						})

						fill1.set("draw", (display) => {
							display.moveTo(p1.x, p1.y);
							display.lineTo(p2.x, p1.y);

							display.lineTo(p2.x, p2.y);
							display.lineTo(p1.x, p2.y);
							display.lineTo(p1.x, p1.y);
						})

						fill2.set("draw", (display) => {
							display.moveTo(p1.x, m1y);
							display.lineTo(p2.x, m1y);

							display.lineTo(p2.x, m3y);
							display.lineTo(p1.x, m3y);
							display.lineTo(p1.x, m1y);
						})
					}
				}
			}
		}
	}

	protected _drawFill() {

	}

	// need to override so that location would not be set
	protected _setXLocation() {

	}

	protected _updateLine() {

	}	
}
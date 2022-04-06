import { Layout, ILayoutSettings, ILayoutPrivate, eachChildren } from "./Layout";
import * as $array from "../util/Array";
import * as $math from "../util/Math";
import type { Container } from "./Container";


export interface IGridLayoutSettings extends ILayoutSettings {

	/**
	 * If set to `true` all columns in the grid will be equal width.
	 *
	 * @default false
	 */
	fixedWidthGrid?: boolean;

	/**
	 * Maximum number of columns in the grid.
	 */
	maxColumns?: number;

}

export interface IGridLayoutPrivate extends ILayoutPrivate {
}

/**
 * A grid children layout for [[Container]].
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/common-elements/containers/#Layout} for more info
 */
export class GridLayout extends Layout {

	public static className: string = "GridLayout";
	public static classNames: Array<string> = Layout.classNames.concat([GridLayout.className]);

	declare public _settings: IGridLayoutSettings;
	declare public _privateSettings: IGridLayoutPrivate;


	protected _afterNew() {
		this._setRawDefault("maxColumns", Number.MAX_VALUE);
		super._afterNew();
	}

	/**
	 * @ignore
	 */
	public updateContainer(container: Container): void {
		let paddingLeft = container.get("paddingLeft", 0);
		let paddingRight = container.get("paddingRight", 0);
		let paddingTop = container.get("paddingTop", 0);

		let availableWidth = container.maxWidth() - paddingLeft - paddingRight;

		let minCellWidth = availableWidth;
		let maxCellWidth = 1;

		eachChildren(container, (child) => {
			if(child.get("visible") && child.getPrivate("visible") && !child.get("forceHidden")){
				if (child.get("position") != "absolute") {
					let childWidth = child.width();

					if (childWidth < minCellWidth) {
						minCellWidth = childWidth;
					}
					if (childWidth > maxCellWidth) {
						maxCellWidth = childWidth;
					}
				}
			}
		});

		minCellWidth = $math.fitToRange(minCellWidth, 1, availableWidth);
		maxCellWidth = $math.fitToRange(maxCellWidth, 1, availableWidth);

		let columnCount = 1;
		if (this.get("fixedWidthGrid")) {
			columnCount = availableWidth / maxCellWidth;
		}
		else {
			columnCount = availableWidth / minCellWidth;
		}

		columnCount = Math.max(1, Math.floor(columnCount));
		columnCount = Math.min(this.get("maxColumns", Number.MAX_VALUE), columnCount);

		let columnWidths = this.getColumnWidths(container, columnCount, maxCellWidth, availableWidth);

		let prevY = paddingTop;

		let column = 0;
		let maxColumnHeight = 0;

		columnCount = columnWidths.length;

		let prevX = paddingLeft;

		eachChildren(container, (child) => {
			if (child.get("position") == "relative" && child.isVisible()) {
				const marginTop = child.get("marginTop", 0);
				const marginBottom = child.get("marginBottom", 0);

				let bounds = child.adjustedLocalBounds();

				let marginLeft = child.get("marginLeft", 0);
				let marginRight = child.get("marginRight", 0);
				let x = prevX + marginLeft - bounds.left;
				let y = prevY + marginTop - bounds.top;

				child.setPrivate("x", x);
				child.setPrivate("y", y);

				prevX += columnWidths[column] + marginRight;

				maxColumnHeight = Math.max(maxColumnHeight, child.height() + marginTop + marginBottom);

				column++;

				if (column >= columnCount) {
					column = 0;
					prevX = paddingLeft;
					prevY += maxColumnHeight;
				}
			}
		});
	}

	/**
	 * @ignore
	 */
	public getColumnWidths(container: Container, columnCount: number, maxCellWidth: number, availableWidth: number): number[] {
		let totalWidth = 0;
		let columnWidths: Array<number> = [];
		let column = 0;

		eachChildren(container, (child) => {
			let bounds = child.adjustedLocalBounds();
			if (child.get("position") != "absolute" && child.isVisible()) {
				if (this.get("fixedWidthGrid")) {
					columnWidths[column] = maxCellWidth;
				}
				else {
					columnWidths[column] = Math.max(columnWidths[column] | 0, bounds.right - bounds.left + child.get("marginLeft", 0) + child.get("marginRight", 0));
				}

				if (column < container.children.length - 1) {
					column++;
					if (column == columnCount) {
						column = 0;
					}
				}
			}
		});

		$array.each(columnWidths, (w) => {
			totalWidth += w;
		})

		if (totalWidth > availableWidth) {
			if (columnCount > 2) {
				columnCount -= 1;
				return this.getColumnWidths(container, columnCount, maxCellWidth, availableWidth);
			}
			else {
				return [availableWidth];
			}
		}

		return columnWidths;
	}
}

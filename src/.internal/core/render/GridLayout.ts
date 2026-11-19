import { Layout, ILayoutSettings, ILayoutPrivate, eachChildren, placeX } from "./Layout";
import type { IPlaced } from "./Layout";
import * as $array from "../util/Array";
import * as $math from "../util/Math";
import type { Container } from "./Container";
import type { Sprite } from "./Sprite";


export interface IGridLayoutSettings extends ILayoutSettings {

	/**
	 * Makes all columns as wide as the widest child.
	 *
	 * @default false
	 */
	fixedWidthGrid?: boolean;

	/**
	 * Maximum number of columns. No limit if not set.
	 */
	maxColumns?: number;

}

export interface IGridLayoutPrivate extends ILayoutPrivate {
}

/**
 * Lays out a [[Container]]'s children in rows from left to right, with as
 * many columns as fit its width. With the container's `direction: "rtl"`,
 * rows go from right to left, so a partly filled last row is on the right.
 *
 * @see {@link https://docs.amcharts.com/v5/concepts/common-elements/containers/#layout} for more info
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

		let columnWidths = this._columns(container, availableWidth);

		let prevY = paddingTop;

		let column = 0;
		let maxRowHeight = 0;

		let columnCount = columnWidths.length;

		let prevX = paddingLeft;
		const rtl = container._isRtl();
		const placed: Array<IPlaced> = [];
		let contentRight = paddingLeft;

		eachChildren(container, (child) => {
			if (child.get("position") == "relative" && child.isVisible()) {
				const marginTop = child.get("marginTop", 0);
				const marginBottom = child.get("marginBottom", 0);

				let bounds = child.adjustedLocalBounds();

				let marginLeft = child.get("marginLeft", 0);
				let marginRight = child.get("marginRight", 0);
				let x = prevX + marginLeft - bounds.left;
				let y = prevY + marginTop - bounds.top;

				if (rtl) {
					placed.push({ child, x, left: bounds.left, right: bounds.right });
				}
				else {
					child.setPrivate("x", x);
				}
				child.setPrivate("y", y);

				prevX += columnWidths[column] + marginRight;
				contentRight = Math.max(contentRight, prevX);

				maxRowHeight = Math.max(maxRowHeight, child.height() + marginTop + marginBottom);

				column++;

				if (column >= columnCount) {
					column = 0;
					prevX = paddingLeft;
					prevY += maxRowHeight;
					maxRowHeight = 0;
				}
			}
		});

		if (rtl) {
			placeX(container, placed, contentRight);
		}
	}

	/**
	 * @ignore
	 */
	/**
	 * The widths of the columns the container's children are placed in, when
	 * `availableWidth` is the width inside its padding; `extra` says how much
	 * wider than now a child would be.
	 *
	 * @ignore
	 */
	public _columns(container: Container, availableWidth: number, extra?: (child: Sprite) => number): number[] {
		let minCellWidth = availableWidth;
		let maxCellWidth = 1;

		eachChildren(container, (child) => {
			if(child.get("visible") && child.getPrivate("visible") && !child.get("forceHidden")){
				if (child.get("position") != "absolute") {
					let childWidth = child.width() + (extra ? extra(child) : 0);

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

		return this.getColumnWidths(container, columnCount, maxCellWidth, availableWidth, extra);
	}

	/**
	 * The height of the rows the container's children take in `columnCount`
	 * columns, margins included.
	 *
	 * @ignore
	 */
	public _rowsHeight(container: Container, columnCount: number): number {
		let total = 0;
		let column = 0;
		let maxRowHeight = 0;
		eachChildren(container, (child) => {
			if (child.get("position") == "relative" && child.isVisible()) {
				maxRowHeight = Math.max(maxRowHeight, child.height() + child.get("marginTop", 0) + child.get("marginBottom", 0));
				column++;
				if (column >= columnCount) {
					column = 0;
					total += maxRowHeight;
					maxRowHeight = 0;
				}
			}
		});
		return total + maxRowHeight;
	}

	public getColumnWidths(container: Container, columnCount: number, maxCellWidth: number, availableWidth: number, extra?: (child: Sprite) => number): number[] {
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
					columnWidths[column] = Math.max(columnWidths[column] | 0, bounds.right - bounds.left + (extra ? extra(child) : 0) + child.get("marginLeft", 0) + child.get("marginRight", 0));
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
				return this.getColumnWidths(container, columnCount, maxCellWidth, availableWidth, extra);
			}
			else {
				return [availableWidth];
			}
		}

		return columnWidths;
	}
}

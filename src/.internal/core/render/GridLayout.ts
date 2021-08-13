import { Layout, ILayoutSettings, ILayoutPrivate } from "./Layout";
import * as $array from "../util/Array";
import * as $math from "../util/Math";
import type { Template } from "../../core/util/Template";
import type { Container } from "./Container";
import type { Root } from "../Root";
import type { List } from "../util/List";
import type { Sprite } from "./Sprite";


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

	/**
	 * Use this method to create an instance of this class.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/getting-started/#New_element_syntax} for more info
	 * @param   root      Root element
	 * @param   settings  Settings
	 * @param   template  Template
	 * @return            Instantiated object
	 */
	public static new(root: Root, settings: GridLayout["_settings"], template?: Template<GridLayout>): GridLayout {
		const x = new GridLayout(root, settings, true, template);
		x._afterNew();
		return x;
	}

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

		container.children.each((child) => {
			if (child.get("position") != "absolute") {
				let childWidth = child.width();

				if (childWidth < minCellWidth) {
					minCellWidth = childWidth;
				}
				if (childWidth > maxCellWidth) {
					maxCellWidth = childWidth;
				}
			}
		})

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

		let columnWidths = this.getColumnWidths(container.children, columnCount, maxCellWidth, availableWidth);

		let prevY = paddingTop;

		let column = 0;
		let maxColumnHeight = 0;

		columnCount = columnWidths.length;

		let prevX = paddingLeft;

		container.children.each((child) => {
			if (child.get("position") == "relative") {
				const marginTop = child.get("marginTop", 0);
				const marginBottom = child.get("marginBottom", 0);

				let bounds = child.adjustedLocalBounds();
				let marginLeft = child.get("marginLeft", 0);
				let marginRight = child.get("marginRight", 0);
				let x = prevX + marginLeft - bounds.left;
				let y = prevY + marginTop - bounds.top;

				child.set("x", x);
				child.set("y", y);

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
	public getColumnWidths(children: List<Sprite>, columnCount: number, maxCellWidth: number, availableWidth: number): number[] {
		let totalWidth = 0;
		let columnWidths: Array<number> = [];
		let column = 0;

		children.each((child) => {
			let bounds = child.adjustedLocalBounds();
			if (child.get("position") != "absolute") {
				if (this.get("fixedWidthGrid")) {
					columnWidths[column] = maxCellWidth;
				}
				else {
					columnWidths[column] = Math.max(columnWidths[column] | 0, bounds.right - bounds.left + child.get("marginLeft", 0) + child.get("marginRight", 0));
				}

				if (column < children.length - 1) {
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
				return this.getColumnWidths(children, columnCount, maxCellWidth, availableWidth);
			}
			else {
				return [availableWidth];
			}
		}

		return columnWidths;
	}
}

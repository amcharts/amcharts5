import { Layout, eachChildren } from "./Layout";
import * as $type from "../util/Type";
import { Percent } from "../util/Percent";
import type { Container } from "./Container";

/**
 * A horizontal children layout for [[Container]].
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/common-elements/containers/#Layout} for more info
 */
export class HorizontalLayout extends Layout {

	public static className: string = "HorizontalLayout";
	public static classNames: Array<string> = Layout.classNames.concat([HorizontalLayout.className]);

	/**
	 * @ignore
	 */
	public updateContainer(container: Container): void {

		let paddingLeft = container.get("paddingLeft", 0);

		let availableWidth = container.innerWidth();

		let totalPercent = 0;

		eachChildren(container, (child) => {
			if (child.isVisible()) {
				if (child.get("position") == "relative") {
					let childWidth = child.get("width");
					if (childWidth instanceof Percent) {
						totalPercent += childWidth.value;

						let w = availableWidth * childWidth.value;
						let minWidth = child.get("minWidth", child.getPrivate("minWidth", -Infinity));
						if (minWidth > w) {
							availableWidth -= minWidth;
							totalPercent -= childWidth.value;
						}
						let maxWidth = child.get("maxWidth", child.getPrivate("maxWidth", Infinity));
						if (w > maxWidth) {
							availableWidth -= maxWidth;
							totalPercent -= childWidth.value;
						}
					}
					else {
						if (!$type.isNumber(childWidth)) {
							childWidth = child.width();
						}
						availableWidth -= childWidth + child.get("marginLeft", 0) + child.get("marginRight", 0);
					}
				}
			}
		});

		if (availableWidth <= 0 || availableWidth == Infinity) {
			availableWidth = .1;
		}

		//if (availableWidth > 0) {
		eachChildren(container, (child) => {
			if (child.isVisible()) {
				if (child.get("position") == "relative") {
					let childWidth = child.get("width");
					if (childWidth instanceof Percent) {
						let privateWidth = availableWidth * childWidth.value / totalPercent - child.get("marginLeft", 0) - child.get("marginRight", 0);
						let minWidth = child.get("minWidth", child.getPrivate("minWidth", -Infinity));
						let maxWidth = child.get("maxWidth", child.getPrivate("maxWidth", Infinity));
						privateWidth = Math.min(Math.max(minWidth, privateWidth), maxWidth);

						child.setPrivate("width", privateWidth);
					}
					else {
						if (child._prevSettings.width instanceof Percent) {
							child.setPrivate("width", undefined);
						}
					}
				}
			}
		});
		//}

		let prevX = paddingLeft;

		eachChildren(container, (child) => {

			if (child.get("position") == "relative") {
				if (child.isVisible()) {
					let bounds = child.adjustedLocalBounds();
					let marginLeft = child.get("marginLeft", 0);
					let marginRight = child.get("marginRight", 0);

					let maxWidth = child.get("maxWidth");

					let left = bounds.left;
					let right = bounds.right;
					if (maxWidth) {
						if (right - left > maxWidth) {
							right = left + maxWidth
						}
					}

					let x = prevX + marginLeft - left;
					child.setPrivate("x", x);
					prevX = x + right + marginRight;
				}
				else {
					child.setPrivate("x", undefined);
				}
			}
		});
	}
}

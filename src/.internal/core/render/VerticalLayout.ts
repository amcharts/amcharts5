import { Layout, eachChildren } from "./Layout";
import * as $type from "../util/Type";
import { Percent } from "../util/Percent";
import type { Container } from "./Container";


/**
 * A vertical children layout for [[Container]].
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/common-elements/containers/#Layout} for more info
 */
export class VerticalLayout extends Layout {

	public static className: string = "VerticalLayout";
	public static classNames: Array<string> = Layout.classNames.concat([VerticalLayout.className]);

	/**
	 * @ignore
	 */
	public updateContainer(container: Container): void {
		let paddingTop = container.get("paddingTop", 0);

		let availableHeight = container.innerHeight();
		let totalPercent = 0;

		eachChildren(container, (child) => {
			if (child.isVisible()) {
				if (child.get("position") == "relative") {
					let childHeight = child.get("height");
					if (childHeight instanceof Percent) {
						totalPercent += childHeight.value;

						let h = availableHeight * childHeight.value;
						let minHeight = child.get("minHeight", -Infinity);
						if (minHeight > h) {
							availableHeight -= minHeight;
							totalPercent -= childHeight.value;
						}
						let maxHeight = child.get("maxHeight", Infinity);
						if (h > maxHeight) {
							availableHeight -= maxHeight;
							totalPercent -= childHeight.value;
						}

					}
					else {
						if (!$type.isNumber(childHeight)) {
							childHeight = child.height();
						}
						availableHeight -= childHeight + child.get("marginTop", 0) + child.get("marginBottom", 0);
					}
				}
			}
		})
		if (availableHeight > 0) {
			eachChildren(container, (child) => {
				if (child.isVisible()) {
					if (child.get("position") == "relative") {
						let childHeight = child.get("height");

						if (childHeight instanceof Percent) {
							let privateHeight = availableHeight * childHeight.value / totalPercent - child.get("marginTop", 0) - child.get("marginBottom", 0);

							let minHeight = child.get("minHeight", -Infinity);
							let maxHeight = child.get("maxHeight", Infinity);
							privateHeight = Math.min(Math.max(minHeight, privateHeight), maxHeight);

							child.setPrivate("height", privateHeight);
						}
					}
				}
			});
		}

		let prevY = paddingTop;

		eachChildren(container, (child) => {
			if (child.get("position") == "relative") {
				if (child.isVisible()) {
					let bounds = child.adjustedLocalBounds();
					let marginTop = child.get("marginTop", 0);
					let marginBottom = child.get("marginBottom", 0);
					let y = prevY + marginTop - bounds.top;
					child.setPrivate("y", y);
					prevY = y + bounds.bottom + marginBottom;
				}
				else {
					child.setPrivate("y", undefined);
				}
			}
		});
	}
}

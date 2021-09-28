import { Layout } from "./Layout";
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

		container.children.each((child) => {
			if (child.get("position") == "relative") {
				let childHeight = child.get("height");
				if (childHeight instanceof Percent) {
					totalPercent += childHeight.value;
				}
				else {
					if (!$type.isNumber(childHeight)) {
						childHeight = child.height();
					}
					availableHeight -= childHeight + child.get("marginTop", 0) + child.get("marginBottom", 0);
				}
			}
		})

		container.children.each((child) => {
			if (child.get("position") == "relative") {
				let childHeight = child.get("height");

				if (childHeight instanceof Percent) {
					let privateHeight = availableHeight * childHeight.value / totalPercent - child.get("marginTop", 0) - child.get("marginBottom", 0);
					child.setPrivate("height", privateHeight);
				}
			}
		})

		let prevY = paddingTop;

		container.children.each((child) => {
			if (child.get("position") == "relative") {
				let bounds = child.adjustedLocalBounds();
				let marginTop = child.get("marginTop", 0);
				let marginBottom = child.get("marginBottom", 0);
				let y = prevY + marginTop - bounds.top;
				child.set("y", y);
				prevY = y + bounds.bottom + marginBottom;
			}
		});
	}
}

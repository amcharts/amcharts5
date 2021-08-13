import { Layout } from "./Layout";
import * as $type from "../util/Type";
import { Percent } from "../util/Percent";
import type { Template } from "../../core/util/Template";
import type { Container } from "./Container";
import type { Root } from "../Root";

/**
 * A horizontal children layout for [[Container]].
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/common-elements/containers/#Layout} for more info
 */
export class HorizontalLayout extends Layout {

	/**
	 * Use this method to create an instance of this class.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/getting-started/#New_element_syntax} for more info
	 * @param   root      Root element
	 * @param   settings  Settings
	 * @param   template  Template
	 * @return            Instantiated object
	 */
	public static new(root: Root, settings: HorizontalLayout["_settings"], template?: Template<HorizontalLayout>): HorizontalLayout {
		const x = new HorizontalLayout(root, settings, true, template);
		x._afterNew();
		return x;
	}

	public static className: string = "HorizontalLayout";
	public static classNames: Array<string> = Layout.classNames.concat([HorizontalLayout.className]);

	/**
	 * @ignore
	 */
	public updateContainer(container: Container): void {

		let paddingLeft = container.get("paddingLeft", 0);

		let availableWidth = container.innerWidth();

		let totalPercent = 0;

		container.children.each((child) => {
			if (child.get("position") == "relative") {
				let childWidth = child.get("width");
				if (childWidth instanceof Percent) {
					totalPercent += childWidth.value;
				}
				else {
					if (!$type.isNumber(childWidth)) {
						childWidth = child.width();
					}
					availableWidth -= childWidth + child.get("marginLeft", 0) + child.get("marginRight", 0);
				}
			}
		});

		container.children.each((child) => {
			if (child.get("position") == "relative") {
				let childWidth = child.get("width");
				if (childWidth instanceof Percent) {
					let privateWidth = availableWidth * childWidth.value / totalPercent - child.get("marginLeft", 0) - child.get("marginRight", 0);
					child.setPrivate("width", privateWidth);
				}
			}
		});

		let prevX = paddingLeft;

		container.children.each((child) => {
			if (child.get("position") == "relative") {
				let bounds = child.adjustedLocalBounds();
				let marginLeft = child.get("marginLeft", 0);
				let marginRight = child.get("marginRight", 0);
				let x = prevX + marginLeft - bounds.left;
				child.set("x", x);
				prevX = x + bounds.right + marginRight;
			}
		});
	}
}

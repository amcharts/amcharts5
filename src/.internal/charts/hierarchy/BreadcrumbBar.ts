import type { DataItem } from "../../core/render/Component";
import type { IDisposer } from "../../core/util/Disposer";
import type { Hierarchy, IHierarchyDataItem } from "./Hierarchy";

import { HierarchyDefaultTheme } from "./HierarchyDefaultTheme";
import { Container, IContainerPrivate, IContainerSettings, IContainerEvents } from "../../core/render/Container";
import { Label } from "../../core/render/Label";
import { RoundedRectangle } from "../../core/render/RoundedRectangle";
import { Template } from "../../core/util/Template";
import { ListTemplate } from "../../core/util/List";

import * as $utils from "../../core/util/Utils";

export interface IBreadcrumbBarSettings extends IContainerSettings {

	/**
	 * A hierarchy series bar will use to build current selection path.
	 */
	series: Hierarchy;

}

export interface IBreadcrumbBarPrivate extends IContainerPrivate {
}

export interface IBreadcrumbBarEvents extends IContainerEvents {
}

/**
 * Creates a breadcrumb navigation control.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/hierarchy/breadcrumbs/} for more info
 * @important
 */
export class BreadcrumbBar extends Container {

	/**
	 * @ignore
	 */
	public makeLabel(dataItem: DataItem<IHierarchyDataItem>): Label {
		const label = this.labels.make();
		label._setDataItem(dataItem);
		label.states.create("hover", {});
		label.states.create("down", {});
		label.events.on("click", () => {
			const series = this.get("series");
			if (series) {
				series.selectDataItem(dataItem);
			}
		});

		this.labels.push(label);

		return label;
	}

	/**
	 * A list of labels in the bar.
	 *
	 * `labels.template` can be used to configure label apperance and behavior.
	 *
	 * @default new ListTemplate<Label>
	 */
	public readonly labels: ListTemplate<Label> = this.addDisposer(new ListTemplate(
		Template.new({}),
		() => Label._new(this._root, {
			themeTags: $utils.mergeTags(this.labels.template.get("themeTags", []), ["label"]),
			background: RoundedRectangle.new(this._root, {
				themeTags: ["background"]
			})
		}, [this.labels.template])
	));

	public static className: string = "BreadcrumbBar";
	public static classNames: Array<string> = Container.classNames.concat([BreadcrumbBar.className]);

	declare public _settings: IBreadcrumbBarSettings;
	declare public _privateSettings: IBreadcrumbBarPrivate;
	declare public _events: IBreadcrumbBarEvents;

	protected _disposer: IDisposer | undefined;

	protected _afterNew() {
		this._defaultThemes.push(HierarchyDefaultTheme.new(this._root));
		this._settings.themeTags = $utils.mergeTags(this._settings.themeTags, ["breadcrumb"]);

		super._afterNew();
	}

	public _changed() {
		super._changed();
		if (this.isDirty("series")) {
			const series = this.get("series");
			const previous = this._prevSettings.series;
			if (series != previous) {
				this._disposer = series.events.on("dataitemselected", (event) => {
					this._handleDataItem(event.dataItem)
				})
			}
			else if (previous) {
				if (this._disposer) {
					this._disposer.dispose();
				}
			}

			this._handleDataItem(series.get("selectedDataItem"));
		}
	}

	protected _handleDataItem(dataItem: DataItem<IHierarchyDataItem> | undefined) {
		this.set("minHeight", this.height());
		this.children.clear();
		this.labels.clear();

		if (dataItem) {
			let parent = dataItem;

			while (parent) {
				let label = this.makeLabel(parent);
				if (parent == dataItem) {
					label.addTag("last");
				}
				this.children.moveValue(label, 0);
				parent = parent.get("parent");
			}
		}
	}
}

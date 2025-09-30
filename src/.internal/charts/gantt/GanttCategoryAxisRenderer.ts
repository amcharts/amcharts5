import type { GanttCategoryAxis, IGanttCategoryAxisDataItem } from "./GanttCategoryAxis";
import type { AxisLabel } from "../xy/axes/AxisLabel";
import type { AxisTick } from "../xy/axes/AxisTick";

import { AxisRendererY, IAxisRendererYSettings, IAxisRendererYPrivate } from "../xy/axes/AxisRendererY";
import { ListTemplate } from "../../core/util/List";
import { Template } from "../../core/util/Template";
import { EditableAxisLabel } from "../xy/axes/EditableAxisLabel";
import { Button, Container, DataItem, Graphics, p100, p50, Rectangle } from "../../..";
import { ProgressPie } from "../../core/render/ProgressPie";
import { NumericStepper } from "../../core/render/NumericStepper";

import * as $utils from "../../core/util/Utils";
import * as $type from "../../core/util/Type";


export interface IGanttCategoryAxisRendererSettings extends IAxisRendererYSettings {
}

export interface IGanttCategoryAxisRendererPrivate extends IAxisRendererYPrivate {
}

/**
 * Renderer for [[GanttCategoryAxis]] axes.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/gantt/#Category_vertical_axis} for more info
 * @since 5.14.0
 * @important
 */
export class GanttCategoryAxisRenderer extends AxisRendererY {
	public static className: string = "GanttCategoryAxisRenderer";
	public static classNames: Array<string> = AxisRendererY.classNames.concat([GanttCategoryAxisRenderer.className]);

	declare public _settings: IGanttCategoryAxisRendererSettings;
	declare public _privateSettings: IGanttCategoryAxisRendererPrivate;

	declare public axis: GanttCategoryAxis<this>;


	/**
	 * A [[TemplateList]] with all the labels attached to the axis.
	 *
	 * `labels.template` can be used to configure appearance of the labels.
	 *
	 * @default new ListTemplate<AxisLabelRadial>
	 */
	public readonly labels: ListTemplate<EditableAxisLabel> = this.addDisposer(new ListTemplate(
		Template.new({}),
		() => EditableAxisLabel._new(this._root, {
			themeTagsSelf: ["categorylabel"]
		}, [this.labels.template])
	));

	/**
	 * A [[TemplateList]] with all the containers attached to the axis.
	 *
	 * This container holds all the elements of axis item - label, grip, task bullet, controls, etc.
	 *
	 * @default new ListTemplate<Container>
	 */
	public readonly containers: ListTemplate<Container> = this.addDisposer(new ListTemplate(
		Template.new({}),
		() => Container._new(this._root, {
			themeTagsSelf: ["axislabelcontainer"]
		}, [this.containers.template])
	));

	/**
	 * A [[TemplateList]] with all the controls containers attached to the axis.
	 *
	 * This container holds all the controls of axis item - duration stepper, progress pie, etc.
	 *
	 * @default new ListTemplate<Container>
	 */
	public readonly controlsContainers: ListTemplate<Container> = this.addDisposer(new ListTemplate(
		Template.new({}),
		() => Container._new(this._root, {
			themeTagsSelf: ["axislabelcontrols"]
		}, [this.controlsContainers.template])
	));

	/**
	 * A [[TemplateList]] with all the grips attached to the axis.
	 *
	 * Dragging by the grips allows to rearrange the axis items.
	 *
	 * @default new ListTemplate<Rectangle>
	 */
	public readonly grips: ListTemplate<Rectangle> = this.addDisposer(new ListTemplate(
		Template.new({}),
		() => Rectangle._new(this._root, {
			themeTags: $utils.mergeTags(this.grips.template.get("themeTags", ["grip", "axislabel"]), this.get("themeTags", []))
		}, [this.grips.template])
	));

	/**
	 * A [[TemplateList]] with all the progress pies attached to the axis.
	 *
	 * Progress pies are used to show progress of tasks.
	 *
	 * @default new ListTemplate<ProgressPie>
	 */
	public readonly progressPies: ListTemplate<ProgressPie> = this.addDisposer(new ListTemplate(
		Template.new({}),
		() => ProgressPie._new(this._root, {
			themeTags: $utils.mergeTags(this.progressPies.template.get("themeTags", ["progresspie"]), this.get("themeTags", []))
		}, [this.progressPies.template])
	));

	/**
	 * A [[TemplateList]] with all the task bullets attached to the axis.
	 *
	 * Task bullets are shown to the left of the label. If a task doesn't have
	 * children it will show circle. Otherwise it will show rectangle which is
	 * clickable and can be used to toggle collapse/expand of the task.
	 *
	 * @default new ListTemplate<Button>
	 */
	public readonly taskBullets: ListTemplate<Button> = this.addDisposer(new ListTemplate(
		Template.new({}),
		() => Button._new(this._root, {
			toggleKey: "active",
			icon: Graphics.new(this._root, {
				themeTags: ["icon"]
			}),
			themeTags: $utils.mergeTags(this.taskBullets.template.get("themeTags", ["taskbullet"]), this.get("themeTags", []))
		}, [this.taskBullets.template])
	));

	/**
	 * A [[TemplateList]] with all the duration steppers attached to the axis.
	 *
	 * Duration steppers are used to set and show duration of tasks.
	 *
	 * @default new ListTemplate<NumericStepper>
	 */
	public readonly durationSteppers: ListTemplate<NumericStepper> = this.addDisposer(new ListTemplate(
		Template.new({}),
		() => NumericStepper._new(this._root, {
			themeTags: $utils.mergeTags(this.durationSteppers.template.get("themeTags", ["durationstepper"]), this.get("themeTags", []))
		}, [this.durationSteppers.template])
	));

	/**
	 * @ignore
	 */
	public makeLabel(dataItem: DataItem<IGanttCategoryAxisDataItem>, themeTags: Array<string>): AxisLabel {
		const axis = this.axis;
		const container = this.containers.make();
		const dataContext = dataItem.dataContext as any;
		container.set("layout", this._root.horizontalLayout);
		container.set("width", p100);

		container._setDataItem(dataItem);
		this.containers.push(container);
		dataItem.setRaw("container", container);

		const background = container.set("background", Rectangle.new(this._root, {
			themeTags: ["background", "axislabelcontainer"],
			interactive: true
		}));

		background.events.on("click", (ev) => {
			axis.selectDataItem(ev.target.dataItem);
		});

		const grip = this.grips.make();
		container.children.push(grip);
		this.grips.push(grip);
		dataItem.setRaw("grip", grip);

		const taskBullet = this.taskBullets.make();
		container.children.push(taskBullet);
		this.taskBullets.push(taskBullet);
		dataItem.setRaw("taskBullet", taskBullet);

		taskBullet.events.on("click", (ev) => {
			const dataItem = ev.target.dataItem as DataItem<IGanttCategoryAxisDataItem>;
			if (dataItem) {
				axis.toggleCollapse(dataItem, !dataItem.get("collapsed", false));
			}
		});

		const labelContainer = container.children.push(Container.new(this._root, {
			width: p100,
			centerY: p50,
			y: p50
		}));

		const label = super.makeLabel(dataItem, themeTags);
		labelContainer.children.push(label);

		label.events.on("click", () => {
			label.set("maxWidth", undefined);
		});

		container.events.on("boundschanged", () => {
			label.set("maxWidth", labelContainer.width());
		});

		let tempText: string | undefined;

		label.on("active", (active) => {
			if (active) {
				tempText = label.get("text", "");
				label.set("text", dataItem.get("name"));
			}
		})

		label.on("text", (text) => {
			if (tempText != undefined && text != tempText) {
				dataItem.set("name", text);
				if (dataContext) {
					dataContext[this.axis.get("nameField", "name")] = text;
				}
			}
		});

		const controlsContainer = this.controlsContainers.make();
		this.controlsContainers.push(controlsContainer);
		dataItem.setRaw("controlsContainer", controlsContainer);
		container.children.push(controlsContainer);

		const durationStepper = this.durationSteppers.make();
		controlsContainer.children.push(durationStepper);
		dataItem.setRaw("durationStepper", durationStepper);
		this.durationSteppers.push(durationStepper);

		durationStepper.on("value", (value) => {
			const dataItem = durationStepper.dataItem as DataItem<IGanttCategoryAxisDataItem>;
			if (dataItem && $type.isNumber(value)) {
				dataItem.set("duration", value);
			}
		});

		const duration = dataItem.get("duration");
		if ($type.isNumber(duration)) {
			durationStepper.set("value", duration);
		}
		dataItem.on("duration", (value) => {
			durationStepper.set("value", value);
		});

		const progressPie = this.progressPies.make();
		controlsContainer.children.push(progressPie);
		dataItem.setRaw("progressPie", progressPie);

		progressPie.events.on("click", (ev) => {
			this.axis.toggleProgressPie(ev.target.dataItem);
		})

		this.progressPies.push(progressPie);

		this.axis.labelsContainer.children.moveValue(container, 0);

		axis._updateBullet(dataItem);

		container.appear();

		return label;
	}

	/**
	 * @ignore
	 */
	public updateLabel(label?: AxisLabel, position?: number, endPosition?: number) {
		if (label) {
			const dataItem = label.dataItem as DataItem<IGanttCategoryAxisDataItem>;
			if (dataItem) {
				const container = dataItem.get("container");
				if (container) {
					if (!$type.isNumber(position)) {
						position = 0;
					}

					let location = 0;

					if ($type.isNumber(endPosition) && endPosition != position) {
						position = position + (endPosition - position) * location;
					}

					container.set("y", this.positionToCoordinate(position));
					this.toggleVisibility(container, position, label.get("minPosition", 0), label.get("maxPosition", 1));
				}
			}
		}
	}

	/**
	 * @ignore
	 */
	public updateTick(tick?: AxisTick, position?: number, endPosition?: number, count?: number) {
		super.updateTick(tick, position, endPosition, count);
		if (tick) {
			tick.set("length", -this.axis.labelsContainer.width());
		}
	}
}
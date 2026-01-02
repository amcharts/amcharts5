import type { AxisRenderer } from "../xy/axes/AxisRenderer";
import type { GanttCategoryAxisRenderer } from "./GanttCategoryAxisRenderer";
import type { Container } from "../../core/render/Container";
import type { ProgressPie } from "../../core/render/ProgressPie";
import type { Gantt } from "./Gantt";
import type { AxisTick } from "../xy/axes/AxisTick";
import type { NumericStepper } from "../../core/render/NumericStepper";
import type { IGanttSeriesDataItem } from "./GanttSeries";
import type { Animation } from "../../core/util/Entity";

import { Rectangle } from "../../core/render/Rectangle";
import { CategoryAxis, ICategoryAxisSettings, ICategoryAxisPrivate, ICategoryAxisDataItem, ICategoryAxisEvents } from "../xy/axes/CategoryAxis";
import { Button, color, Color, DataItem, Graphics, IDisposer } from "../../..";

import * as $array from "../../core/util/Array";
import * as $type from "../../core/util/Type";

export interface IGanttCategoryAxisSettings<R extends AxisRenderer> extends ICategoryAxisSettings<R> {

	/**
	 * Currently selected category data item, if any.
	 */
	selectedDataItem?: DataItem<IGanttCategoryAxisDataItem>;

	/**
	 * A field in data that holds parent id.
	 * 
	 * @see {@link https://www.amcharts.com/docs/v5/charts/gantt/#Category_data} for more info
	 * @default "parentId"
	 */
	parentIdField?: string;

	/**
	 * A field in data that holds status whether the category is collapsed.
	 * 
	 * @see {@link https://www.amcharts.com/docs/v5/charts/gantt/#Category_data} for more info
	 * @default "collapsed"
	 */
	collapsedField?: string;

	/**
	 * Size of child categories relative to the top-level cell height. (`0` - `1`)
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/gantt/#Cell_height_for_child_categories} for more info
	 * @default 0.8
	 */
	childCellSize?: number;

	/**
	 * A shift in pixels to apply to child categories.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/gantt/#Cell_height_for_child_categories} for more info
	 * @default 25
	 */
	childShift?: number;

	/**
	 * A minimal height of the cell in pixels.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/gantt/#Cell_height} for more info
	 * @default 70
	 */
	minCellHeight?: number;

	/**
	 * Field of a category name
	 * @default "name"
	 */
	nameField?: string;

	/**
	 * Field of a category color
	 * @default "color"
	 */
	colorField?: string;

}

export interface IGanttCategoryAxisDataItem extends ICategoryAxisDataItem {

	/**
	 * A container that holds all other elements of a axis label - label, controls, grip, etc.
	 */
	container?: Container;

	/**
	 * A container that holds progress pie and duration stepper.
	 */
	controlsContainer?: Container;

	/**
	 * A grip for dragging the category.
	 */
	grip?: Rectangle;

	/**
	 * A bullet to the left of a label (circle or triangle, if it has children)
	 */
	taskBullet?: Button;

	/**
	 * A progress pie that shows progress of the task.
	 */
	progressPie?: ProgressPie;

	/**
	 * Children of this category, if any.
	 */
	children?: Array<DataItem<IGanttCategoryAxisDataItem>>;

	/**
	 * Parent id of data item.
	 */
	parentId?: string;

	/**
	 * A reference to the parent category data item.
	 */
	parent?: DataItem<IGanttCategoryAxisDataItem>;

	/**
	 * Progress of the task, from `0` to `1`. If this item has children, this will be the average of all children's progress.
	 */
	progress?: number;

	/**
	 * A stepper that allows to change task duration.
	 */
	durationStepper?: NumericStepper;

	/**
	 * A flag indicating whether the category is collapsed.
	 */
	collapsed?: boolean;

	/**
	 * Duration of the task (in days or other units, depending on `durationUnit` setting of a `Gantt`).
	 */
	duration?: number;

	/**
	 * Color of a task.
	 */
	color?: Color

	/**
	 * Custom color for the task, if any.
	 */
	customColor?: Color;

	/**
	 * Displayed name of a category.
	 */
	name?: string;

	/**
	 * @ignore
	 */
	deleting?: boolean;

	/**
	 * A reference to the series data item.
	 */
	seriesDataItem?: DataItem<IGanttSeriesDataItem>;
}


export interface IGanttCategoryAxisPrivate extends ICategoryAxisPrivate { }

export interface IGanttCategoryAxisEvents extends ICategoryAxisEvents { }


/**
 * A category axis that is used as a Y (vertical) axis for [[Gantt]] charts.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/gantt/#Category_vertical_axis} for more info
 * @since 5.14.0
 * @important
 */
export class GanttCategoryAxis<R extends GanttCategoryAxisRenderer> extends CategoryAxis<R> {
	public static className: string = "GanttCategoryAxis";
	public static classNames: Array<string> = CategoryAxis.classNames.concat([GanttCategoryAxis.className]);

	declare public _settings: IGanttCategoryAxisSettings<R>;
	declare public _privateSettings: IGanttCategoryAxisPrivate;
	declare public _dataItemSettings: IGanttCategoryAxisDataItem;
	declare public _events: IGanttCategoryAxisEvents;

	protected _downX: number | undefined;
	protected _downW: number | undefined;
	protected _xHideDP: IDisposer | undefined;
	protected _insertAfter: DataItem<IGanttCategoryAxisDataItem> | undefined;
	protected _makeChildOf: DataItem<IGanttCategoryAxisDataItem> | undefined;
	protected _draggedItem: DataItem<IGanttCategoryAxisDataItem> | undefined;
	protected _previousTick: AxisTick | undefined;

	protected _delDp: IDisposer | undefined;
	protected _firstDataItem!: DataItem<IGanttCategoryAxisDataItem>;

	protected _updDP: IDisposer | undefined;
	protected _dataChangeDp: IDisposer | undefined;
	protected _treeDirty: boolean = false;

	public axisResizer?: Rectangle;

	/**
	 * A reference to the parent [[Gantt]] chart.
	 */
	public gantt?: Gantt;

	/**
	 * A [[Button]] used for deleting categories.
	 */
	public xButton: Button = this.children.push(Button.new(this._root, {
		themeTags: ["xbutton"],
		icon: Graphics.new(this._root, {
			themeTags: ["icon"]
		})
	}));

	protected _afterNew() {
		this.fields.push("parentId", "collapsed", "name");
		super._afterNew();

		this.events.on("wheel", (event) => {
			this.chart!.handleWheel(event);
		});

		this.xButton.hide(0);

		const renderer = this.get("renderer");
		this._firstDataItem = this.makeDataItem({ cellSize: 0.0001 });
		const tick = renderer.makeTick(this._firstDataItem, []);
		tick.set("dy", 0.5);
		const grid = renderer.makeGrid(this._firstDataItem, []);
		grid.set("dy", 0.5);

		this.labelsContainer.setAll({
			maskContent: true
		});

		const resizer = this.children.push(Rectangle.new(this._root, {
			themeTags: ["axisresizer"]
		}))

		this.axisResizer = resizer;

		resizer.events.on("pointerdown", (e) => {
			this._downX = this.toLocal(e.point).x;
			this._downW = this.width();
		})

		resizer.events.on("globalpointermove", (e) => {
			if (this._downX !== undefined) {
				const point = this.toLocal(e.point);
				const dy = point.x - this._downX;
				if (this._downW !== undefined) {
					let newWidth = this._downW + dy;
					newWidth = Math.max(newWidth, this.get("minWidth", 100));
					this.labelsContainer.set("width", newWidth);
				}
			}
		})

		resizer.events.on("globalpointerup", () => {
			this._downX = undefined;
		})

		const containersTemplate = renderer.containers.template;

		containersTemplate.events.on("dragged", (e) => {
			this.xButton.hide(0);
			// get all columns from series of this category and move them together
			const dataItem = e.target.dataItem as DataItem<IGanttCategoryAxisDataItem>;
			const container = e.target as Container;
			if (dataItem) {
				const deltaPosition = (e.target.y() - startY) / this.chart!.plotContainer.height() * (this.get("end", 1) - this.get("start", 0));
				dataItem.set("deltaPosition", deltaPosition);

				// dragg all children together
				const updateDeltaPositionRecursively = (dataItem: DataItem<IGanttCategoryAxisDataItem>, deltaPosition: number) => {
					const children = dataItem.get("children");

					if (children) {
						$array.each(children, (child) => {
							child.set("deltaPosition", deltaPosition);
							updateDeltaPositionRecursively(child, deltaPosition);
						});
					}
				};

				updateDeltaPositionRecursively(dataItem, deltaPosition);

				const tick = dataItem.get("tick")
				const grid = dataItem.get("grid");
				const dy = Math.ceil(startY - container.y());

				if (tick) {
					const children = dataItem.get("children");
					if (!children || children.length == 0) {
						tick.set("dy", dy);

						if (grid) {
							grid.set("dy", dy);
						}
					}

					const y = container.y();

					// Check if y is close to other containers and apply hover state
					const allContainers = renderer.containers;

					if (this._makeChildOf) {
						this._makeChildOf.get("container")?.get("background")?.unhover();
					}

					this._makeChildOf = undefined;
					for (let i = 0; i < allContainers.length; i++) {
						const otherContainer = allContainers.getIndex(i);
						if (otherContainer && otherContainer.isVisible() && otherContainer !== container) {
							const otherDataItem = otherContainer.dataItem as DataItem<IGanttCategoryAxisDataItem>;

							if (otherDataItem.get("cellSize", 0) > 0) {
								// Check if otherDataItem is already a child of the dragged item's container
								const otherChildren = otherDataItem.get("children");
								if (otherChildren) {
									if (otherChildren.indexOf(dataItem) !== -1) {
										continue; // Skip if the dragged item is already a child of the other item
									}
								}

								const background = otherContainer.get("background");
								if (background) {
									const otherY = otherContainer.y();
									if (Math.abs((y + container.height() / 2) - (otherY + otherContainer.height() / 2)) < 5) {
										background.hover();
										this._makeChildOf = otherDataItem;
									}
								}
							}
						}
					}


					if (!this._makeChildOf) {
						if (this._previousTick) {
							this._previousTick.states.applyAnimate("default");
							this._previousTick = undefined;
						}

						let closestDataItem: DataItem<IGanttCategoryAxisDataItem> | undefined;
						let closestDistance = Infinity;
						//find closest tick
						for (let i = renderer.ticks.length; i >= 0; i--) {
							const t = renderer.ticks.getIndex(i);
							if (t && tick.isVisible()) {
								const dataItem = t.dataItem as DataItem<IGanttCategoryAxisDataItem>;
								if (dataItem) {
									const index = dataItem.get("index", 0);

									if (index >= this.startIndex() && index <= this.endIndex()) {

										if (dataItem.get("cellSize", 0) == 0) {
											continue; // Skip if the other item is collapsed
										}

										// recursively check if dataItem is not a child of the dragged item
										let isChild = false;
										let parent = dataItem.get("parent");
										while (parent) {
											if (parent === dataItem) {
												isChild = true;
												break;
											}
											parent = parent.get("parent");
										}

										if (isChild) {
											continue;
										}

										const distance = Math.abs(t.y() + t.get("dy", 0) - y - container.height() / 2);
										if (distance < closestDistance) {
											closestDistance = distance;
											closestDataItem = t.dataItem as DataItem<IGanttCategoryAxisDataItem>;
										}
									}
								}
							}
						}

						if (Math.abs(dy) < 10) {
							closestDataItem = undefined;
							this._insertAfter = undefined;
						}

						if (closestDataItem && closestDataItem !== dataItem) {
							// also check if closestDataItem is not a child of the dragged item
							let isChild = false;
							let parent = closestDataItem.get("parent");
							while (parent) {
								if (parent === dataItem) {
									isChild = true;
									break;
								}
								parent = parent.get("parent");
							}

							if (isChild) {
								return;
							}

							// color tick
							const tick = closestDataItem.get("tick")
							if (tick) {
								tick.hover();
								this._previousTick = tick;
							}

							this._insertAfter = closestDataItem;
						}
					}
					else {
						if (this._previousTick) {
							this._previousTick.unhover();
							this._previousTick = undefined;
						}
					}
				}
			}
		})

		containersTemplate.events.on("dragstop", (e) => {
			this._draggedItem = e.target.dataItem as DataItem<IGanttCategoryAxisDataItem>;
			this._sortCategoryAxis();

			if (this._makeChildOf) {
				this._makeChildOf.get("container")?.get("background")?.unhover();

				if (this._makeChildOf.get("collapsed")) {
					this.toggleCollapse(this._makeChildOf, true);
				}

				this._updateCellSizes();
			}

			// disable interactivity of all containers
			const renderer = this.get("renderer");
			renderer.containers.each((container) => {
				container.set("forceInactive", false);
			});
		})

		let startY: number = 0;
		containersTemplate.events.on("dragstart", (e) => {
			// disable interactivity of all containers
			const renderer = this.get("renderer");
			renderer.containers.each((container) => {
				container.set("forceInactive", true);
			});
			startY = e.target.y();
		})
	}

	public _changed() {
		super._changed();
		if (this.isDirty("selectedDataItem")) {
			this.selectDataItem(this.get("selectedDataItem"));
		}
	}

	protected _processBullet(dataItem: DataItem<IGanttCategoryAxisDataItem>) {
		super._processBullet(dataItem);

		const parent = dataItem.get("parent");
		if (parent && parent.get("collapsed")) {
			dataItem.get("container")?.hide();
			dataItem.get("tick")?.hide();
			dataItem.get("grid")?.hide();
			dataItem.set("finalCellSize", 0);
		}
	}

	public _updateChildren(): void {
		super._updateChildren();


		if (this._dataChanged) {
			$array.each(this.dataItems, (dataItem) => {
				const parentId = dataItem.get("parentId");
				if (!parentId) {
					let fill = dataItem.get("customColor", dataItem.get("color"));
					const dataContext = dataItem.dataContext as any;
					if (fill === undefined && dataContext && dataContext.color !== undefined) {
						fill = color(dataContext.color);
					}

					if (!fill) {
						fill = this.gantt?._nextColor();
					}

					dataItem.setRaw("color", fill);
				}
			})

			$array.each(this.dataItems, (dataItem) => {
				const parentId = dataItem.get("parentId");

				if (parentId) {
					// Find the parent data item by category
					const parent = this.getDataItemById(parentId);
					if (parent) {
						dataItem.setRaw("parent", parent);
						dataItem.setRaw("cellSize", Math.pow(this.get("childCellSize", 1), this._getItemDepth(dataItem)));
						dataItem.setRaw("finalCellSize", dataItem.get("cellSize"));

						let fill = dataItem.get("customColor", dataItem.get("color"));
						const dataContext = dataItem.dataContext as any;
						if (fill === undefined && dataContext && dataContext.color !== undefined) {
							fill = color(dataContext.color);
						}
						if (fill == undefined) {
							dataItem.setRaw("color", parent.get("customColor", parent.get("color")));
						}
						else {
							dataItem.setRaw("color", fill);
						}

						let children = parent.get("children");
						if (!children) {
							children = [];
							parent.set("children", children);
						}
						$array.move(children, dataItem);
					}
				}
				else {
					dataItem.setRaw("cellSize", 1);
					dataItem.setRaw("finalCellSize", 1);
				}
			});

			$array.each(this.dataItems, (dataItem) => {
				this.toggleCollapse(dataItem, dataItem.get("collapsed", false), 0);
			});
		}
		if (this._treeDirty) {
			this._updateTree();
		}

		const renderer = this.get("renderer");

		const firstDataItem = this._firstDataItem;
		if (firstDataItem) {
			renderer.updateTick(firstDataItem.get("tick"), 0);
			renderer.updateGrid(firstDataItem.get("grid"), 0);
		}

		$array.each(this.dataItems, (dataItem) => {
			const progressPie = dataItem.get("progressPie");
			if (progressPie) {
				const progress = dataItem.get("progress", 0);
				progressPie.set("value", progress);

				const color = dataItem.get("customColor", dataItem.get("color"));

				(dataItem.dataContext as any).color = color?.toString();
				progressPie.slice.set("fill", color);
				progressPie.backgroundSlice.set("fill", color);
				progressPie.label.set("fill", color);
			}

			const cellSize = dataItem.get("cellSize", 1);
			const container = dataItem.get("container");
			if (container) {
				if (cellSize < 0.0001) {
					container.setPrivate("visible", false);
				}
				else {
					container.setPrivate("visible", true);
				}

				const index = dataItem.get("index", 0);
				const p0 = this.indexToPosition(index, 0);
				const p1 = this.indexToPosition(index, 1);

				const y0 = renderer.positionToCoordinate(p0);
				const y1 = renderer.positionToCoordinate(p1);

				container.set("height", Math.abs(y1 - y0));
			}
		})
	}

	public _clearDirty(): void {
		super._clearDirty();
		this._treeDirty = false;
	}

	public getSeriesDataItem(dataItem: DataItem<IGanttCategoryAxisDataItem>): DataItem<IGanttSeriesDataItem> | undefined {
		if (dataItem.get("seriesDataItem")) {
			return dataItem.get("seriesDataItem");
		}
		const gantt = this.gantt;
		if (gantt) {
			const di = gantt.series.getDataItemById(dataItem.get("id")!);
			if (di) {
				dataItem.set("seriesDataItem", di);
				return di;
			}
		}
	}

	/**
	 * Zooms the axis to relative locations.
	 *
	 * Both `start` and `end` are relative: 0 means start of the axis, 1 - end.
	 *
	 * @param   start     Relative start
	 * @param   end       Relative end
	 * @param   duration  Duration of the zoom animation in milliseconds
	 * @return            Zoom animation
	 */
	public zoom(start: number, end: number, duration?: number): Animation<this["_settings"]["start"]> | Animation<this["_settings"]["end"]> | undefined {
		if (this.get("zoomable", true)) {
			this._updateFinals(start, end);

			if (this.get("start") !== start || this.get("end") != end) {
				let sAnimation = this._sAnimation;
				let eAnimation = this._eAnimation;

				if (start > end) {
					[start, end] = [end, start];
				}

				let maxDeviation = this.get("maxDeviation", 0.5) * Math.min(1, (end - start));

				if (start < - maxDeviation) {
					start = -maxDeviation;
				}

				if (end > 1 + maxDeviation) {
					end = 1 + maxDeviation;
				}

				if (!$type.isNumber(duration)) {
					duration = this.get("interpolationDuration", 0);
				}

				if (((sAnimation && sAnimation.playing && sAnimation.to == start) || this.get("start") == start) && ((eAnimation && eAnimation.playing && eAnimation.to == end) || this.get("end") == end)) {
					return;
				}

				if (duration > 0) {
					let easing = this.get("interpolationEasing");
					let sAnimation, eAnimation;
					if (this.get("start") != start) {
						sAnimation = this.animate({ key: "start", to: start, duration: duration, easing: easing });
					}
					if (this.get("end") != end) {
						eAnimation = this.animate({ key: "end", to: end, duration: duration, easing: easing });
					}

					this._sAnimation = sAnimation;
					this._eAnimation = eAnimation;

					if (sAnimation) {
						return sAnimation;
					}
					else if (eAnimation) {
						return eAnimation;
					}
				}
				else {
					this.set("start", start);
					this.set("end", end);
					this.root.events.once("frameended", () => {
						this.markDirtyKey("start");
					});
				}
			}
			else {
				if (this._sAnimation) {
					this._sAnimation.stop();
				}
				if (this._eAnimation) {
					this._eAnimation.stop();
				}
			}
		}
	}

	public _afterDataChange(): void {
		super._afterDataChange();
		const chart = this.chart;

		if (chart) {
			const availableHeight = chart.plotContainer.height();

			const minCellHeight = this.get("minCellHeight", 70);
			const maxZoomCount = Math.floor(availableHeight / minCellHeight);
			this.set("maxZoomCount", maxZoomCount);
			this.set("minZoomCount", maxZoomCount);

			// to avoid many items to be drawn
			if (this.get("start") == 0 && this.get("end") == 1) {
				this.zoomToIndexes(0, maxZoomCount);
				if (this._dataChangeDp) {
					this._dataChangeDp.dispose();
				}
				this._dataChangeDp = this.root.events.once("frameended", () => {
					this.adjustZoom();
				})
			}
		}
	}

	public markDirtyTree(): void {
		this._treeDirty = true;
		this.markDirty();
	}


	public _sortCategoryAxis(): void {
		let insertAfter = this._insertAfter;
		const draggedItem = this._draggedItem;

		if (this._previousTick) {
			this._previousTick.states.applyAnimate("default");
			this._previousTick = undefined;
		}

		if (!draggedItem) {
			return;
		}
		const currentParent = draggedItem.get("parent");
		const currentDepth = this._getItemDepth(draggedItem);

		if (this._makeChildOf) {
			if (this._makeChildOf && draggedItem !== this._makeChildOf) {
				draggedItem.set("parent", this._makeChildOf);
				let children = this._makeChildOf.get("children");
				if (!children) {
					children = this._makeChildOf.set("children", []);
				}
				if (children && !children.includes(draggedItem)) {
					children.unshift(draggedItem);
				}

				// assign parent color to dragged item if it doesn't have custom color			
				if (!draggedItem.get("customColor")) {
					const parentColor = this._makeChildOf.get("customColor", this._makeChildOf.get("color"));
					draggedItem.setRaw("color", parentColor);
				}

				const parentSeriesDataItem = this.getSeriesDataItem(this._makeChildOf);
				if (parentSeriesDataItem) {
					parentSeriesDataItem.setAll({
						openValueX: undefined,
						valueX: undefined,
						duration: draggedItem.get("duration", 0),
					});
				}
			}
			insertAfter = this._makeChildOf;
		}
		else if (insertAfter && draggedItem !== insertAfter) {
			const childrenOfInsertAfter = insertAfter.get("children");
			const parentOfInsertAfter = insertAfter.get("parent");

			// if insertAfter has children
			if (childrenOfInsertAfter && childrenOfInsertAfter.length > 0 && !insertAfter.get("collapsed", false)) {
				// make it child of insertAfter
				draggedItem.set("parent", insertAfter);
			}
			else {
				// if insertAfter has parent
				if (parentOfInsertAfter) {
					const childrenOfParentOfInsertAfter = parentOfInsertAfter.get("children");

					if (childrenOfParentOfInsertAfter) {
						const lastChild = childrenOfParentOfInsertAfter[childrenOfParentOfInsertAfter.length - 1];
						// if insertAfter is last child of its parent, o not change parent of dragged item
						if (insertAfter == lastChild) {
							// if it is already child of parentOfInsertAfter, do not change parent
							if (draggedItem.get("parent") === parentOfInsertAfter) {

							}
							else {
								// get children of one level up
								const nextParent = parentOfInsertAfter.get("parent");
								if (nextParent) {
									const nextChildren = nextParent.get("children");
									if (nextChildren) {
										draggedItem.set("parent", nextParent);
									}
								}
								else {
									if (draggedItem.get("parent") !== undefined) {
										draggedItem.set("parent", undefined);
										this._setNewColor(draggedItem);
									}
								}
							}
						}
						else {
							if (childrenOfInsertAfter && !insertAfter.get("collapsed", false)) {
								draggedItem.set("parent", insertAfter);
							}
							else {
								draggedItem.set("parent", parentOfInsertAfter);
							}
						}
					}
				}
				else {
					// if insertAfter has no parent, do not change parent of dragged item
					if (draggedItem.get("parent") !== undefined) {
						draggedItem.set("parent", undefined);
						this._setNewColor(draggedItem);
					}
				}
			}

			const newParent = draggedItem.get("parent");
			if (newParent) {
				// assign parent color to dragged item if it doesn't have custom color			
				if (!draggedItem.get("customColor")) {
					const parentColor = newParent.get("customColor", newParent.get("color"));
					draggedItem.setRaw("color", parentColor);
				}

				const newParentChildren = newParent.get("children");
				if (newParentChildren) {
					if (newParentChildren.indexOf(insertAfter) !== -1) {
						$array.move(newParentChildren, draggedItem, newParentChildren.indexOf(insertAfter) + 1);
					}
					else {
						if (newParent == insertAfter) {
							newParentChildren.unshift(draggedItem);
						}
						else {
							newParentChildren.push(draggedItem);
						}
					}
				}
			}
		}

		// remove from current parent children            
		if (currentParent && currentParent != draggedItem.get("parent")) {
			const currentChildren = currentParent.get("children");
			if (currentChildren) {
				const index = currentChildren.indexOf(draggedItem);
				if (index !== -1) {
					$array.remove(currentChildren, draggedItem);
				}
			}
		}

		if (insertAfter) {
			const insertAfterIndex = this.dataItems.indexOf(insertAfter);
			const currentIndex = this.dataItems.indexOf(draggedItem);

			const updateChildrenIndexes = (dataItem: DataItem<IGanttCategoryAxisDataItem>, index: number) => {
				if (currentIndex >= insertAfterIndex) {
					index++;
					$array.move(this.dataItems, dataItem, index);
					const children = dataItem.get("children");
					if (children) {
						$array.eachReverse(children, (child) => {
							updateChildrenIndexes(child, index);
						});
					}
				}
				else {
					$array.move(this.dataItems, dataItem, index);
					const children = dataItem.get("children");
					if (children) {
						$array.each(children, (child) => {
							updateChildrenIndexes(child, index);
						});
					}
				}
			};

			if (this._getItemDepth(draggedItem) != currentDepth) {
				const seriesDataItem = this.getSeriesDataItem(draggedItem);
				if (seriesDataItem) {
					this.gantt?.series.disposeLinks(seriesDataItem);
				}
			}

			updateChildrenIndexes(draggedItem, insertAfterIndex);
		}

		this.markDirtyTree();

		const easing = this.get("interpolationEasing");
		const duration = this.get("interpolationDuration", 0);

		$array.each(this.dataItems, (axisItem, index) => {
			const container = axisItem.get("container");
			if (container) {
				let currentPosition = this.coordinateToPosition(container.y() + container.height() / 2);
				let newPosition = this.indexToPosition(index) - axisItem.get("deltaPosition", 0);
				let deltaPosition = newPosition - currentPosition;
				axisItem.set("deltaPosition", -deltaPosition);
				axisItem.animate({ key: "deltaPosition", to: 0, duration: duration, easing: easing });
				axisItem.get("tick")?.animate({ key: "dy", to: 0, duration: duration, easing: easing });
				axisItem.get("grid")?.animate({ key: "dy", to: 0, duration: duration, easing: easing });
			}
		});
	}

	public _setNewColor(dataItem: DataItem<IGanttCategoryAxisDataItem>, color?: Color): void {
		if (!color) {
			color = this.gantt?._nextColor();
		}
		dataItem.set("color", color);

		const children = dataItem.get("children");

		if (children && children.length > 0) {
			$array.each(children, (child) => {
				this._setNewColor(child, color);
			})
		}
	}

	public _updateTree(): void {
		const gantt = this.gantt;

		if (gantt) {
			$array.each(gantt.series.dataItems, (seriesDataItem) => {
				seriesDataItem.set("children", []);
				seriesDataItem.set("parent", undefined);
			})

			$array.each(this.dataItems, (dataItem) => {
				const parent = dataItem.get("parent");

				if (parent) {
					const id = dataItem.get("id")!;
					const parentId = parent.get("id")!;

					const seriesDataItem = gantt.series.getDataItemById(id);

					dataItem.set("parentId", parentId);

					const parentSeriesDataItem = gantt.series.getDataItemById(parentId);

					if (seriesDataItem) {
						if (parentSeriesDataItem) {
							seriesDataItem.set("parent", parentSeriesDataItem);

							let children = parentSeriesDataItem.get("children", []);
							$array.move(children, seriesDataItem);
						}
					}
				}
			});

			// hide grips for those with children
			$array.each(gantt.series.dataItems, (seriesDataItem) => {
				const children = seriesDataItem.get("children");
				const startGrip = seriesDataItem.get("startGrip");
				const endGrip = seriesDataItem.get("endGrip");
				if (startGrip && endGrip) {
					if (!children || children.length === 0) {
						startGrip.set("forceHidden", false);
						endGrip.set("forceHidden", false);
					}
					else {
						startGrip.set("forceHidden", true);
						endGrip.set("forceHidden", true);
					}
				}
			})

			this.data.values.length = 0;
			gantt.series.data.values.length = 0;

			$array.each(this.dataItems, (dataItem, index) => {
				dataItem.setRaw("index", index);
				this.data.values.push(dataItem.dataContext);

				const seriesDataItem = this.getSeriesDataItem(dataItem);
				if (seriesDataItem) {
					gantt.series.data.values.push(seriesDataItem?.dataContext);
					$array.move(gantt.series.dataItems, seriesDataItem);
				}
			});

			this._updateCellSizes();			// all bullets exept the first one
			$array.each(this.dataItems, (dataItem) => {
				this._updateBullet(dataItem);
			})
		}
	}

	public _updateCellSizes(duration?: number): void {
		$array.each(this.dataItems, (dataItem) => {
			if (duration === undefined) {
				duration = this.get("interpolationDuration", 0);
			}

			const depth = this._getItemDepth(dataItem);
			let cellSize = this.get("childCellSize", 1);
			const parent = dataItem.get("parent");
			if (parent && parent.get("collapsed", false)) {
				cellSize = 0;
			}

			cellSize = Math.pow(cellSize, depth);

			if (dataItem.get("deleting")) {
				cellSize = 0;
			}

			//dataItem.set("cellSize", cellSize);
			if (dataItem.get("cellSize", 1) != cellSize) {
				dataItem.set("finalCellSize", cellSize);
				dataItem.animate({ key: "cellSize", to: cellSize, duration: duration!, easing: this.get("interpolationEasing") });
			}
		});

		if (this._dataChangeDp) {
			this._dataChangeDp.dispose();
		}
		this._dataChangeDp = this.root.events.once("frameended", () => {
			this.adjustZoom();
		})
	}

	public _updateBullet(dataItem: DataItem<IGanttCategoryAxisDataItem>): void {
		const taskBullet = dataItem.get("taskBullet");

		if (taskBullet) {
			const depth = this._getItemDepth(dataItem);
			const children = dataItem.get("children");

			taskBullet.setAll({
				marginLeft: this.get("childShift", 20) * depth
			});

			const collapsed = dataItem.get("collapsed", false);
			const icon = taskBullet.get("icon");

			let hasChildren = false;
			if (children && children.length > 0) {
				hasChildren = true;
			}

			if (icon) {
				if (hasChildren) {
					taskBullet.set("disabled", false);
					this.root.events.once("frameended", () => {
						taskBullet.set("active", !collapsed);
					})
				}
				else {
					taskBullet.set("disabled", true);
				}
			}
		}
	}

	/**
	 * Toggles collapse state of a data item.
	 * @param dataItem 
	 * @param collapse 
	 * @param duration 
	 */
	public toggleCollapse(dataItem: DataItem<IGanttCategoryAxisDataItem>, collapse?: boolean, duration?: number): void {
		if (dataItem && dataItem.get("collapsed", false) !== collapse) {

			const children = dataItem.get("children");
			dataItem.set("collapsed", collapse);

			if (children && children.length > 0) {

				$array.each(children, (child) => {
					const container = child.get("container")!;
					const grid = child.get("grid")!;
					const tick = child.get("tick")!;

					if (container) {
						if (collapse) {
							container.hide();
							grid.hide();
							tick.hide();
						}
						else {
							container.show();
							grid.show();
							tick.show();
						}
					}

					const gantt = this.gantt;
					if (gantt && gantt.series) {
						const series = gantt.series;
						const seriesDataItem = series.dataItems.find((item) => item.get("categoryY") === child.get("category"));
						if (seriesDataItem) {
							if (collapse) {
								seriesDataItem.hide();
							}
							else {
								seriesDataItem.show();
							}
						}
					}

					this.toggleCollapse(child, collapse, duration);
				});
			}

			this._updateBullet(dataItem);

			if (this._updDP) {
				this._updDP.dispose();
			}
			this._updDP = this.root.events.once("frameended", () => {
				this._updateCellSizes(duration);
			})
		}
	}

	/**
	 * Expands all categories in the axis.
	 */
	public expandAll(): void {
		$array.each(this.dataItems, (dataItem) => {
			if (dataItem.get("collapsed", false)) {
				this.toggleCollapse(dataItem, false);
			}
		})
	}

	/**
	 * Collapses all categories in the axis.
	 */
	public collapseAll(): void {
		$array.each(this.dataItems, (dataItem) => {
			if (!dataItem.get("collapsed", false)) {
				this.toggleCollapse(dataItem, true);
			}
		})
	}

	/**
	 * Deletes all data items from the axis.
	 */
	public deleteAll(): void {
		this.data.clear();
		this.gantt?.series.data.clear();
		this.selectDataItem(undefined);
	}


	/**
	 * Deletes a data item from the axis.
	 *
	 * @param dataItem  Data item to delete
	 */
	public deleteDataItem(dataItem: DataItem<IGanttCategoryAxisDataItem>, child?: boolean): void {
		const series = this.gantt?.series;

		const children = dataItem.get("children");
		if (children && children.length > 0) {
			for (let i = children.length - 1; i >= 0; i--) {
				this.deleteDataItem(children[i], true);
			}
		}

		dataItem.set("deleting", true);

		if (!child) {
			this._updateCellSizes();
		}

		const container = dataItem.get("container");

		if (container) {
			const promise = container.hide();
			promise.then(() => {
				if (series && seriesDataItem) {
					series.setPrivate("minX", undefined);
					series.setPrivate("maxX", undefined);
					series.data.removeValue(seriesDataItem.dataContext);
				}
				this.data.removeValue(dataItem.dataContext);
			})
		}


		let seriesDataItem: DataItem<IGanttSeriesDataItem> | undefined;
		if (series) {
			seriesDataItem = this.getSeriesDataItem(dataItem);
			if (seriesDataItem) {
				seriesDataItem.hide();
			}
		}
	}

	/**
	 * Toggles progress pie for a data item. Toggling means that progress pie
	 * will animate to 1 if it was less than 1, or animate to previous progress
	 * value if it was 1.
	 *
	 * @param dataItem  Data item to toggle progress pie for
	 */
	public toggleProgressPie(dataItem?: DataItem<IGanttCategoryAxisDataItem>, value?: number): void {
		if (dataItem) {
			const children = dataItem.get("children");
			if (children && children.length > 0) {

				const currentValue = dataItem.get("progress", 0);
				let toValue: number | undefined = undefined;
				if (currentValue !== 1) {
					toValue = 1;
				}

				$array.each(children, (child: DataItem<IGanttCategoryAxisDataItem>) => {
					this.toggleProgressPie(child, toValue);
				})
			}
			else {
				const seriesDataItem = this.getSeriesDataItem(dataItem);
				if (seriesDataItem) {
					const progress = seriesDataItem.get("progress", 0);
					const prevProgress = seriesDataItem.get("prevProgress", 0);

					let toProgress = 1;
					if (progress == 1 && prevProgress != undefined) {
						toProgress = prevProgress
					}

					if (value !== undefined) {
						toProgress = value;
					}

					seriesDataItem.set("prevProgress", progress);
					seriesDataItem.animate({
						key: "progress",
						to: toProgress,
						duration: this.get("interpolationDuration", 0), easing: this.get("interpolationEasing")
					});
				}
			}
		}
	}

	/**
	 * Sets a custom color for a data item.
	 *
	 * @param dataItem  Data item to set color for
	 * @param c         Color to set
	 */
	public setDataItemColor(dataItem?: DataItem<IGanttCategoryAxisDataItem>, c?: Color): void {
		if (dataItem) {
			const cc = dataItem.get("color");
			if (c && cc && c.hex === cc.hex) {
				c = undefined;
			}

			dataItem.set("customColor", c);

			// children
			const children = dataItem.get("children");
			if (children && children.length > 0) {
				$array.each(children, (child: DataItem<IGanttCategoryAxisDataItem>) => {
					this.setDataItemColor(child, c);
				})
			}

			this.gantt?.series.markDirtyValues();
		}
	}

	/**
	 * Hides axis's data item.
	 *
	 * @param   dataItem  Data item
	 * @param   duration  Animation duration in milliseconds
	 * @return            Promise
	 */
	public async hideDataItem(dataItem: DataItem<IGanttCategoryAxisDataItem>): Promise<void> {
		const promise = super.hideDataItem(dataItem);

		const container = dataItem.get("container");
		if (container) {
			container.hide();
		}

		return promise;
	}

	/**
	 * Shows axis's data item.
	 *
	 * @param   dataItem  Data item
	 * @param   duration  Animation duration in milliseconds
	 * @return            Promise
	 */
	public async showDataItem(dataItem: DataItem<IGanttCategoryAxisDataItem>): Promise<void> {
		const promise = super.showDataItem(dataItem);
		const container = dataItem.get("container");
		if (container) {
			container.show();
		}
		return promise;
	}

	public _toggleFHDataItem(dataItem: DataItem<IGanttCategoryAxisDataItem>, forceHidden: boolean) {
		const fh = "forceHidden";
		const container = dataItem.get("container");
		if (container) {
			container.set(fh, forceHidden);
		}
	}


	public _toggleDataItem(dataItem: DataItem<IGanttCategoryAxisDataItem>, visible: boolean) {
		super._toggleDataItem(dataItem, visible);
		const container = dataItem.get("container");
		if (container) {
			container.set("visible", visible);
		}
	}


	/**
	 * Disposes a data item.
	 *
	 * @param dataItem  Data item to dispose
	 */
	public disposeDataItem(dataItem: DataItem<this["_dataItemSettings"]>) {
		super.disposeDataItem(dataItem);

		// remove all elements
		const renderer = this.get("renderer");
		const container = dataItem.get("container");
		if (container) {
			renderer.containers.removeValue(container);
			container.dispose();
		}

		// progress pie
		const progressPie = dataItem.get("progressPie");
		if (progressPie) {
			renderer.progressPies.removeValue(progressPie);
			progressPie.dispose();
		}

		// grips
		const grip = dataItem.get("grip");
		if (grip) {
			renderer.grips.removeValue(grip);
			grip.dispose();
		}
		// duration stepper
		const durationStepper = dataItem.get("durationStepper");
		if (durationStepper) {
			renderer.durationSteppers.removeValue(durationStepper);
			durationStepper.dispose();
		}

		// task bullet
		const taskBullet = dataItem.get("taskBullet");
		if (taskBullet) {
			renderer.taskBullets.removeValue(taskBullet);
			taskBullet.dispose();
		}

		const parent = dataItem.get("parent");

		if (parent) {
			const children = parent.get("children");

			if (children) {
				$array.remove(children, dataItem);
			}
			this._updateBullet(parent);
		}

		this._updateCellSizes();
	}

	/**
	 * Selects a data item and shows the delete button. If the data item is
	 * already selected, it will unselect it.
	 *
	 * @param dataItem  Data item to select
	 */
	public selectDataItem(dataItem?: DataItem<IGanttCategoryAxisDataItem>): void {
		if (!this.gantt?.get("editable", true)) {
			return;
		}

		if (dataItem === this.get("selectedDataItem")) {
			this.unselectDataItems();
			return;
		}

		this.unselectDataItems();

		if (!dataItem) {
			this.setRaw("selectedDataItem", undefined);
			return;
		}

		const container = dataItem.get("container");
		if (container) {
			const bg = container.get("background");
			if (bg) {
				bg.set("active", true);
			}

			const progressPie = dataItem.get("progressPie");
			progressPie?.children.push(this.xButton);

			this.setRaw("selectedDataItem", dataItem);

			if (this._xHideDP) {
				this._xHideDP.dispose();
			}

			this.gantt?.colorPickerButton.set("color", dataItem.get("customColor", dataItem.get("color")));

			this.setTimeout(() => {
				this._xHideDP = this.events.once("globalpointerup", () => {
					this.unselectDataItems();
				})
			}, 200);

			if (this._delDp) {
				this._delDp.dispose();
			}

			this._delDp = this.xButton.events.once("click", () => {
				const parent = this.xButton.parent;
				if (parent) {
					parent.children.removeValue(this.xButton);
				}
				this.deleteDataItem(dataItem);
				this.unselectDataItems();
			})

			this.xButton.show();
		}
		else {
			this.unselectDataItems();
		}

	}

	/**
	 * Unselects all data items.
	 */
	public unselectDataItems(): void {
		this.setRaw("selectedDataItem", undefined);
		this.xButton.hide(0);
		$array.each(this.dataItems, (dataItem: DataItem<IGanttCategoryAxisDataItem>) => {
			const container = dataItem.get("container");
			if (container) {
				const bg = container.get("background");
				if (bg) {
					bg.set("active", false);
				}
			}
		});
	}

	/**
	 * @ignore
	 */
	public _disposeXHideDP() {
		if (this._xHideDP) {
			this._xHideDP.dispose();
			this._xHideDP = undefined;
		}
	}

	/**
	 * @ignore
	 * @param dataItem 
	 * @returns depth of the data item in the hierarchy
	 */
	public _getItemDepth(dataItem: DataItem<IGanttCategoryAxisDataItem>): number {
		let depth = 0;
		let parent = dataItem.get("parent");
		while (parent) {
			depth++;
			parent = parent.get("parent");
		}
		return depth;
	}

	/**
	 * @ignore
	 * Overrides original method so that a ghost label is not created.
	 */
	protected _createGhostLabel() { }
}
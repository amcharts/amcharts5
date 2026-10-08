import { StockControl, IStockControlSettings, IStockControlPrivate, IStockControlEvents } from "./StockControl";
import { DropdownList, IDropdownListItem } from "./DropdownList";
import { StockIcons } from "./StockIcons";

import * as $array from "../../../core/util/Array";

export type DrawingTools = "Arrows &amp; Icons" | "Average" | "Callout" | "Doodle" | "Ellipse" | "Fibonacci" | "Fibonacci Timezone" | "Horizontal Line" | "Horizontal Ray" | "Label" | "Line" | "Line Arrow"  | "Measure" | "Parallel Channel" | "Polyline" | "Polyfill" | "Quadrant Line" | "Rectangle" | "Regression" | "Trend Line" | "Triangle" | "Vertical Line";

export interface IDrawingToolControlSettings extends IStockControlSettings {
	/**
	 * Drawing tools to list.
	 */
	tools: DrawingTools[];

	/**
	 * Limits the list's height to the chart's height minus 100 pixels,
	 * scrolling the rest.
	 *
	 * @since 5.9.5
	 */
	scrollable?: boolean;
}

export interface IDrawingToolControlPrivate extends IStockControlPrivate {
	list?: DropdownList;
}

export interface IDrawingToolControlEvents extends IStockControlEvents {
	/**
	 * A tool was picked from the list.
	 */
	selected: {
		tool: DrawingTools
	}
}

/**
 * A dropdown for picking a drawing tool. Created by [[DrawingControl]]; not
 * meant to be used on its own.
 */
export class DrawingToolControl extends StockControl {
	public static className: string = "DrawingToolControl";
	public static classNames: Array<string> = StockControl.classNames.concat([DrawingToolControl.className]);

	declare public _settings: IDrawingToolControlSettings;
	declare public _privateSettings: IDrawingToolControlPrivate;
	declare public _events: IDrawingToolControlEvents;

	protected _afterNew() {

		// Do parent stuff
		super._afterNew();

		// Create list of tools
		const list = DropdownList.new(this._root, {
			control: this,
			parent: this.getPrivate("button"),
			scrollable: this.get("scrollable", false)
		});
		this.setPrivate("list", list);

		list.events.on("closed", (_ev) => {
			this.set("active", false);
		});

		list.events.on("invoked", (ev) => {
			this.setTool(<DrawingTools>ev.item.id);
			this.events.dispatch("selected", {
				type: "selected",
				tool: <DrawingTools>ev.item.id,
				target: this
			});
		});

		this.on("active", (active) => {
			if (active) {
				this.setTimeout(() => list.show(), 10);
			}
			else {
				list.hide();
			}
		});

		const button = this.getPrivate("button")!;
		button.className = button.className + " am5stock-control-dropdown";

		this._initTools();
	}

	/**
	 * Shows a tool on the button. Does not dispatch `selected`.
	 *
	 * @param  tool  Tool
	 */
	public setTool(tool: DrawingTools): void {
		this.getPrivate("icon")!.innerHTML = "";
		this.getPrivate("icon")!.appendChild(this._getToolIcon(tool));
		//this.getPrivate("label")!.innerHTML = tool;
		this._setLabel(this._root.language.translateAny(tool));
	}

	protected _initTools(): void {
		const list = this.getPrivate("list")!;
		const tools = this.get("tools");
		const items: IDropdownListItem[] = [];
		$array.each(tools, (tool: DrawingTools) => {
			items.push({
				id: tool,
				label: this._root.language.translateAny(tool),
				icon: this._getToolIcon(tool)
			});
		})
		list.set("items", items);
	}

	protected _getToolIcon(tool: DrawingTools): SVGElement {
		return StockIcons.getIcon(tool);
	}

	public _afterChanged() {
		super._afterChanged();

		if (this.isDirty("tools")) {
			this._initTools();
		}

		// if (this.isDirty("name")) {
		// 	this.getPrivate("label")!.innerHTML = this.get("name", "");
		// }

		// todo icon
	}

	protected _dispose(): void {
		super._dispose();

		// $array.each(this._itemDisposers, (x) => {
		// 	x.dispose();
		// });
	}


}

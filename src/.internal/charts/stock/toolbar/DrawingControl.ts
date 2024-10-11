import type { XYSeries } from "../../xy/series/XYSeries";
import type { Color } from "../../../core/util/Color";
import type { ColorSet } from "../../../core/util/ColorSet";
import type { IDropdownListItem } from "./DropdownList";
import type { StockPanel } from "../StockPanel";
import type { IPoint } from "../../../core/util/IPoint";

import { color } from "../../../core/util/Color";
import { Template } from "../../../core/util/Template";

import { StockControl, IStockControlSettings, IStockControlPrivate, IStockControlEvents } from "./StockControl";
import { DrawingToolControl, DrawingTools } from "./DrawingToolControl";
import { ColorControl } from "./ColorControl";
import { DropdownListControl } from "./DropdownListControl";
import { IconControl, IIcon } from "./IconControl";
import { StockIcons } from "./StockIcons";
import { DrawingSeries } from "../drawing/DrawingSeries";

import { AverageSeries } from "../drawing/AverageSeries";
import { CalloutSeries } from "../drawing/CalloutSeries";
import { EllipseSeries } from "../drawing/EllipseSeries";
import { DoodleSeries } from "../drawing/DoodleSeries";
import { FibonacciSeries } from "../drawing/FibonacciSeries";
import { FibonacciTimezoneSeries } from "../drawing/FibonacciTimezoneSeries";
import { HorizontalLineSeries } from "../drawing/HorizontalLineSeries";
import { HorizontalRaySeries } from "../drawing/HorizontalRaySeries";
import { IconSeries } from "../drawing/IconSeries";
import { LabelSeries } from "../drawing/LabelSeries";
import { SimpleLineSeries } from "../drawing/SimpleLineSeries";
import { LineArrowSeries } from "../drawing/LineArrowSeries";
import { PolylineSeries } from "../drawing/PolylineSeries";
import { QuadrantLineSeries } from "../drawing/QuadrantLineSeries";
import { RectangleSeries } from "../drawing/RectangleSeries";
import { ParallelChannelSeries } from "../drawing/ParallelChannelSeries";
import { RegressionSeries } from "../drawing/RegressionSeries";
import { TrendLineSeries } from "../drawing/TrendLineSeries";
import { VerticalLineSeries } from "../drawing/VerticalLineSeries";
import { Measure } from "../drawing/Measure";
import { JsonParser } from "../../../plugins/json/Json";
import { Serializer } from "../../../plugins/json/Serializer";


import * as $array from "../../../core/util/Array";
import * as $object from "../../../core/util/Object";
import * as $type from "../../../core/util/Type";
import * as $utils from "../../../core/util/Utils";

export interface IDrawingControlSettings extends IStockControlSettings {

	/**
	 * List of tools available in drawing mode.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/stock/toolbar/drawing-control/#Tool_list} for more info
	 */
	tools?: DrawingTools[];

	/**
	 * Default tool.
	 */
	tool?: DrawingTools,

	/**
	 * If set to `true`, the dropdown will fix the height to fit within chart's
	 * area, with scroll if the contents do not fit.
	 *
	 * @since 5.9.5
	 */
	scrollable?: boolean;

	/**
	 * Default settings for drawing tools.
	 *
	 * @since 5.5.2
	 * @see {@link https://www.amcharts.com/docs/v5/charts/stock/toolbar/drawing-control/#Tool_settings} for more info
	 */
	toolSettings?: { [index: string]: any };

	/**
	 * Target series for drawing.
	 */
	series?: XYSeries[];

	/**
	 * Colors to show in color pickers.
	 * @see {@link https://www.amcharts.com/docs/v5/charts/stock/toolbar/drawing-control/#Colors} for more info
	 */
	colors?: ColorSet;

	/**
	 * Default color for lines/borders.
	 */
	strokeColor?: Color;

	/**
	 * Default line/border width in pixels.
	 */
	strokeWidth?: number;

	/**
	 * Available line widths for user to choose from.
	 */
	strokeWidths?: number[];

	/**
	 * Default dasharray setting.
	 */
	strokeDasharray?: number[];

	/**
	 * Available line dash settings for user to choose from.
	 */
	strokeDasharrays?: number[][];

	/**
	 * Default line/border opacity.
	 */
	strokeOpacity?: number;

	/**
	 * Show dotted/thin line extending from both ends of the drawn line?
	 *
	 * @default true
	 */
	showExtension?: boolean;

	/**
	 * Default fill color.
	 */
	fillColor?: Color;

	/**
	 * Default fill opacity.
	 */
	fillOpacity?: number;

	/**
	 * Default color for labels.
	 */
	labelFill?: Color;

	/**
	 * Default label font size.
	 */
	labelFontSize?: number | string | undefined;

	/**
	 * Available font sizes.
	 */
	labelFontSizes?: Array<number | string>;

	/**
	 * Default label font.
	 */
	labelFontFamily?: string;

	/**
	 * Available fonts for user to choose from.
	 */
	labelFontFamilies?: string[];

	/**
	 * Default label font weight.
	 */
	labelFontWeight?: "normal" | "bold" | "bolder" | "lighter" | "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900";

	/**
	 * Default label style.
	 */
	labelFontStyle?: "normal" | "italic" | "oblique";

	drawingIcon?: IIcon;
	drawingIcons?: IIcon[];

	/**
	 * Should drawings snap to the nearest data point?
	 *
	 * @default true
	 */
	snapToData?: boolean;

}


export interface IDrawingControlPrivate extends IStockControlPrivate {
	toolsContainer?: HTMLDivElement;
	// icon?: HTMLElement;
	// label?: HTMLDivElement;
	toolControl?: DrawingToolControl;
	eraserControl?: StockControl;

	/**
	 * Selector mode toggler.
	 *
	 * @since 5.9.1
	 */
	selectControl?: StockControl;
	clearControl?: StockControl;

	strokeControl?: ColorControl;
	strokeWidthControl?: DropdownListControl;
	strokeDasharrayControl?: DropdownListControl;
	fillControl?: ColorControl;
	extensionControl?: StockControl;

	labelFillControl?: ColorControl;
	labelFontSizeControl?: DropdownListControl;
	labelFontFamilyControl?: DropdownListControl;
	boldControl?: StockControl;
	italicControl?: StockControl;

	iconControl?: IconControl;
	snapControl?: StockControl;

	toolTemplates?: { [index: string]: Template<any> };
}

export interface IDrawingControlEvents extends IStockControlEvents {
}

/**
 * A drawing tools control for [[StockChart]].
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/stock/toolbar/drawing-control/} for more info
 */
export class DrawingControl extends StockControl {
	public static className: string = "DrawingControl";
	public static classNames: Array<string> = StockControl.classNames.concat([DrawingControl.className]);

	declare public _settings: IDrawingControlSettings;
	declare public _privateSettings: IDrawingControlPrivate;
	declare public _events: IDrawingControlEvents;

	private _drawingSeries: { [index: string]: DrawingSeries[] } = {};
	private _currentEnabledSeries: DrawingSeries[] = [];

	protected _afterNew() {
		super._afterNew();

		// Init drawing toolbar
		if (this.getPrivate("toolbar")) {
			this._initToolbar();
		}

		const stockChart = this.get("stockChart");
		stockChart.panels.events.onAll(() => this._updatePanelBindings());

		stockChart.events.on("drawingselected", (ev) => {
			// Set tool
			const tool = this._getSeriesTool(ev.series);
			this.set("tool", tool);

			if (!this._isInited()) {
				return;
			}

			// Get context
			const context = ev.series.getContext(ev.drawingId);

			if (tool == "Label" || tool == "Callout") {

				/**
				 * --------------------------------------------------------------------
				 * Labels and callouts
				 * --------------------------------------------------------------------
				 */

				// Set fill
				const settings = context.settings;
				if (settings) {
					this.getPrivate("labelFillControl")!.setColor(settings.get("fill"));
					this.getPrivate("labelFontSizeControl")!.setItemById(settings.get("fontSize"));
					this.getPrivate("boldControl")!.set("active", settings.get("fontWeight") == "bold");
					this.getPrivate("italicControl")!.set("active", settings.get("fontStyle") == "italic");
					this.getPrivate("labelFontFamilyControl")!.setItemById(settings.get("fontFamily"));
				}

				// Callout background/outline
				const bg = context.bgSettings;
				if (bg) {
					const strokeControl = this.getPrivate("strokeControl")!;
					strokeControl.setColor(bg.get("stroke"));
					strokeControl.setOpacity(bg.get("strokeOpacity"));

					const fillControl = this.getPrivate("fillControl")!;
					fillControl.setColor(bg.get("fill"));
					fillControl.setOpacity(bg.get("fillOpacity"));
				}

			}
			else {

				/**
				 * --------------------------------------------------------------------
				 * The rest of the stuff
				 * --------------------------------------------------------------------
				 */

				// Set stroke
				const stroke = context.stroke || context.settings;
				if (stroke) {
					const strokeControl = this.getPrivate("strokeControl")!;
					strokeControl.setColor(stroke.get("stroke"));
					strokeControl.setOpacity(stroke.get("strokeOpacity"));
					this.getPrivate("strokeWidthControl")!.setItemById(stroke.get("strokeWidth") + "px");
					this.getPrivate("strokeDasharrayControl")!.setItemById(JSON.stringify(stroke.get("strokeDasharray")));
				}

				// Set fill
				const fill = context.fill || context.settings;
				if (fill) {
					const fillControl = this.getPrivate("fillControl")!;
					fillControl.setColor(fill.get("fill"));
					fillControl.setOpacity(fill.get("fillOpacity"));
				}

				// Handle icons
				const sprite = context.settings || context.sprite;
				if (sprite && sprite.get("svgPath")) {
					this.getPrivate("iconControl")!.setIconByPath(sprite.get("svgPath"));
				}
			}

		});

	}

	protected _initElements(): void {
		super._initElements();
	}

	protected _isInited(): boolean {
		return this.getPrivate("toolsContainer") ? true : false;
	}

	protected _resetControls(): void {
		this.getPrivate("eraserControl")!.set("active", false);
	}

	protected _initToolbar(): void {
		const stockChart = this.get("stockChart");
		const l = this._root.language;

		// Add additional container for drawing toolbar
		const toolbar = this.getPrivate("toolbar")!;
		const toolsContainer = document.createElement("div");
		toolsContainer.className = "am5stock-control-drawing-tools";
		toolsContainer.style.display = "none";
		this.setPrivate("toolsContainer", toolsContainer);
		toolbar.get("container").appendChild(toolsContainer);

		/**
		 * Drawing tool selection control
		 */
		const toolControl = DrawingToolControl.new(this._root, {
			stockChart: stockChart,
			description: l.translateAny("Drawing tool"),
			tools: this.get("tools")!,
			scrollable: this.get("scrollable", false)
		});

		toolControl.setPrivate("toolbar", toolbar);

		toolsContainer.appendChild(toolControl.getPrivate("button")!);
		this.setPrivate("toolControl", toolControl);

		toolControl.events.on("selected", (ev) => {
			eraserControl.set("active", false);
			this.set("tool", ev.tool);
		});

		toolControl.events.on("click", this._resetControls, this);

		/**
		 * Icon selection control
		 */
		const drawingIcons = this.get("drawingIcons")!;
		const iconControl = IconControl.new(this._root, {
			stockChart: stockChart,
			description: l.translateAny("Arrows &amp; Icons"),
			icons: drawingIcons
		});

		iconControl.setPrivate("toolbar", toolbar);

		iconControl.setIcon(this.get("drawingIcon", drawingIcons[0]));
		toolsContainer.appendChild(iconControl.getPrivate("button")!);
		this.setPrivate("iconControl", iconControl);

		iconControl.events.on("selected", (ev) => {
			this.set("drawingIcon", ev.icon);
		});

		iconControl.events.on("click", this._resetControls, this);

		/**
		 * Snap toggle control
		 */
		const snapControl = StockControl.new(this._root, {
			stockChart: stockChart,
			description: l.translateAny("Snap icon to data"),
			icon: StockIcons.getIcon("Snap")
		});

		snapControl.setPrivate("toolbar", toolbar);

		snapControl.hide();
		toolsContainer.appendChild(snapControl.getPrivate("button")!);
		this.setPrivate("snapControl", snapControl);
		if (this.get("snapToData")) {
			snapControl.set("active", true);
		}
		snapControl.on("active", (_ev) => {
			this.set("snapToData", snapControl.get("active") == true);
		});

		snapControl.events.on("click", this._resetControls, this);

		/**
		 * Stroke color control
		 */
		const strokeControl = ColorControl.new(this._root, {
			stockChart: stockChart,
			colors: this.get("colors"),
			description: l.translateAny("Line color")
		});

		strokeControl.setPrivate("toolbar", toolbar);

		strokeControl.hide();
		strokeControl.setPrivate("color", this.get("strokeColor", color(0x000000)));
		strokeControl.setPrivate("opacity", this.get("strokeOpacity", 1));
		toolsContainer.appendChild(strokeControl.getPrivate("button")!);
		this.setPrivate("strokeControl", strokeControl);
		strokeControl.events.on("selected", (ev) => {
			this.set("strokeColor", ev.color);
		});
		strokeControl.events.on("selectedOpacity", (ev) => {
			this.set("strokeOpacity", ev.opacity);
		});

		strokeControl.events.on("click", this._resetControls, this);

		/**
		 * Stroke width control
		 */
		const strokeWidths: string[] = [];
		$array.each(this.get("strokeWidths", []), (width) => {
			strokeWidths.push(width + "px");
		});
		const strokeWidthControl = DropdownListControl.new(this._root, {
			stockChart: stockChart,
			description: l.translateAny("Line thickness"),
			currentItem: this.get("strokeWidth", "12") + "px",
			items: strokeWidths
		});

		strokeWidthControl.setPrivate("toolbar", toolbar);

		strokeWidthControl.hide();
		//strokeWidthControl.setItem(this.get("strokeWidth", "12") + "px");
		strokeWidthControl.getPrivate("icon")!.style.display = "none";
		toolsContainer.appendChild(strokeWidthControl.getPrivate("button")!);
		this.setPrivate("strokeWidthControl", strokeWidthControl);
		strokeWidthControl.events.on("selected", (ev) => {
			this.set("strokeWidth", $type.toNumber($type.isString(ev.item) ? ev.item : ev.item.id));
		});

		strokeWidthControl.events.on("click", this._resetControls, this);

		/**
		 * Stroke dash cofiguration control
		 */
		const strokeDasharrays: IDropdownListItem[] = [];
		let currentStrokeDasharray: SVGElement | undefined;
		const strokeDasharray = this.get("strokeDasharray", []);
		$array.each(this.get("strokeDasharrays", []), (dasharray) => {
			const icon = StockIcons.getIcon("Dash");
			const id = JSON.stringify(dasharray);
			icon.setAttribute("stroke", "#000");
			icon.setAttribute("stroke-dasharray", dasharray.join(","));
			icon.setAttribute("class", "am5stock-icon-wide");
			strokeDasharrays.push({
				id: id,
				label: "",
				icon: icon
			});

			if (id == JSON.stringify(strokeDasharray)) {
				currentStrokeDasharray = StockIcons.getIcon("Dash");
				currentStrokeDasharray.setAttribute("stroke", "#000");
				currentStrokeDasharray.setAttribute("stroke-dasharray", dasharray.join(","));
				currentStrokeDasharray.setAttribute("class", "am5stock-icon-wide");
			}
		});
		const strokeDasharrayControl = DropdownListControl.new(this._root, {
			stockChart: stockChart,
			description: l.translateAny("Line style"),
			items: strokeDasharrays
		});

		strokeDasharrayControl.setPrivate("toolbar", toolbar);

		strokeDasharrayControl.hide();
		if (currentStrokeDasharray) {
			strokeDasharrayControl.setItem({
				id: "",
				icon: currentStrokeDasharray,
				label: ""
			});
		}
		strokeDasharrayControl.getPrivate("icon")!.setAttribute("class", "am5stock-control-icon am5stock-icon-wide")
		toolsContainer.appendChild(strokeDasharrayControl.getPrivate("button")!);
		this.setPrivate("strokeDasharrayControl", strokeDasharrayControl);
		strokeDasharrayControl.events.on("selected", (ev) => {
			this.set("strokeDasharray", JSON.parse((<IDropdownListItem>ev.item).id));
		});

		strokeDasharrayControl.events.on("click", this._resetControls, this);

		/**
		 * Fill color control
		 */
		const fillControl = ColorControl.new(this._root, {
			stockChart: stockChart,
			colors: this.get("colors"),
			name: l.translateAny("Fill"),
			description: l.translateAny("Fill color"),
		});
		fillControl.hide();
		fillControl.setPrivate("toolbar", toolbar);
		fillControl.setPrivate("color", this.get("fillColor", color(0x000000)));
		fillControl.setPrivate("opacity", this.get("fillOpacity", 1));
		toolsContainer.appendChild(fillControl.getPrivate("button")!);
		this.setPrivate("fillControl", fillControl);
		fillControl.events.on("selected", (ev) => {
			this.set("fillColor", ev.color);
		});
		fillControl.events.on("selectedOpacity", (ev) => {
			this.set("fillOpacity", ev.opacity);
		});

		fillControl.events.on("click", this._resetControls, this);

		/**
		 * Label color control
		 */
		const labelFillControl = ColorControl.new(this._root, {
			stockChart: stockChart,
			colors: this.get("colors"),
			name: l.translateAny("Text"),
			description: l.translateAny("Text color"),
			useOpacity: false
		});
		labelFillControl.hide();
		labelFillControl.setPrivate("toolbar", toolbar);
		labelFillControl.setPrivate("color", this.get("labelFill", color(0x000000)));
		toolsContainer.appendChild(labelFillControl.getPrivate("button")!);
		this.setPrivate("labelFillControl", labelFillControl);
		labelFillControl.events.on("selected", (ev) => {
			this.set("labelFill", ev.color);
		});

		labelFillControl.events.on("click", this._resetControls, this);

		/**
		 * Font size control
		 */
		const fontSizes: string[] = [];
		$array.each(this.get("labelFontSizes", []), (size) => {
			fontSizes.push(size + "");
		});
		const fontSizeControl = DropdownListControl.new(this._root, {
			stockChart: stockChart,
			description: l.translateAny("Label font size"),
			currentItem: this.get("labelFontSize", "12px") + "",
			items: fontSizes,
			icon: "none"
		});
		fontSizeControl.hide();
		fontSizeControl.setPrivate("toolbar", toolbar);
		//fontSizeControl.setItem(this.get("labelFontSize", "12px") + "");
		toolsContainer.appendChild(fontSizeControl.getPrivate("button")!);
		this.setPrivate("labelFontSizeControl", fontSizeControl);
		fontSizeControl.events.on("selected", (ev) => {
			this.set("labelFontSize", $type.isString(ev.item) ? ev.item : ev.item.id);
		});

		fontSizeControl.events.on("click", this._resetControls, this);

		/**
		 * Bold control
		 */
		const boldControl = StockControl.new(this._root, {
			stockChart: stockChart,
			description: l.translateAny("Bold"),
			icon: StockIcons.getIcon("Bold")
		});
		boldControl.hide();
		boldControl.setPrivate("toolbar", toolbar);
		toolsContainer.appendChild(boldControl.getPrivate("button")!);
		this.setPrivate("boldControl", boldControl);
		boldControl.on("active", (_ev) => {
			this.set("labelFontWeight", boldControl.get("active") ? "bold" : "normal");
		});

		boldControl.events.on("click", this._resetControls, this);

		/**
		 * Italic control
		 */
		const italicControl = StockControl.new(this._root, {
			stockChart: stockChart,
			description: l.translateAny("Italic"),
			icon: StockIcons.getIcon("Italic")
		});
		italicControl.hide();
		italicControl.setPrivate("toolbar", toolbar);
		toolsContainer.appendChild(italicControl.getPrivate("button")!);
		this.setPrivate("italicControl", italicControl);
		italicControl.on("active", (_ev) => {
			this.set("labelFontStyle", italicControl.get("active") ? "italic" : "normal");
		});

		italicControl.events.on("click", this._resetControls, this);

		/**
		 * Font family control
		 */
		const fontFamilies: string[] = [];
		$array.each(this.get("labelFontFamilies", []), (size) => {
			fontFamilies.push(size + "");
		});
		const fontFamilyControl = DropdownListControl.new(this._root, {
			stockChart: stockChart,
			description: l.translateAny("Label font family"),
			currentItem: this.get("labelFontFamily", "Arial"),
			items: fontFamilies,
			icon: "none"
		});
		fontFamilyControl.hide();
		fontFamilyControl.setPrivate("toolbar", toolbar);
		toolsContainer.appendChild(fontFamilyControl.getPrivate("button")!);
		this.setPrivate("labelFontFamilyControl", fontFamilyControl);
		fontFamilyControl.events.on("selected", (ev) => {
			this.set("labelFontFamily", $type.isString(ev.item) ? ev.item : ev.item.id);
		});

		fontFamilyControl.events.on("click", this._resetControls, this);

		/**
		 * Line extension control
		 */
		const extensionControl = StockControl.new(this._root, {
			stockChart: stockChart,
			description: l.translateAny("Show line extension"),
			icon: StockIcons.getIcon("Show Extension")
		});
		extensionControl.hide();
		extensionControl.setPrivate("toolbar", toolbar);
		toolsContainer.appendChild(extensionControl.getPrivate("button")!);
		this.setPrivate("extensionControl", extensionControl);
		if (this.get("showExtension")) {
			extensionControl.set("active", true);
		}
		extensionControl.on("active", (_ev) => {
			this.set("showExtension", extensionControl.get("active") == true);
		});

		extensionControl.events.on("click", this._resetControls, this);

		/**
		 * Select control
		 */
		const selectControl = StockControl.new(this._root, {
			stockChart: stockChart,
			description: l.translateAny("Select"),
			icon: StockIcons.getIcon("Select"),
			active: stockChart.get("drawingSelectionEnabled", false)
		});
		this._disposers.push(stockChart.on("drawingSelectionEnabled", (active) => {
			selectControl.set("active", active);
		}));

		selectControl.setPrivate("toolbar", toolbar);
		toolsContainer.appendChild(selectControl.getPrivate("button")!);
		this.setPrivate("selectControl", selectControl);
		selectControl.on("active", (_ev) => {
			const active = selectControl.get("active", false);
			stockChart.set("drawingSelectionEnabled", active);
		});

		/**
		 * Eraser control
		 */
		const eraserControl = StockControl.new(this._root, {
			stockChart: stockChart,
			description: l.translateAny("Eraser"),
			icon: StockIcons.getIcon("Eraser")
		});

		this._disposers.push(stockChart.on("erasingEnabled", (active) => {
			eraserControl.set("active", active);
		}));

		eraserControl.setPrivate("toolbar", toolbar);
		toolsContainer.appendChild(eraserControl.getPrivate("button")!);
		this.setPrivate("eraserControl", eraserControl);
		eraserControl.on("active", (_ev) => {
			const active = eraserControl.get("active", false);
			this.setEraser(active);
		});

		/**
		 * Clear all drawings control
		 */
		const clearControl = StockControl.new(this._root, {
			stockChart: stockChart,
			name: l.translateAny("Clear"),
			description: l.translateAny("Clear all drawings"),
			icon: StockIcons.getIcon("Clear"),
			togglable: false
		});
		clearControl.setPrivate("toolbar", toolbar);
		toolsContainer.appendChild(clearControl.getPrivate("button")!);
		this.setPrivate("clearControl", clearControl);
		this._disposers.push($utils.addEventListener(clearControl.getPrivate("button")!, "click", (_ev) => {
			eraserControl.set("active", false);
			this.clearDrawings();
		}));

		// Preset active tool
		if (this.get("active")) {
			this._setTool(this.get("tool"));
		}
	}

	/**
	 * Enables or disables eraser mode.
	 *
	 * @since 5.3.9
	 * @param  active  Eraser active
	 */
	public setEraser(active: boolean) {
		this.get("stockChart").set("erasingEnabled", active);
	}

	/**
	 * Clears all drawings.
	 *
	 * @since 5.3.9
	 */
	public clearDrawings() {
		$object.each(this._drawingSeries, (_tool, seriesList) => {
			$array.each(seriesList, (series) => {
				//series.disableErasing();
				series.clearDrawings();
			});
		});
	}

	public _beforeChanged() {
		super._beforeChanged();
		const isInited = this._isInited();

		if (this.isDirty("tools")) {
			const toolControl = this.getPrivate("toolControl");
			if (toolControl) {
				toolControl.set("tools", this.get("tools")!);
			}
		}

		if (this.isPrivateDirty("toolbar")) {
			if (this.getPrivate("toolbar")) {
				this._initToolbar();
			}
		}

		if (this.isDirty("active")) {
			this.get("stockChart").toggleDrawing(this.get("active"))
			
			if (this.get("active")) {				
				if (isInited) {
					this.getPrivate("toolsContainer")!.style.display = "block";
				}
				this._setTool(this.get("tool"));
				if (isInited) {
					$utils.focus(this.getPrivate("toolControl")!.getPrivate("button") as HTMLElement);
				}
			}
			else {
				if (isInited) {
					this.getPrivate("toolsContainer")!.style.display = "none";
				}
				this._setTool();
			}			
		}


		if (this.isDirty("tool") && this.get("active")) {
			this._setTool(this.get("tool"));
		}

		const rootEvents = this._root.events;
		if (this.isDirty("strokeColor") || this.isDirty("strokeWidth") || this.isDirty("strokeOpacity") || this.isDirty("strokeDasharray")) {
			rootEvents.once("frameended", () => {
				this._setStroke();
			})
		}

		if (this.isDirty("fillColor") || this.isDirty("fillOpacity")) {
			rootEvents.once("frameended", () => {
				this._setFill();
			})
		}

		if (this.isDirty("labelFill") || this.isDirty("labelFontSize") || this.isDirty("labelFontFamily") || this.isDirty("labelFontWeight") || this.isDirty("labelFontStyle")) {
			rootEvents.once("frameended", () => {
				this._setLabel();
			})
		}

		if (this.isDirty("showExtension")) {
			rootEvents.once("frameended", () => {
				this._setExtension();
			})
		}

		if (this.isDirty("drawingIcon")) {
			rootEvents.once("frameended", () => {
				this._setDrawingIcon();
			})
		}

		if (this.isDirty("snapToData")) {
			rootEvents.once("frameended", () => {
				this._setSnap();
			})
		}

	}

	protected _setTool(tool?: DrawingTools): void {
		const isInited = this._isInited();

		// Disable current drawing series
		$array.each(this._currentEnabledSeries, (series) => {
			series.disableDrawing();
		});
		this._currentEnabledSeries = [];

		// Disable editing
		if (!tool) {
			if (isInited) {
				this.getPrivate("eraserControl")!.set("active", false);
			}
			this.get("stockChart").set("drawingSelectionEnabled", false)			
			return;
		}

		// Check if we need to create series
		this._maybeInitToolSeries(tool);
		let seriesList = this._drawingSeries[tool];

		let prevPanel: StockPanel;
		$array.each(seriesList, (series) => {
			if (prevPanel !== series.chart) {
				series.enableDrawing();
				this._currentEnabledSeries.push(series);
				prevPanel = series.chart as StockPanel;
			}
		});

		if (isInited) {
			this.getPrivate("toolControl")!.setTool(tool);

			// Show/hide needed drawing property controls
			const controls: any = {
				strokeControl: ["Average", "Callout", "Doodle", "Ellipse", "Fibonacci", "Fibonacci Timezone", "Horizontal Line", "Horizontal Ray", "Arrows &amp; Icons", "Line", "Line Arrow", "Parallel Channel", "Polyline", "Polyfill", "Triangle", "Quadrant Line", "Rectangle", "Regression", "Trend Line", "Vertical Line"],
				strokeWidthControl: ["Average", "Doodle", "Ellipse", "Horizontal Line", "Horizontal Ray", "Arrows &amp; Icons", "Line", "Line Arrow", "Polyline", "Polyfill", "Triangle", "Quadrant Line", "Rectangle", "Regression", "Trend Line", "Vertical Line", "Parallel Channel"],
				strokeDasharrayControl: ["Average", "Doodle", "Ellipse", "Horizontal Line", "Horizontal Ray", "Arrows &amp; Icons", "Line", "Line Arrow", "Polyline", "Polyfill", "Triangle", "Quadrant Line", "Rectangle", "Regression", "Trend Line", "Vertical Line"],
				extensionControl: ["Average", "Line", "Regression", "Trend Line"],
				fillControl: ["Callout", "Ellipse", "Quadrant Line", "Rectangle", "Parallel Channel", "Polyfill", "Triangle", "Polyfill", "Triangle", "Arrows &amp; Icons", "Fibonacci Timezone"],

				labelFillControl: ["Callout", "Label"],
				labelFontSizeControl: ["Callout", "Label"],
				labelFontFamilyControl: ["Callout", "Label"],
				boldControl: ["Callout", "Label"],
				italicControl: ["Callout", "Label"],

				iconControl: ["Arrows &amp; Icons"],
				snapControl: ["Callout", "Arrows &amp; Icons", "Line", "Line Arrow", "Polyline", "Polyfill", "Triangle", "Parallel Channel", "Label", "Callout", "Horizontal Line", "Horizontal Ray", "Vertical Line", "Quadrant Line", "Rectangle", "Measure", "Fibonacci"],
			}

			$object.each(controls, (control, tools) => {
				const controlElement = (<any>this).getPrivate(control);
				if (tools.indexOf(tool) == -1) {
					controlElement.hide();
				}
				else {
					controlElement.show();
				}
				//controlElement!.getPrivate("button").style.display = tools.indexOf(tool) == -1 ? "none" : "";
			});
		}
	}

	protected _maybeInitToolSeries(tool: DrawingTools): void {
		let seriesList = this._drawingSeries[tool];
		if (!seriesList) {
			seriesList = [];
		}

		// Get panels that are already initialized
		const initializedPanels: StockPanel[] = [];
		$array.each(seriesList, (series: DrawingSeries) => {
			initializedPanels.push(series.chart as StockPanel);
		});

		// Get target series
		const chartSeries: XYSeries[] = this.get("series", []);
		const stockChart = this.get("stockChart");
		// if (chartSeries.length == 0) {
		// 	// No target series set, take first series out of each chart
		stockChart.panels.each((panel) => {
			if (initializedPanels.indexOf(panel) == -1) {
				const targetSeries = this._getPanelMainSeries(panel);
				if (targetSeries) {
					chartSeries.push(targetSeries);
				}
			}
		});
		// }

		if (chartSeries.length > 0) {
			const toolSettings: any = this.get("toolSettings", {});

			// Populate the list
			$array.each(chartSeries, (chartSeries) => {
				let series: DrawingSeries | undefined;
				const xAxis = <any>chartSeries.get("xAxis");
				const yAxis = <any>chartSeries.get("yAxis");
				const panel = chartSeries.chart! as StockPanel;
				let template: any;
				if (toolSettings[tool]) {
					template = Template.new(toolSettings[tool]);
					const toolTemplates: any = this.getPrivate("toolTemplates", {});
					toolTemplates[tool] = template;
					this.setPrivate("toolTemplates", toolTemplates);
				}

				switch (tool) {
					case "Arrows &amp; Icons":
						const icon = this.get("drawingIcon", this.get("drawingIcons")![0]);
						series = IconSeries.new(this._root, {
							series: chartSeries,
							xAxis: xAxis,
							yAxis: yAxis,
							iconSvgPath: icon.svgPath,
							iconScale: icon.scale,
							iconCenterX: icon.centerX,
							iconCenterY: icon.centerY,
						}, template);
						break;
					case "Average":
						series = AverageSeries.new(this._root, {
							series: chartSeries,
							xAxis: xAxis,
							yAxis: yAxis
						}, template);
						break;
					case "Callout":
						series = CalloutSeries.new(this._root, {
							series: chartSeries,
							xAxis: xAxis,
							yAxis: yAxis
						}, template);
						break;
					case "Doodle":
						series = DoodleSeries.new(this._root, {
							series: chartSeries,
							xAxis: xAxis,
							yAxis: yAxis
						}, template);
						series.fills.template.setAll({
							forceHidden: true
						});
						break;
					case "Ellipse":
						series = EllipseSeries.new(this._root, {
							series: chartSeries,
							xAxis: xAxis,
							yAxis: yAxis
						}, template);
						break;
					case "Fibonacci":
						series = FibonacciSeries.new(this._root, {
							series: chartSeries,
							xAxis: xAxis,
							yAxis: yAxis
						}, template);
						break;
					case "Fibonacci Timezone":
						series = FibonacciTimezoneSeries.new(this._root, {
							series: chartSeries,
							xAxis: xAxis,
							yAxis: yAxis
						}, template);
						break
					case "Horizontal Line":
						series = HorizontalLineSeries.new(this._root, {
							series: chartSeries,
							xAxis: xAxis,
							yAxis: yAxis
						}, template);
						break;
					case "Horizontal Ray":
						series = HorizontalRaySeries.new(this._root, {
							series: chartSeries,
							xAxis: xAxis,
							yAxis: yAxis
						}, template);
						break;
					case "Label":
						series = LabelSeries.new(this._root, {
							series: chartSeries,
							xAxis: xAxis,
							yAxis: yAxis
						}, template);
						break;
					case "Line":
						series = SimpleLineSeries.new(this._root, {
							series: chartSeries,
							xAxis: xAxis,
							yAxis: yAxis
						}, template);
						break;
					case "Line Arrow":
						series = LineArrowSeries.new(this._root, {
							series: chartSeries,
							xAxis: xAxis,
							yAxis: yAxis
						}, template);
						break;
					case "Measure":
						series = Measure.new(this._root, {
							series: chartSeries,
							xAxis: xAxis,
							yAxis: yAxis
						}, template);
						break;
					case "Parallel Channel":
						series = ParallelChannelSeries.new(this._root, {
							series: chartSeries,
							xAxis: xAxis,
							yAxis: yAxis
						}, template);
						break;
					case "Polyline":
						series = PolylineSeries.new(this._root, {
							series: chartSeries,
							xAxis: xAxis,
							yAxis: yAxis
						}, template);
						series.fills.template.setAll({
							forceHidden: true
						});
						break;
					case "Polyfill":
						series = PolylineSeries.new(this._root, {
							series: chartSeries,
							xAxis: xAxis,
							yAxis: yAxis,
							fillShape: true
						}, template);
						series.fills.template.setAll({
							forceHidden: true
						});
						break;
					case "Triangle":
						series = PolylineSeries.new(this._root, {
							series: chartSeries,
							xAxis: xAxis,
							yAxis: yAxis,
							fillShape: true,
							pointCount: 3
						}, template);
						series.fills.template.setAll({
							forceHidden: true
						});
						break;
					case "Quadrant Line":
						series = QuadrantLineSeries.new(this._root, {
							series: chartSeries,
							xAxis: xAxis,
							yAxis: yAxis
						}, template);
						break;
					case "Rectangle":
						series = RectangleSeries.new(this._root, {
							series: chartSeries,
							xAxis: xAxis,
							yAxis: yAxis
						}, template);
						break;
					case "Regression":
						series = RegressionSeries.new(this._root, {
							series: chartSeries,
							xAxis: xAxis,
							yAxis: yAxis
						}, template);
						break;
					case "Trend Line":
						series = TrendLineSeries.new(this._root, {
							series: chartSeries,
							xAxis: xAxis,
							yAxis: yAxis
						}, template);
						break;
					case "Vertical Line":
						series = VerticalLineSeries.new(this._root, {
							series: chartSeries,
							xAxis: xAxis,
							yAxis: yAxis
						}, template);
						break;


				}
				if (series) {
					seriesList.push(series);
					panel.drawings.push(series);
					series.setPrivate("baseValueSeries", chartSeries);
					series.set("valueYShow", stockChart.getSeriesDefault(chartSeries, "valueYShow"));
					series.set("calculateAggregates", true);
					if (stockChart.getPrivate("comparing")) {
						stockChart.setPercentScale(true);
					}
				}
			})

			this._drawingSeries[tool] = seriesList;

			this._setStroke();
			this._setFill();
			this._setLabel();
			this._setDrawingIcon();
			this._setSnap();
			this._setExtension();
		}
	}

	protected _updateSeriesBindings(panel: StockPanel): void {
		const targetSeries = this._getPanelMainSeries(panel);
		if (targetSeries) {
			$object.each(this._drawingSeries, (_tool, seriesList) => {
				$array.eachReverse(seriesList, (series) => {
					if (series.chart == panel) {
						if (panel.isDisposed()) {
							$array.remove(seriesList, series);
						}
						else {
							series.set("series", targetSeries);
							series.setPrivate("baseValueSeries", targetSeries);
						}
					}
				})
			})
		}
	}

	protected _getPanelMainSeries(panel: StockPanel): XYSeries | undefined {
		const stockChart = this.get("stockChart");
		const stockSeries = stockChart.get("stockSeries");
		let targetSeries: XYSeries | undefined;
		if (stockSeries && stockSeries.chart == panel) {
			targetSeries = stockSeries;
		}
		else {
			targetSeries = panel.series.getIndex(0);
		}
		return targetSeries;
	}

	protected _updatePanelBindings(): void {
		const stockChart = this.get("stockChart");
		stockChart.panels.each((panel) => {
			panel.series.events.onAll(() => this._updateSeriesBindings(panel));
		});
	}

	protected _setStroke(): void {
		$object.each(this._drawingSeries, (_tool, seriesList) => {
			$array.each(seriesList, (series) => {
				series.setAll({
					strokeColor: this.get("strokeColor"),
					strokeWidth: this.get("strokeWidth"),
					strokeOpacity: this.get("strokeOpacity"),
					strokeDasharray: this.get("strokeDasharray"),
				});
			});
		})
	}

	protected _setFill(): void {
		$object.each(this._drawingSeries, (_tool, seriesList) => {
			$array.each(seriesList, (series) => {
				series.setAll({
					fillColor: this.get("fillColor"),
					fillOpacity: this.get("fillOpacity")
				})
			})

		})
	}

	protected _setLabel(): void {
		const labelTools = ["Callout", "Label"];
		$object.each(this._drawingSeries, (tool, seriesList) => {
			if (labelTools.indexOf(<string>tool) != -1) {
				$array.each(seriesList, (series) => {
					(<LabelSeries>series).setAll({
						labelFill: this.get("labelFill"),
						labelFontSize: this.get("labelFontSize"),
						labelFontFamily: this.get("labelFontFamily"),
						labelFontWeight: this.get("labelFontWeight"),
						labelFontStyle: this.get("labelFontStyle")
					})
				});
			}
		})
	}

	protected _setExtension(): void {
		$object.each(this._drawingSeries, (_tool, seriesList) => {
			$array.each(seriesList, (series) => {
				if (series instanceof SimpleLineSeries) {
					series.setAll({
						showExtension: this.get("showExtension")
					})
				}
			});
		})
	}

	protected _setDrawingIcon(): void {
		if (!this._isInited()) {
			return;
		}

		const icon = this.get("drawingIcon", this.get("drawingIcons")![0]);
		const fillControl = this.getPrivate("fillControl")!;
		if (icon.fillDisabled) {
			fillControl.hide();
		}
		else {
			fillControl.show();
		}
		$object.each(this._drawingSeries, (_tool, seriesList) => {
			$array.each(seriesList, (series) => {
				if (series instanceof IconSeries) {
					series.setAll({
						iconSvgPath: icon.svgPath,
						iconScale: icon.scale,
						iconCenterX: icon.centerX,
						iconCenterY: icon.centerY,
						fillOpacity: icon.fillDisabled ? 0 : this.get("fillOpacity")
					})
				}
			});
		})
	}

	protected _setSnap(): void {
		const snap = this.get("snapToData", false);
		$object.each(this._drawingSeries, (_tool, seriesList) => {
			$array.each(seriesList, (series) => {
				if (series.getPrivate("allowChangeSnap")) {
					series.set("snapToData", snap);
				}
			});
		})
	}

	protected _getDefaultIcon(): SVGElement {
		return StockIcons.getIcon("Draw");
	}

	protected _dispose(): void {
		super._dispose();
		const toolsContainer = this.getPrivate("toolsContainer");
		if (toolsContainer) {
			$utils.removeElement(toolsContainer);
		}
	}

	protected _getSeriesTool(series: DrawingSeries): DrawingTools | undefined {
		if (series instanceof DrawingSeries) {
			let name = series.className;
			if (name == "SimpleLineSeries") {
				return "Line";
			}
			else if (name == "IconSeries") {
				return "Arrows &amp; Icons";
			}
			else if (name == "PolylineSeries" && (series as PolylineSeries).get("pointCount") == 3) {
				return "Triangle";
			}
			else if (name == "PolylineSeries" && (series as PolylineSeries).get("fillShape")) {
				return "Polyfill";
			}
			name = $utils.addSpacing(name.replace("Series", ""));
			return name as DrawingTools;
		}
	}

	/**
	 * Serializes all drawings into an array of simple objects or JSON.
	 *
	 * `output` parameter can either be `"object"` or `"string"` (default).
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/stock/serializing-indicators-annotations/} for more info
	 * @since 5.3.0
	 * @param   output Output format
	 * @param   indent Line indent in JSON
	 * @return         Serialized indicators
	 */
	public serializeDrawings(output: "object" | "string" = "string", indent?: string): Array<unknown> | string {
		const res: Array<any> = [];
		this.get("stockChart").panels.each((panel, panelIndex) => {
			panel.series.each((series) => {
				if (series.isType<DrawingSeries>("DrawingSeries")) {
					const serializer = Serializer.new(this.root, {
						includeSettings: ["strokeColor", "fillColor", "strokeOpacity", "fillOpacity", "strokeWidth", "strokeDasharray", "field", "snapToData", "svgPath", "labelFontSize", "labelFontFamily", "labelFontWeight", "labelFontStyle", "labelFill", "showExtension"],
						//includeSettings: ["data"],
						maxDepth: 4
					});
					series.data.values.map((row: any) => {
						row.__parse = true;
					})
					const json: any = {
						__tool: this._getSeriesTool(series),
						__panelIndex: panelIndex,
						__drawing: serializer.serialize(series.data.values, 0, true)
					}
					//json.__panelIndex = panelIndex;
					res.push(json);
				}
			});
		});
		return output == "object" ? res : JSON.stringify(res, undefined, indent);
	}

	/**
	 * Parses data serialized with `serializeDrawings()` and adds drawings to the
	 * chart.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/stock/serializing-indicators-annotations/} for more info
	 * @since 5.3.0
	 * @param  data Serialized data
	 */
	public unserializeDrawings(data: string | Array<any>): void {
		const stockChart = this.get("stockChart");
		if ($type.isString(data)) {
			data = JSON.parse(data);
		}
		if (!$type.isArray(data)) {
			data = [data];
		}
		$array.each(data, (drawing) => {
			// Panel
			let panel = stockChart.panels.getIndex(drawing.__panelIndex || 0)!;

			if (panel) {
				const tool = drawing.__tool;

				this._maybeInitToolSeries(tool);

				// Get series
				let drawingSeries: DrawingSeries;
				$array.each(this._drawingSeries[tool] || [], (series) => {
					if (series.chart === panel) {
						drawingSeries = series;
					}
				});

				if (!drawing.settings) {
					drawing.settings = {};
				}

				// Parse
				JsonParser.new(this._root).parse(drawing.__drawing).then((drawingData: any) => {
					this._updateDrawingIndexes(drawingData, drawingSeries._index, drawingSeries);
					drawingSeries.data.pushAll(drawingData);
				});

			}
			else {
				// Wait until panel becomes available
				stockChart.panels.events.once("push", (ev) => {
					ev.newValue.series.events.once("push", (_ev) => {
						this.unserializeDrawings(drawing);
					})
				})
			}
		})
	}

	protected _updateDrawingIndexes(drawingData: any, index: number, drawingSeries: DrawingSeries): void {
		if ($type.isArray(drawingData)) {
			$array.each(drawingData, (item: any) => {
				this._updateDrawingIndexes(item, index, drawingSeries);
			})
		}
		else if ($type.isObject(drawingData as any) && drawingData.index !== undefined) {
			drawingData.index += index;
			drawingSeries._index = drawingData.index;
		}
	}

	/**
	 * Returns an object that holds all drawing series, arrange by tool (key).
	 *
	 * @since 5.8.0
	 * @readonly
	 */
	public get drawingSeries(): { [index: string]: DrawingSeries[] } {
		return this._drawingSeries;
	}

	/**
	 * Adds a line drawing.
	 *
	 * Supported tools: `"Horizontal Line"`, `"Horizontal Ray"`, `"Vertical Line"`.
	 * 
	 * @param  tool   Drawing tool
	 * @param  panel  Panel
	 * @param  point  Point
	 * @since 5.10.2
	 */
	public addLine(tool: "Horizontal Line" | "Horizontal Ray" | "Vertical Line", panel: StockPanel, point: IPoint): void {
		this._maybeInitToolSeries(tool);
		const seriesList = this._drawingSeries[tool];
		let targetSeries: SimpleLineSeries | undefined;
		$array.each(seriesList, (series) => {
			if (panel === series.chart) {
				targetSeries = series as SimpleLineSeries;
			}
		});
		if (targetSeries) {
			targetSeries.addLine(point);
		}
	}
}
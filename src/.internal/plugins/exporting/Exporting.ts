import type { ExportingMenu } from "./ExportingMenu"
import type { TimeUnit } from "../../core/util/Time";

import { Entity, IEntitySettings, IEntityPrivate, IEntityEvents } from "../../core/util/Entity"
import { Color } from "../../core/util/Color";
import { Root } from "../../core/Root"
import { StyleRule } from "../../core/util/Utils"
import { renderToSVG } from "../../core/render/backend/SvgExport";

import * as $array from "../../core/util/Array";
import * as $object from "../../core/util/Object";
import * as $type from "../../core/util/Type";
import * as $utils from "../../core/util/Utils";

export interface IFile {
	path: string;
	bytes: string;
}

export interface IFont {
	name: string;
	normal: IFile;
	bold?: IFile;
	italics?: IFile;
	bolditalics?: IFile;
}

/**
 * This is used to cache the pdfmake loading.
 *
 * @ignore
 */
let pdfmakePromise: Promise<any>;

/**
 * Loads pdfmake dynamic module
 *
 * This is an asynchronous function. Check the description of `getImage()`
 * for description and example usage.
 *
 * @ignore
 */
async function _pdfmake(): Promise<any> {
	let a = await Promise.all([
		import(/* webpackChunkName: "pdfmake" */ "pdfmake/build/pdfmake.js"),
		import(/* webpackChunkName: "pdfmake" */ "./pdfmake/vfs_fonts")
	]);

	let pdfmake = a[0].default;
	let vfs_fonts = a[1].default;

	// pdfmake 0.3+ no longer reads a plain `vfs` assignment; the virtual file
	// system must be registered through `addVirtualFileSystem()`. The default
	// Roboto font definition is already set up by pdfmake itself.
	pdfmake.addVirtualFileSystem(vfs_fonts);
	return pdfmake;
}

export type ExportingTypes = "image" | "data" | "print";
export type ExportingFormats = "png" | "jpg" | "svg" | "canvas" | "pdf" | "xlsx" | "csv" | "json" | "html" | "pdfdata" | "print";
export type ExportingImageFormats = "png" | "jpg";

export interface IExportingImageSource {

	/**
	 * Root element of the extra chart to add to the export.
	 */
	source: Root;

	/**
	 * Top margin in pixels.
	 */
	marginTop?: number;

	/**
	 * Right margin in pixels.
	 */
	marginRight?: number;

	/**
	 * Bottom margin in pixels.
	 */
	marginBottom?: number;

	/**
	 * Left margin in pixels.
	 */
	marginLeft?: number;

	/**
	 * Side of the main chart to place the extra chart on.
	 *
	 * @default "bottom"
	 */
	position?: "left" | "right" | "top" | "bottom";

	/**
	 * Keeps the export at the main chart's width (or height, for `"left"` and
	 * `"right"`), cutting off an extra chart that is larger.
	 */
	crop?: boolean;

}

export interface IExportingSettings extends IEntitySettings {

	/**
	 * The [[ExportingMenu]] that offers the formats to the user.
	 */
	menu?: ExportingMenu;

	/**
	 * Background color of exported images. If not set, it is taken from the
	 * CSS background of the chart's element, or the nearest parent that has
	 * one; white if none does.
	 */
	backgroundColor?: Color;

	/**
	 * Opacity of the exported image's background: `0` (transparent) to `1`
	 * (opaque). JPEG has no transparency.
	 *
	 * @default 1
	 * @since 5.2.34
	 */
	backgroundOpacity?: number;

	/**
	 * Name of downloaded files, before the extension.
	 *
	 * @default "chart"
	 */
	filePrefix?: string;

	/**
	 * Title of the export: the heading of a PDF, the page title when printing
	 * and the sheet name in XLSX.
	 */
	title?: string;

	/**
	 * Charset of exported files.
	 *
	 * @default "utf-8"
	 */
	charset?: string;

	/**
	 * Fields to include in data exports, and their column names: keys are
	 * fields in the data, values the column names.
	 */
	dataFields?: { [index: string]: string },

	/**
	 * Order of the fields in data exports.
	 */
	dataFieldsOrder?: string[],

	/**
	 * Fields whose numbers are formatted with `numberFormat`.
	 */
	numericFields?: string[],

	/**
	 * Number format for the values in `numericFields`. If not set, they are
	 * exported as they are.
	 */
	numberFormat?: string | Intl.NumberFormatOptions,

	/**
	 * Fields whose numbers are timestamps, exported as dates.
	 */
	dateFields?: string[],

	/**
	 * Date format for dates in data exports. If not set, the root's
	 * [[DateFormatter]] format is used.
	 */
	dateFormat?: string | Intl.DateTimeFormatOptions,

	/**
	 * Fields whose numbers are durations, formatted with `durationFormat`.
	 *
	 * @since 5.0.16
	 */
	durationFields?: string[],

	/**
	 * Format for the values in `durationFields`. If not set, the root's
	 * [[DurationFormatter]] format is used.
	 *
	 * @since 5.0.16
	 */
	durationFormat?: string,

	/**
	 * Time unit the values in `durationFields` are in. If not set, the root's
	 * [[DurationFormatter]] `baseUnit` is used.
	 *
	 * @since 5.0.16
	 */
	durationUnit?: TimeUnit;

	/**
	 * Other charts to add around the main chart in image exports.
	 */
	extraImages?: Array<Root | IExportingImageSource>;

	/**
	 * Data for data exports: an array of objects. Without it, the data formats
	 * are not offered.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/exporting/#Exporting_data} for more info
	 */
	dataSource?: any;

	/**
	 * PNG format options.
	 */
	pngOptions?: IExportingImageOptions;

	/**
	 * JPEG format options.
	 */
	jpgOptions?: IExportingImageOptions;

	/**
	 * SVG format options.
	 *
	 * @since 5.21.0
	 */
	svgOptions?: IExportingSVGOptions;

	/**
	 * Options for `exportCanvas()`.
	 */
	canvasOptions?: IExportingImageOptions;

	/**
	 * PDF format options.
	 */
	pdfOptions?: IExportingPDFOptions;

	/**
	 * Options for the PDF with a data table.
	 */
	pdfdataOptions?: IExportingDataOptions;

	/**
	 * XLSX format options.
	 */
	xlsxOptions?: IExportingXLSXOptions;

	/**
	 * CSV format options.
	 */
	csvOptions?: IExportingCSVOptions;

	/**
	 * JSON format options.
	 */
	jsonOptions?: IExportingJSONOptions;

	/**
	 * HTML format options.
	 */
	htmlOptions?: IExportingHTMLOptions;

	/**
	 * Print options.
	 */
	printOptions?: IExportingPrintOptions;

}

export interface IExportingPrivate extends IEntityPrivate {
}

export interface IExportEvent {

	/**
	 * Format of the export.
	 */
	format: ExportingFormats,

	/**
	 * Options of the format.
	 */
	options: IExportingFormatOptions

}

export interface IExportingEvents extends IEntityEvents {

	/**
	 * An export started.
	 */
	exportstarted: IExportEvent;

	/**
	 * An export was set off. It is dispatched before the result is ready, so
	 * to use the result, wait for the promise `export()` returns.
	 */
	exportfinished: IExportEvent;

	/**
	 * A download was requested, before its file is generated.
	 */
	downloadstarted: IExportEvent & {
		fileName: string,
	};

	/**
	 * Printing was requested, before the image to print is generated.
	 */
	printstarted: IExportEvent;

	/**
	 * The data for a data export is prepared. A listener can still change
	 * `data`.
	 */
	dataprocessed: IExportEvent & {
		data: any
	}

	/**
	 * The XLSX workbook is prepared. A listener can still change it before it
	 * is written.
	 */
	workbookready: IExportEvent & {
		workbook: any,
		workbookOptions: any,
		xlsx: any
	}

	/**
	 * The PDF document definition is prepared. A listener can still change it
	 * before the PDF is made.
	 */
	pdfdocready: IExportEvent & {
		doc: any
	}

}

export interface IExportingFormatOptions {

	/**
	 * Leaves this format out of the [[ExportingMenu]].
	 */
	disabled?: boolean;

}

export interface IExportingImageOptions extends IExportingFormatOptions {

	/**
	 * Quality of the image, `0` to `1`: `1` by default, `0.8` for JPG. Only
	 * JPEG images use it.
	 */
	quality?: number;

	/**
	 * Exports the image at the chart's size in CSS pixels. When `false`, it is
	 * exported at the screen's resolution: larger on high-density screens.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/exporting/exporting-images/#Pixel_ratio} for more info
	 * @default false
	 */
	maintainPixelRatio?: boolean;

	/**
	 * Minimal width of exported image, in pixels.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/exporting/exporting-images/#Sizing_exported_image} for more info
	 */
	minWidth?: number;

	/**
	 * Maximal width of exported image, in pixels.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/exporting/exporting-images/#Sizing_exported_image} for more info
	 */
	maxWidth?: number;

	/**
	 * Minimal height of exported image, in pixels.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/exporting/exporting-images/#Sizing_exported_image} for more info
	 */
	minHeight?: number;

	/**
	 * Maximal height of exported image, in pixels.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/exporting/exporting-images/#Sizing_exported_image} for more info
	 */
	maxHeight?: number;

}

export interface IExportingSVGOptions extends IExportingFormatOptions {

	/**
	 * Number of decimal places in coordinates.
	 *
	 * @default 3
	 */
	precision?: number;

}

export interface IExportingPrintOptions extends IExportingImageOptions {

	/**
	 * With `"iframe"` printing, how long in milliseconds to wait before
	 * opening the print dialog, so the image is ready. With `"css"`, how long
	 * the page stays hidden for printing.
	 *
	 * @default 500
	 */
	delay?: number;

	/**
	 * How to print. If one doesn't work in your setup, try the other.
	 *
	 * * `"iframe"`: prints the image from a hidden `<iframe>`.
	 * * `"css"`: hides the rest of the page with CSS while it prints.
	 *
	 * @default "iframe"
	 */
	printMethod?: "css" | "iframe";

	/**
	 * Image format to print.
	 *
	 * @default "png"
	 */
	imageFormat?: "png" | "jpg";

}

/**
 * Available PDF page sizes.
 */
export type pageSizes = "4A0" | "2A0" | "A0" | "A1" | "A2" | "A3" | "A4" | "A5" | "A6" | "A7" | "A8" | "A9" | "A10" |
	"B0" | "B1" | "B2" | "B3" | "B4" | "B5" | "B6" | "B7" | "B8" | "B9" | "B10" |
	"C0" | "C1" | "C2" | "C3" | "C4" | "C5" | "C6" | "C7" | "C8" | "C9" | "C10" |
	"RA0" | "RA1" | "RA2" | "RA3" | "RA4" |
	"SRA0" | "SRA1" | "SRA2" | "SRA3" | "SRA4" |
	"EXECUTIVE" | "FOLIO" | "LEGAL" | "LETTER" | "TABLOID";

export interface IExportingPDFOptions extends IExportingImageOptions {

	/**
	 * Adds a table of the `dataSource` data below the chart image.
	 */
	includeData?: boolean;

	/**
	 * Format of the chart image in the PDF.
	 *
	 * @default "png"
	 */
	imageFormat?: "png" | "jpg";

	/**
	 * Font size of the title, the page URL and the data table.
	 *
	 * @default 14
	 */
	fontSize?: number;

	/**
	 * Horizontal alignment of the chart image on the page: `"left"`,
	 * `"center"` or `"right"`.
	 *
	 * @default "left"
	 */
	align?: "left" | "center" | "middle";

	/**
	 * Adds the URL of the page the chart was exported from.
	 *
	 * @default true
	 */
	addURL?: boolean;

	/**
	 * Page size.
	 *
	 * @default "A4"
	 */
	pageSize?: pageSizes;

	/**
	 * Page orientation.
	 *
	 * @default "portrait"
	 */
	pageOrientation?: "landscape" | "portrait";

	/**
	 * Page margins in points (1/72 inch): one number for all four edges,
	 * `[horizontal, vertical]`, or `[left, top, right, bottom]`.
	 *
	 * @default 30
	 */
	pageMargins?: number | number[];

	/**
	 * Font of the PDF's text. The default font has only Latin and Cyrillic
	 * characters, so text in other scripts needs a font that has them.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/exporting/exporting-pdf/#Fonts} for more info
	 */
	font?: IFont;

	/**
	 * More fonts to register, for use by individual elements of the document,
	 * e.g. from a `pdfdocready` listener. Used only together with `font`.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/exporting/exporting-pdf/#Fonts} for more info
	 */
	extraFonts?: Array<IFont>;

}

export interface IExportingDataOptions extends IExportingFormatOptions {

	/**
	 * Text for empty values: `"-"` in HTML by default, an empty string in the
	 * other formats.
	 */
	emptyAs?: string;

	/**
	 * Exports dates as timestamps instead of formatted dates.
	 *
	 * @default false
	 */
	useTimestamps?: boolean;

	/**
	 * Formats dates in the browser's locale instead of with `dateFormat`.
	 *
	 * @default false
	 */
	useLocale?: boolean;

	/**
	 * Swaps rows and columns, so that each field is a row.
	 */
	pivot?: boolean;

	/**
	 * Adds the column names as the first row (or column, with `pivot`) in CSV,
	 * HTML, XLSX and PDF tables.
	 *
	 * @default true
	 */
	addColumnNames?: boolean;

}

export interface IExportingJSONOptions extends IExportingDataOptions {

	/**
	 * Indentation of the JSON: a number of spaces, or a string to indent with.
	 *
	 * @default 2
	 */
	indent?: string | number;

	/**
	 * Uses the column names from `dataFields` as keys, instead of the field
	 * names. Has no effect without `dataFields`.
	 *
	 * @default true
	 */
	renameFields?: boolean;

}

export interface IExportingCSVOptions extends IExportingDataOptions {

	/**
	 * Column separator.
	 *
	 * @default ","
	 */
	separator?: string;

	/**
	 * Quotes all values, numbers too.
	 *
	 * @default false
	 */
	forceQuotes?: boolean;

	/**
	 * Exports the rows in reverse order.
	 *
	 * @default false
	 */
	reverse?: boolean;

	/**
	 * Starts the file with a byte order mark, so that Excel reads its UTF-8
	 * characters correctly.
	 *
	 * @default true
	 * @since 5.1.0
	 */
	addBOM?: boolean;

	/**
	 * Protects against spreadsheet formula injection ("CSV injection"): text
	 * values that start with `=`, `+`, `-`, `@`, a tab or a carriage return
	 * get a single quote in front, so they are read as plain text.
	 *
	 * @default true
	 * @since 5.19.0
	 */
	escapeFormulas?: boolean;

}

export interface IExportingHTMLOptions extends IExportingDataOptions {

	/**
	 * `class` attribute of the `<table>` tag.
	 */
	tableClass?: string;

	/**
	 * `class` attribute of the `<tr>` tags.
	 */
	rowClass?: string;

	/**
	 * `class` attribute of the `<th>` tags.
	 */
	headerClass?: string;

	/**
	 * `class` attribute of the `<td>` tags.
	 */
	cellClass?: string;

}

export interface IExportingXLSXOptions extends IExportingDataOptions {
	// @todo
	//sheets?: string[];

	/**
	 * Protects against spreadsheet formula injection: text values that start
	 * with `=`, `+`, `-`, `@`, a tab or a carriage return get a single quote in
	 * front, so they are read as plain text.
	 *
	 * @default true
	 * @since 5.19.0
	 */
	escapeFormulas?: boolean;
}

/**
 * A list of characters that, when a spreadsheet cell value begins with one of
 * them, can cause the cell to be interpreted as a formula by Excel, Google
 * Sheets, LibreOffice, etc. (a.k.a. "formula injection" / "CSV injection").
 *
 * @ignore
 */
const formulaInjectionChars: string[] = ["=", "+", "-", "@", "\t", "\r"];

/**
 * A plugin that exports the chart as an image, PDF or print, and its data as
 * JSON, CSV, XLSX, HTML or a PDF table.
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/exporting/} for more info
 */
export class Exporting extends Entity {
	public static className: string = "Exporting";
	public static classNames: Array<string> = Entity.classNames.concat([Exporting.className]);

	declare public _settings: IExportingSettings;
	declare public _privateSettings: IExportingPrivate;
	declare public _events: IExportingEvents;

	//public extraImages: Array<Root | IExportingImageSource> = [];
	//public dataSources: any[] = [];

	protected _afterNew() {
		super._afterNew();
		this._setRawDefault("filePrefix", "chart");
		this._setRawDefault("charset", "utf-8");
		this._setRawDefault("numericFields", []);
		this._setRawDefault("dateFields", []);
		this._setRawDefault("durationFields", []);
		this._setRawDefault("extraImages", []);
		this._setRawDefault("pngOptions", { quality: 1, maintainPixelRatio: false });
		this._setRawDefault("jpgOptions", { quality: 0.8, maintainPixelRatio: false });
		this._setRawDefault("printOptions", { quality: 1, maintainPixelRatio: false, delay: 500, printMethod: "iframe", imageFormat: "png" });
		this._setRawDefault("jsonOptions", { indent: 2, renameFields: true });
		this._setRawDefault("csvOptions", { separator: ",", addColumnNames: true, emptyAs: "", addBOM: true });
		this._setRawDefault("htmlOptions", { emptyAs: "-", addColumnNames: true });
		this._setRawDefault("xlsxOptions", { emptyAs: "", addColumnNames: true });
		this._setRawDefault("pdfOptions", { fontSize: 14, imageFormat: "png", align: "left", addURL: true });
		this._setRawDefault("pdfdataOptions", { emptyAs: "", addColumnNames: true });

		this._root.addDisposer(this);
	}

	public _beforeChanged() {
		super._beforeChanged();

		if (this.isDirty("menu")) {
			const menu = this.get("menu");
			if (menu) {
				menu.set("exporting", this);
				this._disposers.push(menu);
			}
		}
	}

	protected _getFormatOptions(format: ExportingFormats, options?: IExportingFormatOptions): IExportingFormatOptions {
		const newOptions: any = $object.copy((<any>this).get(format + "Options", {}));
		if (options) {
			$object.each(options, (key, value) => {
				newOptions[key] = value;
			});
		}
		return newOptions;
	}

	/**
	 * Exports the chart or its data in a format and downloads the file, named
	 * `filePrefix` plus the format's extension.
	 *
	 * @param  format         Format
	 * @param  customOptions  Format options, over the format's own options setting
	 */
	public async download(format: ExportingFormats, customOptions?: IExportingFormatOptions) {
		const ext = format == "pdfdata" ? "pdf" : format;
		const fileName = this.get("filePrefix", "chart") + "." + ext;
		const options = this._getFormatOptions(format, customOptions);
		this.events.dispatch("downloadstarted", {
			type: "downloadstarted",
			format: format,
			options: options,
			fileName: fileName,
			target: this
		});
		const uri = await this.export(format, options);
		this.streamFile(uri, fileName, (options && (<IExportingCSVOptions>options).addBOM));
	}

	/**
	 * Prints the chart.
	 *
	 * @param  customOptions  Print options, over `printOptions`
	 */
	public async print(customOptions?: IExportingPrintOptions) {
		const options = <IExportingPrintOptions>this._getFormatOptions("print", customOptions);
		this.events.dispatch("printstarted", {
			type: "printstarted",
			format: "print",
			options: options,
			target: this
		});
		const uri = await this.export(options.imageFormat || "png", options);
		this.initiatePrint(uri, options, this.get("title"));
	}

	/**
	 * Exports the chart or its data in a format, as a data URI.
	 *
	 * @param          format  Format
	 * @param   customOptions  Format options, over the format's own options setting
	 * @return                 Promise of the data URI
	 */
	public async export(format: ExportingFormats, customOptions?: IExportingFormatOptions): Promise<string> {
		const options = this._getFormatOptions(format, customOptions);
		this.events.dispatch("exportstarted", {
			type: "exportstarted",
			format: format,
			options: options,
			target: this
		});

		let promise: Promise<string> | string = "";
		switch (format) {
			case "png":
			case "jpg":
				this._root._runTickerNow();
				promise = this.exportImage(format, options);
				break;
			case "svg":
				this._root._runTickerNow();
				promise = this.exportSVG(options);
				break;
			case "json":
				promise = this.exportJSON(options);
				break;
			case "csv":
				promise = this.exportCSV(options);
				break;
			case "html":
				promise = this.exportHTML(options);
				break;
			case "xlsx":
				promise = this.exportXLSX(options);
				break;
			case "pdf":
				this._root._runTickerNow();
				promise = this.exportPDF(options);
				break;
			case "pdfdata":
				promise = this.exportPDFData(options);
				break;
		}
		this.events.dispatch("exportfinished", {
			type: "exportfinished",
			format: format,
			options: options,
			target: this
		});
		return promise;
	}

	/**
	 * ==========================================================================
	 * Images
	 * ==========================================================================
	 */

	/**
	 * Returns the chart image as a data URI.
	 *
	 * @param   format         Image format
	 * @param   customOptions  Format options
	 * @return                 Promise
	 */
	public async exportImage(format: ExportingImageFormats, customOptions?: IExportingImageOptions): Promise<string> {
		const options: any = this._getFormatOptions(format, customOptions);
		const canvas = await this.getCanvas(options);
		const data = canvas.toDataURL(this.getContentType(format), options.quality || 1);
		this.disposeCanvas(canvas);
		return data;
	}

	/**
	 * Returns the chart image as a PNG data URI, using `canvasOptions`.
	 *
	 * @param   customOptions  Image options
	 * @return                 Promise
	 */
	public async exportCanvas(customOptions?: IExportingImageOptions): Promise<string> {
		const options: any = this._getFormatOptions("canvas", customOptions);
		const canvas = await this.getCanvas(options);
		const data = canvas.toDataURL(this.getContentType("canvas"), options.quality || 1);
		this.disposeCanvas(canvas);
		return data;
	}

	/**
	 * Returns the chart image as an SVG data URI, whichever renderer the chart
	 * uses.
	 *
	 * @param   customOptions  Format options
	 * @return                 Promise
	 * @since 5.21.0
	 */
	public async exportSVG(customOptions?: IExportingSVGOptions): Promise<string> {
		return "data:" + this.getContentType("svg") + ";" + this.get("charset", "utf-8") + "," + encodeURIComponent(await this.getSVG(customOptions));
	}

	/**
	 * Returns the chart image as SVG markup, with `extraImages` placed around
	 * it.
	 *
	 * @param   customOptions  Format options
	 * @return                 Promise
	 * @since 5.21.0
	 */
	public async getSVG(customOptions?: IExportingSVGOptions): Promise<string> {
		const options = <IExportingSVGOptions>this._getFormatOptions("svg", customOptions);
		const precision = options.precision;
		const extraImages = this.get("extraImages", []);

		// Get background
		const background = this.get("backgroundColor", this.findBackgroundColor(this._root.dom));
		const backgroundOpacity = this.get("backgroundOpacity", 1);
		const fill = background ? background.toCSS(backgroundOpacity) : undefined;

		if (extraImages.length == 0) {
			return renderToSVG(this._root, { precision, background: fill });
		}

		const size = (root: Root) => {
			return {
				width: root.width() || root._rootContainer.width(),
				height: root.height() || root._rootContainer.height()
			};
		}

		// Same layout as `getCanvas()`
		const main = size(this._root);
		let middleLeft = 0;
		let middleTop = 0;
		let middleWidth = main.width;
		let middleHeight = main.height;
		let extraRight = 0;
		let extraBottom = 0;

		const extras: Array<{ svg: string, position: string, left: number, top: number, width: number, height: number }> = [];

		$array.each(extraImages, (extraRoot, index) => {
			const extra: IExportingImageSource = extraRoot instanceof Root ? { source: extraRoot } : extraRoot;
			const position = extra.position || "bottom";
			const marginLeft = extra.marginLeft || 0;
			const marginTop = extra.marginTop || 0;
			const extraSize = size(extra.source);
			const extraWidth = extraSize.width + marginLeft + (extra.marginRight || 0);
			const extraHeight = extraSize.height + marginTop + (extra.marginBottom || 0);

			if (position == "top") {
				middleWidth = extra.crop ? middleWidth : Math.max(middleWidth, extraWidth);
				middleTop += extraHeight;

			} else if (position == "right") {
				middleHeight = extra.crop ? middleHeight : Math.max(middleHeight, extraHeight);
				extraRight += extraWidth;

			} else if (position == "left") {
				middleHeight = extra.crop ? middleHeight : Math.max(middleHeight, extraHeight);
				middleLeft += extraWidth;

			} else if (position == "bottom") {
				middleWidth = extra.crop ? middleWidth : Math.max(middleWidth, extraWidth);
				extraBottom += extraHeight;
			}

			extras.push({
				// Ids of each chart's defs must not clash
				svg: renderToSVG(extra.source, { precision, idPrefix: "am5-x" + index + "-" }),
				position: position,
				left: marginLeft,
				top: marginTop,
				width: extraWidth,
				height: extraHeight
			});
		});

		const width = middleLeft + middleWidth + extraRight;
		const height = middleTop + middleHeight + extraBottom;
		const body: Array<string> = [];
		const place = (svg: string, x: number, y: number) => {
			body.push("<g transform=\"translate(" + x + "," + y + ")\">" + svg + "</g>");
		}

		if (background && backgroundOpacity > 0) {
			body.push("<rect width=\"" + width + "\" height=\"" + height + "\" fill=\"" + background.toCSSHex() + "\"" + (backgroundOpacity < 1 ? " fill-opacity=\"" + backgroundOpacity + "\"" : "") + "/>");
		}

		let left = middleLeft;
		let top = middleTop;
		let right = left + middleWidth;
		let bottom = top + middleHeight;

		// Radiates outwards from center
		$array.each(extras, (extra) => {
			if (extra.position == "top") {
				top -= extra.height;
				place(extra.svg, middleLeft + extra.left, top + extra.top);

			} else if (extra.position == "right") {
				place(extra.svg, right + extra.left, middleTop + extra.top);
				right += extra.width;

			} else if (extra.position == "left") {
				left -= extra.width;
				place(extra.svg, left + extra.left, middleTop + extra.top);

			} else if (extra.position == "bottom") {
				place(extra.svg, middleLeft + extra.left, bottom + extra.top);
				bottom += extra.height;
			}
		});

		place(renderToSVG(this._root, { precision }), middleLeft, middleTop);

		return "<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" width=\"" + width + "\" height=\"" + height + "\" viewBox=\"0 0 " + width + " " + height + "\">" + body.join("") + "</svg>";
	}

	/**
	 * Returns a `<canvas>` element with an image of the chart and its
	 * `extraImages`.
	 *
	 * @param   options  Image options
	 * @return           Promise
	 */
	public async getCanvas(options: IExportingImageOptions): Promise<HTMLCanvasElement> {
		const mainCanvas = this._root._renderer.getCanvas(this._root._rootContainer._display, options);
		const extraImages = this.get("extraImages", []);

		// Add other canvases
		let middleLeft = 0;
		let middleTop = 0;
		let middleWidth = mainCanvas.width;
		let middleHeight = mainCanvas.height;
		let extraRight = 0;
		let extraBottom = 0;

		const extras: any[] = [];

		$array.each(extraImages, (extraRoot) => {

			// Get that extra
			let extra: IExportingImageSource;

			if (extraRoot instanceof Root) {
				extra = {
					source: extraRoot,
					position: "bottom"
				};

			} else {
				extra = <IExportingImageSource>extraRoot;
			}

			// Set defaults
			extra.position = extra.position || "bottom";
			extra.marginTop = extra.marginTop || 0;
			extra.marginRight = extra.marginRight || 0;
			extra.marginBottom = extra.marginBottom || 0;
			extra.marginLeft = extra.marginLeft || 0;

			const extraCanvas = extra.source._renderer.getCanvas(extra.source._rootContainer._display, options);

			const extraWidth = extraCanvas.width + extra.marginLeft + extra.marginRight;
			const extraHeight = extraCanvas.height + extra.marginTop + extra.marginBottom;

			if (extra.position == "top") {
				middleWidth = extra.crop ? middleWidth : Math.max(middleWidth, extraWidth);
				middleTop += extraHeight;

			} else if (extra.position == "right") {
				middleHeight = extra.crop ? middleHeight : Math.max(middleHeight, extraHeight);
				extraRight += extraWidth;

			} else if (extra.position == "left") {
				middleHeight = extra.crop ? middleHeight : Math.max(middleHeight, extraHeight);
				middleLeft += extraWidth;

			} else if (extra.position === "bottom") {
				middleWidth = extra.crop ? middleWidth : Math.max(middleWidth, extraWidth);
				extraBottom += extraHeight;
			}

			extras.push({
				canvas: extraCanvas,
				position: extra.position,
				left: extra.marginLeft,
				top: extra.marginTop,
				width: extraWidth,
				height: extraHeight
			});

		});

		const newCanvas = this.getDisposableCanvas();

		newCanvas.width = middleLeft + middleWidth + extraRight;
		newCanvas.height = middleTop + middleHeight + extraBottom;

		const ctx = newCanvas.getContext("2d")!;

		// Get background
		const background = this.get("backgroundColor", this.findBackgroundColor(this._root.dom));
		const backgroundOpacity = this.get("backgroundOpacity", 1);

		if (background) {
			ctx.fillStyle = background.toCSS(backgroundOpacity);
			ctx.fillRect(0, 0, newCanvas.width, newCanvas.height);
		}

		let left = middleLeft;
		let top = middleTop;
		let right = left + middleWidth;
		let bottom = top + middleHeight;

		// Radiates outwards from center
		$array.each(extras, (extra) => {
			if (extra.position == "top") {
				top -= extra.height;
				ctx.drawImage(extra.canvas, middleLeft + extra.left, top + extra.top);

			} else if (extra.position == "right") {
				ctx.drawImage(extra.canvas, right + extra.left, middleTop + extra.top);
				right += extra.width;

			} else if (extra.position == "left") {
				left -= extra.width;
				ctx.drawImage(extra.canvas, left + extra.left, middleTop + extra.top);

			} else if (extra.position === "bottom") {
				ctx.drawImage(extra.canvas, middleLeft + extra.left, bottom + extra.top);
				bottom += extra.height;
			}

			//this.disposeCanvas(extra.canvas);
		});

		ctx.drawImage(mainCanvas, middleLeft, middleTop);

		return newCanvas;
	}

	/**
	 * ==========================================================================
	 * JSON
	 * ==========================================================================
	 */

	/**
	 * Returns the data as a JSON file in a data URI.
	 *
	 * @param   customOptions  Format options
	 * @return                 Promise
	 */
	public async exportJSON(customOptions?: IExportingJSONOptions): Promise<string> {
		return "data:" + this.getContentType("json") + ";" + this.get("charset", "utf-8") + "," + encodeURIComponent(await this.getJSON(customOptions));
	}

	/**
	 * Returns the data as a JSON string.
	 *
	 * @param   customOptions  Format options
	 * @return                 Promise
	 */
	public async getJSON(customOptions?: IExportingJSONOptions): Promise<string> {
		const options: any = this._getFormatOptions("json", customOptions);
		return JSON.stringify(this.getData("json", customOptions, options.renameFields), (_key, value) => {
			if ($type.isObject(value)) {
				$object.each(value, (field, item) => {
					value[field] = this.convertToSpecialFormat(field, item, options);
				});
			}
			return value;
		}, options.indent);
	}

	/**
	 * ==========================================================================
	 * CSV
	 * ==========================================================================
	 */

	/**
	 * Returns the data as a CSV file in a data URI.
	 *
	 * @param   customOptions  Format options
	 * @return                 Promise
	 */
	public async exportCSV(customOptions?: IExportingCSVOptions): Promise<string> {
		return "data:" + this.getContentType("csv") + ";" + this.get("charset", "utf-8") + "," + encodeURIComponent(await this.getCSV(customOptions));
	}

	/**
	 * Returns the data as CSV text.
	 *
	 * @param   customOptions  CSV options
	 * @return                 Promise
	 */
	public async getCSV(customOptions?: IExportingCSVOptions): Promise<string> {
		const options: any = this._getFormatOptions("csv", customOptions);

		// Init output
		let csv = "";

		// Add rows
		let br = "";
		const data = this.getData("csv", options);

		// Data fields
		const dataFields = this.getDataFields(data);

		// Vertical or horizontal (default) layout
		if (options.pivot) {

			// Data fields order
			const dataFieldsOrder: string[] = this.get("dataFieldsOrder", []);

			$object.eachOrdered(dataFields, (key, val) => {
				let dataRow = [];
				if (options.addColumnNames) {
					dataRow.push(val);
				}
				for (let len = data.length, i = 0; i < len; i++) {
					let dataValue = data[i][key];
					dataRow.push(this.convertToSpecialFormat(key, dataValue, options, true));
				}
				csv += br + this.getCSVRow(dataRow, options, undefined, true);
				br = "\n";
			}, (a, b) => {
				let ai = dataFieldsOrder.indexOf(a);
				let bi = dataFieldsOrder.indexOf(b);
				if (ai > bi) {
					return 1;
				}
				else if (ai < bi) {
					return -1
				}
				return 0;
			});

		}

		else {
			for (let len = data.length, i = 0; i < len; i++) {
				let row = this.getCSVRow(data[i], options, dataFields);
				if (options.reverse) {
					csv = row + br + csv;
				}
				else {
					csv += br + row;
				}
				br = "\n";
			}

			// Add column names?
			if (options.addColumnNames) {
				csv = this.getCSVRow(dataFields, options, undefined, true) + br + csv;
			}
		}

		return csv;

	}

	/**
	 * @ignore
	 */
	public getCSVRow(row: any, options: IExportingCSVOptions, dataFields: any, asIs: boolean = false): string {

		// Init
		let separator = options.separator || ",";
		let items: any[] = [];

		// Data fields
		if (!dataFields) {
			dataFields = {};
			$object.each(row, (key, value) => {
				dataFields[key] = value;
			});
		}

		// Data fields order
		const dataFieldsOrder: string[] = this.get("dataFieldsOrder", []);

		// Process each row item
		$object.eachOrdered(dataFields, (key, _name) => {

			// Get value
			let value = this.convertEmptyValue(key, row[key], options);

			// Check if we need to skip
			// This is no longer required because we are iterating via dataFields anyway
			/*if (this.dataFields != null && this.dataFields[key] == null) {
				return;
			}*/

			// Convert dates
			let item = asIs ? value : this.convertToSpecialFormat(key, value, options);

			// Neutralize spreadsheet formula injection
			if (options.escapeFormulas !== false) {
				item = this.escapeFormulas(item);
			}

			// Cast and escape doublequotes
			item = "" + item;
			item = item.replace(/"/g, '""');

			// Enclose into double quotes
			if (options.forceQuotes || (item.search(new RegExp("\"|\n|" + separator, "g")) >= 0)) {
				item = "\"" + item + "\"";
			}

			// Add to item
			items.push(item);
		}, (a, b) => {
			let ai = dataFieldsOrder.indexOf(a);
			let bi = dataFieldsOrder.indexOf(b);
			if (ai > bi) {
				return 1;
			}
			else if (ai < bi) {
				return -1
			}
			return 0;
		});

		return items.join(separator);
	}

	/**
	 * ==========================================================================
	 * HTML
	 * ==========================================================================
	 */

	/**
	 * Returns the data as an HTML table in a data URI.
	 *
	 * @param   customOptions  Format options
	 * @return                 Promise
	 */
	public async exportHTML(customOptions?: IExportingHTMLOptions): Promise<string> {
		return "data:" + this.getContentType("html") + ";" + this.get("charset", "utf-8") + "," + encodeURIComponent(await this.getHTML(customOptions));
	}

	/**
	 * Returns the data as the markup of an HTML `<table>`.
	 *
	 * @param   customOptions  HTML options
	 * @return                 Promise
	 */
	public async getHTML(customOptions?: IExportingHTMLOptions): Promise<string> {
		const options: any = this._getFormatOptions("html", customOptions);

		// Init output
		let html = "<table>";
		if (options.tableClass) {
			html = "<table class=\"" + options.tableClass + "\">";
		}

		// Get data
		const data = this.getData("html", options);
		const dataFields = this.getDataFields(data);

		// Vertical or horizontal (default) layout
		if (options.pivot) {

			// Data fields order
			const dataFieldsOrder: string[] = this.get("dataFieldsOrder", []);

			html += "\n<tbody>";

			$object.eachOrdered(dataFields, (key, val) => {
				let dataRow = [];
				if (options.addColumnNames) {
					dataRow.push(val);
				}
				for (let len = data.length, i = 0; i < len; i++) {
					let dataValue = data[i][key];
					dataRow.push(this.convertToSpecialFormat(key, dataValue, options, true));
				}
				html += "\n" + this.getHTMLRow(dataRow, options, undefined, true);
			}, (a, b) => {
				let ai = dataFieldsOrder.indexOf(a);
				let bi = dataFieldsOrder.indexOf(b);
				if (ai > bi) {
					return 1;
				}
				else if (ai < bi) {
					return -1
				}
				return 0;
			});

			html += "\n</tbody>";

		}

		else {
			// Add column names?
			if (options.addColumnNames) {
				html += "\n<thead>\n" + this.getHTMLRow(dataFields, options, undefined, true, true) + "\n</thead>";
			}

			html += "\n<tbody>";

			for (let len = data.length, i = 0; i < len; i++) {
				html += "\n" + this.getHTMLRow(data[i], options, dataFields);
			}

			html += "\n</tbody>";
		}

		html += "\n</table>";

		return html;

	}

	/**
	 * @ignore
	 */
	public getHTMLRow(row: any, options: IExportingHTMLOptions, dataFields: any, asIs: boolean = false, headerRow: boolean = false): string {

		// Init output
		let html = "\t<tr>";
		if (options.rowClass) {
			html = "\t<tr class=\"" + options.rowClass + "\">";
		}

		// Data fields
		if (!dataFields) {
			dataFields = row;
		}

		// Data fields order
		const dataFieldsOrder: string[] = this.get("dataFieldsOrder", []);

		// th or dh?
		const tag = headerRow ? "th" : "td";

		// Process each row item
		let first = true;
		$object.eachOrdered(dataFields, (key, _name) => {

			// Get value
			let value = this.convertEmptyValue(key, row[key], options);

			// Convert dates
			let item = asIs ? value : this.convertToSpecialFormat(key, value, options);

			// Escape HTML entities
			item = "" + item;
			item = item.replace(/[\u00A0-\u9999<>\&]/gim, function (i: string) {
				return "&#" + i.charCodeAt(0) + ";";
			});

			// Which tag to use
			let useTag = tag;
			if (options.pivot && first) {
				useTag = "th";
			}

			// Add cell
			const cellClass = useTag == "th" ? options.headerClass : options.cellClass;
			if (cellClass) {
				html += "\n\t\t<" + useTag + " class=\"" + cellClass + "\">" + item + "</" + useTag + ">";
			}
			else {
				html += "\n\t\t<" + useTag + ">" + item + "</" + useTag + ">";
			}

			first = false;
		}, (a, b) => {
			let ai = dataFieldsOrder.indexOf(a);
			let bi = dataFieldsOrder.indexOf(b);
			if (ai > bi) {
				return 1;
			}
			else if (ai < bi) {
				return -1
			}
			return 0;
		});

		html += "\n\t</tr>";

		return html;
	}

	/**
	 * ==========================================================================
	 * XLSX
	 * ==========================================================================
	 */

	/**
	 * Returns the data as an XLSX file in a data URI.
	 *
	 * @param   customOptions  Format options
	 * @return                 Promise
	 */
	public async exportXLSX(customOptions?: IExportingXLSXOptions): Promise<string> {
		return "data:" + this.getContentType("xlsx") + ";" + this.get("charset", "utf-8") + "," + encodeURIComponent(await this.getXLSX(customOptions));
	}

	/**
	 * Returns the data as an XLSX file, Base64-encoded.
	 *
	 * @param  customOptions  Format options
	 * @return                Promise
	 */
	public async getXLSX(customOptions?: IExportingXLSXOptions): Promise<string> {

		const options: any = this._getFormatOptions("xlsx", customOptions);

		// Load xlsx
		let XLSX = await this.getXLSXLib();

		// Create workbook options
		let wbOptions = {
			bookType: "xlsx",
			bookSST: false,
			type: "base64",
			//dateNF: 'yyyy-mm-dd'
		};

		// Get sheet name
		let sheetName = this._normalizeExcelSheetName(this.get("title", this._t("Data")));

		// Create a workbook
		let wb = {
			SheetNames: <any>[sheetName],
			Sheets: <any>{}
		};

		// Init worksheet data
		let wsData: Array<any> = [];

		// Get data
		const data = this.getData("html", options);
		const dataFields = this.getDataFields(data);

		// Vertical or horizontal (default) layout
		if (options.pivot) {

			// Data fields order
			const dataFieldsOrder: string[] = this.get("dataFieldsOrder", []);

			$object.eachOrdered(dataFields, (key, val) => {
				let dataRow = [];
				if (options.addColumnNames) {
					dataRow.push(val);
				}
				for (let len = data.length, i = 0; i < len; i++) {
					let dataValue = data[i][key];
					dataRow.push(this.convertToSpecialFormat(key, dataValue, options, true));
				}
				wsData.push(this.getXLSXRow(dataRow, options, undefined, true));
			}, (a, b) => {
				let ai = dataFieldsOrder.indexOf(a);
				let bi = dataFieldsOrder.indexOf(b);
				if (ai > bi) {
					return 1;
				}
				else if (ai < bi) {
					return -1
				}
				return 0;
			});

		}

		else {
			// Add column names?
			if (options.addColumnNames) {
				wsData.push(this.getXLSXRow(dataFields, options, undefined, true));
			}

			// Add lines
			for (let len = data.length, i = 0; i < len; i++) {
				wsData.push(this.getXLSXRow(data[i], options, dataFields));
			}
		}

		// Create sheet and add data
		wb.Sheets[sheetName] = XLSX.utils.aoa_to_sheet(wsData);

		this.events.dispatch("workbookready", {
			type: "workbookready",
			format: "xlsx",
			options: options,
			workbook: wb,
			workbookOptions: wbOptions,
			xlsx: XLSX,
			target: this
		});

		return XLSX.write(wb, wbOptions);
	}

	private _normalizeExcelSheetName(name: string): string {
		name = name.replace(/([:\\\/?*\[\]]+)/g, " ");
		return name.length > 30 ? name.substr(0, 30) + "..." : name;
	}

	/**
	 * @ignore
	 */
	public getXLSXRow(row: any, options: IExportingXLSXOptions, dataFields: any, asIs: boolean = false): any[] {

		// Init
		let items: any[] = [];

		// Data fields
		if (!dataFields) {
			dataFields = row;
		}

		// Data fields order
		const dataFieldsOrder: string[] = this.get("dataFieldsOrder", []);

		// Process each row item
		$object.eachOrdered(dataFields, (key, _name) => {

			// Get value
			let value = this.convertEmptyValue(key, row[key], options);

			// Convert dates
			let item = asIs ? value : this.convertToSpecialFormat(key, value, options, true);

			// Neutralize spreadsheet formula injection
			if (options.escapeFormulas !== false) {
				item = this.escapeFormulas(item);
			}

			items.push(item);
		}, (a, b) => {
			let ai = dataFieldsOrder.indexOf(a);
			let bi = dataFieldsOrder.indexOf(b);
			if (ai > bi) {
				return 1;
			}
			else if (ai < bi) {
				return -1
			}
			return 0;
		});

		return items;
	}


	/**
	 * @ignore
	 */
	private async _xlsx(): Promise<any> {
		return await import(/* webpackChunkName: "xlsx" */ "../../bundled/xlsx");
	}

	/**
	 * @ignore
	 */
	public getXLSXLib(): Promise<any> {
		return this._xlsx();
	}

	/**
	 * ==========================================================================
	 * PDF
	 * ==========================================================================
	 */

	/**
	 * Returns a PDF of the chart image, with a data table if `includeData` is
	 * set, as a data URI.
	 *
	 * @param   customOptions  Format options
	 * @return                 Promise
	 */
	public async exportPDF(customOptions?: IExportingPDFOptions): Promise<string> {
		return "data:" + this.getContentType("pdf") + ";" + this.get("charset", "utf-8") + "," + encodeURIComponent(await this.getPDF(customOptions, true));
	}

	/**
	 * Returns a PDF of the data as a table, without the chart image, as a data
	 * URI.
	 *
	 * @param   customOptions  Format options
	 * @return                 Promise
	 */
	public async exportPDFData(customOptions?: IExportingDataOptions): Promise<string> {
		return "data:" + this.getContentType("pdf") + ";" + this.get("charset", "utf-8") + "," + encodeURIComponent(await this.getPDF(customOptions, false, true));
	}

	/**
	 * Returns a PDF file, Base64-encoded.
	 *
	 * @param   customOptions  PDF options
	 * @param   includeImage   Include the chart image
	 * @param   includeData    Include the data table (also added with `includeData` in the options)
	 * @return                 Promise
	 */
	public async getPDF(customOptions?: IExportingPDFOptions, includeImage: boolean = true, includeData: boolean = false): Promise<string> {

		const options: any = this._getFormatOptions("pdf", customOptions);
		const dataOptions: any = this._getFormatOptions("pdfdata", customOptions);
		const orientation: "landscape" | "portrait" = options.pageOrientation || "portrait";

		// Get image
		let image: string;

		const imageSize = {
			width: 0,
			height: 0
		};

		if (includeImage) {
			const imageFormat = options.imageFormat || "png";
			const imageOptions: any = this._getFormatOptions(imageFormat, options);
			const canvas = await this.getCanvas(imageOptions);
			imageSize.width = canvas.clientWidth;
			imageSize.height = canvas.clientHeight;
			image = canvas.toDataURL(this.getContentType(imageFormat), options.quality || 1);
			this.disposeCanvas(canvas);
		}
		// Load pdfmake

		const pdfmake = await this.getPdfmake();

		// Defaults
		const defaultMargins = [30, 30, 30, 30];

		// Init content for PDF
		let doc = {
			pageSize: options.pageSize || "A4",
			pageOrientation: orientation,
			pageMargins: options.pageMargins || defaultMargins,
			defaultStyle: {
				font: options.font ? options.font.name : undefined
			},
			//header: <any>[],
			content: <any>[]
		};

		// Should we add title?
		const title = this.get("title");

		let extraMargin = 0;

		if (title) {
			doc.content.push({
				text: title,
				fontSize: options.fontSize || 14,
				bold: true,
				margin: [0, 0, 0, 15]
			});

			// Add some leftover margin for title
			extraMargin += 50;
		}

		// Add page URL?
		if (options.addURL) {
			doc.content.push({
				text: this._t("Saved from") + ": " + document.location.href,
				fontSize: options.fontSize,
				margin: [0, 0, 0, 15]
			});

			// Add some leftover margin for URL
			extraMargin += 50;
		}

		// Add image
		if (includeImage && image!) {
			const fitSize = this.getPageSizeFit(doc.pageSize, doc.pageMargins, extraMargin, orientation);
			if ((imageSize.width > fitSize[0]) || (imageSize.height > fitSize[1])) {
				doc.content.push({
					image: image!,
					alignment: options.align || "left",
					fit: fitSize
				});
			}
			else {
				doc.content.push({
					image: image!,
					alignment: options.align || "left"
				});
			}
		}

		// Add data
		if ((includeData || options.includeData) && this.hasData()) {
			doc.content.push({
				table: await this.getPDFData(dataOptions),
				fontSize: options.fontSize || 14
			});
		}

		let fonts: { [name: string]: { [types: string]: string } } | null = null;
		let vfs: { [path: string]: string } | null = null;

		function addFont(font: IFont) {
			const paths: { [path: string]: string } = {};

			paths.normal = font.normal.path;
			vfs![font.normal.path] = font.normal.bytes;

			if (font.bold) {
				paths.bold = font.bold.path;
				vfs![font.bold.path] = font.bold.bytes;

			} else {
				paths.bold = font.normal.path;
			}

			if (font.italics) {
				paths.italics = font.italics.path;
				vfs![font.italics.path] = font.italics.bytes;

			} else {
				paths.italics = font.normal.path;
			}

			if (font.bolditalics) {
				paths.bolditalics = font.bolditalics.path;
				vfs![font.bolditalics.path] = font.bolditalics.bytes;

			} else {
				paths.bolditalics = font.normal.path;
			}

			fonts![font.name] = paths;
		}

		if (options.font) {
			fonts = {};
			vfs = {};
			addFont(options.font);

			if (options.extraFonts) {
				$array.each(options.extraFonts, addFont);
			}

			// In pdfmake 0.3+ custom fonts and their files are registered on the
			// instance rather than passed to `createPdf()`. Merge them onto the
			// existing defaults so subsequent exports keep working.
			pdfmake.addFonts(fonts);
			pdfmake.addVirtualFileSystem(vfs);
		}

		this.events.dispatch("pdfdocready", {
			type: "pdfdocready",
			format: "pdf",
			options: options,
			doc: doc,
			target: this
		});

		// Create PDF
		return await pdfmake.createPdf(doc, {}).getBase64();
	}

	/**
	 * @ignore
	 */
	public async getPDFData(customOptions?: IExportingDataOptions): Promise<any> {

		const options: any = this._getFormatOptions("pdfdata", customOptions);

		// Init output
		let content = <any>{
			"body": <any>[]
		};

		// Get data
		const data = this.getData("html", options);
		const dataFields = this.getDataFields(data);

		// Vertical or horizontal (default) layout
		if (options.pivot) {

			// Data fields order
			const dataFieldsOrder: string[] = this.get("dataFieldsOrder", []);

			$object.eachOrdered(dataFields, (key, val) => {
				let dataRow = [];
				if (options.addColumnNames) {
					dataRow.push(val);
				}
				for (let len = data.length, i = 0; i < len; i++) {
					let dataValue = data[i][key];
					dataRow.push(this.convertToSpecialFormat(key, dataValue, options, true));
				}
				content.body.push(this.getPDFDataRow(dataRow, options, undefined, true));
			}, (a, b) => {
				let ai = dataFieldsOrder.indexOf(a);
				let bi = dataFieldsOrder.indexOf(b);
				if (ai > bi) {
					return 1;
				}
				else if (ai < bi) {
					return -1
				}
				return 0;
			});

		}

		else {

			// Add column names?
			if (options.addColumnNames) {
				content.body.push(this.getPDFDataRow(dataFields, options, undefined, true));
				content.headerRows = 1;
			}

			for (let len = data.length, i = 0; i < len; i++) {
				content.body.push(this.getPDFDataRow(data[i], options, dataFields));
			}

		}

		return content;

	}

	/**
	 * @ignore
	 */
	public getPDFDataRow(row: any, options: IExportingDataOptions, dataFields?: any, asIs: boolean = false): Array<string> {

		// Init
		let items: any[] = [];

		// Data fields
		if (!dataFields) {
			dataFields = row;
		}

		// Data fields order
		const dataFieldsOrder: string[] = this.get("dataFieldsOrder", []);

		// Process each row item
		$object.eachOrdered(dataFields, (key, _name) => {

			// Get value
			let value = this.convertEmptyValue(key, row[key], options);

			// Convert dates
			let item = asIs ? value : this.convertToSpecialFormat(key, value, options);
			item = "" + item;

			// Add to item
			items.push(item);
		}, (a, b) => {
			let ai = dataFieldsOrder.indexOf(a);
			let bi = dataFieldsOrder.indexOf(b);
			if (ai > bi) {
				return 1;
			}
			else if (ai < bi) {
				return -1
			}
			return 0;
		});

		return items;
	}

	/**
	 * Returns pdfmake instance.
	 *
	 * @ignore
	 * @return Instance of pdfmake
	 */
	public getPdfmake(): Promise<any> {
		if (pdfmakePromise === undefined) {
			pdfmakePromise = _pdfmake();
		}

		return pdfmakePromise;
	}

	/**
	 * @ignore
	 */
	public getPageSizeFit(pageSize: pageSizes, margins: number | number[], extraMargin: number = 0, orientation: "landscape" | "portrait" = "portrait"): number[] {

		// Check margins
		let newMargins = [0, 0, 0, 0];
		if ($type.isNumber(margins)) {
			newMargins = [margins, margins, margins, margins];
		}
		else if (margins.length == 2) {
			newMargins = [margins[0], margins[1], margins[0], margins[1]];
		}
		else if (margins.length == 4) {
			newMargins = margins;
		}

		// Define available page sizes
		let sizes = {
			"4A0": [4767.87, 6740.79],
			"2A0": [3370.39, 4767.87],
			A0: [2383.94, 3370.39],
			A1: [1683.78, 2383.94],
			A2: [1190.55, 1683.78],
			A3: [841.89, 1190.55],
			A4: [595.28, 841.89],
			A5: [419.53, 595.28],
			A6: [297.64, 419.53],
			A7: [209.76, 297.64],
			A8: [147.40, 209.76],
			A9: [104.88, 147.40],
			A10: [73.70, 104.88],
			B0: [2834.65, 4008.19],
			B1: [2004.09, 2834.65],
			B2: [1417.32, 2004.09],
			B3: [1000.63, 1417.32],
			B4: [708.66, 1000.63],
			B5: [498.90, 708.66],
			B6: [354.33, 498.90],
			B7: [249.45, 354.33],
			B8: [175.75, 249.45],
			B9: [124.72, 175.75],
			B10: [87.87, 124.72],
			C0: [2599.37, 3676.54],
			C1: [1836.85, 2599.37],
			C2: [1298.27, 1836.85],
			C3: [918.43, 1298.27],
			C4: [649.13, 918.43],
			C5: [459.21, 649.13],
			C6: [323.15, 459.21],
			C7: [229.61, 323.15],
			C8: [161.57, 229.61],
			C9: [113.39, 161.57],
			C10: [79.37, 113.39],
			RA0: [2437.80, 3458.27],
			RA1: [1729.13, 2437.80],
			RA2: [1218.90, 1729.13],
			RA3: [864.57, 1218.90],
			RA4: [609.45, 864.57],
			SRA0: [2551.18, 3628.35],
			SRA1: [1814.17, 2551.18],
			SRA2: [1275.59, 1814.17],
			SRA3: [907.09, 1275.59],
			SRA4: [637.80, 907.09],
			EXECUTIVE: [521.86, 756.00],
			FOLIO: [612.00, 936.00],
			LEGAL: [612.00, 1008.00],
			LETTER: [612.00, 792.00],
			TABLOID: [792.00, 1224.00]
		};

		// Calculate size
		let fitSize = sizes[pageSize];
		if (orientation == "landscape") {
			fitSize.reverse();
		}
		fitSize[0] -= newMargins[0] + newMargins[2];
		fitSize[1] -= newMargins[1] + newMargins[3] + extraMargin;
		return fitSize;
	}

	/**
	 * ==========================================================================
	 * Data
	 * ==========================================================================
	 */

	/**
		* Checks whether `dataSource` is a non-empty array.
		*
		* @return Has data?
		*/
	public hasData(): boolean {
		const dataSource = this.get("dataSource");
		return $type.isArray(dataSource) && dataSource.length ? true : false;
	}

	/**
	 * Returns the data prepared for export: only the `dataFields`, if set,
	 * with values formatted per the format's options.
	 *
	 * @param   format         Format
	 * @param   customOptions  Format options
	 * @param   renameFields   Use the column names from `dataFields` as keys
	 * @return                 Processed data
	 */
	public getData(format: ExportingFormats, customOptions?: IExportingDataOptions, renameFields: boolean = false): any {
		const options: any = this._getFormatOptions(format, customOptions);
		const dataSource = this.get("dataSource", []);
		let data: any = dataSource;

		// Re-generate the data based on data fields if set
		const dataFields = this.get("dataFields");
		if (dataFields && $type.isArray(dataSource)) {
			data = [];
			$array.each(dataSource, (row) => {
				if ($type.isObject(row)) {
					const newRow: any = {}
					$object.each(dataFields, (field, value) => {
						if (dataFields![field] != null) {
							newRow[renameFields ? value : field] = this.convertToSpecialFormat(field, row[field], options);
						}
					});
					data.push(newRow);
				}
			});
		}

		const event: any = {
			type: "dataprocessed",
			format: format,
			options: options,
			data: data,
			target: this
		};

		this.events.dispatch("dataprocessed", event);

		return event.data;
	}

	/**
	 * @ignore
	 */
	public getDataFields(data: any): { [index: string]: string } {
		let dataFields = this.get("dataFields");
		if (!dataFields) {
			dataFields = {};
			if ($type.isArray(data) && data.length) {
				$array.each(data, (row) => {
					$object.each(row, (key, _value) => {
						if (dataFields![key] == null) {
							dataFields![key] = key;
						}
					});
				});
			}
		}
		return dataFields!;
	}

	/**
	 * @ignore
	 */
	public convertEmptyValue(_field: string, value: any, options: IExportingDataOptions): any {
		return value != null ? value : options.emptyAs;
	}

	/**
	 * @ignore
	 */
	public convertToSpecialFormat(field: any, value: any, options: IExportingDataOptions, keepOriginal?: boolean): any {

		// Is this a timestamp or duration?
		if (typeof value == "number") {
			if (this.isDateField(field)) {
				value = new Date(value);
			}
			else if (this.isNumericField(field) && this.get("numberFormat")) {
				return this._root.numberFormatter.format(value, this.get("numberFormat"));
			}
			else if (this.isDurationField(field)) {
				return this._root.durationFormatter.format(value, this.get("durationFormat"), this.get("durationUnit"));
			}
		}

		if (value instanceof Date) {
			if (options.useTimestamps) {
				value = value.getTime();
			}
			else if (options.useLocale) {
				if (!keepOriginal) {
					value = value.toLocaleString();
				}
			}
			else {
				value = this._root.dateFormatter.format(value, this.get("dateFormat"));
			}
		}

		return value;
	}

	/**
	 * If `value` is a string that begins with a character a spreadsheet
	 * application could treat as the start of a formula, prefixes it with a
	 * single quote so it is imported as plain text. This mitigates spreadsheet
	 * formula injection ("CSV injection") attacks via untrusted cell data.
	 *
	 * Non-string values (numbers, dates) are returned unchanged, so legitimate
	 * signed numbers are not affected.
	 *
	 * @ignore
	 */
	public escapeFormulas(value: any): any {
		if (typeof value == "string" && value.length > 0 && formulaInjectionChars.indexOf(value.charAt(0)) !== -1) {
			return "'" + value;
		}
		return value;
	}

	/**
	 * @ignore
	 */
	public isDateField(field: string): boolean {
		return this.get("dateFields")!.indexOf(field) !== -1;
	}

	/**
	 * @ignore
	 */
	public isNumericField(field: string): boolean {
		return this.get("numericFields")!.indexOf(field) !== -1;
	}

	/**
	 * @ignore
	 */
	public isDurationField(field: string): boolean {
		return this.get("durationFields")!.indexOf(field) !== -1;
	}

	/**
	 * @ignore
	 */
	public getContentType(type: ExportingFormats): string {
		let contentType = "";
		switch (type) {
			case "png":
				contentType = "image/" + type;
				break;
			case "jpg":
				contentType = "image/jpeg";
				break;
			case "svg":
				contentType = "image/svg+xml";
				break;
			case "csv":
				contentType = "text/csv";
				break;
			case "json":
				contentType = "application/json";
				break;
			case "html":
				contentType = "text/html";
				break;
			case "pdf":
			case "pdfdata":
				contentType = "application/pdf";
				break;
			case "xlsx":
				contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
				break;
			default:
				contentType = "application/octet-stream";
		}

		return contentType;
	}

	protected getDisposableCanvas(): HTMLCanvasElement {
		let canvas = document.createElement("canvas");
		canvas.style.position = "fixed";
		canvas.style.top = "-10000px";
		this._root.dom.appendChild(canvas);
		return canvas;
	}

	protected disposeCanvas(canvas: HTMLCanvasElement): void {
		this._root.dom.removeChild(canvas);
	}


	/**
	 * @ignore
	 */
	public findBackgroundColor(element: Element): Color {

		// Check if element has styles set
		let opacity = 1;
		let currentColor = getComputedStyle(element, "background-color").getPropertyValue("background-color");

		// Check opacity
		if (currentColor.match(/[^,]*,[^,]*,[^,]*,[ ]?0/) || currentColor == "transparent") {
			opacity = 0;
		}

		if (opacity == 0) {
			let parent = element.parentElement;// || <Element>element.parentNode;

			// Completely transparent. Look for a parent
			if (parent) {
				return this.findBackgroundColor(parent);
			}
			else {
				return Color.fromHex(0xffffff);
			}
		}
		else {
			return Color.fromCSS(currentColor);
		}

	}

	/**
	 * Downloads a data URI as a file.
	 *
	 * @param   uri       Data URI with the file's content
	 * @param   fileName  File name
	 * @param   addBOM    Start the file with a byte order mark
	 * @return            `false` if the content could not be decoded
	 */
	public streamFile(uri: string, fileName: string, addBOM: boolean = false): boolean {

		if (this.blobDownloadSupport()) {

			/**
			 * Supports Blob object.
			 * Use it.
			 */
			let link = document.createElement("a");
			link.download = fileName;
			document.body.appendChild(link);

			// Extract content type and get pure data without headers
			let parts = uri.split(";");
			let contentType = parts!.shift()!.replace(/data:/, "");

			uri = decodeURIComponent(parts.join(";").replace(/^[^,]*,/, ""));

			if (["image/svg+xml", "application/json", "text/csv", "text/html"].indexOf(contentType) == -1) {
				try {
					let decoded = atob(uri);
					uri = decoded;
				} catch (e) {
					// Error occurred, meaning string was not Base64-encoded. Do nothing.
					return false;
				}
			}
			else {
				if (addBOM) {
					uri = "\ufeff" + uri;
				}
				let blob = new Blob([uri], { type: contentType });
				let url = window.URL.createObjectURL(blob);
				link.href = url;
				link.download = fileName;
				link.click();
				setTimeout(() => {
					document.body.removeChild(link);
					window.URL.revokeObjectURL(url);
				}, 100);
				return true;
			}

			// Dissect uri into array
			let chars = new Array(uri.length);
			for (let i = 0; i < uri.length; ++i) {
				let charCode = uri.charCodeAt(i);
				chars[i] = charCode;
			}

			if (addBOM) {
				chars = [0xEF, 0xBB, 0xBF].concat(chars);
			}
			let blob = new Blob([new Uint8Array(chars)], { type: contentType });
			let url = window.URL.createObjectURL(blob);
			link.href = url;
			link.download = fileName;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			setTimeout(() => {
				window.URL.revokeObjectURL(url);
			}, 100);

		}

		else if (this.linkDownloadSupport()) {

			/**
			 * For regular browsers, we create a link then simulate a click on it
			 */

			let link = document.createElement("a");
			link.download = fileName;
			link.href = uri;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);

		}
		else {

			/**
			 * Something else - perhaps a mobile.
			 * Let's just display it in the same page.
			 * (hey we don't like it either)
			 */
			window.location.href = uri;
		}

		return true;

	}

	/**
	 * @ignore
	 */
	public downloadSupport(): boolean {
		return this.linkDownloadSupport();
	}

	/**
	 * @ignore
	 */
	public linkDownloadSupport(): boolean {
		let a = document.createElement("a");
		let res = typeof a.download !== "undefined";
		return res;
	}

	/**
	 * @ignore
	 */
	public blobDownloadSupport(): boolean {
		return window.Blob != null;
	}


	/**
	 * ==========================================================================
	 * Print
	 * ==========================================================================
	 */

	/**
	 * Prints an image, given as a data URI.
	 *
	 * @param   data           Data URI of the image
	 * @param   customOptions  Print options, over `printOptions`
	 * @param   title          Title for the printed page; the page's own title if not given
	 */
	public initiatePrint(data: string, customOptions?: IExportingPrintOptions, title?: string): void {
		const options = <IExportingPrintOptions>this._getFormatOptions("print", customOptions);
		if (options.printMethod == "css") {
			this._printViaCSS(data, options, title);
		}
		else {
			this._printViaIframe(data, options, title);
		}

	}

	protected _printViaCSS(data: string, customOptions?: IExportingPrintOptions, title?: string): void {
		const options = <IExportingPrintOptions>this._getFormatOptions("print", customOptions);
		let delay = options.delay || 500;

		//Save current scroll position
		let scroll = document.documentElement.scrollTop || document.body.scrollTop;

		// Hide all document nodes by applying custom CSS
		let rule = new StyleRule($utils.getShadowRoot(this._root.dom), "body > *", {
			"display": "none",
			"position": "fixed",
			"visibility": "hidden",
			"opacity": "0",
			"clipPath": "polygon(0px 0px,0px 0px,0px 0px,0px 0px);"
		}, this._root.nonce);

		let rule2 = new StyleRule($utils.getShadowRoot(this._root.dom), "body", {
			"padding": "0",
			"margin": "0"
		}, this._root.nonce);

		// Replace title?
		let originalTitle: string;
		if (title && document && document.title) {
			originalTitle = document.title;
			document.title = title;
		}

		// Create and add exported image
		let img = new Image();
		img.src = data;
		img.style.maxWidth = "100%";
		img.style.display = "block";
		img.style.position = "relative";
		img.style.visibility = "visible";
		img.style.opacity = "1";
		img.style.clipPath = "none";
		document.body.appendChild(img);

		// Print
		this.setTimeout(() => {
			(<any>window).print();
		}, 50);

		// Delay needs to be at least a second for iOS devices
		let isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(<any>window).MSStream;
		if (isIOS && (delay < 1000)) {
			delay = 1000;
		}
		else if (delay < 100) {
			delay = 100;
		}

		// Delay function that resets back the document the way ot was before
		this.setTimeout(() => {

			// Remove image
			document.body.removeChild(img);

			// Reset back all elements
			rule.dispose();
			rule2.dispose();

			// Restore title
			if (originalTitle) {
				document.title = originalTitle;
			}

			// Scroll back the document the way it was before
			document.documentElement.scrollTop = document.body.scrollTop = scroll;

		}, delay || 500);

	}

	protected _printViaIframe(data: string, customOptions?: IExportingPrintOptions, title?: string): void {
		const options = <IExportingPrintOptions>this._getFormatOptions("print", customOptions);
		let delay = options.delay || 500;

		// Create an iframe
		const iframe = document.createElement("iframe");
		iframe.style.visibility = "hidden";
		document.body.appendChild(iframe);

		// This is needed for FireFox
		iframe.contentWindow!.document.open();
		iframe.contentWindow!.document.close();

		// Create and add exported image
		let img = new Image();
		img.src = data;
		img.style.maxWidth = "100%";
		img.style.height = "auto";
		if (title) {
			iframe.contentWindow!.document.title = title;
		}
		iframe.contentWindow!.document.body.appendChild(img);

		(<any>iframe).load = function () {
			iframe.contentWindow!.document.body.appendChild(img);
		};

		// Print
		this.setTimeout(() => {
			try {
				if (!(<any>iframe).contentWindow.document.execCommand("print", false, null)) {
					(<any>iframe).contentWindow.print();
				}
			} catch (e) {
				(<any>iframe).contentWindow.print();
			}
		}, delay || 50);

		// Delay needs to be at least a second for iOS devices
		let isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(<any>window).MSStream;
		if (isIOS && (delay < 1000)) {
			delay = 1000;
		}
		else if (delay < 100) {
			delay = 100;
		}

		// Delay function that resets back the document the way ot was before
		this.setTimeout(() => {

			// Remove image
			document.body.removeChild(iframe);

		}, delay + 50 || 100);

	}

	/**
	 * Returns the formats that can be exported: all that are not `disabled`,
	 * but the data formats only when there is data and the browser can
	 * download files.
	 *
	 * @return Formats
	 */
	public supportedFormats(): ExportingFormats[] {
		const res: ExportingFormats[] = [];
		const hasData = this.hasData();
		const downloadSupport = this.downloadSupport();
		$array.each(<ExportingFormats[]>["png", "jpg", "svg", "canvas", "pdf", "xlsx", "csv", "json", "html", "pdfdata", "print"], (format) => {
			const options = this._getFormatOptions(format);
			if (options.disabled !== true) {
				if (["xlsx", "csv", "json", "html", "pdfdata"].indexOf(format) == -1 || (hasData && downloadSupport)) {
					res.push(<ExportingFormats>format);
				}
			}
		});
		return res;
	}

	/**
	 * Returns the export types available: `"image"` and `"print"`, and
	 * `"data"` when there is data and the browser can download files.
	 *
	 * @return Supported types
	 */
	public supportedExportTypes(): ExportingTypes[] {
		const res: ExportingTypes[] = ["image", "print"];
		if (this.downloadSupport() && this.hasData()) {
			res.push("data");
		}
		return res;
	}

}

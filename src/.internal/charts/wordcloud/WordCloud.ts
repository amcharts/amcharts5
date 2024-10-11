import type { DataItem } from "../../core/render/Component";
import type { CanvasLayer } from "../../core/render/backend/CanvasRenderer";
import type { ColorSet } from "../../core/util/ColorSet";
import type { Percent } from "../../core/util/Percent";
import type { IPoint } from "../../core/util/IPoint";
import type { IDisposer } from "../../core/util/Disposer";
import type { Time } from "../../core/util/Animation";

import { WordCloudDefaultTheme } from "./WordCloudDefaultTheme";
import { Series, ISeriesSettings, ISeriesDataItem, ISeriesPrivate } from "../../core/render/Series";
import { Template } from "../../core/util/Template";
import { Label } from "../../core/render/Label";
import { Container } from "../../core/render/Container";
import { ListTemplate } from "../../core/util/List";
import { Color } from "../../core/util/Color";
import type { IBounds } from "../../core/util/IBounds";

import * as $utils from "../../core/util/Utils";
import * as $array from "../../core/util/Array";
import * as $math from "../../core/util/Math";
import * as $type from "../../core/util/Type";

export interface IWordCloudDataItem extends ISeriesDataItem {

	/**
	 * Category.
	 */
	category: string;

	/**
	 * Label.
	 */
	label: Label;

	/**
	 * Label.
	 */
	ghostLabel: Label;

	/**
	 * Fill color used for the slice and related elements, e.g. legend marker.
	 */
	fill: Color;

	/**
	 * @ignore
	 */
	set: number;

	/**
	 * @ignore
	 */
	angle: number;

	/**
	 * @ignore
	 */
	fontSize: number;
}

export interface IWordCloudSettings extends ISeriesSettings {

	/**
	 * Duration of word animation when chart resizes.
	 */
	animationDuration?: number;

	/**
	 * An easing function to use for word animations.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/animations/#Easing_functions} for more info
	 * @default am5.ease.out($ease.cubic)
	 */
	animationEasing?: (t: Time) => Time;

	/**
	 * @default false
	 */
	autoFit?: boolean;

	/**
	 * Progress of current word layout animation. (0-1)
	 *
	 * @readonly
	 */
	progress?: number;

	/**
	 * A [[ColorSet]] to use when asigning colors for slices.
	 */
	colors?: ColorSet;

	/**
	 * A field in data that holds category names.
	 */
	categoryField?: string;

	/**
	 * A field that holds color for label fill.
	 */
	fillField?: string;

	/**
	 * Source text from which words are extracted.
	 */
	text?: string;

	/**
	 * Absolute or relative font size for the smallest words.
	 */
	minFontSize?: number | Percent;

	/**
	 * Absolute or relative font size for the biggest words.
	 */
	maxFontSize?: number | Percent;

	/**
	 * Minimum occurances for a word to be included into cloud.
	 */
	minValue?: number;

	/**
	 * Maximum number of words to show.
	 */
	maxCount?: number;

	/**
	 * Array of words  exclude from cloud.
	 */
	excludeWords?: Array<string>;

	/**
	 * Randomness of word placement (0-1).
	 */
	randomness?: number;

	/**
	 * Minimum number of characters for a word to be included in the cloud.
	 */
	minWordLength?: number;

	/**
	 * An array of possible rotation angles for words.
	 */
	angles?: number[];

	/**
	 * Step for next word placement.
	 */
	step?: number;
}

export interface IWordCloudPrivate extends ISeriesPrivate {

	/**
	 * Indicates whether size of the font was adjusted for better fit.
	 */
	adjustedFontSize: number;

}

/**
 * Creates a [[WordlCloud]] series.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/word-cloud/} for more info
 * @important
 */
export class WordCloud extends Series {

	public static className: string = "WordCloud";
	public static classNames: Array<string> = Series.classNames.concat([WordCloud.className]);

	declare public _settings: IWordCloudSettings;
	declare public _privateSettings: IWordCloudPrivate;
	declare public _dataItemSettings: IWordCloudDataItem;

	protected _currentIndex: number = 0;
	protected _timeoutDP?: IDisposer;

	protected _ghostContainer = this.children.push(Container.new(this._root, { layer: 99, opacity: 0.01 }))

	protected _pointSets: Array<Array<IPoint>> = [];
	protected _sets: number = 3;

	protected _process = false;

	protected _buffer: Array<number> = [];

	protected _boundsToAdd?: IBounds;

	protected _afterNew() {
		this._defaultThemes.push(WordCloudDefaultTheme.new(this._root));

		this.fields.push("category", "fill");
		this._setDefault("valueField", "value");
		this._setDefault("categoryField", "category");
		this._setDefault("fillField", "fill");

		super._afterNew();

		this._root.events.on("frameended", () => {
			this.set("progress", this._currentIndex / this.dataItems.length);
		})
	}


	/**
	 * A [[ListTemplate]] of all labels in series.
	 *
	 * `labels.template` can also be used to configure labels.
	 */
	public readonly labels: ListTemplate<Label> = this.addDisposer(this._makeLabels());

	/**
	 * @ignore
	 */
	public makeLabel(dataItem: DataItem<this["_dataItemSettings"]>): Label {
		const label = this.children.push(this.labels.make());
		label._setDataItem(dataItem);
		const fill = dataItem.get("fill");
		if (fill != null) {
			label.set("fill", fill);
		}
		label.set("x", -999999); // do not change!

		dataItem.set("label", label);
		this.labels.push(label);

		const ghostLabel = this._ghostContainer.children.push(this.labels.make());
		ghostLabel._setDataItem(dataItem);
		ghostLabel.setAll({ fill: Color.fromHex(0x000000), fontWeight: "900" });
		dataItem.set("ghostLabel", ghostLabel);
		this.labels.push(ghostLabel);

		return label;
	}

	protected _makeLabels(): ListTemplate<Label> {
		return new ListTemplate(
			Template.new({}),
			() => Label._new(this._root, {
				themeTags: $utils.mergeTags(this.labels.template.get("themeTags", []), ["wordcloud", "series"])
			}, [this.labels.template]),
		);
	}


	protected processDataItem(dataItem: DataItem<this["_dataItemSettings"]>) {
		super.processDataItem(dataItem);


		if (dataItem.get("fill") == null) {
			let colors = this.get("colors");
			if (colors) {
				dataItem.setRaw("fill", colors.next());
			}
		}

		this.makeLabel(dataItem);
	}

	public _prepareChildren() {
		super._prepareChildren();

		if (this.isDirty("text")) {
			this.data.setAll(this._getWords(this.get("text")));
			this._dirty["text"] = false;
		}
	}

	public _updateChildren() {
		super._updateChildren();

		const resolution = this._root._renderer.resolution;
		const cols = Math.round(this._root.width() * resolution);
		//const rows = Math.round(this._root.height() * resolution);
		let step = this.get("step", 1) * 2;

		if (this._valuesDirty || this._sizeDirty || this.isPrivateDirty("adjustedFontSize")) {
			const adjustedFontSize = this.getPrivate("adjustedFontSize", 1);

			const w = this.innerWidth();
			const h = this.innerHeight();

			const smaller = Math.min(w, h);
			const bigger = Math.max(w, h);

			this._buffer = Array(Math.ceil(this._root.width() * this._root.height() * resolution * resolution)).fill(0);

			if (smaller < 800) {
				step = step / 2;
			}

			this._ghostContainer._display.clear();
			this._pointSets = [];

			for (let i = 0; i < this._sets; i++) {
				// bigger step at the beginning
				const setStep = step * (this._sets - i);
				const points = $math.spiralPoints(w / 2, h / 2, w, h, 0, setStep * h / bigger, setStep * w / bigger, 0, 0)

				// generated more points and remove those out of bounds
				for (let i = points.length - 1; i >= 0; i--) {
					let point = points[i];

					if (point.x < 0 || point.x > w || point.y < 0 || point.y > h) {
						points.splice(i, 1);
						continue;
					}
				}
				this._pointSets.push(points);
			}

			let sum = 0;
			let absSum = 0;
			let valueHigh = 0;
			let valueLow = Infinity;
			let count = 0;
			$array.each(this._dataItems, (dataItem) => {
				const valueWorking = dataItem.get("valueWorking", 0);
				sum += valueWorking;
				absSum += Math.abs(valueWorking);
			});

			this._dataItems.sort((a, b) => {
				let aValue = a.get("value", 0);
				let bValue = b.get("value", 0);

				if (aValue > bValue) {
					return -1;
				}
				if (aValue < bValue) {
					return 1;
				}
				return 0;

			})

			$array.each(this._dataItems, (dataItem) => {

				const value = dataItem.get("valueWorking", 0);

				if (value >= absSum) {
					sum = dataItem.get("value", 0);
				}

				if (value > valueHigh) {
					valueHigh = value;
				}

				if (value < valueLow) {
					valueLow = value;
				}

				count++;
			});

			this.setPrivateRaw("valueLow", valueLow);
			this.setPrivateRaw("valueHigh", valueHigh);
			this.setPrivateRaw("valueSum", sum);
			this.setPrivateRaw("valueAverage", sum / count);
			this.setPrivateRaw("valueAbsoluteSum", absSum);

			const smallerSize = Math.min(w, h);
			const minFontSize = $utils.relativeToValue(this.get("minFontSize", 10), smallerSize) * adjustedFontSize;
			const maxFontSize = $utils.relativeToValue(this.get("maxFontSize", 100), smallerSize) * adjustedFontSize;

			const angles = this.get("angles", [0]);

			$array.each(this._dataItems, (dataItem) => {
				const value = dataItem.get("valueWorking", 0);
				const ghostLabel = dataItem.get("ghostLabel");
				let fontSize = minFontSize + (maxFontSize - minFontSize) * (value - valueLow) / (valueHigh - valueLow);
				if ($type.isNaN(fontSize)) {
					fontSize = maxFontSize;
				}

				const set = this._sets - 1 - Math.floor((fontSize - minFontSize) / (maxFontSize - minFontSize) * (this._sets - 1));

				dataItem.setRaw("set", set);
				dataItem.setRaw("fontSize", fontSize);

				let angle = angles[Math.floor(Math.random() * (angles.length))];

				dataItem.setRaw("angle", angle);

				ghostLabel.setAll({ fontSize: fontSize, rotation: angle, x: -10000 });
			})

			this._process = false;
			this._currentIndex = 0;

			this._root.events.once("frameended", () => {
				this.setTimeout(() => {
					this._process = true;
					this._markDirtyKey("progress");
				}, 50)
			})
		}

		const boundsToAdd = this._boundsToAdd;
		if (boundsToAdd) {
			const context = (this._ghostContainer._display.getLayer() as CanvasLayer).context;
			const y = Math.round(boundsToAdd.top);
			const x = Math.round(boundsToAdd.left);
			const w = Math.round(boundsToAdd.right - boundsToAdd.left);
			const h = Math.round(boundsToAdd.bottom - boundsToAdd.top);

			const imageData = context.getImageData(x, y, w, h).data;
			const buffer = this._buffer;

			let n = 3;
			for (let r = y; r < y + h; r++) {
				for (let c = x; c < x + w; c++) {
					let i = ((r + 1) * cols - (cols - c));
					if (imageData[n] != 0) {
						buffer[i] = 1;
					}
					n += 4;
				}
			}
			this._boundsToAdd = undefined;
		}

		if (this._process && this.isDirty("progress")) {
			this._processItem();
		}
	}

	protected _processItem() {
		this._boundsToAdd = undefined;

		if (this._currentIndex < this.dataItems.length) {
			const dataItem = this.dataItems[this._currentIndex];
			const label = dataItem.get("label");
			const ghostLabel = dataItem.get("ghostLabel");

			const resolution = this._root._renderer.resolution;

			let lw = ghostLabel.width();
			let lh = ghostLabel.height();

			const context = (ghostLabel._display.getLayer() as CanvasLayer).context;
			const set = dataItem.get("set");

			const points = this._pointSets[set];

			const w = this.innerWidth();
			const h = this.innerHeight();

			const cols = Math.round(this._root.width() * resolution);

			const x = this.x();
			const y = this.y();

			const angles = this.get("angles", [0]);
			if (w > h) {
				if (lw >= w / 2) {
					$array.each(angles, (angle) => {
						if (angle == 0 && dataItem.get("angle") != 0) {
							dataItem.setRaw("angle", 0);
							ghostLabel.set("rotation", 0);
							[lw, lh] = [lh, lw];
						}
					})
				}
			}

			if (h > w) {
				if (lw >= w / 2) {
					$array.each(angles, (angle) => {
						if (Math.abs(angle) == 90 && dataItem.get("angle") == 0) {
							dataItem.setRaw("angle", angle);
							ghostLabel.set("rotation", angle);
							[lw, lh] = [lh, lw];
						}
					})
				}
			}

			const rw = Math.ceil(lw * resolution);
			const rh = Math.ceil(lh * resolution);

			if (context && lw > 0 && lh > 0) {
				let pIndex = Math.round(Math.random() * points.length * this.get("randomness", 0));

				let intersects = true;

				while (intersects) {

					let p = points[pIndex];
					if (p) {
						intersects = false;

						if (this._currentIndex > 0) {
							let cx = Math.round((p.x + x) * resolution - rw / 2);
							let cy = Math.round((p.y + y) * resolution - rh / 2);
							intersects = this._hasColor(cx, cy, rw, rh, cols);
						}

						if (p.x - lw / 2 < 0 || p.x + lw / 2 > w || p.y - lh / 2 < 0 || p.y + lh / 2 > h) {
							pIndex++;
							intersects = true;
						}
						else {
							if (!intersects) {
								const angle = dataItem.get("angle", 0);
								const fontSize = dataItem.get("fontSize", 0);
								if (label.get("x") != -999999) {
									label.animate({ key: "x", to: p.x, duration: this.get("animationDuration", 0), easing: this.get("animationEasing") })
									label.animate({ key: "y", to: p.y, duration: this.get("animationDuration", 0), easing: this.get("animationEasing") })
									label.animate({ key: "rotation", to: angle, duration: this.get("animationDuration", 0), easing: this.get("animationEasing") })
									label.animate({ key: "fontSize", to: fontSize, duration: this.get("animationDuration", 0), easing: this.get("animationEasing") })
								}
								else {
									label.setAll({ x: p.x, y: p.y, rotation: angle, fontSize: fontSize });
									label.appear();
								}

								ghostLabel.setAll({ x: p.x, y: p.y });

								for (let i = points.length - 1; i >= 0; i--) {
									let point = points[i]
									if (point.x >= p.x - lw / 2 && point.x <= p.x + lw / 2 && point.y >= p.y - lh / 2 && point.y <= p.y + lh / 2) {
										points.splice(i, 1);
									}
								}
								this._boundsToAdd = { left: (p.x + x - lw / 2) * resolution, right: (p.x + x + lw / 2) * resolution, top: (p.y + y - lh / 2) * resolution, bottom: (p.y + y + lh / 2) * resolution };
							}
							else {
								pIndex += 2;
							}
						}
					}
					else {
						if (this.get("autoFit")) {
							this.setTimeout(() => {
								this.setPrivate("adjustedFontSize", this.getPrivate("adjustedFontSize", 1) * 0.9);
							}, 50);
							return;
						}
						label.set("x", -999999);
						intersects = false;
					}
				}
			}

			this._currentIndex++;
		}
	}
	/**
* @ignore
*/
	public disposeDataItem(dataItem: DataItem<this["_dataItemSettings"]>) {
		super.disposeDataItem(dataItem);
		const label = dataItem.get("label");
		if (label) {
			this.labels.removeValue(label);
			label.dispose();
		}

		const ghostLabel = dataItem.get("ghostLabel");
		if (ghostLabel) {
			this.labels.removeValue(ghostLabel);
			ghostLabel.dispose();
		}
	}
	/**
* Extracts words and number of their appearances from a text.
*
* @ignore
* @param  input  Source text
*/
	protected _getWords(input?: string): Array<{ category: string, value: number }> {
		let words: Array<{ category: string, value: number }> = [];

		if (input) {
			const chars = "\u0041-\u005A\u0061-\u007A\u00AA\u00B5\u00BA\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376-\u0377\u037A-\u037D\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u0523\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0621-\u064A\u066E-\u066F\u0671-\u06D3\u06D5\u06E5-\u06E6\u06EE-\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4-\u07F5\u07FA\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0972\u097B-\u097F\u0985-\u098C\u098F-\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC-\u09DD\u09DF-\u09E1\u09F0-\u09F1\u0A05-\u0A0A\u0A0F-\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32-\u0A33\u0A35-\u0A36\u0A38-\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2-\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0-\u0AE1\u0B05-\u0B0C\u0B0F-\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32-\u0B33\u0B35-\u0B39\u0B3D\u0B5C-\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99-\u0B9A\u0B9C\u0B9E-\u0B9F\u0BA3-\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C33\u0C35-\u0C39\u0C3D\u0C58-\u0C59\u0C60-\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0-\u0CE1\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D28\u0D2A-\u0D39\u0D3D\u0D60-\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32-\u0E33\u0E40-\u0E46\u0E81-\u0E82\u0E84\u0E87-\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA-\u0EAB\u0EAD-\u0EB0\u0EB2-\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDD\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8B\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065-\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10D0-\u10FA\u10FC\u1100-\u1159\u115F-\u11A2\u11A8-\u11F9\u1200-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u1676\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F0\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u1900-\u191C\u1950-\u196D\u1970-\u1974\u1980-\u19A9\u19C1-\u19C7\u1A00-\u1A16\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE-\u1BAF\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u2094\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2C6F\u2C71-\u2C7D\u2C80-\u2CE4\u2D00-\u2D25\u2D30-\u2D65\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31B7\u31F0-\u31FF\u3400\u4DB5\u4E00\u9FC3\uA000-\uA48C\uA500-\uA60C\uA610-\uA61F\uA62A-\uA62B\uA640-\uA65F\uA662-\uA66E\uA67F-\uA697\uA717-\uA71F\uA722-\uA788\uA78B-\uA78C\uA7FB-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA90A-\uA925\uA930-\uA946\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAC00-\uD7A3\uF900-\uFA2D\uFA30-\uFA6A\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40-\uFB41\uFB43-\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC0-9@+";
			const reg = new RegExp("([" + chars + "]+[\-" + chars + "]*[" + chars + "]+)|([" + chars + "]+)", "ig");
			let res = input.match(reg);
			if (!res) {
				return [];
			}

			let word;
			while (true) {
				word = res.pop();

				if (!word) {
					break;
				}

				let item;
				for (let i = 0; i < words.length; i++) {
					if (words[i].category.toLowerCase() == word.toLowerCase()) {
						item = words[i];
						break;
					}
				}
				if (item) {
					item.value++;
					if (!this.isCapitalized(word)) {
						item.category = word;
					}
				}
				else {
					words.push({
						category: word,
						value: 1
					})
				}
			}

			let excludeWords = this.get("excludeWords");

			const minValue = this.get("minValue", 1);
			const minWordLength = this.get("minWordLength", 1);

			if (minValue > 1 || minWordLength > 1 || (excludeWords && excludeWords.length > 0)) {
				for (let i = words.length - 1; i >= 0; i--) {
					let w = words[i];
					let word = w.category;

					if (w.value < minValue) {
						words.splice(i, 1);
					}
					if (word.length < minWordLength) {
						words.splice(i, 1);
					}
					if (excludeWords && excludeWords.indexOf(word) !== -1) {
						words.splice(i, 1);
					}
				}
			}

			words.sort(function (a, b) {
				if (a.value == b.value) {
					return 0;
				}
				else if (a.value > b.value) {
					return -1;
				}
				else {
					return 1;
				}
			});

			const maxCount = this.get("maxCount", Infinity);
			if (words.length > maxCount) {
				words = words.slice(0, maxCount);
			}
		}

		return words;
	}
	/**
* Checks if word is capitalized (starts with an uppercase) or not.
*
* @ignore
* @param   word  Word
* @return        Capitalized?
*/
	public isCapitalized(word: string): boolean {
		let lword = word.toLowerCase();
		return word[0] != lword[0]
			&& word.substr(1) == lword.substr(1)
			&& word != lword;
	}

	protected _hasColor(x: number, y: number, w: number, h: number, cols: number): boolean {
		const buffer = this._buffer;
		if (buffer) {
			for (let r = y; r < y + h; r += 4) {
				for (let c = x; c < x + w; c += 4) {
					let i = ((r + 1) * cols - (cols - c));
					if (buffer[i] != 0) {
						return true;
					}
				}
			}
		}
		return false
	}
}

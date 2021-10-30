import { Entity, IEntitySettings, IEntityPrivate, IEntityEvents } from "./Entity"
import { Color } from "./Color"
import * as $type from "./Type"
import * as $object from "./Object"
import * as $array from "./Array"


export interface IDataProcessorSettings extends IEntitySettings {

	/**
	 * Date format used for parsing string-based dates.
	 */
	dateFormat?: string;

	/**
	 * A list of fields in data that need to be converted to tiemstamps.
	 */
	dateFields?: string[];

	/**
	 * A list of fields in data that need to be converted to numbers.
	 */
	numericFields?: string[];

	/**
	 * A list of fields in data that need to be converted to [[Color]] objects.
	 */
	colorFields?: string[];

	/**
	 * Replace empty values with this.
	 */
	emptyAs?: any;

}

export interface IDataProcessorPrivate extends IEntityPrivate {

	/**
	 * @ignore
	 */
	deepFields?: string[];
}

export interface IDataProcessorEvents extends IEntityEvents {
}

/**
 * A tool that can process the data before it is being used in charts.
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/data/#Pre_processing_data} for more info
 * @important
 */
export class DataProcessor extends Entity {
	declare public _settings: IDataProcessorSettings;
	declare public _privateSettings: IDataProcessorPrivate;

	protected _checkDates: boolean = false;
	protected _checkNumbers: boolean = false;
	protected _checkColors: boolean = false;
	protected _checkEmpty: boolean = false;
	protected _checkDeep: boolean = false;

	protected _afterNew() {
		super._afterNew();
		this._checkFeatures();
		this.on("dateFields", () => this._checkFeatures());
		this.on("dateFormat", () => this._checkFeatures());
		this.on("numericFields", () => this._checkFeatures());
		this.on("colorFields", () => this._checkFeatures());
		this.on("emptyAs", () => this._checkFeatures());
	}

	protected _checkFeatures(): void {
		if (this.isDirty("dateFields") || this.isDirty("dateFormat")) {
			this._checkDates = this.get("dateFields") && (this.get("dateFields")!.length > 0);
		}
		if (this.isDirty("numericFields")) {
			this._checkNumbers = this.get("numericFields") && (this.get("numericFields")!.length > 0);
		}
		if (this.isDirty("colorFields")) {
			this._checkColors = this.get("colorFields") && (this.get("colorFields")!.length > 0);
		}
		if (this.isDirty("emptyAs")) {
			this._checkEmpty = this.get("emptyAs") != null;
		}
		this._checkDeepFeatures();
	}

	protected _checkDeepFeatures(): void {
		const deepFields: string[] = [];
		$array.each(["dateFields", "numericFields", "colorFields"], (where: any) => {
			$array.each(this.get(where, []), (field) => {
				const steps = (<string>field).split(".");
				steps.pop();
				while (steps.length > 0) {
					deepFields.push(steps.join("."));
					steps.pop();
				}
			});
		})
		this._checkDeep = deepFields.length > 0;
		this.setPrivate("deepFields", deepFields);
	}

	/**
	 * Processess entire array of data.
	 *
	 * NOTE: calling this will modify original array!
	 */
	public processMany(data: { [index: string]: any }[]): void {
		if ($type.isArray(data) && (this._checkDates || this._checkNumbers || this._checkColors || this._checkEmpty)) {
			$array.each(data, (row) => {
				this.processRow(row);
			})
		}
	}

	/**
	 * Processes a row (object) of data.
	 * 
	 * NOTE: calling this will modify values of the original object!
	 */
	public processRow(row: { [index: string]: any }, prefix: string = ""): void {
		$object.each(row, (key: any, _value) => {
			const lookupKey: string = prefix + key;
			if (this._checkEmpty) {
				row[key] = this._maybeToEmpty(row[key]);
			}
			if (this._checkNumbers) {
				row[key] = this._maybeToNumber(lookupKey, row[key]);
			}
			if (this._checkDates) {
				row[key] = this._maybeToDate(lookupKey, row[key]);
			}
			if (this._checkColors) {
				row[key] = this._maybeToColor(lookupKey, row[key]);
			}
			if (this._checkDeep && (<any>this).getPrivate("deepFields", []).indexOf(lookupKey) !== -1 && $type.isObject(row[key])) {
				this.processRow(row[key], lookupKey + ".");
			}
		});
	}

	protected _maybeToNumber(field: string, value: any): any {
		if (this.get("numericFields")!.indexOf(field) !== -1) {
			return $type.toNumber(value);
		}
		return value;
	}

	protected _maybeToDate(field: string, value: any): any {
		if (this.get("dateFields")!.indexOf(field) !== -1) {
			return this._root.dateFormatter.parse(value, this.get("dateFormat", "")).getTime();
		}
		return value;
	}

	protected _maybeToEmpty(value: any): any {
		if ((value == null || value == "") && this.get("emptyAs") != null) {
			return this.get("emptyAs");
		}
		return value;
	}

	protected _maybeToColor(field: string, value: any): any {
		if (this.get("colorFields")!.indexOf(field) !== -1) {
			return Color.fromAny(value);
		}
		return value;
	}

}

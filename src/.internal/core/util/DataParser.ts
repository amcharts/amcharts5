import * as $type from "./Type"
import * as $object from "./Object"

export interface IJSONParserOptions {

	/**
	 * Reverse the order of parsed data.
	 */
	reverse?: boolean;

}

/**
 * Tool to parse JSON string into structured data.
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/data/#Parsing} for more info
 * @important
 */
export class JSONParser {

	/**
	 * Parses JSON string.
	 * 
	 * @param   input    JSON
	 * @param   options  Options
	 * @return           Data
	 */
	public static parse(input: string, options?: IJSONParserOptions): any {
		options = this._applyDefaults(options);
		try {
			if ($type.isString(input)) {
				let data  = JSON.parse(input);
				if (options.reverse && $type.isArray(data)) {
					data.reverse();
				}
				return data;
			}
			else if ($type.isArray(input) || $type.isObject(input)) {
				return input;
			}
			else {
				throw("Unable to parse JSON data");
			}
		} catch (e) {
			return undefined;
		}
	}

	protected static _applyDefaults(options?: IJSONParserOptions): IJSONParserOptions {
		const normalized: IJSONParserOptions = {};
		const defaults = {
			reverse: false
		};
		if (!options) {
			options = {};
		}
		$object.each(defaults, (key, val) => {
			normalized[key] = options![key] || val;
		});
		return normalized;
	}
}


export interface ICSVParserOptions {

	/**
	 * Delimiter used for columns.
	 * 
	 * @default ","
	 */
	delimiter?: string;

	/**
	 * Reverse the order of parsed data.
	 */
	reverse?: boolean;

	/**
	 * Skip first X rows.
	 *
	 * @default 0
	 */
	skipRows?: number;

	/**
	 * Skip empty rows.
	 *
	 * @default true
	 */
	skipEmpty?: boolean;

	/**
	 * Use the first row to name the columns.
	 * 
	 * @default false
	 */
	useColumnNames?: boolean;

}

/**
 * Tool to parse JSON string into structured data.
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/data/#Parsing} for more info
 * @important
 */
export class CSVParser {

	/**
	 * Parses CSV string.
	 * 
	 * @param   input    CSV
	 * @param   options  Options
	 * @return           Data
	 */
	public static parse(input: string, options?: ICSVParserOptions): any {
		options = this._applyDefaults(options);

		// Get CSV data as array
		let data = this.CSVToArray(input, options.delimiter!);

		// Init resuling array
		let res: any[] = [],
			cols: string[] = [],
			col: string,
			i: number;

		// Skip rows
		for (i = 0; i < options.skipRows!; i++) {
			data.shift();
		}

		// First row holds column names?
		if (options.useColumnNames) {
			cols = data.shift();

			// Normalize column names
			for (let x = 0; x < cols.length; x++) {
				// trim
				col = cols[x] != null ? cols[x].replace(/^\s+|\s+$/gm, "") : "";

				// Check for empty
				if ("" === col) {
					col = "col" + x;
				}

				cols[x] = col;
			}
		}

		// Iterate through the result set
		let row;
		while (true) {
			row = options.reverse ? data.pop() : data.shift();

			if (!row) {
				break;
			}

			if (options.skipEmpty && row.length === 1 && row[0] === "") {
				continue;
			}

			let dataPoint: any = {};
			for (i = 0; i < row.length; i++) {
				col = undefined === cols[i] ? "col" + i : cols[i];
				dataPoint[col] = row[i];
			}
			res.push(dataPoint);
		}

		return res;
	}

	/**
	 * @ignore
	 */
	public static CSVToArray(data: string, delimiter: string): any[] {

		// Check to see if the delimiter is defined. If not,
		// then default to comma.
		delimiter = (delimiter || ',');

		// Create a regular expression to parse the CSV values.
		let objPattern = new RegExp(
			(
				// Delimiters.
				"(\\" + delimiter + "|\\r?\\n|\\r|^)" +

				// Quoted fields.
				"(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

				// Standard fields.
				"([^\"\\" + delimiter + "\\r\\n]*))"
			),
			"gi"
		);


		// Create an array to hold our data. Give the array
		// a default empty first row.
		let arrData: any[] = [
			[]
		];

		// Create an array to hold our individual pattern
		// matching groups.
		let arrMatches = null;

		// Keep looping over the regular expression matches
		// until we can no longer find a match.
		while (true) {
			arrMatches = objPattern.exec(data);

			if (!arrMatches) {
				break;
			}

			// Get the delimiter that was found.
			let strMatchedDelimiter = arrMatches[1];

			// Check to see if the given delimiter has a length
			// (is not the start of string) and if it matches
			// field delimiter. If id does not, then we know
			// that this delimiter is a row delimiter.
			if (
				strMatchedDelimiter.length &&
				(strMatchedDelimiter !== delimiter)
			) {

				// Since we have reached a new row of data,
				// add an empty row to our data array.
				arrData.push([]);

			}

			// Now that we have our delimiter out of the way,
			// let's check to see which kind of value we
			// captured (quoted or unquoted).
			let strMatchedValue;
			if (arrMatches[2]) {

				// We found a quoted value. When we capture
				// this value, unescape any double quotes.
				strMatchedValue = arrMatches[2].replace(
					new RegExp("\"\"", "g"),
					"\""
				);

			} else {

				// We found a non-quoted value.
				strMatchedValue = arrMatches[3];

			}

			// Now that we have our value string, let's add
			// it to the data array.
			arrData[arrData.length - 1].push(strMatchedValue);
		}

		// Return the parsed data.
		return (arrData);
	}

	protected static _applyDefaults(options?: ICSVParserOptions): ICSVParserOptions {
		const normalized: ICSVParserOptions = {};
		const defaults = {
			delimiter: ",",
			reverse: false,
			skipRows: 0,
			skipEmpty: true,
			useColumnNames: false
		};
		if (!options) {
			options = {};
		}
		$object.each(defaults, (key, val) => {
			normalized[key] = options![key] || val;
		});
		return normalized;

	}

}
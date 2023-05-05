/** @ignore *//** */

import * as $type from "./Type";
import * as $utils from "./Utils";
import { Sprite } from "../render/Sprite";
import { TextFormatter } from "./TextFormatter";

/**
 * @ignore
 */
export function populateString(target: Sprite, string: string): string {
	if (string != null) {
		string = "" + string;
		string = TextFormatter.escape(string);
		let tags = string.match(/\{([^}]+)\}/g);
		let i;
		if (tags) {
			for (i = 0; i < tags.length; i++) {
				let tag = tags[i].replace(/\{([^}]+)\}/, "$1");
				let value = getTagValue(target, tag, "");

				if (value == null) {
					value = "";
				}

				string = string.split(tags[i]).join(value);
			}
		}
		string = TextFormatter.unescape(string);
	}
	else {
		string = "";
	}

	// TODO: apply adapter?
	return string;
}

/**
 * @ignore
 */
function getTagValue(target: Sprite, tagName: string, format?: string): string {
	let value: any;
	const dataItem = target.dataItem;

	// Parse parts
	let parts: any[] = [];
	let reg = /(format[a-zA-Z]*)\((.*)\)|([^.]+)/g;
	let matches;

	while (true) {
		matches = reg.exec(tagName);

		if (matches === null) {
			break;
		}

		if (matches[3]) {
			// Simple property
			parts.push({
				prop: matches[3]
			});

			// Check if maybe we should force a formatter on this value
			const dateFields = target.getDateFormatter().get("dateFields", []);
			const numericFields = target.getNumberFormatter().get("numericFields", []);
			const durationFields = target.getDurationFormatter().get("durationFields", []);
			if ((<any>dateFields).indexOf(matches[3]) !== -1) {
				parts.push({
					method: "formatDate",
					params: []
				});
			}
			else if ((<any>numericFields).indexOf(matches[3]) !== -1) {
				parts.push({
					method: "formatNumber",
					params: []
				});
			}
			else if ((<any>durationFields).indexOf(matches[3]) !== -1) {
				parts.push({
					method: "formatDuration",
					params: []
				});
			}
		}
		else {
			// Method
			// Parse parameters
			let params: any[] = [];
			if ($utils.trim(matches[2]) != "") {
				let reg2 = /'([^']*)'|"([^"]*)"|([0-9\-]+)/g;
				let matches2;

				while (true) {
					matches2 = reg2.exec(matches[2]);

					if (matches2 === null) {
						break;
					}

					params.push(matches2[1] || matches2[2] || matches2[3])
				}
			}
			parts.push({
				method: matches[1],
				params: params
			})
		}
	}

	// Check if we can retrieve the value from data item
	if (dataItem) {


		// Check values
		value = getTagValueFromObject(target, parts, dataItem._settings);

		// Check properties
		if (value == null || $type.isObject(value)) { // isObject helps to solve problem with date axis, as for example dateX will get dateX from values object and won't get to the dateX date.
			value = getTagValueFromObject(target, parts, dataItem);
		}

		// Check data context
		let dataContext: any = dataItem.dataContext;

		if (value == null && dataContext) {
			value = getTagValueFromObject(target, parts, dataContext);

			// Maybe it's a literal dot-separated name of the key in dataContext?
			if (value == null) {
				value = getTagValueFromObject(target, [{
					prop: tagName
				}], dataContext);
			}

			// scond data context level sometimes exist (tree map)
			if (value == null && dataContext.dataContext) {
				value = getTagValueFromObject(target, parts, dataContext.dataContext);
			}
		}

		// Check component's data item
		if (value == null && dataItem.component && dataItem.component.dataItem !== dataItem) {
			value = getTagValue(dataItem.component, tagName, format);
		}
	}

	// Check sprite's properties
	if (value == null) {
		value = getTagValueFromObject(target, parts, target);
	}

	// Finally, check the parent
	if (value == null && target.parent) {
		value = getTagValue(target.parent, tagName, format);
	}

	return value;
}

/**
 * @ignore
 */
function getCustomDataValue(target: Sprite, prop: string): any {
	const customData = target.getPrivate("customData");
	if ($type.isObject(customData)) {
		return (<any>customData)[prop];
	}
}

/**
 * @ignore
 */
export function getTagValueFromObject(target: Sprite, parts: any[], object: any, format?: string): any {
	let current: any = object;
	let formatApplied = false;
	for (let i = 0, len = parts.length; i < len; i++) {
		let part = parts[i];
		if (part.prop) {
			// Regular property
			if (current instanceof Sprite) {
				let tmp = current.get(part.prop);
				if (tmp == null) tmp = current.getPrivate(part.prop);
				if (tmp == null) tmp = getCustomDataValue(current, part.prop);
				if (tmp == null) tmp = (<any>current)[part.prop];
				current = tmp;
			}
			else if (current.get) {
				let tmp = current.get(part.prop);
				if (tmp == null) tmp = (<any>current)[part.prop];
				current = tmp;
			}
			else {
				current = current[part.prop];
			}

			if (current == null) {
				// Not set, return undefined
				return;
			}
		}
		else {
			// Method

			switch (part.method) {
				case "formatNumber":
					let numberValue = $type.toNumber(current);
					if (numberValue != null) {
						current = target.getNumberFormatter().format(
							numberValue,
							format || part.params[0] || undefined
						);
						formatApplied = true;
					}
					break;
				case "formatDate":
					let dateValue = $type.toDate(current);
					if (!$type.isDate(dateValue) || $type.isNaN(dateValue.getTime())) {
						// Was not able to get date out of value, quitting and letting
						// calling method try another value
						return;
					}
					if (dateValue != null) {
						current = target.getDateFormatter().format(
							dateValue,
							format || part.params[0] || undefined
						);
						formatApplied = true;
					}
					break;
				case "formatDuration":
					let durationValue = $type.toNumber(current);
					if (durationValue != null) {
						current = target.getDurationFormatter().format(
							durationValue,
							format || part.params[0] || undefined,
							part.params[1] || undefined
						);
						formatApplied = true;
					}
					break;
				case "urlEncode":
				case "encodeURIComponent":
					current = encodeURIComponent(current);
					break;
				default:
					if (current[part.method]) {
						current[part.method].apply(object, part.params);
					}
					break;
			}
		}
	}

	// Apply default format if it wasn't applied explicitly
	if (!formatApplied) {

		let formatParts = [{
			method: "",
			params: format
		}];

		if (format == null) {

			// Format is not set
			// Determine from the type of the value
			if ($type.isNumber(current)) {
				formatParts[0].method = "formatNumber";
				formatParts[0].params = "";
			}
			else if ($type.isDate(current)) {
				formatParts[0].method = "formatDate";
				formatParts[0].params = "";
			}

		}
		else {

			// Format set
			// Try to determine formatter based on the format
			let formatterType: string = $utils.getFormat(format);

			// format
			if (formatterType === "number") {
				formatParts[0].method = "formatNumber";
			}
			else if (formatterType === "date") {
				formatParts[0].method = "formatDate";
			}
			else if (formatterType === "duration") {
				formatParts[0].method = "formatDuration";
			}

		}

		// Apply format
		if (formatParts[0].method) {
			current = getTagValueFromObject(target, formatParts, current);
		}

	}

	return current;
}
const $path = require("path");
const { spawn, readFile, writeFile } = require("./util");

// Usage:
//
//   yarn generate:geojson <source> <name> [option=value ...]
//
//   <source>  Path to the source shape file (.shp) or GeoJSON (.json)
//   <name>    Output map name, relative to src/geodata (e.g. "france" or
//             "region/usa/alabama"). The Low/High/Ultra suffixes and the
//             ".ts" extension are appended automatically.
//
// Options (all optional, "key=value"):
//
//   low         Simplification percentage for the Low map     (default 0.3)
//   high        Simplification percentage for the High map    (default 0.8)
//   ultra       Simplification percentage for the Ultra map   (default 0.8,
//               pass ultra=no to skip generating the Ultra map)
//   precision   Coordinate precision                          (default 0.0001)
//   keepshapes  keepshapes=no to allow small shapes to be removed
//   dissolve    Dissolve features by the given field
//   id          Source field to use as the feature id         (default ID)
//   name        Source field to use as the feature name       (default NAME)
//   reverse     reverse=yes to reverse coordinate winding order
//   cleanprops  cleanprops=yes to strip all but the id property
//   proj        mapshaper -proj argument (default: match the source .prj)
//   prependid   String to prepend to every feature id (implies cleanprops)
//   filter      Keep only features whose property matches, as FIELD:VALUE
//               (e.g. filter=STATEABBR:FL keeps shapes where STATEABBR is "FL")

if (process.argv.length < 3) {
	throw new Error("No source shape file specified");
}

if (process.argv.length < 4) {
	throw new Error("No output map name specified");
}

const source = process.argv[2].replace(/\.[^.]*$/, "");
let ext = process.argv[2].replace(/^.*\./, "");
if (ext !== "json") {
	ext = "shp";
}
const name = process.argv[3].replace(/\.[^.]*$/, "");

// process arguments
let low = "0.3";
let high = "0.8";
let ultra = "0.8";
let precision = "0.0001";
let keepshapes = "keep-shapes";
let dissolve = "";
let idfield = "ID";
let namefield = "NAME";
let reverse = false;
let cleanprops = false;
let proj = "match=\"" + source + ".prj\"";
let prependid = "";
let filter = "";

for (let i = 4; i < process.argv.length; i++) {
	const arg = process.argv[i].split("=");
	switch (arg[0]) {
		case "low":
			low = arg[1];
			break;
		case "high":
			high = arg[1];
			break;
		case "ultra":
			ultra = (arg[1] === "no" ? "" : arg[1]);
			break;
		case "precision":
			precision = arg[1];
			break;
		case "keepshapes":
			if (arg[1] === "no") {
				keepshapes = "";
			}
			break;
		case "dissolve":
			dissolve = "-dissolve " + arg[1];
			break;
		case "id":
			idfield = arg[1];
			break;
		case "name":
			namefield = arg[1];
			break;
		case "reverse":
			reverse = true;
			break;
		case "cleanprops":
			cleanprops = true;
			break;
		case "proj":
			proj = arg[1];
			break;
		case "prependid":
			prependid = arg[1];
			break;
		case "filter": {
			const colon = arg[1].indexOf(":");
			const field = arg[1].slice(0, colon);
			const value = arg[1].slice(colon + 1);
			// Double quotes group the expression for the shell; single quotes
			// make the value a JS string literal for mapshaper. This survives
			// both cmd.exe (which would strip inner double quotes) and POSIX sh.
			// Loose equality so numeric fields match a string value too.
			filter = "-filter \"" + field + " == '" + value + "'\"";
			break;
		}
	}
}

const dest = $path.join(__dirname, "..", "src", "geodata", name);

async function processGeoJson(suffix, percentage) {
	const filename = dest + suffix + ".ts";
	console.log("=============================");
	console.log("Processing " + suffix + " at " + (percentage * 100) + "%");

	let params;
	if (ext === "json") {
		params = [
			"-i",
			"\"" + source + "." + ext + "\"",
			"-simplify",
			"percentage=" + percentage, keepshapes + " -rename-fields name=" + namefield + ",id=" + idfield + " -o",
			"\"" + filename + "\"",
			"precision=" + precision + " id-field=id format=geojson"
		];
	}
	else {
		params = [
			"-i",
			"\"" + source + "." + ext + "\"",
			"snap",
			" -proj " + proj,
			"-simplify",
			"percentage=" + percentage, keepshapes + " -rename-fields name=" + namefield + ",id=" + idfield + " -o",
			"\"" + filename + "\"",
			"precision=" + precision + " id-field=id format=geojson"
		];
	}

	if (filter) {
		// filter before -simplify (uses the original, pre-rename field names)
		params.splice(params.indexOf("-simplify"), 0, filter);
	}

	if (cleanprops) {
		if (prependid) {
			params.push("-each 'this.id = \"" + prependid + "\" + this.id; this.properties = { id: this.id }'");
		}
		else {
			params.push("-each 'this.properties = { id: this.id }'");
		}
	}

	if (dissolve) {
		params.push(dissolve);
	}

	await spawn("mapshaper", params, { shell: true });

	let data = await readFile(filename);

	if (reverse) {
		console.log("Reversing GeoJSON");
		const geojson = JSON.parse(data);
		processReverseGeodata(geojson);
		data = JSON.stringify(geojson);
	}

	await writeFile(filename, "const map: GeoJSON.FeatureCollection = " + data + ";\n\nexport default map;\n");
}


function processReverseGeodata(geodata) {
	for (let i = 0; i < geodata.features.length; i++) {
		const feature = geodata.features[i];
		for (let x = 0; x < feature.geometry.coordinates.length; x++) {
			if (feature.geometry.type === "MultiPolygon") {
				for (let y = 0; y < feature.geometry.coordinates[x].length; y++) {
					feature.geometry.coordinates[x][y].reverse();
				}
			}
			else {
				feature.geometry.coordinates[x].reverse();
			}
		}
	}
}


async function main() {
	console.log("=============================");
	console.log("Converting \"" + source + "\" to GeoJSON");

	await processGeoJson("Low", low);
	await processGeoJson("High", high);

	if (ultra) {
		await processGeoJson("Ultra", ultra);
	}
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});

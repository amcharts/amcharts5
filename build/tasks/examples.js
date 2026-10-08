const $path = require("path");
const { cp, rm, mkdir, readdir, readFile, writeFile, posixPath, exists, removeTypeScriptTypes } = require("../util");
const dependencies = require("../script-dependencies");


const geodata_message = `Map geodata could not be loaded. Please download the latest <a href=\\"https://www.amcharts.com/download/download-v5/\\">amcharts geodata</a> and extract its contents into the same directory as your amCharts files.`;


function showCSS(name, object) {
	const output = [];

	Object.keys(object).forEach((key) => {
		const value = object[key];

		if (value != null) {
			output.push(`
  ${key}: ${value};`);
		}
	});

	if (output.length) {
		return name + " {" + output.join("") + `
}`;

	} else {
		return name + "{}";
	}
}

function pageCSS(config) {
	return `${showCSS("body", config.body)}

${showCSS("#chartdiv", config.chartdiv)}` + (config.extraCSS == null ? "" : `

${config.extraCSS}`);
}

// Line by line, so that blank lines stay empty
function indent(text, spaces) {
	return text.split(`
`).map((line) => (line === "" ? "" : spaces + line)).join(`
`);
}

function lf(text) {
	return text.replace(/\r\n/g, `
`);
}


function replaceSubstitutions(template) {
	return template.replace(/%__GEODATA_MESSAGE__%/g, geodata_message);
}


async function mapFiles1(from, to, f) {
	const files = await readdir(from);

	if (files === null) {
		await f(from, to);

	} else {
		await mkdir(to);

		await Promise.all(files.map(async (file) => {
			await mapFiles1($path.join(from, file), $path.join(to, file), f);
		}));
	}
}

// TODO move this into utils
async function mapFiles(from, to, f) {
	if (await exists(from)) {
		await mapFiles1(from, to, f);
	}
}


async function processFiles(base, dir, f) {
	await mkdir(dir);

	await Promise.all([
		copyTemplateDir($path.join(base, "template"), dir),

		f($path.join(base, "index.ts"), $path.join(dir, "index.ts")),

		mapFiles($path.join(base, "src"), $path.join(dir, "src"), f),
	]);
}


// JSON files beside index.ts: data the example imports, and its JSON config
async function jsonFiles(base) {
	const files = await readdir(base);
	return (files || []).filter((x) => /\.json$/.test(x) && x !== "template.json");
}

async function copyJsonFiles(base, dir) {
	await Promise.all((await jsonFiles(base)).map(async (file) => {
		await writeFile($path.join(dir, file), await readFile($path.join(base, file)));
	}));
}

// A page opened from disk cannot fetch a JSON file: the script version gets
// each data file as a script that declares it, named as index.ts imports it.
// The config is not among them: it is part of json.html
async function writeDataScripts(base, dir) {
	const source = await readFile($path.join(base, "index.ts"));
	const files = (await jsonFiles(base)).filter((file) => file !== "config.json");

	return await Promise.all(files.map(async (file) => {
		const match = new RegExp("^ *import +([$_a-zA-Z][$_a-zA-Z0-9]*) +from +\"\\./" + file.replace(/\./g, "\\.") + "\";", "m").exec(source);
		const name = (match ? match[1] : file.replace(/\.json$/, "").replace(/[^$_a-zA-Z0-9]+/g, "_"));
		const json = lf(await readFile($path.join(base, file))).trim();
		const script = file.replace(/\.json$/, ".js");
		const content = `var ${name} = ${json};
`;
		await writeFile($path.join(dir, script), content);
		return { file: script, name: name, content: content };
	}));
}


const CATEGORIES = {
	"xy": "XY",
	"percent": "Pie and sliced",
	"map": "Map",
	"stock": "Stock",
	"hierarchy": "Hierarchy",
	"flow": "Flow",
	"radar": "Radar and gauges",
	"timeline": "Timeline",
	"gantt": "Gantt",
	"other": "Other",
};

const TIERS = {
	"basic": "Basic",
	"technique": "Technique",
	"showcase": "Showcase",
};

// Lines of a data file the viewer shows
const SHOWN_LINES = 300;

// Where the viewer's copies of the sources are, beside the example folders
const VIEWER_DATA = "viewer-data";


// The loader of an example's JSON version. Themes and geodata are not part
// of a config, so it repeats those imports from index.ts, in their order
function jsonLoader(source) {
	const themes = [];
	const geodata = [];

	const re = /^ *import +([$_a-zA-Z][$_a-zA-Z0-9]*) +from +"(@amcharts\/amcharts5(?:-geodata)?\/[^"\n\r]+)";/gm;
	let x;

	while ((x = re.exec(source)) != null) {
		if (/^@amcharts\/amcharts5\/themes\//.test(x[2])) {
			themes.push({ name: x[1], path: x[2] });

		} else if (/^@amcharts\/amcharts5-geodata\//.test(x[2])) {
			geodata.push({ name: x[1], path: x[2] });
		}
	}

	return `import * as am5 from "@amcharts/amcharts5";
import * as am5plugins_json from "@amcharts/amcharts5/plugins/json";
${themes.concat(geodata).map((x) => `import ${x.name} from "${x.path}";
`).join("")}import config from "./config.json";


${geodata.length ? `// A config refers to geodata by its global name
${geodata.map((x) => `(window as any).${x.name} = ${x.name};
`).join("")}

` : ""}// Create root element
// https://www.amcharts.com/docs/v5/getting-started/#Root_element
const root = am5.Root.new("chartdiv");

${themes.length ? `
// Set themes
// https://www.amcharts.com/docs/v5/concepts/themes/
root.setThemes([
${themes.map((x) => `  ${x.name}.new(root)`).join(`,
`)}
]);

` : ""}
// Build the chart from its JSON config
// https://www.amcharts.com/docs/v5/concepts/serializing/
am5plugins_json.JsonParser.new(root).parse(config, {
  parent: root.container
});
`;
}

// How to read a config, above the config in a JSON version page
const JSON_FORMAT_NOTE = `// how a config reads:
// "type" is the class to create, and "settings" are what you would pass to its new() in code
// "properties" fill in its parts: lists such as series and axes, or templates such as columns.template
// "refs" holds objects used in more than one place: "#series-0" stands for the one named series-0
// a string starting with "@" takes a value from another object, such as "@series.get('fill')"
// https://www.amcharts.com/docs/v5/concepts/serializing/`;

// The script version already has geodata as globals
function jsonLoaderScript(source) {
	return jsonLoader(source).replace(/^\/\/ A config refers to geodata by its global name[\n\r]+(?:\(window as any\)[^\n\r]*[\n\r]+)+[\n\r]*/m, "");
}

function hasConfig(files) {
	return files.indexOf("config.json") !== -1;
}

function example_title(config, dir) {
	return config.title != null ? config.title : $path.basename(dir);
}

function htmlEscape(text) {
	return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// The index of the examples in the npm package. They are sources there, not
// projects, so this is also where it says how to run one
function examples_readme(entries) {
	const lines = [];
	const cell = (text) => String(text == null ? "" : text).replace(/\|/g, "\\|");

	lines.push("amCharts 5 examples");
	lines.push("===================");
	lines.push("");
	lines.push("One folder is one example. `index.ts` is the whole chart, with its data in the");
	lines.push("code. Where there is a `config.json`, it is the same chart as a JSON config;");
	lines.push("`data.json` is there only when the data is long.");
	lines.push("");
	lines.push("`examples.json` has this list as data: title, description, category, tags, the");
	lines.push("modules each example imports, and its files.");
	lines.push("");
	lines.push("These are sources, not projects: there is nothing to install or build in this");
	lines.push("folder (except `jest/`, which shows a test setup and has its own");
	lines.push("`package.json`). The gallery that runs them is in the amCharts 5 download");
	lines.push("(https://www.amcharts.com/download/) and at https://www.amcharts.com/demos/.");
	lines.push("");
	lines.push("Running one");
	lines.push("-----------");
	lines.push("");
	lines.push("In a project with a bundler and TypeScript (Vite, webpack, Angular, Next.js):");
	lines.push("");
	lines.push("1. `npm install @amcharts/amcharts5`, and `@amcharts/amcharts5-geodata` for a map.");
	lines.push("2. Put an element on the page for the chart, with a height:");
	lines.push("   `<div id=\"chartdiv\" style=\"width: 100%; height: 500px\"></div>`");
	lines.push("3. Copy the example's folder into the project and import its `index.ts` once");
	lines.push("   the element exists. Most examples are that one file; `files` in");
	lines.push("   `examples.json` lists what each one has. What an example loads while it");
	lines.push("   runs, such as `icons/`, has to be served beside the page.");
	lines.push("");
	lines.push("In a component (React, Vue, Angular), create the chart when the component is");
	lines.push("mounted and call `root.dispose()` when it is removed.");
	lines.push("");
	lines.push("A chart from its JSON config");
	lines.push("----------------------------");
	lines.push("");
	lines.push("```ts");
	lines.push("import * as am5 from \"@amcharts/amcharts5\";");
	lines.push("import * as am5plugins_json from \"@amcharts/amcharts5/plugins/json\";");
	lines.push("import am5themes_Animated from \"@amcharts/amcharts5/themes/Animated\";");
	lines.push("import config from \"./config.json\";");
	lines.push("");
	lines.push("const root = am5.Root.new(\"chartdiv\");");
	lines.push("");
	lines.push("root.setThemes([");
	lines.push("  am5themes_Animated.new(root)");
	lines.push("]);");
	lines.push("");
	lines.push("am5plugins_json.JsonParser.new(root).parse(config, {");
	lines.push("  parent: root.container");
	lines.push("});");
	lines.push("```");
	lines.push("");
	lines.push("In a config, `type` is the class to create and `settings` are what you would");
	lines.push("pass to its `new()` in code. `properties` fill in its parts: lists such as");
	lines.push("`series` and `axes`, or templates such as `columns.template`. `refs` holds");
	lines.push("objects used in more than one place, and `\"#series-0\"` stands for the one named");
	lines.push("`series-0`. A string starting with `@` takes a value from another object, such");
	lines.push("as `\"@series.get('fill')\"`. More: https://www.amcharts.com/docs/v5/concepts/serializing/");
	lines.push("");
	lines.push("Themes are not part of a config: set the ones the example's `index.ts` sets. A");
	lines.push("map config names its geodata by its global name, so make it one first:");
	lines.push("");
	lines.push("```ts");
	lines.push("import am5geodata_worldLow from \"@amcharts/amcharts5-geodata/worldLow\";");
	lines.push("");
	lines.push("(window as any).am5geodata_worldLow = am5geodata_worldLow;");
	lines.push("```");
	lines.push("");
	lines.push("Where `examples.json` has a `jsonNote` for an example, its JSON config is a");
	lines.push("similar chart, not the same one, and the note says what the code adds.");
	lines.push("");

	gallery_order(entries, true).forEach((section) => {
		lines.push(CATEGORIES[section.category]);
		lines.push("-".repeat(CATEGORIES[section.category].length));
		lines.push("");
		lines.push("| Example | What it shows | JSON |");
		lines.push("|---|---|---|");
		section.list.forEach((entry) => {
			lines.push(`| [\`${entry.name}\`](${entry.name}/index.ts) | **${cell(entry.title)}.** ${cell(entry.description)} | ${entry.json ? (entry.jsonNote != null ? "similar" : "yes") : ""} |`);
		});
		lines.push("");
	});

	return lines.join(`
`);
}


function mergeObjects(left, right) {
	if (left !== null && typeof left === "object" && right !== null && typeof right === "object") {
		for (var key in right) {
			left[key] = mergeObjects(left[key], right[key]);
		}

		return left;

	} else {
		return right;
	}
}

function printPackageJson(json) {
	return JSON.stringify(json, null, 2);
}


function find_imports(imports, template) {
	const re = /^ *import(?:\(|[^"\n\r]+)"([^"\n\r]+)"(?:\)|;[\n\r]*)/gm;

	let x;

	while ((x = re.exec(template)) != null) {
		const path = x[1];

		if (imports.indexOf(path) === -1) {
			imports.push(path);
		}
	}
}


function imports_to_packages(imports) {
	const packages = {};

	imports.forEach((path) => {
		if (path[0] !== ".") {
            const split = path.split(/\//g);

            if (split[0] === "@amcharts" && split[1] === "amcharts5") {
                const json = require("../../package.json");
                //package = `"@amcharts/amcharts5": "file:${path_to_v5}"`;
                packages["@amcharts/amcharts5"] = `^${json.version}`;

            } else if (split[0] === "@amcharts" && split[1] === "amcharts5-geodata") {
                const json = require("../../packages/geodata/package.json");
                packages["@amcharts/amcharts5-geodata"] = `^${json.version}`;

            } else if (split[0] === "@amcharts" && split[1] === "amcharts5-fonts") {
                const json = require("../../packages/fonts/package.json");
                packages["@amcharts/amcharts5-fonts"] = `^${json.version}`;

            } else {
                throw new Error("Unknown import: " + path);
            }
        }
	});

	return packages;
}


async function write_typescript(imports, from, to) {
	const file = await readFile(from);
	const template = replaceSubstitutions(file);
	find_imports(imports, template);
	await writeFile(to, template);
}

function to_js(imports, file) {
	let template = replaceSubstitutions(removeTypeScriptTypes(file));
	find_imports(imports, template);

	template = template.replace(/^ *import[^"\n\r]+"([^"\n\r]+)";[\n\r]*/gm, "");

	// TODO make this more reliable
	template = template.replace(/\b(?:let|const)(?= +[$_a-zA-Z][$_a-zA-Z0-9]*(?: +=| +in |;))/g, "var");

	// TODO make this more reliable
	template = template.replace(/(\([^\(\)]*\)) *=> */g, "function $1 ");

	return template;
}

async function write_js(imports, from, to) {
	await writeFile(to.replace(/\.ts$/, ".js"), to_js(imports, await readFile(from)));
}


// The npm package gets an example as its sources: index.ts, its JSON files
// and whatever else it needs to run. It is not a project of its own, except
// where the example is about a project's setup (it has `packageJson`)
async function write_sources(config, base, dir) {
	const imports = [];

	// Nothing of an earlier build may stay
	await rm(dir);

	await processFiles(base, dir, (from, to) => write_typescript(imports, from, to));

	await copyJsonFiles(base, dir);

	if (Object.keys(config.packageJson).length) {
		await writeFile($path.join(dir, "package.json"), printPackageJson(mergeObjects({
			"private": true,
			"name": `amcharts5-example-${$path.basename(dir)}`,
			"version": "0.1.0",
			"devDependencies": imports_to_packages(imports),
		}, config.packageJson)));
	}

	return listFiles(dir, "");
}

// Every file under a folder, as paths relative to it
async function listFiles(dir, prefix) {
	const names = ((await readdir(dir)) || []).slice().sort();
	let output = [];

	for (const name of names) {
		const sub = await readdir($path.join(dir, name));

		if (sub === null) {
			output.push(prefix + name);

		} else {
			output = output.concat(await listFiles($path.join(dir, name), prefix + name + "/"));
		}
	}

	return output;
}


// How far the chart code is indented inside its script element
const CODE_INDENT = "      ";

// Code that goes inside a script element must not close it
function inlineScript(code) {
	return lf(code).trim().replace(/<\/(script)/gi, "<\\/$1");
}

// The script version of an example is one page: styles, the library files
// and the chart code, so that it can be read and copied as a whole
function script_page(config, dir, suffix, scripts, data, code) {
	return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>amCharts 5 Example - ${htmlEscape(example_title(config, dir))}${suffix}</title>${config.extraHeadElements.map((x) => `
    ${x}`).join("")}

    <!-- Styles -->
    <style>
${indent(pageCSS(config), "      ")}
    </style>
  </head>
  <body>${config.bodyElements.map((x) => `
    ${x}`).join("")}

    <!-- Resources -->
${scripts.map((x) => `    <script src="${x}"></script>
`).join("")}${data.map((x) => `
    <!-- Data: ${x.file} declares "${x.name}", which the chart code uses -->
    <script src="${x.file}"></script>
`).join("")}
    <!-- Chart code -->
    <script>
${indent(inlineScript(code), CODE_INDENT)}
    </script>
  </body>
</html>
`;
}

// Where a piece of text is inside a page, for the viewer to show it alone
function partOf(page, text) {
	const start = page.indexOf(text);
	return (start === -1 ? undefined : [start, start + text.length]);
}

async function transpile_js(config, base, root_dir, dir, viewer_dir) {
	const imports = [];
	let code = "";

	// Nothing of an earlier build may stay: files come and go with the layout
	await rm(dir);

	await processFiles(base, dir, async (from, to) => {
		if (from === $path.join(base, "index.ts")) {
			code = to_js(imports, await readFile(from));

		} else {
			await write_js(imports, from, to);
		}
	});

	let js_imports = [];

	const path_to_v5 = posixPath($path.relative(dir, root_dir));

	imports.forEach((path) => {
		if (path[0] === ".") {
            // A JSON file is loaded as the script that declares it: see writeDataScripts
            if (!/\.json$/.test(path)) {
                js_imports.push(path);
            }

        } else {
            const split = path.split(/\//g);

            if (split[0] === "@amcharts" && split[1] === "amcharts5") {
                if (split.length === 2) {
                    js_imports.push(path_to_v5 + "/index.js");
                } else {
                    const name = split.slice(2).join("/");

                    if (dependencies[name] != null) {
                        dependencies[name].forEach((dependency) => {
                            js_imports.push(path_to_v5 + "/" + dependency + ".js");
                        });
                    }

                    js_imports.push(path_to_v5 + "/" + name + ".js");
                }

            } else if (split[0] === "@amcharts" && split[1] === "amcharts5-geodata") {
                js_imports.push(path_to_v5 + "/geodata/" + split.slice(2).join("/") + ".js");

            } else if (split[0] === "@amcharts" && split[1] === "amcharts5-fonts") {
                js_imports.push(path_to_v5 + "/fonts/" + split.slice(2).join("/") + ".js");

            } else {
                throw new Error("Unknown import: " + path);
            }
        }
	});

    config.extraScriptImports.forEach((x) => {
        js_imports.push(x);
    });

    const seen = new Set();

    js_imports = js_imports.filter((x) => {
        if (seen.has(x)) {
            return false;
        } else {
            seen.add(x);
            return true;
        }
    });

	const files = await jsonFiles(base);
	const json = hasConfig(files);
	const source = await readFile($path.join(base, "index.ts"));

	const data = await writeDataScripts(base, dir);

	const index_page = script_page(config, dir, "", js_imports, data, code);

	let json_page = null;
	let json_config = null;

	if (json) {
		// The JSON version needs the library files and the parser
		const json_imports = js_imports.filter((x) => x.indexOf(path_to_v5 + "/") === 0);
		if (json_imports.indexOf(path_to_v5 + "/plugins/json.js") === -1) {
			json_imports.push(path_to_v5 + "/plugins/json.js");
		}

		const loader = to_js([], jsonLoaderScript(source));
		json_config = lf(await readFile($path.join(base, "config.json"))).trim();

		json_page = script_page(config, dir, " (JSON config)", json_imports, [], `${config.jsonNote != null ? `// A similar chart, not the same as the code version:
// ${config.jsonNote}

` : ""}// The chart as a JSON config. The code that builds the chart from it is below
${JSON_FORMAT_NOTE}
var config = ${json_config};


${loader}`);
	}

	await Promise.all([
		writeFile($path.join(dir, "index.html"), index_page),

		(json_page != null
			? writeFile($path.join(dir, "json.html"), json_page)
			: Promise.resolve()),
	]);

	// What the viewer shows: a page opened from disk cannot fetch these files,
	// so they go into a script it can load
	const shown = [];

	// "part" is the chart code, or the config: what is left when the page around it is hidden
	shown.push({ label: "HTML + JavaScript", mode: "code", language: "html", file: "index.html", content: index_page, part: partOf(index_page, indent(inlineScript(code), CODE_INDENT)), partIndent: CODE_INDENT.length, partLanguage: "js" });
	shown.push({ label: "TypeScript", mode: "code", language: "js", file: "index.ts", content: lf(replaceSubstitutions(source)) });

	data.forEach((x) => {
		const entry = { label: (data.length === 1 ? "Data" : x.file), mode: "code", language: "js", file: x.file, content: x.content, data: true };
		const lines = entry.content.split(`
`);

		// Long data is cut for showing, by the viewer: copying still gives all of it
		if (lines.length > SHOWN_LINES) {
			entry.lines = lines.length - 1;
			entry.shown = SHOWN_LINES;
		}

		shown.push(entry);
	});

	if (json_page != null) {
		shown.push({ label: "HTML + JSON config", mode: "json", language: "html", file: "json.html", content: json_page, part: partOf(json_page, indent(json_config, CODE_INDENT).slice(CODE_INDENT.length)), partIndent: CODE_INDENT.length, partLanguage: "json" });
	}

	await writeFile($path.join(viewer_dir, $path.basename(dir) + ".js"), `am5example_source(${JSON.stringify({ name: $path.basename(dir), files: shown }).replace(/</g, "\\u003c")});
`);

	return js_imports;
}


function makeDefaultConfiguration() {
	return {
		extraCSS: null,
		extraHeadElements: [],
		bodyElements: ["<div id=\"chartdiv\"></div>"],
        extraScriptImports: [],
		noScript: false,
		title: null,
		description: null,
		category: null,
		tier: null,
		tags: [],
		since: null,
		jsonNote: null,
		body: {
			"font-family": `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"`,
			"padding": "0",
			"margin": "0",
			"background-color": "#ffffff",
		},
		chartdiv: {
			"width": "100%",
			"height": "100vh",
		},
		packageJson: {},
	};
}

function validateConfiguration(config) {
	const defaults = makeDefaultConfiguration();

	for (let key in config) {
		const value = config[key];

		if (key === "extraCSS") {
			if (typeof value !== "string") {
				throw new Error(key + " must be a string");
			}

			defaults[key] = value;

		} else if (key === "bodyElements" || key === "extraHeadElements" || key === "extraScriptImports") {
			if (!Array.isArray(value)) {
				throw new Error(key + " must be an array of strings");
			}

			value.forEach((x) => {
				if (typeof x !== "string") {
					throw new Error(key + " must be an array of strings");
				}
			});

			defaults[key] = value;

		} else if (key === "chartdiv" || key === "body") {
			// TODO better check for this
			if (value == null || typeof value !== "object") {
				throw new Error(key + " must be an object of strings / null");
			}

			Object.keys(value).forEach((property) => {
				if (typeof value[property] !== "string" && value[property] !== null) {
					throw new Error(key + " must be an object of strings / null");
				}

				defaults[key][property] = value[property];
			});

		} else if (key === "noScript") {
			if (typeof value !== "boolean") {
				throw new Error(key + " must be a boolean");
			}

			defaults[key] = value;

		} else if (key === "title" || key === "description" || key === "since" || key === "jsonNote") {
			if (typeof value !== "string" || value === "") {
				throw new Error(key + " must be a string");
			}

			defaults[key] = value;

		} else if (key === "category") {
			if (!Object.prototype.hasOwnProperty.call(CATEGORIES, value)) {
				throw new Error(key + " must be one of: " + Object.keys(CATEGORIES).join(", "));
			}

			defaults[key] = value;

		} else if (key === "tier") {
			if (!Object.prototype.hasOwnProperty.call(TIERS, value)) {
				throw new Error(key + " must be one of: " + Object.keys(TIERS).join(", "));
			}

			defaults[key] = value;

		} else if (key === "tags") {
			if (!Array.isArray(value) || value.some((x) => typeof x !== "string")) {
				throw new Error(key + " must be an array of strings");
			}

			defaults[key] = value;

		} else if (key === "packageJson") {
			// TODO better check for this
			if (value == null || typeof value !== "object") {
				throw new Error(key + " must be an object");
			}

			// TODO better checking
			defaults[key] = value;

		} else {
			throw new Error("Invalid key: " + key);
		}
	}

	return defaults;
}

async function getConfiguration(base) {
	try {
		return validateConfiguration(JSON.parse(await readFile($path.join(base, "template.json"))));

	} catch (e) {
		if (e.code === "ENOENT") {
			return makeDefaultConfiguration();

		} else {
			throw e;
		}
	}
}


async function copyTemplateDir(from, to) {
	if (await exists(from)) {
		await cp(from, to);
	}
}


// The amCharts modules an example imports, for the index
function example_modules(source) {
	const imports = [];
	find_imports(imports, source);

	return imports
		.filter((path) => /^@amcharts\/amcharts5(?:-geodata|-fonts)?(?:\/|$)/.test(path))
		.map((path) => path.replace(/^@amcharts\/amcharts5\/?/, "").replace(/^-geodata\//, "geodata/").replace(/^-fonts\//, "fonts/"))
		.filter((path) => path !== "");
}


// One card of the gallery
function gallery_card(entry) {
	const view = `viewer.html#${htmlEscape(entry.name)}`;

	return `      <article class="card">
        <a class="shot" href="${view}" aria-hidden="true" tabindex="-1">${entry.thumbnail
			? `<img src="thumbs/${htmlEscape(entry.name)}.webp" alt="" loading="lazy" width="480" height="300" />`
			: `<span class="noshot">${htmlEscape(CATEGORIES[entry.category] || "")}</span>`}</a>
        <h3><a href="${view}">${htmlEscape(entry.title)}</a><span class="tier">${htmlEscape(TIERS[entry.tier] || "")}</span></h3>
        <p>${htmlEscape(entry.description || "")}</p>
        <p class="meta"><a class="chip" href="${view}">JavaScript</a>${entry.json
			? `<a class="chip" href="${view}/json">JSON config</a>`
			: ""}<span class="name">${htmlEscape(entry.name)}</span></p>
      </article>`;
}

// Every example with a script version (or every example, with `all`), in the
// order the gallery shows them
function gallery_order(entries, all) {
	const order = { "basic": 0, "technique": 1, "showcase": 2 };

	return Object.keys(CATEGORIES).map((category) => {
		const list = entries
			.filter((entry) => (all || entry.script) && (entry.category || "other") === category)
			.sort((a, b) => ((order[a.tier] || 0) - (order[b.tier] || 0)) || a.title.localeCompare(b.title));

		return { category, list };
	}).filter((section) => section.list.length);
}

// The page that runs one example above its source
function viewer(template, entries) {
	const list = [];

	gallery_order(entries).forEach((section) => {
		section.list.forEach((entry) => {
			list.push({
				name: entry.name,
				title: entry.title,
				description: entry.description,
				categoryTitle: CATEGORIES[section.category],
				tierTitle: TIERS[entry.tier],
				json: entry.json,
				jsonNote: entry.jsonNote,
				svg: entry.svg,
			});
		});
	});

	// Inside a script element: no closing tag may appear in the data
	return template.replace(`"%EXAMPLES%"`, () => JSON.stringify(list).replace(/</g, "\\u003c"));
}

// The page that lists every example, by category, basics first
function gallery(entries) {
	const sections = gallery_order(entries);

	return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>amCharts 5 Examples</title>
    <style>
      :root {
        color-scheme: light dark;
        --bg: #f6f7f9;
        --card: #ffffff;
        --text: #1c2330;
        --muted: #5d6878;
        --line: #dfe3ea;
        --accent: #2f6fde;
      }
      @media (prefers-color-scheme: dark) {
        :root {
          --bg: #12161d;
          --card: #1b212b;
          --text: #e8ecf2;
          --muted: #9aa5b5;
          --line: #2c3442;
          --accent: #7aa7ff;
        }
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        padding: 24px 16px 48px;
        background: var(--bg);
        color: var(--text);
        font: 15px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      }
      main { max-width: 1200px; margin: 0 auto; }
      h1 { margin: 0 0 4px; font-size: 26px; }
      .intro { margin: 0 0 16px; color: var(--muted); max-width: 70ch; }
      /* The categories stay in reach down a long page */
      nav { position: sticky; top: 0; z-index: 1; display: flex; flex-wrap: wrap; gap: 6px 14px; margin: 0 0 8px; padding: 10px 0; background: var(--bg); border-bottom: 1px solid var(--line); }
      section { scroll-margin-top: 56px; }
      a { color: var(--accent); text-decoration: none; }
      a:hover, a:focus-visible { text-decoration: underline; }
      h2 { margin: 32px 0 12px; font-size: 19px; }
      h2 small { color: var(--muted); font-weight: normal; font-size: 14px; }
      .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 16px; }
      .card { background: var(--card); border: 1px solid var(--line); border-radius: 8px; overflow: hidden; display: flex; flex-direction: column; }
      .shot { display: block; aspect-ratio: 8 / 5; background: var(--bg); border-bottom: 1px solid var(--line); }
      .shot img { display: block; width: 100%; height: 100%; object-fit: cover; }
      .noshot { display: flex; align-items: center; justify-content: center; height: 100%; color: var(--muted); font-size: 13px; }
      .card h3 { margin: 12px 14px 4px; font-size: 16px; display: flex; align-items: baseline; gap: 8px; }
      .card h3 a { color: inherit; }
      .tier { margin-left: auto; color: var(--muted); font-weight: normal; font-size: 12px; white-space: nowrap; }
      .card p { margin: 0 14px 10px; color: var(--muted); font-size: 14px; }
      .card .meta { margin-top: auto; padding: 10px 0 12px; border-top: 1px solid var(--line); font-size: 13px; display: flex; flex-wrap: wrap; gap: 4px 6px; align-items: center; }
      .chip { padding: 1px 9px; border: 1px solid var(--accent); border-radius: 10px; font-weight: 600; font-size: 12px; }
      .chip:hover, .chip:focus-visible { background: var(--accent); color: var(--card); text-decoration: none; }
      .name { margin-left: auto; font-family: ui-monospace, "Cascadia Mono", Consolas, monospace; font-size: 12px; overflow-wrap: anywhere; }
    </style>
  </head>
  <body>
    <main>
      <h1>amCharts 5 Examples</h1>
      <p class="intro">Each example opens with its chart on top and its source below: a single HTML page with the code inside. <b>JavaScript</b> runs the code; <b>JSON config</b>, where there is one, builds the chart from a config. A <i>basic</i> example is the plain chart of its type, a <i>technique</i> shows one behaviour, a <i>showcase</i> puts several together. The list as data: <a href="examples.json">examples.json</a>.</p>
      <nav aria-label="Categories">
${sections.map((section) => `        <a href="#${section.category}">${htmlEscape(CATEGORIES[section.category])}</a>`).join(`
`)}
      </nav>
${sections.map((section) => `      <section id="${section.category}">
        <h2>${htmlEscape(CATEGORIES[section.category])} <small>${section.list.length}</small></h2>
        <div class="grid">
${section.list.map(gallery_card).join(`
`)}
        </div>
      </section>`).join(`
`)}
    </main>
  </body>
</html>
`;
}


module.exports = async (state) => {
	if (state.clean) {
		await Promise.all([
			rm(state.path("dist", "es2015", "examples")),
			rm(state.path("dist", "script", "examples")),
		]);
	}

	const shared = await readdir(state.path("examples", "shared"));

	// The npm package had each example twice, as a webpack project
	await Promise.all([
		rm(state.path("dist", "es2015", "examples", "javascript")),
		rm(state.path("dist", "es2015", "examples", "typescript")),
	]);

	// Output of examples that were renamed or removed since the last build
	await Promise.all([
		state.path("dist", "es2015", "examples"),
		state.path("dist", "script", "examples"),
	].map(async (dir) => {
		const built = (await readdir(dir)) || [];

		await Promise.all(built.map(async (name) => {
			if (shared.indexOf(name) === -1 && name !== "thumbs" && name !== VIEWER_DATA && (await readdir($path.join(dir, name))) !== null) {
				await rm($path.join(dir, name));
			}
		}));
	}));

	const thumbs = (await readdir(state.path("examples", "thumbs"))) || [];

	// The sources the viewer shows, one script per example
	const viewer_dir = state.path("dist", "script", "examples", VIEWER_DATA);
	await rm(viewer_dir);
	await mkdir(viewer_dir);

	const entries = [];

	await Promise.all(shared.map((name) => {
		return state.subtask(`example '${name}'`, async (state) => {
			const base = state.path("examples", "shared", name);

			const source_dir = state.path("dist", "es2015", "examples", name);
			const js_dir = state.path("dist", "script", "examples", name);

			const config = await getConfiguration(base);

			const [source_files] = await Promise.all([
				write_sources(config, base, source_dir),
				(config.noScript
					? Promise.resolve()
					: transpile_js(config, base, state.path("dist", "script"), js_dir, viewer_dir)),
			]);

			const files = await jsonFiles(base);
			const source = await readFile($path.join(base, "index.ts"));

			entries.push({
				name: name,
				title: example_title(config, js_dir),
				description: config.description,
				category: config.category,
				tier: config.tier,
				tags: config.tags,
				since: config.since,
				modules: example_modules(source),
				json: hasConfig(files),
				jsonNote: (hasConfig(files) && config.jsonNote != null ? config.jsonNote : undefined),
				script: !config.noScript,
				// Already drawn as SVG: the viewer has nothing to switch
				svg: /\bSVGRenderer\b/.test(source),
				thumbnail: thumbs.indexOf(name + ".webp") !== -1,
				// What the example is made of in the npm package
				files: source_files,
			});
		});
	}));

	entries.sort((a, b) => a.name.localeCompare(b.name));

	// Every example has to say what it is
	const incomplete = entries.filter((entry) => entry.description == null || entry.category == null || entry.tier == null || entry.title === entry.name);

	if (incomplete.length) {
		throw new Error(`Examples without title, description, category or tier in template.json: ${incomplete.map((entry) => entry.name).join(", ")}`);
	}

	// The list as data. `files` are those of the npm package; the script
	// version of an example is always index.html, with json.html beside it
	const index = (files) => JSON.stringify(entries.map((entry) => {
		const output = {};

		Object.keys(entry).forEach((key) => {
			if (key !== "thumbnail" && key !== "svg" && (files || key !== "files") && entry[key] != null) {
				output[key] = entry[key];
			}
		});

		return output;
	}), null, 2) + `
`;

	await Promise.all([
		writeFile(state.path("dist", "es2015", "examples", "examples.json"), index(true)),
		writeFile(state.path("dist", "es2015", "examples", "README.md"), examples_readme(entries)),
		writeFile(state.path("dist", "script", "examples", "examples.json"), index(false)),
		writeFile(state.path("dist", "script", "examples", "index.html"), gallery(entries)),
		readFile(state.path("examples", "viewer.html")).then((template) => writeFile(state.path("dist", "script", "examples", "viewer.html"), viewer(template, entries))),
		(thumbs.length
			? cp(state.path("examples", "thumbs"), state.path("dist", "script", "examples", "thumbs"))
			: Promise.resolve()),
	]);
};

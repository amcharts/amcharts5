// Writes src/generated.ts: the library version the chart loads, and the page
// with the library's tables
const fs = require("fs");
const path = require("path");

const here = path.join(__dirname, "..");
const library = path.join(here, "..", "..");

// Not the package's own version: the library release sets it
const libraryVersion = require(path.join(here, "package.json")).libraryVersion;
const dependencies = require(path.join(library, "build", "script-dependencies.js"));
const classesFile = fs.readFileSync(path.join(library, "src", ".internal", "plugins", "json", "Classes-script.ts"), "utf8");

// The classes outside index.js, with their script file. Each line adds the
// classes of one script file:
// add(() => import(/* webpackMode: "weak" */ "./../../../stock"), "StockChart,StockPanel");
const classes = {};
const re = /^\s*add\(\(\) => import\(.*?"\.\/\.\.\/\.\.\/\.\.\/([^"]+)"\), "([^"]+)"\);/gm;
let match;
while ((match = re.exec(classesFile))) {
	if (match[1] !== "index") {
		match[2].split(",").forEach((name) => {
			classes[name] = match[1];
		});
	}
}

if (Object.keys(classes).length < 50) {
	throw new Error("Could not read the classes from Classes-script.ts");
}

const page = fs.readFileSync(path.join(here, "src", "page.html"), "utf8")
	.replace(/\r\n/g, "\n")
	.replace("__CLASS_MODULES__", () => JSON.stringify(classes))
	.replace("__SCRIPT_DEPENDENCIES__", () => JSON.stringify(dependencies));

fs.writeFileSync(path.join(here, "src", "generated.ts"), `// Written by scripts/generate.cjs
export const libraryVersion: string = ${JSON.stringify(libraryVersion)};
export const pageHtml: string = ${JSON.stringify(page)};
`);

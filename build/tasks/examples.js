const $path = require("path");
const { cp, rm, mkdir, readdir, readFile, writeFile, posixPath, webpack, exists, removeTypeScriptTypes } = require("../util");


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

async function write_shared(config, base, dir) {
	await writeFile($path.join(dir, "index.css"),
`${showCSS("body", config.body)}

${showCSS("#chartdiv", config.chartdiv)}` + (config.extraCSS == null ? "" : `

${config.extraCSS}`));
}


function replaceSubstitutions(template) {
	return template.replace(/%__GEODATA_MESSAGE__%/g, geodata_message);
}


function get_es2015_imports(template, path_to_v5) {
	const imports = [];

	const re = /^ *import(?:\(|[^"\n\r]+)"([^"\n\r]+)"(?:\)|;[\n\r]*)/gm;

	let x;

	while ((x = re.exec(template)) != null) {
		const path = x[1];

        if (path[0] !== ".") {
            const split = path.split(/\//g);

            let package;

            if (split[0] === "@amcharts" && split[1] === "amcharts5") {
                const json = require("../../package.json");
                //package = `"@amcharts/amcharts5": "file:${path_to_v5}"`;
                package = `"@amcharts/amcharts5": "^${json.version}"`;

            } else if (split[0] === "@amcharts" && split[1] === "amcharts5-geodata") {
                const json = require("../../packages/geodata/package.json");
                package = `"@amcharts/amcharts5-geodata": "^${json.version}"`;

            } else if (split[0] === "@amcharts" && split[1] === "amcharts5-fonts") {
                const json = require("../../packages/fonts/package.json");
                package = `"@amcharts/amcharts5-fonts": "^${json.version}"`;

            } else {
                throw new Error("Unknown import: " + path);
            }

            if (imports.indexOf(package) === -1) {
                imports.push(package);
            }
        }
	}

	return imports;
}


async function write_es2015_shared(config, base, dir) {
	await Promise.all([
		writeFile($path.join(dir, "index.html"),
`<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>amCharts 5 Example - ${$path.basename(dir)}</title>
    <link rel="stylesheet" href="index.css" />${config.extraHeadElements.map((x) => `
    ${x}`).join("")}
  </head>
  <body>${config.bodyElements.map((x) => `
    ${x}`).join("")}
    <script src="dist/index.js"></script>
  </body>
</html>`),

		writeFile($path.join(dir, "README.md"),
`Steps to use
============

1. Run \`yarn\`

2. Run \`yarn start\` for development, or \`yarn build\` for production
`),
	]);
}


async function transpile_typescript(config, base, dir, template) {
	const imports = get_es2015_imports(template, posixPath($path.relative(dir, "es2015")));

	await Promise.all([
		write_shared(config, base, dir),

		write_es2015_shared(config, base, dir),

		writeFile($path.join(dir, "index.ts"), template),

		writeFile($path.join(dir, "package.json"),
`{
  "private": true,
  "name": "amcharts5-example-${$path.basename(dir)}",
  "version": "0.1.0",
  "devDependencies": {${imports.map((x) => `
    ${x},`).join("")}
    "source-map-loader": "^3.0.0",
    "ts-loader": "^9.2.2",
    "typescript": "^4.3.4",
    "webpack": "^5.1.3",
    "webpack-cli": "^4.1.0",
    "webpack-dev-server": "^3.11.0"
  },
  "scripts": {
    "build": "webpack",
    "start": "webpack serve --mode development"
  }
}`),

		writeFile($path.join(dir, "webpack.config.js"),
`var $path = require("path");

module.exports = {
  mode: "production",

  devtool: "source-map",

  stats: "errors-warnings",

  target: ["web", "es5"],

  entry: {
    index: "./index.ts",
  },

  devServer: {
    publicPath: "/dist/",
    liveReload: true,
    overlay: true,
    noInfo: true,
    open: true
  },

  output: {
    path: $path.resolve(__dirname, "dist"),
    publicPath: "dist/",
    filename: "[name].js",
    chunkFilename: "[name].js"
  },

  resolve: {
    extensions: [".ts", ".tsx", ".js"]
  },

  module: {
    rules: [{
      test: /\.tsx?$/,
      loader: "ts-loader"
    }, {
      test: /\.js$/,
      use: ["source-map-loader"],
      enforce: "pre"
    }]
  }
};`),

		writeFile($path.join(dir, "tsconfig.json"),
`{
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "sourceMap": true,
    "inlineSources": true,
    "moduleResolution": "node",
    "module": "esnext",
    "target": "es5",
    "lib": ["es6"]
  }
}`),
	]);
}


// TODO generate yarn.lock file
async function transpile_es2015(config, base, dir, template) {
	const imports = get_es2015_imports(template, posixPath($path.relative(dir, "es2015")));

	await Promise.all([
		write_shared(config, base, dir),

		write_es2015_shared(config, base, dir),

		writeFile($path.join(dir, "index.js"), template),

		writeFile($path.join(dir, "package.json"),
`{
  "private": true,
  "name": "amcharts5-example-${$path.basename(dir)}",
  "version": "0.1.0",
  "devDependencies": {${imports.map((x) => `
    ${x},`).join("")}
    "source-map-loader": "^3.0.0",
    "webpack": "^5.1.3",
    "webpack-cli": "^4.1.0",
    "webpack-dev-server": "^3.11.0"
  },
  "scripts": {
    "build": "webpack",
    "start": "webpack serve --mode development"
  }
}`),

		writeFile($path.join(dir, "webpack.config.js"),
`var $path = require("path");

module.exports = {
  mode: "production",

  devtool: "source-map",

  stats: "errors-warnings",

  target: ["web", "es5"],

  entry: {
    index: "./index.js",
  },

  devServer: {
    publicPath: "/dist/",
    liveReload: true,
    overlay: true,
    noInfo: true,
    open: true
  },

  output: {
    path: $path.join(__dirname, "dist"),
    publicPath: "dist/",
    filename: "[name].js",
    chunkFilename: "[name].js"
  },

  module: {
    rules: [{
      test: /\.js$/,
      use: ["source-map-loader"],
      enforce: "pre"
    }]
  }
};`),
	]);
}


async function transpile_js(config, base, root_dir, dir, template) {
	const imports = [];

	const path_to_v5 = posixPath($path.relative(dir, root_dir));

	template = template.replace(/^ *import[^"\n\r]+"([^"\n\r]+)";[\n\r]*/gm, (_, path) => {
        if (path[0] === ".") {
            imports.push(path);

        } else {
            const split = path.split(/\//g);

            if (split[0] === "@amcharts" && split[1] === "amcharts5") {
                if (split.length === 2) {
                    imports.push(path_to_v5 + "/index.js");
                } else {
                    imports.push(path_to_v5 + "/" + split.slice(2).join("/") + ".js");
                }

            } else if (split[0] === "@amcharts" && split[1] === "amcharts5-geodata") {
                imports.push(path_to_v5 + "/geodata/" + split.slice(2).join("/") + ".js");

            } else if (split[0] === "@amcharts" && split[1] === "amcharts5-fonts") {
                imports.push(path_to_v5 + "/fonts/" + split.slice(2).join("/") + ".js");

            } else {
                throw new Error("Unknown import: " + path);
            }
        }

		return "";
	});

	// TODO make this more reliable
	template = template.replace(/\b(?:let|const)(?= +[$_a-zA-Z][$_a-zA-Z0-9]*(?: +=| +in |;))/g, "var");

	// TODO make this more reliable
	template = template.replace(/(\([^\(\)]*\)) *=> */g, "function $1 ");

	/*{
		const x = /\b(?:let|const) |=>/.exec(template);

		if (x != null) {
			throw new Error("Invalid: " + x[0] + "  (" + dir + ")");
		}
	}*/

	await Promise.all([
		write_shared(config, base, dir),

		writeFile($path.join(dir, "index.js"), template),

		writeFile($path.join(dir, "index.html"),
`<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>amCharts 5 Example - ${$path.basename(dir)}</title>
    <link rel="stylesheet" href="index.css" />${config.extraHeadElements.map((x) => `
    ${x}`).join("")}
  </head>
  <body>${config.bodyElements.map((x) => `
    ${x}`).join("")}
${imports.map((x) => `    <script src="${x}"></script>
`).join("")}    <script src="index.js"></script>
  </body>
</html>`),

		writeFile($path.join(dir, "README.md"),
`Steps to use
============

1. Open \`index.html\` in a browser`),
	]);
}


function makeDefaultConfiguration() {
	return {
		extraCSS: null,
		extraHeadElements: [],
		bodyElements: ["<div id=\"chartdiv\"></div>"],
		noScript: false,
		body: {
			"font-family": `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"`,
			"padding": "0",
			"margin": "0",
			"background-color": "#ffffff",
		},
		chartdiv: {
			"width": "100%",
			"height": "80vh",
		},
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

		} else if (key === "bodyElements" || key === "extraHeadElements") {
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


async function copyTemplateDir(from, es2015_dir, ts_dir, js_dir) {
	if (await exists(from)) {
		await Promise.all([
			cp(from, es2015_dir),
			cp(from, ts_dir),
			cp(from, js_dir),
		]);
	}
}


module.exports = async (state) => {
	if (state.clean) {
		await Promise.all([
			rm(state.path("dist", "es2015", "examples")),
			rm(state.path("dist", "script", "examples")),
		]);
	}

	const shared = await readdir(state.path("examples", "shared"));

	await Promise.all(shared.map((name) => {
		return state.subtask(`example '${name}'`, async (state) => {
			const base = state.path("examples", "shared", name);

			const es2015_dir = state.path("dist", "es2015", "examples", "javascript", name);
			const ts_dir = state.path("dist", "es2015", "examples", "typescript", name);
			const js_dir = state.path("dist", "script", "examples", name);

			const [index, config] = await Promise.all([
				readFile($path.join(base, "index.ts")),
				getConfiguration(base),
				mkdir(es2015_dir),
				mkdir(ts_dir),
				mkdir(js_dir),
			]);

			const template = replaceSubstitutions(removeTypeScriptTypes(index));
			const ts_template = replaceSubstitutions(index);

			await Promise.all([
				copyTemplateDir($path.join(base, "template"), es2015_dir, ts_dir, js_dir),
				transpile_es2015(config, base, es2015_dir, template),
				transpile_typescript(config, base, ts_dir, ts_template),
				(config.noScript ? Promise.resolve() : transpile_js(config, base, state.path("dist", "script"), js_dir, template)),
			]);
		});
	}));
};

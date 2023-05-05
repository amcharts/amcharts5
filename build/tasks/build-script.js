const $path = require("path");
const { cp, cpMaybe, rm, mkdir, readdir, readFile, writeFile, posixPath, webpack, geodataToScript, removeTypeScriptTypes } = require("../util");


async function removeFiles(path) {
	const files = await readdir(path);

	if (files === null) {
		if (path.endsWith(".LICENSE.txt")) {
			await rm(path);
		}

	} else {
		await Promise.all(files.map((name) => {
			return removeFiles($path.join(path, name));
		}));
	}
}


async function getEntriesSub(entries, input, output, path, defaultImport) {
	const files = await readdir(input);

	if (files === null) {
		const parsed = $path.parse(path);

		if (parsed.ext === ".js") {
			const moduleName = $path.posix.join(parsed.dir, parsed.name);

			const name = (parsed.name === "index"
				? parsed.dir
				: moduleName);

			const mangledName = "am5" + name.replace(/\//g, "_");

			const outDir = $path.dirname(output);

			const importPath = posixPath($path.relative(outDir, input));

			if (moduleName === "index") {
				const polyfill = `const Promise = window.Promise;
const promiseThen = Promise && Promise.prototype.then;
const promiseCatch = Promise && Promise.prototype.catch;
const promiseFinally = Promise && Promise.prototype.finally;
const promiseReject = Promise && Promise.reject;
const promiseResolve = Promise && Promise.resolve;
const promiseAllSettled = Promise && Promise.allSettled;
const promiseAll = Promise && Promise.all;
const promiseRace = Promise && Promise.race;
const fetch = window.fetch;
const startsWith = String.prototype.startsWith;
const endsWith = String.prototype.endsWith;

export default function () {
	if (Promise) {
		window.Promise = Promise;

		if (promiseThen) { Promise.prototype.then = promiseThen; }
		if (promiseCatch) { Promise.prototype.catch = promiseCatch; }
		if (promiseFinally) { Promise.prototype.finally = promiseFinally; }
		if (promiseReject) { Promise.reject = promiseReject; }
		if (promiseResolve) { Promise.resolve = promiseResolve; }
		if (promiseAllSettled) { Promise.allSettled = promiseAllSettled; }
		if (promiseAll) { Promise.all = promiseAll; }
		if (promiseRace) { Promise.race = promiseRace; }
	}

	if (fetch) {
		window.fetch = fetch;
	}

	if (startsWith) {
		String.prototype.startsWith = startsWith;
	}

	if (endsWith) {
		String.prototype.endsWith = endsWith;
	}
};`;

				const file = `import fixPolyfills from "./polyfill.js";
import "./core-js.js";
import "regenerator-runtime/runtime.js";
import * as m from "./${importPath}";

export const ${mangledName} = m;

// TODO move all of this code into a different module and then import it
function getCurrentScript() {
	if (document.currentScript) {
		return document.currentScript;

	// Internet Explorer only
	} else {
		var scripts = document.getElementsByTagName("script");
		return scripts[scripts.length - 1];
	}
}

function dirpath(x) {
	return /(.*\\/)[^\\/]*$/.exec(x)[1];
}

__webpack_public_path__ = dirpath(getCurrentScript().src);

fixPolyfills();
`;

				await Promise.all([
					require("core-js-builder")({
						targets: "last 2 versions or >0.2%, not ie <= 11, not ie_mob <= 11",
					}).then((code) => {
						return writeFile($path.join(outDir, "core-js.js"), code);
					}),
					writeFile($path.join(outDir, "polyfill.js"), polyfill),
					writeFile(output, file),
				]);

			} else if (defaultImport) {
				await writeFile(output,
`import m from "./${importPath}";
export const ${mangledName} = m;`);

			} else {
				await writeFile(output,
`import * as m from "./${importPath}";
export const ${mangledName} = m;`);
			}

			let dependOn;

			// TODO handle this automatically
			switch (moduleName) {
			case "index":
				break;
			case "pie":
			case "funnel":
				dependOn = "percent";
				break;
			case "radar":
			case "stock":
				dependOn = "xy";
				break;
			default:
				dependOn = "index";
			}

			entries[moduleName] = {
				dependOn,
				import: output
			};
		}

	} else {
		await mkdir(output);

		await Promise.all(files.map(async (x) => {
			if (x[0] !== ".") {
				await getEntriesSub(entries, $path.join(input, x), $path.join(output, x), $path.posix.join(path, x), defaultImport);
			}
		}));
	}
}


async function getEntries(input, output) {
	const entries = {};
	const files = await readdir(input);

	await Promise.all(files.map(async (name) => {
		if (name[0] !== "." && name !== "examples") {
			const defaultImport = name === "lang" || name === "themes" || name === "locales";
			await getEntriesSub(entries, $path.join(input, name), $path.join(output, name), name, defaultImport);
		}
	}));

	return entries;
}


async function buildWorldLow(state) {
	const file = removeTypeScriptTypes(await readFile(state.path("src", "geodata", "worldLow.ts")));

	await mkdir(state.path("dist", "script", "geodata"));

	await writeFile(state.path("dist", "script", "geodata", "worldLow.js"), geodataToScript("_worldLow", file));
}


async function copyFiles(state, output) {
	await cp(state.path("packages", "shared"), output);
	await cpMaybe(state.path("packages", "script"), output);
}


module.exports = async (state) => {
	await state.task("build");

	const es2015 = state.dir("dist", "es2015");
	const src = state.dir("src");
	const output = $path.resolve(state.dir("dist", "script"));
	const tmp = state.dir("tmp", "webpack");

	if (state.clean) {
		await Promise.all([
			rm(output),
			rm(tmp),
		]);
	}

	await mkdir(tmp);

	let entries = await getEntries(es2015, tmp);

	const $webpack = require("webpack");

	const CheckDuplicates = require("../webpack-check-duplicates");

	const config = {
		mode: (state.dev ? "development" : "production"),

		devtool: (state.dev ? "cheap-module-source-map" : "source-map"),

		stats: "errors-warnings",

		target: ["web", "es5"],

		context: $path.resolve(state.cwd),

		performance: {
			hints: false,
		},

		optimization: {
			minimize: !state.dev,

			moduleIds: "deterministic",
			chunkIds: "deterministic",
			mangleExports: "deterministic",
			flagIncludedChunks: true,
			innerGraph: true,
			removeAvailableModules: true,
			concatenateModules: true,
			mergeDuplicateChunks: true,
			removeEmptyChunks: true,
			realContentHash: true,

			splitChunks: {
				chunks: "all",
				minSize: 0,

				cacheGroups: {
					// This causes the shared modules to be put into index.js
					"index": {
						name: "index",
						chunks: "initial",
						minChunks: 2,
						enforce: true,
						priority: 1,
					},

					// This disables Webpack's default behavior, which causes problems
					defaultVendors: false,
					default: false,
				},
			},
		},

		devServer: {
			contentBase: output,
			liveReload: true,
			//overlay: true,
			noInfo: true,
			open: true
		},

		entry: entries,

		output: {
			path: output,
			publicPath: "",
			filename: "[name].js",
			chunkFilename: "deps/[name].js",
			pathinfo: state.dev,
			chunkLoadingGlobal: "webpackChunk_am5",
			library: {
				type: "window"
			},
		},

		plugins: [
			new CheckDuplicates(),
			new $webpack.NormalModuleReplacementPlugin(/^\.\/Classes$/, "./Classes-script"),
		],

		module: {
			rules: [
				// Adds in treeshaking for TypeScript classes
				{
					test: /\.js$/,
					loader: "string-replace-loader",
					options: {
						search: /\/\*\* \@class \*\//g,
						replace: "/*@__PURE__*/",
					}
				},

				// All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
				{
					test: /\.js$/,
					enforce: "pre",
					use: ["source-map-loader"]
				},
			]
		},

		externals: [
			"jsdom",
			"xmldom",
			"canvas"
		],
	};

	await webpack(config);

	await Promise.all([
		buildWorldLow(state),
		removeFiles(output),
		copyFiles(state, output),
	]);
};

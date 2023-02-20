const $path = require("path");
const { mkdir, cp, rm, tsc, readdir, readFile, writeFile, geodataToScript, mapFiles, eachFileRecursive, splitPath, posixPath } = require("../util");


async function generateJson(from, to_es2015, to_script) {
	const files = await readdir(from);

	if (files === null) {
		if ($path.extname(from) === ".js" && $path.basename(from) !== "index.js") {
			const file = await readFile(from);

			const a = /const [a-zA-Z0-9_]+ = (\{[\s\S]+\});[ \n\r]+export default [a-zA-Z0-9_]+;[ \n\r]*$/.exec(file);

			if (a == null) {
				throw new Error("Invalid geodata: " + from);
			}

			await writeFile(to_es2015.replace(/\.js$/, ".json"), a[1]);
			await writeFile(to_script.replace(/\.js$/, ".json"), a[1]);
		}

	} else {
		await Promise.all([
			mkdir(to_es2015),
			mkdir(to_script),
		]);

		await Promise.all(files.map(async (file) => {
			if (file !== ".internal") {
				await generateJson($path.join(from, file), $path.join(to_es2015, file), $path.join(to_script, file));
			}
		}));
	}
}


async function getMapFiles(dir) {
	const files = [];

	await eachFileRecursive(dir, (path) => {
		if ($path.extname(path) === ".js") {
			const file = $path.relative(dir, path);

			if (file !== "index.js") {
				const segments = splitPath(file);

				if (segments.length === 1 || segments[0] === "region") {
					files.push(posixPath(file).replace(/\.js$/, ""));
				}
			}
		}
	});

	return files;
}

async function generateIndex(dir, output, ts) {
	const files = await getMapFiles(dir);

	await Promise.all([
		writeFile(ts, `
export function loadMap(name: string): Promise<GeoJSON.FeatureCollection>;
`),

		writeFile(output, `
export function loadMap(name) {
	switch (name) {
	${files.map((x) => {
		return `case "${x}": return import("./${x}.js").then(function (x) { return x.default; });`
	}).join("\n\t")}
	default:
		throw new Error("Could not find map " + name);
	}
}
`),
	]);
}


module.exports = async (state) => {
	const output = state.path("dist", "geodata");

	if (state.clean) {
		await Promise.all([
			rm(output),
			rm(state.path("dist", "tsc")),
		]);
	}

	await tsc(state.cwd, "tsconfig.geodata.json", state.clean);

	await mapFiles(state.path("dist", "geodata", "es2015"), state.path("dist", "geodata", "script"), (name, file) => {
		return geodataToScript(name, file);
	});

	await Promise.all([
		generateJson(
			state.path("dist", "geodata", "es2015"),
			state.path("dist", "geodata", "es2015", "json"),
			state.path("dist", "geodata", "script", "json"),
		),

		generateIndex(
			state.path("dist", "geodata", "es2015"),
			state.path("dist", "geodata", "es2015", "index.js"),
			state.path("dist", "geodata", "es2015", "index.d.ts"),
		),
	]);

	await cp(state.path("packages", "shared"), state.path("dist", "geodata", "es2015"));
	await cp(state.path("packages", "geodata"), state.path("dist", "geodata", "es2015"));

	await cp(state.path("packages", "shared"), state.path("dist", "geodata", "script"));
	await cp(state.path("packages", "geodata"), state.path("dist", "geodata", "script"));
};

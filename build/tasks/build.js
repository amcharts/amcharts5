const $path = require("path");
const { cp, cpMaybe, rm, readdir, readFile, writeFile, tsc } = require("../util");

async function writePackage(state) {
	const root = JSON.parse(await readFile(state.path("package.json")));

	await writeFile(
		state.path("dist", "es2015", "package.json"),
		JSON.stringify({
			name: root.name,
			version: root.version,
			author: root.author,
			description: root.description,
			homepage: root.homepage,
			license: root.license,
			bugs: root.bugs,
			repository: root.repository,
			keywords: root.keywords,
			main: "index.js",
			module: "index.js",
			sideEffects: root.sideEffects,
			dependencies: root.dependencies,
		}, null, 2),
	);
}

async function removeMapFiles(dir) {
	const files = await readdir(dir);

	await Promise.all(files.map((name) => {
		if (name.endsWith(".js.map")) {
			return rm($path.join(dir, name));
		}
	}));
}

async function copyDirs(state, output) {
	await cp(state.path("packages", "shared"), output);
	await cpMaybe(state.path("packages", "es2015"), output);

	await cp(state.path("src", ".internal", "charts", "venn", "vennjs"), $path.join(output, ".internal", "charts", "venn", "vennjs"));
	await cp(state.path("src", ".internal", "bundled"), $path.join(output, ".internal", "bundled"));
}

module.exports = async (state) => {
	await state.task("version");

	const output = state.path("dist", "es2015");

	if (state.clean) {
		await Promise.all([
			rm(output),
			rm(state.path("dist", "tsc")),
		]);
	}

	await tsc(state.cwd, "tsconfig.build.json", state.clean);

	await Promise.all([
		/*removeMapFiles(output),
		removeMapFiles($path.join(output, "locales")),
		removeMapFiles($path.join(output, "plugins")),
		removeMapFiles($path.join(output, "themes")),*/
		copyDirs(state, output),
	]);

	await writePackage(state);
};

const $path = require("path");
const { mkdir, cp, rm, tsc, readdir, readFile, writeFile, geodataToScript, mapFiles } = require("../util");


async function generateJson(from, to_es2015, to_script) {
	const files = await readdir(from);

	if (files === null) {
		if ($path.extname(from) === ".js") {
			const file = await readFile(from);

			const a = /var [a-zA-Z0-9_]+ = (\{[\s\S]+\});[ \n\r]+export default [a-zA-Z0-9_]+;[ \n\r]*$/.exec(file);

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

	await generateJson(
		state.path("dist", "geodata", "es2015"),
		state.path("dist", "geodata", "es2015", "json"),
		state.path("dist", "geodata", "script", "json"),
	);

	await cp(state.path("packages", "shared"), state.path("dist", "geodata", "es2015"));
	await cp(state.path("packages", "geodata"), state.path("dist", "geodata", "es2015"));

	await cp(state.path("packages", "shared"), state.path("dist", "geodata", "script"));
	await cp(state.path("packages", "geodata"), state.path("dist", "geodata", "script"));
};

const $path = require("path");
const { mkdir, cp, rm, tsc, readdir, readFile, writeFile, geodataToScript, mapFiles } = require("../util");

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

	await cp(state.path("packages", "shared"), state.path("dist", "geodata", "es2015"));
	await cp(state.path("packages", "geodata"), state.path("dist", "geodata", "es2015"));

	await cp(state.path("packages", "shared"), state.path("dist", "geodata", "script"));
	await cp(state.path("packages", "geodata"), state.path("dist", "geodata", "script"));
};

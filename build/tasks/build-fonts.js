const $path = require("path");
const { mkdir, cp, rm, tsc, readdir, readFile, writeFile, geodataToScript, mapFiles } = require("../util");

function fontsToScript(name, file) {
	return `window.am5fonts${name} = (function () {\n${file.replace(/export default /g, "return ")}})();`;
}

module.exports = async (state) => {
	const output = state.path("dist", "fonts");

	if (state.clean) {
		await Promise.all([
			rm(output),
			rm(state.path("dist", "tsc")),
		]);
	}

	await tsc(state.cwd, "tsconfig.fonts.json", state.clean);

	await mapFiles(state.path("dist", "fonts", "es2015"), state.path("dist", "fonts", "script"), (name, file) => {
		return fontsToScript(name, file);
	});

	await cp(state.path("packages", "shared"), state.path("dist", "fonts", "es2015"));
	await cp(state.path("packages", "fonts"), state.path("dist", "fonts", "es2015"));

	await cp(state.path("packages", "shared"), state.path("dist", "fonts", "script"));
	await cp(state.path("packages", "fonts"), state.path("dist", "fonts", "script"));
};

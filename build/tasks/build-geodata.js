const $path = require("path");
const { mkdir, cp, rm, tsc, readdir, readFile, writeFile } = require("../util");

async function script(from, to, dirs, name) {
	const files = await readdir(from);

	if (files === null) {
		if ($path.extname(from) === ".js") {
			const file = await readFile(from);

			const mangledName = dirs + "_" + $path.basename(name, ".js");

			await writeFile(to, `window.am5geodata${mangledName} = (function () {\n${file.replace(/export default /g, "return ")}})();`);
		}

	} else {
		await mkdir(to);

		if (name !== null) {
			dirs = dirs + "_" + name;
		}

		await Promise.all(files.map(async (file) => {
			if (file !== ".internal") {
				await script($path.join(from, file), $path.join(to, file), dirs, file);
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

	await script(state.path("dist", "geodata", "es2015"), state.path("dist", "geodata", "script"), "", null);

	await mkdir(state.path("dist", "script", "geodata"));
	await cp(state.path("dist", "geodata", "script", "worldLow.js"), state.path("dist", "script", "geodata", "worldLow.js"));

	await cp(state.path("packages", "shared"), state.path("dist", "geodata", "es2015"));
	await cp(state.path("packages", "geodata"), state.path("dist", "geodata", "script"));
};

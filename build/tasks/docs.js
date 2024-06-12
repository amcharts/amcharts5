const $path = require("path");
const { rm, spawn, mkdir, readJson, writeFile } = require("../util");

module.exports = async (state) => {
	const dir = state.dir("dist", "docs");

	if (state.clean) {
		await rm(dir);
	}

	await spawn("typedoc", [
		"--json", $path.join(dir, "docs.json"),
		"--module", "system",
		"--mode", "file",
		"--target", "es5",
		"--ignoreCompilerErrors",
		"--excludeExternals",
		"--excludeNotExported",
		"--excludePrivate",
		"--excludeProtected",
		"--exclude", "src/geodata/**/*",
		"--tsconfig", state.dir("tsconfig.json"),
		state.dir("src"),
	], {
		shell: true
	});

	const [json] = await Promise.all([
		readJson($path.join(dir, "docs.json")),
		mkdir($path.join(dir, "split")),
	]);

	await Promise.all(json.children.map((x, i) => {
		return writeFile($path.join(dir, "split", i + ".json"), JSON.stringify(x));
	}));
};

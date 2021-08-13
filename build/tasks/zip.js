const $path = require("path");
const { rm, mkdir, readJson, writeZipFile } = require("../util");

module.exports = async (state) => {
	const output = state.dir("dist", "zip");

	if (state.clean) {
		await rm(output);
	}

	const [packageJson, geodataJson] = await Promise.all([
		readJson(state.dir("dist", "es2015", "package.json")),
		readJson(state.dir("dist", "geodata", "es2015", "package.json")),
		mkdir(output),
	]);

	await Promise.all([
		writeZipFile({
			input: state.dir("dist", "script"),
			output: $path.join(output, "amcharts_" + packageJson.version + ".zip"),
			folder: "amcharts5"
		}),

		writeZipFile({
			input: state.dir("dist", "geodata", "script"),
			output: $path.join(output, "amcharts_geodata_" + geodataJson.version + ".zip"),
			folder: "geodata"
		}),
	]);
};

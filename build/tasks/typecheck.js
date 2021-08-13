const { spawnStatus } = require("../util");

async function tscCheck(cwd, config) {
	const args = ["--project", config, "--noEmit"];
	const code = await spawnStatus("tsc", args, { cwd });
    if (code !== 0) {
        process.exit(code);
    }
}

module.exports = async (state) => {
	await tscCheck(state.cwd, "tsconfig.json");
};

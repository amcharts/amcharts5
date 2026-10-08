const { spawnSilent } = require("../util");

// Builds everything and opens one example, in its script version
module.exports = async (state) => {
    await state.task("build:script");
    await state.task("examples");

    const name = state.args[0];

    if (!name) {
        throw new Error("Usage: run-example <name of a folder in examples/shared>");
    }

    await spawnSilent("http-server", ["./", "-o", "examples/" + name + "/"], { cwd: state.path("dist", "script") });
};

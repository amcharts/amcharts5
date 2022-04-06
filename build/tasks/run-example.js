const { withLinkSource, withLinkTargets, spawn, spawnSilent } = require("../util");

module.exports = async (state) => {
    await state.task("build");
    await state.task("examples");

    const name = state.args[0];

    const cwd = state.path("dist", "es2015", "examples", "javascript", name);

    await withLinkSource(state.path("dist", "es2015"), async () => {
        await spawnSilent("yarn", [], { cwd });

        await withLinkTargets(cwd, ["@amcharts/amcharts5"], async () => {
            await spawnSilent("yarn", ["build"], { cwd });
        });
    });

    await spawnSilent("http-server", ["./", "-o"], { cwd });
};

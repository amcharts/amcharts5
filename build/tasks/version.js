const { readFile, writeFile, readJson } = require("../util");

module.exports = async (state) => {
    const path = state.path("src", ".internal", "core", "Registry.ts");

    const [file, json] = await Promise.all([
        readFile(path),
        readJson(state.path("package.json")),
    ]);

    await writeFile(path, file.replace(/readonly +version: *string *= *"[^"]*";/, (_) => {
        return `readonly version: string = "${json.version}";`
    }));
};

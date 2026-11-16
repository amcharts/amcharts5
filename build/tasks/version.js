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

    // The docs give version-pinned script tags (jsDelivr, unpkg)
    await Promise.all([
        state.path("README.md"),
        state.path("packages", "shared", "README.md"),
        state.path("packages", "library", "AGENTS.md"),
    ].map(async (doc) => {
        const text = await readFile(doc);
        const updated = text.replace(/(@amcharts\/amcharts5@)\d+\.\d+\.\d+/g, "$1" + json.version);

        if (updated !== text) {
            await writeFile(doc, updated);
        }
    }));
};

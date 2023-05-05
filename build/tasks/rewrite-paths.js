const $path = require("path");
const { readFile, writeFile, eachFileRecursive } = require("../util");

function hasExtension(path) {
    return /\.[^\.\\\/]+$/.test(path);
}

function isRelative(path) {
    switch (path[0]) {
    case ".":
        return true;

    case "@":
        const a = /^\@[^\\\/]+[\\\/](.+)$/.exec(path);
        return /[\\\/]/.test(a[1]);

    default:
        return /[\\\/]/.test(path);
    }
}

async function rewritePaths(output) {
    await eachFileRecursive(output, async (path) => {
        const parsed = $path.parse(path);

        if (parsed.ext === ".ts" || parsed.ext === ".js" || parsed.ext === ".d.ts") {
            const oldFile = await readFile(path);

            let changed = false;

            const newFile = oldFile.replace(/((?:^|[\n\r]) *(?:import|export)[a-zA-Z0-9\$\_ \n\r\{\},\*]+from *["'])([^"'\n\r]+)(["'])/g, (_, first, path, last) => {
                if (isRelative(path) && !hasExtension(path)) {
                    changed = true;
                    return first + path + ".js" + last;

                } else {
                    return _;
                }
            });

            if (changed) {
                await writeFile(path, newFile);
            }
        }
    });
}

module.exports = async (state, options = {}) => {
    if (options.dirs == null) {
        options.dirs = [
            state.path("examples"),
            state.path("src"),
        ];
    }

    await Promise.all(options.dirs.map((x) => rewritePaths(x)));
};

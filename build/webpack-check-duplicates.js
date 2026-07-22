const $path = require("path");

class CheckDuplicates {
	// `ignore` is an optional array of RegExps tested against each module's
	// resource path (with forward slashes, so patterns are cross-platform).
	// Matching modules are allowed to appear in multiple chunks without warning
	// — used for standalone bundles like themes that intentionally inline a
	// shared base into each chunk.
	constructor(options) {
		this.ignore = (options && options.ignore) || [];
	}

	apply(compiler) {
		compiler.hooks.emit.tap("CheckDuplicates", (compilation) => {
			const logger = compiler.getInfrastructureLogger("CheckDuplicates");

			const modules = {};

			compilation.modules.forEach((module) => {
				if (module.resource) {
					if (modules[module.resource]) {
						throw new Error("Duplicate modules " + module.resource);
					} else {
						modules[module.resource] = true;
					}


					const chunks = compilation.chunkGraph.getModuleChunks(module);

					const normalized = module.resource.replace(/\\/g, "/");

					if (chunks.length > 1 && !this.ignore.some((regexp) => regexp.test(normalized))) {
						const files = [];

						chunks.forEach((chunk) => {
							chunk.files.forEach((file) => {
								files.push(file);
							});
						});

						logger.error("Module " + $path.relative(process.cwd(), module.resource) + " was in multiple chunks: " + files.join(", "));
					}
				}
			});
		});
	}
}

module.exports = CheckDuplicates;

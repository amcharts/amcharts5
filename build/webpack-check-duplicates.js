const $path = require("path");

class CheckDuplicates {
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

					if (chunks.length > 1) {
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

const $path = require("path");
const $fs = require("fs");
const $child = require("child_process");
const $c = require("ansi-colors");


function posixPath(path) {
	return path.replace(/\\/g, $path.posix.sep);
}

function splitPath(path) {
	return path.split(/[\/\\]/g);
}

exports.posixPath = posixPath;
exports.splitPath = splitPath;


function removeTypeScriptTypes(template) {
	return require("sucrase").transform(template, {
		disableESTransforms: true,
		transforms: ["typescript"],
	}).code;
}

function geodataToScript(name, file) {
	return `window.am5geodata${name} = (function () {\n${file.replace(/export default /g, "return ")}})();`;
}

async function mapFiles1(from, to, dirs, name, f) {
	const files = await readdir(from);

	if (files === null) {
		if ($path.extname(from) === ".js") {
			const file = await readFile(from);

			const mangledName = dirs + "_" + $path.basename(name, ".js").replace(/\-/g, "_");

			await writeFile(to, f(mangledName, file));
		}

	} else {
		await mkdir(to);

		if (name !== null) {
			dirs = dirs + "_" + name;
		}

		await Promise.all(files.map(async (file) => {
			if (file !== ".internal") {
				await mapFiles1($path.join(from, file), $path.join(to, file), dirs, file, f);
			}
		}));
	}
}

function mapFiles(from, to, f) {
	return mapFiles1(from, to, "", null, f);
}

exports.removeTypeScriptTypes = removeTypeScriptTypes;
exports.geodataToScript = geodataToScript;
exports.mapFiles = mapFiles;


async function eachFileRecursive(from, f) {
	const files = await readdir(from);

	if (files === null) {
		await f(from);

	} else {
		await Promise.all(files.map((file) => eachFileRecursive($path.join(from, file), f)));
	}
}

exports.eachFileRecursive = eachFileRecursive;


async function time(name, f) {
	const start = performance.now();

	const output = await f();

	const diff = performance.now() - start;

	console.debug(name + " took " + diff + " ms");

	return output;
}

exports.time = time;


function webpack(config) {
	return new Promise(function (resolve, reject) {
		require("webpack")(config, (err, stats) => {
			if (err) {
				reject(err);

			} else {
				const info = stats.toJson("errors-warnings");

				if (stats.hasWarnings()) {
					console.warn(info.warnings);
				}

				if (stats.hasErrors()) {
					reject(new Error(info.errors.map((x) => x.message).join("\n\n")));

				} else {
					resolve();
				}
			}
		});
	});
}

exports.webpack = webpack;


// TODO error if stderr has any output
function spawnStatus(name, args, options = {}) {
	if (options.transformCommand == null) {
		options.transformCommand = true;
	}

	return new Promise((resolve, reject) => {
		// TODO pretty hacky, but needed to make it work on Windows
		const command = (options.transformCommand ? (process.platform === "win32" ? name + ".cmd" : name) : name);

		var spawn = $child.spawn(command, args, {
			cwd: options.cwd || process.cwd(),
			env: Object.assign({}, process.env, options.env),
			stdio: options.stdio || "inherit",
			shell: options.shell || false,
		});

		spawn.on("exit", (code) => {
			resolve(code);
		});

		spawn.on("error", reject);
	});
}

async function spawn(name, args, options) {
	const status = await spawnStatus(name, args, options);

	if (status !== 0) {
		throw new Error("Command `" + name + " " + args.join(" ") + "` failed with error code: " + status);
	}
}

async function spawnSilent(name, args, options = {}) {
	options.stdio = ["ignore", "ignore", "inherit"];

	await spawn(name, args, options);
}

exports.spawnStatus = spawnStatus;
exports.spawn = spawn;
exports.spawnSilent = spawnSilent;


async function withLinkSource(cwd, f) {
	// Ignore any errors
	try {
		await spawnSilent("yarn", ["unlink"], { cwd });
	} catch (e) {}

	await spawnSilent("yarn", ["link"], { cwd });

	try {
		return await f();

	} finally {
		await spawnSilent("yarn", ["unlink"], { cwd });
	}
}

async function withLinkTargets(cwd, paths, f) {
	await spawnSilent("yarn", ["link"].concat(paths), { cwd });

	try {
		return await f();

	} finally {
		await spawnSilent("yarn", ["unlink"].concat(paths), { cwd });
	}
}

exports.withLinkSource = withLinkSource;
exports.withLinkTargets = withLinkTargets;


function cp(from, to) {
	return new Promise(function (resolve, reject) {
		require("cpr")(from, to, {
			deleteFirst: false,
			overwrite: true,
			confirm: false // TODO maybe make this true ?
		}, function (err) {
			if (err) {
				reject(err);

			} else {
				resolve();
			}
		});
	});
}

async function cpMaybe(from, to) {
	try {
		await cp(from, to);

	} catch (e) {
		if (e.message !== "From should be a file or directory") {
			throw e;
		}
	}
}

function mv(from, to) {
	return new Promise(function (resolve, reject) {
		$fs.rename(from, to, function (err) {
			if (err) {
				reject(err);

			} else {
				resolve();
			}
		});
	});
}

function rm(path) {
	return new Promise(function (resolve, reject) {
		require("rimraf")(path, { glob: false, disableGlob: true }, function (err) {
			if (err) {
				reject(err);

			} else {
				resolve();
			}
		});
	});
}

function readFile(path) {
	return new Promise(function (resolve, reject) {
		$fs.readFile(path, { encoding: "utf8" }, function (err, file) {
			if (err) {
				reject(err);

			} else {
				resolve(file);
			}
		});
	});
}

function readJson(path) {
	return readFile(path).then((x) => JSON.parse(x));
}

function writeFile(path, contents) {
	return new Promise(function (resolve, reject) {
		$fs.writeFile(path, contents, function (err) {
			if (err) {
				reject(err);

			} else {
				resolve();
			}
		});
	});
}

function readdir(path) {
	return new Promise(function (resolve, reject) {
		$fs.readdir(path, function (err, files) {
			if (err) {
				if (err.code === "ENOTDIR" || err.code === "ENOENT") {
					resolve(null);

				} else {
					reject(err);
				}

			} else {
				resolve(files);
			}
		});
	});
}

function mkdir(path) {
	return new Promise(function (resolve, reject) {
		$fs.mkdir(path, { recursive: true }, (err) => {
			if (err) {
				reject(err);

			} else {
				resolve();
			}
		});
	});
}

function exists(path) {
	return new Promise((resolve, reject) => {
		$fs.access(path, $fs.constants.R_OK, (err) => {
			if (err) {
				if (err.code === "ENOENT") {
					resolve(false);

				} else {
					reject(err);
				}

			} else {
				resolve(true);
			}
		});
	});
}

exports.cp = cp;
exports.cpMaybe = cpMaybe;
exports.mv = mv;
exports.rm = rm;
exports.readFile = readFile;
exports.readJson = readJson;
exports.writeFile = writeFile;
exports.readdir = readdir;
exports.mkdir = mkdir;
exports.exists = exists;


async function tsc(cwd, config, force) {
	const args = ["--build", config];

	if (force) {
		args.push("--force");
	}

	await spawn("tsc", args, { cwd, shell: true });
}

exports.tsc = tsc;


class Tasks {
	constructor(tasks, args, cwd) {
		this.tasks = tasks;
		this.args = args;
		this.cwd = cwd;
		this.dev = false;
		this.clean = false;
		this.verbose = false;
		this.force = false;
		this.taskDepth = 0;
	}

	static run(cwd, tasks) {
		const args = require("minimist")(process.argv.slice(3));

		const name = args._[0];

		if (!name) {
			throw new Error("Unknown task: " + name);
		}

		const state = new Tasks(tasks, args._.slice(1), cwd);
		state.dev = !!args.dev;
		state.clean = !!args.clean;
		state.verbose = !!args.verbose;
		state.force = !!args.force;

		//console.log("");

		state.task(name).catch((e) => {
			state.error(e);
			//console.log("");
			process.exit(1);
		});
	}

	copy() {
		const state = new Tasks(this.tasks, this.args, this.cwd);
		state.dev = this.dev;
		state.clean = this.clean;
		state.verbose = this.verbose;
		state.force = this.force;
		state.taskDepth = this.taskDepth;
		return state;
	}

	dir(...dirs) {
		return $path.join(this.cwd, ...dirs);
	}

	path(...segments) {
		return $path.join(this.cwd, ...segments);
	}

	async task(name, options) {
		return this.subtask(name, (state) => state.tasks[name](state, options));
	}

	async subtask(name, f) {
		console.log($c.green(`${">".repeat(this.taskDepth + 1)} ${name}`));
		const state = this.copy();
		++state.taskDepth;
		return await f(state);
	}

	warn(...args) {
		console.warn($c.yellow(`${">".repeat(this.taskDepth + 1)} ${args.join(" ")}`));
	}

	error(e) {
		if (this.verbose) {
			console.error($c.red(`${">".repeat(this.taskDepth + 1)} ${e.stack}`));
		} else {
			console.error($c.red(`${">".repeat(this.taskDepth + 1)} ${e.message}`));
		}
	}
}

exports.Tasks = Tasks;

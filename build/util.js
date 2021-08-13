const $path = require("path");
const $fs = require("fs");
const $os = require("os");
const $child = require("child_process");
const $rimraf = require("rimraf");
const $cpr = require("cpr");
const $webpack = require("webpack");


function posixPath(path) {
	return path.replace(/\\/g, $path.posix.sep);
}

exports.posixPath = posixPath;


function webpack(config) {
	return new Promise(function (resolve, reject) {
		$webpack(config, (err, stats) => {
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


function cached(f) {
	let run = false;
	let output;

	return function (...args) {
		if (run) {
			return output;

		} else {
			run = true;
			output = f(...args);
			return output;
		}
	};
}

exports.cached = cached;


// TODO code duplication with spawn
/*function spawnSync(name, args, options = {}) {
	const command = (process.platform === "win32" ? name + ".cmd" : name);

	var spawn = $child.spawnSync(command, args, {
		cwd: options.cwd,
		env: Object.assign({}, process.env, options.env),
		stdio: "inherit",
		shell: true
	});

	if (spawn.status !== 0) {
		throw new Error("Command `" + name + " " + args.join(" ") + "` failed with error code: " + spawn.status);
	}
}*/

function exec(command, options = {}) {
	return new Promise((resolve, reject) => {
		$child.exec(command, options, function (err, stdout, stderr) {
			if (err) {
				reject(err);

			} else if (stderr.length) {
				reject(new Error(stderr));

			} else {
				resolve(stdout);
			}
		});
	});
}

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

exports.exec = exec;
exports.spawnStatus = spawnStatus;
exports.spawn = spawn;
exports.spawnSilent = spawnSilent;


async function withLinkSource(cwd, f) {
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
		$cpr(from, to, {
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

	/*return new Promise(function (resolve, reject) {
		$fs.copyFile(from, to, $fs.constants.COPYFILE_EXCL, function (err) {
			if (err) {
				reject(err);

			} else {
				resolve();
			}
		});
	});*/
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
		$rimraf(path, { glob: false, disableGlob: true }, function (err) {
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
				if (err.code === "ENOTDIR") {
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

/*function isDir(path) {
	return new Promise(function (resolve, reject) {
		$fs.stat(path, function (err, stat) {
			if (err) {
				reject(err);

			} else {
				resolve(state.isDirectory());
			}
		});
	});
}*/

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
exports.mv = mv;
exports.rm = rm;
exports.readFile = readFile;
exports.readJson = readJson;
exports.writeFile = writeFile;
exports.readdir = readdir;
exports.mkdir = mkdir;
exports.exists = exists;
//exports.isDir = isDir;


async function tsc(cwd, config, force) {
	const args = ["--build", config];

	if (force) {
		args.push("--force");
	}

	await spawn("tsc", args, { cwd });
}

exports.tsc = tsc;


function makeTemporaryDirectory(prefix) {
	return new Promise(function (resolve, reject) {
		$fs.mkdtemp($path.join($os.tmpdir(), prefix), function (err, folder) {
			if (err) {
				reject(err);

			} else {
				resolve(folder);
			}
		});
	});
}

async function withTemporaryDirectory(prefix, f) {
	var path = await makeTemporaryDirectory(prefix);

	try {
		return await f(path);

	} finally {
		await rm(path);
	}
}

exports.withTemporaryDirectory = withTemporaryDirectory;


/*function compare(a, b) {
	if (a === b) {
		return 0;
	} else if (a < b) {
		return -1;
	} else {
		return 1;
	}
}*/


function writeZipFile(info) {
	return new Promise(function (resolve, reject) {
		const output = $fs.createWriteStream(info.output);

		const archive = require("archiver")("zip", {
			zlib: { level: 9 } // Sets the compression level.
		});

		archive.on("warning", (err) => {
			console.warn(err);
		});

		archive.on("error", (err) => {
			reject(err);
		});

		output.on("error", (err) => {
			reject(err);
		});

		output.on("close", () => {
			resolve();
		});

		archive.pipe(output);

		archive.directory(info.input, info.folder);

		archive.finalize();
	});
}

exports.writeZipFile = writeZipFile;


async function checkUncommitted(cwd) {
	// This checks that there aren't any uncommitted changes
	// https://stackoverflow.com/a/3879077/449477
	// https://stackoverflow.com/a/39937070/449477
	const status = await spawnStatus("git", ["diff-index", "--quiet", "HEAD", "--", ":(exclude,top)public/package.json"], { cwd, transformCommand: false });

	if (status !== 0) {
		throw new Error("You have uncommitted changes");
	}
}

exports.checkUncommitted = checkUncommitted;


async function gitInitSubmodules(cwd) {
	await spawnSilent("git", ["submodule", "update", "--init", "--recursive"]);
}

async function gitFetchSubmodule(cwd) {
	await spawnSilent("git", ["checkout", "master"], { cwd });
	await spawnSilent("git", ["pull", "--ff-only"], { cwd });
	//run("git", ["submodule", "update", "--init", "--remote", "--rebase", "."]);
}

async function gitTag(cwd, s) {
	// TODO use signed tags ?
	await spawnSilent("git", ["tag", "--annotate", "-m", s, s], { cwd });
	await spawnSilent("git", ["push", "origin", s], { cwd });
}

async function releaseSubPackage(name, gitName) {
	const distDir = $path.resolve(`dist/${name}`);

	const json = require(`../../${name}/package.json`);

	{
		const cwd = $path.join("git", gitName);
		await gitFetchSubmodule(cwd);

		//await rm($path.join(cwd, "dist"));
		await cp($path.join(cwd, distDir), $path.join(cwd, "dist"));

		await spawnSilent("git", ["add", "."], { cwd });
		await spawnSilent("git", ["commit", "-m", `"Version ${json.version}"`], { cwd });
		await spawnSilent("git", ["push"], { cwd });
		await gitTag(cwd, json.version);
	}

	{
		const cwd = $path.join("git", gitName, "dist", "es2015");
		await spawnSilent("yarn", ["publish", "--new-version", json.version], { cwd });
	}

	const cwd = process.cwd();
	await spawnSilent("git", ["add", `git/${gitName}`, `package/${name}/package.json`], { cwd });
	await spawnSilent("git", ["commit", "-m", `"Published ${gitName} ${json.version}"`], { cwd });
	await spawnSilent("git", ["push"], { cwd });
	await gitTag(cwd, `${name}-${json.version}`);
}

exports.gitInitSubmodules = gitInitSubmodules;
exports.gitFetchSubmodule = gitFetchSubmodule;
exports.gitTag = gitTag;
exports.releaseSubPackage = releaseSubPackage;


class Lock {
	constructor() {
		this.locked = false;
		this.pending = [];
	}

	async lock(f) {
		if (this.locked) {
			await new Promise(function (resolve, reject) {
				this.pending.push(resolve);
			});

			if (this.locked) {
				throw new Error("Invalid lock state");
			}
		}

		this.locked = true;

		try {
			return await f();

		} finally {
			this.locked = false;

			if (this.pending.length !== 0) {
				const resolve = this.pending.shift();
				// Wake up pending task
				resolve();
			}
		}
	}
}

exports.Lock = Lock;

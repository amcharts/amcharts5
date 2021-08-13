const $path = require("path");
const $util = require("./util");
const $c = require("ansi-colors");


class State {
	constructor(tasks, args, cwd) {
		this.tasks = tasks;
		this.args = args;
		this.cwd = cwd;
		this.dev = false;
		this.clean = false;
		this.verbose = false;
		this.taskDepth = 0;
	}

	copy() {
		const state = new State(this.tasks, this.args, this.cwd);
		state.dev = this.dev;
		state.clean = this.clean;
		state.verbose = this.verbose;
		state.taskDepth = this.taskDepth;
		return state;
	}

	dir(...dirs) {
		return $path.join(this.cwd, ...dirs);
	}

	path(...segments) {
		return $path.join(this.cwd, ...segments);
	}

	async task(name) {
		return this.subtask(name, (state) => state.tasks[name](state));
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


function init() {
	const args = require("minimist")(process.argv.slice(3));

	const name = args._[0];

	if (!name) {
		throw new Error("Unknown task: " + name);
	}

	const tasks = {
		"build": require("./tasks/build"),
		"build:script": require("./tasks/build-script"),
		"build:geodata": require("./tasks/build-geodata"),
		"docs": require("./tasks/docs"),
		"examples": require("./tasks/examples"),
		"generate-classes": require("./tasks/generate-classes"),
		"release": require("./tasks/release"),
		"typecheck": require("./tasks/typecheck"),
		"zip": require("./tasks/zip"),
	};

	const state = new State(tasks, args._.slice(1), process.cwd());
	state.dev = !!args.dev;
	state.clean = !!args.clean;
	state.verbose = !!args.verbose;

	console.log("");

	state.task(name).catch((e) => {
		state.error(e);
		console.log("");
		process.exit(1);
	});
}

init();

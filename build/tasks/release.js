const $path = require("path");
const { spawn, readdir, rm, cp, readFile, writeFile, checkUncommitted, gitInitSubmodules, gitFetchSubmodule } = require("../util");

const DRY = false;

async function getVersion(state) {
	return JSON.parse(await readFile(state.path("package.json"))).version;
}

async function getChangelog(state) {
	const changelog = await readFile(state.path("packages", "shared", "CHANGELOG.md"));

	if (/UNRELEASED/.test(changelog)) {
		throw new Error("You forgot to change UNRELEASED in the CHANGELOG");
	}

	if (/\?\?\?\?\-\?\?\-\?\?/.test(changelog)) {
		throw new Error("You forgot to change ????-??-?? in the CHANGELOG");
	}

	return changelog;
}

async function release(state, changelog, version) {
	{
		const cwd = state.path("dist", "es2015");

		if (!DRY && false) {
			await spawn("yarn", ["publish", "--new-version", version], { cwd });
		}
	}

	{
		const cwd = state.path("..", "git", "amcharts5");

		const files = await readdir(cwd);

		// Remove existing files
		await Promise.all(files.map(async (name) => {
			if (name !== ".git") {
				await rm($path.join(cwd, name));
			}
		}));

		// TODO test that this escaping works correctly on Windows and Linux
		//$util.run("cpr", [`"${distDir.replace(/"/g, "\\$&")}"`, "dist", "--overwrite"]);
		//$util.run("cpr", [`"${srcDir.replace(/"/g, "\\$&")}"`, "src", "--overwrite"]);
		//$util.run("cpr", [`"${packageDir.replace(/"/g, "\\$&")}"`, ".", "--overwrite"]);

		await cp(state.path("."), cwd);

		// Geodata is stored separately on the amcharts4-geodata repo
		//await spawn("rimraf", ["geodata"], { cwd: state.cwd });

		if (!DRY) {
			await spawn("git", ["add", "."], { cwd });
			await spawn("git", ["commit", "-m", `"Version ${version}"`], { cwd });
			await spawn("git", ["push"], { cwd });
			await gitTag(cwd, version);
		}
	}

	{
		const cwd = state.path(".");

		await writeFile(
			state.path("packages", "shared", "CHANGELOG.md"),
			changelog.replace(
				/adhere to \[Semantic Versioning\]\(http:\/\/semver\.org\/spec\/v2\.0\.0\.html\) rules\./,
				`$&\r\n\r\n## [UNRELEASED] - ????-??-??\r\n`,
			),
		);

		if (!DRY) {
			// TODO add checks to make sure that this doesn't accidentally commit too much
			await spawn("git", [
				"add",
				"../git/amcharts5",
				"package.json",
				"packages/shared/CHANGELOG.md",
			], { cwd });

			await spawn("git", ["commit", "-m", `"Published amcharts5 ${version}"`], { cwd });
			await spawn("git", ["push"], { cwd });
			await gitTag(cwd, version);
		}
	}
}

module.exports = async (state) => {
	if (state.debug) {
		throw new Error("Cannot use --dev with release");
	}

	if (!state.clean) {
		throw new Error("Cannot use --fast with release");
	}

	//await checkUncommitted(state.path(".."));

	const [changelog, version] = await Promise.all([
		getChangelog(state),
		getVersion(state),
	]);

	await gitInitSubmodules(state.path("."));
	await gitFetchSubmodule(state.path("..", "git", "amcharts5"));

	await state.task("build");

	await release(state, changelog, version);
};

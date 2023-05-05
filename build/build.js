const $path = require("path");
const { Tasks } = require("./util");

Tasks.run($path.join(__dirname, ".."), {
	"build": require("./tasks/build"),
	"build:fonts": require("./tasks/build-fonts"),
	"build:geodata": require("./tasks/build-geodata"),
	"build:script": require("./tasks/build-script"),
	"docs": require("./tasks/docs"),
	"examples": require("./tasks/examples"),
	"run-example": require("./tasks/run-example"),
	"generate-classes": require("./tasks/generate-classes"),
	"rewrite-paths": require("./tasks/rewrite-paths"),
	"typecheck": require("./tasks/typecheck"),
	"version": require("./tasks/version"),
});

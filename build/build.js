const $path = require("path");
const { Tasks } = require("./util");

Tasks.run($path.join(__dirname, ".."), {
	"build": require("./tasks/build"),
	"build:fonts": require("./tasks/build-fonts"),
	"build:geodata": require("./tasks/build-geodata"),
	"build:script": require("./tasks/build-script"),
	"docs": require("./tasks/docs"),
	"examples": require("./tasks/examples"),
	"generate-classes": require("./tasks/generate-classes"),
	"typecheck": require("./tasks/typecheck"),
});

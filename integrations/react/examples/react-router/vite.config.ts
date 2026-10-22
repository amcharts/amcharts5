import { defineConfig } from "vite";
import { reactRouter } from "@react-router/dev/vite";

export default defineConfig({
	plugins: [reactRouter()],
	// The server build leaves packages to Node, which cannot load amCharts'
	// files: they are ES modules without file extensions in their imports.
	// This puts amCharts into the server build instead
	ssr: {
		noExternal: ["@amcharts/amcharts5"],
	},
});

import { defineConfig } from "astro/config";
import node from "@astrojs/node";
import react from "@astrojs/react";

export default defineConfig({
	output: "server",
	adapter: node({ mode: "standalone" }),
	integrations: [react()],
	server: { host: "localhost" },
	vite: {
		// The server build leaves packages to Node, which cannot load amCharts'
		// files: they are ES modules without file extensions in their imports.
		// This puts amCharts into the server build instead
		ssr: {
			noExternal: ["@amcharts/amcharts5"],
		},
	},
});

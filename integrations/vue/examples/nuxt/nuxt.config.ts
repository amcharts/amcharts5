export default defineNuxtConfig({
	srcDir: "app",
	devtools: { enabled: false },
	vite: {
		// The package loads amCharts in the browser with import(): listed here,
		// the dev server prepares it before the first page, instead of while it loads
		optimizeDeps: {
			include: ["@amcharts/amcharts5", "@amcharts/amcharts5/element"],
		},
	},
});

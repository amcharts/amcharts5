import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			adapter: adapter()
		})
	],
	// The dev server leaves packages to Node, which cannot load amCharts' files:
	// they are ES modules without file extensions in their imports. This puts
	// amCharts into the server build instead. The production build does this
	// on its own
	ssr: {
		noExternal: ['@amcharts/amcharts5']
	}
});

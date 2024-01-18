
/**
 * @ignore
 */
export class Registry {
	/**
	 * Currently running version of amCharts.
	 */
	readonly version: string = "5.7.7";

	/**
	 * List of applied licenses.
	 * @ignore
	 */
	licenses: String[] = [];

	/**
	 * Entities that have their `id` setting set.
	 */
	entitiesById: { [index: string]: any } = {};

	/**
	 * All created [[Root]] elements.
	 */
	rootElements: any[] = [];

}

/**
	* @ignore
 */
export const registry = new Registry();

/**
 * Adds a license, e.g.:
 *
 * ```TypeScript
 * am5.addLicense("xxxxxxxx");
 * ```
 * ```JavaScript
 * am5.addLicense("xxxxxxxx");
 * ```
 *
 * Multiple licenses can be added to cover for multiple products.
 *
 * @param  license  License key
 */
export function addLicense(license: string): void {
	registry.licenses.push(license);
}


/**
 * Disposes all [[Root]] elements.
 */
export function disposeAllRootElements(): void {
	let root;
	while(root = registry.rootElements.pop()) {
		root.dispose();
	}
}

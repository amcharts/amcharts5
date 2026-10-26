/**
 * @ignore
 */
export class Registry {
	/**
	 * Currently running version of amCharts.
	 */
	readonly version: string = "5.21.5";

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

	/**
	 * Disposes the [[Root]] already in a container when a new one is created
	 * there, instead of throwing an error.
	 *
	 * @since 5.14.4
	 */
	autoDispose: boolean = false;

	/**
	 * Functions that build a geometry from a few numbers, by the name they are
	 * serialized under. Registered by the map module; read when a config is
	 * parsed, so that a shape can be stored as the call that made it rather than
	 * as the coordinates it produced.
	 *
	 * @ignore
	 */
	geometryFunctions: { [index: string]: (...args: Array<any>) => any } = {};
}

/**
 * @ignore
 */
export const registry = new Registry();

/**
 * Adds a license key, e.g.:
 *
 * ```TypeScript
 * am5.addLicense("xxxxxxxx");
 * ```
 * ```JavaScript
 * am5.addLicense("xxxxxxxx");
 * ```
 *
 * Call it once per key to add licenses for several products.
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
	while ((root = registry.rootElements.pop())) {
		root.dispose();
	}
}

/**
 * Returns the [[Root]] whose container element has this `id`.
 *
 * @param   id  Container ID
 * @return      Root, or `undefined` if there is none
 * @since 5.9.2
 */
export function getRootById(id: string): any {
	let found;
	registry.rootElements.forEach((item) => {
		if (item.dom.id == id) {
			found = item;
		}
	});
	return found;
}

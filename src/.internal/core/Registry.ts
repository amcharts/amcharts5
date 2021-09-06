
/**
 * @ignore
 */
export class Registry {

	/**
	 * List of applied licenses.
	 * @ignore
	 */
	licenses: String[] = [];

	/**
	 * Entities that have their `id` setting set.
	 */
	entitiesById: { [index: string]: any } = {};

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

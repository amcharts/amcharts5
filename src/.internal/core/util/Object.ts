import * as $array from "./Array";
import type { Keyof } from "./Type";

export function keys<O>(object: O): Array<Keyof<O>> {
	return Object.keys(object) as Array<Keyof<O>>;
}

/**
 * Returns an array of object's property names ordered using specific ordering
 * function.
 *
 * @param object  Source object
 * @param order   Ordering function
 * @returns Object property names
 */
export function keysOrdered<Object>(object: Object, order: (a: Keyof<Object>, b: Keyof<Object>) => number): Array<Keyof<Object>> {
	return keys(object).sort(order);
}

export function copy<O>(object: O): O {
	return Object.assign({}, object);
}

export function each<O>(object: O, f: <K extends keyof O>(key: K, value: Exclude<O[K], undefined>) => void): void {
	keys(object).forEach((key) => {
		f(key, object[key] as any);
	});
}

/**
 * Iterates through all properties of the object calling `fn` for each of them.
 *
 * If return value of the function evaluates to `false` further iteration is
 * cancelled.
 *
 * @param object  Source object
 * @param fn      Callback function
 */
export function eachContinue<Object>(object: Object, fn: <Key extends Keyof<Object>>(key: Key, value: Object[Key]) => boolean): void {
	for (let key in object) {
		if (hasKey(object, key)) {
			if (!fn(key as Keyof<Object>, object[key] as Object[Keyof<Object>])) {
				break;
			}
		}
	}
}

/**
 * Orders object properties using custom `ord` function and iterates through
 * them calling `fn` for each of them.
 *
 * @param object  Source object
 * @param fn      Callback function
 * @param order   Ordering function
 */
export function eachOrdered<Object>(object: Object, fn: <Key extends Keyof<Object>>(key: Key, value: Object[Key]) => void, ord: (a: Keyof<Object>, b: Keyof<Object>) => number): void {
	$array.each(keysOrdered(object, ord), (key) => {
		fn(key, object[key]);
	});
}

/**
 * Checks if `object` has a specific `key`.
 *
 * @param object  Source object
 * @param key     Property name
 * @returns Has key?
 */
export function hasKey<Object, Key extends keyof Object>(object: Object, key: Key): boolean {
	return {}.hasOwnProperty.call(object, key);
}

/**
 * Copies all properties of one object to the other, omitting undefined, but only if property in target object doesn't have a value set.
 *
 * @param fromObject  Source object
 * @param toObject    Target object
 * @return Updated target object
 * @todo Maybe consolidate with utils.copy?
 */
export function softCopyProperties(source: Object, target: Object): Object {
	each(source, (key, value) => {
		// only if value is set
		//if ($type.hasValue(value) && !($type.hasValue((<any>target)[key]))) {
		if (value != null && (<any>target)[key] == null) {
			(<any>target)[key] = value;
		}
	});
	return target;
}

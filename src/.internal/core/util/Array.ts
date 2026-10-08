/**
 * ============================================================================
 * IMPORTS
 * ============================================================================
 * @hidden
 */
import type { Optional } from "./Type";
import * as $type from "./Type";


/**
 * ============================================================================
 * UTILITY FUNCTIONS
 * ============================================================================
 * @hidden
 */

/**
 * Searches `array` for `value`.
 *
 * Returns -1 if not found.
 *
 * @param array  Source array
 * @param value  Value to search
 * @returns Index
 */
export function indexOf<A>(array: ArrayLike<A>, value: A): number {
	const length = array.length;

	for (let i = 0; i < length; ++i) {
		// TODO handle NaN
		if (array[i] === value) {
			return i;
		}
	}

	return -1;
}

/**
 * Returns `true` if `test` returns `true` for any item of `array`, stopping
 * at the first one.
 *
 * @param array  Source array
 * @param test   Function which is called on each element
 * @returns Whether `test` returned true or not
 */
export function any<A>(array: ArrayLike<A>, test: (value: A) => boolean): boolean {
	const length = array.length;

	for (let i = 0; i < length; ++i) {
		if (test(array[i])) {
			return true;
		}
	}

	return false;
}

/**
 * Calls `fn` function for every member of array and returns a new array out
 * of all outputs.
 *
 * @param array  Source array
 * @param fn     Callback function
 * @returns New array
 */
export function map<A, B>(array: ArrayLike<A>, fn: (value: A, index: number) => B): Array<B> {
	const length = array.length;
	const output = new Array(length);

	for (let i = 0; i < length; ++i) {
		output[i] = fn(array[i], i);
	}

	return output;
}

/**
 * Iterates through all items in array and calls `fn` function for each of
 * them.
 *
 * @param array  Source array
 * @param fn     Callback function
 */
export function each<A>(array: ArrayLike<A>, fn: (value: A, index: number) => void): void {
	const length = array.length;

	for (let i = 0; i < length; ++i) {
		fn(array[i], i);
	}
}

/**
 * Iterates through all items in array in reverse order and calls `fn` function for each of
 * them.
 *
 * @param array  Source array
 * @param fn     Callback function
 */
export function eachReverse<A>(array: ArrayLike<A>, fn: (value: A, index: number) => void): void {
	let i = array.length;

	while (i > 0) {
		--i;
		fn(array[i], i);
	}
}

/**
 * Iterates through all items in array and calls `fn` function for each of
 * them.
 *
 * If `fn` call evaluates to `false`, further iteration is cancelled.
 *
 * @param array  Source array
 * @param fn     Callback function
 */
export function eachContinue<A>(array: ArrayLike<A>, fn: (value: A, index: number) => boolean): void {
	const length = array.length;

	for (let i = 0; i < length; ++i) {
		if (!fn(array[i], i)) {
			break;
		}
	}
}

/**
 * Removes the first `index` items of `array` in place, moving the rest to the
 * beginning.
 *
 * @param array  Source array
 * @param index  Number of items to remove
 */
export function shiftLeft<A>(array: Array<A>, index: number): void {
	const length = array.length;

	for (let i = index; i < length; ++i) {
		array[i - index] = array[i];
	}

	array.length = length - index;
}

/**
 * Returns the last item of the array.
 *
 * @param array  Source array
 * @returns Last item
 */
export function last<A>(array: Array<A>): Optional<A> {
	const length = array.length;
	return length ? array[length - 1] : undefined;
}

/**
 * Returns the first item of the array.
 *
 * @param array  Source array
 * @returns First item
 */
export function first<A>(array: Array<A>): Optional<A> {
	return array[0];
}

/**
 * Inserts `element` into `array` at `index`, clamped to `0` to
 * `array.length`.
 *
 * @param array    Source array
 * @param element  Item to insert
 * @param index    Index to insert item at
 */
export function insert<A>(array: Array<A>, element: A, index: number): void {
	//if (array) {
	index = Math.max(0, Math.min(index, array.length));
	array.splice(index, 0, element);
	//}
}

/**
 * Removes all copies of `element` from `array` (if they exist) and then
 * inserts `element` at `index`.
 *
 * @param array    Source array
 * @param element  Item
 * @param index    Index to move item to
 */
export function setIndex<A>(array: Array<A>, element: A, index: number): void {
	remove(array, element);
	insert(array, element, index);
}


/**
 * Pushes all of the elements from `input` into `array`.
 *
 * @param array  Output array
 * @param input  Input array
 */
export function pushAll<A>(array: Array<A>, input: Array<A>) {
	const length = input.length;

	for (let i = 0; i < length; ++i) {
		array.push(input[i]);
	}
}


/**
 * Removes `element` from `array`.
 *
 * If there are multiple copies of `element`, they are all removed.
 *
 * @param array    Source array
 * @param element  Item to remove
 * @returns Whether `element` was found
 */
export function remove<A>(array: Array<A>, element: A): boolean {
	let found: boolean = false;
	let index: number = 0;

	for (;;) {
		index = array.indexOf(element, index);

		if (index === -1) {
			return found;

		} else {
			found = true;
			array.splice(index, 1);
		}
	}
}

/**
 * Removes the first copy of `element` from `array`.
 *
 * @param array    Source array
 * @param element  Item to remove
 * @returns Whether `element` was found
 */
export function removeFirst<A>(array: Array<A>, element: A): boolean {
	let index: number = array.indexOf(element);

	if (index !== -1) {
		array.splice(index, 1);
		return true;

	} else {
		return false;
	}
}

/**
 * Adds `element` to `array` at `toIndex`, or at the end if `toIndex` is not
 * set. If `array` already contains `element`, its first copy is removed
 * first.
 *
 * @param array    Source array
 * @param element  Item to add
 * @param toIndex  Index to move item to
 */
export function move<A>(array: Array<A>, element: A, toIndex?: number): void {
	// @todo this implementation must be the same as the List.moveValue method
	// @todo don't do anything if the desired index is the same as the current index
	let index = indexOf(array, element);

	// @todo remove all old values rather than only the first ?
	if (index !== -1) {
		removeIndex(array, index);
	}

	if (toIndex == null) {
		array.push(element);
	} else {
		insertIndex(array, toIndex, element);
	}
}


/**
 * Inserts `element` into `array` at `index`.
 *
 * If `index` is not provided, it will insert `element` at the end of `array`.
 *
 * @param array    Source array
 * @param element  Item to add
 * @param index    Index to add item at
 */
export function add<A>(array: Array<A>, element: A, index?: number): void {
	// Append to the end if index is not set
	if (!$type.isNumber(index)) {
		array.push(element);
	}

	// Add to the beginning of array if index is 0
	else if (index === 0) {
		array.unshift(element);
	}
	// Add to indicated place if index is set
	else {
		array.splice(index, 0, element);
	}
}


/**
 * Pushes `element` into `array` if it doesn't already exist.
 *
 * @param array    Source array
 * @param element  Item to add
 */
export function pushOne<A>(array: Array<A>, element: A): void {
	if (array.indexOf(element) === -1) {
		array.push(element);
	}
}


/**
 * Removes the first copy of `element` from `array` (if it exists) and then
 * inserts `element` at `index`.
 *
 * If `index` is not provided, it will insert `element` at the end of `array`.
 *
 * @param array    Source array
 * @param element  Item to move
 * @param index    Index to move item to
 */
export function replace<A>(array: Array<A>, element: A, index?: number): void {
	// check if exists
	let ind: number = array.indexOf(element);

	// remove if exists
	if (ind !== -1) {
		array.splice(ind, 1);
	}

	// add to end if index is not set
	if (!$type.isNumber(index)) {
		array.push(element);
	}
	// add to indicated place if index is set
	else {
		array.splice(index, 0, element);
	}
}

/**
 * Wraps `input` in an array, if it isn't already an array.
 *
 * @param input  Source value
 * @return An array
 */
export function toArray<A>(input: Array<A> | A): Array<A> {
	if (Array.isArray(input)) {
		return input;
	}
	else {
		return [input];
	}
}

/**
 * Returns `true` if `element` exists in `array`.
 *
 * @param array    Source array
 * @param element  Item to search for
 * @returns Item in array?
 */
export function has<A>(array: ArrayLike<A>, element: A): boolean {
	return indexOf(array, element) !== -1;
}

/**
 * Returns a shallow copy of `array`.
 *
 * @param array  Source array
 * @returns Copy of the array
 */
export function copy<A>(array: ArrayLike<A>): Array<A> {
	const length = array.length;

	// It's faster to create the array with a pre-defined length
	const output = new Array(length);

	for (let i = 0; i < length; ++i) {
		// Because the array has a pre-defined length, we have to assign rather than push
		// This is also faster than pushing
		output[i] = array[i];
	}

	return output;
}


/**
 * Returns a copy of `array` which contains all the elements between `start`
 * and `end`. (including `start` and excluding `end`)
 *
 * If `end` is not provided, it defaults to `array.length`.
 *
 * @param array  Source array
 * @param start  Start index
 * @param end    End index
 * @returns Part of the array
 */
export function slice<A>(array: ArrayLike<A>, start: number, end: number = array.length): Array<A> {
	const output = new Array(end - start);

	for (let i = start; i < end; ++i) {
		output[i - start] = array[i];
	}

	return output;
}

/**
 * Inserts a value into array at specific index.
 *
 * @param array  Source array
 * @param index  Index
 * @param value  Value to insert
 */
export function insertIndex<A>(array: Array<A>, index: number, value: A): void {
	array.splice(index, 0, value);
}

/**
 * Removes a value from array at specific index.
 *
 * @param array  Source array
 * @param index  Index
 */
export function removeIndex<A>(array: Array<A>, index: number): void {
	array.splice(index, 1);
}

/**
 * Searches the array using custom function and returns index of the item if
 * found.
 *
 * Will call `matches` function on all items of the array. If return value
 * evaluates to `true`, index is returned.
 *
 * Otherwise returns -1.
 *
 * @param array    Source array
 * @param matches  Search function
 * @returns Index of the item if found
 */
export function findIndex<A>(array: ArrayLike<A>, matches: (value: A, index: number) => boolean): number {
	const length = array.length;

	for (let i = 0; i < length; ++i) {
		if (matches(array[i], i)) {
			return i;
		}
	}

	return -1;
}

/**
 * This is the same as `findIndex` except it searches from right to left.
 *
 * @param array    Source array
 * @param matches  Search function
 * @returns Index of the item if found
 */
export function findIndexReverse<A>(array: ArrayLike<A>, matches: (value: A, index: number) => boolean): number {
	let i = array.length;

	while (i > 0) {
		--i;
		if (matches(array[i], i)) {
			return i;
		}
	}

	return -1;
}

/**
 * Returns the first item for which `matches` returns `true`, or `undefined`
 * if there is none.
 *
 * @param array    Source array
 * @param matches  Search function
 * @returns Item if found
 */
export function find<A>(array: ArrayLike<A>, matches: (value: A, index: number) => boolean): A | undefined {
	const index = findIndex(array, matches);

	if (index !== -1) {
		return array[index];
	}
}

/**
 * This is the same as `find` except it searches from right to left.
 *
 * @param array    Source array
 * @param matches  Search function
 * @returns Item if found
 */
export function findReverse<A>(array: ArrayLike<A>, matches: (value: A, index: number) => boolean): A | undefined {
	const index = findIndexReverse(array, matches);

	if (index !== -1) {
		return array[index];
	}
}

/**
 * Calls `matches` on each item and returns the first value it returns that is
 * not `undefined`, or `undefined` if there is none.
 *
 * @param array    Source array
 * @param matches  Search function
 * @returns Value returned by `matches`
 */
export function findMap<A, B>(array: ArrayLike<A>, matches: (value: A, index: number) => B | undefined): B | undefined {
	const length = array.length;

	for (let i = 0; i < length; ++i) {
		const value = matches(array[i], i);

		if (value !== undefined) {
			return value;
		}
	}
}

/**
 * Shuffles `array` in place into a random order.
 *
 * @param array  Source array
 */
export function shuffle<A>(array: Array<A>) {
	// https://stackoverflow.com/a/2450976/449477
	let currentIndex = array.length,
		temporaryValue,
		randomIndex;

	// While there remain elements to shuffle...
	while (0 !== currentIndex) {
		// Pick a remaining element...
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex -= 1;

		// And swap it with the current element.
		temporaryValue = array[currentIndex];
		array[currentIndex] = array[randomIndex];
		array[randomIndex] = temporaryValue;
	}
}


export type Ordering = -1 | 0 | 1;

/**
 * Result of a binary search: whether a match was found, and its index or the
 * index to insert the value at.
 *
 * @ignore Exclude from docs
 */
export interface SortResult {
	found: boolean;
	index: number
}

/**
 * Binary-searches a sorted array. `ordering` returns a negative number for an
 * item before the value searched for, `0` for a match and a positive number
 * for an item after it. The index is that of the right-most match, or where
 * the value would be inserted.
 *
 * @ignore Exclude from docs
 * @param array     Source array
 * @param ordering  An ordering function
 * @returns Result of the search
 */
export function getSortedIndex<A>(array: ArrayLike<A>, ordering: (left: A) => Ordering): SortResult {
	let start = 0;
	let end   = array.length;
	let found = false;

	while (start < end) {
		// TODO is this faster/slower than using Math.floor ?
		const pivot = (start + end) >> 1;

		const order = ordering(array[pivot]);

		// less
		if (order < 0) {
			start = pivot + 1;

		// equal
		} else if (order === 0) {
			found = true;
			for (start = pivot + 1; start < end && ordering(array[start]) === 0; start++);
			start--;
			break;

		// more
		} else {
			end = pivot;
		}
	}

	return {
		found: found,
		index: start
	};
}


/**
 * Same as `getSortedIndex`, except that the index is that of the left-most
 * match.
 *
 * @ignore Exclude from docs
 * @param array     Source array
 * @param ordering  An ordering function
 * @returns Result of the search
 */
export function getFirstSortedIndex<A>(array: ArrayLike<A>, ordering: (left: A) => Ordering): SortResult {
	let start = 0;
	let end   = array.length;
	let found = false;

	while (start < end) {
		// TODO is this faster/slower than using Math.floor ?
		const pivot = (start + end) >> 1;

		const order = ordering(array[pivot]);

		// less
		if (order < 0) {
			start = pivot + 1;

		// equal
		} else if (order === 0) {
			found = true;
			end = pivot;

		// more
		} else {
			end = pivot;
		}
	}

	return {
		found: found,
		index: start
	};
}


/**
 * Removes in place every item for which `keep` returns `false`.
 *
 * @param array  Source array
 * @param keep   Test function
 */
export function keepIf<A>(array: Array<A>, keep: (value: A) => boolean): void {
	let i = array.length;

	while (i > 0) {
		--i;

		if (!keep(array[i])) {
			array.splice(i, 1);
		}
	}
}

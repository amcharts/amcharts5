/**
 * ============================================================================
 * IMPORTS
 * ============================================================================
 * @hidden
 */
import type { Entity } from "./Entity";
import type { Template } from "./Template";
import type { IDisposer } from "./Disposer";
import { EventDispatcher, Events } from "./EventDispatcher";
import * as $array from "./Array";
import type { Optional } from "./Type";


/**
 * Checks if specific index fits into length.
 *
 * @param index  Index
 * @param len    Length
 * @ignore
 */
function checkBounds(index: number, len: number): void {
	if (!(index >= 0 && index < len)) {
		throw new Error("Index out of bounds: " + index);
	}
}


export interface IListEvents<A> {
	/**
	 * All items were removed, by `clear()` or `setAll()`.
	 */
	clear: {
		oldValues: Array<A>,
	};
	/**
	 * An item was added to the end of the list.
	 */
	push: {
		newValue: A,
	};
	/**
	 * An item was inserted at `index`.
	 */
	insertIndex: {
		index: number,
		newValue: A,
	};
	/**
	 * The item at `index` was replaced.
	 */
	setIndex: {
		index: number,
		oldValue: A,
		newValue: A,
	};
	/**
	 * The item at `index` was removed.
	 */
	removeIndex: {
		index: number,
		oldValue: A,
	};
	/**
	 * An item was moved from `oldIndex` to `newIndex`.
	 */
	moveIndex: {
		oldIndex: number,
		newIndex: number,
		value: A,
	};
	/**
	 * Two items swapped places.
	 */
	swap: {
		a: A,
		b: A,
	};
}


/**
 * An ordered list of items that dispatches events as items are added, removed
 * or moved.
 */
export class List<T> {

	/**
	 * List values.
	 */
	protected _values: Array<T>;

	public events: EventDispatcher<Events<this, IListEvents<T>>> = new EventDispatcher();

	/**
	 * Constructor
	 *
	 * @param initial  Initial list of values to add to list
	 */
	constructor(initial: Array<T> = []) {
		this._values = initial;
	}

	/**
	 * An array of values in the list.
	 *
	 * Don't change this array directly: use methods like `push()` and
	 * `removeIndex()`, which dispatch the list's events.
	 *
	 * @readonly
	 * @return List values
	 */
	public get values(): Array<T> {
		return this._values;
	}

	/**
	 * Checks if list contains specific item reference.
	 *
	 * @param value  Item to search for
	 * @return `true` if found, `false` if not found
	 */
	public contains(value: T): boolean {
		return this._values.indexOf(value) !== -1;
	}

	/**
	 * Removes all copies of an item from the list.
	 *
	 * @param value  An item to remove
	 */
	public removeValue(value: T): void {
		let i = 0;
		let length = this._values.length;

		while (i < length) {
			// TODO handle NaN
			if (this._values[i] === value) {
				this.removeIndex(i);
				--length;

			} else {
				++i;
			}
		}
	}

	/**
	 * Searches the list for specific item and returns its index.
	 *
	 * @param value  An item to search for
	 * @return Index or -1 if not found
	 */
	public indexOf(value: T): number {
		return $array.indexOf(this._values, value);
	}

	/**
	 * Number of items in list.
	 *
	 * @readonly
	 * @return Number of items
	 */
	public get length(): number {
		return this._values.length;
	}

	/**
	 * Checks if there's a value at specific index.
	 *
	 * @param index  Index
	 * @return Value exists?
	 */
	public hasIndex(index: number): boolean {
		return index >= 0 && index < this._values.length;
	}

	/**
	 * Returns an item at specified index.
	 *
	 * @param index  Index
	 * @return List item
	 */
	public getIndex(index: number): T | undefined {
		return this._values[index];
	}

	protected _onPush(newValue: T) {
		if (this.events.isEnabled("push")) {
			this.events.dispatch("push", {
				type: "push",
				target: this,
				newValue
			});
		}
	}

	protected _onInsertIndex(index: number, newValue: T) {
		if (this.events.isEnabled("insertIndex")) {
			this.events.dispatch("insertIndex", {
				type: "insertIndex",
				target: this,
				index,
				newValue
			});
		}
	}

	protected _onSetIndex(index: number, oldValue: T, newValue: T) {
		if (this.events.isEnabled("setIndex")) {
			this.events.dispatch("setIndex", {
				type: "setIndex",
				target: this,
				index,
				oldValue,
				newValue
			});
		}
	}

	protected _onSwap(a: T, b: T) {
		if (this.events.isEnabled("swap")) {
			this.events.dispatch("swap", {
				type: "swap",
				target: this,
				a,
				b
			});
		}
	}	

	protected _onRemoveIndex(index: number, oldValue: T) {
		if (this.events.isEnabled("removeIndex")) {
			this.events.dispatch("removeIndex", {
				type: "removeIndex",
				target: this,
				index,
				oldValue
			});
		}
	}

	protected _onMoveIndex(oldIndex: number, newIndex: number, value: T) {
		if (this.events.isEnabled("moveIndex")) {
			this.events.dispatch("moveIndex", {
				type: "moveIndex",
				target: this,
				oldIndex,
				newIndex,
				value,
			});
		}
	}

	protected _onClear(oldValues: Array<T>) {
		if (this.events.isEnabled("clear")) {
			this.events.dispatch("clear", {
				type: "clear",
				target: this,
				oldValues
			});
		}
	}

	/**
	 * Replaces the value at `index`, which must already exist.
	 *
	 * @param index  Index
	 * @param value  New value
	 * @return Old value
	 */
	public setIndex(index: number, value: T): T {
		checkBounds(index, this._values.length);

		const oldValue = this._values[index];

		// Do nothing if the old value and the new value are the same
		if (oldValue !== value) {
			this._values[index] = value;
			this._onSetIndex(index, oldValue, value);
		}

		return oldValue;
	}

	/**
	 * Inserts an item at `index`, moving the items from there on one place
	 * further.
	 *
	 * @param index  Index
	 * @param value  An item to add
	 * @return Added item
	 */
	public insertIndex<K extends T>(index: number, value: K): K {
		checkBounds(index, this._values.length + 1);

		$array.insertIndex(this._values, index, value);
		this._onInsertIndex(index, value);
		return value;
	}

	/**
	 * Swaps two items in the list.
	 *
	 * @param a  Index of the first item
	 * @param b  Index of the second item
	 */
	public swap(a: number, b: number): void {
		const len = this._values.length;

		checkBounds(a, len);
		checkBounds(b, len);

		if (a !== b) {
			const value_a = this._values[a];
			const value_b = this._values[b];

			this._values[a] = value_b;
			this._values[b] = value_a;
			this._onSwap(value_a, value_b);
		}
	}

	/**
	 * Removes a value at specific index.
	 *
	 * @param index  Index of value to remove
	 * @return Removed value
	 */
	public removeIndex(index: number): T {
		checkBounds(index, this._values.length);

		const oldValue = this._values[index];

		$array.removeIndex(this._values, index);
		this._onRemoveIndex(index, oldValue);

		return oldValue;
	}

	/**
	 * Moves an item to `toIndex`, or to the end of the list if `toIndex` is not
	 * set. An item that is not in the list yet is added.
	 *
	 * @param value    Item to move
	 * @param toIndex  Index to place item at
	 * @return Moved item
	 */
	public moveValue<K extends T>(value: K, toIndex?: number): K {
		// TODO don't do anything if the desired index is the same as the current index
		let index = this.indexOf(value);

		// TODO remove all old values rather than only the first ?
		if (index !== -1) {
			$array.removeIndex(this._values, index);

			if (toIndex == null) {
				const toIndex = this._values.length;
				this._values.push(value);
				this._onMoveIndex(index, toIndex, value);

			} else {
				$array.insertIndex(this._values, toIndex, value);
				this._onMoveIndex(index, toIndex, value);
			}

		} else if (toIndex == null) {
			this._values.push(value);
			this._onPush(value);

		} else {
			$array.insertIndex(this._values, toIndex, value);
			this._onInsertIndex(toIndex, value);
		}

		return value;
	}

	/**
	 * Adds an item to the end of the list.
	 *
	 * @param value  An item to add
	 * @return Added item
	 */
	public push<K extends T>(value: K): K {
		this._values.push(value);
		this._onPush(value);
		return value;
	}

	/**
	 * Adds an item as a first item in the list.
	 *
	 * @param value  An item to add
	 * @return Added item
	 */
	public unshift<K extends T>(value: K): K {
		this.insertIndex(0, value);
		return value;
	}

	/**
	 * Adds multiple items to the end of the list.
	 *
	 * @param values  An Array of items to add
	 */
	public pushAll(values: Array<T>): void {
		$array.each(values, (value) => {
			this.push(value);
		});
	}

	/**
	 * Adds all items of another list to the end of this one.
	 *
	 * @param source  A list to copy items from
	 */
	public copyFrom(source: this): void {
		this.pushAll(source._values);
	}

	/**
	 * Returns the last item from the list, and removes it.
	 *
	 * @return Item
	 */
	public pop(): Optional<T> {
		let index = this._values.length - 1;
		return index < 0 ? undefined : this.removeIndex(this._values.length - 1);
	}

	/**
	 * Returns the first item from the list, and removes it.
	 *
	 * @return Item
	 */
	public shift(): Optional<T> {
		return this._values.length ? this.removeIndex(0) : undefined;
	}

	/**
	 * Replaces all items in the list with `newArray`.
	 *
	 * @param newArray  New items
	 */
	public setAll(newArray: Array<T>): void {
		const old = this._values;
		this._values = [];
		this._onClear(old);

		$array.each(newArray, (value) => {
			this._values.push(value);
			this._onPush(value);
		});
	}

	/**
	 * Removes all items from the list.
	 */
	public clear(): void {
		this.setAll([]);
	}

	/**
	 * Returns an ES6 iterator for the list.
	 */
	public *[Symbol.iterator](): Iterator<T> {
		const length = this._values.length;

		for (let i = 0; i < length; ++i) {
			yield this._values[i];
		}
	}

	/**
	 * Calls `f` for each item in the list, with the item and its index.
	 */
	public each(f: (value: T, index: number) => void): void {
		$array.each(this._values, f);
	}

	/**
	 * Calls `f` for each item in the list, from last to first, with the item
	 * and its index.
	 */
	public eachReverse(f: (value: T, index: number) => void): void {
		$array.eachReverse(this._values, f);
	}
}


/**
 * A version of a [[List]] where the elements are disposed automatically when
 * removed from the list, unless `autoDispose` is set to `false`.
 */
export class ListAutoDispose<A extends IDisposer> extends List<A> implements IDisposer {
	/**
	 * Automatically disposes elements that are removed from the list.
	 *
	 * @default true
	 */
	public autoDispose: boolean = true;

	private _disposed: boolean = false;

	/**
	 * Swaps two items in the list, without disposing them.
	 *
	 * @param a  Index of the first item
	 * @param b  Index of the second item
	 */
	public swap(a: number, b: number): void {
		const currentAutoDispose = this.autoDispose;
		this.autoDispose = false;
		super.swap(a, b);
		this.autoDispose = currentAutoDispose;
	}

	protected _onSetIndex(index: number, oldValue: A, newValue: A) {
		if (this.autoDispose) {
			oldValue.dispose();
		}

		super._onSetIndex(index, oldValue, newValue);
	}

	protected _onRemoveIndex(index: number, oldValue: A) {
		if (this.autoDispose) {
			oldValue.dispose();
		}

		super._onRemoveIndex(index, oldValue);
	}

	protected _onClear(oldValues: Array<A>) {
		if (this.autoDispose) {
			$array.each(oldValues, (x) => {
				x.dispose();
			});
		}

		super._onClear(oldValues);
	}

	protected _dispose() {
		if (this.autoDispose) {
			$array.each(this._values, (x) => {
				x.dispose();
			});
		}
	}

	public isDisposed(): boolean {
		return this._disposed;
	}

	public dispose(): void {
		if (!this._disposed) {
			this._disposed = true;
			this._dispose();
		}
	}
}


/**
 * A version of a [[List]] that is able to create new elements as well as
 * apply additional settings to newly created items.
 *
 * @see {@link https://docs.amcharts.com/v5/concepts/settings/list-templates/} for more info
 */
export class ListTemplate<A extends Entity> extends ListAutoDispose<A> {
	public template: Template<A>;
	public make: () => A;

	constructor(template: Template<A>, make: () => A) {
		super();
		this.template = template;
		this.make = make;
	}

	protected _dispose() {
		super._dispose();

		if (this.autoDispose) {
			this.template.dispose();
		}
	}
}

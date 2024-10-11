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
	clear: {
		oldValues: Array<A>,
	};
	push: {
		newValue: A,
	};
	insertIndex: {
		index: number,
		newValue: A,
	};
	setIndex: {
		index: number,
		oldValue: A,
		newValue: A,
	};
	removeIndex: {
		index: number,
		oldValue: A,
	};
	moveIndex: {
		oldIndex: number,
		newIndex: number,
		value: A,
	};
}


/**
 * A List class is used to hold a number of indexed items of the same type.
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
	 * @param initial  Inital list of values to add to list
	 */
	constructor(initial: Array<T> = []) {
		this._values = initial;
	}

	/**
	 * An array of values in the list.
	 *
	 * Do not use this property to add values. Rather use dedicated methods, like
	 * `push()`, `removeIndex()`, etc.
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
	 * @param item  Item to search for
	 * @return `true` if found, `false` if not found
	 */
	public contains(value: T): boolean {
		return this._values.indexOf(value) !== -1;
	}

	/**
	 * Removes specific item from the list.
	 *
	 * @param item An item to remove
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
	 * @param item  An item to search for
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
	 * Sets value at specific index.
	 *
	 * If there's already a value at the index, it is overwritten.
	 *
	 * @param index  Index
	 * @param value  New value
	 * @return New value
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
	 * Adds an item to the list at a specific index, which pushes all the other
	 * items further down the list.
	 *
	 * @param index Index
	 * @param item  An item to add
	 */
	public insertIndex<K extends T>(index: number, value: K): K {
		checkBounds(index, this._values.length + 1);

		$array.insertIndex(this._values, index, value);
		this._onInsertIndex(index, value);
		return value;
	}

	/**
	 * Swaps indexes of two items in the list.
	 *
	 * @param a  Item 1
	 * @param b  Item 2
	 */
	public swap(a: number, b: number): void {
		const len = this._values.length;

		checkBounds(a, len);
		checkBounds(b, len);

		if (a !== b) {
			const value_a = this._values[a];
			const value_b = this._values[b];

			this._values[a] = value_b;
			this._onSetIndex(a, value_a, value_b);

			this._values[b] = value_a;
			this._onSetIndex(b, value_b, value_a);
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
	 * Moves an item to a specific index within the list.
	 *
	 * If the index is not specified it will move the item to the end of the
	 * list.
	 *
	 * @param value  Item to move
	 * @param index  Index to place item at
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
	 * @param item  An item to add
	 */
	public push<K extends T>(value: K): K {
		this._values.push(value);
		this._onPush(value);
		return value;
	}

	/**
	 * Adds an item as a first item in the list.
	 *
	 * @param item  An item to add
	 */
	public unshift<K extends T>(value: K): K {
		this.insertIndex(0, value);
		return value;
	}

	/**
	 * Adds multiple items to the list.
	 *
	 * @param items  An Array of items to add
	 */
	public pushAll(values: Array<T>): void {
		$array.each(values, (value) => {
			this.push(value);
		});
	}

	/**
	 * Copies and adds items from abother list.
	 *
	 * @param source  A list top copy items from
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
	 * Sets multiple items to the list.
	 *
	 * All current items are removed.
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
	 * Calls `f` for each element in the list.
	 *
	 * `f` should have at least one parameter defined which will get a current
	 * item, with optional second argument - index.
	 */
	public each(f: (value: T, index: number) => void): void {
		$array.each(this._values, f);
	}

	/**
	 * Calls `f` for each element in the list, from right to left.
	 *
	 * `f` should have at least one parameter defined which will get a current
	 * item, with optional second argument - index.
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
 * @see {@link https://www.amcharts.com/docs/v5/concepts/settings/list-templates/} for more info
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

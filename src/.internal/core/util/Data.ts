import type { ICounterRef } from "./Counter";
import { List } from "./List";
import type { DataProcessor } from "./DataProcessor";

/**
 * Defines interface for a [[List]] with a data processor.
 */
export interface IDataWithProcessor {

	/**
	 * An optional processor for data.
	 *
	 * @see {@link https://docs.amcharts.com/v5/concepts/data/#pre-processing-data} for more info
	 */
	processor?: DataProcessor;

}

/**
 * A [[List]] that holds a component's data.
 *
 * @see {@link https://docs.amcharts.com/v5/concepts/data/} for more info
 */
export class ListData<T> extends List<T> implements ICounterRef, IDataWithProcessor {

	/**
	 * @ignore
	 */
	public incrementRef(): void { }

	/**
	 * @ignore
	 */
	public decrementRef(): void { }

	/**
	 * A [[DataProcessor]] that processes each data item as it is added or
	 * replaced.
	 *
	 * @see {@link https://docs.amcharts.com/v5/concepts/data/#pre-processing-data} for more info
	 */
	public processor?: DataProcessor;

	protected _onPush(newValue: T) {
		if (this.processor) {
			this.processor.processRow(newValue);
		}
		super._onPush(newValue);
	}

	protected _onInsertIndex(index: number, newValue: T) {
		if (this.processor) {
			this.processor.processRow(newValue);
		}
		super._onInsertIndex(index, newValue);
	}

	protected _onSetIndex(index: number, oldValue: T, newValue: T) {
		if (this.processor) {
			this.processor.processRow(newValue);
		}
		super._onSetIndex(index, oldValue, newValue);
	}

	/**
	 * Components that take all rows of a `setAll()` at once instead of a push
	 * event per row: `callback` is their data listener, `pushed` gets the rows.
	 *
	 * @ignore
	 */
	public _bulk: Array<{ callback: any, pushed: (rows: Array<T>) => void }> = [];

	public setAll(newArray: Array<T>): void {
		const bulk = this._bulk;
		// a push event per row, unless only those components hear them
		if (bulk.length == 0 || !this.events.isEnabled("push") || !this.events._onlyCallbacks("push", bulk.map((b) => b.callback))) {
			super.setAll(newArray);
			return;
		}

		const old = this._values;
		this._values = [];
		this._batchDepth++;

		try {
			this._onClear(old);

			const values = this._values;
			const processor = this.processor;
			for (let i = 0, len = newArray.length; i < len; i++) {
				const value = newArray[i];
				values.push(value);
				if (processor) {
					processor.processRow(value);
				}
			}

			const targets = bulk.slice();
			for (let i = 0; i < targets.length; i++) {
				targets[i].pushed(values);
			}

		} finally {
			if (--this._batchDepth === 0) {
				this._runBatchEnd();
			}
		}
	}
}

/**
 * @deprecated
 * @todo remove
 */
export class JsonData<T> implements ICounterRef, IDataWithProcessor {
	public incrementRef(): void { }
	public decrementRef(): void { }

	public processor?: DataProcessor;
	protected _value: T;

	constructor(value: T) {
		this._value = value;
	}

	// TODO: how do we go about calling processor here?

}

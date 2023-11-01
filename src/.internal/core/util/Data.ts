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
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/data/#Pre_processing_data} for more info
	 */
	processor?: DataProcessor;

}

/**
 * A [[List]] that holds components data.
 * 
 * @see {@link https://www.amcharts.com/docs/v5/concepts/data/} for more info
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
	 * An optional processor for data.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/data/#Pre_processing_data} for more info
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

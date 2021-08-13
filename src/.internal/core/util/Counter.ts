/**
 * @ignore
 */
export interface ICounterRef {
	incrementRef(): void;
	decrementRef(): void;
}

/**
 * @ignore
 */
export class CounterRef {
	protected _refs: number = 0;
	protected _disposed: boolean = false;
	protected _dispose: () => void;

	constructor(f: () => void) {
		this._dispose = f;
	}

	incrementRef() {
		++this._refs;
	}

	decrementRef() {
		--this._refs;

		if (this._refs <= 0) {
			if (!this._disposed) {
				this._disposed = true;
				this._dispose();
			}
		}
	}
}

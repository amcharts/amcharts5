export class Throttler {
	private _ready: boolean = true;
	private _pending: boolean = false;
	private _fn: () => void;

	constructor(fn: () => void) {
		this._fn = fn;
	}

	public run(): void {
		if (this._ready) {
			this._ready = false;
			this._pending = false;

			requestAnimationFrame(() => {
				this._ready = true;

				if (this._pending) {
					this.run();
				}
			});

			this._fn();

		} else {
			this._pending = true;
		}
	}
}

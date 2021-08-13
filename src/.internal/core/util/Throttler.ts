export class Throttler {
	private _ready: boolean = true;
	private _fn: (() => void) | null = null;

	public throttle(f: () => void): void {
		if (this._ready) {
			this._ready = false;

			f();

			requestAnimationFrame(() => {
				this._ready = true;

				if (this._fn !== null) {
					this._fn();
					this._fn = null;
				}
			});

		} else {
			this._fn = f;
		}
	}
}

import { List } from "./List";
import type { IDisposer } from "./Disposer";
import type { Container } from "../render/Container";
import type { Sprite } from "../render/Sprite";
import * as $array from "./Array";

/**
 * A version of [[List]] to hold children of the [[Container]].
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/common-elements/containers/} for more info
 */
export class Children<A extends Sprite> extends List<A> implements IDisposer {
	private _disposed: boolean = false;
	private _container: Container;
	private _events: IDisposer;

	public constructor(container: Container) {
		super();

		this._container = container;

		this._events = this.events.onAll((change) => {
			if (change.type === "clear") {
				$array.each(change.oldValues, (x) => {
					this._onRemoved(x);
				});

			} else if (change.type === "push") {
				this._onInserted(change.newValue);

			} else if (change.type === "setIndex") {
				this._onRemoved(change.oldValue);
				this._onInserted(change.newValue, change.index);

			} else if (change.type === "insertIndex") {
				this._onInserted(change.newValue, change.index);

			} else if (change.type === "removeIndex") {
				this._onRemoved(change.oldValue);

			} else if (change.type === "moveIndex") {
				this._onRemoved(change.value);
				this._onInserted(change.value, change.newIndex);

			} else {
				throw new Error("Unknown IListEvent type");
			}
		});
	}

	protected _onInserted(child: A, index?: number) {
		child._setParent(this._container, true);
		const childrenDisplay = this._container._childrenDisplay;
		if (index === undefined) {
			childrenDisplay.addChild(child._display);

		} else {
			childrenDisplay.addChildAt(child._display, index);
		}
	}

	protected _onRemoved(child: A) {
		this._container._childrenDisplay.removeChild(child._display);
		this._container.markDirtyBounds();
		this._container.markDirty();
	}

	/**
	 * Returns `true` if obejct is disposed.
	 */
	public isDisposed(): boolean {
		return this._disposed;
	}

	/**
	 * Permanently dispose this object.
	 */
	public dispose() {
		if (!this._disposed) {
			this._disposed = true;

			this._events.dispose();

			$array.each(this.values, (child) => {
				child.dispose();
			});
		}
	}
}

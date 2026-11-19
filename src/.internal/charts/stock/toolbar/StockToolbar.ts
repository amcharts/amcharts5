import type { IDisposer } from "../../../core/util/Disposer";
import type { StockChart } from "../StockChart";
import type { StockControl } from "./StockControl";

import { Entity, IEntitySettings, IEntityPrivate, IEntityEvents } from "../../../core/util/Entity"
import StockToolbarCSS from "./StockToolbarCSS";

import * as $array from "../../../core/util/Array";
import * as $utils from "../../../core/util/Utils";
import { ResizeSensor } from "../../../core/util/ResizeSensor";
//import * as $type from "../../../core/util/Type";

export interface IStockToolbarSettings extends IEntitySettings {

	/**
	 * The [[StockChart]] the toolbar is for.
	 */
	stockChart: StockChart;

	/**
	 * The HTML element the toolbar's buttons are placed in.
	 */
	container: HTMLElement;

	/**
	 * Controls to show in the toolbar, in order.
	 */
	controls?: StockControl[];

	/**
	 * Loads the toolbar's default CSS. Set to `false` to style it yourself.
	 *
	 * @default true
	 */
	useDefaultCSS?: boolean;

	/**
	 * Folds the controls when they do not fit in one row, a step at a time:
	 * first the labels of Indicators, Draw, Comparison and the series type
	 * control, which keep their icons, then the period buttons, into one
	 * button that opens them as a list. Needs the default CSS. The
	 * ResponsiveMax theme turns it on.
	 *
	 * @default false
	 * @since 5.23.0
	 */
	autoFit?: boolean;

	/**
	 * Has no effect: the toolbar does not use it.
	 */
	deactivateRoot?: boolean;

	/**
	 * Setting this to `true` will essentially enable accessibility for the
	 * toolbar items.
	 *
	 * E.g. buttons will be focusable using TAB key. Lists navigable using arrow
	 * keys, etc.
	 *
	 * @default true
	 */
	focusable?: boolean;

}

export interface IStockToolbarPrivate extends IEntityPrivate {
}

export interface IStockToolbarEvents extends IEntityEvents {
	/**
	 * The toolbar was built, with its controls added.
	 */
	created: {}
}

/**
 * A toolbar of [[StockControl]] buttons for a [[StockChart]], placed in an
 * HTML element outside the chart.
 *
 * @see {@link https://docs.amcharts.com/v5/charts/stock/toolbar/} for more info
 */
export class StockToolbar extends Entity {
	public static className: string = "StockToolbar";
	public static classNames: Array<string> = Entity.classNames.concat([StockToolbar.className]);

	declare public _settings: IStockToolbarSettings;
	declare public _privateSettings: IStockToolbarPrivate;
	declare public _events: IStockToolbarEvents;

	private _cssDisposer?: IDisposer;
	private _resizeSensor?: ResizeSensor;
	private _fitFrame?: number;

	protected _afterNew() {
		super._afterNew();

		// Inherit default themes from chart
		this._defaultThemes = this.get("stockChart")._defaultThemes;
		super._afterNewApplyThemes();

		this._initControls();
		this.loadDefaultCSS();

		const container = this.get("container");
		if (container) {
			this._resizeSensor = new ResizeSensor(container, () => {
				this._fitLater();
			});
		}
		this._fitLater();

		this._root.addDisposer(this);

		this.events.dispatch("created", {
			type: "created",
			target: this
		});
	}

	public _afterChanged() {
		super._afterChanged();

		if (this.isDirty("container")) {
			// TODO
		}

		if (this.isDirty("useDefaultCSS")) {
			if (this.get("useDefaultCSS")) {
				this.loadDefaultCSS();
			}
			else if (this._cssDisposer) {
				this._cssDisposer.dispose();
			}
		}

		if (this.isDirty("controls")) {
			this._initControls();
		}

		if (this.isDirty("controls") || this.isDirty("autoFit") || this.isDirty("useDefaultCSS")) {
			this._fitLater();
		}
	}

	protected _dispose(): void {
		super._dispose();

		if (this._cssDisposer) {
			this._cssDisposer.dispose();
		}

		if (this._resizeSensor) {
			this._resizeSensor.dispose();
		}
		if (this._fitFrame !== undefined) {
			cancelAnimationFrame(this._fitFrame);
		}

		const controls = this.get("controls", []);
		$array.each(controls, (control, _index) => {
			control.dispose();
		});
	}

	private _initControls(): void {
		const controls = this.get("controls", []);
		$array.each(controls, (control, _index) => {
			if (!control.getPrivate("toolbar")) {
				// @todo insert at specific index
				control.setPrivate("toolbar", this);
				this.get("container")!.appendChild(control.getPrivate("button")!);
			}
		});
	}

	// after the layout, so the fit is measured once per frame and a fold does not resize the container mid-callback
	protected _fitLater(): void {
		if (this._fitFrame === undefined && !this.isDisposed()) {
			this._fitFrame = requestAnimationFrame(() => {
				this._fitFrame = undefined;
				this.fit();
			});
		}
	}

	/**
	 * Folds the controls step by step until they fit in one row (see
	 * `autoFit`). The toolbar does this itself when its container is resized
	 * or its controls change; call it after changing a control's label.
	 *
	 * @since 5.23.0
	 */
	public fit(): void {
		const container = this.get("container");
		if (!container || this.isDisposed()) {
			return;
		}
		const folds = ["am5stock-fold-labels", "am5stock-fold-periods"];
		$array.each(folds, (fold) => {
			$utils.removeClass(container, fold);
		});
		let folded = 0;
		if (this.get("autoFit") && this.get("useDefaultCSS") !== false) {
			while (folded < folds.length && !this._inOneRow()) {
				$utils.addClass(container, folds[folded]);
				folded++;
			}
		}
		if (folded < 2) {
			// the period list is shown as buttons again
			$array.each(container.querySelectorAll(".am5stock-periods-open"), (button) => {
				$utils.removeClass(button as HTMLElement, "am5stock-periods-open");
			});
		}
	}

	// whether the shown buttons are in one row: each overlaps the shortest vertically
	protected _inOneRow(): boolean {
		let maxTop = -Infinity;
		let minBottom = Infinity;
		$array.each(this.get("controls", []), (control) => {
			const button = control.getPrivate("button");
			if (button && button.getClientRects().length) {
				const rect = button.getBoundingClientRect();
				maxTop = Math.max(maxTop, rect.top);
				minBottom = Math.min(minBottom, rect.bottom);
			}
		});
		return maxTop < minBottom;
	}

	/**
	 * Loads the default CSS.
	 *
	 * @ignore Exclude from docs
	 */
	public loadDefaultCSS(): void {
		if (this._cssDisposer) {
			this._cssDisposer.dispose();
		}
		const disposer = StockToolbarCSS($utils.getShadowRoot(this._root.dom), this._root);
		this._disposers.push(disposer);
		this._cssDisposer = disposer;
	}

}
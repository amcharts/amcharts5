import { Directive, ElementRef, ErrorHandler, EventEmitter, Input, NgZone, OnChanges, OnDestroy, Output, SimpleChanges, afterNextRender, inject } from "@angular/core";
import type { Root } from "@amcharts/amcharts5";

/**
 * What `(amChartReady)` gets.
 */
export interface AmChartReadyEvent {

	/**
	 * The chart's root.
	 */
	root: Root;

	/**
	 * What the setup function returned.
	 */
	result: unknown;

}

function same(a: Array<unknown> | undefined, b: Array<unknown> | undefined): boolean {
	const x = a || [];
	const y = b || [];
	return x.length === y.length && x.every((value, i) => Object.is(value, y[i]));
}

/**
 * A chart written in code, in the element the directive is on. The function
 * gets a new root and builds the chart in it, as in any amCharts example. The
 * root is disposed when the element goes away. The element needs a height.
 *
 * ```html
 * <div [amChart]="buildChart" [amChartDeps]="[data]" style="height: 400px"></div>
 * ```
 *
 * The library is loaded in the browser only, and the chart runs outside
 * Angular's zone, so its animation frames do not run change detection.
 */
@Directive({
	selector: "[amChart]",
	standalone: true,
})
export class AmChartDirective implements OnChanges, OnDestroy {

	/**
	 * Builds the chart in the root it gets. Write it as an arrow function
	 * property, so that `this` is the component.
	 */
	@Input("amChart") setup?: (root: Root) => unknown;

	/**
	 * Values that make the chart again, with the function run again, when one
	 * of them changes.
	 */
	@Input() amChartDeps?: Array<unknown>;

	/**
	 * `"svg"` draws the chart as SVG instead of canvas.
	 */
	@Input() amChartRenderer: "canvas" | "svg" = "canvas";

	/**
	 * The chart is built: its root, and what the function returned.
	 */
	@Output() amChartReady = new EventEmitter<AmChartReadyEvent>();

	/**
	 * The chart could not be built: the error. It goes to Angular's
	 * ErrorHandler too.
	 */
	@Output() amChartError = new EventEmitter<unknown>();

	private _host: ElementRef<HTMLElement> = inject(ElementRef);
	private _zone: NgZone = inject(NgZone);
	private _errorHandler: ErrorHandler = inject(ErrorHandler);
	private _browser = false;
	private _root: Root | undefined;
	private _build = 0;

	constructor() {
		afterNextRender(() => {
			this._browser = true;
			this._make();
		});
	}

	public ngOnChanges(changes: SimpleChanges): void {
		if (!this._browser) {
			return;
		}
		const deps = changes["amChartDeps"];
		// Keyed by the property's name, not by its alias amChart
		const setup = changes["setup"];
		// A new function alone does not make the chart again, but a first one does
		if ((deps && !same(deps.previousValue, deps.currentValue)) || changes["amChartRenderer"] || (setup && !setup.previousValue && setup.currentValue && !this._root)) {
			this._make();
		}
	}

	public ngOnDestroy(): void {
		this._dispose();
	}

	private _dispose(): void {
		this._build++;
		if (this._root) {
			this._root.dispose();
			this._root = undefined;
		}
	}

	private _make(): void {
		this._dispose();
		const id = this._build;
		const setup = this.setup;
		const renderer = this.amChartRenderer;

		this._zone.runOutsideAngular(() => {
			import("@amcharts/amcharts5").then((am5) => {
				if (id !== this._build || !setup) {
					return;
				}
				const root = am5.Root.new(this._host.nativeElement, renderer === "svg" ? { renderer: am5.SVGRenderer } : {});
				this._root = root;
				let result: unknown;
				try {
					result = setup(root);
				}
				catch (error) {
					// No half-made chart
					this._dispose();
					this._fail(error);
					return;
				}
				// Back in the zone: the component may update its view
				this._zone.run(() => {
					this.amChartReady.emit({ root: root, result: result });
				});

			}).catch((error) => {
				// The library could not be loaded
				if (id === this._build) {
					this._fail(error);
				}
			});
		});
	}

	private _fail(error: unknown): void {
		this._zone.run(() => {
			this._errorHandler.handleError(error);
			this.amChartError.emit(error);
		});
	}
}

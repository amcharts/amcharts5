import { Component, ElementRef, EventEmitter, Input, NgZone, OnChanges, OnDestroy, Output, afterNextRender, inject } from "@angular/core";
import type { Theme } from "@amcharts/amcharts5";
import type { ChartElement, IChartElementReadyEvent } from "@amcharts/amcharts5/element";

// Theme classes are told apart by identity: each gets a number
const themeKeys = new WeakMap<object, number>();
let themeCount = 0;

function themeKey(theme: object): number {
	let key = themeKeys.get(theme);
	if (key === undefined) {
		key = ++themeCount;
		themeKeys.set(theme, key);
	}
	return key;
}

/**
 * A chart built from a JSON config, with no chart code.
 *
 * ```html
 * <am5-chart [config]="config" [themes]="themes" (amChartReady)="onReady($event)" style="height: 400px"></am5-chart>
 * ```
 *
 * It is the library's `<am5-chart>` element, with inputs and outputs Angular
 * can check: the component gives the element its config once the element's
 * code has loaded, in the browser only.
 */
@Component({
	selector: "am5-chart",
	standalone: true,
	template: "",
})
export class AmChartComponent implements OnChanges, OnDestroy {

	/**
	 * The chart as a JSON config: an object, or a JSON string. A config with
	 * different content makes the chart again.
	 */
	@Input() config?: object | string;

	/**
	 * Where to load the config from, when there is no `config`.
	 */
	@Input() src?: string;

	/**
	 * Themes, as theme classes, e.g. `[am5themes_Animated]`. Themes are not
	 * part of a config.
	 */
	@Input() themes?: Array<typeof Theme>;

	/**
	 * `"svg"` draws the chart as SVG instead of canvas.
	 */
	@Input() renderer: "canvas" | "svg" = "canvas";

	/**
	 * The chart is built: its root, and the chart.
	 */
	@Output() amChartReady = new EventEmitter<IChartElementReadyEvent>();

	/**
	 * The chart could not be built: the error.
	 */
	@Output() amChartError = new EventEmitter<unknown>();

	private _host: ElementRef<ChartElement> = inject(ElementRef);
	private _zone: NgZone = inject(NgZone);
	private _defined = false;
	private _applied: string | undefined;

	// The element's own ready and error events, as outputs with other names:
	// Angular types an element's events as Event, and would call a handler
	// for an output of the same name with the element's event too. Back in
	// the zone, so that the component may update its view
	private _onReady = (event: Event) => {
		this._zone.run(() => this.amChartReady.emit((event as CustomEvent<IChartElementReadyEvent>).detail));
	};

	private _onError = (event: Event) => {
		this._zone.run(() => this.amChartError.emit((event as CustomEvent).detail));
	};

	constructor() {
		// In the browser only. Outside Angular's zone, so that the chart's
		// animation frames do not run change detection
		afterNextRender(() => {
			const target = this._host.nativeElement;
			target.addEventListener("ready", this._onReady);
			target.addEventListener("error", this._onError);

			this._zone.runOutsideAngular(() => {
				import("@amcharts/amcharts5/element").then(() => customElements.whenDefined("am5-chart")).then(() => {
					this._defined = true;
					this._apply();
				}).catch((error) => {
					console.error("am5-chart:", error);
				});
			});
		});
	}

	public ngOnChanges(): void {
		this._apply();
	}

	public ngOnDestroy(): void {
		const target = this._host.nativeElement;
		target.removeEventListener("ready", this._onReady);
		target.removeEventListener("error", this._onError);
	}

	// Until the element is defined it must not get properties: they would hide
	// the ones it gets when it is. Compared by content, so a config built in a
	// template does not make the chart again on every check
	private _apply(): void {
		if (!this._defined) {
			return;
		}

		const key = JSON.stringify([
			typeof this.config === "string" ? this.config : JSON.stringify(this.config),
			this.themes ? this.themes.map((theme) => themeKey(theme)) : [],
			this.src,
			this.renderer,
		]);

		if (key === this._applied) {
			return;
		}
		this._applied = key;

		const target = this._host.nativeElement;

		this._zone.runOutsideAngular(() => {
			if (this.renderer === "svg") {
				target.setAttribute("renderer", "svg");
			}
			else {
				target.removeAttribute("renderer");
			}

			if (this.src) {
				target.setAttribute("src", this.src);
			}
			else {
				target.removeAttribute("src");
			}

			// Nothing to nothing would only build the chart again
			if (this.themes !== undefined || target.themes !== undefined) {
				target.themes = this.themes;
			}
			if (this.config !== undefined || target.config !== undefined) {
				target.config = this.config;
			}
		});
	}
}

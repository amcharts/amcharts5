import type { Entity } from "../core/util/Entity";
import type { Theme } from "../core/Theme";
import { Root } from "../core/Root";
import { SVGRenderer } from "../core/render/backend/SVGRenderer";
import { JsonParser } from "../plugins/json/Json";

// Defining the element must not fail where there is no DOM (server rendering)
const BaseElement: typeof HTMLElement = (typeof HTMLElement !== "undefined" ? HTMLElement : class { } as any);

/**
 * Details of the element's `ready` event.
 *
 * @since 5.21.0
 */
export interface IChartElementReadyEvent {

	/**
	 * The chart's root element.
	 */
	root: Root;

	/**
	 * What the config built: usually the chart.
	 */
	chart: Entity;

}

/**
 * The events of `<am5-chart>`.
 *
 * @since 5.21.0
 */
export interface IChartElementEventMap {

	/**
	 * The chart is built.
	 */
	ready: CustomEvent<IChartElementReadyEvent>;

	/**
	 * The chart could not be built; `detail` has the error.
	 */
	error: CustomEvent<unknown>;

}

/**
 * A chart as an HTML element: `<am5-chart>`, built from a JSON config.
 *
 * ```html
 * <am5-chart themes="Animated" style="height: 400px" config='{ "type": "PieChart", ... }'></am5-chart>
 * ```
 *
 * The config is given with the `config` attribute or property (an object or
 * a JSON string), or loaded from a URL with `src`. Themes are not part of a
 * config: set them with the `themes` property (theme classes), or with the
 * `themes` attribute (names, for the script version, where each theme is a
 * global). `renderer="svg"` draws the chart as SVG.
 *
 * With script tags, load `index.js`, `plugins/json.js` and `element.js`, and
 * then the chart types the config uses, e.g. `percent.js`.
 *
 * The element dispatches `ready` when the chart is built, with `root` and
 * `chart` in its `detail`, and `error` when it could not be. A config given
 * in the page can be built before a script adds its listener: `whenReady()`
 * works whenever it is called.
 *
 * Without a height of its own, from CSS or its parent, the element is 400
 * pixels high.
 *
 * @see {@link https://www.amcharts.com/docs/v5/getting-started/integrations/am5-chart-element/} for more information
 * @see {@link https://www.amcharts.com/docs/v5/concepts/serializing/} for the config format
 * @since 5.21.0
 */
export class ChartElement extends BaseElement {

	/**
	 * @ignore
	 */
	public static get observedAttributes(): Array<string> {
		return ["config", "src", "themes", "renderer"];
	}

	/**
	 * The chart's root element, once it is built.
	 */
	public root: Root | undefined;

	/**
	 * What the config built, usually the chart, once it is built.
	 */
	public chart: Entity | undefined;

	protected _config: object | string | undefined;
	protected _themes: Array<typeof Theme> | undefined;
	protected _container: HTMLDivElement | undefined;
	protected _build: number = 0;
	protected _scheduled: boolean = false;
	protected _pending: boolean = false;
	protected _abort: AbortController | undefined;
	protected _sizer: ResizeObserver | undefined;

	// What whenReady() returns, and how to settle it while nobody has
	protected _ready: Promise<IChartElementReadyEvent> | undefined;
	protected _settle: { resolve: (value: IChartElementReadyEvent) => void, reject: (error: unknown) => void } | undefined;

	/**
	 * Returns a promise of the built chart. It resolves at once if the chart
	 * is already built, or once it is, and rejects if the build fails or the
	 * element is removed first. A new config makes a new chart and a new
	 * promise.
	 *
	 * @return  Promise of the root and the chart
	 */
	public whenReady(): Promise<IChartElementReadyEvent> {
		if (!this._ready) {
			this._ready = new Promise<IChartElementReadyEvent>((resolve, reject) => {
				this._settle = { resolve, reject };
			});
		}
		return this._ready;
	}

	protected _resolve(detail: IChartElementReadyEvent): void {
		if (this._settle) {
			this._settle.resolve(detail);
			this._settle = undefined;
		}
		else {
			this._ready = Promise.resolve(detail);
		}
	}

	protected _reject(error: unknown): void {
		if (this._settle) {
			this._settle.reject(error);
			this._settle = undefined;
		}
		else {
			this._ready = Promise.reject(error);
		}
		// Nobody has to be listening
		this._ready!.catch(() => { });
	}

	/**
	 * The chart's JSON config: an object, or a JSON string. Setting it builds
	 * the chart again.
	 */
	public get config(): object | string | undefined {
		return this._config !== undefined ? this._config : (this.getAttribute("config") || undefined);
	}

	public set config(value: object | string | undefined) {
		this._config = value;
		this._rebuild();
	}

	/**
	 * Themes for the chart, as theme classes, e.g. `[am5themes_Animated]`.
	 * Setting them builds the chart again.
	 */
	public get themes(): Array<typeof Theme> | undefined {
		return this._themes;
	}

	public set themes(value: Array<typeof Theme> | undefined) {
		this._themes = value;
		this._rebuild();
	}

	public addEventListener<K extends keyof IChartElementEventMap>(type: K, listener: (this: ChartElement, event: IChartElementEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
	public addEventListener<K extends keyof HTMLElementEventMap>(type: K, listener: (this: ChartElement, event: HTMLElementEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
	public addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
	public addEventListener(type: string, listener: any, options?: boolean | AddEventListenerOptions): void {
		super.addEventListener(type, listener, options);
	}

	public removeEventListener<K extends keyof IChartElementEventMap>(type: K, listener: (this: ChartElement, event: IChartElementEventMap[K]) => any, options?: boolean | EventListenerOptions): void;
	public removeEventListener<K extends keyof HTMLElementEventMap>(type: K, listener: (this: ChartElement, event: HTMLElementEventMap[K]) => any, options?: boolean | EventListenerOptions): void;
	public removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
	public removeEventListener(type: string, listener: any, options?: boolean | EventListenerOptions): void {
		super.removeEventListener(type, listener, options);
	}

	/**
	 * @ignore
	 */
	public connectedCallback(): void {
		// A property set before the element was defined hides its accessor
		for (const key of ["config", "themes"]) {
			if (Object.prototype.hasOwnProperty.call(this, key)) {
				const value = (this as any)[key];
				delete (this as any)[key];
				(this as any)[key] = value;
			}
		}

		// Unknown elements are inline, and a chart needs a box
		if (getComputedStyle(this).display === "inline") {
			this.style.display = "block";
		}
		this._size();

		// Moved: the chart stays
		if (!this.root && !this._pending) {
			this._rebuild();
		}
	}

	/**
	 * @ignore
	 */
	public disconnectedCallback(): void {
		// Moving the element disconnects and connects it in one go
		queueMicrotask(() => {
			if (!this.isConnected) {
				this._dispose();
				this._stopSizer();
				if (this._settle) {
					this._settle.reject(new Error("<am5-chart> was removed"));
					this._settle = undefined;
				}
				this._ready = undefined;
			}
		});
	}

	/**
	 * @ignore
	 */
	public attributeChangedCallback(name: string, previous: string | null, value: string | null): void {
		if (previous !== value && (name !== "config" || this._config === undefined)) {
			this._rebuild();
		}
	}

	// 400 pixels high when nothing gives it a height. Hidden, nothing has
	// one yet: decide when it is shown
	protected _size(): void {
		if (this.style.height) {
			return;
		}
		if (this.getClientRects().length === 0) {
			if (!this._sizer && typeof ResizeObserver !== "undefined") {
				this._sizer = new ResizeObserver(() => {
					if (this.getClientRects().length > 0) {
						this._stopSizer();
						this._size();
					}
				});
				this._sizer.observe(this);
			}
		}
		else if (this.clientHeight === 0) {
			this.style.height = "400px";
		}
	}

	protected _stopSizer(): void {
		if (this._sizer) {
			this._sizer.disconnect();
			this._sizer = undefined;
		}
	}

	protected _dispose(): void {
		this._build++;
		this._pending = false;
		if (this._abort) {
			this._abort.abort();
			this._abort = undefined;
		}
		if (this.root) {
			this.root.dispose();
		}
		this.root = undefined;
		this.chart = undefined;
		if (this._container) {
			this._container.remove();
			this._container = undefined;
		}
	}

	// Changes made together (attributes, then properties) build the chart once
	protected _rebuild(): void {
		// whenReady() from now on is for the new chart, and a build on its way
		// is for the old config
		if (!this._settle) {
			this._ready = undefined;
		}
		this._build++;
		if (!this._scheduled) {
			this._scheduled = true;
			queueMicrotask(() => {
				this._scheduled = false;
				this._make();
			});
		}
	}

	protected _make(): void {
		if (!this.isConnected) {
			return;
		}

		this._dispose();
		const build = this._build;
		this._pending = true;

		this._load().then((config) => {
			if (build !== this._build) {
				return;
			}
			if (config === undefined) {
				this._pending = false;
				return;
			}

			// Before the root, so that a wrong name leaves nothing behind
			const themes = this._themeClasses();

			const container = document.createElement("div");
			container.style.width = "100%";
			container.style.height = "100%";
			this.appendChild(container);
			this._container = container;

			const root = Root.new(container, this.getAttribute("renderer") === "svg" ? { renderer: SVGRenderer } : {});
			this.root = root;
			root.setThemes(themes.map((theme) => theme.new(root)));

			return JsonParser.new(root).parse(config, { parent: root.container }).then((chart) => {
				if (build === this._build) {
					this._pending = false;
					const detail = { root: root, chart: chart as Entity };
					this.chart = detail.chart;
					this._resolve(detail);
					this.dispatchEvent(new CustomEvent<IChartElementReadyEvent>("ready", { detail: detail }));
				}
			});

		}).catch((error) => {
			if (build === this._build) {
				// What was made of a chart that failed goes
				this._dispose();
				console.error("<am5-chart>:", error);
				this._reject(error);
				this.dispatchEvent(new CustomEvent("error", { detail: error }));
			}
		});
	}

	// The config as an object: from the property, the attribute, or `src`.
	// A config that is not JSON rejects, like any other failure
	protected _load(): Promise<object | undefined> {
		const config = this.config;

		if (config !== undefined) {
			return new Promise((resolve) => {
				resolve(typeof config === "string" ? JSON.parse(config) : config);
			});
		}

		const src = this.getAttribute("src");
		if (src) {
			const abort = typeof AbortController !== "undefined" ? new AbortController() : undefined;
			this._abort = abort;
			return fetch(src, abort ? { signal: abort.signal } : undefined).then((response) => {
				if (!response.ok) {
					throw new Error("Could not load " + src + ": " + response.status);
				}
				return response.json();
			});
		}

		return Promise.resolve(undefined);
	}

	// From the property, or from the names in the attribute: in the script
	// version a theme is the global am5themes_<name>
	protected _themeClasses(): Array<typeof Theme> {
		if (this._themes) {
			return this._themes;
		}

		const names = (this.getAttribute("themes") || "").split(/[\s,]+/).filter((name) => name !== "");

		return names.map((name) => {
			const theme = (window as any)["am5themes_" + name];
			if (!theme) {
				throw new Error("Unknown theme \"" + name + "\": load themes/" + name + ".js first, or set the themes property");
			}
			return theme;
		});
	}
}

/**
 * Registers `<am5-chart>`, or the element under another name. Loading the
 * module does this already; call it for a different name.
 *
 * @param  name  Element name, with a hyphen in it
 * @since 5.21.0
 */
export function defineChartElement(name: string = "am5-chart"): void {
	if (typeof customElements !== "undefined" && !customElements.get(name)) {
		// A name can only be used by one class
		customElements.define(name, name === "am5-chart" ? ChartElement : class extends ChartElement { });
	}
}

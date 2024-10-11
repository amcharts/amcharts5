import { Entity, IEntitySettings, IEntityPrivate, IEntityEvents } from "../../core/util/Entity"
import { Container } from "../../core/render/Container";
import { Picture } from "../../core/render/Picture";
import * as $utils from "../../core/util/Utils";
import * as $object from "../../core/util/Object";

import { p100 } from "../../core/util/Percent";

export interface IAnnotatorSettings extends IEntitySettings {

	/**
	 * Layer number to use for annotations.
	 *
	 * @default 1000
	 */
	layer?: number;

	/**
	 * Raw annotation info saved by MarkerJS.
	 */
	markerState?: any;

	/**
	 * MarkerArea settings in form of an object where keys are setting names and
	 * value is a setting value. E.g.:
	 *
	 * ```TypeScript
	 * let annotator = am5plugins_exporting.Annotator.new(root, {
	 *  markerSettings: {
	 *    defaultColorSet: ["red", "green", "blue"],
	 *    wrapText: true
	 *  }
	 *});
	 * ```
	 * ```JavaScript
	 * var annotator = am5plugins_exporting.Annotator.new(root, {
	 *  markerSettings: {
	 *    defaultColorSet: ["red", "green", "blue"],
	 *    wrapText: true
	 *  }
	 *});
	 * ```
	 *
	 * @see {@link https://markerjs.com/reference/classes/settings.html} for a full list of settings
	 * @since 5.7.4
	 */
	markerSettings?: {[index: string]: any};

	/**
	 * MarkerArea style settings for user interface elements.E.g.:
	 *
	 * ```TypeScript
	 * let annotator = am5plugins_exporting.Annotator.new(root, {
	 *  markerStyleSettings: {
	 *    toolboxColor: "#F472B6",
	 *    toolboxAccentColor: "#BE185D"
	 *  }
	 *});
	 * ```
	 * ```JavaScript
	 * var annotator = am5plugins_exporting.Annotator.new(root, {
	 *  markerStyleSettings: {
	 *    toolboxColor: "#F472B6",
	 *    toolboxAccentColor: "#BE185D"
	 *  }
	 *});
	 * ```
	 *
	 * @see {@link https://markerjs.com/reference/classes/settings.html} for a full list of settings
	 * @since 5.7.5
	 */
	markerStyleSettings?: {[index: string]: any};

}

export interface IAnnotatorPrivate extends IEntityPrivate {
}

export interface IAnnotatorEvents extends IEntityEvents {
}



/**
 * A plugin that can be used to annotate charts.
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/exporting/annotator/} for more info
 */
export class Annotator extends Entity {
	public static className: string = "Annotator";
	public static classNames: Array<string> = Entity.classNames.concat([Annotator.className]);

	declare public _settings: IAnnotatorSettings;
	declare public _privateSettings: IAnnotatorPrivate;
	declare public _events: IAnnotatorEvents;

	private _container?: Container;
	private _picture?: Picture;
	private _markerArea?: any;
	private _skipRender?: boolean = false;

	//public extraImages: Array<Root | IAnnotatorImageSource> = [];
	//public dataSources: any[] = [];

	protected _afterNew() {
		super._afterNew();
		this._setRawDefault("layer", 1000);
		this._root.addDisposer(this);
	}

	public _beforeChanged() {
		super._beforeChanged();

		if (this.isDirty("markerState")) {
			this._renderState();
		}
	}

	/**
	 * Triggers annotation mode on the chart. This will display UI toolbars and
	 * disable all interactions on the chart itself.
	 */
	public async open() {

		// Delay this so that it's not knocked off by closing of the ExportingMenu
		this.setTimeout(() => {
			this._root._renderer.interactionsEnabled = false;
		}, 100)

		const markerArea = await this.getMarkerArea();
		markerArea.show();
		this._picture!.hide(0);
		if (this.get("markerState")) {
			markerArea.restoreState(this.get("markerState"));
		}
	}

	public async _renderState() {
		const markerArea = await this.getMarkerArea();
		if (this.get("markerState")) {
			this._skipRender = true;
			markerArea.renderState(this.get("markerState"));
		}
	}

	/**
	 * Exists from annotation mode. All annotations remain visible on the chart.
	 */
	public async close() {
		//this._root._renderer.interactionsEnabled = true;
		const markerArea = await this.getMarkerArea();
		markerArea!.close();
		this._markerArea = undefined;
	}

	/**
	 * Exits from annotation mode. Any changes made during last session of the
	 * annotation editing are cancelled.
	 */
	public async cancel() {
		this._root._renderer.interactionsEnabled = true;
		const markerArea = await this.getMarkerArea();
		this._picture!.show(0);
		markerArea!.close();
		this._markerArea = undefined;
		//markerArea!.cancel();
	}

	/**
	 * All annotations are removed.
	 */
	public clear() {
		this.set("markerState", undefined);
		if (this._picture) {
			this._picture.set("src", "");
		}
	}

	public async toggle() {
		const markerArea = await this.getMarkerArea();
		if (markerArea.isOpen) {
			this.close();
		}
		else {
			this.open();
		}
	}

	protected _dispose(): void {
		super._dispose();

		if (this._markerArea && this._markerArea.isOpen) {
			this._markerArea.close();
		}
	}

	private async _maybeInit() {

		// Create layer canvas
		if (!this._container) {
			this._container = this._root.container.children.push(Container.new(this._root, {
				width: p100,
				height: p100,
				layer: this.get("layer"),
				interactiveChildren: false
			}));

			this._picture = this._container.children.push(Picture.new(this._root, {
				width: p100,
				height: p100
			}));
		}

		// Create MarkerArea
		if (!this._markerArea) {
			const markerjs2 = await this._getMarkerJS();
			const canvas = this._container._display.getCanvas();
			const markerArea = new markerjs2.MarkerArea(canvas);
			//markerArea.renderTarget = canvas;
			markerArea.uiStyleSettings.logoPosition = "right";
			markerArea.uiStyleSettings.zIndex = 20;
			markerArea.targetRoot = canvas.parentElement!;

			// Apply custom settings
			const markerSettings = this.get("markerSettings", {});
			$object.each(markerSettings, (key, value) => {
				markerArea.settings[key] = value;
			});

			const markerStyleSettings = this.get("markerStyleSettings", {});
			$object.each(markerStyleSettings, (key, value) => {
				markerArea.uiStyleSettings[key] = value;
			});

			this._disposers.push($utils.addEventListener(markerArea, "close", () => {
				this._root._renderer.interactionsEnabled = true;
				this._picture!.show(0);
				this._markerArea = undefined;
			}));

			this._disposers.push($utils.addEventListener(markerArea, "render", (event: any) => {
				const picture = this._picture!;
				picture.set("src", event.dataUrl);
				if (!this._skipRender) {
					this.set("markerState", event.state);
				}
				this._skipRender = false;
			}));

			this._markerArea = markerArea;
		}
	}

	/**
	 * @ignore
	 */
	private async _getMarkerJS(): Promise<any> {
		return await import(/* webpackChunkName: "markerjs2" */ "markerjs2");
	}

	/**
	 * An instance of MarkerJS's [[MarkerArea]].
	 *
	 * @see {@link https://markerjs.com/docs/getting-started} for more info
	 * @return MarkerArea
	 */
	public async getMarkerArea(): Promise<any> {
		await this._maybeInit();
		return this._markerArea;
	}

}

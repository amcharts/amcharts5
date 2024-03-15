import type { IPicture } from "./backend/Renderer";
import type { Color } from "../util/Color";

import { Sprite, ISpriteEvents, ISpriteSettings, ISpritePrivate } from "./Sprite";

import * as $type from "../util/Type";

export interface IPictureSettings extends ISpriteSettings {

	/**
	 * A source URI of the image.
	 *
	 * Can be relative or absolute URL, or data-uri.
	 */
	src?: string;

	/**
	 * CORS settings for loading the image. Defaults to "anonymous".
	 *
	 * @since 5.3.6
	 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/crossOrigin} for more info
	 */
	cors?: string | null;

	/**
	 * Color of the element's shadow.
	 *
	 * For this to work at least one of the following needs to be set as well:
	 * `shadowBlur`, `shadowOffsetX`, `shadowOffsetY`.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/colors-gradients-and-patterns/shadows/} for more info
	 */
	shadowColor?: Color | null;

	/**
	 * Blurriness of the the shadow.
	 *
	 * The bigger the number, the more blurry shadow will be.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/colors-gradients-and-patterns/shadows/} for more info
	 */
	shadowBlur?: number;

	/**
	 * Horizontal shadow offset in pixels.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/colors-gradients-and-patterns/shadows/} for more info
	 */
	shadowOffsetX?: number;

	/**
	 * Vertical shadow offset in pixels.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/colors-gradients-and-patterns/shadows/} for more info
	 */
	shadowOffsetY?: number;

	/**
	 * Opacity of the shadow (0-1).
	 *
	 * If not set, will use the same as `fillOpacity` of the element.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/colors-gradients-and-patterns/shadows/} for more info
	 */
	shadowOpacity?: number;

}

export interface IPicturePrivate extends ISpritePrivate {
}

export interface IPictureEvents extends ISpriteEvents {

	/**
	 * Invoked when picture is loaded.
	 */
	loaded: {};

	/**
	 * Invoked when picture load error happens.
	 */
	loaderror: {};
}

/**
 * Displays an image.
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/common-elements/images/} for more info
 * @important
 */
export class Picture extends Sprite {

	declare public _settings: IPictureSettings;
	declare public _privateSettings: IPicturePrivate;

	public _display: IPicture = this._root._renderer.makePicture(undefined);

	public static className: string = "Picture";
	public static classNames: Array<string> = Sprite.classNames.concat([Picture.className]);
	declare public _events: IPictureEvents;

	public _changed() {
		super._changed();

		if (this.isDirty("width")) {
			const width = this.get("width");
			this._display.width = $type.isNumber(width) ? width : undefined;
		}

		if (this.isDirty("height")) {
			const height = this.get("height");
			this._display.height = $type.isNumber(height) ? height : undefined;
		}

		if (this.isDirty("shadowColor")) {
			this._display.clear();
			const shadowColor = this.get("shadowColor");
			this._display.shadowColor = shadowColor == null ? undefined : shadowColor;
		}

		if (this.isDirty("shadowBlur")) {
			this._display.clear();
			this._display.shadowBlur = this.get("shadowBlur");
		}

		if (this.isDirty("shadowOffsetX")) {
			this._display.clear();
			this._display.shadowOffsetX = this.get("shadowOffsetX");
		}

		if (this.isDirty("shadowOffsetY")) {
			this._display.clear();
			this._display.shadowOffsetY = this.get("shadowOffsetY");
		}

		if (this.isDirty("shadowOpacity")) {
			this._display.clear();
			this._display.shadowOpacity = this.get("shadowOpacity");
		}

		if (this.isDirty("src") || this.isDirty("cors")) {
			this._display.clear();
			this._load();
		}
	}

	protected _load() {
		const src = this.get("src");
		if (src) {
			const image = new Image();
			image.crossOrigin = this.get("cors", "anonymous");
			image.src = src!;
			const events = this.events;
			
			image.decode().then(() => {
				this._display.image = image;
				this._updateSize();
				if (!events.isDisposed() && events.isEnabled("loaded")) {
					events.dispatch("loaded", { type: "loaded", target: this });
				}
			}).catch((_error: any) => {
				if (!events.isDisposed() && events.isEnabled("loaderror")) {
					events.dispatch("loaderror", { type: "loaderror", target: this });
				}
			});

		}
	}

	public _updateSize() {
		super._updateSize();

		const image = this._display.image;
		if (image) {
			let w = this.getPrivate("width", this.get("width"));
			let h = this.getPrivate("height", this.get("height"));
			const r = image.width && image.height ? image.width / image.height : 0;

			if ($type.isNumber(w) && $type.isNumber(h)) {
				this._display.width = w;
				this._display.height = h;
			}
			else if ($type.isNumber(w) && r) {
				h = w / r;
			}
			else if ($type.isNumber(h) && r) {
				w = h * r;
			}
			else {
				w = image.width;
				h = image.height;
			}

			if ($type.isNumber(w)) {
				this._display.width = w;
			}
			if ($type.isNumber(h)) {
				this._display.height = h;
			}
			this.markDirtyBounds();
			this.markDirty();
		}
	}
}

import type { Root } from "../Root";
import { Sprite, ISpriteSettings, ISpritePrivate } from "./Sprite";
import type { IPicture } from "./backend/Renderer";
import type { Template } from "../../core/util/Template";
import * as $type from "../util/Type";

export interface IPictureSettings extends ISpriteSettings {

	/**
	 * A source URI of the image.
	 *
	 * Can be relative or absolute URL, or data-uri.
	 */
	src?: string;

}

export interface IPicturePrivate extends ISpritePrivate {
}

/**
 * Displays an image.
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/common-elements/images/} for more info
 * @important
 */
export class Picture extends Sprite {

	/**
	 * Use this method to create an instance of this class.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/getting-started/#New_element_syntax} for more info
	 * @param   root      Root element
	 * @param   settings  Settings
	 * @param   template  Template
	 * @return            Instantiated object
	 */
	public static new(root: Root, settings: Picture["_settings"], template?: Template<Picture>): Picture {
		const x = new Picture(root, settings, true, template);
		x._afterNew();
		return x;
	}

	declare public _settings: IPictureSettings;
	declare public _privateSettings: IPicturePrivate;

	public _display: IPicture = this._root._renderer.makePicture(undefined);

	public static className: string = "Picture";
	public static classNames: Array<string> = Sprite.classNames.concat([Picture.className]);

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

		if (this.isDirty("src")) {
			this._display.clear();
			this._load();
		}
	}

	protected _load() {
		const src = this.get("src");
		if (src) {
			const image = new Image();
			//image.crossOrigin = "Anonymous";
			image.src = src!;
			image.decode().then(() => {
				this._display.image = image;
				this.markDirty();
			}).catch((_error: any) => {
				// TODO: maybe raise error?
			});
		}
	}

	// TODO: Needed?
	// public _updateSize() {
	// 	this.markDirty()
	// }
}

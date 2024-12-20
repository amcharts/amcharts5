import { Pattern, IPatternSettings, IPatternPrivate, IPatternEvents } from "./Pattern";

export interface IPicturePatternSettings extends IPatternSettings {

	/**
	 * A source URI of the image.
	 *
	 * Can be relative or absolute URL, or data-uri.
	 */
	src?: string;

	/**
	 * How pattern should be sized:
	 *
	 * * `"image"` (default) - pattern will be sized to actual image dimensions.
	 * * `"pattern"` - image will sized to image dimensions.
	 * * `"none"` - image will be placed in the pattern, regardless of either dimensions.
	 * 
	 * @default "image"
	 */
	fit?: "image" | "pattern" | "none";

	/**
	 * Center images.
	 *
	 * @default true
	 */
	centered?: boolean;



	canvas?: HTMLCanvasElement;

}

export interface IPicturePatternPrivate extends IPatternPrivate {
}

export interface IPicturePatternEvents extends IPatternEvents {

	/**
	 * Invoked when related image is loaded.
	 */
	loaded: {};

}

/**
 * Picture pattern.
 *
 * @since 5.2.15
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/colors-gradients-and-patterns/patterns/} for more info
 */
export class PicturePattern extends Pattern {
	declare public _settings: IPicturePatternSettings;
	declare public _privateSettings: IPicturePatternPrivate;
	declare public _events: IPicturePatternEvents;

	public static className: string = "PicturePattern";
	public static classNames: Array<string> = Pattern.classNames.concat([PicturePattern.className]);

	public _image: HTMLImageElement | undefined;

	public _beforeChanged() {
		super._beforeChanged();

		this._clear = true;

		if (this.isDirty("src")) {
			this._load();
		}

		const canvas = this.get("canvas");
		if (canvas) {
			this.set("width", canvas.width);
			this.set("height", canvas.height)
		}
	}

	protected _draw() {
		super._draw();

		const colorOpacity = this.get("colorOpacity");
		if (colorOpacity !== undefined) {
			this._display.alpha = Math.max(0, colorOpacity);
		}

		const image = this._image;
		if (image) {
			const patternWidth = this.get("width", 100);
			const patternHeight = this.get("height", 100);

			// Fit
			const fit = this.get("fit", "image");
			let width = 0;
			let height = 0;
			if (fit == "pattern") {
				width = patternWidth;
				height = patternHeight;
				this.markDirty();
			}
			else {
				width = image.width;
				height = image.height;
				if (fit == "image") {
					this.set("width", width);
					this.set("height", height);
				}
			}

			// Position
			const centered = this.get("centered", true);
			let x = 0;
			let y = 0;
			if (centered) {
				x = patternWidth / 2 - width / 2;
				y = patternHeight / 2 - height / 2;
			}
			this._display.image(image, width, height, x, y);
		}

		const canvas = this.get("canvas");
		if (canvas) {
			this._display.image(canvas, canvas.width, canvas.height, 0, 0);
		}

	}

	protected _load() {
		const src = this.get("src");
		if (src) {
			const image = new Image();
			//image.crossOrigin = "Anonymous";
			image.src = src!;
			image.decode().then(() => {
				this._image = image;
				this._draw();
				if (this.events.isEnabled("loaded")) {
					this.events.dispatch("loaded", { type: "loaded", target: this });
				}
			}).catch((_error: any) => {
				// TODO: maybe raise error?
			});
		}
	}

}
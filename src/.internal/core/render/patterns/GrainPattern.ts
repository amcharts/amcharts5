import { Pattern, IPatternSettings, IPatternPrivate } from "./Pattern";
import { Color } from "../../util/Color";

export interface IGrainPatternSettings extends IPatternSettings {

	/**
	 * Size of a grain in pixels.
	 *
	 * @default 1
	 */
	size?: number;

	/**
	 * Density of noise.
	 *
	 * Value range: `0` (no noise applied) to `1` (noise is applied to every
	 * pixel).
	 *
	 * The bigger the value, the higher chance that pixel will have another pixel
	 * painted over with random opacity from `minOpacity` to `maxOpacity`.
	 *
	 * @default 1
	 */
	density?: number;

	/**
	 * Minimum opacity of a noise pixel.
	 *
	 * @default 0
	 */
	minOpacity?: number;

	/**
	 * Maximum opacity of a noise pixel.
	 *
	 * @default 0.3
	 */
	maxOpacity?: number;

	/**
	 * An array of colors to randomly use for pixels.
	 *
	 * @default [color(0x000000)]
	 */
	colors?: Array<Color>;

	/**
	 * Horizontal gap between noise pixels measured in `size`.
	 *
	 * @default 0
	 */
	horizontalGap?: number;

	/**
	 * Vertical gap between noise pixels measured in `size`.
	 *
	 * @default 0
	 */
	verticalGap?: number;

}

export interface IGrainPatternPrivate extends IPatternPrivate {
}

/**
 * Grain pattern.
 * 
 * Allows to add grain (noise) effect to your [[Graphics]] objects.
 * 
 * Note, grain pattern does not support `fill` and `color` setting.
 * Use `colors` setting to define colors of a grain pixels.
 * 
 * Note, rotation setting is not supported by this pattern.
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/colors-gradients-and-patterns/patterns/#Grain_patterns} for more info
 * @since 5.5.0
 */
export class GrainPattern extends Pattern {
	declare public _settings: IGrainPatternSettings;
	declare public _privateSettings: IGrainPatternPrivate;

	public static className: string = "GrainPattern";
	public static classNames: Array<string> = Pattern.classNames.concat([GrainPattern.className]);

	public canvas: HTMLCanvasElement = document.createElement("canvas");
	public context: CanvasRenderingContext2D = this.canvas.getContext("2d")!;

	protected _clearGrain: boolean = false;

	public _beforeChanged() {
		//document.body.appendChild(this.canvas); // temp
		this.canvas.width = this.get("width", 200);
		this.canvas.height = this.get("height", 200);

		if (this.isDirty("size") || this.isDirty("density") || this.isDirty("minOpacity") || this.isDirty("maxOpacity") || this.isDirty("colors") || this.isDirty("horizontalGap") || this.isDirty("verticalGap")) {
			this._clearGrain = true;
		}
		super._beforeChanged();
	}


	public _changed() {
		super._changed();

		if (this._clearGrain) {
			const width = this.get("width", 200);
			const height = this.get("height", 200);

			const patternData = this.context.getImageData(0, 0, width, height);

			const size = Math.max(1, this.get("size", 1));
			const minOpacity = this.get("minOpacity", 0);
			const maxOpacity = this.get("maxOpacity", 0.3);

			const colors = this.get("colors", [this.get("color", Color.fromHex(0x000000))])

			const cols = width / size;
			const rows = height / size;
			const density = this.get("density", 1);
			const horizontalGap = this.get("horizontalGap", 0) + 1;
			const verticalGap = this.get("verticalGap", 0) + 1;

			for (let r = 0; r < rows; r++) {

				if (verticalGap > 0) {
					if (r / verticalGap != Math.round(r / verticalGap)) {
						continue;
					}
				}

				for (let c = 0; c < cols; c++) {
					const color = colors[Math.floor(Math.random() * colors.length)];
					const alpha = (minOpacity + Math.random() * (maxOpacity - minOpacity)) * 255;
					const rnd = Math.random();

					if (horizontalGap > 0) {
						if (c / horizontalGap != Math.round(c / horizontalGap)) {
							continue;
						}
					}

					if (rnd < density) {
						this._setRectData(c, r, size, width, patternData.data, color.r, color.g, color.b, alpha);
					}
				}
			}

			this.context.putImageData(patternData, 0, 0);
			this._pattern = this.context.createPattern(this.canvas, "repeat");
		}

		this._clearGrain = false;
	}

	protected _checkDirtyFill() {
		return false;
	}

	protected _setRectData(col: number, row: number, size: number, width: number, data: Uint8ClampedArray, rc: number, gc: number, bc: number, ac: number) {
		for (var c = col * size; c < col * size + size; c++) {
			for (var r = row * size; r < row * size + size; r++) {
				var i = (r * width + c) * 4;

				data[i] = rc;
				data[i + 1] = gc;
				data[i + 2] = bc;
				data[i + 3] = ac;
			}
		}
	}
}

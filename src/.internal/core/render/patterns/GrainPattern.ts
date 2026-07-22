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
	 * @default 0.2
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
		// Assigning canvas.width/height clears and reallocates the backing store,
		// so only do it when the dimensions actually change.
		const width = this.get("width", 200);
		const height = this.get("height", 200);
		if (this.canvas.width !== width) {
			this.canvas.width = width;
		}
		if (this.canvas.height !== height) {
			this.canvas.height = height;
		}

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

			// The canvas was just cleared, so allocate a fresh zeroed buffer
			// instead of reading the (blank) canvas back with getImageData.
			const patternData = this.context.createImageData(width, height);

			const size = Math.max(1, this.get("size", 1));
			const minOpacity = this.get("minOpacity", 0);
			const maxOpacity = this.get("maxOpacity", 0.3);

			const colors = this.get("colors", [this.get("color", Color.fromHex(0x000000))])

			const cols = width / size;
			const rows = height / size;
			const density = this.get("density", 1);
			const horizontalGap = this.get("horizontalGap", 0) + 1;
			const verticalGap = this.get("verticalGap", 0) + 1;

			const colorCount = colors.length;
			const opacityRange = maxOpacity - minOpacity;

			// Precompute each palette color's channels once, so the hot loop reads
			// plain numbers instead of the Color r/g/b getters (one getter call per
			// channel per painted pixel otherwise).
			const rCh = new Array(colorCount);
			const gCh = new Array(colorCount);
			const bCh = new Array(colorCount);
			for (let i = 0; i < colorCount; i++) {
				rCh[i] = colors[i].r;
				gCh[i] = colors[i].g;
				bCh[i] = colors[i].b;
			}

			// Write packed 32-bit RGBA pixels through a Uint32Array view instead of
			// four clamped Uint8ClampedArray byte writes per pixel.
			const buf32 = new Uint32Array(patternData.data.buffer);
			const alwaysDraw = density >= 1;
			const hGap = horizontalGap > 1 ? horizontalGap : 0;
			const vGap = verticalGap > 1 ? verticalGap : 0;

			for (let r = 0; r < rows; r++) {
				if (vGap && r % vGap !== 0) {
					continue;
				}

				for (let c = 0; c < cols; c++) {
					if (hGap && c % hGap !== 0) {
						continue;
					}

					// Draw only `density` fraction of cells; compute the random
					// color/alpha only for the cells we actually paint.
					if (alwaysDraw || Math.random() < density) {
						const ci = colorCount > 1 ? (Math.random() * colorCount) | 0 : 0;
						const alpha = ((minOpacity + Math.random() * opacityRange) * 255) | 0;
						// Little-endian RGBA.
						const packed = (rCh[ci] | (gCh[ci] << 8) | (bCh[ci] << 16) | (alpha << 24)) >>> 0;

						if (size === 1) {
							buf32[r * width + c] = packed;
						}
						else {
							this._setRectData(c, r, size, width, buf32, packed);
						}
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

	protected _setRectData(col: number, row: number, size: number, width: number, buf32: Uint32Array, packed: number) {
		const x0 = col * size;
		const y0 = row * size;
		const x1 = x0 + size;
		const y1 = y0 + size;

		for (var y = y0; y < y1; y++) {
			// Write each row as a contiguous run for cache-friendly access.
			let i = y * width + x0;
			for (var x = x0; x < x1; x++) {
				buf32[i] = packed;
				i++;
			}
		}
	}
}

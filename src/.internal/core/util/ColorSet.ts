import { Entity, IEntitySettings, IEntityPrivate } from "./Entity";
import { Color } from "./Color";


export interface IColorSetSettings extends IEntitySettings {

	/**
	 * List of colors in the set.
	 */
	colors?: Color[];

	/**
	 * A step size when using `next()`.
	 *
	 * E.g. setting to `2` will make it return every second color in the list.
	 *
	 * @default 1
	 */
	step?: number;

	/**
	 * Start iterating colors from specific index.
	 */
	startIndex?: number;

	/**
	 * If set to `true`, color set will reuse existing colors from the list
	 * inestead of generating new ones.
	 *
	 * @default false
	 */
	reuse?: boolean;

	/**
	 * A base color to generate new colors from if `colors` is not specified.
	 * @type {[type]}
	 */
	baseColor?: Color;

	/**
	 * A set of tranformation to apply to base list of colors when the set runs
	 * out of colors and generates additional ones.
	 */
	passOptions?: IColorSetStepOptions;

	/**
	 * If set, each returned color will be applied saturation.
	 */
	saturation?: number;

	// count?: number;
}

export interface IColorSetPrivate extends IEntityPrivate {

	currentStep?: number;
	currentPass?: number;

	/**
	 * @ignore
	 */
	numColors?: number;

}

export interface IColorSetStepOptions {

	/**
	 * Value to add to "hue".
	 */
	hue?: number;

	/**
	 * Value to add to "saturation".
	 */
	saturation?: number;

	/**
	 * Value to add to "lightness".
	 */
	lightness?: number;

}


/**
 * An object which holds list of colors and can generate new ones.
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/colors-gradients-and-patterns/#Color_sets} for more info
 */
export class ColorSet extends Entity {
	public static className: string = "ColorSet";
	public static classNames: Array<string> = Entity.classNames.concat([ColorSet.className]);

	declare public _settings: IColorSetSettings;
	declare public _privateSettings: IColorSetPrivate;

	//protected _currentPass: number = 0;

	protected _setDefaults() {
		this._setPrivate("currentStep", 0);
		this._setPrivate("currentPass", 0);
		this._setDefault("passOptions", {
			hue: 0.05,
			saturation: 0.02,
			lightness: 0
		})
		this._setDefault("colors", [
			Color.fromHex(0x67b7dc),
			Color.fromHex(0x6794dc),
			Color.fromHex(0x6771dc),
			Color.fromHex(0x8067dc),
			Color.fromHex(0xa367dc),
			Color.fromHex(0xc767dc),
			Color.fromHex(0xdc67ce),
			Color.fromHex(0xdc67ab),
			Color.fromHex(0xdc6788),
			Color.fromHex(0xdc6967)]);

		this._setDefault("step", 1);
		this._setDefault("baseColor", Color.fromRGB(103, 183, 220));
		//this._setDefault("count", 20);
		this._setDefault("reuse", false);
		this._setDefault("startIndex", 0);
		super._setDefaults();
	}

	public _beforeChanged() {
		super._beforeChanged();
		if (this.isDirty("startIndex")) {
			this.setPrivate("currentStep", this.get("startIndex", 0))
		}
	}

	/**
	 * @ignore
	 */
	public generateColors(): void {
		this.setPrivate("currentPass", this.getPrivate("currentPass", 0) + 1)
		const pass = this.getPrivate("currentPass");
		const colors = this.get("colors", [this.get("baseColor", Color.fromHex(0xff0000))]);
		if (!this.getPrivate("numColors")) {
			this.setPrivate("numColors", colors.length);
		}
		const len = colors.length;
		const start = len - this.getPrivate("numColors")!;
		const passOptions = this.get("passOptions")!;
		const reuse = this.get("reuse");
		for (let i = start; i < len; i++) {
			if (reuse) {
				colors.push(colors[i])
			}
			else {
				const hsl = colors[colors.length - 1]!.toHSL();
				let h = hsl.h + (passOptions.hue || 0) * pass!;
				if (h > 1) h -= Math.floor(h);

				let s = hsl.s + (passOptions.saturation || 0) * pass!;
				if (s > 1) s -= Math.floor(s);

				let l = hsl.l + (passOptions.lightness || 0) * pass!;
				if (l > 1) l -= Math.floor(l);
				colors.push(Color.fromHSL(h, s, l));
			}
		}
	}

	/**
	 * Returns a [[Color]] at specific index.
	 *
	 * If there's no color at this index, a new color is generated.
	 *
	 * @param   index  Index
	 * @return         Color
	 */
	public getIndex(index: number): Color {
		const colors = this.get("colors", []);
		const saturation = this.get("saturation");
		if (index >= colors.length) {
			this.generateColors();
			return this.getIndex(index);
		}

		return saturation != null ? Color.saturate(colors[index], saturation!) : colors[index];
	}

	/**
	 * Returns next [[Color]] in the list.
	 *
	 * If the list is out of colors, new ones are generated dynamically.
	 */
	public next() {
		let currentStep = this.getPrivate("currentStep", 0);
		this.setPrivate("currentStep", currentStep + this.get("step", 1));
		return this.getIndex(currentStep);
	}

	/**
	 * Resets counter to the start of the list, so the next call for `next()` will
	 * return the first color.
	 */
	public reset() {
		this.setPrivate("currentStep", this.get("startIndex", 0));
	}
}

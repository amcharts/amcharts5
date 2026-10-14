import { Entity, IEntitySettings, IEntityPrivate } from "./Entity";
import { Color } from "./Color";

// A list's length before colors were added to it (color sets share their theme's list)
const listLengths: WeakMap<Color[], number> = new WeakMap();

function listLength(colors: Color[]): number {
	let length = listLengths.get(colors);
	if (length == null) {
		length = colors.length;
		listLengths.set(colors, length);
	}
	return length;
}

function gcd(a: number, b: number): number {
	while (b) {
		[a, b] = [b, a % b];
	}
	return a;
}

export interface IColorSetSettings extends IEntitySettings {

	/**
	 * The colors in the set. Generated colors are added to this list.
	 */
	colors?: Color[];

	/**
	 * How many positions `next()` moves each time: `2` returns every second
	 * color.
	 *
	 * @default 1
	 */
	step?: number;

	/**
	 * Index of the color the first `next()` returns, and `reset()` goes back to.
	 *
	 * @default 0
	 */
	startIndex?: number;

	/**
	 * Repeats the list from the start when it runs out, instead of generating
	 * new colors.
	 *
	 * @default false
	 */
	reuse?: boolean;

	/**
	 * A base color to generate new colors from if `colors` is not set.
	 */
	baseColor?: Color;

	/**
	 * How the colors generated when the list runs out differ from the original
	 * list. Each time the list runs out, a new pass of colors is added, shifted
	 * by these amounts once more.
	 */
	passOptions?: IColorSetStepOptions;

	/**
	 * Saturation for every color the set returns, from `0` (grey) to `1`.
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
	currentCount?: number;

	/**
	 * @ignore
	 */
	numColors?: number;

}

export interface IColorSetStepOptions {

	/**
	 * Added to the hue on each pass. `1` is a full turn of the color wheel.
	 */
	hue?: number;

	/**
	 * Added to the saturation (`0` to `1`) on each pass.
	 */
	saturation?: number;

	/**
	 * Added to the lightness (`0` to `1`) on each pass.
	 */
	lightness?: number;

}


/**
 * A list of colors that series and other elements take in turn. When the
 * list runs out, it generates more.
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/colors-gradients-and-patterns/#Color_sets} for more info
 */
export class ColorSet extends Entity {
	public static className: string = "ColorSet";
	public static classNames: Array<string> = Entity.classNames.concat([ColorSet.className]);

	declare public _settings: IColorSetSettings;
	declare public _privateSettings: IColorSetPrivate;

	//protected _currentPass: number = 0;

	protected _afterNew() {
		// Applying themes because color set will not have parent
		super._afterNewApplyThemes();
		this._dirty["colors"] = false;
	}

	public _beforeChanged(): void {
		if (this.isDirty("colors")) {
			this.reset();
		}
	}

	/**
	 * @ignore
	 */
	public generateColors(): void {
		this.setPrivate("currentPass", this.getPrivate("currentPass", 0) + 1)
		const pass = this.getPrivate("currentPass");
		const colors = this.get("colors", [this.get("baseColor", Color.fromHex(0xff0000))]);
		listLength(colors);
		if (!this.getPrivate("numColors")) {
			this.setPrivate("numColors", colors.length);
		}
		//const len = colors.length;
		const len = this.getPrivate("numColors")!;
		//const start = len - this.getPrivate("numColors")!;
		const start = 0;
		const passOptions = this.get("passOptions")!;
		const reuse = this.get("reuse");
		for (let i = start; i < len; i++) {
			if (reuse) {
				colors.push(colors[i])
			}
			else {
				const hsl = colors[i]!.toHSL();
				let h = hsl.h + (passOptions.hue || 0) * pass!;
				while (h > 1) h -= 1;

				let s = hsl.s + (passOptions.saturation || 0) * pass!;
				//if (s > 1) s -= Math.floor(s);
				if (s > 1) s = 1;
				if (s < 0) s = 0;

				let l = hsl.l + (passOptions.lightness || 0) * pass!;
				//if (l > 1) l -= Math.floor(l);
				while (l > 1) l -= 1;
				colors.push(Color.fromHSL(h, s, l));
			}
		}
	}

	/**
	 * Returns the [[Color]] at `index`, generating more colors if the list is
	 * shorter.
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
	 * Returns the next [[Color]] in the list, `step` positions after the last
	 * one. Generates more colors when the list runs out. With `reuse`, a `step`
	 * that would come back to colors already used moves on by one instead, so
	 * every color in the list is used before any repeats.
	 *
	 * @return  Color
	 */
	public next() {
		const currentStep = this.getPrivate("currentStep", this.get("startIndex", 0));
		const count = this.getPrivate("currentCount", 0);
		this.setPrivate("currentStep", currentStep + this.get("step", 1));
		this.setPrivate("currentCount", count + 1);
		return this.getIndex(currentStep + this.reuseOffset(count));
	}

	/**
	 * With `reuse`, how many positions the color taken `count`-th with `step`
	 * moves on, so that a step coming back to colors already used takes the
	 * next ones instead.
	 *
	 * @ignore
	 */
	public reuseOffset(count: number): number {
		const step = this.get("step", 1);
		if (this.get("reuse") && step > 0 && step % 1 == 0) {
			const length = listLength(this.get("colors", []));
			if (length > 1) {
				const shared = gcd(step, length);
				if (shared > 1) {
					return Math.floor(count / (length / shared)) % shared;
				}
			}
		}
		return 0;
	}

	/**
	 * Starts over, so the next `next()` returns the color at `startIndex`.
	 */
	public reset() {
		this.setPrivate("currentStep", this.get("startIndex", 0));
		this.setPrivate("currentPass", 0);
		this.setPrivate("currentCount", 0);
	}
}

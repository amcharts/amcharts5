import type { Pattern } from "../render/patterns/Pattern";
import type { Color } from "./Color";

import { LinePattern, ILinePatternSettings } from "../render/patterns/LinePattern";
import { RectanglePattern, IRectanglePatternSettings } from "../render/patterns/RectanglePattern";
import { CirclePattern, ICirclePatternSettings } from "../render/patterns/CirclePattern";
import { Entity, IEntitySettings, IEntityPrivate } from "./Entity";


export interface IPatternSetSettings extends IEntitySettings {

	/**
	 * The patterns in the set. A built-in list of 16 patterns if not set.
	 */
	patterns?: Pattern[];

	/**
	 * How many positions `next()` moves each time: `2` returns every second
	 * pattern.
	 *
	 * @default 1
	 */
	step?: number;

	/**
	 * Color of the built-in patterns, used when `patterns` is not set. Changing
	 * it after the set is created has no effect.
	 *
	 * @see {@link https://docs.amcharts.com/v5/concepts/colors-gradients-and-patterns/patterns/#colors} for more info
	 */
	color?: Color;

	/**
	 * Index of the pattern the first `next()` returns, and `reset()` goes back
	 * to.
	 *
	 * @default 0
	 */
	startIndex?: number;

}

export interface IPatternSetPrivate extends IEntityPrivate {

	/**
	 * Index of the pattern the next `next()` returns.
	 */
	currentStep?: number;

}


/**
 * A list of [[Pattern]] objects that series and other elements take in turn.
 *
 * @see {@link https://docs.amcharts.com/v5/concepts/colors-gradients-and-patterns/patterns/#pattern-sets} for more info
 * @since 5.10.0
 */
export class PatternSet extends Entity {
	public static className: string = "PatternSet";
	public static classNames: Array<string> = Entity.classNames.concat([PatternSet.className]);

	declare public _settings: IPatternSetSettings;
	declare public _privateSettings: IPatternSetPrivate;

	protected _afterNew() {
		// Applying themes because pattern set will not have parent
		super._afterNewApplyThemes();

		if (this.get("patterns", []).length === 0) {
			const color = this.get("color", this.root.interfaceColors.get("stroke"));
			this.set("patterns", [
				this.getLinePattern({
					width: 1000,
					height: 1000,
					angle: 45,
					strokeWidth: 1,
					//gap: 6,
					color: color
				}),
				this.getRectanglePattern({
					width: 10,
					height: 10,
					rotation: 0,
					maxWidth: 4,
					maxHeight: 4,
					color: color
				}),
				this.getLinePattern({
					width: 1000,
					height: 1000,
					angle: -45,
					strokeWidth: 1,
					gap: 6,
					color: color
				}),
				this.getCirclePattern({
					width: 11,
					height: 11,
					radius: 2,
					color: color
				}),
				this.getLinePattern({
					width: 6,
					height: 6,
					angle: 90,
					strokeWidth: 1,
					color: color
				}),
				this.getRectanglePattern({
					width: 14,
					height: 14,
					rotation: 45,
					rotateShapes: true,
					gap: 4,
					maxWidth: 6,
					maxHeight: 6,
					checkered: true,
					color: color
				}),
				this.getLinePattern({
					width: 6,
					height: 6,
					angle: 0,
					strokeWidth: 1,
					color: color
				}),
				this.getRectanglePattern({
					width: 15,
					height: 15,
					rotation: 0,
					gap: 5,
					maxWidth: 5,
					maxHeight: 5,
					checkered: true,
					color: color
				}),
				this.getLinePattern({
					width: 1000,
					height: 1000,
					angle: 45,
					strokeWidth: 2,
					gap: 3,
					strokeDasharray: [4, 2],
					color: color
				}),
				this.getCirclePattern({
					width: 20,
					height: 20,
					radius: 3,
					gap: 4,
					checkered: true,
					color: color
				}),
				this.getLinePattern({
					width: 1000,
					height: 1000,
					angle: -45,
					strokeWidth: 2,
					gap: 3,
					strokeDasharray: [4, 2],
					color: color
				}),
				this.getRectanglePattern({
					width: 10,
					height: 10,
					rotation: 0,
					gap: 1,
					maxWidth: 9,
					maxHeight: 9,
					color: color
				}),
				this.getLinePattern({
					width: 1000,
					height: 1000,
					angle: -45,
					strokeWidth: 2,
					gap: 1,
					color: color
				}),
				this.getLinePattern({
					width: 1000,
					height: 1000,
					angle: 45,
					strokeWidth: 2,
					gap: 1,
					color: color
				}),
				this.getLinePattern({
					width: 1000,
					height: 1000,
					angle: 0,
					strokeWidth: 3,
					gap: 1,
					color: color
				}),
				this.getLinePattern({
					width: 1000,
					height: 1000,
					angle: 90,
					strokeWidth: 3,
					gap: 1,
					color: color
				}),
			])
		}

		this._dirty["patterns"] = false;

	}

	public _beforeChanged(): void {
		if (this.isDirty("patterns")) {
			this.reset();
		}
	}

	/**
	 * Returns the [[Pattern]] at `index`.
	 *
	 * @param   index  Index
	 * @return         Pattern
	 */
	public getIndex(index: number): Pattern {
		const patterns = this.get("patterns", []);

		if ((index < patterns.length) && patterns[index] !== null) {
			return patterns[index];
		}



		if (index > (patterns.length - 1)) {
			const adjustedIndex = index % patterns.length;
			return patterns[adjustedIndex];
		}
		return patterns[index];
	}

	/**
	 * Returns the next [[Pattern]] in the list, `step` positions after the last
	 * one.
	 *
	 * @return  Pattern
	 */
	public next(): Pattern {
		let currentStep = this.getPrivate("currentStep", this.get("startIndex", 0));
		this.setPrivate("currentStep", currentStep + this.get("step", 1));
		return this.getIndex(currentStep);
	}

	/**
	 * Starts over, so the next `next()` returns the pattern at `startIndex`.
	 */
	public reset(): void {
		this.setPrivate("currentStep", this.get("startIndex", 0));
	}

	/**
	 * Creates a [[LinePattern]] with these settings.
	 *
	 * @param   settings  Pattern settings
	 * @return            Pattern object
	 */
	public getLinePattern(settings: ILinePatternSettings): LinePattern {
		let pattern = LinePattern.new(this.root, settings);
		return pattern;
	}

	/**
	 * Creates a [[RectanglePattern]] with these settings.
	 *
	 * @param   settings  Pattern settings
	 * @return            Pattern object
	 */
	public getRectanglePattern(settings: IRectanglePatternSettings): RectanglePattern {
		let pattern = RectanglePattern.new(this.root, settings);
		return pattern;
	}

	/**
	 * Creates a [[CirclePattern]] with these settings.
	 *
	 * @param   settings  Pattern settings
	 * @return            Pattern object
	 */
	public getCirclePattern(settings: ICirclePatternSettings): CirclePattern {
		let pattern = CirclePattern.new(this.root, settings);
		return pattern;
	}

}

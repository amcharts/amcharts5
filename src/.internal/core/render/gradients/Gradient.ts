import type { IBounds } from "../../util/IBounds"
import type { IGradient, IGradientStop } from "../backend/Renderer";
import type { Sprite } from "../Sprite";

import { Entity, IEntitySettings, IEntityPrivate } from "../../util/Entity"


export interface IGradientSettings extends IEntitySettings {

	/**
	 * A list of color steps for the gradient.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/colors-gradients-and-patterns/gradients/} for more info
	 */
	stops?: Array<IGradientStop>;

	/**
	 * Gradient target.
	 */
	target?: Sprite;

}

export interface IGradientPrivate extends IEntityPrivate {
}

/**
 * Base class for gradients.
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/colors-gradients-and-patterns/gradients/} for more info
 */
export abstract class Gradient extends Entity {

	declare public _settings: IGradientSettings;
	declare public _privateSettings: IGradientPrivate;

	public static className: string = "Gradient";
	public static classNames: Array<string> = Entity.classNames.concat([Gradient.className]);

	protected _afterNew() {
		// Applying themes because gradient will not have parent
		super._afterNewApplyThemes();
	}

	/**
	 * @ignore
	 */
	public getFill(_target: Sprite): IGradient {
		return {
			addColorStop: (_offset: number, _color: string) => { }
		};
	}

	public _changed() {
		super._changed();

		//if (this.isDirty("target") && this.get("target")) {
		//	this.get("target")!.events.on("boundschanged", () => {

		//	});
		//}
	}

	/**
	 * @ignore
	 */
	public getBounds(target: Sprite): IBounds {
		const gradientTarget = this.get("target");
		if (gradientTarget) {
			let bounds = gradientTarget.globalBounds();

			const p0 = target.toLocal({ x: bounds.left, y: bounds.top });
			const p1 = target.toLocal({ x: bounds.right, y: bounds.top });
			const p2 = target.toLocal({ x: bounds.right, y: bounds.bottom });
			const p3 = target.toLocal({ x: bounds.left, y: bounds.bottom });

			return {
				left: Math.min(p0.x, p1.x, p2.x, p3.x),
				top: Math.min(p0.y, p1.y, p2.y, p3.y),
				right: Math.max(p0.x, p1.x, p2.x, p3.x),
				bottom: Math.max(p0.y, p1.y, p2.y, p3.y)
			}
		}
		return target._display.getLocalBounds();
	}

}

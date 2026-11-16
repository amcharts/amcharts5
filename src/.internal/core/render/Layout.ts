import type { Container } from "./Container";
import type { Sprite } from "./Sprite";
import { Entity, IEntitySettings, IEntityPrivate } from "../util/Entity";

export interface ILayoutSettings extends IEntitySettings {
}

export interface ILayoutPrivate extends IEntityPrivate {
}

export function eachChildren(container: Container, f: (sprite: Sprite) => void): void {
    if (container.get("reverseChildren", false)) {
        container.children.eachReverse(f);
    } else {
        container.children.each(f);
    }
}

/**
 * A child placed left to right: its `x` and the left and right of its bounds.
 *
 * @ignore
 */
export interface IPlaced {
	child: Sprite;
	x: number;
	left: number;
	right: number;
}

/**
 * Sets the `x` of children placed left to right, mirrored for
 * `direction: "rtl"`: across the container's inner width if it has a width of
 * its own, else across the content, which ends at `contentRight`. Margins are
 * mirrored too, so a child's `marginLeft` ends up on its right.
 *
 * @ignore
 */
export function placeX(container: Container, placed: Array<IPlaced>, contentRight: number): void {
	const paddingLeft = container.get("paddingLeft", 0);
	const hasWidth = container.get("width") != null || container.getPrivate("width") != null;
	const right = hasWidth ? paddingLeft + container.innerWidth() : contentRight;
	const mirror = paddingLeft + right;
	for (let i = 0; i < placed.length; i++) {
		const p = placed[i];
		p.child.setPrivate("x", mirror - p.x - p.right - p.left);
	}
}

/**
 * Base class for [[Container]] layouts.
 */
export abstract class Layout extends Entity {
	declare public _settings: ILayoutSettings;
	declare public _privateSettings: ILayoutPrivate;

	public static className: string = "Layout";
	public static classNames: Array<string> = Entity.classNames.concat([Layout.className]);

	/**
	 * @ignore
	 */
	public abstract updateContainer(_container: Container): void;
}

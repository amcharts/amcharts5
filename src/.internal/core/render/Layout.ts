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

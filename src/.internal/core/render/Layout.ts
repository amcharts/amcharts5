import type { Container } from "./Container";
import { Entity, IEntitySettings, IEntityPrivate } from "../util/Entity";

export interface ILayoutSettings extends IEntitySettings {
}

export interface ILayoutPrivate extends IEntityPrivate {
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

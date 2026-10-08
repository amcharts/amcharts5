import type { Sprite } from "../../../core/render/Sprite";
import type { Axis } from "./Axis";
import type { AxisRenderer } from "./AxisRenderer";

import { Entity, IEntitySettings, IEntityPrivate } from "../../../core/util/Entity";

import * as $object from "../../../core/util/Object";

export interface IAxisBulletSettings extends IEntitySettings {

	/**
	 * Where the bullet sits within its cell, from `0` (start) to `1` (end).
	 *
	 * @default 0.5
	 */
	location?: number;

	/**
	 * The element to show as the bullet.
	 */
	sprite: Sprite;

	/**
	 * Stacks the bullet next to another bullet at the same position, instead
	 * of over it. Works on [[AxisRendererX]] and [[AxisRendererY]] only.
	 *
	 * @since 5.2.28
	 * @default false
	 */
	stacked?: boolean;

}

export interface IAxisBulletPrivate extends IEntityPrivate {
}

/**
 * Draws a bullet on an axis.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/axes/#Axis_bullets} for more info
 */
export class AxisBullet extends Entity {

	/**
	 * The axis the bullet is on.
	 */
	public axis: Axis<AxisRenderer> | undefined;

	declare public _settings: IAxisBulletSettings;
	declare public _privateSettings: IAxisBulletPrivate;

	public static className: string = "AxisBullet";
	public static classNames: Array<string> = Entity.classNames.concat([AxisBullet.className]);

	public _beforeChanged() {
		super._beforeChanged();

		const sprite = this.get("sprite");

		if (this.isDirty("sprite")) {
			if (sprite) {
				sprite._setC("position", "absolute");
				// "figure" unless the sprite has a role of its own (e.g. a button)
				if (sprite.get("role") == null) {
					sprite._setC("role", "figure");
				}
				this._disposers.push(sprite);
			}
		}

		if (this.isDirty("location")) {
			const dataItem = sprite.dataItem;
			if (this.axis && sprite && dataItem) {
				this.axis._prepareDataItem(dataItem as any)
			}
		}
	}

	protected _dispose() {
		const axis = this.axis;
		if (axis) {
			$object.each(axis._bullets, (key, bullet) => {
				if (bullet.uid == this.uid) {
					delete axis._bullets[key];
				}
			})
		}

		super._dispose();
	}
}

import type { Root } from "../../../core/Root";
import { Entity, IEntitySettings, IEntityPrivate } from "../../../core/util/Entity";
import type { Template } from "../../../core/util/Template";
import type { Sprite } from "../../../core/render/Sprite";
import type { Axis } from "./Axis";
import type { AxisRenderer } from "./AxisRenderer";

export interface IAxisBulletSettings extends IEntitySettings {

	/**
	 * Relative location of the bullet within the cell.
	 *
	 * `0` - beginning, `0.5` - middle, `1` - end.
	 */
	location?: number;

	/**
	 * A visual element of the bullet.
	 */
	sprite: Sprite;	
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
	 * Use this method to create an instance of this class.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/getting-started/#New_element_syntax} for more info
	 * @param   root      Root element
	 * @param   settings  Settings
	 * @param   template  Template
	 * @return            Instantiated object
	 */
	public static new(root: Root, settings: AxisBullet["_settings"], template?: Template<AxisBullet>): AxisBullet {
		const x = new AxisBullet(root, settings, true, template);
		x._afterNew();
		return x;
	}

	/**
	 * Target axis object.
	 */
	public axis: Axis<AxisRenderer> | undefined;	

	declare public _settings: IAxisBulletSettings;
	declare public _privateSettings: IAxisBulletPrivate;

	public static className: string = "AxisBullet";
	public static classNames: Array<string> = Entity.classNames.concat([AxisBullet.className]);

	public _beforeChanged() {
		super._beforeChanged();

		if (this.isDirty("sprite")) {
			const sprite = this.get("sprite");
			if (sprite) {
				sprite.setAll({ position: "absolute", role: "figure" });
				this._disposers.push(sprite);
			}
		}

		if (this.isDirty("location")) {
			if (this.axis) {
			//	this.axis._positionBullet(this);
			}
		}
	}	
}

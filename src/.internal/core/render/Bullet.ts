import { Entity, IEntitySettings, IEntityPrivate } from "../../core/util/Entity";
import type { Sprite } from "../../core/render/Sprite";
import type { Series } from "../../core/render/Series";

export interface IBulletSettings extends IEntitySettings {

	/**
	 * Horizontal location within target element.
	 *
	 * 0 - left, 1 - right, or anything inbetweeen.
	 */
	locationX?: number;

	/**
	 * Vertical location within target element.
	 *
	 * 0 - top, 1 - bottom, or anything inbetweeen.
	 */
	locationY?: number;

	/**
	 * A visual element of the bullet.
	 */
	sprite: Sprite;

	/**
	 * If set to `true`, the bullet will redraw its `sprite` element whenever
	 * anything in its parent series changes.
	 *
	 * @default false
	 */
	dynamic?: boolean;

	/**
	 * If set to `true`, the bullet will be automatically rotated to face
	 * direction of line it is attached to.
	 *
	 * NOTE: Works only in  [[Flow]] and [[MapPointSeries]] (when [[MapPoint]] is
	 * attached to a [[MapLine]]).
	 *
	 * @default false
	 */
	autoRotate?: boolean;

	/**
	 * If `autoRotate` is set to `true`, value of `autoRotateAngle` will be added
	 * to the automatically-calculated angle.
	 */
	autoRotateAngle?: number;

}

export interface IBulletPrivate extends IEntityPrivate {
	hidden?:boolean;
}

/**
 * A universal placeholder for bullet elements.
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/common-elements/bullets/} for more info
 */
export class Bullet extends Entity {
	public static className: string = "Bullet";
	public static classNames: Array<string> = Entity.classNames.concat([Bullet.className]);

	declare public _settings: IBulletSettings;
	declare public _privateSettings: IBulletPrivate;

	// used by MapPolygons where one data item can have multiple bullets of the same kind
	public _index?: number;

	/**
	 * Target series object if it's a bullet for series.
	 */
	public series: Series | undefined;

	protected _afterNew() {
		// Applying themes because bullet will not have parent
		super._afterNewApplyThemes();
	}

	public _beforeChanged() {
		super._beforeChanged();

		if (this.isDirty("sprite")) {
			const sprite = this.get("sprite");
			if (sprite) {
				sprite.setAll({ position: "absolute", role: "figure" });
				this._disposers.push(sprite);
			}
		}

		if (this.isDirty("locationX") || this.isDirty("locationY")) {
			if (this.series) {
				this.series._positionBullet(this);
			}
		}
	}
}

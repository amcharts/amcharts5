import { Entity, IEntitySettings, IEntityPrivate } from "../../core/util/Entity";
import type { Sprite } from "../../core/render/Sprite";
import type { Series } from "../../core/render/Series";

export interface IBulletSettings extends IEntitySettings {

	/**
	 * Horizontal location within the target element, from `0` (left) to `1`
	 * (right). In a pie slice it runs along the arc.
	 *
	 * @default 0.5
	 */
	locationX?: number;

	/**
	 * Vertical location within the target element, from `0` (top) to `1`
	 * (bottom). On XY columns `0` is the column's base and `1` its value end;
	 * in a pie slice it runs from the inner to the outer radius.
	 *
	 * @default 0.5
	 */
	locationY?: number;

	/**
	 * The element the bullet shows.
	 */
	sprite: Sprite;

	/**
	 * Refreshes the `sprite` (its fill, size and label text, and those of its
	 * children) each time the series positions its bullets.
	 *
	 * @default false
	 */
	dynamic?: boolean;

	/**
	 * Rotates the bullet to follow the direction of the line it sits on.
	 *
	 * Works on links of [[Flow]] charts, [[HierarchyLink]] and
	 * [[MapSankeySeries]], and in [[MapPointSeries]] for points placed on a
	 * [[MapLine]].
	 *
	 * @default false
	 */
	autoRotate?: boolean;

	/**
	 * Degrees added to the angle that `autoRotate` sets.
	 */
	autoRotateAngle?: number;

	/**
	 * Places the bullet at this value of the data item along the value axis,
	 * in place of the location on that axis. The location across it still
	 * applies.
	 *
	 * **IMPORTANT: this setting works with [[XYSeries]] only.**
	 *
	 * @see {@link https://docs.amcharts.com/v5/concepts/common-elements/bullets/#by-data-field} for more info
	 * @since 5.6.0
	 */
	field?: "open" | "high" | "low" | "value";

	/**
	 * Stacks bullets at the same spot instead of overlapping them.
	 *
	 * * `"up"` - stacks bullets upwards (rightwards on a horizontal series).
	 * * `"down"` - stacks bullets downwards (leftwards on a horizontal series).
	 * * `"auto"` - stacks bullets in the direction that offers more space.
	 *
	 * **IMPORTANT: this setting works with [[XYSeries]] only.**
	 *
	 * @see {@link https://docs.amcharts.com/v5/concepts/common-elements/bullets/#stacked-bullets} for more info
	 * @since 5.6.0
	 */
	stacked?: "up" | "down" | "auto";
}

export interface IBulletPrivate extends IEntityPrivate {
	hidden?: boolean;
}

/**
 * Holds an element (`sprite`) that a series places at a data item.
 *
 * @see {@link https://docs.amcharts.com/v5/concepts/common-elements/bullets/} for more info
 */
export class Bullet extends Entity {
	public static className: string = "Bullet";
	public static classNames: Array<string> = Entity.classNames.concat([Bullet.className]);

	declare public _settings: IBulletSettings;
	declare public _privateSettings: IBulletPrivate;

	// used by MapPolygons where one data item can have multiple bullets of the same kind
	public _index?: number;

	/**
	 * The series the bullet belongs to, if any.
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
				sprite._setC("position", "absolute");
				// "figure" unless the sprite has a role of its own (e.g. a button)
				if (sprite.get("role") == null) {
					sprite._setC("role", "figure");
				}
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

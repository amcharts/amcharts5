import type { IHierarchyDataItem } from "./Hierarchy";
import type { DataItem } from "../../core/render/Component";
import type { Bullet } from "../../core/render/Bullet";

import { Graphics, IGraphicsSettings, IGraphicsPrivate } from "../../core/render/Graphics";
import * as $array from "../../core/util/Array";
import type { Root } from "../../core/Root";
import type { List } from "../../core/util/List";
import type { LinkedHierarchy } from "./LinkedHierarchy";

export interface IHierarchyLinkSettings extends IGraphicsSettings {

	/**
	 * Source node data item.
	 */
	source?: DataItem<IHierarchyDataItem>;

	/**
	 * Target node data item.
	 */
	target?: DataItem<IHierarchyDataItem>;

	/**
	 * Strength of the link.
	 */
	strength?: number;

	/**
	 * Distance in pixels.
	 */
	distance?: number;

}

export interface IHierarchyLinkPrivate extends IGraphicsPrivate {
	d3Link: any;
}

/**
 * Draws a link between nodes in a hierarchy series.
 */
export class HierarchyLink extends Graphics {
	declare public _settings: IHierarchyLinkSettings;
	declare public _privateSettings: IHierarchyLinkPrivate;

	public static className: string = "HierarchyLink";
	public static classNames: Array<string> = Graphics.classNames.concat([HierarchyLink.className]);

	public bullets: Array<Bullet> = [];

	public series?: LinkedHierarchy;

	public _handleBullets(bullets:List<<D extends DataItem<IHierarchyDataItem>>(root: Root, source: D, target:D) => Bullet | undefined>) {
		$array.each(this.bullets, (bullet) => {
			bullet.dispose();
		})

		bullets.each((bullet)=>{
			const newBullet = bullet(this._root, this.get("source")!, this.get("target")!);
			if (newBullet) {
				this.bullets.push(newBullet);

				const sprite = newBullet.get("sprite");

				this.addDisposer(newBullet.on("locationX", () => {
					this._clear = true;
					this.markDirty();
				}))

				if(sprite){
					const series = this.series;
					if(series){
						series.linksContainer.children.push(sprite);
					}
				}
			}
		})
	}

	public _changed() {
		super._changed();
		if (this._clear) {
			let source = this.get("source");
			let target = this.get("target");
			if (source && target) {
				const sourceNode = source.get("node");
				const targetNode = target.get("node");

				const x0 = sourceNode.x();
				const y0 = sourceNode.y();

				const x1 = targetNode.x();
				const y1 = targetNode.y();

				this._display.moveTo(x0, y0);
				this._display.lineTo(x1, y1);

				const sourceRadius = sourceNode.dataItem?.get("outerCircle" as any).get("radius", 0);
				const targetRadius = targetNode.dataItem?.get("outerCircle" as any).get("radius", 0);

				const distance = Math.hypot(x1 - x0, y1 - y0);
				const trueDistance = distance - sourceRadius - targetRadius;

				$array.each(this.bullets, (bullet) => {
					const sprite = bullet.get("sprite");
					if(sprite){
						const location = bullet.get("locationX", 0.5);

						// const tx = trueDistance / distance * (x1 - x0);
						// const ty = trueDistance / distance * (y1 - y0);

						sprite.set("x", x0 + sourceRadius / distance * (x1 - x0) + trueDistance / distance * (x1 - x0) * location);
						sprite.set("y", y0 + sourceRadius / distance * (y1 - y0) + trueDistance / distance * (y1 - y0) * location);

						if(bullet.get("autoRotate")){
							sprite.set("rotation", Math.atan2(y1 - y0, x1 - x0) * 180 / Math.PI + bullet.get("autoRotateAngle", 0));
						}
					}
				})
			}
		}
	}

	public hide(duration?: number){
		$array.each(this.bullets, (bullet) => {
			if(bullet){
				const sprite = bullet.get("sprite");
				if(sprite){
					sprite.hide(duration);
				}
			}
		})
		return super.hide();
	}

	public show(duration?: number){
		$array.each(this.bullets, (bullet) => {
			if(bullet){
				const sprite = bullet.get("sprite");
				if(sprite){
					sprite.show(duration);
				}
			}
		})
		return super.show();
	}

	public _beforeChanged() {
		super._beforeChanged();

		if (this.isDirty("source")) {
			const source = this.get("source");
			if (source) {
				const sourceNode = source.get("node");
				sourceNode.events.on("positionchanged", () => {
					this._markDirtyKey("stroke");
				})
			}
		}
		if (this.isDirty("target")) {
			const target = this.get("target");
			if (target) {
				const targetNode = target.get("node");
				targetNode.events.on("positionchanged", () => {
					this._markDirtyKey("stroke");
				})
			}
		}
	}

	protected _dispose(){
		super._dispose();
		$array.each(this.bullets, (bullet) => {
			bullet.dispose();
		})
		this.bullets = [];
	}
}

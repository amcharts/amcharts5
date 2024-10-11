import type { Percent } from "../../../core/util/Percent";
import type { ISpritePointerEvent } from "../../../core/render/Sprite";
import type { DataItem } from "../../../core/render/Component";
import type { SpriteResizer } from "../../../core/render/SpriteResizer";

import { PolylineSeries, IPolylineSeriesSettings, IPolylineSeriesPrivate, IPolylineSeriesDataItem } from "./PolylineSeries";
import { Bullet } from "../../../core/render/Bullet";
import { Graphics } from "../../../core/render/Graphics";
import { Template } from "../../../core/util/Template";

import * as $array from "../../../core/util/Array";
import * as $object from "../../../core/util/Object";

export interface IIconSeriesDataItem extends IPolylineSeriesDataItem {

	/**
	 * An SVG path of the icon.
	 */
	svgPath: string;
}

export interface IIconSeriesSettings extends IPolylineSeriesSettings {

	/**
	 * An SVG path of the icon.
	 */
	iconSvgPath: string;

	/**
	 * Scale (0-X).
	 */
	iconScale?: number;

	/**
	 * Relative horizontal center.
	 */
	iconCenterX?: Percent;

	/**
	 * Relative vertical center.
	 */
	iconCenterY?: Percent;

	/**
	 * Should icon snap to closest data item?
	 */
	snapToData?: boolean;
}

export interface IIconSeriesPrivate extends IPolylineSeriesPrivate {
}

export class IconSeries extends PolylineSeries {
	public static className: string = "IconSeries";
	public static classNames: Array<string> = PolylineSeries.classNames.concat([IconSeries.className]);

	declare public _settings: IIconSeriesSettings;
	declare public _privateSettings: IIconSeriesPrivate;
	declare public _dataItemSettings: IIconSeriesDataItem;

	public spriteResizer!: SpriteResizer;

	protected _tag = "icon";

	protected _afterNew() {
		super._afterNew();

		this.spriteResizer = this._getStockChart().spriteResizer;

		this.bullets.clear();

		this.strokes.template.set("visible", false);
		this.fills.template.set("visible", false);

		this.bullets.push((root, _series, dataItem) => {
			const dataContext = dataItem.dataContext as any;
			const template = dataContext.settings;
			if (template) {
				const sprite = Graphics.new(root, {
					draggable: true,
					themeTags: ["icon"]
				}, template);

				dataContext.sprite = sprite;

				this._addBulletInteraction(sprite);

				sprite.events.on("click", (_e) => {
					const spriteResizer = this.spriteResizer;
					if (spriteResizer.get("sprite") == sprite) {
						spriteResizer.set("sprite", undefined);
					}
					else {
						spriteResizer.set("sprite", sprite);
					}
				})

				sprite.events.on("pointerover", () => {
					this._isHover = true;
				})

				sprite.events.on("pointerout", () => {
					this._isHover = false;
				})

				this.spriteResizer.set("sprite", undefined);

				sprite.on("scale", (scale) => {
					template.set("scale", scale)
				})

				sprite.on("rotation", (rotation) => {
					template.set("rotation", rotation)
				})

				return Bullet.new(this._root, {
					locationX: undefined,
					sprite: sprite
				})
			}
		})
	}

	protected _setContextSprite(_context: any) { }

	protected _handlePointerClick(event: ISpritePointerEvent) {
		if (this._selected.length > 0) {
			this._hideResizer();
			this.unselectAllDrawings();
		}
		else if (this._drawingEnabled) {
			if (!this._isHover) {
				super._handlePointerClick(event);

				const dataObject = this.data.getIndex(this.data.length - 1) as any;
				dataObject.settings = this._getIconTemplate();

				this._increaseIndex();
				this._di[this._index] = {};

				this._dispatchStockEvent("drawingadded", this._drawingId, this._index);
			}
		}
		this.isDrawing(false);
	}

	public disposeDataItem(dataItem: DataItem<this["_dataItemSettings"]>) {
		super.disposeDataItem(dataItem);
		this.spriteResizer.set("sprite", undefined);
		this._isHover = false;
	}

	protected _applySettings(index: number, settings?: { [index: string]: any }) {
		super._applySettings(index, settings);
		let template: Template<any>;
		let sprite!: Graphics;

		let context = this._getContext(index);
		if (context) {
			sprite = context.sprite;
			template = context.settings;

			if (sprite) {

				const svgPath = this.get("iconSvgPath");
				const centerX = this.get("iconCenterX");
				const centerY = this.get("iconCenterY");

				sprite.set("svgPath", svgPath);
				sprite.set("centerX", centerX);
				sprite.set("centerY", centerY);

				const defaultState = sprite.states.lookup("default")!;
				defaultState.set("svgPath", svgPath);
				defaultState.set("centerX", centerX);
				defaultState.set("centerY", centerY);

				if (template) {
					template.set("svgPath", svgPath);
					template.set("centerX", centerX);
					template.set("centerY", centerY);
				}

				if (settings) {
					$object.each(settings, (key, value) => {
						sprite.set(key as any, value);
						defaultState.set(key as any, value);
						if (template) {
							template.set(key, value);
						}
					})
				}
			}
		}
	}

	protected _dispatchAdded(): void {

	}

	protected _getIconTemplate(): Template<any> {
		const template: any = {};

		const iconSvgPath = this.get("iconSvgPath");
		if (iconSvgPath != null) {
			template.svgPath = iconSvgPath;
		}

		const iconScale = this.get("iconScale");
		if (iconScale != null) {
			template.scale = iconScale;
		}

		const iconCenterX = this.get("iconCenterX");
		if (iconCenterX != null) {
			template.centerX = iconCenterX;
		}

		const iconCenterY = this.get("iconCenterY");
		if (iconCenterY != null) {
			template.centerY = iconCenterY;
		}

		const strokeColor = this.get("strokeColor");
		if (strokeColor != null) {
			template.stroke = strokeColor;
		}

		const strokeOpacity = this.get("strokeOpacity");
		if (strokeOpacity != null) {
			template.strokeOpacity = strokeOpacity;
		}

		const fillColor = this.get("fillColor");
		if (fillColor != null) {
			template.fill = fillColor;
		}

		const fillOpacity = this.get("fillOpacity");
		if (fillOpacity != null) {
			template.fillOpacity = fillOpacity;
		}

		return Template.new(template);
	}

	public setInteractive(value: boolean) {
		super.setInteractive(value)

		$array.each(this.dataItems, (dataItem) => {
			const bullets = dataItem.bullets;
			if (bullets) {
				$array.each(bullets, (bullet) => {
					const sprite = bullet.get("sprite");
					if (sprite) {
						sprite.set("forceInactive", !value);
					}
				})
			}
		})
	}

	public _prepareChildren() {
		super._prepareChildren();
		if (this.isDirty("iconSvgPath")) {

			$array.each(this._selected, (i) => {
				this._applySettings(i);
			})
		}
	}

	protected _updateSelector(selector: Graphics, index: number) {
		const context = this._getContext(index);
		if (context) {
			const sprite = context.sprite;

			if (sprite) {
				if (sprite.dataItem == this.spriteResizer.get("sprite")?.dataItem) {
					selector.hide(0);
				}
				else {
					if (this._selected.indexOf(index) != -1) {
						selector.show(0);
					}
				}

				const selectorPadding = this.get("selectorPadding", 5);

				let bounds = sprite.bounds();

				let w = (bounds.right - bounds.left) + selectorPadding * 2;
				let h = (bounds.bottom - bounds.top) + selectorPadding * 2;

				selector.setAll({
					width: w,
					height: h,
					x: bounds.left - selectorPadding,
					y: bounds.top - selectorPadding
				})
			}
		}
	}

	public toggleDrawing(enabled: boolean) {
		$array.each(this.dataItems, (dataItem) => {
			const bullets = dataItem.bullets;
			if (bullets) {
				$array.each(bullets, (bullet) => {
					const sprite = bullet.get("sprite");
					if (sprite) {
						sprite.set("forceInactive", !enabled);
					}
				})
			}
		})
	}


	protected _handleBulletDragStart(event: ISpritePointerEvent) {
		// don't call super
		this._hideResizer(event.target);
		const stockChart = this._getStockChart();
		if (stockChart) {
			stockChart._dragStartDrawing(event);
		}
	}

	protected _handleBulletDragStop(event: ISpritePointerEvent) {
		const stockChart = this._getStockChart();
		if (stockChart) {
			stockChart._dragStopDrawing(event);
		}
		this._root.events.once("frameended", () => {
			this._positionBullets(event.target.dataItem as DataItem<IIconSeriesDataItem>);
		})
	}
}
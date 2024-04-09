import type { Sprite, ISpritePointerEvent } from "./Sprite";
import type { IDisposer } from "../util/Disposer";
import type { Template } from "../util/Template";

import { Container, IContainerPrivate, IContainerSettings, IContainerEvents } from "./Container";
import { p50, Percent } from "../util/Percent";
import { RoundedRectangle } from "./RoundedRectangle";
import { Rectangle } from "./Rectangle";
import { color } from "../util/Color";

import * as $math from "../util/Math";

export interface ISpriteResizerSettings extends IContainerSettings {

	/**
	 * Target [[Sprite]] element.
	 */
	sprite?: Sprite

	/**
	 * Target [[Template]]. If a template is set, scale and rotation will be set on Template instead of a Sprite.
	 */
	spriteTemplate?: Template<Sprite>

	/**
	 * Rotation increment in degrees.
	 * 
	 * @default 10
	 */
	rotationStep?: number;

}

export interface ISpriteResizerPrivate extends IContainerPrivate {

}

export interface ISpriteResizerEvents extends IContainerEvents {

}

export class SpriteResizer extends Container {

	declare public _settings: ISpriteResizerSettings;
	declare public _privateSettings: ISpriteResizerPrivate;
	declare public _events: ISpriteResizerEvents;

	public static className: string = "SpriteResizer";
	public static classNames: Array<string> = Container.classNames.concat([SpriteResizer.className]);

	public readonly rectangle: Rectangle = this.children.push(Rectangle.new(this._root, { themeTags: ["rectangle"], fillOpacity: 0, fill: color(0xFFFFFF) }));
	public readonly gripL: Container = this._createGrip("left");
	public readonly gripR: Container = this._createGrip("right");
	public readonly gripT: Container = this._createGrip("top");
	public readonly gripB: Container = this._createGrip("bottom");

	protected _is: number = 1;
	protected _ix: number = 0;
	protected _iw: number = 0;

	protected _positionDP?: IDisposer;

	protected _isHover: boolean = false;

	protected _afterNew() {
		super._afterNew();
		this.addTag("resizer");
		this.set("visible", false);

		this.gripL.events.on("dragged", (e) => {
			this._resize(e.target, -1);
		})

		this.gripR.events.on("dragged", (e) => {
			this._resize(e.target, 1);
		})

		this.gripL.events.on("dragstart", (e) => {
			this._resizeStart(e.target);
		})

		this.gripR.events.on("dragstart", (e) => {
			this._resizeStart(e.target);
		})

		this.gripT.events.on("dragged", (e) => {
			this._rotate(e, 90);
		})

		this.gripB.events.on("dragged", (e) => {
			this._rotate(e, -90);
		})

		this.gripT.events.on("dragstart", (e) => {
			this._resizeStart(e.target);
		})

		this.gripB.events.on("dragstart", (e) => {
			this._resizeStart(e.target);
		})
	}

	protected _resizeStart(grip: Sprite) {
		const sprite = this.get("sprite");
		if (sprite) {
			this._is = sprite.get("scale", 1);
			this._ix = grip.x();
			this._iw = this.width() / 2;
		}
	}

	protected _resize(grip: Sprite, c: number) {
		const sprite = this.get("sprite");
		const spriteTemplate = this.get("spriteTemplate");
		if (sprite) {
			const scale = Math.max(0.01, this._is * (1 + c * (grip.x() - this._ix) / this._iw));
			if (spriteTemplate) {
				spriteTemplate.set("scale", scale);
			}
			else {
				sprite.set("scale", scale);
			}
			sprite.states.lookup("default")!.set("scale", scale);
			this._updatePositions();
		}
	}

	protected _rotate(e: ISpritePointerEvent, delta: number) {
		const sprite = this.get("sprite");
		const spriteTemplate = this.get("spriteTemplate");
		if (sprite) {
			const parent = this.parent;
			if (parent) {

				const rotationStep = this.get("rotationStep", 10);
				let angle = Math.round((($math.getAngle({ x: this.x(), y: this.y() }, parent.toLocal(e.point)) + delta) / rotationStep)) * rotationStep;
				if (spriteTemplate) {
					spriteTemplate.set("rotation", angle);
				}
				else {
					sprite.set("rotation", angle);
				}
				sprite.states.lookup("default")!.set("rotation", angle);
				this._updatePositions();
			}
		}
	}

	protected _createGrip(themeTag: string) {
		const container = this.children.push(Container.new(this._root, {
			themeTags: ["grip", themeTag],
			setStateOnChildren: true,
			draggable: true
		}))

		container.children.push(RoundedRectangle.new(this._root, {
			themeTags: ["outline"],
			centerX: p50,
			centerY: p50
		}))

		container.children.push(RoundedRectangle.new(this._root, {
			centerX: p50,
			centerY: p50
		}));
		return container;
	}

	public _updateChildren() {
		super._updateChildren();

		if (this.isDirty("sprite")) {
			const sprite = this.get("sprite");
			if (sprite) {
				this.show(0);
				this.setPrivate("visible", true);

				this._updatePositions();

				const parent = sprite.parent;

				if (parent) {
					parent.children.moveValue(this, 0);
				}

				this._positionDP = sprite.events.on("positionchanged", () => {
					this._updatePositions();
				})

				this._positionDP = sprite.events.on("boundschanged", () => {
					this._updatePositions();
				})				
			}
			else {
				this.hide(0);
				this.setPrivate("visible", false);

				if (this._positionDP) {
					this._positionDP.dispose();
				}
			}
		}

		if (this.isDirty("width") || this.isDirty("height") || this.isDirty("rotation")) {
			this._updatePositions();
		}
	}

	protected _updatePositions() {
		const sprite = this.get("sprite");
		if (sprite) {
			let bounds = sprite.localBounds();
			let scale = sprite.get("scale", 1);
			let d = 20
			let w = (bounds.right - bounds.left) * scale + d;
			let h = (bounds.bottom - bounds.top) * scale + d;
			let a = sprite.get("rotation", 0);

			const rectangle = this.rectangle;

			let cx = sprite.get("centerX", p50);
			let cy = sprite.get("centerY", p50);

			let cxr = 0;
			if (cx instanceof Percent) {
				cxr = cx.value;
			}

			let cyr = 0;
			if (cy instanceof Percent) {
				cyr = cy.value;
			}

			rectangle.setAll({ centerX: cx, centerY: cy, width: w, height: h });
			this.setAll({ x: sprite.x() + d * (cxr - 0.5) * $math.cos(a) - d * (cyr - 0.5) * $math.sin(a), y: sprite.y() + d * (cyr - 0.5) * $math.cos(a) + d * (cxr - 0.5) * $math.sin(a), width: w, height: h, rotation: a });

			this.gripT.setAll({ x: (0.5 - cxr) * w, y: -cyr * h });
			this.gripB.setAll({ x: (0.5 - cxr) * w, y: (1 - cyr) * h });
			this.gripL.setAll({ x: -cxr * w, y: (0.5 - cyr) * h });
			this.gripR.setAll({ x: (1 - cxr) * w, y: (0.5 - cyr) * h });

			this.rectangle.setAll({ width: w, height: h });
		}
	}
}

import { Text, ITextSettings, ITextPrivate } from "./Text";
import * as $math from "../util/Math";
import type { IRadialText } from "./backend/Renderer";

/**
 * @ignore
 */
export interface IRadialTextSettings extends ITextSettings {
	textType?: "regular" | "circular" | "radial" | "aligned" | "adjusted";
	radius?: number;
	startAngle?: number;
	inside?: boolean;
	orientation?: "inward" | "outward" | "auto";
	kerning?: number;
}

/**
 * @ignore
 */
export interface IRadialTextPrivate extends ITextPrivate {
}

/**
 * @ignore
 */
export class RadialText extends Text {

	declare public _settings: IRadialTextSettings;
	declare public _privateSettings: IRadialTextPrivate;

	public _display: IRadialText = this._root._renderer.makeRadialText("", this.textStyle);

	protected _afterNew() {
		super._afterNew();
	}

	public static className: string = "RadialText";
	public static classNames: Array<string> = Text.classNames.concat([RadialText.className]);

	public _beforeChanged() {
		super._beforeChanged();

		this._display.clear();

		if (this.isDirty("textType")) {
			this._display.textType = this.get("textType");
			this.markDirtyBounds();
		}

		if (this.isDirty("radius")) {
			this._display.radius = this.get("radius");
			this.markDirtyBounds();
		}

		if (this.isDirty("startAngle")) {
			this._display.startAngle = (this.get("startAngle", 0)! + 90) * $math.RADIANS;
			this.markDirtyBounds();
		}

		if (this.isDirty("inside")) {
			this._display.inside = this.get("inside");
			this.markDirtyBounds();
		}

		if (this.isDirty("orientation")) {
			this._display.orientation = this.get("orientation");
			this.markDirtyBounds();
		}

		if (this.isDirty("kerning")) {
			this._display.kerning = this.get("kerning");
			this.markDirtyBounds();
		}
	}

}

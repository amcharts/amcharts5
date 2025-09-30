import { ColorPickerDefaultTheme } from "./ColorPickerDefaultTheme";
import { Color, color } from "../../core/util/Color";
import { Container, IContainerEvents, IContainerPrivate, IContainerSettings } from "../../core/render/Container";
import { Graphics } from "../../core/render/Graphics";
import { RoundedRectangle } from "../../core/render/RoundedRectangle";

export interface IColorPickerButtonSettings extends IContainerSettings {
	color?: Color;
	backgroundColor?: Color;
	colorOpacity?: number;
	disableOpacity?: boolean;
}

export interface IColorPickerButtonPrivate extends IContainerPrivate {
	color?: Color;
}

export interface IColorPickerButtonEvents extends IContainerEvents { }

export class ColorPickerButton extends Container {
	public static className: string = "ColorPickerButton";
	public static classNames: Array<string> = Container.classNames.concat([ColorPickerButton.className]);

	declare public _settings: IColorPickerButtonSettings;
	declare public _privateSettings: IColorPickerButtonPrivate;
	declare public _events: IColorPickerButtonEvents;

	protected _currentRectangle: RoundedRectangle | undefined;

	public noColorGraphics: Graphics = this.children.push(Graphics.new(this._root, {
		themeTags: ["nocolor"]
	}));

	public icon:Graphics = this.children.push(Graphics.new(this._root, {
		themeTags: ["icon"]
	}));

	protected _afterNew(): void {
		this._defaultThemes.push(ColorPickerDefaultTheme.new(this._root));
		this.addTag("colorpickerbutton");
		super._afterNew();

		this.set("background", RoundedRectangle.new(this._root, {
			themeTags: ["background"]
		}))
	}

	public _changed(): void {
		super._changed();

		if (this.isDirty("color") || this.isPrivateDirty("color") || this.isDirty("colorOpacity") || this.isDirty("backgroundColor")) {
			let fill = this.get("color", this.getPrivate("color"));
			let opacity = this.get("colorOpacity", 1);

			if (!fill) {
				this.noColorGraphics.show();
			}
			else {
				this.noColorGraphics.hide();
			}

			const backgroundColor = this.get("backgroundColor", color(0xffffff));

			if (!fill) {
				fill = backgroundColor;
			}

			let stroke = fill;
			let d = -.1;
			if (backgroundColor.toHSL().l < 0.5) {
				d = -d;
			}

			stroke = Color.lighten(fill, d);

			this.noColorGraphics.set(
				"stroke", stroke
			);

			const bg = this.get("background");

			if (bg) {
				bg.setAll({
					fill: fill,
					stroke: stroke,
					fillOpacity: opacity,
					strokeOpacity: Math.max(0.2, opacity)
				})
			}

			this.icon.set("stroke", Color.alternative(stroke, this._root.interfaceColors.get("alternativeText"), this._root.interfaceColors.get("text")));
		}
	}
}
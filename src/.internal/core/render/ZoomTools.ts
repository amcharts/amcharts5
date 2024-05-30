import { Container, IContainerPrivate, IContainerSettings, IContainerEvents } from "../../core/render/Container";
import { Button } from "../../core/render/Button";
import { Graphics } from "../../core/render/Graphics";
import { MultiDisposer, IDisposer } from "../../core/util/Disposer";
import { ZoomableContainer } from "./ZoomableContainer";

export interface IZoomable {
	zoomIn(): void;
	zoomOut(): void;
	goHome(): void;
}

export interface IZoomToolsSettings extends IContainerSettings {

	/**
	 * A target element that zoom tools will control, e.g. [[ZoomableContainer]].
	 */
	target?: IZoomable;

}

export interface IZoomToolsPrivate extends IContainerPrivate {
}

export interface IZoomToolsEvents extends IContainerEvents {
}

/**
 * A tool that displays button for zoomable targets.
 *
 * @since 5.8.0
 * @important
 */
export class ZoomTools extends Container {

	public static className: string = "ZoomTools";
	public static classNames: Array<string> = Container.classNames.concat([ZoomTools.className]);
	declare public _events: IContainerEvents;

	/**
	 * A [[Button]] for home.
	 */
	public readonly homeButton: Button = this.children.push(Button.new(this._root, { width: 35, height: 35, themeTags: ["home"] }));

	/**
	 * A [[Button]] for zoom in.
	 */
	public readonly plusButton: Button = this.children.push(Button.new(this._root, { width: 35, height: 35, themeTags: ["plus"] }));

	/**
	 * A [[Button]] for zoom out.
	 */
	public readonly minusButton: Button = this.children.push(Button.new(this._root, { width: 35, height: 35, themeTags: ["minus"] }));

	declare public _settings: IZoomToolsSettings;
	declare public _privateSettings: IZoomToolsPrivate;

	protected _disposer: MultiDisposer | undefined;
	protected _targetDisposer: IDisposer | undefined;

	protected _afterNew() {
		super._afterNew();

		this.set("position", "absolute");

		this.set("layout", this._root.verticalLayout);
		this.addTag("zoomtools");

		this.plusButton.setAll({
			icon: Graphics.new(this._root, { themeTags: ["icon"] }),
			layout: undefined
		});

		this.minusButton.setAll({
			icon: Graphics.new(this._root, { themeTags: ["icon"] }),
			layout: undefined
		});

		this.homeButton.setAll({
			icon: Graphics.new(this._root, { themeTags: ["icon"] }),
			layout: undefined
		});
	}

	public _prepareChildren() {
		super._prepareChildren();

		if (this.isDirty("target")) {
			const target = this.get("target");

			const previous = this._prevSettings.target;
			if (target) {
				if (target instanceof ZoomableContainer) {
					this._targetDisposer = this.addDisposer(target.contents.on("scale", (scale) => {
						if (scale == target.get("minZoomLevel")) {
							this.minusButton.set("disabled", true)
						}
						else {
							this.minusButton.set("disabled", false)
						}

						if (scale == target.get("maxZoomLevel")) {
							this.plusButton.set("disabled", true)
						}
						else {
							this.plusButton.set("disabled", false)
						}
					}))
					this.root.events.once("frameended", () => {
						if (target.get("scale") == target.get("minZoomLevel")) {
							this.minusButton.set("disabled", true)
						}
					})
				}

				this._disposer = new MultiDisposer([
					this.plusButton.events.on("click", () => {
						target.zoomIn()
					}),
					this.minusButton.events.on("click", () => {
						target.zoomOut()
					}),
					this.homeButton.events.on("click", () => {
						target.goHome()
					})])
			}

			if (previous) {
				if (this._disposer) {
					this._disposer.dispose();
				}
				if (this._targetDisposer) {
					this._targetDisposer.dispose();
				}
			}
		}
	}
}

import type { Root } from "../Root";
import { RoundedRectangle } from "../render/RoundedRectangle";
import { Container, IContainerPrivate, IContainerSettings, IContainerEvents } from "./Container";
import * as $type from "../util/Type";
import { Graphics } from "./Graphics";
import { Button } from "./Button";
import type { Time } from "../util/Animation";
import type { Template } from "../../core/util/Template";
import * as $utils from "../util/Utils";
import type { Animation } from "../util/Entity";

export interface IScrollbarSettings extends IContainerSettings {

	/**
	 * Orientation of the scrollbar.
	 */
	orientation: "horizontal" | "vertical";

	/**
	 * Relative start of the selected range, with 0 meaning beginning, and 1 the
	 * end.
	 */
	start?: number;

	/**
	 * Relative end of the selected range, with 0 meaning beginning, and 1 the
	 * end.
	 */
	end?: number;

	/**
	 * Number of milliseconds to play scroll animations for.
	 */
	animationDuration?: number;

	/**
	 * Easing function to use for animations.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/animations/#Easing_functions} for more info
	 */
	animationEasing?: (t: Time) => Time;

}

export interface IScrollbarPrivate extends IContainerPrivate {

	/**
	 * @ignore
	 */
	isBusy?: boolean;

	/**
	 * @ignore
	 */
	positionTextFunction?: (position: number) => string;

}

export interface IScrollbarEvents extends IContainerEvents {

	/**
	 * Invoked when range of the selection changes.
	 */
	rangechanged: { start: number, end: number };
}

/**
 * A control that allows zooming chart's axes, or other uses requiring range
 * selection.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/scrollbars/} for more info
 */
export class Scrollbar extends Container {

	/**
	 * Use this method to create an instance of this class.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/getting-started/#New_element_syntax} for more info
	 * @param   root      Root element
	 * @param   settings  Settings
	 * @param   template  Template
	 * @return            Instantiated object
	 */
	public static new(root: Root, settings: Scrollbar["_settings"], template?: Template<Scrollbar>): Scrollbar {
		this._addOrientationClass(root, settings);
		const x = new Scrollbar(root, settings, true, template);
		x._afterNew();
		return x;
	}

	public static _addOrientationClass(root: Root, settings: Scrollbar["_settings"]) {
		settings.themeTags = $utils.mergeTags(settings.themeTags, ["scrollbar", settings.orientation]);
		if (!settings.background) {
			settings.background = RoundedRectangle.new(root, {
				themeTags: $utils.mergeTags(settings.themeTags, ["main", "background"])
			});
		}
	}

	declare public _settings: IScrollbarSettings;
	declare public _privateSettings: IScrollbarPrivate;
	declare public _events: IScrollbarEvents;

	public static className: string = "Scrollbar";
	public static classNames: Array<string> = Container.classNames.concat([Scrollbar.className]);

	/**
	 * A thumb elment - a draggable square between the grips, used for panning
	 * the selection.
	 */
	public thumb: RoundedRectangle = this._makeThumb();

	/**
	 * Start grip button.
	 */
	public startGrip: Button = this._makeButton();

	/**
	 * End grip button.
	 */
	public endGrip: Button = this._makeButton();

	protected _thumbBusy: boolean = false;

	protected _startDown: boolean = false;

	protected _endDown: boolean = false;

	protected _thumbDown: boolean = false;

	protected _makeButton(): Button {
		return this.children.push(Button.new(this._root, {
			themeTags: ["resize", "button", this.get("orientation")], icon: Graphics.new(this._root, {
				themeTags: ["icon"]
			})
		}));
	}

	protected _makeThumb(): RoundedRectangle {
		return this.children.push(RoundedRectangle.new(this._root, {
			themeTags: ["thumb", this.get("orientation")]
		}));
	}

	protected _handleAnimation(animation: Animation<any>) {
		if (animation) {
			animation.events.on("stopped", () => {
				this._setPrivate("isBusy", false);
				this._thumbBusy = false;
			})
		}
	}

	protected _afterNew() {
		super._afterNew();

		const startGrip = this.startGrip;
		const endGrip = this.endGrip;
		const thumb = this.thumb;
		const background = this.get("background");

		if (background) {
			background.events.on("click", (event) => {
				this._setPrivate("isBusy", true);
				const point = this._display.toLocal(event.point);

				const w = this.width();
				const h = this.height();

				const orientation = this.get("orientation");

				let newMiddle: number;

				if (orientation == "vertical") {
					newMiddle = (point.y - thumb.height() / 2) / h;
				}
				else {
					newMiddle = (point.x - thumb.width() / 2) / w;
				}

				let newCoordinate: number;
				let key: "x" | "y";

				if (orientation == "vertical") {
					newCoordinate = newMiddle * h;
					key = "y";
				}
				else {
					newCoordinate = newMiddle * w;
					key = "x";
				}

				this._thumbBusy = true;
				this._handleAnimation(this.thumb.animate({ key: key, to: newCoordinate, duration: this.get("animationDuration", 0), easing: this.get("animationEasing") }));
			})
		}

		thumb.events.on("dblclick", () => {
			const duration = this.get("animationDuration", 0);
			const easing = this.get("animationEasing");

			this.animate({ key: "start", to: 0, duration: duration, easing: easing });
			this.animate({ key: "end", to: 1, duration: duration, easing: easing });
		});

		this._disposers.push(startGrip.events.on("pointerdown", () => {
			this._setPrivate("isBusy", true);
			this._startDown = true;
		}))

		this._disposers.push(endGrip.events.on("pointerdown", () => {
			this._setPrivate("isBusy", true);
			this._endDown = true;
		}))

		this._disposers.push(thumb.events.on("pointerdown", () => {
			this._setPrivate("isBusy", true);
			this._thumbDown = true;
		}))

		this._disposers.push(startGrip.events.on("globalpointerup", () => {
			if (this._startDown) {
				this._setPrivate("isBusy", false);
			}
			this._startDown = false;
		}))

		this._disposers.push(endGrip.events.on("globalpointerup", () => {
			if (this._endDown) {
				this._setPrivate("isBusy", false);
			}
			this._endDown = false;
		}))

		this._disposers.push(thumb.events.on("globalpointerup", () => {
			if (this._thumbDown) {
				this._setPrivate("isBusy", false);
			}
			this._thumbDown = false;
		}))

		this._disposers.push(startGrip.on("x", () => {
			this._updateThumb();
		}));

		this._disposers.push(endGrip.on("x", () => {
			this._updateThumb();
		}));

		this._disposers.push(startGrip.on("y", () => {
			this._updateThumb();
		}));

		this._disposers.push(endGrip.on("y", () => {
			this._updateThumb();
		}));

		this._disposers.push(thumb.events.on("positionchanged", () => {
			this._updateGripsByThumb();
		}));

		if (this.get("orientation") == "vertical") {
			startGrip.set("x", 0);
			endGrip.set("x", 0);

			this._disposers.push(thumb.adapters.add("y", (value) => {
				return Math.max(Math.min(Number(value), this.height() - thumb.height()), 0);
			}))

			this._disposers.push(thumb.adapters.add("x", (_value) => {
				return this.width() / 2;
			}))

			this._disposers.push(startGrip.adapters.add("x", (_value) => {
				return this.width() / 2;
			}))

			this._disposers.push(endGrip.adapters.add("x", (_value) => {
				return this.width() / 2;
			}))

			this._disposers.push(startGrip.adapters.add("y", (value) => {
				return Math.max(Math.min(Number(value), this.height()), 0);
			}))

			this._disposers.push(endGrip.adapters.add("y", (value) => {
				return Math.max(Math.min(Number(value), this.height()), 0);
			}))
		}
		else {
			startGrip.set("y", 0);
			endGrip.set("y", 0);

			this._disposers.push(thumb.adapters.add("x", (value) => {
				return Math.max(Math.min(Number(value), this.width() - thumb.width()), 0);
			}))

			this._disposers.push(thumb.adapters.add("y", (_value) => {
				return this.height() / 2;
			}))

			this._disposers.push(startGrip.adapters.add("y", (_value) => {
				return this.height() / 2;
			}))

			this._disposers.push(endGrip.adapters.add("y", (_value) => {
				return this.height() / 2;
			}))

			this._disposers.push(startGrip.adapters.add("x", (value) => {
				return Math.max(Math.min(Number(value), this.width()), 0);
			}))

			this._disposers.push(endGrip.adapters.add("x", (value) => {
				return Math.max(Math.min(Number(value), this.width()), 0);
			}))
		}
	}

	public _updateChildren() {
		super._updateChildren();

		if (this.isDirty("end") || this.isDirty("start") || this._sizeDirty) {
			this.updateGrips();
		}
	}

	public _changed() {
		super._changed();
		if (this.isDirty("start") || this.isDirty("end")) {
			const eventType = "rangechanged";
			if (this.events.isEnabled(eventType)) {
				this.events.dispatch(eventType, { type: eventType, target: this, start: this.get("start", 0), end: this.get("end", 1) });
			}
		}
	}

	/**
	 * @ignore
	 */
	public updateGrips() {
		const startGrip = this.startGrip;
		const endGrip = this.endGrip;

		const orientation = this.get("orientation");
		const height = this.height();
		const width = this.width();

		if (orientation == "vertical") {
			startGrip.set("y", height * this.get("start", 0));
			endGrip.set("y", height * this.get("end", 1));
		}
		else {
			startGrip.set("x", width * this.get("start", 0));
			endGrip.set("x", width * this.get("end", 1));
		}

		const valueFunction = this.getPrivate("positionTextFunction");
		const from = Math.round(this.get("start", 0) * 100);
		const to = Math.round(this.get("end", 0) * 100);
		let fromValue: string;
		let toValue: string;
		if (valueFunction) {
			fromValue = valueFunction.call(this, this.get("start", 0));
			toValue = valueFunction.call(this, this.get("end", 0));
		}
		else {
			fromValue = from + "%";
			toValue = to + "%";
		}

		startGrip.set("ariaLabel", this._root.language.translate("From %1", undefined, fromValue));
		startGrip.set("ariaValueNow", "" + from);
		startGrip.set("ariaValueText", from + "%");

		endGrip.set("ariaLabel", this._root.language.translate("To %1", undefined, toValue));
		endGrip.set("ariaValueNow", "" + to);
		endGrip.set("ariaValueText", to + "%");
	}

	protected _updateThumb() {
		const thumb = this.thumb;
		const startGrip = this.startGrip;
		const endGrip = this.endGrip;

		const height = this.height();
		const width = this.width();

		let x0 = startGrip.x();
		let x1 = endGrip.x();

		let y0 = startGrip.y();
		let y1 = endGrip.y();

		let start: number = 0;
		let end: number = 1;

		if (this.get("orientation") == "vertical") {
			if ($type.isNumber(y0) && $type.isNumber(y1)) {
				if (!this._thumbBusy && !thumb.isDragging()) {
					thumb.set("height", y1 - y0);
					thumb.set("y", y0);
				}
				start = y0 / height;
				end = y1 / height;
			}
		}
		else {
			if ($type.isNumber(x0) && $type.isNumber(x1)) {
				if (!this._thumbBusy && !thumb.isDragging()) {
					thumb.set("width", x1 - x0);
					thumb.set("x", x0);
				}
				start = x0 / width;
				end = x1 / width;
			}
		}

		if (this.getPrivate("isBusy") && (this.get("start") != start || this.get("end") != end)) {
			this.set("start", start);
			this.set("end", end);
		}

		const valueFunction = this.getPrivate("positionTextFunction");
		const from = Math.round(this.get("start", 0) * 100);
		const to = Math.round(this.get("end", 0) * 100);
		let fromValue: string;
		let toValue: string;
		if (valueFunction) {
			fromValue = valueFunction.call(this, this.get("start", 0));
			toValue = valueFunction.call(this, this.get("end", 0));
		}
		else {
			fromValue = from + "%";
			toValue = to + "%";
		}

		thumb.set("ariaLabel", this._root.language.translate("From %1 to %2", undefined, fromValue, toValue));
		thumb.set("ariaValueNow", "" + from);
		thumb.set("ariaValueText", from + "%");
	}


	protected _updateGripsByThumb() {

		const thumb = this.thumb;
		const startGrip = this.startGrip;
		const endGrip = this.endGrip;

		if (this.get("orientation") == "vertical") {
			const thumbSize = thumb.height();
			startGrip.set("y", thumb.y());
			endGrip.set("y", thumb.y() + thumbSize);
		}
		else {
			const thumbSize = thumb.width();
			startGrip.set("x", thumb.x());
			endGrip.set("x", thumb.x() + thumbSize);
		}
	}
}

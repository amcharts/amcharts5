import type { Animation } from "../util/Entity";
import type { Time } from "../util/Animation";

import { RoundedRectangle } from "../render/RoundedRectangle";
import { Container, IContainerPrivate, IContainerSettings, IContainerEvents } from "./Container";
import { Graphics } from "./Graphics";
import { Button } from "./Button";

import * as $type from "../util/Type";
import * as $utils from "../util/Utils";

export interface IScrollbarSettings extends IContainerSettings {

	/**
	 * Orientation of the scrollbar.
	 */
	orientation: "horizontal" | "vertical";

	/**
	 * Start of the selected range, from `0` to `1`: `0` is the left end, or
	 * the top on a vertical scrollbar.
	 *
	 * @default 0
	 */
	start?: number;

	/**
	 * End of the selected range, from `0` to `1`: `1` is the right end, or
	 * the bottom on a vertical scrollbar.
	 *
	 * @default 1
	 */
	end?: number;

	/**
	 * Duration in milliseconds of scroll animations, such as after a click on
	 * the scrollbar's background.
	 */
	animationDuration?: number;

	/**
	 * Easing function of scroll animations.
	 *
	 * @see {@link https://docs.amcharts.com/v5/concepts/animations/#easing-functions} for more info
	 */
	animationEasing?: (t: Time) => Time;

	/**
	 * Puts the scrollbar on the opposite side of the chart: a horizontal
	 * scrollbar below the plot area instead of above it, a vertical one on the
	 * left instead of the right. It can be changed at any time.
	 *
	 * Works only for scrollbars set as a chart's `scrollbarX` or `scrollbarY`.
	 *
	 * @default false
	 * @since 5.20.2
	 */
	opposite?: boolean;

	/**
	 * Where the scrollbar sits relative to the axes on its side: `true` beyond
	 * them (outermost), `false` between them and the plot area. If not set,
	 * the chart decides. It can be changed at any time.
	 *
	 * Like `opposite`, works only for scrollbars set as a chart's `scrollbarX`
	 * or `scrollbarY`.
	 *
	 * @since 5.21.0
	 */
	outsideAxes?: boolean;

}

export interface IScrollbarPrivate extends IContainerPrivate {

	/**
	 * @ignore
	 */
	isBusy?: boolean;

	/**
	 * @ignore
	 */
	positionTextFunction?: (position: number, isEnd?: boolean) => string;

}

export interface IScrollbarEvents extends IContainerEvents {

	/**
	 * The selected range (`start` or `end`) changed.
	 */
	rangechanged: { start: number, end: number, grip?: "start" | "end" };

	/**
	 * The pointer was released after pressing a grip or the thumb.
	 */
	released:{};
}

/**
 * A control for selecting a range, such as the zoom of a chart's axes: the
 * grips resize the range, the thumb between them moves it.
 *
 * @see {@link https://docs.amcharts.com/v5/charts/xy-chart/scrollbars/} for more info
 */
export class Scrollbar extends Container {

	public _addOrientationClass() {
		this._settings.themeTags = $utils.mergeTags(this._settings.themeTags, ["scrollbar", this._settings.orientation]);

		this._setDefaultTagged("background", $utils.mergeTags(this._settings.themeTags, ["main", "background"]), () => {
			return RoundedRectangle.new(this._root, {});
		});
	}

	declare public _settings: IScrollbarSettings;
	declare public _privateSettings: IScrollbarPrivate;
	declare public _events: IScrollbarEvents;

	public static className: string = "Scrollbar";
	public static classNames: Array<string> = Container.classNames.concat([Scrollbar.className]);

	/**
	 * The draggable bar between the grips, which moves the selected range.
	 * Double-clicking it selects the full range.
	 */
	public thumb: RoundedRectangle = this._makeThumb();

	/**
	 * The grip that drags the start of the range.
	 */
	public startGrip: Button = this._makeButton();

	/**
	 * The grip that drags the end of the range.
	 */
	public endGrip: Button = this._makeButton();

	protected _thumbBusy: boolean = false;

	protected _startDown: boolean = false;

	protected _endDown: boolean = false;

	protected _thumbDown: boolean = false;

	protected _gripDown?: "start" | "end";

	protected _makeButton(): Button {
		return this.children.push(Button.new(this._root, {
			themeTags: ["resize", "button", this.get("orientation")], icon: Graphics.new(this._root, {
				themeTags: ["icon"]
			})._markC("themeTags")
		})._markC("themeTags", "icon"));
	}

	protected _makeThumb(): RoundedRectangle {
		return this.children.push(RoundedRectangle.new(this._root, {
			themeTags: ["thumb", this.get("orientation")]
		})._markC("themeTags"));
	}

	protected _handleAnimation(animation: Animation<any>) {
		if (animation) {
			this._disposers.push(
				animation.events.on("stopped", () => {
					this.setPrivateRaw("isBusy", false);
					this._thumbBusy = false;
				})
			)
		}
	}

	protected _afterNew() {
		this._addOrientationClass();
		super._afterNew();

		const startGrip = this.startGrip;
		const endGrip = this.endGrip;
		const thumb = this.thumb;
		const background = this.get("background");

		if (background) {
			this._disposers.push(
				background.events.on("click", (event) => {
					this.setPrivateRaw("isBusy", true);
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


					const duration = this.get("animationDuration", 0);
					if (duration > 0) {
						this._thumbBusy = true;
						this._handleAnimation(this.thumb.animate({ key: key, to: newCoordinate, duration: duration, easing: this.get("animationEasing") }));
					}
					else {
						this.thumb._setC(key, newCoordinate);
						this._root.events.once("frameended", () => {
							this.setPrivateRaw("isBusy", false);
						})
					}
				})
			)
		}

		this._disposers.push(thumb.events.on("dblclick", (event) => {

			if (!$utils.isLocalEvent(event.originalEvent, this)) {
				return;
			}

			const duration = this.get("animationDuration", 0);
			const easing = this.get("animationEasing");

			this.animate({ key: "start", to: 0, duration: duration, easing: easing });
			this.animate({ key: "end", to: 1, duration: duration, easing: easing });
		}));

		this._disposers.push(startGrip.events.on("pointerdown", () => {
			this.setPrivateRaw("isBusy", true);
			this._startDown = true;
			this._gripDown = "start";
		}))

		this._disposers.push(endGrip.events.on("pointerdown", () => {
			this.setPrivateRaw("isBusy", true);
			this._endDown = true;
			this._gripDown = "end";
		}))

		this._disposers.push(thumb.events.on("pointerdown", () => {
			this.setPrivateRaw("isBusy", true);
			this._thumbDown = true;
			this._gripDown = undefined;
		}))

		this._disposers.push(startGrip.events.on("globalpointerup", () => {
			if (this._startDown) {
				this.setPrivateRaw("isBusy", false);
				this._released();
			}
			this._startDown = false;
		}))

		this._disposers.push(endGrip.events.on("globalpointerup", () => {
			if (this._endDown) {
				this.setPrivateRaw("isBusy", false);
				this._released();
			}
			this._endDown = false;
		}))

		this._disposers.push(thumb.events.on("globalpointerup", () => {
			if (this._thumbDown) {
				this.setPrivateRaw("isBusy", false);
				this._released();
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
			startGrip._setC("x", 0);
			endGrip._setC("x", 0);

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
			startGrip._setC("y", 0);
			endGrip._setC("y", 0);

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
				this.events.dispatch(eventType, { type: eventType, target: this, start: this.get("start", 0), end: this.get("end", 1), grip: this._gripDown });
			}
		}
	}

	protected _released(){
		const eventType = "released";
		if (this.events.isEnabled(eventType)) {
			this.events.dispatch(eventType, { type: eventType, target: this });
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
			startGrip._setC("y", height * this.get("start", 0));
			endGrip._setC("y", height * this.get("end", 1));
		}
		else {
			startGrip._setC("x", width * this.get("start", 0));
			endGrip._setC("x", width * this.get("end", 1));
		}

		const valueFunction = this.getPrivate("positionTextFunction");
		const from = Math.round(this.get("start", 0) * 100);
		const to = Math.round(this.get("end", 0) * 100);
		let fromValue: string;
		let toValue: string;
		if (valueFunction) {
			fromValue = valueFunction.call(this, this.get("start", 0));
			toValue = valueFunction.call(this, this.get("end", 0), true);
		}
		else {
			fromValue = from + "%";
			toValue = to + "%";
		}

		startGrip._setC("ariaLabel", this._t("From %1", undefined, fromValue));
		startGrip._setC("ariaValueNow", "" + from);
		startGrip._setC("ariaValueText", from + "%");

		startGrip._setC("ariaValueMin", "0");
		startGrip._setC("ariaValueMax", "100");

		endGrip._setC("ariaLabel", this._t("To %1", undefined, toValue));
		endGrip._setC("ariaValueNow", "" + to);
		endGrip._setC("ariaValueText", to + "%");

		endGrip._setC("ariaValueMin", "0");
		endGrip._setC("ariaValueMax", "100");
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
					thumb._setC("height", y1 - y0);
					thumb._setC("y", y0);
				}
				start = y0 / height;
				end = y1 / height;
			}
		}
		else {
			if ($type.isNumber(x0) && $type.isNumber(x1)) {
				if (!this._thumbBusy && !thumb.isDragging()) {
					thumb._setC("width", x1 - x0);
					thumb._setC("x", x0);
				}
				start = x0 / width;
				end = x1 / width;
			}
		}

		if (this.getPrivate("isBusy") && (this.get("start") != start || this.get("end") != end)) {
			this._setC("start", start);
			this._setC("end", end);
		}

		const valueFunction = this.getPrivate("positionTextFunction");
		const from = Math.round(this.get("start", 0) * 100);
		const to = Math.round(this.get("end", 0) * 100);
		let fromValue: string;
		let toValue: string;
		if (valueFunction) {
			fromValue = valueFunction.call(this, this.get("start", 0));
			toValue = valueFunction.call(this, this.get("end", 0), true);
		}
		else {
			fromValue = from + "%";
			toValue = to + "%";
		}

		thumb._setC("ariaLabel", this._t("From %1 to %2", undefined, fromValue, toValue));
		thumb._setC("ariaValueNow", "" + from);
		thumb._setC("ariaValueText", from + "%");
	}


	protected _updateGripsByThumb() {

		const thumb = this.thumb;
		const startGrip = this.startGrip;
		const endGrip = this.endGrip;

		if (this.get("orientation") == "vertical") {
			const thumbSize = thumb.height();
			startGrip._setC("y", thumb.y());
			endGrip._setC("y", thumb.y() + thumbSize);
		}
		else {
			const thumbSize = thumb.width();
			startGrip._setC("x", thumb.x());
			endGrip._setC("x", thumb.x() + thumbSize);
		}
	}
}

import type { Animation } from "../util/Entity";
import type { Time } from "../util/Animation";
import type { Sprite } from "./Sprite";

import { RoundedRectangle } from "../render/RoundedRectangle";
import { Container, IContainerPrivate, IContainerSettings, IContainerEvents } from "./Container";
import { Graphics } from "./Graphics";
import { Button } from "./Button";

import * as $array from "../util/Array";
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

	/**
	 * Hides the scrollbar where the chart is this many pixels across it or
	 * less: a vertical scrollbar when the chart is that narrow, a horizontal
	 * one when it is that low, so the plot gets the room. While it is hidden,
	 * the chart turns on `pinchZoomX` or `pinchZoomY`, unless that is set in
	 * code, as on a phone a chart is zoomed by pinching. A scrollbar with
	 * `forceHidden` set in code is left alone. On a stock chart, the whole
	 * stock chart is measured, not the panel the scrollbar is on.
	 *
	 * Works only for scrollbars set as a chart's `scrollbarX` or `scrollbarY`.
	 *
	 * @since 5.22.0
	 * @see {@link https://docs.amcharts.com/v5/charts/xy-chart/scrollbars/#hiding-on-small-charts} for more info
	 */
	autoHide?: number;

}

export interface IScrollbarPrivate extends IContainerPrivate {

	/**
	 * Whether `autoHide` hides the scrollbar.
	 *
	 * @ignore
	 */
	autoHidden?: boolean;

	/**
	 * @ignore
	 */
	isBusy?: boolean;

	/**
	 * @ignore
	 */
	positionTextFunction?: (position: number, isEnd?: boolean) => string;

	/**
	 * Returns `true` if values go against the scrollbar's direction (bottom to
	 * top on a vertical one). Screen readers then read the start grip as the
	 * end of the range and the end grip as its start, and `positionTextFunction`
	 * gets positions flipped (`1 - position`).
	 *
	 * @ignore
	 */
	reversedFunction?: () => boolean;

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

			this._disposers.push(thumb.adapters._addInternal("y", (value) => {
				return Math.max(Math.min(Number(value), this.height() - thumb.height()), 0);
			}))

			this._disposers.push(thumb.adapters._addInternal("x", (_value) => {
				return this.width() / 2;
			}))

			this._disposers.push(startGrip.adapters._addInternal("x", (_value) => {
				return this.width() / 2;
			}))

			this._disposers.push(endGrip.adapters._addInternal("x", (_value) => {
				return this.width() / 2;
			}))

			this._disposers.push(startGrip.adapters._addInternal("y", (value) => {
				return Math.max(Math.min(Number(value), this.height()), 0);
			}))

			this._disposers.push(endGrip.adapters._addInternal("y", (value) => {
				return Math.max(Math.min(Number(value), this.height()), 0);
			}))
		}
		else {
			startGrip._setC("y", 0);
			endGrip._setC("y", 0);

			this._disposers.push(thumb.adapters._addInternal("x", (value) => {
				return Math.max(Math.min(Number(value), this.width() - thumb.width()), 0);
			}))

			this._disposers.push(thumb.adapters._addInternal("y", (_value) => {
				return this.height() / 2;
			}))

			this._disposers.push(startGrip.adapters._addInternal("y", (_value) => {
				return this.height() / 2;
			}))

			this._disposers.push(endGrip.adapters._addInternal("y", (_value) => {
				return this.height() / 2;
			}))

			this._disposers.push(startGrip.adapters._addInternal("x", (value) => {
				return Math.max(Math.min(Number(value), this.width()), 0);
			}))

			this._disposers.push(endGrip.adapters._addInternal("x", (value) => {
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

		const readout = this._readout();

		// When reversed, the start grip is where the range ends
		const fromGrip = readout.reversed ? endGrip : startGrip;
		const toGrip = readout.reversed ? startGrip : endGrip;

		this._setAria(fromGrip, "ariaLabel", this._t("From %1", undefined, readout.fromText));
		this._setAria(fromGrip, "ariaValueNow", "" + readout.from);
		this._setAria(fromGrip, "ariaValueText", readout.from + "%");

		this._setAria(toGrip, "ariaLabel", this._t("To %1", undefined, readout.toText));
		this._setAria(toGrip, "ariaValueNow", "" + readout.to);
		this._setAria(toGrip, "ariaValueText", readout.to + "%");

		$array.each([startGrip, endGrip], (grip) => {
			this._setAria(grip, "ariaValueMin", "0");
			this._setAria(grip, "ariaValueMax", "100");
		});
	}

	// Fills in a grip's or the thumb's screen reader text, unless it was set in
	// code: then it stays as set
	protected _setAria(target: Sprite, key: "ariaLabel" | "ariaValueNow" | "ariaValueText" | "ariaValueMin" | "ariaValueMax", value: string): void {
		if (!target.isUserSetting(key) || target.isComputedSetting(key)) {
			target._setC(key, value);
		}
	}

	/**
	 * The selected range as screen readers read it: percentages and texts for
	 * its start and end, in the direction values go.
	 */
	protected _readout(): { from: number, to: number, fromText: string, toText: string, reversed: boolean } {
		const reversedFunction = this.getPrivate("reversedFunction");
		const reversed = reversedFunction ? reversedFunction.call(this) : false;

		const start = this.get("start", 0);
		const end = this.get("end", 1);

		const fromPosition = reversed ? 1 - end : start;
		const toPosition = reversed ? 1 - start : end;

		const from = Math.round(fromPosition * 100);
		const to = Math.round(toPosition * 100);

		const valueFunction = this.getPrivate("positionTextFunction");
		let fromText = "";
		let toText = "";
		if (valueFunction) {
			fromText = valueFunction.call(this, fromPosition);
			toText = valueFunction.call(this, toPosition, true);
		}

		// An axis with no tooltip has no text for a position
		if (!fromText) {
			fromText = from + "%";
		}
		if (!toText) {
			toText = to + "%";
		}

		return { from, to, fromText, toText, reversed };
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

		const readout = this._readout();
		this._setAria(thumb, "ariaLabel", this._t("From %1 to %2", undefined, readout.fromText, readout.toText));
		this._setAria(thumb, "ariaValueNow", "" + readout.from);
		this._setAria(thumb, "ariaValueText", readout.from + "%");
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

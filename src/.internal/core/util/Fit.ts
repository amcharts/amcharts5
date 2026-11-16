import type { Label } from "../render/Label";
import type { Root } from "../Root";
import type { Text } from "../render/Text";
import type { IBounds } from "./IBounds";
import type { IPoint } from "./IPoint";

import * as $array from "./Array";
import * as $math from "./Math";
import * as $object from "./Object";
import * as $type from "./Type";

/**
 * Sets a setting as computed, or takes it back with `undefined`. A value the
 * author set on the element itself is left alone. Returns whether it changed.
 *
 * @ignore
 */
export function setFit(entity: any, key: string, value: any, tolerance: number = 0.01): boolean {
	const computed = entity.isComputedSetting(key);
	if (value == null) {
		if (computed) {
			entity.remove(key);
			return true;
		}
	}
	else if (computed || !entity.isUserSetting(key)) {
		const now = entity.get(key);
		if ($type.isNumber(value) && $type.isNumber(now) ? Math.abs(now - value) > tolerance : now !== value) {
			entity._setC(key, value);
			return true;
		}
	}
	return false;
}

/**
 * A text's lines as last laid out: the widest, all widths together, the
 * tallest, all heights together, and how many.
 *
 * @ignore
 */
export function lineSizes(text: Text): { widest: number, width: number, tallest: number, height: number, count: number } {
	const lines: Array<{ width: number, height: number }> = (text._display as any)._textInfo || [];
	const size = { widest: 0, width: 0, tallest: 0, height: 0, count: lines.length };
	$array.each(lines, (line) => {
		size.widest = Math.max(size.widest, line.width);
		size.width += line.width;
		size.tallest = Math.max(size.tallest, line.height);
		size.height += line.height;
	});
	return size;
}

/**
 * Fitting passes skip frames within half a second of their last pass. A frame
 * one of them skipped asks for one more frame, in which every pass of the root
 * runs: it starts a new `Root._passRound`.
 *
 * @ignore
 */
export function passLater(root: Root, delay: number): void {
	if (!root._passTimer) {
		root._passTimer = root._rootContainer.setTimeout(() => {
			root._passTimer = undefined;
			root._passRound++;
			root._addDirtyEntity(root._rootContainer);
		}, Math.max(0, delay));
	}
}

/**
 * What a label's text was measured in: its font, and the web fonts loaded since.
 *
 * @ignore
 */
export function fontKey(label: Label): string {
	return [label.get("fontSize"), label.get("fontFamily"), label.get("fontWeight"), label.root._fontLoads].join();
}

/**
 * Whether two boxes overlap by more than half a pixel.
 *
 * @ignore
 */
export function overlap(a: IBounds, b: IBounds): boolean {
	return a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5;
}

/**
 * Whether a box is inside another, give or take a pixel.
 *
 * @ignore
 */
export function inside(box: IBounds, area: IBounds): boolean {
	return box.left >= area.left - 1 && box.right <= area.right + 1 && box.top >= area.top - 1 && box.bottom <= area.bottom + 1;
}

/**
 * Keeps the labels its owner hid for not fitting, with the box and place they
 * had, and tells when one would fit again.
 *
 * @ignore
 */
export class LabelFit {

	public out: { [uid: number]: { label: Label, box: IBounds, x: number, y: number, text: string, w: number, h: number, font: string } } = {};

	// labels that did not fit in the last pass, and where they were
	protected _suspects: { [uid: number]: IPoint } = {};
	protected _next: { [uid: number]: IPoint } = {};

	/**
	 * Checks a label: `box` is where it is drawn, if it is. Returns 1 when it is
	 * to be hidden, -1 when it is to be shown again, 0 otherwise. `populate` reads
	 * its text anew, which is slow, for a label whose drawn text may be out of date.
	 */
	public check(label: Label, box: IBounds | undefined, fits: (box: IBounds) => boolean, populate?: boolean): number {
		const uid = label.uid;
		const kept = this.out[uid];
		if (!kept && (!box || fits(box))) {
			return 0;
		}
		const text = populate ? label.text._getText() : label.text._display.text;
		const font = fontKey(label);
		if (kept && kept.font !== font) {
			// measured in another font: shown, and checked then
			delete this.out[uid];
			return -1;
		}
		// where the label is placed, on the page
		let x = label.x();
		let y = label.y();
		if (label.get("textType" as any) == "circular") {
			const radius = (label as any).radius();
			const angle = label.get("labelAngle" as any, 0);
			x = radius * $math.cos(angle);
			y = radius * $math.sin(angle);
		}
		const parent = label.parent;
		const point = parent ? parent.toGlobal({ x: x, y: y }) : { x: x, y: y };
		const size = label.text.localBounds();
		let w = size.right - size.left;
		let h = size.bottom - size.top;
		if (kept) {
			// its last box, moved to where the label is now
			const dx = point.x - kept.x;
			const dy = point.y - kept.y;
			box = { left: kept.box.left + dx, right: kept.box.right + dx, top: kept.box.top + dy, bottom: kept.box.bottom + dy };
			if (text === kept.text) {
				w = kept.w;
				h = kept.h;
			}
			else {
				delete this.out[uid];
				if (!(w > 0 && h > 0 && kept.w > 0 && kept.h > 0)) {
					// size not known: shown, and checked then
					return -1;
				}
				// another text: the box scaled to it; text sizes run along the label
				const angle = label.get("rotation", 0);
				const turned = Math.abs($math.sin(angle)) > Math.abs($math.cos(angle));
				const sx = turned ? h / kept.h : w / kept.w;
				const sy = turned ? w / kept.w : h / kept.h;
				box = { left: point.x + (box.left - point.x) * sx, right: point.x + (box.right - point.x) * sx, top: point.y + (box.top - point.y) * sy, bottom: point.y + (box.bottom - point.y) * sy };
			}
			if (fits(box)) {
				delete this.out[uid];
				return -1;
			}
		}
		else {
			// hidden only when it does not fit in two passes at the same place
			const suspect = this._suspects[uid];
			if (!suspect || Math.abs(suspect.x - point.x) >= 0.5 || Math.abs(suspect.y - point.y) >= 0.5) {
				this._next[uid] = point;
				return 0;
			}
		}
		this.out[uid] = { label: label, box: box!, x: point.x, y: point.y, text: text, w: w, h: h, font: font };
		return kept ? 0 : 1;
	}

	/**
	 * Ends a pass. Returns whether a label waits for one more pass to be hidden.
	 */
	public end(): boolean {
		$object.each(this.out, (uid, entry) => {
			if (entry.label.isDisposed()) {
				delete this.out[uid];
			}
		});
		this._suspects = this._next;
		this._next = {};
		return $object.keys(this._suspects).length > 0;
	}
}

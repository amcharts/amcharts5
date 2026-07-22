import { Color } from "./Color";

/**
 * OKLCH color helpers.
 *
 * OKLCH is a perceptually-uniform cylindrical color space (lightness, chroma,
 * hue) derived from Björn Ottosson's OKLab. Unlike HSL, equal steps in OKLCH
 * lightness/hue look equally different to the eye, which makes it ideal for
 * generating balanced categorical palettes from a single seed color.
 *
 * This module is a small, dependency-free converter (sRGB <> OKLab <> OKLCH)
 * plus an sRGB gamut clamp. It is additive: nothing in the existing color
 * pipeline changes. Themes that need perceptual palettes import it to
 * pre-compute a `colors` array.
 *
 * Ranges:
 * - `l` (lightness): 0 (black) .. 1 (white)
 * - `c` (chroma):    0 (gray) .. ~0.37 (most saturated sRGB)
 * - `h` (hue):       0 .. 360 degrees
 *
 * @see {@link https://bottosson.github.io/posts/oklab/} for the source math
 */

export interface IOKLCH {
	/** Lightness, 0 .. 1 */
	l: number;
	/** Chroma, 0 .. ~0.37 */
	c: number;
	/** Hue, 0 .. 360 degrees */
	h: number;
}

// `Math.cbrt` is ES2015; use a target-agnostic cube root that also handles
// negative inputs.
function cbrt(x: number): number {
	return x < 0 ? -Math.pow(-x, 1 / 3) : Math.pow(x, 1 / 3);
}

// sRGB gamma (companding) transfer functions, operating on 0..1 channels.
function toLinear(c: number): number {
	return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function toGamma(c: number): number {
	return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

// Linear sRGB (each channel 0..1) -> OKLab.
function linearToOklab(r: number, g: number, b: number): [number, number, number] {
	const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
	const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
	const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

	const l_ = cbrt(l);
	const m_ = cbrt(m);
	const s_ = cbrt(s);

	return [
		0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
		1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
		0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_
	];
}

// OKLab -> linear sRGB (each channel 0..1, may fall outside the gamut).
function oklabToLinear(L: number, A: number, B: number): [number, number, number] {
	const l_ = L + 0.3963377774 * A + 0.2158037573 * B;
	const m_ = L - 0.1055613458 * A - 0.0638541728 * B;
	const s_ = L - 0.0894841775 * A - 1.2914855480 * B;

	const l = l_ * l_ * l_;
	const m = m_ * m_ * m_;
	const s = s_ * s_ * s_;

	return [
		4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
		-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
		-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
	];
}

function lchToLinear(l: number, c: number, h: number): [number, number, number] {
	const hr = h * Math.PI / 180;
	return oklabToLinear(l, c * Math.cos(hr), c * Math.sin(hr));
}

function inGamut(lin: [number, number, number]): boolean {
	const eps = 0.0001;
	for (let i = 0; i < 3; i++) {
		if (lin[i] < -eps || lin[i] > 1 + eps) {
			return false;
		}
	}
	return true;
}

function clamp01(x: number): number {
	return x < 0 ? 0 : (x > 1 ? 1 : x);
}

/**
 * Converts a [[Color]] to its OKLCH components.
 *
 * @param   color  Source color
 * @return         `{ l, c, h }`
 */
export function colorToOKLCH(color: Color): IOKLCH {
	const r = toLinear(color.r / 255);
	const g = toLinear(color.g / 255);
	const b = toLinear(color.b / 255);

	const [L, A, B] = linearToOklab(r, g, b);
	const c = Math.sqrt(A * A + B * B);
	let h = Math.atan2(B, A) * 180 / Math.PI;
	if (h < 0) {
		h += 360;
	}
	return { l: L, c: c, h: h };
}

/**
 * Converts OKLCH components to a [[Color]].
 *
 * By default, colors that fall outside the sRGB gamut are brought back in by
 * reducing chroma while holding lightness and hue constant (a binary search),
 * which preserves the intended color far better than a naive per-channel clip.
 *
 * @param   l      Lightness, 0 .. 1
 * @param   c      Chroma, 0 .. ~0.37
 * @param   h      Hue, 0 .. 360 degrees
 * @param   clamp  Reduce chroma to fit sRGB (default `true`)
 * @return         Color
 */
export function oklchToColor(l: number, c: number, h: number, clamp: boolean = true): Color {
	let lin = lchToLinear(l, c, h);

	if (clamp && !inGamut(lin)) {
		let lo = 0;
		let hi = c;
		for (let i = 0; i < 18; i++) {
			const mid = (lo + hi) / 2;
			if (inGamut(lchToLinear(l, mid, h))) {
				lo = mid;
			}
			else {
				hi = mid;
			}
		}
		lin = lchToLinear(l, lo, h);
	}

	return Color.fromRGB(
		Math.round(clamp01(toGamma(clamp01(lin[0]))) * 255),
		Math.round(clamp01(toGamma(clamp01(lin[1]))) * 255),
		Math.round(clamp01(toGamma(clamp01(lin[2]))) * 255)
	);
}

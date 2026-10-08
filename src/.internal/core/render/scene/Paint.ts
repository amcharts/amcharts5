/** @ignore *//** */

import type { IGradient, IPattern, IGraphics } from "../backend/Renderer";


/**
 * @ignore
 */
export interface IColorStop {
	offset: number;
	color: string;
}

/**
 * Coordinates are in the user space of the shape it fills.
 *
 * @ignore
 */
export class LinearGradientDef implements IGradient {
	public readonly type = "linear";
	public stops: Array<IColorStop> = [];

	constructor(public x1: number, public y1: number, public x2: number, public y2: number) { }

	public addColorStop(offset: number, color: string): void {
		this.stops.push({ offset, color });
	}
}

/**
 * Coordinates are in the user space of the shape it fills.
 *
 * @ignore
 */
export class RadialGradientDef implements IGradient {
	public readonly type = "radial";
	public stops: Array<IColorStop> = [];

	constructor(public x1: number, public y1: number, public radius1: number, public x2: number, public y2: number, public radius2: number) { }

	public addColorStop(offset: number, color: string): void {
		this.stops.push({ offset, color });
	}
}

/**
 * A tile drawn from graphics: `background` first, then `graphics`.
 *
 * @ignore
 */
export class PatternDef implements IPattern {
	public readonly type = "pattern";

	constructor(public graphics: IGraphics, public background: IGraphics, public repetition: string, public width: number, public height: number) { }
}

/**
 * A tile that is already a bitmap.
 *
 * @ignore
 */
export class RasterPatternDef implements IPattern {
	public readonly type = "raster";

	constructor(public source: HTMLCanvasElement, public repetition: string) { }
}

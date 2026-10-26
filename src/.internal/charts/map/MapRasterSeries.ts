import type { GeoProjection } from "d3-geo";
import type { IGraphics } from "../../core/render/backend/Renderer";
import type { IDisposer } from "../../core/util/Disposer";
import type { ISharedGL } from "../../core/render/webgl/WebGL";

import { MapSeries, IMapSeriesSettings, IMapSeriesDataItem, IMapSeriesPrivate, IMapSeriesEvents } from "./MapSeries";
import { ISunSettings, SunClock } from "./MapSun";
import { Graphics } from "../../core/render/Graphics";
import { geoRotation } from "d3-geo";
import { getGeoRectangle } from "./MapUtils";
import { CanvasRenderer } from "../../core/render/backend/CanvasRenderer";
import { sharedGL, makeProgram, retainGL, releaseGL } from "../../core/render/webgl/WebGL";

export interface IMapRasterSeriesDataItem extends IMapSeriesDataItem {
}

export interface IMapRasterSeriesSettings extends IMapSeriesSettings, ISunSettings {

	/**
	 * URL of an image of the whole world in equirectangular projection
	 * ("plate carrée"): longitude -180 to 180 from left to right, latitude 90
	 * to -90 from top to bottom. Satellite imagery such as NASA's Blue Marble
	 * comes in this form.
	 *
	 * The geodata package has day and night images of the Earth ready for
	 * this, e.g. `geodata/images/earthDay2048.jpg` (credit: NASA Earth
	 * Observatory). See `images/README.md` in the geodata package.
	 */
	src?: string;

	/**
	 * URL of an image of the world at night, in the same form as `src`. With
	 * `sunPosition` set, the series shows `src` where the sun is up and this
	 * image where it is down, blended across twilight.
	 *
	 * The geodata package has one: `geodata/images/earthNight2048.jpg`.
	 */
	nightSrc?: string;

	/**
	 * The images' `crossOrigin` setting. A cross-origin image can only be
	 * reprojected if its server allows it (CORS).
	 *
	 * @default "anonymous"
	 */
	cors?: string | null;
}

export interface IMapRasterSeriesPrivate extends IMapSeriesPrivate {
}

export interface IMapRasterSeriesEvents extends IMapSeriesEvents {

	/**
	 * The images finished loading: `src`, and `nightSrc` if set.
	 */
	loaded: {};

	/**
	 * An image failed to load, or can't be read, such as a cross-origin image
	 * without CORS headers.
	 */
	loaderror: {};
}

// Raw projections with an inverse below: their projected point for raw (x, y) is translate + scale * (x, -y)
const ORTHOGRAPHIC = 0;
const EQUIRECTANGULAR = 1;
const MERCATOR = 2;
const EQUAL_EARTH = 3;
const NATURAL_EARTH = 4;

const HALF_PI = Math.PI / 2;
const INV_PI = 1 / Math.PI;
const INV_TWO_PI = 1 / (2 * Math.PI);
const RADIANS = Math.PI / 180;
const DEGREES = 180 / Math.PI;

// A sharp redraw follows the last draft after this long (ms)
const MOVING = 250;

interface IRasterLevel {
	width: number;
	height: number;
	pixels: Uint32Array;
}

/**
 * One image: the element, its texture on the shared WebGL context, and the
 * pixel levels the CPU path samples.
 */
interface IRasterImage {
	image?: HTMLImageElement;
	ready: boolean;
	levels: Array<IRasterLevel | undefined>;
	texture?: { generation: number, texture: WebGLTexture };
}

/**
 * Unit vector for a point in raw projected coordinates, or `undefined` off
 * the projection.
 */
function rawToVector(kind: number, x: number, y: number): [number, number, number] | undefined {
	if (kind === ORTHOGRAPHIC) {
		const r2 = x * x + y * y;
		return r2 > 1 ? undefined : [Math.sqrt(1 - r2), x, y];
	}
	const row = rawRow(kind, y);
	if (!row) {
		return;
	}
	const phi = row[0];
	const lambda = x * row[1];
	if (Math.abs(lambda) > Math.PI) {
		return;
	}
	return [Math.cos(phi) * Math.cos(lambda), Math.cos(phi) * Math.sin(lambda), Math.sin(phi)];
}

// Equal Earth polynomial
const A1 = 1.340264;
const A2 = -0.081106;
const A3 = 0.000893;
const A4 = 0.003796;
const M = Math.sqrt(3) / 2;

// Raw y of the top edge
const EQUAL_EARTH_TOP = 1.3173627591574133;
const NATURAL_EARTH_TOP = 1.4223905067305962;

/**
 * For a projection whose parallels are straight lines: the latitude of the
 * row at raw `y`, and how much longitude a unit of raw x covers there.
 * `undefined` off the map.
 */
function rawRow(kind: number, y: number): [number, number] | undefined {
	if (kind === EQUAL_EARTH) {
		if (y > EQUAL_EARTH_TOP || y < -EQUAL_EARTH_TOP) {
			return;
		}
		let l = y;
		for (let i = 0; i < 12; i++) {
			const l2 = l * l;
			const l6 = l2 * l2 * l2;
			const delta = (l * (A1 + A2 * l2 + l6 * (A3 + A4 * l2)) - y) / (A1 + 3 * A2 * l2 + l6 * (7 * A3 + 9 * A4 * l2));
			l -= delta;
			if (Math.abs(delta) < 1e-9) {
				break;
			}
		}
		const sin = Math.max(-1, Math.min(1, Math.sin(l) / M));
		const l2 = l * l;
		const l6 = l2 * l2 * l2;
		return [Math.asin(sin), M * (A1 + 3 * A2 * l2 + l6 * (7 * A3 + 9 * A4 * l2)) / Math.cos(l)];
	}
	if (kind === NATURAL_EARTH) {
		if (y > NATURAL_EARTH_TOP || y < -NATURAL_EARTH_TOP) {
			return;
		}
		let phi = y;
		for (let i = 0; i < 25; i++) {
			const p2 = phi * phi;
			const p4 = p2 * p2;
			const delta = (phi * (1.007226 + p2 * (0.015085 + p4 * (-0.044475 + 0.028874 * p2 - 0.005916 * p4))) - y) / (1.007226 + p2 * (0.045255 + p4 * (-0.311325 + 0.259866 * p2 - 0.065076 * p4)));
			phi -= delta;
			if (Math.abs(delta) < 1e-9) {
				break;
			}
		}
		phi = Math.max(-HALF_PI, Math.min(HALF_PI, phi));
		const p2 = phi * phi;
		return [phi, 1 / (0.8707 + p2 * (-0.131979 + p2 * (-0.013791 + p2 * p2 * p2 * (0.003971 - 0.001529 * p2))))];
	}
	const phi = kind === MERCATOR ? 2 * Math.atan(Math.exp(y)) - HALF_PI : y;
	return phi > HALF_PI || phi < -HALF_PI ? undefined : [phi, 1];
}

// The texel at (u, v), both 0-1 with u wrapping round the world
function sampleNearest(level: IRasterLevel, u: number, v: number): number {
	const width = level.width;
	const height = level.height;
	let x = (u * width) | 0;
	if (x >= width) {
		x -= width;
	}
	let y = (v * height) | 0;
	if (y >= height) {
		y = height - 1;
	}
	return level.pixels[y * width + x];
}

// The four texels around (u, v) blended: for a magnified image
function sampleBilinear(level: IRasterLevel, u: number, v: number): number {
	const width = level.width;
	const height = level.height;
	const src = level.pixels;
	const fx = u * width - .5;
	const fy = v * height - .5;
	let x0 = Math.floor(fx);
	let y0 = Math.floor(fy);
	const ax = fx - x0;
	const ay = fy - y0;
	let x1 = x0 + 1;
	let y1 = y0 + 1;
	if (x0 < 0) {
		x0 += width;
	}
	if (x1 >= width) {
		x1 -= width;
	}
	if (y0 < 0) {
		y0 = 0;
	}
	if (y1 >= height) {
		y1 = height - 1;
	}
	const a = src[y0 * width + x0];
	const b = src[y0 * width + x1];
	const c = src[y1 * width + x0];
	const d = src[y1 * width + x1];
	const wa = (1 - ax) * (1 - ay);
	const wb = ax * (1 - ay);
	const wc = (1 - ax) * ay;
	const wd = ax * ay;
	let pixel = 0;
	for (let shift = 0; shift < 32; shift += 8) {
		const channel = ((a >>> shift) & 255) * wa + ((b >>> shift) & 255) * wb + ((c >>> shift) & 255) * wc + ((d >>> shift) & 255) * wd;
		pixel |= ((channel + .5) | 0) << shift;
	}
	return pixel;
}

// `a` towards `b` by `t`, channel by channel
function mixPixels(a: number, b: number, t: number): number {
	let pixel = 0;
	for (let shift = 0; shift < 32; shift += 8) {
		const from = (a >>> shift) & 255;
		const channel = from + (((b >>> shift) & 255) - from) * t;
		pixel |= ((channel + .5) | 0) << shift;
	}
	return pixel;
}

// 0 below `edge0`, 1 above `edge1`, smooth between: as GLSL's smoothstep
function smoothstep(edge0: number, edge1: number, x: number): number {
	let t = (x - edge0) / (edge1 - edge0);
	t = t < 0 ? 0 : t > 1 ? 1 : t;
	return t * t * (3 - 2 * t);
}

function toVector(lambda: number, phi: number): [number, number, number] {
	const c = Math.cos(phi * RADIANS);
	return [c * Math.cos(lambda * RADIANS), c * Math.sin(lambda * RADIANS), Math.sin(phi * RADIANS)];
}

/**
 * Takes a vector from the projection's rotated frame back to geographic
 * coordinates: columns are the rotated frame's axes, column-major.
 */
function inverseRotation(projection: GeoProjection): Array<number> {
	const rotate = projection.rotate ? geoRotation(projection.rotate()) : undefined;
	const matrix: Array<number> = [];
	for (const axis of [[0, 0], [90, 0], [0, 90]]) {
		const point = rotate ? rotate.invert(<[number, number]>axis) : axis;
		matrix.push(...toVector(point[0], point[1]));
	}
	return matrix;
}

/**
 * Which raw inverse reproduces the projection, if any: a few raw points go
 * through it and back through the projection itself.
 */
function detectKind(projection: GeoProjection, matrix: Array<number>): number | undefined {
	const scale = projection.scale();
	const translate = projection.translate();
	for (const kind of [ORTHOGRAPHIC, EQUIRECTANGULAR, MERCATOR, EQUAL_EARTH, NATURAL_EARTH]) {
		let matches = true;
		for (const [x, y] of [[0.1, 0.2], [-0.3, 0.1], [0.25, -0.35]]) {
			const v = rawToVector(kind, x, y)!;
			const gx = matrix[0] * v[0] + matrix[3] * v[1] + matrix[6] * v[2];
			const gy = matrix[1] * v[0] + matrix[4] * v[1] + matrix[7] * v[2];
			const gz = matrix[2] * v[0] + matrix[5] * v[1] + matrix[8] * v[2];
			const point = projection([Math.atan2(gy, gx) * DEGREES, Math.asin(Math.max(-1, Math.min(1, gz))) * DEGREES]);
			if (!point || Math.abs(point[0] - (translate[0] + scale * x)) > 0.01 || Math.abs(point[1] - (translate[1] - scale * y)) > 0.01) {
				matches = false;
				break;
			}
		}
		if (matches) {
			return kind;
		}
	}
}

// One triangle that covers the viewport
const VERTEX = `#version 300 es
void main() {
	vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
	gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

// Per screen pixel: the raw inverse, the rotation back to geographic, and the image at that longitude/latitude
const FRAGMENT = `#version 300 es
precision highp float;
uniform sampler2D u_image;
uniform sampler2D u_night;
uniform float u_height;
uniform float u_resolution;
uniform vec2 u_translate;
uniform float u_scale;
uniform mat3 u_rotation;
uniform int u_kind;
uniform int u_dayNight;
uniform vec3 u_sun;
uniform float u_twilight;
out vec4 color;

const float PI = 3.141592653589793;
const float EQUAL_EARTH_TOP = ${EQUAL_EARTH_TOP};
const float NATURAL_EARTH_TOP = ${NATURAL_EARTH_TOP};

// Equal Earth: the latitude of the row at raw y, and the longitude a unit of raw x covers there
vec2 equalEarthRow(float y) {
	const float A1 = 1.340264, A2 = -0.081106, A3 = 0.000893, A4 = 0.003796, M = 0.8660254037844386;
	float l = y;
	for (int i = 0; i < 8; i++) {
		float l2 = l * l;
		float l6 = l2 * l2 * l2;
		l -= (l * (A1 + A2 * l2 + l6 * (A3 + A4 * l2)) - y) / (A1 + 3.0 * A2 * l2 + l6 * (7.0 * A3 + 9.0 * A4 * l2));
	}
	float l2 = l * l;
	float l6 = l2 * l2 * l2;
	return vec2(asin(clamp(sin(l) / M, -1.0, 1.0)), M * (A1 + 3.0 * A2 * l2 + l6 * (7.0 * A3 + 9.0 * A4 * l2)) / cos(l));
}

// Natural Earth, likewise
vec2 naturalEarthRow(float y) {
	float phi = y;
	for (int i = 0; i < 12; i++) {
		float p2 = phi * phi;
		float p4 = p2 * p2;
		phi -= (phi * (1.007226 + p2 * (0.015085 + p4 * (-0.044475 + 0.028874 * p2 - 0.005916 * p4))) - y) / (1.007226 + p2 * (0.045255 + p4 * (-0.311325 + 0.259866 * p2 - 0.065076 * p4)));
	}
	float p2 = phi * phi;
	return vec2(phi, 1.0 / (0.8707 + p2 * (-0.131979 + p2 * (-0.013791 + p2 * p2 * p2 * (0.003971 - 0.001529 * p2)))));
}

void main() {
	vec2 css = vec2(gl_FragCoord.x, u_height - gl_FragCoord.y) / u_resolution;
	vec2 p = vec2(css.x - u_translate.x, u_translate.y - css.y) / u_scale;
	vec3 v;
	float alpha;
	if (u_kind == 0) {
		float r = length(p);
		float edge = 0.5 / (u_scale * u_resolution);
		alpha = clamp((1.0 + edge - r) / (2.0 * edge), 0.0, 1.0);
		v = vec3(sqrt(max(0.0, 1.0 - r * r)), p.x, p.y);
	}
	else if (u_kind >= 3) {
		// Rows off the map are clamped onto it, so the iteration stays finite
		float limit = u_kind == 3 ? EQUAL_EARTH_TOP : NATURAL_EARTH_TOP;
		float y = clamp(p.y, -limit, limit);
		vec2 row = u_kind == 3 ? equalEarthRow(y) : naturalEarthRow(y);
		float phi = clamp(row.x, -PI / 2.0, PI / 2.0);
		float lambda = p.x * row.y;
		// The curved sides are anti-aliased half a pixel either side
		float edge = max(fwidth(lambda), 1e-6);
		alpha = abs(p.y) <= limit ? clamp((PI - abs(lambda)) / edge + 0.5, 0.0, 1.0) : 0.0;
		lambda = clamp(lambda, -PI, PI);
		v = vec3(cos(phi) * cos(lambda), cos(phi) * sin(lambda), sin(phi));
	}
	else {
		float phi = u_kind == 2 ? 2.0 * atan(exp(p.y)) - PI / 2.0 : p.y;
		alpha = abs(p.x) <= PI && abs(phi) <= PI / 2.0 ? 1.0 : 0.0;
		v = vec3(cos(phi) * cos(p.x), cos(phi) * sin(p.x), sin(phi));
	}
	v = u_rotation * v;
	vec2 uv = vec2(atan(v.y, v.x) / (2.0 * PI) + 0.5, 0.5 - asin(clamp(v.z, -1.0, 1.0)) / PI);

	// Gradients without the jump where longitude wraps round
	vec2 wrapped = vec2(fract(uv.x + 0.5), uv.y);
	vec2 dx = dFdx(uv);
	vec2 dy = dFdy(uv);
	vec2 dxWrapped = dFdx(wrapped);
	vec2 dyWrapped = dFdy(wrapped);
	if (abs(dxWrapped.x) + abs(dyWrapped.x) < abs(dx.x) + abs(dy.x)) {
		dx = dxWrapped;
		dy = dyWrapped;
	}
	vec4 day = textureGrad(u_image, uv, dx, dy);

	// The sine of the sun's height there: day above the twilight band, night below
	if (u_dayNight == 1) {
		float t = smoothstep(-u_twilight, u_twilight, dot(normalize(v), u_sun));
		day = mix(textureGrad(u_night, uv, dx, dy), day, t);
	}
	color = day * alpha;
}`;

/**
 * @ignore
 */
export interface IRasterProgram {
	generation: number;
	program: WebGLProgram;
	vertexArray: WebGLVertexArrayObject;
	uniforms: { [name: string]: WebGLUniformLocation | null };
}

let rasterProgram: IRasterProgram | undefined;
let failedGeneration = -1;

// The program for the shared context, made again after the context is restored; a failed one is retried then too
function getProgram(shared: ISharedGL): IRasterProgram | undefined {
	if (!rasterProgram || rasterProgram.generation !== shared.generation) {
		rasterProgram = undefined;
		if (failedGeneration === shared.generation) {
			return;
		}
		const gl = shared.gl;
		const program = makeProgram(gl, VERTEX, FRAGMENT);
		const vertexArray = gl.createVertexArray();
		if (program && vertexArray) {
			const uniforms: { [name: string]: WebGLUniformLocation | null } = {};
			for (const name of ["image", "night", "height", "resolution", "translate", "scale", "rotation", "kind", "dayNight", "sun", "twilight"]) {
				uniforms[name] = gl.getUniformLocation(program, "u_" + name);
			}
			rasterProgram = { generation: shared.generation, program, vertexArray, uniforms };
		}
		else {
			failedGeneration = shared.generation;
		}
	}
	return rasterProgram;
}

/**
 * A [[MapChart]] series that shows an image of the whole world, such as a
 * satellite photo, reprojected to the chart's projection.
 *
 * The image must be in equirectangular projection. It is redrawn as the map
 * moves: on the GPU (WebGL2) for orthographic, equirectangular, Mercator,
 * Equal Earth and Natural Earth projections, on the CPU otherwise.
 *
 * The projection needs `invert`. The blend `animateProjection()` runs through
 * has none, so the image is not drawn while that animation plays.
 *
 * With `nightSrc` and `sunPosition`, it shows day and night: one image where
 * the sun is up, the other where it is down.
 *
 * The series counts as the whole world in the map's bounds. On a regional
 * map, set `affectsBounds: false` to keep the map fitted to the region.
 *
 * @see {@link https://docs.amcharts.com/v5/charts/map-chart/map-raster-series/} for more information
 * @since 5.21.0
 * @important
 */
export class MapRasterSeries extends MapSeries {

	public static className: string = "MapRasterSeries";
	public static classNames: Array<string> = MapSeries.classNames.concat([MapRasterSeries.className]);

	declare public _settings: IMapRasterSeriesSettings;
	declare public _privateSettings: IMapRasterSeriesPrivate;
	declare public _dataItemSettings: IMapRasterSeriesDataItem;
	declare public _events: IMapRasterSeriesEvents;

	// An image, not data: autoAppear need not wait
	protected _autoAppearReady(): boolean {
		return true;
	}

	protected _raster!: Graphics;

	/**
	 * @ignore
	 */
	public _day: IRasterImage = { ready: false, levels: [] };

	/**
	 * @ignore
	 */
	public _night: IRasterImage = { ready: false, levels: [] };

	protected _canvas?: HTMLCanvasElement;
	protected _context?: CanvasRenderingContext2D;
	protected _output?: ImageData;
	protected _world?: GeoJSON.MultiPolygon;
	protected _settle?: IDisposer;
	protected _sharp = false;
	protected _sunClock: SunClock = new SunClock(this);
	// Skipped a draw while hidden
	protected _stale = false;

	/**
	 * `false` reprojects on the CPU even where WebGL2 is available.
	 *
	 * @ignore
	 */
	public _webgl = true;

	protected _afterNew() {
		super._afterNew();
		retainGL();
		this._raster = this.children.push(Graphics.new(this._root, {
			isMeasured: false,
			draw: (display) => this._drawRaster(display),
		})._markC("isMeasured", "draw"));
	}

	public _prepareChildren() {
		super._prepareChildren();

		// The image covers the world, so a chart with nothing else still fits it
		if (!this._world && this.chart) {
			this._world = getGeoRectangle(90, 180, -90, -180);
			this._addGeometry(this._world, this);
		}

		// Shown again after the map moved under it
		if (this._stale && (this.isDirty("visible") || this.isPrivateDirty("visible"))) {
			this._raster.markDirtyKey("draw");
		}

		if (this.isDirty("src") || this.isDirty("cors")) {
			this._load(this._day, this.get("src"));
		}

		if (this.isDirty("nightSrc") || this.isDirty("cors")) {
			this._load(this._night, this.get("nightSrc"));
		}

		if (this.isDirty("sunDate")) {
			this._sunClock.update();
		}

		if (this.isDirty("sunPosition") || this.isDirty("twilight")) {
			this._raster.markDirtyKey("draw");
		}
	}

	/**
	 * @ignore
	 */
	public markDirtyProjection() {
		this._raster.markDirtyKey("draw");
	}

	protected _load(raster: IRasterImage, src: string | undefined) {
		const previous = raster.image;
		raster.image = undefined;
		if (previous) {
			previous.src = "";
		}
		raster.ready = false;
		raster.levels = [];
		this._deleteTexture(raster);
		this._raster.markDirtyKey("draw");

		if (src) {
			const image = new Image();
			image.crossOrigin = this.get("cors", "anonymous");
			image.src = src;
			raster.image = image;
			const events = this.events;
			image.decode().then(() => {
				if (raster.image !== image || this.isDisposed()) {
					return;
				}
				if (!this._upload(raster) && !this._level(raster, 0)) {
					throw new Error("MapRasterSeries: the image can not be read; a cross-origin image needs CORS headers");
				}
				raster.ready = true;
				this._raster.markDirtyKey("draw");
				if (this._loaded() && events.isEnabled("loaded")) {
					events.dispatch("loaded", { type: "loaded", target: this });
				}
			}).catch((error: any) => {
				// A load that a newer image or dispose replaced reports nothing
				if (raster.image !== image) {
					return;
				}
				raster.image = undefined;
				if (error && error.message) {
					console.warn(error.message);
				}
				if (!events.isDisposed() && events.isEnabled("loaderror")) {
					events.dispatch("loaderror", { type: "loaderror", target: this });
				}
			});
		}
	}

	// Every image asked for is in
	protected _loaded(): boolean {
		return this._day.ready && (!this.get("nightSrc") || this._night.ready);
	}

	// The night image, when day and night are both asked for and it is in
	protected _nightImage(): IRasterImage | undefined {
		return this.get("sunPosition") && this.get("nightSrc") && this._night.ready ? this._night : undefined;
	}

	/**
	 * Puts an image into a texture of the shared WebGL context, scaled down
	 * if it is larger than the GPU allows. `false` without WebGL2 or for an
	 * image that can not be read.
	 */
	protected _upload(raster: IRasterImage): boolean {
		const shared = this._webgl ? sharedGL() : undefined;
		const image = raster.image;
		if (!shared || !image) {
			return false;
		}
		const gl = shared.gl;
		const max = gl.getParameter(gl.MAX_TEXTURE_SIZE);
		let source: HTMLImageElement | HTMLCanvasElement = image;
		if (image.naturalWidth > max || image.naturalHeight > max) {
			const ratio = Math.min(max / image.naturalWidth, max / image.naturalHeight);
			const canvas = document.createElement("canvas");
			canvas.width = Math.floor(image.naturalWidth * ratio);
			canvas.height = Math.floor(image.naturalHeight * ratio);
			const context = canvas.getContext("2d")!;
			context.imageSmoothingQuality = "high";
			context.drawImage(image, 0, 0, canvas.width, canvas.height);
			source = canvas;
		}

		const texture = gl.createTexture();
		if (!texture) {
			return false;
		}
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
		try {
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
		} catch (e) {
			gl.deleteTexture(texture);
			return false;
		}
		gl.generateMipmap(gl.TEXTURE_2D);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		const anisotropic = gl.getExtension("EXT_texture_filter_anisotropic");
		if (anisotropic) {
			gl.texParameterf(gl.TEXTURE_2D, anisotropic.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, gl.getParameter(anisotropic.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
		}
		raster.texture = { generation: shared.generation, texture };
		return true;
	}

	// The image's texture on the shared context as it is now, made again after a restore
	protected _textureOf(raster: IRasterImage, shared: ISharedGL): boolean {
		return raster.texture && raster.texture.generation === shared.generation || this._upload(raster);
	}

	protected _deleteTexture(raster: IRasterImage) {
		if (raster.texture) {
			const shared = sharedGL();
			if (shared && shared.generation === raster.texture.generation) {
				shared.gl.deleteTexture(raster.texture.texture);
			}
			raster.texture = undefined;
		}
	}

	/**
	 * An image's pixels, halved `index` times so that sampling one pixel per
	 * screen pixel does not alias. Only the CPU path reads them.
	 */
	protected _level(raster: IRasterImage, index: number): IRasterLevel | undefined {
		let level = raster.levels[index];
		const image = raster.image;
		if (!level && image && image.naturalWidth) {
			const width = Math.max(1, Math.round(image.naturalWidth / Math.pow(2, index)));
			const height = Math.max(1, Math.round(image.naturalHeight / Math.pow(2, index)));
			const canvas = document.createElement("canvas");
			canvas.width = width;
			canvas.height = height;
			const context = canvas.getContext("2d")!;
			context.imageSmoothingQuality = "high";
			context.drawImage(image, 0, 0, width, height);
			try {
				level = { width, height, pixels: new Uint32Array(context.getImageData(0, 0, width, height).data.buffer) };
			} catch (e) {
				return;
			}
			raster.levels[index] = level;
		}
		return level;
	}

	protected _drawRaster(display: IGraphics) {
		const chart = this.chart;
		const projection = this.projection();
		if (!chart || !projection || !this._day.ready) {
			return;
		}
		const width = chart.seriesContainer.width();
		const height = chart.seriesContainer.height();
		if (!(width > 0 && height > 0)) {
			return;
		}
		// Not worked out while hidden: drawn when shown again
		if (this.get("visible") === false || this.getPrivate("visible") === false) {
			this._stale = true;
			return;
		}
		this._stale = false;
		const canvas = this._render(projection, width, height);
		if (canvas) {
			display.image(canvas, width, height, 0, 0);
		}
	}

	// The 2D canvas the chart draws, at the given size
	protected _target(pixelWidth: number, pixelHeight: number): HTMLCanvasElement {
		let canvas = this._canvas;
		if (!canvas) {
			canvas = document.createElement("canvas");
			this._canvas = canvas;
			this._context = canvas.getContext("2d")!;
		}
		if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
			canvas.width = pixelWidth;
			canvas.height = pixelHeight;
		}
		return canvas;
	}

	/**
	 * Reprojects the image into a canvas of the chart's size in device pixels:
	 * with WebGL2 where it can, on the CPU otherwise.
	 */
	protected _render(projection: GeoProjection, width: number, height: number): HTMLCanvasElement | undefined {
		const scale = projection.scale();
		const translate = projection.translate();
		const matrix = inverseRotation(projection);
		const kind = detectKind(projection, matrix);
		const night = this._nightImage();
		const sunPosition = this.get("sunPosition");
		const sun = night && sunPosition ? toVector(sunPosition.longitude, sunPosition.latitude) : undefined;
		const twilight = Math.sin(Math.max(this.get("twilight", 12), 0.01) / 2 * RADIANS);

		let shared: ISharedGL | undefined;
		let program: IRasterProgram | undefined;
		if (kind !== undefined && this._webgl) {
			shared = sharedGL();
			program = shared && getProgram(shared);
			if (!shared || !program || !this._textureOf(this._day, shared) || (night && !this._textureOf(night, shared))) {
				shared = undefined;
			}
		}

		// Drafts are for slow redraws: the CPU path, and under SVG every frame's image is encoded
		let resolution = this._root._renderer.resolution;
		if (!shared || !(this._root._renderer instanceof CanvasRenderer)) {
			resolution = this._draftResolution(resolution);
		}
		const pixelWidth = Math.max(1, Math.round(width * resolution));
		const pixelHeight = Math.max(1, Math.round(height * resolution));

		if (shared && program) {
			const canvas = this._renderGL(shared, program, kind!, matrix, scale, translate[0], translate[1], pixelWidth, pixelHeight, resolution, night, sun, twilight);
			if (canvas) {
				return canvas;
			}
		}

		if (!this._level(this._day, 0) || (night && !this._level(night, 0))) {
			return;
		}

		const canvas = this._target(pixelWidth, pixelHeight);
		let output = this._output;
		if (!output || output.width !== pixelWidth || output.height !== pixelHeight) {
			output = this._context!.createImageData(pixelWidth, pixelHeight);
			this._output = output;
		}
		const out = new Uint32Array(output.data.buffer);
		out.fill(0);

		if (kind === undefined) {
			this._renderInverse(projection, out, pixelWidth, pixelHeight, resolution, night, sun, twilight);
		}
		else {
			this._renderRaw(kind, matrix, scale, translate[0], translate[1], out, pixelWidth, pixelHeight, resolution, night, sun, twilight);
		}

		this._context!.putImageData(output, 0, 0);
		return canvas;
	}

	/**
	 * One pixel per CSS pixel now, and a sharp redraw once the map has not
	 * moved for a moment.
	 */
	protected _draftResolution(resolution: number): number {
		if (resolution <= 1) {
			return resolution;
		}
		if (this._settle) {
			this.removeDispose(this._settle);
			this._settle = undefined;
		}
		if (this._sharp) {
			this._sharp = false;
			return resolution;
		}
		this._settle = this.setTimeout(() => {
			this._settle = undefined;
			this._sharp = true;
			this._raster.markDirtyKey("draw");
		}, MOVING);
		return 1;
	}

	protected _renderGL(shared: ISharedGL, program: IRasterProgram, kind: number, matrix: Array<number>, scale: number, tx: number, ty: number, pixelWidth: number, pixelHeight: number, resolution: number, night: IRasterImage | undefined, sun: Array<number> | undefined, twilight: number): HTMLCanvasElement | undefined {
		const gl = shared.gl;
		const glCanvas = shared.canvas;

		const maxViewport = gl.getParameter(gl.MAX_VIEWPORT_DIMS);
		if (pixelWidth > maxViewport[0] || pixelHeight > maxViewport[1]) {
			return;
		}

		// The shared canvas only grows; this chart draws into its bottom-left corner
		if (glCanvas.width < pixelWidth || glCanvas.height < pixelHeight) {
			glCanvas.width = Math.max(glCanvas.width, pixelWidth);
			glCanvas.height = Math.max(glCanvas.height, pixelHeight);
		}

		// A browser can give a smaller drawing buffer than asked, without an error
		if (gl.drawingBufferWidth < glCanvas.width || gl.drawingBufferHeight < glCanvas.height) {
			glCanvas.width = pixelWidth;
			glCanvas.height = pixelHeight;
			if (gl.drawingBufferWidth < pixelWidth || gl.drawingBufferHeight < pixelHeight) {
				return;
			}
		}

		gl.viewport(0, 0, pixelWidth, pixelHeight);
		gl.clearColor(0, 0, 0, 0);
		gl.clear(gl.COLOR_BUFFER_BIT);

		gl.useProgram(program.program);
		gl.bindVertexArray(program.vertexArray);
		const day = this._day.texture!.texture;
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, day);
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, night ? night.texture!.texture : day);
		const uniforms = program.uniforms;
		gl.uniform1i(uniforms.image, 0);
		gl.uniform1i(uniforms.night, 1);
		gl.uniform1f(uniforms.height, pixelHeight);
		gl.uniform1f(uniforms.resolution, resolution);
		gl.uniform2f(uniforms.translate, tx, ty);
		gl.uniform1f(uniforms.scale, scale);
		gl.uniformMatrix3fv(uniforms.rotation, false, matrix);
		gl.uniform1i(uniforms.kind, kind);
		gl.uniform1i(uniforms.dayNight, night && sun ? 1 : 0);
		gl.uniform3f(uniforms.sun, sun ? sun[0] : 0, sun ? sun[1] : 0, sun ? sun[2] : 1);
		gl.uniform1f(uniforms.twilight, twilight);
		gl.drawArrays(gl.TRIANGLES, 0, 3);

		// Copied out before another chart draws into the shared canvas
		const canvas = this._target(pixelWidth, pixelHeight);
		const context = this._context!;
		context.clearRect(0, 0, pixelWidth, pixelHeight);
		context.drawImage(glCanvas, 0, glCanvas.height - pixelHeight, pixelWidth, pixelHeight, 0, 0, pixelWidth, pixelHeight);

		// Lost during this frame: the copy is empty, so draw again (on the CPU until it is restored)
		if (gl.isContextLost()) {
			this.setTimeout(() => this._raster.markDirtyKey("draw"), 0);
		}
		return canvas;
	}

	/**
	 * The level to sample for a given number of texels of the full image per
	 * screen pixel, about one texel per pixel. Below one the full image is
	 * magnified, and blended (`true`).
	 */
	protected _pick(raster: IRasterImage, texelsPerPixel: number): [IRasterLevel, boolean] {
		if (texelsPerPixel < 1) {
			return [raster.levels[0]!, true];
		}
		return [this._level(raster, Math.floor(Math.log2(texelsPerPixel))) || raster.levels[0]!, false];
	}

	protected _renderRaw(kind: number, m: Array<number>, scale: number, tx: number, ty: number, out: Uint32Array, pixelWidth: number, pixelHeight: number, resolution: number, night: IRasterImage | undefined, sun: Array<number> | undefined, twilight: number) {
		const m0 = m[0], m1 = m[1], m2 = m[2], m3 = m[3], m4 = m[4], m5 = m[5], m6 = m[6], m7 = m[7], m8 = m[8];
		const pixelsPerUnit = scale * resolution;
		const dx = 1 / pixelsPerUnit;
		const orthographic = kind === ORTHOGRAPHIC;
		const base = this._day.levels[0]!;
		const dayNight = night && sun ? true : false;
		const sx = sun ? sun[0] : 0, sy = sun ? sun[1] : 0, sz = sun ? sun[2] : 0;

		// Full-image texels per screen pixel along a parallel at the equator, and along a meridian
		const across = base.width * INV_TWO_PI / pixelsPerUnit;
		const along = base.height * INV_PI / pixelsPerUnit;

		// The night image may be a different size than the day one
		const nightBase = dayNight ? night!.levels[0]! : base;
		const nightRatio = nightBase.width / base.width;

		// The globe's edge is anti-aliased half a pixel either side
		const edge = 0.5 / pixelsPerUnit;
		const outer2 = (1 + edge) * (1 + edge);

		// A globe's center decides for the whole frame
		let [level, blend] = this._pick(this._day, Math.min(across, along));
		let [nightLevel, nightBlend] = dayNight ? this._pick(night!, Math.min(across, along) * nightRatio) : [level, blend];
		let sw = level.width, sh = level.height, src = level.pixels;

		for (let row = 0; row < pixelHeight; row++) {
			const y = (ty - (row + .5) / resolution) / scale;
			let first = 0;
			let last = pixelWidth - 1;
			let cosPhi = 0;
			let sinPhi = 0;
			let stretch = 1;

			if (orthographic) {
				const reach2 = outer2 - y * y;
				if (reach2 <= 0) {
					continue;
				}
				const reach = Math.sqrt(reach2);
				first = Math.max(0, Math.floor((tx - reach * scale) * resolution - .5));
				last = Math.min(pixelWidth - 1, Math.ceil((tx + reach * scale) * resolution - .5));
			}
			else {
				const rowAt = rawRow(kind, y);
				if (!rowAt) {
					continue;
				}
				const phi = rowAt[0];
				stretch = rowAt[1];
				cosPhi = Math.cos(phi);
				sinPhi = Math.sin(phi);

				// Rows are stretched differently, so each picks its own level
				const texels = Math.min(across * stretch, kind === MERCATOR ? along * cosPhi : along);
				[level, blend] = this._pick(this._day, texels);
				if (dayNight) {
					[nightLevel, nightBlend] = this._pick(night!, texels * nightRatio);
				}
				sw = level.width;
				sh = level.height;
				src = level.pixels;
			}

			const offset = row * pixelWidth;
			let x = ((first + .5) / resolution - tx) / scale;

			for (let column = first; column <= last; column++, x += dx) {
				let vx: number, vy: number, vz: number;
				let alpha = 1;

				if (orthographic) {
					const r2 = x * x + y * y;
					if (r2 >= outer2) {
						continue;
					}
					let z = 0;
					if (r2 < 1) {
						z = Math.sqrt(1 - r2);
					}
					const r = Math.sqrt(r2);
					if (r > 1 - edge) {
						alpha = (1 + edge - r) / (2 * edge);
					}
					vx = m0 * z + m3 * x + m6 * y;
					vy = m1 * z + m4 * x + m7 * y;
					vz = m2 * z + m5 * x + m8 * y;
				}
				else {
					let lambda = x * stretch;
					const over = (lambda < 0 ? -lambda : lambda) - Math.PI;
					if (stretch === 1) {
						if (over > 0) {
							continue;
						}
					}
					else {
						// The curved sides are anti-aliased half a pixel either side
						const span = dx * stretch;
						if (over > span / 2) {
							continue;
						}
						if (over > -span / 2) {
							alpha = .5 - over / span;
							if (over > 0) {
								lambda = lambda < 0 ? -Math.PI : Math.PI;
							}
						}
					}
					const ux = cosPhi * Math.cos(lambda);
					const uy = cosPhi * Math.sin(lambda);
					vx = m0 * ux + m3 * uy + m6 * sinPhi;
					vy = m1 * ux + m4 * uy + m7 * sinPhi;
					vz = m2 * ux + m5 * uy + m8 * sinPhi;
				}

				const lambda = Math.atan2(vy, vx);
				const latitude = Math.asin(vz > 1 ? 1 : vz < -1 ? -1 : vz);
				const u = lambda * INV_TWO_PI + .5;
				const v = .5 - latitude * INV_PI;
				let pixel: number;
				if (blend) {
					pixel = sampleBilinear(level, u, v);
				}
				else {
					let px = (u * sw) | 0;
					if (px >= sw) {
						px -= sw;
					}
					let py = (v * sh) | 0;
					if (py >= sh) {
						py = sh - 1;
					}
					pixel = src[py * sw + px];
				}

				// The sine of the sun's height there decides between day and night
				if (dayNight) {
					const t = smoothstep(-twilight, twilight, (vx * sx + vy * sy + vz * sz) / Math.sqrt(vx * vx + vy * vy + vz * vz));
					if (t < 1) {
						const dark = nightBlend ? sampleBilinear(nightLevel, u, v) : sampleNearest(nightLevel, u, v);
						pixel = t > 0 ? mixPixels(dark, pixel, t) : dark;
					}
				}

				// Alpha is the top byte: browsers are little-endian
				if (alpha < 1) {
					pixel = (pixel & 0xffffff) | (((pixel >>> 24) * alpha) << 24);
				}
				out[offset + column] = pixel;
			}
		}
	}

	// Any projection, through its own invert: slow, but exact
	protected _renderInverse(projection: GeoProjection, out: Uint32Array, pixelWidth: number, pixelHeight: number, resolution: number, night: IRasterImage | undefined, sun: Array<number> | undefined, twilight: number) {
		const invert = projection.invert;
		if (!invert) {
			return;
		}
		const texels = this._day.levels[0]!.width * INV_TWO_PI / (projection.scale() * resolution);
		const [level, blend] = this._pick(this._day, texels);
		const sample = blend ? sampleBilinear : sampleNearest;
		const dayNight = night && sun ? true : false;
		const [nightLevel, nightBlend] = dayNight ? this._pick(night!, texels * night!.levels[0]!.width / this._day.levels[0]!.width) : [level, blend];
		const sampleNight = nightBlend ? sampleBilinear : sampleNearest;
		const tolerance = .5 / resolution;
		const point: [number, number] = [0, 0];
		for (let row = 0; row < pixelHeight; row++) {
			point[1] = (row + .5) / resolution;
			const offset = row * pixelWidth;
			for (let column = 0; column < pixelWidth; column++) {
				point[0] = (column + .5) / resolution;
				const location = invert(point);
				if (!location || !isFinite(location[0]) || !isFinite(location[1]) || location[1] > 90 || location[1] < -90) {
					continue;
				}

				// Off the map, an inverse can still answer: only points that project back here count
				const back = projection(location);
				if (!back || Math.abs(back[0] - point[0]) > tolerance || Math.abs(back[1] - point[1]) > tolerance) {
					continue;
				}
				let u = location[0] / 360 + .5;
				u -= Math.floor(u);
				const v = .5 - location[1] / 180;
				let pixel = sample(level, u, v);
				if (dayNight) {
					const g = toVector(location[0], location[1]);
					const t = smoothstep(-twilight, twilight, g[0] * sun![0] + g[1] * sun![1] + g[2] * sun![2]);
					if (t < 1) {
						const dark = sampleNight(nightLevel, u, v);
						pixel = t > 0 ? mixPixels(dark, pixel, t) : dark;
					}
				}
				out[offset + column] = pixel;
			}
		}
	}

	protected _dispose() {
		if (this._world) {
			this._removeGeometry(this._world);
		}
		this._sunClock.dispose();
		releaseGL();
		super._dispose();
		for (const raster of [this._day, this._night]) {
			this._deleteTexture(raster);
			if (raster.image) {
				raster.image.src = "";
			}
			raster.image = undefined;
			raster.levels = [];
		}
		this._output = undefined;
		this._canvas = undefined;
		this._context = undefined;
	}
}

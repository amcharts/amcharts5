/**
 * @ignore
 */
export class MonotoneXTension {

  constructor(context: CanvasRenderingContext2D, tension: number) {
    this._context = context;
    this._tension = tension;
  }

  public _line = 0;
  public _point = 0;
  public _context: any;
  public _x0 = 0;
  public _x1 = 0;
  public _y0 = 0;
  public _y1 = 0;
  public _t0 = 0;

  public _tension: number = 0;

  public areaStart() {
    this._line = 0;
  }

  public areaEnd() {
    this._line = NaN;
  }

  public lineStart() {
    this._x0 = this._x1 =
      this._y0 = this._y1 =
      this._t0 = NaN;
    this._point = 0;
  }

  public lineEnd() {
    switch (this._point) {
      case 2: this._context.lineTo(this._x1, this._y1); break;
      case 3: point(this, this._t0, slope2(this, this._t0)); break;
    }
    if (this._line || (this._line !== 0 && this._point === 1)) this._context.closePath();
    this._line = 1 - this._line;
  }

  public point(x: number, y: number) {
    let t1 = NaN;

    x = +x, y = +y;
    if (x === this._x1 && y === this._y1) return; // Ignore coincident points.
    switch (this._point) {
      case 0: this._point = 1; this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y); break;
      case 1: this._point = 2; break;
      case 2: this._point = 3; point(this, slope2(this, t1 = slope3(this, x, y)), t1); break;
      default: point(this, this._t0, t1 = slope3(this, x, y)); break;
    }

    this._x0 = this._x1, this._x1 = x;
    this._y0 = this._y1, this._y1 = y;
    this._t0 = t1;
  }
}

/**
 * @ignore
 */
export function curveMonotoneXTension(tension: number) {

  function monotoneXTension(context: any) {
    return new MonotoneXTension(context, tension);
  }

  return monotoneXTension;
}

/**
 * @ignore
 */
function sign(x: number) {
  return x < 0 ? -1 : 1;
}

/**
 * @ignore
 */
function slope3(that: MonotoneXTension, x2: number, y2: number) {
  let h0 = (that._x1 - that._x0) as any;
  let h1 = (x2 - that._x1) as any;
  let s0 = (that._y1 - that._y0) / (h0 || h1 < 0 && -0);
  let s1 = (y2 - that._y1) / (h1 || h0 < 0 && -0);
  let p = (s0 * h1 + s1 * h0) / (h0 + h1);
  return (sign(s0) + sign(s1)) * Math.min(Math.abs(s0), Math.abs(s1), 0.5 * Math.abs(p)) || 0;
}

/**
 * @ignore
 */
function slope2(that: MonotoneXTension, t: number) {
  let h = that._x1 - that._x0;
  return h ? (3 * (that._y1 - that._y0) / h - t) / 2 : t;
}

/**
 * @ignore
 */
function point(that: MonotoneXTension, t0: number, t1: number) {
  let x0 = that._x0,
    y0 = that._y0,
    x1 = that._x1,
    y1 = that._y1,
    dx = (x1 - x0) / 1.5 * (1 - that._tension);
  that._context.bezierCurveTo(x0 + dx, y0 + dx * t0, x1 - dx, y1 - dx * t1, x1, y1);
}
import { Graphics, IGraphicsSettings, IGraphicsPrivate } from "../../core/render/Graphics";
import type { IPoint } from "../../core/util/IPoint";
import * as $math from "../../core/util/Math";
import * as $utils from "../../core/util/Utils";

export interface IFunnelSliceSettings extends IGraphicsSettings {

	/**
	 * Top width in pixels.
	 */
	topWidth?: number;

	/**
	 * Bottom width in pixels.
	 */
	bottomWidth?: number;

	/**
	 * Orientation.
	 */
	orientation?: "vertical" | "horizontal";

	/**
	 * A distance in pixels the slice should "puff up".
	 *
	 * Any non-zero value will make sides of the slide curved.
	 */
	expandDistance?: number;

	/**
	 * Radius of the top-left corner in pixels.
	 *
	 * @since 5.11.2
	 */
	cornerRadiusTL?: number;

	/**
	 * Radius of the top-right corner in pixels.
	 * 
	 * @since 5.11.2
	 */
	cornerRadiusTR?: number;

	/**
	 * Radius of the botttom-right corner in pixels.
	 * 
	 * @since 5.11.2
	 */
	cornerRadiusBR?: number;

	/**
	 * Radius of the bottom-left corner in pixels.
	 * 
	 * @since 5.11.2
	 */
	cornerRadiusBL?: number;

}

export interface IFunnelSlicePrivate extends IGraphicsPrivate {
}

/**
 * Draws a slice for [[FunnelSeries]].
 */
export class FunnelSlice extends Graphics {
	declare public _settings: IFunnelSliceSettings;
	declare public _privateSettings: IFunnelSlicePrivate;

	public static className: string = "FunnelSlice";
	public static classNames: Array<string> = Graphics.classNames.concat([FunnelSlice.className]);
	protected _projectionDirty: boolean = false;

	protected _tlx: number = 0;
	protected _tly: number = 0;

	protected _trx: number = 0;
	protected _try: number = 0;

	protected _blx: number = 0;
	protected _bly: number = 0;

	protected _brx: number = 0;
	protected _bry: number = 0;

	protected _cprx: number = 0;
	protected _cplx: number = 0;
	protected _cpry: number = 0;
	protected _cply: number = 0;

	protected _afterNew() {
		super._afterNew();
		this.set("draw", (display) => {
			const w = this.width();
			const h = this.height();

			let minSide = Math.min(w, h) / 2;

			let crtl = $utils.relativeToValue(this.get("cornerRadiusTL", 0), minSide);
			let crtr = $utils.relativeToValue(this.get("cornerRadiusTR", 0), minSide);
			let crbr = $utils.relativeToValue(this.get("cornerRadiusBR", 0), minSide);
			let crbl = $utils.relativeToValue(this.get("cornerRadiusBL", 0), minSide);

			let trX = this._trx;
			let trY = this._try;
			let tlX = this._tlx;
			let tlY = this._tly;
			let brX = this._brx;
			let brY = this._bry;
			let blX = this._blx;
			let blY = this._bly;

			if (trY == tlY) {
				trY = trY - 0.01;
			}

			if (brY == blY) {
				brY = brY - 0.01;
			}

			let tlAngle = $math.getAngle({ x: tlX, y: tlY }, { x: trX, y: trY });
			let trAngle = $math.getAngle({ x: trX, y: trY }, { x: brX, y: brY });
			let brAngle = $math.getAngle({ x: brX, y: brY }, { x: blX, y: blY });
			let blAngle = $math.getAngle({ x: blX, y: blY }, { x: tlX, y: tlY });

			if (this.get("orientation") == "horizontal") {
				crtl = Math.min(crtl, Math.abs(tlY - trY) / 2);
				crtr = Math.min(crtr, Math.abs(tlY - trY) / 2);
				crbr = Math.min(crbr, Math.abs(blY - brY) / 2);
				crbl = Math.min(crbl, Math.abs(blY - brY) / 2);
			}
			else {
				crtl = Math.min(crtl, Math.abs(tlX - trX) / 2);
				crtr = Math.min(crtr, Math.abs(tlX - trX) / 2);
				crbr = Math.min(crbr, Math.abs(blX - brX) / 2);
				crbl = Math.min(crbl, Math.abs(blX - brX) / 2);
			}

			const tlX1 = tlX - crtl * $math.tan((tlAngle - blAngle) / 2) * $math.cos((blAngle));
			const tlY1 = tlY - crtl * $math.tan((tlAngle - blAngle) / 2) * $math.sin((blAngle));

			const tlX2 = tlX - crtl * $math.tan((blAngle - tlAngle) / 2) * $math.cos((tlAngle));
			const tlY2 = tlY - crtl * $math.tan((blAngle - tlAngle) / 2) * $math.sin((tlAngle));

			const trX1 = trX - crtr * $math.tan((trAngle - tlAngle) / 2) * $math.cos((tlAngle));
			const trY1 = trY - crtr * $math.tan((trAngle - tlAngle) / 2) * $math.sin((tlAngle));

			const trX2 = trX - crtr * $math.tan((tlAngle - trAngle) / 2) * $math.cos((trAngle));
			const trY2 = trY - crtr * $math.tan((tlAngle - trAngle) / 2) * $math.sin((trAngle));

			const brX1 = brX - crbr * $math.tan((brAngle - trAngle) / 2) * $math.cos((trAngle));
			const brY1 = brY - crbr * $math.tan((brAngle - trAngle) / 2) * $math.sin((trAngle));

			const brX2 = brX - crbr * $math.tan((trAngle - brAngle) / 2) * $math.cos((brAngle));
			const brY2 = brY - crbr * $math.tan((trAngle - brAngle) / 2) * $math.sin((brAngle));

			const blX1 = blX - crbl * $math.tan((blAngle - brAngle) / 2) * $math.cos((brAngle));
			const blY1 = blY - crbl * $math.tan((blAngle - brAngle) / 2) * $math.sin((brAngle));

			const blX2 = blX - crbl * $math.tan((brAngle - blAngle) / 2) * $math.cos((blAngle));
			const blY2 = blY - crbl * $math.tan((brAngle - blAngle) / 2) * $math.sin((blAngle));

			display.moveTo(tlX2, tlY2);
			display.lineTo(trX1, trY1);

			display.arcTo(trX, trY, trX2, trY2, crtr);
			display.quadraticCurveTo(this._cprx, this._cpry, brX1, brY1);
			display.arcTo(brX, brY, brX2, brY2, crbr);
			display.lineTo(blX1, blY1);
			display.arcTo(blX, blY, blX2, blY2, crbl);
			display.quadraticCurveTo(this._cplx, this._cply, tlX1, tlY1);
			display.arcTo(tlX, tlY, tlX2, tlY2, crtl);
		})
	}

	public getPoint(locationX: number, locationY: number): IPoint {
		let w = this.width();
		let h = this.height();

		const tw = this.get("topWidth", 0);
		const bw = this.get("bottomWidth", 0);

		if (this.get("orientation") == "vertical") {
			let tlx = -tw / 2;
			let trx = tw / 2;

			let brx = bw / 2;
			let blx = - bw / 2;

			let mlx = tlx + (blx - tlx) * locationY;
			let mrx = trx + (brx - trx) * locationY;

			return { x: mlx + (mrx - mlx) * locationX, y: h * locationY };
		}
		else {
			let tlx = -tw / 2;
			let trx = tw / 2;

			let brx = bw / 2;
			let blx = - bw / 2;

			let mlx = tlx + (blx - tlx) * locationX;
			let mrx = trx + (brx - trx) * locationX;

			return { x: w * locationX, y: mlx + (mrx - mlx) * locationY };
		}

	}

	public _changed() {

		if (this.isDirty("topWidth") || this.isDirty("bottomWidth") || this.isDirty("expandDistance") || this.isDirty("orientation") || this.isDirty("width") || this.isDirty("height")) {
			const w = this.width();
			const h = this.height();
			const tw = this.get("topWidth", 0);
			const bw = this.get("bottomWidth", 0);
			this._clear = true;

			let ed = this.get("expandDistance", 0);

			if (this.get("orientation") == "vertical") {
				this._tlx = -tw / 2;
				this._tly = 0;

				this._trx = tw / 2;
				this._try = 0;

				this._brx = bw / 2;
				this._bry = h;

				this._blx = -bw / 2;
				this._bly = h;

				this._cprx = this._trx + (this._brx - this._trx) / 2 + ed * h,
					this._cpry = this._try + 0.5 * h;

				this._cplx = this._tlx + (this._blx - this._tlx) / 2 - ed * h;
				this._cply = this._tly + 0.5 * h;
			}
			else {

				this._tly = tw / 2;
				this._tlx = 0;

				this._try = -tw / 2;
				this._trx = 0;

				this._bry = -bw / 2;
				this._brx = w;

				this._bly = bw / 2;
				this._blx = w;

				this._cpry = this._try + (this._bry - this._try) / 2 - ed * w,
					this._cprx = this._trx + 0.5 * w;

				this._cply = this._tly + (this._bly - this._tly) / 2 + ed * w;
				this._cplx = this._tlx + 0.5 * w;
			}
		}
		super._changed();
	}
}

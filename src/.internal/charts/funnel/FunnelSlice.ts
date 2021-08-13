import type { Root } from "../../core/Root";
import { Graphics, IGraphicsSettings, IGraphicsPrivate } from "../../core/render/Graphics";
import type { Template } from "../../core/util/Template";
import type { IPoint } from "../../core/util/IPoint";

export interface IMapLineSettings extends IGraphicsSettings {

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

}

export interface IMapLinePrivate extends IGraphicsPrivate {
}

/**
 * Draws a slice for [[FunnelSeries]].
 */
export class FunnelSlice extends Graphics {

	/**
	 * Use this method to create an instance of this class.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/getting-started/#New_element_syntax} for more info
	 * @param   root      Root element
	 * @param   settings  Settings
	 * @param   template  Template
	 * @return            Instantiated object
	 */
	public static new(root: Root, settings: FunnelSlice["_settings"], template?: Template<FunnelSlice>): FunnelSlice {
		const x = new FunnelSlice(root, settings, true, template);
		x._afterNew();
		return x;
	}

	declare public _settings: IMapLineSettings;
	declare public _privateSettings: IMapLinePrivate;

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
			display.moveTo(this._tlx, this._tly);
			display.lineTo(this._trx, this._try);
			display.quadraticCurveTo(this._cprx, this._cpry, this._brx, this._bry);
			//display.lineTo(this._brx, this._bry);
			display.lineTo(this._blx, this._bly);
			display.quadraticCurveTo(this._cplx, this._cply, this._tlx, this._tly);
			//display.lineTo(this._tlx, this._tly);
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

			return { x: w * locationX, y: mlx + (mrx - mlx) * locationY};
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
				this._tly = -tw / 2;
				this._tlx = 0;

				this._try = tw / 2;
				this._trx = 0;

				this._bry = bw / 2;
				this._brx = w;

				this._bly = -bw / 2;
				this._blx = w;

				this._cpry = this._try + (this._bry - this._try) / 2 + ed * w,
				this._cprx = this._trx + 0.5 * w;

				this._cply = this._tly + (this._bly - this._tly) / 2 - ed * w;
				this._cplx = this._tlx + 0.5 * w;
			}
		}
		super._changed();
	}
}

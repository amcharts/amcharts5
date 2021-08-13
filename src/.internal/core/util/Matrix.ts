/**
 * Modified from Pixi:
 *
 * The MIT License
 *
 * Copyright (c) 2013-2017 Mathew Groves, Chad Engler
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

import type { IPoint } from "./IPoint";

/**
 * @ignore
 */
export class Matrix {
	public a: number;
	public b: number;
	public c: number;
	public d: number;
	public tx: number;
	public ty: number;

	constructor(a = 1, b = 0, c = 0, d = 1, tx = 0, ty = 0) {
		this.a = a;
		this.b = b;
		this.c = c;
		this.d = d;
		this.tx = tx;
		this.ty = ty;
	}

	/**
	 * Sets the matrix based on all the available properties
	 */
	setTransform(x: number, y: number, pivotX: number, pivotY: number, rotation: number, scale: number = 1): void {
		this.a = Math.cos(rotation) * scale;
		this.b = Math.sin(rotation) * scale;
		this.c = -Math.sin(rotation) * scale;
		this.d = Math.cos(rotation) * scale;
		this.tx = x - ((pivotX * this.a) + (pivotY * this.c));
		this.ty = y - ((pivotX * this.b) + (pivotY * this.d));
	}

	/**
	 * Get a new position with the current transformation applied.
	 * Can be used to go from a child's coordinate space to the world coordinate space. (e.g. rendering)
	 */
	apply(origin: IPoint): IPoint {
		return {
			x: (this.a * origin.x) + (this.c * origin.y) + this.tx,
			y: (this.b * origin.x) + (this.d * origin.y) + this.ty
		};
	}

	/**
	 * Get a new position with the inverse of the current transformation applied.
	 * Can be used to go from the world coordinate space to a child's coordinate space. (e.g. input)
	 */
	applyInverse(origin: IPoint): IPoint {
		const id = 1 / ((this.a * this.d) + (this.c * -this.b));

		return {
			x: (this.d * id * origin.x) + (-this.c * id * origin.y) + (((this.ty * this.c) - (this.tx * this.d)) * id),
			y: (this.a * id * origin.y) + (-this.b * id * origin.x) + (((-this.ty * this.a) + (this.tx * this.b)) * id)
		};
	}

	/**
	 * Appends the given Matrix to this Matrix.
	 */
	append(matrix: Matrix): void {
		const a1 = this.a;
		const b1 = this.b;
		const c1 = this.c;
		const d1 = this.d;
		this.a = (matrix.a * a1) + (matrix.b * c1);
		this.b = (matrix.a * b1) + (matrix.b * d1);
		this.c = (matrix.c * a1) + (matrix.d * c1);
		this.d = (matrix.c * b1) + (matrix.d * d1);
		this.tx = (matrix.tx * a1) + (matrix.ty * c1) + this.tx;
		this.ty = (matrix.tx * b1) + (matrix.ty * d1) + this.ty;
	}

	/**
	 * Prepends the given Matrix to this Matrix.
	 */
	prepend(matrix: Matrix): void {
		const tx1 = this.tx;
		if (matrix.a !== 1 || matrix.b !== 0 || matrix.c !== 0 || matrix.d !== 1) {
			const a1 = this.a;
			const c1 = this.c;
			this.a = (a1 * matrix.a) + (this.b * matrix.c);
			this.b = (a1 * matrix.b) + (this.b * matrix.d);
			this.c = (c1 * matrix.a) + (this.d * matrix.c);
			this.d = (c1 * matrix.b) + (this.d * matrix.d);
		}
		this.tx = (tx1 * matrix.a) + (this.ty * matrix.c) + matrix.tx;
		this.ty = (tx1 * matrix.b) + (this.ty * matrix.d) + matrix.ty;
	}

	/**
	 * Copies the other matrix's properties into this matrix
	 */
	copyFrom(matrix: Matrix): void {
		this.a = matrix.a;
		this.b = matrix.b;
		this.c = matrix.c;
		this.d = matrix.d;
		this.tx = matrix.tx;
		this.ty = matrix.ty;
	}
}


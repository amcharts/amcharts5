/**
 * A WebGL2 context shared by every chart on the page: browsers allow only a
 * few live contexts (8-16), and dashboards can have more charts than that.
 * Users draw into it and copy the result out before anyone else draws, and
 * set every piece of state they depend on: nothing is reset between users.
 *
 * @ignore
 */
export interface ISharedGL {
	canvas: HTMLCanvasElement;
	gl: WebGL2RenderingContext;

	/**
	 * Changes when a lost context is restored: textures and programs made
	 * before are gone.
	 */
	generation: number;
}

let shared: ISharedGL | null | undefined;

/**
 * The shared context, or `undefined` without WebGL2, with software-only
 * WebGL, or while the context is lost.
 *
 * @ignore
 */
export function sharedGL(): ISharedGL | undefined {
	if (shared === undefined) {
		shared = null;
		try {
			const canvas = document.createElement("canvas");
			// Software WebGL is slower than drawing on the CPU: callers fall back to their CPU path
			const gl = canvas.getContext("webgl2", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, failIfMajorPerformanceCaveat: true });
			if (gl) {
				const context: ISharedGL = { canvas, gl, generation: 0 };
				canvas.addEventListener("webglcontextlost", (event) => event.preventDefault());
				canvas.addEventListener("webglcontextrestored", () => context.generation++);
				shared = context;
			}
		} catch (e) {
		}
	}
	return shared && !shared.gl.isContextLost() ? shared : undefined;
}

let users = 0;

/**
 * Counts a user of the shared context in; `releaseGL()` counts it out.
 *
 * @ignore
 */
export function retainGL(): void {
	users++;
}

/**
 * With no users left, the canvas gives back the memory of the largest
 * drawing made in it. The context stays, for whoever comes next.
 *
 * @ignore
 */
export function releaseGL(): void {
	users = Math.max(0, users - 1);
	if (users === 0 && shared) {
		shared.canvas.width = 1;
		shared.canvas.height = 1;
	}
}

function compile(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader | undefined {
	const shader = gl.createShader(type);
	if (shader) {
		gl.shaderSource(shader, source);
		gl.compileShader(shader);
		if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			return shader;
		}
		console.warn("WebGL shader: " + gl.getShaderInfoLog(shader));
		gl.deleteShader(shader);
	}
}

/**
 * Compiles and links a program, or `undefined` with a console warning.
 *
 * @ignore
 */
export function makeProgram(gl: WebGL2RenderingContext, vertexSource: string, fragmentSource: string): WebGLProgram | undefined {
	const vertex = compile(gl, gl.VERTEX_SHADER, vertexSource);
	const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource);
	const program = gl.createProgram();
	if (!vertex || !fragment || !program) {
		return;
	}
	gl.attachShader(program, vertex);
	gl.attachShader(program, fragment);
	gl.linkProgram(program);
	gl.deleteShader(vertex);
	gl.deleteShader(fragment);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		console.warn("WebGL program: " + gl.getProgramInfoLog(program));
		gl.deleteProgram(program);
		return;
	}
	return program;
}

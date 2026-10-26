/**
 * A collection of network-related functions
 */

/**
 * ============================================================================
 * IMPORTS
 * ============================================================================
 * @hidden
 */
import type { Optional } from "./Type";

/**
 * Defines an interface for objects that hold a net request result.
 */
export interface INetLoadResult<A> {

	/**
	 * A reference to original [[XMLHttpRequest]].
	 */
	xhr: XMLHttpRequest;

	/**
	 * Request response body.
	 */
	response?: string;

	/**
	 * Response as a `Blob`, when `responseType` is `"blob"`. `response` then
	 * holds its text.
	 */
	blob?: Blob;

	/**
	 * Response `Content-Type`.
	 */
	type: string | null;

	/**
	 * Was there an error?
	 */
	error: boolean;

	/**
	 * The `target` passed to `load()`.
	 */
	target?: A;

}

/**
 * Options for `load()`.
 */
export interface INetRequestOptions {

	/**
	 * Custom request headers to be added to HTTP(S) request.
	 */
	requestHeaders?: { key: string, value: string }[];

	/**
	 * Specify expected response type.
	 *
	 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/responseType} for more info
	 */
	responseType?: XMLHttpRequestResponseType;

	/**
	 * Sends credentials, such as cookies, with cross-origin requests.
	 *
	 * @default false
	 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/withCredentials} for more info
	 */
	withCredentials?: boolean;
}

/**
 * Loads a file from `url` and returns a `Promise` of the result. The promise
 * is rejected, with `error: true` in the result, if the request fails or its
 * status is not 200.
 *
 * ```TypeScript
 * // Using await
 * let response = await am5.net.load( "http://www.my.com/data.json" );
 * console.log( response.response );
 *
 * // Using then()
 * am5.net.load( "http://www.my.com/data.json" ).then( ( response ) => {
 *   console.log( response.response );
 * } );
 * ```
 * ```JavaScript
 * // Using then()
 * am5.net.load( "http://www.my.com/data.json" ).then( function( response ) {
 *   console.log( response.response );
 * } );
 * ```
 *
 * @async
 * @see {@link https://docs.amcharts.com/v5/concepts/data/net-load-utility/} for more info
 * @param url      URL for the file to load
 * @param target   Any object, passed back as `target` in the result
 * @param options  Request options
 * @return Result (Promise)
 */
export function load<A>(url: string, target?: A, options?: INetRequestOptions): Promise<INetLoadResult<A>> {
	return new Promise<INetLoadResult<A>>((success, error) => {

		// Is return type Blob?
		let isBlob = options != null && options.responseType == "blob";

		// Create request and set up handlers
		let xhr = new XMLHttpRequest();
		xhr.onload = () => {
			if (xhr.status === 200) {

				let response: Optional<string>;
				let blob: Optional<Blob>;

				if (isBlob) {
					blob = xhr.response;
					readBlob(blob!).then((response: any) => {
						let output: INetLoadResult<A> = {
							xhr: xhr,
							error: false,
							response: response,
							blob: blob,
							type: xhr.getResponseHeader("Content-Type"),
							target: target
						};
						success(output);
					}, () => {
						error({
							xhr: xhr,
							error: true,
							blob: blob,
							type: xhr.getResponseHeader("Content-Type"),
							target: target
						});
					});
					return;
				}
				else {
					response = xhr.responseText || xhr.response
				}

				let output: INetLoadResult<A> = {
					xhr: xhr,
					error: false,
					response: response,
					blob: blob,
					type: xhr.getResponseHeader("Content-Type"),
					target: target
				};
				success(output);
			}
			else {
				error({
					xhr: xhr,
					error: true,
					type: xhr.getResponseHeader("Content-Type"),
					target: target
				});
			}
		};
		xhr.onerror = () => {
			error({
				xhr: xhr,
				error: true,
				type: xhr.getResponseHeader("Content-Type"),
				target: target
			});
		};

		// Open request
		xhr.open("GET", url, true);

		if (options && options.withCredentials) {
			xhr.withCredentials = true;
		}

		// Process options
		if (options != null) {

			if (options.requestHeaders != null) {
				for (let i = 0; i < options.requestHeaders.length; i++) {
					let header = options.requestHeaders[i];
					xhr.setRequestHeader(header.key, header.value);
				}
			}

			if (options.responseType != null) {
				xhr.responseType = options.responseType;
			}
		}

		// Send request
		xhr.send();

	});

}

/**
 * Returns textual representation of a Blob object.
 *
 * @param   blob  Target blob
 * @return        Text promise
 */
export function readBlob(blob: Blob): Promise<string> {
	return new Promise<string>((success, error) => {
		const reader = new FileReader()

		reader.onload = _event => {
			success(<string>reader.result);
		}

		reader.onerror = (e) => {
			error(e);
		}

		reader.readAsText(blob);
	});
}

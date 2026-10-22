import { createElement, forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import type { ForwardedRef } from "react";
import { Linking, StyleSheet, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import WebView from "react-native-webview";
import type { WebViewMessageEvent, WebViewProps } from "react-native-webview";
import { libraryVersion, pageHtml } from "./generated";

/**
 * Props of `<AmChart>`.
 */
export interface AmChartProps {

	/**
	 * The chart as a JSON config: an object, or a JSON string. A config with
	 * different content makes the chart again.
	 */
	config?: object | string;

	/**
	 * The chart as code, used when there is no `config`. It runs in the chart's
	 * page with `root`, `data` and `post`, and the library's globals (`am5`,
	 * `am5xy`...). A different string makes the chart again. Return a function
	 * to get new `data` without making the chart again, or a promise for
	 * `onReady` to wait for.
	 */
	code?: string;

	/**
	 * Data for `code`, as `data`. It must be JSON. New content goes to the
	 * function `code` returned, or makes the chart again. With a `config` it
	 * is only there for `run()`.
	 */
	data?: unknown;

	/**
	 * Theme names, e.g. `["Animated", "Dark"]`.
	 */
	themes?: Array<string>;

	/**
	 * Draws the chart as SVG instead of canvas.
	 *
	 * @default "canvas"
	 */
	renderer?: "canvas" | "svg";

	/**
	 * amCharts license keys, which remove the amCharts logo. They are added
	 * before the chart is made: calling `am5.addLicense()` in `code` would be
	 * too late.
	 */
	licenses?: Array<string>;

	/**
	 * More script files to load, e.g. `"locales/de_DE"`, or a full URL. Chart
	 * types, themes, plugins and geodata named by their global are loaded
	 * without this.
	 */
	modules?: Array<string>;

	/**
	 * Where the library's script files are.
	 *
	 * @default "https://cdn.amcharts.com/lib/version/<the library version this package was released with>/"
	 */
	libraryUrl?: string;

	/**
	 * Where the geodata files are.
	 *
	 * @default "https://cdn.amcharts.com/lib/5/geodata/", or the `geodata/` folder of a `libraryUrl` that is not on the amCharts CDN
	 */
	geodataUrl?: string;

	/**
	 * Called when the chart is built.
	 */
	onReady?: () => void;

	/**
	 * Called when the chart could not be built, or its code failed. Without it
	 * the error goes to `console.warn`.
	 */
	onError?: (message: string) => void;

	/**
	 * Called when the chart's code calls `post(name, value)`.
	 */
	onMessage?: (name: string, value: unknown) => void;

	/**
	 * Give the chart a height, or `flex: 1`; without one it is 400 high.
	 */
	style?: StyleProp<ViewStyle>;

	/**
	 * Props for the WebView the chart is drawn in, except the ones the chart
	 * needs for itself.
	 */
	webViewProps?: Partial<Omit<WebViewProps, "source" | "onMessage" | "onShouldStartLoadWithRequest" | "onContentProcessDidTerminate" | "onRenderProcessGone">>;

}

/**
 * What a ref on `<AmChart>` gives.
 */
export interface AmChartHandle {

	/**
	 * Runs code in the chart's page, with `root`, `chart` (from a config),
	 * `result` (what `code` returned), `data` and `post`. Before the chart is
	 * ready, it waits for it.
	 */
	run(code: string): void;

}

interface Message {
	type: "loaded" | "ready" | "error" | "message";
	message?: string;
	name?: string;
	value?: unknown;
}

function folder(url: string): string {
	return /\/$/.test(url) ? url : url + "/";
}

// Line separators end a line in older engines, even inside a string
const separators = new RegExp("[" + String.fromCharCode(0x2028, 0x2029) + "]", "g");

// Script for injectJavaScript, with a value that may hold any text
function call(name: string, value: unknown): string {
	const text = JSON.stringify(value);
	const json = text === undefined ? "undefined" : text.replace(separators, (c) => "\\u" + c.charCodeAt(0).toString(16));
	return "window.amChartPage && window.amChartPage." + name + "(" + json + "); true;";
}

function hasHeight(style: StyleProp<ViewStyle>): boolean {
	const flat = StyleSheet.flatten(style) || {};
	return flat.height != null || flat.minHeight != null || flat.flex != null || flat.flexGrow != null || flat.aspectRatio != null || flat.bottom != null;
}

const webViewStyle = { flex: 1, backgroundColor: "transparent" };

const CDN = "https://cdn.amcharts.com/lib/";

/**
 * An amCharts 5 chart in a WebView, from a JSON config or from chart code.
 *
 * ```tsx
 * <AmChart config={config} themes={["Animated"]} style={{ height: 300 }} />
 * ```
 */
export const AmChart = forwardRef(function AmChart(props: AmChartProps, ref: ForwardedRef<AmChartHandle>) {
	const webView = useRef<WebView>(null);

	// A new page after the old one's process was lost
	const [page, setPage] = useState(0);

	// The page that has loaded, with the library address it was given
	const [loaded, setLoaded] = useState<{ url: string } | undefined>(undefined);
	const shown = useRef(loaded);
	shown.current = loaded;

	// The latest callbacks: new ones on every render do not make the chart again
	const latest = useRef(props);
	latest.current = props;

	const libraryUrl = folder(props.libraryUrl || CDN + "version/" + libraryVersion + "/");

	// Geodata and fonts are not in the CDN's version folders
	const sharedUrl = libraryUrl.indexOf(CDN) === 0 ? CDN + "5/" : libraryUrl;
	const geodataUrl = folder(props.geodataUrl || sharedUrl + "geodata/");
	const currentUrl = useRef(libraryUrl);
	currentUrl.current = libraryUrl;

	// Compared by content: a config or data written inline is a new object on every render
	const config = typeof props.config === "string" ? props.config : JSON.stringify(props.config);
	const buildKey = JSON.stringify([config, props.code, props.themes, props.renderer, props.modules, props.licenses, geodataUrl]);
	const dataKey = String(JSON.stringify(props.data));

	const sent = useRef<{ build?: string, data?: string }>({});

	// run() waits for the chart that is being built
	const ready = useRef(false);
	const queue = useRef<Array<string>>([]);

	useEffect(() => {
		const target = webView.current;
		if (!loaded || loaded.url !== libraryUrl || !target) {
			return;
		}

		const current = latest.current;

		if (sent.current.build !== buildKey) {
			let parsed: unknown;
			try {
				parsed = typeof current.config === "string" ? JSON.parse(current.config) : current.config;
			}
			catch (error) {
				report("config: " + (error as Error).message);
				return;
			}

			ready.current = false;
			target.injectJavaScript(call("build", {
				config: parsed,
				code: current.code,
				data: current.data,
				themes: current.themes || [],
				renderer: current.renderer || "canvas",
				licenses: current.licenses || [],
				modules: current.modules || [],
				libraryUrl: libraryUrl,
				geodataUrl: geodataUrl,
				fontsUrl: sharedUrl + "fonts/",
			}));
			sent.current = { build: buildKey, data: dataKey };
		}
		else if (sent.current.data !== dataKey) {
			target.injectJavaScript(call("data", current.data));
			sent.current.data = dataKey;
		}
	}, [loaded, libraryUrl, buildKey, dataKey]);

	function report(message: string): void {
		const callback = latest.current.onError;
		if (callback) {
			callback(message);
		}
		else {
			console.warn("AmChart: " + message);
		}
	}

	const onMessage = useCallback((event: WebViewMessageEvent) => {
		let message: Message;
		try {
			message = JSON.parse(event.nativeEvent.data);
		}
		catch (error) {
			return;
		}

		const current = latest.current;

		if (message.type === "loaded") {
			sent.current = {};
			ready.current = false;
			setLoaded({ url: currentUrl.current });
		}
		else if (message.type === "ready") {
			ready.current = true;
			const target = webView.current;
			queue.current.splice(0).forEach((code) => {
				if (target) {
					target.injectJavaScript(call("run", code));
				}
			});
			if (current.onReady) {
				current.onReady();
			}
		}
		else if (message.type === "error") {
			report(message.message || "");
		}
		else if (message.type === "message") {
			if (current.onMessage) {
				current.onMessage(message.name || "", message.value);
			}
		}
	}, []);

	// Links in the chart (its logo, a data item's url) open in the browser
	// instead of replacing the chart. Until the page has loaded, it may load
	const onShouldStartLoadWithRequest = useCallback((request: { url: string, isTopFrame?: boolean }) => {
		const page = shown.current;
		if (!page || page.url !== currentUrl.current || request.isTopFrame === false || request.url === "about:blank") {
			return true;
		}
		if (/^(https?|mailto|tel):/i.test(request.url)) {
			Linking.openURL(request.url).catch(() => undefined);
		}
		return false;
	}, []);

	const restart = useCallback(() => {
		ready.current = false;
		setLoaded(undefined);
		setPage((count) => count + 1);
	}, []);

	useImperativeHandle(ref, () => ({
		run(code: string) {
			if (ready.current && webView.current) {
				webView.current.injectJavaScript(call("run", code));
			}
			else {
				queue.current.push(code);
			}
		},
	}), []);

	// A new base URL loads the page again
	const source = useMemo(() => ({ html: pageHtml, baseUrl: libraryUrl }), [libraryUrl]);

	return createElement(View, { style: hasHeight(props.style) ? props.style : [{ height: 400 }, props.style] },
		createElement(WebView, {
			originWhitelist: ["*"],
			scrollEnabled: false,
			bounces: false,
			overScrollMode: "never",
			showsHorizontalScrollIndicator: false,
			showsVerticalScrollIndicator: false,
			setSupportMultipleWindows: false,
			textZoom: 100,
			...props.webViewProps,
			key: page,
			ref: webView,
			source: source,
			style: [webViewStyle, props.webViewProps ? props.webViewProps.style : undefined],
			onMessage: onMessage,
			onShouldStartLoadWithRequest: onShouldStartLoadWithRequest,
			onContentProcessDidTerminate: restart,
			onRenderProcessGone: restart,
		}),
	);
});

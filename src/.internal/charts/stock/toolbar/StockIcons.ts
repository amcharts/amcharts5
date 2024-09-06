export interface StockIcon {
	viewbox: string;
	path: string;
	style?: string;
}

/**
 * A collection of icons used in [[StockChart]].
 */
export class StockIcons {
	public static icons: { [index: string]: StockIcon } = {
		// Misc
		"Default": { viewbox: "0 0 50 50", path: "M 25 10 L 25 40 M 10 25 L 41 25" },
		"Indicator": { viewbox: "0 0 50 50", path: "M 2 10 C 28 27 31 1 48 11 M 1 49 C 24 22 25 38 48 44 M 3 25 L 48 25 L 41 19 M 48 25 L 41 31" },
		"Color": { viewbox: "0 0 50 50", path: "" },
		"Dash": { viewbox: "0 0 60 16", path: "M0,8 60,8" },

		"Calendar": { viewbox: "0 0 50 50", path: "M 3 8 L 47 8 L 47 48 L 3 48 L 3 8 M 3 19 L 47 19 M 9 28 L 15 28 M 22 28 L 28 28 M 35 28 L 41 28 M 9 39 L 15 39 M 22 39 L 28 39 M 35 39 L 41 39 M 12 14 L 12 1 M 38 14 L 38 1" },
		"Period": { viewbox: "0 0 50 50", path: "M 3 3 L 47 3 L 47 48 L 3 48 L 3 3 M 3 12 L 47 12 M 9 21 L 15 21 M 22 21 L 28 21 M 35 21 L 41 21 M 9 30 L 15 30 M 22 30 L 28 30 M 35 30 L 41 30 M 9 39 L 15 39 M 22 39 L 28 39 M 35 39 L 41 39" },
		"Interval": { viewbox: "0 0 50 50", path: "M 3 10 L 3 48 M 3 10 L 43 10 M 13 10 L 13 36 M 23 10 L 23 36 M 43 10 L 43 48 M 33 10 L 33 36" },
		"Comparison": { viewbox: "0 0 50 50", path: "M 25 10 L 25 40 M 10 25 L 41 25" },
		"Settings": { viewbox: "0 0 50 50", path: "M49,25 L47.6,33.2 L41.3,32.6 L39.7,35.3 L43.4,40.4 L37,45.8 L32.6,41.3 L29.7,42.4 L29.2,48.6 L20.8,48.6 L20.3,42.4 L17.4,41.3 L13,45.8 L6.6,40.4 L10.3,35.3 L8.7,32.6 L2.4,33.2 L1,25 L7.1,23.4 L7.6,20.3 L2.4,16.8 L6.6,9.6 L12.3,12.3 L14.7,10.3 L13,4.2 L20.8,1.4 L23.4,7.1 L26.6,7.1 L29.2,1.4 L37,4.2 L35.3,10.3 L37.7,12.3 L43.4,9.6 L47.6,16.8 L42.4,20.3 L42.9,23.4 L49,25 M 17 25 A 1 1 0 0 0 33 25 A 1 1 0 0 0 17 25" },
		"Save": { viewbox: "0 0 50 50", path: "M47 47 47 15 35 3 3 3 3 47 47 47ZM13 3 13 13 33 13 33 3M9 42 9 25 39 25 39 42 9 42" },

		// Chart types
		"Line Series": { viewbox: "0 0 50 50", path: "M 3 28 L 14 18 L 25 32 L 36 9 L 47 19" },
		"Area Series": { viewbox: "0 0 50 50", path: "M 3 20 L 14 13 L 25 20.95 L 37 9 L 48 16 L 48 48 M 8 17 L 8 48 M 13 14 L 13 48 M 18 16 L 18 48 M 23 20 L 23 48 M 28 18 L 28 48 M 33 13 L 33 48 M 38 10 L 38 48 M 43 13 L 43 48 M 3 20 L 3 48" },
		"Candlestick Series": { viewbox: "0 0 50 50", path: "M 3 17 L 3 37 L 19 37 M 19 37 L 19 17 L 3 17 M 11 17 L 11 6 M 11 37 L 11 50 M 30 11 L 30 31 L 46 31 L 46 11 L 30 11 M 38 11 L 38 0 M 38 31 L 38 44 M 3 22 L 19 22 M 3 27 L 19 27 M 3 32 L 19 32 M 30 16 L 46 16 M 30 21 L 46 21 M 30 26 L 46 26" },
		"Pro Candlestick Series": { viewbox: "0 0 50 50", path: "M 3 10 L 3 31 L 19 31 M 19 31 L 19 10 L 3 10 M 11 10 L 11 0 M 11 31 L 11 43 M 30 17 L 30 37 L 46 37 L 46 17 L 30 17 M 38 17 L 38 4 M 38 37 L 38 50 M 30 22 L 46 22 M 30 27 L 46 27 M 30 32 L 46 32" },
		"OHLC Series": { viewbox: "0 0 50 50", path: "M 11 31 L 20 31 M 11 3 L 11 43 M 38 5 L 38 50 M 29 36 L 38 36 M 38 12 L 47 12 M 11 17 L 2 17" },

		// Drawing tools
		"Draw": { viewbox: "0 0 50 50", path: "M 29 2 L 48 21 L 22 47 L 3 47 L 3 28 L 29 2 M 23 8 L 42 27 M 3 42 L 8 47 M 18 39 L 36 21 M 11 32 L 29 14 M 3 28 L 11 32 L 13 38 L 18 39 L 22 47 M 25 6 L 44 25 M 27 4 L 46 23 M 3 44 L 6 47 M 3 40 L 10 47" },
		"Average": { viewbox: "0 0 50 50", path: "M2 24a5 5 0 1 0 10 0 5 5 0 1 0-10 0M12 24h26M38 24a5 5 0 1 0 10 0 5 5 0 1 0-10 0" },
		"Callout": { viewbox: "0 0 50 50", path: "M 3 3 L 47 3 L 47 39 L 31 39 L 25 45 L 19 39 L 3 39 L 3 3 M 11 12 L 39 12 M 11 20 L 39 20 M 11 28 L 39 28" },
		"Doodle": { viewbox: "0 0 48 48", path: "M 43.036,2.509 C 32.59,9.83 8.05,6.67 6.29,15.01 5.19,26.29 34.40,18.9 37.4,27.5 c 1.4,3.78 -4.0,8 -15.7,13.18" },
		"Ellipse": { viewbox: "0 0 50 50", path: "M 25 5 a 22 20 0 1 0 1 0 z" },
		"Fibonacci": { viewbox: "0 0 50 50", path: "M2 3 h46 M2 11.5 h46 M2 24 h46 M2 49 h46" },
		"Fibonacci Timezone": { viewbox: "0 0 50 50", path: "M5 2.5 v46 M13.5 2.5 v46 M26 2.5 v46 M46.5 2.5 v46" },
		"Horizontal Line": { viewbox: "0 0 50 50", path: "M20 24a5 5 0 1 0 10 0 5 5 0 1 0-10 0M2 24h18 M32,24 h18" },
		"Horizontal Ray": { viewbox: "0 0 50 50", path: "M2 24a5 5 0 1 0 10 0 5 5 0 1 0-10 0 M14,24 h36" },
		"Arrows &amp; Icons": { viewbox: "0 0 50 50", path: "M 5 35 L 5 15 L 26 15 M 26 15 L 26 5 L 45 26 L 26 45 L 26 35 L 5 35" },
		"Label": { viewbox: "0 0 50 50", path: "M 10 45 l 15 -32 l 15 32 m -24 -13 l 18 0", style: "stroke-width: 1.2px" },
		"Line": { viewbox: "0 0 50 50", path: "M 4 46 L 46 4" },
		"Line Arrow": { viewbox: "0 0 50 50", path: "M 4 46 L 46 4 M 30 4 L 46 4 L 46 20" },
		"Polyline": { viewbox: "0 0 50 50", path: "M 2 15 L 16 42 L 36 22 L 48 29" },
		"Polyfill": { viewbox: "0 0 50 50", path: "M 2 15 L 8 44 L 20 26 L 41 32 L 47 13 L 24 4 L 2 15" },
		"Quadrant Line": { viewbox: "0 0 50 50", path: "M2 3 h46 M2 15 h46 M2 29 h46 M2 43 h46" },
		"Rectangle": { viewbox: "0 0 50 50", path: "M3 3 L47 3 L47 47 L3 47 L3 3" },
		"Regression": { viewbox: "0 0 50 50", path: "M 2 15 a 5 5 0 1 0 10 0 a 5 5 0 1 0 -10 0 M 11.36 17.369 L 38.661 32.505 M 38 35 a 5 5 0 1 0 10 0 a 5 5 0 1 0 -10 0" },
		"Trend Line": { viewbox: "0 0 50 50", path: "M 2 35 a 5 5 0 1 0 10 0 a 5 5 0 1 0 -10 0 M 11.343 32.542 L 38.614 17.398 M 38 15 a 5 5 0 1 0 10 0 a 5 5 0 1 0 -10 0" },
		"Triangle": { viewbox: "0 0 50 50", path: "M 2 15 L 22 47 L 48 20 L 2 15" },
		"Vertical Line": { viewbox: "0 0 50 50", path: "M19 25a5 5 0 1 0 10 0 5 5 0 1 0-10 0M24 2v18 M24,32 v18" },
		"Parallel Channel": { viewbox: "0 0 50 50", path: "M 3 37 L 37 3 M 13 47 L 47 13" },

		"Eraser": { viewbox: "0 0 50 50", path: "M 13 48 L 21 48 L 45 24 L 29 8 L 1 36 L 13 48 M 32 48 L 38 48 M 43 48 L 49 48 M 23 14 L 39 30 M 20 17 L 36 33 M 26 11 L 42 27" },
		"Select": { viewbox: "0 0 50 50", path: "M 8 6 L 35 18 L 24 25 L 38 43 L 33 47 L 20 28 L 11 36 L 8 6" },
		"Clear": { viewbox: "0 0 50 50", path: "M 6 10 L 12 48 L 38 48 L 44 10 L 6 10 M 14 14 L 18 43 M 25 14 L 25 43 M 36 14 L 32 43 M 6 8 L 44 8 M 21 8 L 21 3 L 30 3 L 30 8" },
		"Bold": { viewbox: "0 0 50 50", path: "M 12 4 L 12 47 L 32 47 C 45 47 47 23 32 23 C 42 23 42 4 31 4 L 12 4 Z M 32 23 L 12 23 Z", style: "stroke-width: 1.8px" },
		"Italic": { viewbox: "0 0 50 50", path: "M 17 5 L 38 5 M 27 5 L 18 47 M 8 47 L 28 47" },
		"Show Extension": { viewbox: "0 0 50 50", path: "M 10 15 a 5 5 0 1 0 10 0 a 5 5 0 1 0 -10 0 M 30 36 a 5 5 0 1 0 10 0 a 5 5 0 1 0 -10 0 M 40 41 L 50 50 M 20 20 L 30 30 M 10 10 L 0 0" },
		"Snap": { viewbox: "0 0 50 50", path: "M 17 29 L 29 29 M 33 39 a 5 5 0 1 0 15 0 a 5 5 0 1 0 -15 0 M 29 17 L 29 29 L 3 3" },
		"Reset": { viewbox: "0 0 50 50", path: "M 4 25 A 1 1 0 0 0 46 25 Q 46 4 25 4 Q 18 4 11 10 L 5 4 L 5 16 L 17 16 L 11 10" },
		"Search": { viewbox: "0 0 50 50", path: "M 5 11 A 1 1 90 0 0 36 27 A 1 1 90 0 0 5 11 M 34 30 L 49 45 L 47 47 L 32 32" },
		"Measure": { viewbox: "0 0 50 50", path: "M 3 38 L 35 6 L 46 17 L 14 49 L 3 38 M 10 31 L 16 37 M 16 25 L 20 29 M 22 19 L 26 23 M 28 13 L 34 19 M 50 50" }
	};

	public static getIcon(id: string): SVGElement {
		const icons: any = StockIcons.icons;
		const icon: any = icons[id] || icons["Default"];
		return StockIcons._getSVG(icon);
	}

	public static _getSVG(icon: any): SVGElement {
		const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		svg.setAttribute("viewBox", icon.viewbox);
		svg.setAttribute("class", "am5stock_control_default_icon");

		const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
		path.setAttribute("d", icon.path);
		svg.appendChild(path);

		if (icon.style) {
			path.setAttribute("style", icon.style);
		}
		return svg;
	}
}
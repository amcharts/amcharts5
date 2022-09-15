/**
 * amCharts 5 locale
 * 
 * Locale: en_US
 * Language: U.S. English
 *
 * Follow instructions in [on this page](https://www.amcharts.com/docs/v5/concepts/locales/creating-translations/) to make corrections or add new translations.
 */
export default {
	// number formatter related
	"_decimalSeparator": ".",
	"_thousandSeparator": ",",

	// Position of the percent sign in numbers
	"_percentPrefix": null,
	"_percentSuffix": "%",

	// Default date formats for various periods
	"_date_millisecond": "mm:ss SSS",
	"_date_millisecond_full": "HH:mm:ss SSS",
	"_date_second": "hh:mm:ss a",
	"_date_second_full": "hh:mm:ss a",
	"_date_minute": "hh:mm a",
	"_date_minute_full": "hh:mm a - MMM dd, yyyy",
	"_date_hour": "hh:mm a",
	"_date_hour_full": "hh:mm a - MMM dd, yyyy",
	"_date_day": "MMM dd",
	"_date_day_full": "MMM dd, yyyy",
	"_date_week": "ww",
	"_date_week_full": "MMM dd, yyyy",
	"_date_month": "MMM",
	"_date_month_full": "MMM, yyyy",
	"_date_year": "yyyy",

	// Default duration formats for various base units
	"_duration_millisecond": "SSS",
	"_duration_second": "ss",
	"_duration_minute": "mm",
	"_duration_hour": "hh",
	"_duration_day": "dd",
	"_duration_week": "ww",
	"_duration_month": "MM",
	"_duration_year": "yyyy",

	// Era
	"_era_ad": "AD",
	"_era_bc": "BC",

	// Period
	"A": "",
	"P": "",
	"AM": "",
	"PM": "",
	"A.M.": "",
	"P.M.": "",

	// Dates
	"January": "",
	"February": "",
	"March": "",
	"April": "",
	"May": "",
	"June": "",
	"July": "",
	"August": "",
	"September": "",
	"October": "",
	"November": "",
	"December": "",
	"Jan": "",
	"Feb": "",
	"Mar": "",
	"Apr": "",
	"May(short)": "May",
	"Jun": "",
	"Jul": "",
	"Aug": "",
	"Sep": "",
	"Oct": "",
	"Nov": "",
	"Dec": "",
	"Sunday": "",
	"Monday": "",
	"Tuesday": "",
	"Wednesday": "",
	"Thursday": "",
	"Friday": "",
	"Saturday": "",
	"Sun": "",
	"Mon": "",
	"Tue": "",
	"Wed": "",
	"Thu": "",
	"Fri": "",
	"Sat": "",

	// ordinal function
	"_dateOrd": function(day: number): string {
		let res = "th";
		if ((day < 11) || (day > 13)) {
			switch (day % 10) {
				case 1:
					res = "st";
					break;
				case 2:
					res = "nd";
					break;
				case 3:
					res = "rd"
					break;
			}
		}
		return res;
	},

	// Chart elements
	"Play": "",
	"Stop": "",
	"Zoom Out": "",
	"Legend": "",
	"Press ENTER to toggle": "",
	"Loading": "",
	"Home": "",

	// Chart types
	"Chart": "",
	"Serial chart": "",
	"X/Y chart": "",
	"Pie chart": "",
	"Gauge chart": "",
	"Radar chart": "",
	"Sankey diagram": "",
	"Chord diagram": "",
	"Flow diagram": "",
	"TreeMap chart": "",

	// Series types
	"Series": "",
	"Candlestick Series": "",
	"Column Series": "",
	"Line Series": "",
	"Pie Slice Series": "",
	"X/Y Series": "",

	// Map-related
	"Map": "",
	"Press ENTER to zoom in": "",
	"Press ENTER to zoom out": "",
	"Use arrow keys to zoom in and out": "",
	"Use plus and minus keys on your keyboard to zoom in and out": "",

	// Export-related
	"Export": "",
	"Image": "",
	"Data": "",
	"Print": "",
	"Press ENTER to open": "",
	"Press ENTER to print.": "",
	"Press ENTER to export as %1.": "",
	"(Press ESC to close this message)": "",
	"Image Export Complete": "",
	"Export operation took longer than expected. Something might have gone wrong.": "",
	"Saved from": "",
	"PNG": "",
	"JPG": "",
	"GIF": "",
	"SVG": "",
	"PDF": "",
	"JSON": "",
	"CSV": "",
	"XLSX": "",
	"HTML": "",

	// Scrollbar-related
	"Use TAB to select grip buttons or left and right arrows to change selection": "",
	"Use left and right arrows to move selection": "",
	"Use left and right arrows to move left selection": "",
	"Use left and right arrows to move right selection": "",
	"Use TAB select grip buttons or up and down arrows to change selection": "",
	"Use up and down arrows to move selection": "",
	"Use up and down arrows to move lower selection": "",
	"Use up and down arrows to move upper selection": "",
	"From %1 to %2": "",
	"From %1": "",
	"To %1": "",

	// Data loader-related
	"No parser available for file: %1": "",
	"Error parsing file: %1": "",
	"Unable to load file: %1": "",
	"Invalid date": "",
};

/**
 * amCharts 5 locale
 * 
 * Locale: bg_BG
 * Language: Bulgarian
 * Author: Bjorn Svensson
 *
 * Follow instructions in [on this page](https://www.amcharts.com/docs/v5/tutorials/creating-translations/) to make corrections or add new translations.
 *
 * ---
 * Edit but leave the header section above this line. You can remove any
 * subsequent comment sections.
 * ---
 *
 * Empty string means no translation, so default "International English"
 * will be used.
 *
 * If you need the translation to literally be an empty string, use `null`
 * instead.
 */
export default {
	"firstDayOfWeek": 1,

	"_decimalSeparator": ",",
	"_thousandSeparator": " ",

	"_percentPrefix": null,
	"_percentSuffix": "%",

	"_big_number_suffix_3": "k",
	"_big_number_suffix_6": "M",
	"_big_number_suffix_9": "G",
	"_big_number_suffix_12": "T",
	"_big_number_suffix_15": "P",
	"_big_number_suffix_18": "E",
	"_big_number_suffix_21": "Z",
	"_big_number_suffix_24": "Y",

	"_small_number_suffix_3": "m",
	"_small_number_suffix_6": "μ",
	"_small_number_suffix_9": "n",
	"_small_number_suffix_12": "p",
	"_small_number_suffix_15": "f",
	"_small_number_suffix_18": "a",
	"_small_number_suffix_21": "z",
	"_small_number_suffix_24": "y",

	"_byte_suffix_B": "B",
	"_byte_suffix_KB": "KB",
	"_byte_suffix_MB": "MB",
	"_byte_suffix_GB": "GB",
	"_byte_suffix_TB": "TB",
	"_byte_suffix_PB": "PB",

	"_date": "yyyy-MM-dd",
	"_date_millisecond": "mm:ss SSS",
	"_date_millisecond_full": "HH:mm:ss SSS",
	"_date_second": "HH:mm:ss",
	"_date_second_full": "HH:mm:ss",
	"_date_minute": "HH:mm",
	"_date_minute_full": "HH:mm - MMM dd, yyyy",
	"_date_hour": "HH:mm",
	"_date_hour_full": "HH:mm - MMM dd, yyyy",
	"_date_day": "MMM dd",
	"_date_day_full": "MMM dd, yyyy",
	"_date_week": "ww",
	"_date_week_full": "MMM dd, yyyy",
	"_date_month": "MMM",
	"_date_month_full": "MMM, yyyy",
	"_date_year": "yyyy",

	"_duration_millisecond": "SSS",
	"_duration_millisecond_second": "ss.SSS",
	"_duration_millisecond_minute": "mm:ss SSS",
	"_duration_millisecond_hour": "hh:mm:ss SSS",
	"_duration_millisecond_day": "d'd' mm:ss SSS",
	"_duration_millisecond_week": "d'd' mm:ss SSS",
	"_duration_millisecond_month": "M'm' dd'd' mm:ss SSS",
	"_duration_millisecond_year": "y'y' MM'm' dd'd' mm:ss SSS",

	"_duration_second": "ss",
	"_duration_second_minute": "mm:ss",
	"_duration_second_hour": "hh:mm:ss",
	"_duration_second_day": "d'd' hh:mm:ss",
	"_duration_second_week": "d'd' hh:mm:ss",
	"_duration_second_month": "M'm' dd'd' hh:mm:ss",
	"_duration_second_year": "y'y' MM'm' dd'd' hh:mm:ss",

	"_duration_minute": "mm",
	"_duration_minute_hour": "hh:mm",
	"_duration_minute_day": "d'd' hh:mm",
	"_duration_minute_week": "d'd' hh:mm",
	"_duration_minute_month": "M'm' dd'd' hh:mm",
	"_duration_minute_year": "y'y' MM'm' dd'd' hh:mm",

	"_duration_hour": "hh'h'",
	"_duration_hour_day": "d'd' hh'h'",
	"_duration_hour_week": "d'd' hh'h'",
	"_duration_hour_month": "M'm' dd'd' hh'h'",
	"_duration_hour_year": "y'y' MM'm' dd'd' hh'h'",

	"_duration_day": "d'd'",
	"_duration_day_week": "d'd'",
	"_duration_day_month": "M'm' dd'd'",
	"_duration_day_year": "y'y' MM'm' dd'd'",

	"_duration_week": "w'w'",
	"_duration_week_month": "w'w'",
	"_duration_week_year": "w'w'",

	"_duration_month": "M'm'",
	"_duration_month_year": "y'y' MM'm'",

	"_duration_year": "y'y'",

	"_era_ad": "AD",
	"_era_bc": "BC",

	"A": "",
	"P": "",
	"AM": "",
	"PM": "",
	"A.M.": "",
	"P.M.": "",

	// Months -- from intl "long" and "short"
	"January": "януари",
	"February": "февруари",
	"March": "март",
	"April": "април",
	"May": "май",
	"June": "юни",
	"July": "юли",
	"August": "август",
	"September": "септември",
	"October": "октомври",
	"November": "ноември",
	"December": "декември",
	"Jan": "януари",
	"Feb": "февруари",
	"Mar": "март",
	"Apr": "април",
	"May (short)": "май",
	"Jun": "юни",
	"Jul": "юли",
	"Aug": "август",
	"Sep": "септември",
	"Oct": "октомври",
	"Nov": "ноември",
	"Dec": "декември",

	// Weekdays -- from intl "long" and "short"
	"Sunday": "неделя",
	"Monday": "понеделник",
	"Tuesday": "вторник",
	"Wednesday": "сряда",
	"Thursday": "четвъртък",
	"Friday": "петък",
	"Saturday": "събота",
	"Sun": "нд",
	"Mon": "пн",
	"Tues": "вт",
	"Wed": "ср",
	"Thu": "чт",
	"Fri": "пт",
	"Sat": "сб",

	// Date ordinal function.
	// 
	// This is used when adding number ordinal when formatting days in dates.
	// 
	// E.g. "January 1st", "February 2nd".
	// 
	// The function accepts day number, and returns a string to be added to the
	// day, like in default English translation, if we pass in 2, we will receive
	// "nd" back.
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

	// Various chart controls.
	// Shown as a tooltip on zoom out button.
	"Zoom Out": "Отдалечаване",

	// Timeline buttons
	"Play": "",
	"Stop": "",

	// Chart's Legend screen reader title.
	"Legend": "",

	// Legend's item screen reader indicator.
	"Press ENTER to toggle": "",

	// Shown when the chart is busy loading something.
	"Loading": "",

	// Shown as the first button in the breadcrumb navigation, e.g.:
	// Home > First level > ...
	"Home": "",

	// Chart types.
	// Those are used as default screen reader titles for the main chart element
	// unless developer has set some more descriptive title.
	"Chart": "",
	"Serial chart": "",
	"X/Y chart": "",
	"Pie chart": "",
	"Gauge chart": "",
	"Radar chart": "",
	"Sankey diagram": "",
	"Flow diagram": "",
	"Chord diagram": "",
	"TreeMap chart": "",
	"Force directed tree": "",
	"Sliced chart": "",

	// Series types.
	// Used to name series by type for screen readers if they do not have their
	// name set.
	"Series": "",
	"Candlestick Series": "",
	"OHLC Series": "",
	"Column Series": "",
	"Line Series": "",
	"Pie Slice Series": "",
	"Funnel Series": "",
	"Pyramid Series": "",
	"X/Y Series": "",

	// Map-related stuff.
	"Map": "",
	"Press ENTER to zoom in": "",
	"Press ENTER to zoom out": "",
	"Use arrow keys to zoom in and out": "",
	"Use plus and minus keys on your keyboard to zoom in and out": "",

	// Export-related stuff.
	// These prompts are used in Export menu labels.
	// 
	// "Export" is the top-level menu item.
	// 
	// "Image", "Data", "Print" as second-level indicating type of export
	// operation.
	// 
	// Leave actual format untranslated, unless you absolutely know that they
	// would convey more meaning in some other way.
	"Export": "",
	"Image": "",
	"Data": "",
	"Print": "",
	"Press ENTER or use arrow keys to navigate": "",
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

	// Scrollbar-related stuff.
	// 
	// Scrollbar is a control which can zoom and pan the axes on the chart.
	// 
	// Each scrollbar has two grips: left or right (for horizontal scrollbar) or
	// upper and lower (for vertical one).
	// 
	// Prompts change in relation to whether Scrollbar is vertical or horizontal.
	// 
	// The final section is used to indicate the current range of selection.
	"Use TAB to select grip buttons or left and right arrows to change selection": "",
	"Use left and right arrows to move selection": "",
	"Use left and right arrows to move left selection": "",
	"Use left and right arrows to move right selection": "",
	"Use TAB select grip buttons or up and down arrows to change selection": "",
	"Use up and down arrows to move selection": "",
	"Use up and down arrows to move lower selection": "",
	"Use up and down arrows to move upper selection": "",
	"From %1 to %2": "От %1 до %2",
	"From %1": "От %1",
	"To %1": "До %1",

	// Data loader-related.
	"No parser available for file: %1": "",
	"Error parsing file: %1": "",
	"Unable to load file: %1": "",
	"Invalid date": "",

	// Common actions
	"Close": "",
	"Minimize": ""

};
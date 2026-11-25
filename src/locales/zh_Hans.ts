/**
 * amCharts 5 locale
 *
 * Locale: zh_Hans
 * Language: Simplified Chinese
 * Author: Bjorn Svensson
 *
 * Follow instructions in [on this page](https://docs.amcharts.com/v5/concepts/locales/creating-translations/) to make corrections or add new translations.
 *
 * ---
 * Edit but leave the header section above this line. You can remove any
 * subsequent comment sections.
 * ---
 *
 * Use this file as a template to create translations. Leave the key part in
 * English intact. Fill the value with a translation.
 *
 * Empty string means no translation, so default "International English"
 * will be used.
 *
 * If you need the translation to literally be an empty string, use `null`
 * instead.
 *
 * IMPORTANT:
 * When translating make good effort to keep the translation length
 * at least the same chartcount as the English, especially for short prompts.
 *
 * Having significantly longer prompts may distort the actual charts.
 *
 * NOTE:
 * Some prompts - like months or weekdays - come in two versions: full and
 * shortened.
 *
 * If there's no official shortened version of these in your language, and it
 * would not be possible to invent such short versions that don't seem weird
 * to native speakers of that language, fill those with the same as full
 * version.
 *
 * PLACEHOLDERS:
 * Some prompts have placeholders like "%1". Those will be replaced by actual
 * values during translation and should be retained in the translated prompts.
 *
 * Placeholder positions may be changed to better suit structure of the
 * sentence.
 *
 * For example "From %1 to %2", when actually used will replace "%1" with an
 * actual value representing range start, and "%2" will be replaced by end
 * value.
 *
 * E.g. in a Scrollbar for Value axis "From %1 to %2" will become
 * "From 100 to 200". You may translate "From" and "to", as well as re-arrange
 * the order of the prompt itself, but make sure the "%1" and "%2" remain, in
 * places where they will make sense.
 *
 * Save the file as language_LOCALE, i.e. `en_GB.ts`, `fr_FR.ts`, etc.
 */
export default {
	// Number formatting options.
	//
	// Please check with the local standards which separator is accepted to be
	// used for separating decimals, and which for thousands.
	"_decimalSeparator": ".",
	"_thousandSeparator": ",",

	// Position of the percent sign in numbers
	"_percentPrefix": null,
	"_percentSuffix": "%",

	// Suffixes for numbers
	// When formatting numbers, big or small numers might be reformatted to
	// shorter version, by applying a suffix.
	//
	// For example, 1000000 might become "1m".
	// Or 1024 might become "1KB" if we're formatting byte numbers.
	//
	// This section defines such suffixes for all such cases.
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

	// Default date formats for various periods.
	//
	// This should reflect official or de facto formatting universally accepted
	// in the country translation is being made for
	// Available format codes here:
	// https://docs.amcharts.com/v5/concepts/formatters/formatting-dates/#format-codes
	//
	// This will be used when formatting date/time for particular granularity,
	// e.g. "_date_hour" will be shown whenever we need to show time as hours.
	"_date_millisecond": "mm:ss SSS",
	"_date_millisecond_full": "HH:mm:ss SSS",
	"_date_second": "HH:mm:ss",
	"_date_second_full": "HH:mm:ss",
	"_date_minute": "HH:mm",
	"_date_minute_full": "HH:mm - MMM dd, yyyy",
	"_date_hour": "HH:mm",
	"_date_hour_short": "HH",
	"_date_hour_full": "HH:mm - MMM dd, yyyy",
	"_date_day": "MMM dd",
	"_date_day_full": "MMM dd, yyyy",
	"_date_week": "ww",
	"_date_week_full": "MMM dd, yyyy",
	"_date_month": "MMM",
	"_date_month_full": "MMM, yyyy",
	"_date_year": "yyyy",

	// Default duration formats for various base units.
	//
	// This will be used by DurationFormatter to format numeric values into
	// duration.
	//
	// Notice how each duration unit comes in several versions. This is to ensure
	// that each base unit is shown correctly.
	//
	// For example, if we have baseUnit set to "second", meaning our duration is
	// in seconds.
	//
	// If we pass in `50` to formatter, it will know that we have just 50 seconds
	// (less than a minute) so it will use format in `"_duration_second"` ("ss"),
	// and the formatted result will be in like `"50"`.
	//
	// If we pass in `70`, which is more than a minute, the formatter will switch
	// to `"_duration_second_minute"` ("mm:ss"), resulting in "01:10" formatted
	// text.

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

	// Era translations
	"_era_ad": "公元",
	"_era_bc": "公元前",

	// Day part, used in 12-hour formats, e.g. 5 P.M.
	// Please note that these come in 3 variants:
	// * one letter (e.g. "A")
	// * two letters (e.g. "AM")
	// * two letters with dots (e.g. "A.M.")
	//
	// All three need to to be translated even if they are all the same. Some
	// users might use one, some the other.
	"A": "上午",
	"P": "下午",
	"AM": "上午",
	"PM": "下午",
	"A.M.": "上午",
	"P.M.": "下午",

	// Date-related stuff.
	//
	// When translating months, if there's a difference, use the form which is
	// best for a full date, e.g. as you would use it in "2018 January 1".
	//
	// Note that May is listed twice. This is because in English May is the same
	// in both long and short forms, while in other languages it may not be the
	// case. Translate "May" to full word, while "May(short)" to shortened
	// version.
	//
	// Should month names and weekdays be capitalized or not?
	//
	// Rule of thumb is this: if the names should always be capitalized,
	// regardless of name position within date ("January", "21st January 2018",
	// etc.) use capitalized names. Otherwise enter all lowercase.
	//
	// The date formatter will automatically capitalize names if they are the
	// first (or only) word in resulting date.
	"January": "一月",
	"February": "二月",
	"March": "三月",
	"April": "四月",
	"May": "五月",
	"June": "六月",
	"July": "七月",
	"August": "八月",
	"September": "九月",
	"October": "十月",
	"November": "十一月",
	"December": "十二月",
	"Jan": "1月",
	"Feb": "2月",
	"Mar": "3月",
	"Apr": "4月",
	"May(short)": "5月",
	"Jun": "6月",
	"Jul": "7月",
	"Aug": "8月",
	"Sep": "9月",
	"Oct": "10月",
	"Nov": "11月",
	"Dec": "12月",

	// Weekdays.
	"Sunday": "星期日",
	"Monday": "星期一",
	"Tuesday": "星期二",
	"Wednesday": "星期三",
	"Thursday": "星期四",
	"Friday": "星期五",
	"Saturday": "星期六",
	"Sun": "周日",
	"Mon": "周一",
	"Tue": "周二",
	"Wed": "周三",
	"Thu": "周四",
	"Fri": "周五",
	"Sat": "周六",

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
					res = "日";
					break;
				case 2:
					res = "日";
					break;
				case 3:
					res = "日"
					break;
			}
		}
		return res;
	},

	// Various chart controls.
	// Shown as a tooltip on zoom out button.
	"Zoom Out": "缩放",

	// Timeline buttons
	"Play": "播放",
	"Stop": "停止",

	// Chart's Legend screen reader title.
	"Legend": "图例",

	// Legend's item screen reader indicator.
	"Press ENTER to toggle": "按 ENTER 键切换",

	// Shown when the chart is busy loading something.
	"Loading": "加载",

	// Shown as the first button in the breadcrumb navigation, e.g.:
	// Home > First level > ...
	"Home": "主页",

	// Chart types.
	// Those are used as default screen reader titles for the main chart element
	// unless developer has set some more descriptive title.
	"Chart": "图表",
	"Serial chart": "序列图",
	"X/Y chart": "X/Y 图表",
	"Pie chart": "饼图",
	"Gauge chart": "仪表图",
	"Radar chart": "雷达图",
	"Sankey diagram": "桑基图",
	"Flow diagram": "流程图",
	"Chord diagram": "弦图",
	"TreeMap chart": "矩形树图",
	"Force directed tree": "力导向树",
	"Sliced chart": "切片图",

	// Series types.
	// Used to name series by type for screen readers if they do not have their
	// name set.
	"Series": "系列",
	"Candlestick Series": "K线系列",
	"OHLC Series": "OHLC 系列",
	"Column Series": "柱形系列",
	"Line Series": "折线系列",
	"Pie Slice Series": "饼图切片系列",
	"Funnel Series": "漏斗系列",
	"Pyramid Series": "金字塔系列",
	"X/Y Series": "X/Y 系列",

	// Map-related stuff.
	"Map": "地图",
	"Press ENTER to zoom in": "按 ENTER 键放大",
	"Press ENTER to zoom out": "按 ENTER 键缩小",
	"Use arrow keys to zoom in and out": "使用方向键放大和缩小",
	"Use plus and minus keys on your keyboard to zoom in and out": "使用键盘上的加号和减号键放大和缩小",

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
	"Export": "导出",
	"Image": "影像",
	"Data": "数据",
	"Print": "打印",
	"Press ENTER or use arrow keys to navigate": "按 ENTER 键或使用方向键导航",
	"Press ENTER to open": "按 ENTER 键打开",
	"Press ENTER to print.": "按 ENTER 键打印。",
	"Press ENTER to export as %1.": "按 ENTER 键导出为 %1。",
	"(Press ESC to close this message)": "（按 ESC 键关闭此消息）",
	"Image Export Complete": "图像导出完成",
	"Export operation took longer than expected. Something might have gone wrong.": "导出操作耗时超出预期。可能出现了问题。",
	"Saved from": "保存自",
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
	"Use TAB to select grip buttons or left and right arrows to change selection": "使用 TAB 键选择手柄按钮，或使用左右方向键更改选择范围",
	"Use left and right arrows to move selection": "使用左右方向键移动选择范围",
	"Use left and right arrows to move left selection": "使用左右方向键移动左侧选择范围",
	"Use left and right arrows to move right selection": "使用左右方向键移动右侧选择范围",
	"Use TAB select grip buttons or up and down arrows to change selection": "使用 TAB 键选择手柄按钮，或使用上下方向键更改选择范围",
	"Use up and down arrows to move selection": "使用上下方向键移动选择范围",
	"Use up and down arrows to move lower selection": "使用上下方向键移动下方选择范围",
	"Use up and down arrows to move upper selection": "使用上下方向键移动上方选择范围",
	"From %1 to %2": "自 %1 至 %2",
	"From %1": "自 %1",
	"To %1": "至 %1",

	// Data summary for screen readers: how many values a series has, and its
	// highest and lowest one (e.g. "Highest: Mar 3 (210)").
	"Values: %1": "数据个数：%1",
	"Highest: %1": "最高：%1",
	"Lowest: %1": "最低：%1",

	// Data table for screen readers: heading of the column of categories or
	// dates the values are for.
	"Category": "类别",

	// Stock toolbar search, for screen readers: how many items a search found
	"Results: %1": "搜索结果：%1",
	"No results": "无结果",

	// Color picker, for screen readers: its sliders and color field
	"Hue": "色相",
	"Opacity": "不透明度",
	"Color": "颜色",

	// Data loader-related.
	"No parser available for file: %1": "没有可用于文件的解析器：%1",
	"Error parsing file: %1": "解析文件时出错：%1",
	"Unable to load file: %1": "无法加载文件：%1",
	"Invalid date": "无效日期",

	// Common actions
	"Close": "关闭",
	"Minimize": "最小化",
	"Confirm": "确认",
	"OK": "确定",
	"Cancel": "取消",
	"Delete": "删除",
	"Settings": "设置",
	"Expand": "展开",
	"Move Up": "上移",
	"Move Down": "下移"
};

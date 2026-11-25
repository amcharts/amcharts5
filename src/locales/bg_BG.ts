/**
 * amCharts 5 locale
 * 
 * Locale: bg_BG
 * Language: Bulgarian
 * Author: Bjorn Svensson
 *
 * Follow instructions in [on this page](https://docs.amcharts.com/v5/concepts/locales/creating-translations/) to make corrections or add new translations.
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
	"_date_hour_short": "HH",
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

	"A": "пр",
	"P": "сл",
	"AM": "пр.об.",
	"PM": "сл.об.",
	"A.M.": "преди обяд",
	"P.M.": "след обяд",

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
	"May(short)": "май",
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
	"Tue": "вт",
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
	"Play": "Пусни",
	"Stop": "Спри",

	// Chart's Legend screen reader title.
	"Legend": "Легенда",

	// Legend's item screen reader indicator.
	"Press ENTER to toggle": "Натиснете ENTER за превключване",

	// Shown when the chart is busy loading something.
	"Loading": "Зареждане",

	// Shown as the first button in the breadcrumb navigation, e.g.:
	// Home > First level > ...
	"Home": "Начало",

	// Chart types.
	// Those are used as default screen reader titles for the main chart element
	// unless developer has set some more descriptive title.
	"Chart": "Диаграма",
	"Serial chart": "Серийна диаграма",
	"X/Y chart": "Диаграма X/Y",
	"Pie chart": "Кръгова диаграма",
	"Gauge chart": "Диаграма-скала",
	"Radar chart": "Радарна диаграма",
	"Sankey diagram": "Диаграма на Санки",
	"Flow diagram": "Диаграма на потоци",
	"Chord diagram": "Хордова диаграма",
	"TreeMap chart": "Дървовидна карта",
	"Force directed tree": "Силово насочено дърво",
	"Sliced chart": "Секторна диаграма",

	// Series types.
	// Used to name series by type for screen readers if they do not have their
	// name set.
	"Series": "Серия",
	"Candlestick Series": "Серия свещи",
	"OHLC Series": "Серия OHLC",
	"Column Series": "Серия колони",
	"Line Series": "Линейна серия",
	"Pie Slice Series": "Серия сектори",
	"Funnel Series": "Серия фуния",
	"Pyramid Series": "Серия пирамида",
	"X/Y Series": "Серия X/Y",

	// Map-related stuff.
	"Map": "Карта",
	"Press ENTER to zoom in": "Натиснете ENTER за увеличаване",
	"Press ENTER to zoom out": "Натиснете ENTER за отдалечаване",
	"Use arrow keys to zoom in and out": "Използвайте стрелките за увеличаване и отдалечаване",
	"Use plus and minus keys on your keyboard to zoom in and out": "Използвайте клавишите плюс и минус на клавиатурата за увеличаване и отдалечаване",

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
	"Export": "Експорт",
	"Image": "Изображение",
	"Data": "Данни",
	"Print": "Печат",
	"Press ENTER or use arrow keys to navigate": "Натиснете ENTER или използвайте стрелките за навигация",
	"Press ENTER to open": "Натиснете ENTER за отваряне",
	"Press ENTER to print.": "Натиснете ENTER за печат.",
	"Press ENTER to export as %1.": "Натиснете ENTER за експорт като %1.",
	"(Press ESC to close this message)": "(Натиснете ESC, за да затворите това съобщение)",
	"Image Export Complete": "Експортът на изображението завърши",
	"Export operation took longer than expected. Something might have gone wrong.": "Експортът отне повече време от очакваното. Може би нещо се е объркало.",
	"Saved from": "Запазено от",
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
	"Use TAB to select grip buttons or left and right arrows to change selection": "Използвайте TAB, за да изберете плъзгачите, или стрелките наляво и надясно, за да промените селекцията",
	"Use left and right arrows to move selection": "Използвайте стрелките наляво и надясно, за да преместите селекцията",
	"Use left and right arrows to move left selection": "Използвайте стрелките наляво и надясно, за да преместите лявата граница на селекцията",
	"Use left and right arrows to move right selection": "Използвайте стрелките наляво и надясно, за да преместите дясната граница на селекцията",
	"Use TAB select grip buttons or up and down arrows to change selection": "Използвайте TAB, за да изберете плъзгачите, или стрелките нагоре и надолу, за да промените селекцията",
	"Use up and down arrows to move selection": "Използвайте стрелките нагоре и надолу, за да преместите селекцията",
	"Use up and down arrows to move lower selection": "Използвайте стрелките нагоре и надолу, за да преместите долната граница на селекцията",
	"Use up and down arrows to move upper selection": "Използвайте стрелките нагоре и надолу, за да преместите горната граница на селекцията",
	"From %1 to %2": "От %1 до %2",
	"From %1": "От %1",
	"To %1": "До %1",

	// Data summary for screen readers: how many values a series has, and its
	// highest and lowest one (e.g. "Highest: Mar 3 (210)").
	"Values: %1": "Стойности: %1",
	"Highest: %1": "Най-висока: %1",
	"Lowest: %1": "Най-ниска: %1",

	// Data table for screen readers: heading of the column of categories or
	// dates the values are for.
	"Category": "Категория",

	// Stock toolbar search, for screen readers: how many items a search found
	"Results: %1": "Резултати: %1",
	"No results": "Няма резултати",

	// Color picker, for screen readers: its sliders and color field
	"Hue": "Нюанс",
	"Opacity": "Непрозрачност",
	"Color": "Цвят",

	// Data loader-related.
	"No parser available for file: %1": "Няма наличен анализатор за файла: %1",
	"Error parsing file: %1": "Грешка при анализа на файла: %1",
	"Unable to load file: %1": "Файлът не може да бъде зареден: %1",
	"Invalid date": "Невалидна дата",

	// Common actions
	"Close": "Затваряне",
	"Minimize": "Минимизиране",
	"Confirm": "Потвърждаване",
	"OK": "ОК",
	"Cancel": "Отказ",
	"Delete": "Изтриване",
	"Settings": "Настройки",
	"Expand": "Разгъване",
	"Move Up": "Преместване нагоре",
	"Move Down": "Преместване надолу"

};
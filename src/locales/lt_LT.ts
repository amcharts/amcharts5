/**
 * amCharts 5 locale
 * 
 * Locale: lt_LT
 * Language: Lithuanian
 *
 * Follow instructions in [on this page](https://www.amcharts.com/docs/v5/concepts/locales/creating-translations/) to make corrections or add new translations.
 */
export default {
	// number formatter related
	"_decimalSeparator": ",",
	"_thousandSeparator": " ",

	// Position of the percent sign in numbers
	"_percentPrefix": null,
	"_percentSuffix": "%",

	// Default date formats for various periods
	"_date_millisecond": "mm:ss SSS",
	"_date_millisecond_full": "HH:mm:ss SSS",
	"_date_second": "HH:mm:ss",
	"_date_second_full": "HH:mm:ss",
	"_date_minute": "HH:mm",
	"_date_minute_full": "HH:mm - yyyy-MM-dd",
	"_date_hour": "HH:mm",
	"_date_hour_full": "HH:mm - yyyy-MM-dd",
	"_date_day": "MMM dd",
	"_date_day_full": "yyyy-MM-dd",
	"_date_week": "ww",
	"_date_week_full": "yyyy-MM-dd",
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
	"_era_ad": "m.e.",
	"_era_bc": "p.m.e.",

	// Period
	"A": "R",
	"P": "V",
	"AM": "ryto",
	"PM": "vakaro",
	"A.M.": "ryto",
	"P.M.": "vakaro",

	// Dates
	"January": "Sausio",
	"February": "Vasario",
	"March": "Kovo",
	"April": "Balandžio",
	"May": "Gegužės",
	"June": "Birželio",
	"July": "Liepos",
	"August": "Rugpjūčio",
	"September": "Rugsėjo",
	"October": "Spalio",
	"November": "Lapkričio",
	"December": "Gruodžio",
	"Jan": "Sau",
	"Feb": "Vas",
	"Mar": "Kov",
	"Apr": "Bal",
	"May(short)": "Geg",
	"Jun": "Bir",
	"Jul": "Lie",
	"Aug": "Rgp",
	"Sep": "Rgs",
	"Oct": "Spa",
	"Nov": "Lap",
	"Dec": "Gru",
	"Sunday": "sekmadienis",
	"Monday": "pirmadienis",
	"Tuesday": "antradienis",
	"Wednesday": "trečiadienis",
	"Thursday": "ketvirtadienis",
	"Friday": "penktadienis",
	"Saturday": "šeštadienis",
	"Sun": "sekm.",
	"Mon": "pirm.",
	"Tue": "antr.",
	"Wed": "treč.",
	"Thu": "ketv.",
	"Fri": "penk.",
	"Sat": "šešt.",

	// ordinal function
	"_dateOrd": function(_day: number): string {
		return "-a";
	},

	// Chart elements
	"Zoom Out": "Rodyti viską",
	"Play": "Paleisti",
	"Stop": "Sustabdyti",
	"Legend": "Legenda",
	"Press ENTER to toggle": "Spragtelkite, palieskite arba spauskite ENTER, kad perjungtumėte",
	"Loading": "Kraunama",
	"Home": "Pradžia",

	// Chart types
	"Chart": "Grafikas",
	"Serial chart": "Serijinis grafikas",
	"X/Y chart": "X/Y grafikas",
	"Pie chart": "Pyrago tipo grafikas",
	"Gauge chart": "Daviklio tipo grafikas",
	"Radar chart": "Radaro tipo grafikas",
	"Sankey diagram": "Sankey diagrama",
	"Chord diagram": "Chord diagrama",
	"Flow diagram": "Flow diagrama",
	"TreeMap chart": "TreeMap grafikas",

	// Series types
	"Series": "Serija",
	"Candlestick Series": "\"Candlestick\" tipo grafiko serija",
	"Column Series": "Stulpelinio grafiko serija",
	"Line Series": "Linijinio grafiko serija",
	"Pie Slice Series": "Pyrago tipo serija",
	"X/Y Series": "X/Y serija",

	// Map-related
	"Map": "Žemėlapis",
	"Press ENTER to zoom in": "Spauskite ENTER, kad pritrauktumėte vaizdą",
	"Press ENTER to zoom out": "Spauskite ENTER, kad atitolintumėte vaizdą",
	"Use arrow keys to zoom in and out": "Naudokitės royklėmis vaizdo pritraukimui ar atitolinimui",
	"Use plus and minus keys on your keyboard to zoom in and out": "Spauskite pliuso arba minuso klavišus ant klaviatūros, kad pritrautumėte arba atitolintumėte vaizdą",

	// Export-related
	"Export": "Eksportuoti",
	"Image": "Vaizdas",
	"Data": "Duomenys",
	"Print": "Spausdinti",
	"Press ENTER to open": "Spragtelkite arba spauskite ENTER, kad atidarytumėte",
	"Press ENTER to print.": "Spragtelkite arba spauskite ENTER, kad spausdintumėte.",
	"Press ENTER to export as %1.": "Spragtelkite arba spauskite ENTER, kad eksportuotumėte kaip %1.",
	"Image Export Complete": "Paveiksliuko eksportas baigtas",
	"Export operation took longer than expected. Something might have gone wrong.": "Eksportas užtruko ilgiau negu turėtų. Greičiausiai įvyko klaida.",
	"Saved from": "Išsaugota iš",
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
	"Use TAB to select grip buttons or left and right arrows to change selection": "Spauskite TAB klavišą, kad pasirinktumėte žymeklius, arba kairė/dešinė klavišus, kad pakeistumėte pasirinkimą",
	"Use left and right arrows to move selection": "Naudokitės klavišais kairė/dešinė, kad pajudintumėte pasirinkimą",
	"Use left and right arrows to move left selection": "Naudokitės klavišais kairė/dešinė, kad pajudintumėte kairį žymeklį",
	"Use left and right arrows to move right selection": "Naudokitės klavišais kairė/dešinė, kad pajudintumėte dešinį žymeklį",
	"Use TAB select grip buttons or up and down arrows to change selection": "Spauskite TAB klavišą, kad pasirinktumėte žymeklius, arba aukštyn/žemyn klavišus, kad pakeistumėte pasirinkimą",
	"Use up and down arrows to move selection": "Naudokitės klavišais aukštyn/žemyn, kad pajudintumėte pasirinkimą",
	"Use up and down arrows to move lower selection": "Naudokitės klavišais aukštyn/žemyn, kad pajudintumėte apatinį žymeklį",
	"Use up and down arrows to move upper selection": "Naudokitės klavišais aukštyn/žemyn, kad pajudintumėte viršutinį žymeklį",
	"From %1 to %2": "Nuo %1 iki %2",
	"From %1": "Nuo %1",
	"To %1": "Iki %1",

	// Data loader-related
	"No parser available for file: %1": "Failui %1 neturime tinkamo dešifruotojo",
	"Error parsing file: %1": "Skaitant failą %1 įvyko klaida",
	"Unable to load file: %1": "Nepavyko užkrauti failo %1",
	"Invalid date": "Klaidinga data",

};
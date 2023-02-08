import { Entity, IEntitySettings, IEntityPrivate } from "./Entity"
import * as $array from "./Array"
import * as $object from "./Object"
import en from "../../../locales/en";

/**
 * Defines properties that exist for the locale.
 *
 * @ignore
 */
export interface ILocaleSettings {
	"firstDayOfWeek"?: number,

	// number formatter related
	"_decimalSeparator"?: string;
	"_thousandSeparator"?: string;

	"_percentPrefix"?: string | null;
	"_percentSuffix"?: string | null;

	"_big_number_suffix_3"?: string;
	"_big_number_suffix_6"?: string;
	"_big_number_suffix_9"?: string;
	"_big_number_suffix_12"?: string;
	"_big_number_suffix_15"?: string;
	"_big_number_suffix_18"?: string;
	"_big_number_suffix_21"?: string;
	"_big_number_suffix_24"?: string;

	"_small_number_suffix_24"?: string;
	"_small_number_suffix_21"?: string;
	"_small_number_suffix_18"?: string;
	"_small_number_suffix_15"?: string;
	"_small_number_suffix_12"?: string;
	"_small_number_suffix_9"?: string;
	"_small_number_suffix_6"?: string;
	"_small_number_suffix_3"?: string;

	"_byte_suffix_B"?: string;
	"_byte_suffix_KB"?: string;
	"_byte_suffix_MB"?: string;
	"_byte_suffix_GB"?: string;
	"_byte_suffix_TB"?: string;
	"_byte_suffix_PB"?: string;

	// Default date formats for various periods
	"_date"?: string;
	"_date_millisecond"?: string;
	"_date_millisecond_full"?: string;
	"_date_second"?: string;
	"_date_second_full"?: string;
	"_date_minute"?: string;
	"_date_minute_full"?: string;
	"_date_hour"?: string;
	"_date_hour_full"?: string;
	"_date_day"?: string;
	"_date_day_full"?: string;
	"_date_week"?: string;
	"_date_week_full"?: string;
	"_date_month"?: string;
	"_date_month_full"?: string;
	"_date_year"?: string;

	// Default duration formats for various base units
	"_duration_millisecond"?: string;
	"_duration_millisecond_second"?: string;
	"_duration_millisecond_minute"?: string;
	"_duration_millisecond_hour"?: string;
	"_duration_millisecond_day"?: string;
	"_duration_millisecond_week"?: string;
	"_duration_millisecond_month"?: string;
	"_duration_millisecond_year"?: string;

	"_duration_second"?: string;
	"_duration_second_minute"?: string;
	"_duration_second_hour"?: string;
	"_duration_second_day"?: string;
	"_duration_second_week"?: string;
	"_duration_second_month"?: string;
	"_duration_second_year"?: string;

	"_duration_minute"?: string;
	"_duration_minute_hour"?: string;
	"_duration_minute_day"?: string;
	"_duration_minute_week"?: string;
	"_duration_minute_month"?: string;
	"_duration_minute_year"?: string;

	"_duration_hour"?: string;
	"_duration_hour_day"?: string;
	"_duration_hour_week"?: string;
	"_duration_hour_month"?: string;
	"_duration_hour_year"?: string;

	"_duration_day"?: string;
	"_duration_day_week"?: string;
	"_duration_day_month"?: string;
	"_duration_day_year"?: string;

	"_duration_week"?: string;
	"_duration_week_month"?: string;
	"_duration_week_year"?: string;

	"_duration_month"?: string;
	"_duration_month_year"?: string;

	"_duration_year"?: string;

	// Era
	"_era_ad"?: string;
	"_era_bc"?: string;

	// Period
	"A"?: string;
	"P"?: string;
	"AM"?: string;
	"PM"?: string;
	"A.M."?: string;
	"P.M."?: string;

	// Dates
	"January"?: string;
	"February"?: string;
	"March"?: string;
	"April"?: string;
	"May"?: string;
	"June"?: string;
	"July"?: string;
	"August"?: string;
	"September"?: string;
	"October"?: string;
	"November"?: string;
	"December"?: string;
	"Jan"?: string;
	"Feb"?: string;
	"Mar"?: string;
	"Apr"?: string;
	"May(short)"?: string;
	"Jun"?: string;
	"Jul"?: string;
	"Aug"?: string;
	"Sep"?: string;
	"Oct"?: string;
	"Nov"?: string;
	"Dec"?: string;
	"Sunday"?: string;
	"Monday"?: string;
	"Tuesday"?: string;
	"Wednesday"?: string;
	"Thursday"?: string;
	"Friday"?: string;
	"Saturday"?: string;
	"Sun"?: string;
	"Mon"?: string;
	"Tue"?: string;
	"Wed"?: string;
	"Thu"?: string;
	"Fri"?: string;
	"Sat"?: string;

	// Chart elements
	"Zoom Out"?: string;
	"Play"?: string;
	"Stop"?: string;
	"Legend"?: string;
	"Press ENTER to toggle"?: string;
	"Loading"?: string;
	"%1 shown"?: string;
	"%1 hidden"?: string;

	// Chart types
	"Chart"?: string;
	"Serial chart"?: string;
	"X/Y chart"?: string;
	"Pie chart"?: string;
	"Sunburst chart"?: string;
	"Gauge chart"?: string;
	"Radar chart"?: string;
	"Sankey diagram"?: string;
	"Flow diagram"?: string;
	"Chord diagram"?: string;
	"TreeMap chart"?: string;
	"Force directed tree"?: string;
	"Sliced chart"?: string;

	// Series types
	"Series"?: string;
	"Candlestick Series"?: string;
	"OHLC Series"?: string;
	"Column Series"?: string;
	"Line Series"?: string;
	"Pie Slice Series"?: string;
	"Funnel Series"?: string;
	"Pyramid Series"?: string;
	"X/Y Series"?: string;

	// Map-related
	"Map"?: string;
	"Press ENTER to zoom in"?: string;
	"Press ENTER to zoom out"?: string;
	"Use arrow keys to zoom in and out"?: string;
	"Use plus and minus keys on your keyboard to zoom in and out"?: string;
	"Home"?: string;
	"Zoom level changed to %1"?: string;

	// Export-related
	"Export"?: string;
	"Image"?: string;
	"Data"?: string;
	"Print"?: string;
	"Press ENTER or use arrow keys to navigate"?: string;
	"Press ENTER to open"?: string;
	"Press ENTER to print."?: string;
	"Press ENTER to export as %1."?: string;
	"(Press ESC to close this message)"?: string;
	"Image Export Complete"?: string;
	"Export operation took longer than expected. Something might have gone wrong."?: string;
	"Saved from"?: string;
	"PNG"?: string;
	"JPG"?: string;
	"GIF"?: string;
	"SVG"?: string;
	"PDF"?: string;
	"JSON"?: string;
	"CSV"?: string;
	"XLSX"?: string;
	"HTML"?: string;

	// Scrollbar-related
	"Use TAB to select grip buttons or left and right arrows to change selection"?: string;
	"Use left and right arrows to move selection"?: string;
	"Use left and right arrows to move left selection"?: string;
	"Use left and right arrows to move right selection"?: string;
	"Use TAB select grip buttons or up and down arrows to change selection"?: string;
	"Use up and down arrows to move selection"?: string;
	"Use up and down arrows to move lower selection"?: string;
	"Use up and down arrows to move upper selection"?: string;
	"From %1 to %2"?: string;
	"From %1"?: string;
	"To %1"?: string;

	// Data loader-related
	"No parser available for file: %1"?: string;
	"Error parsing file: %1"?: string;
	"Unable to load file: %1"?: string;
	"Invalid date"?: string;

	// Common actions
	"Close"?: string;
	"Minimize"?: string;

	"Venn Series"?: string;
	"Venn Diagram"?: string;
}

/**
 * Defines functions that exist for the locale.
 *
 * @ignore
 */
export interface ILocaleFunctions {
	// ordinal function
	"_dateOrd": (day: number) => string;
}

/**
 * Defines all of the defaults for locale properties.
 * @ignore
 */
export interface ILocaleDefault extends ILocaleSettings, ILocaleFunctions { }

/**
 * Defines locale interface.
 *
 * @ignore
 */
export interface ILocale extends Partial<ILocaleDefault> { };

export interface ILanguageSettings extends IEntitySettings {
}

export interface ILanguagePrivate extends IEntityPrivate {

	/**
	 * A locale for International English (default).
	 */
	defaultLocale: ILocale;

}

/**
 * Add localization functionality.
 */
export class Language extends Entity {
	declare public _settings: ILanguageSettings;
	declare public _privateSettings: ILanguagePrivate;

	protected _setDefaults() {
		this.setPrivate("defaultLocale", en);
		super._setDefaults();
	}

	/**
	 * Returns a prompt translation.
	 * 
	 * @param   prompt   Prompt to translate
	 * @param   locale   Target locale
	 * @param   ...rest  Parameters
	 * @return           Translation
	 */
	public translate<Key extends keyof ILocaleSettings>(prompt: Key, locale?: ILocale, ...rest: Array<string>): string {

		// Get langauge
		if (!locale) {
			locale = this._root.locale || this.getPrivate("defaultLocale");
		}

		// Init translation
		let translation: string = prompt;
		let value = locale[prompt];

		// Try to look for the translation
		if (value === null) {
			translation = "";
		}
		else if (value != null) {
			// It might be an empty string
			if (value) {
				translation = <string>value!;
			}
		}
		else if (locale !== this.getPrivate("defaultLocale")) {
			// Try to look in default language
			return this.translate(prompt, this.getPrivate("defaultLocale"), ...rest);
		}

		// Replace %1, %2, etc params
		if (rest.length) {
			for (let len = rest.length, i = 0; i < len; ++i) {
				translation = translation.split("%" + (i + 1)).join(rest[i]);
			}
		}

		// Return the translation
		return translation;
	}

	/**
	 * Returns a prompt translation, including custom prompts.
	 * 
	 * @param   prompt   Prompt to translate
	 * @param   locale   Target locale
	 * @param   ...rest  Parameters
	 * @return           Translation
	 */
	public translateAny(prompt: string, locale?: ILocale, ...rest: Array<string>): string {
		return this.translate(<any>prompt, locale, ...rest);
	}

	/**
	 * Add a custom prompt to locale.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/locales/creating-translations/#Extending_locale_with_custom_prompts}
	 * @param  prompt       Source prompt
	 * @param  translation  Tanslation
	 * @param  locale       Target locale
	 */
	public setTranslationAny(prompt: string, translation: string, locale?: ILocale): void {
		const localeTarget = locale || this._root.locale;
		(<any>localeTarget)[prompt] = translation;
	}

	/**
	 * Add a batch of custom prompts.
	 *
	 * @since 5.3.3
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/locales/creating-translations/#Extending_locale_with_custom_prompts}
	 * @param  translations  Translations
	 * @param  locale        Target locale
	 */
	public setTranslationsAny(translations: { [index: string]: any }, locale?: ILocale): void {
		$object.each(translations, (key, val) => {
			this.setTranslationAny(key as string, val, locale);
		});
	}

	public translateEmpty<Key extends keyof ILocaleSettings>(prompt: Key, locale?: ILocale, ...rest: Array<string>): string {
		let translation = this.translate(prompt, locale, ...rest);
		return translation == prompt ? "" : translation;
	}

	public translateFunc<Key extends keyof ILocaleFunctions>(prompt: Key, locale?: ILocale): ILocaleFunctions[Key] {

		if ((<any>this._root.locale)[prompt]) {
			return (<any>this._root.locale)[prompt];
		}

		// Try to look in default language
		if (locale !== this.getPrivate("defaultLocale")) {
			return this.translateFunc(prompt, this.getPrivate("defaultLocale"));
		}

		// Fail - return empty function
		return (): string => {
			return "";
		};
	}

	/**
	 * Translates a btach of prompts.
	 * 
	 * @param  list    Array of prompts to translate
	 * @param  locale  Target locale
	 * @return         Array of translations
	 */
	public translateAll<Key extends keyof ILocaleSettings>(list: Array<Key>, locale?: ILocale): Array<string> {
		// Translate all items in the list
		if (!this.isDefault()) {
			return $array.map(list, (x) => this.translate(x, locale));

		} else {
			return list;
		}
	}

	/**
	 * Returns `true` if the currently selected locale is a default locale.
	 *
	 * @return `true` if locale is default; `false` if it is not.
	 */
	public isDefault(): boolean {
		return this.getPrivate("defaultLocale") === this._root.locale;
	}

}

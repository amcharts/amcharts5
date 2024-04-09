import { StockControl, IStockControlSettings, IStockControlPrivate, IStockControlEvents } from "./StockControl";
import { DropdownList, IDropdownListItem } from "./DropdownList";

import * as $array from "../../../core/util/Array";
import * as $type from "../../../core/util/Type";
import * as $utils from "../../../core/util/Utils";

export interface IDropdownListControlSettings extends IStockControlSettings {

	/**
	 * Currently selected item.
	 */
	currentItem?: string | IDropdownListItem;

	/**
	 * Label does not change when item is selected in the list.
	 */
	fixedLabel?: boolean;

	/**
	 * A list of items in the dropdown.
	 */
	items?: Array<string | IDropdownListItem>;

	/**
	 * If set to `true`, the dropdown will fix the height to fit within chart's
	 * area, with scroll if the contents do not fit.
	 */
	scrollable?: boolean;

	/**
	 * Maximum search items to show.
	 */
	maxSearchItems?: number,

	/**
	 * Is the list searchable? If `true` shows search field and
	 * calls `searchCallback` function for a list of items.
	 */
	searchable?: boolean;

	/**
	 * A callback function which returns a list of items based on a search query.
	 */
	searchCallback?: (query: string) => IDropdownListItem[];

	/**
	 * An array of item IDs to now show in the list.
	 *
	 * @since 5.7.0
	 */
	exclude?: string[];

}

export interface IDropdownListControlPrivate extends IStockControlPrivate {
	dropdown?: DropdownList;
}

export interface IDropdownListControlEvents extends IStockControlEvents {
	selected: {
		item: string | IDropdownListItem;
	};
}

/**
 * A generic control which creates a searchable list of items in a dropdown.
 *
 * Can be used in a [[StockToolbar]].
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/stock/toolbar/dropdown-list-control/} for more info
 */
export class DropdownListControl extends StockControl {
	public static className: string = "DropdownListControl";
	public static classNames: Array<string> = StockControl.classNames.concat([DropdownListControl.className]);

	declare public _settings: IDropdownListControlSettings;
	declare public _privateSettings: IDropdownListControlPrivate;
	declare public _events: IDropdownListControlEvents;

	protected _afterNew() {
		// @todo still needed?
		super._afterNew();

		const button = this.getPrivate("button")!;
		button.className = button.className + " am5stock-control-dropdown";
	}

	protected _initElements(): void {
		super._initElements();

		// Disable icon
		//this.getPrivate("icon")!.style.display = "none";

		// Create list
		const dropdownSettings: any = {
			control: this,
			parent: this.getPrivate("button"),
			searchable: this.get("searchable", false),
			scrollable: this.get("scrollable", false),
			items: [],
			exclude: this.get("exclude")
		}

		const maxSearchItems = this.get("maxSearchItems");
		if (maxSearchItems) {
			dropdownSettings.maxSearchItems = maxSearchItems;
		}

		const searchCallback = this.get("searchCallback");
		if (searchCallback) {
			dropdownSettings.searchCallback = searchCallback;
		}

		const items = this.get("items");
		let currentItem = this.get("currentItem");
		if (items) {
			$array.each(items, (item) => {
				const itemObject = $type.isString(item) ? {
					id: item,
					label: item
				} : item;
				dropdownSettings.items.push(itemObject);

				if ($type.isString(currentItem) && currentItem == itemObject.id) {
					currentItem = itemObject;
				}
			})
		}

		const dropdown = DropdownList.new(this._root, dropdownSettings);
		this.setPrivate("dropdown", dropdown);

		if (currentItem) {
			this.setItem(currentItem);
		}

		dropdown.events.on("closed", (_ev) => {
			this.set("active", false);
		});

		dropdown.events.on("invoked", (ev) => {
			this.setItem(ev.item);
			this.events.dispatch("selected", {
				type: "selected",
				item: ev.item,
				target: this
			});
		});

		this.on("active", (active) => {
			if (active) {
				//dropdown.setPrivate("currentId", $type.numberToString(this.get("strokeWidth")));
				this.setTimeout(() => dropdown.show(), 10);
			}
			else {
				dropdown.hide();
			}
		});
	}

	public setItem(item: string | IDropdownListItem): void {
		if (this.get("fixedLabel") !== true) {
			const label = this.getPrivate("label")!;
			if ($type.isString(item)) {
				label.innerHTML = item;
			}
			else {
				if (item.icon) {
					const icon = this.getPrivate("icon")!;
					icon.innerHTML = "";
					icon.appendChild(item.icon.cloneNode(true));
					icon.style.display = "";
				}
				else {
					//icon.style.display = "none";
				}

				if (item.label) {
					label.innerHTML = item.label;
					label.style.display = "";
				}
				else {
					label.innerHTML = "";
					label.style.display = "none";
				}
			}
		}
	}

	/**
	 * Selects an item by its id.
	 *
	 * @since 5.9.0
	 * @param  id  Item ID
	 */
	public setItemById(id: string) {
		const item = this.getItemById(id);
		if (item !== undefined) {
			this.setItem(item);
			//this.set("currentItem", item);
			this.events.dispatch("selected", {
				type: "selected",
				item: item,
				target: this
			});
		}
	}

	/**
	 * Returns list item by ID.
	 * 
	 * @since 5.9.0
	 * @param  id  Item ID
	 * @return     Dropdown item
	 */
	public getItemById(id: string): IDropdownListItem | string | undefined {
		let found: IDropdownListItem | string | undefined;
		const items = this.get("items", []);
		$array.eachContinue(items, (item) => {
			let itemId = $type.isObject(item) ? item.id : item;
			if (itemId == id) {
				found = item;
				return false;
			}
			return true;
		});
		return found;
	}

	public _beforeChanged() {
		super._beforeChanged();
		if (this.isDirty("items")) {
			const dropdown = this.getPrivate("dropdown");
			if (dropdown) {
				const items = this.get("items");
				const dropdownItems: IDropdownListItem[] = [];
				let currentItem = this.get("currentItem");
				if (items) {
					$array.each(items, (item) => {
						const itemObject = $type.isString(item) ? {
							id: item,
							label: item
						} : item;
						dropdownItems.push(itemObject);

						if ($type.isString(currentItem) && currentItem == itemObject.id) {
							currentItem = itemObject;
						}
					})
				}
				dropdown.set("items", dropdownItems);
				//console.log(this.className, this.isAccessible())
			}
		}
	}

	protected _dispose(): void {
		super._dispose();
	}

	protected _maybeMakeAccessible(): void {
		super._maybeMakeAccessible();
		if (this.isAccessible()) {
			const button = this.getPrivate("button")!;
			button.setAttribute("aria-label", button.getAttribute("title") + "; " + this._t("Press ENTER or use arrow keys to navigate"));

			if ($utils.supports("keyboardevents")) {
				this._disposers.push($utils.addEventListener(document, "keydown", (ev: KeyboardEvent) => {
					if (document.activeElement == button) {
						if (ev.keyCode == 38 || ev.keyCode == 40) {
							// Open on arrows
							if (!this.get("active")) {
								this._handleClick();
							}
						}
					}
				}));
			}
		}
	}


}

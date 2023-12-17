import { Dropdown, IDropdownSettings, IDropdownPrivate, IDropdownEvents } from "./Dropdown"
//import type { IDisposer } from "../../../core/util/Disposer";

import * as $array from "../../../core/util/Array";
import * as $utils from "../../../core/util/Utils";

export interface IDropdownListItem {
	id: string;
	label: string;
	subLabel?: string;
	className?: string;
	icon?: SVGElement;
	form?: "radio" | "checkbox";
	value?: string;
	checked?: boolean;
	options?: IDropdownListItem[];
	disabled?: boolean;
}

export interface IDropdownListSettings extends IDropdownSettings {

	/**
	 * A list of items in the dropdown.
	 */
	items?: IDropdownListItem[];

	/**
	 * Maximum search items to show.
	 */
	maxSearchItems?: number;

	/**
	 * Is the list searchable? If `true` shows search field and
	 * calls `searchCallback` function for a list of items.
	 */
	searchable?: boolean;

	/**
	 * A callback function which returns a list of items based on a search query.
	 */
	searchCallback?: (query: string) => Promise<IDropdownListItem[]>;

	/**
	 * An array of item IDs to now show in the list.
	 *
	 * @since 5.7.0
	 */
	exclude?: string[];

}

export interface IDropdownListPrivate extends IDropdownPrivate {
	list?: HTMLUListElement;
	search?: HTMLDivElement;
	currentId?: string;
}

export interface IDropdownListEvents extends IDropdownEvents {
	invoked: {
		item: IDropdownListItem;
	};

	changed: {
		item: IDropdownListItem;
		value: string | boolean;
	}
}

/**
 * A dropdown control for [[StockToolbar]].
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/stock/toolbar/dropdown-list-control/} for more info
 */
export class DropdownList extends Dropdown {
	public static className: string = "DropdownList";
	public static classNames: Array<string> = Dropdown.classNames.concat([DropdownList.className]);

	declare public _settings: IDropdownListSettings;
	declare public _privateSettings: IDropdownListPrivate;
	declare public _events: IDropdownListEvents;

	// private _itemDisposers: Array<IDisposer> = [];

	protected _afterNew() {
		super._afterNew();
		this._root.addDisposer(this);
	}

	protected _initElements(): void {
		super._initElements();

		// Create container
		const container = this.getPrivate("container")!;

		// Init search
		if (this.get("searchable")) {
			this._initSearch();
		}

		// Create list
		const list = document.createElement("ul");
		list.className = "am5stock-control-list";

		container.appendChild(list);
		this.setPrivate("list", list);

		this._initItems();
	}

	protected _sizeItems(): void {
		const list = this.getPrivate("list");
		if (list) {
			list.style.maxHeight = (this.root.container.height() - 100) + "px";
			list.style.overflow = "auto";
		}
	}

	/**
	 * Rebuilds the list.
	 * 
	 * Useful when changing item data within item list.
	 *
	 * @since 5.7.0
	 */
	public rebuildList(): void {
		this._initItems();
	}

	protected _initItems(items?: IDropdownListItem[]): void {
		const list = this.getPrivate("list")!;
		list.innerHTML = "";

		if (!items) {
			items = this.get("items", []);
		}

		const exclude: any = this.get("exclude", []);
		$array.each(items, (item) => {
			if (exclude.indexOf(item.id) == -1) {
				this.addItem(item);
			}
		});

		if (this.get("scrollable")) {
			this._sizeItems();
		}
	}

	protected _initSearch(): void {
		let searchBox = this.getPrivate("search");
		if (this.get("searchable")) {
			if (!searchBox) {
				const container = this.getPrivate("container")!;
				searchBox = document.createElement("div");
				searchBox.className = "am5stock-list-search";
				container.appendChild(searchBox);
				this.setPrivate("search", searchBox);

				const input = document.createElement("input");
				input.type = "text";
				input.placeholder = this._root.language.translateAny("Search");
				searchBox.appendChild(input);

				this._disposers.push($utils.addEventListener(input, "input", (_ev) => {
					this._filterItems(input.value);
				}));
			}
		}
		else if (searchBox) {
			searchBox.style.display = "none";
		}
	}

	public _beforeChanged() {
		super._beforeChanged();

		if (this.isDirty("items")) {
			this._initItems();
		}

		if (this.isDirty("searchable")) {
			this._initSearch();
		}

		if (this.isPrivateDirty("currentId")) {
			// @todo
		}

	}

	protected _dispose(): void {
		super._dispose();

		// $array.each(this._itemDisposers, (x) => {
		// 	x.dispose();
		// });
	}

	protected async _filterItems(search?: string) {
		const searchCallback = this.get("searchCallback");
		if (searchCallback && search) {
			const maxItems = this.get("maxSearchItems", 1000);
			let items = await searchCallback.call(this, search);
			if (maxItems && (items.length > maxItems)) {
				items = items.slice(0, maxItems - 1);
				items.push({
					id: "",
					className: "am5stock-list-info",
					label: this._root.language.translateAny("Search results are limited to %1.", undefined, "" + maxItems)
				});
			}
			this._initItems(items);
		}
		else {
			const list = this.getPrivate("list");
			if (list) {
				const items = list.getElementsByTagName("li");
				$array.each(items, (item) => {
					const regex = new RegExp(search || "", "i");
					if (!search || item.innerText.match(regex)) {
						item.style.display = "";
					}
					else {
						item.style.display = "none";
					}
				});
			}
		}
	}

	public addItem(info: IDropdownListItem): void {
		const list = this.getPrivate("list")!;
		const item = document.createElement("li");
		item.className = "am5stock-list-item";
		item.setAttribute("title", info.subLabel || info.label);

		if (info.className) {
			item.className += " " + info.className;
		}

		if (info.icon) {
			item.appendChild(info.icon);
		}

		let inputId: string | undefined;
		if (info.form) {
			const input: HTMLInputElement = document.createElement("input");
			inputId = "am5stock-list-" + info.id;
			input.type = info.form;
			if (info.value) {
				input.value = info.value;
			}
			if (info.form == "radio") {
				input.name = info.id;
				inputId +=  "-" + info.value;
			}
			if (info.checked) {
				input.checked = true;
			}
			
			input.id = inputId;

			this._disposers.push($utils.addEventListener(item, "click", (ev) => {
				//ev.preventDefault();
				if (ev.target !== input) {
					input.checked = !input.checked;
				}
				this.events.dispatch("changed", {
					type: "changed",
					item: info,
					value: input.checked,
					checked: input.checked,
					target: this
				});
			}));

			item.appendChild(input);
		}

		const label = document.createElement("label");
		label.innerHTML = info.label;
		if (info.label == "") {
			label.style.display = "none";
		}
		item.appendChild(label);

		if (info.subLabel) {
			const subLabel = document.createElement("label");
			subLabel.className = "am5stock-list-sub";
			subLabel.innerHTML = info.subLabel;
			item.appendChild(subLabel);
		}

		if (info.id == "separator") {
			item.innerHTML = "<hr>";
		}

		list.appendChild(item);

		// Add click event
		if (info.disabled) {
			item.className += " am5stock-disabled";
		}
		else {
			this._disposers.push($utils.addEventListener(item, "click", (_ev) => {
				this.hide();
				this.events.dispatch("invoked", {
					type: "invoked",
					item: info,
					target: this
				});
			}));
		}
	}

	public hide(): void {
		super.hide();
		this._filterItems();
		let searchBox = this.getPrivate("search");
		if (searchBox) {
			const inputs = searchBox.getElementsByTagName("input");
			let isCustomSearch = false;
			$array.each(inputs, (input) => {
				if (input.value !== "") {
					isCustomSearch = true;
					input.value = "";
				}
			});

			if (this.get("searchCallback") && isCustomSearch) {
				this._initItems();
			}
		}
	}

}
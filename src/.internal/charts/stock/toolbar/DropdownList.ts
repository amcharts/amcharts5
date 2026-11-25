import { Dropdown, IDropdownSettings, IDropdownPrivate, IDropdownEvents } from "./Dropdown"
import type { IDisposer } from "../../../core/util/Disposer";

import * as $array from "../../../core/util/Array";
import * as $utils from "../../../core/util/Utils";

export interface IDropdownListItem {
	/**
	 * ID of the item. `"separator"` draws a separator line instead.
	 */
	id: string;
	/**
	 * Text of the item.
	 */
	label: string;
	/**
	 * Second line of text, also used as the item's tooltip.
	 */
	subLabel?: string;
	/**
	 * Extra CSS class of the item.
	 */
	className?: string;
	/**
	 * Icon shown before the label.
	 */
	icon?: SVGElement;
	/**
	 * Adds a radio button or a checkbox to the item. Toggling it dispatches
	 * `changed`.
	 */
	form?: "radio" | "checkbox";
	/**
	 * Value of the radio button or checkbox.
	 */
	value?: string;
	/**
	 * Checks the radio button or checkbox at the start.
	 */
	checked?: boolean;
	options?: IDropdownListItem[];
	/**
	 * Shows the item as disabled, so it can't be picked.
	 */
	disabled?: boolean;
}

export interface IDropdownListSettings extends IDropdownSettings {

	/**
	 * Items of the list.
	 */
	items?: IDropdownListItem[];

	/**
	 * Most results of `searchCallback` to show; the rest are cut off with a
	 * note.
	 *
	 * @default 10
	 */
	maxSearchItems?: number;

	/**
	 * Shows a search field above the list. Typing filters the items or, with
	 * `searchCallback`, replaces them with its results.
	 */
	searchable?: boolean;

	/**
	 * Returns the items to show for a search query.
	 */
	searchCallback?: (query: string) => Promise<IDropdownListItem[]>;

	/**
	 * IDs of items to leave out of the list.
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
	/**
	 * An item was clicked.
	 */
	invoked: {
		item: IDropdownListItem;
	};

	/**
	 * The radio button or checkbox of an item was toggled.
	 */
	changed: {
		item: IDropdownListItem;
		value: string | boolean;
	}
}

/**
 * A dropdown list for the controls of a [[StockToolbar]].
 *
 * @see {@link https://docs.amcharts.com/v5/charts/stock/toolbar/dropdown-list-control/} for more info
 */
export class DropdownList extends Dropdown {
	public static className: string = "DropdownList";
	public static classNames: Array<string> = Dropdown.classNames.concat([DropdownList.className]);

	declare public _settings: IDropdownListSettings;
	declare public _privateSettings: IDropdownListPrivate;
	declare public _events: IDropdownListEvents;

	// the item each list element shows
	protected _itemInfo: WeakMap<HTMLElement, IDropdownListItem> = new WeakMap();
	protected _announceTimeout?: IDisposer;

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
	 * Rebuilds the list from `items`, for example after the items' data was
	 * changed in place.
	 *
	 * @since 5.7.0
	 */
	public rebuildList(): void {
		this._initItems();
	}

	protected _initItems(items?: IDropdownListItem[]): void {
		const list = this.getPrivate("list")!;
		const focused = document.activeElement && $utils.contains(list, document.activeElement);
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

		this._maybeMakeAccessible();
		this._updateChecked();
		if (focused) {
			this._focusFirst();
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
				input.setAttribute("aria-label", input.placeholder);
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

		if (this.isDirty("items") || this.isDirty("exclude")) {
			this._initItems();
		}

		if (this.isDirty("searchable")) {
			this._initSearch();
		}

		if (this.isPrivateDirty("currentId")) {
			this._updateChecked();
		}

		if (this.isDirty("control")) {
			this._maybeMakeAccessible();
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
		if (search == "") {
			this._initItems(this.get("items"));
		}
		else if (searchCallback && search) {
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
		this._announceResults(search);
	}

	// tells screen readers how many items a search found, once typing pauses
	protected _announceResults(search?: string): void {
		if (this._announceTimeout) {
			this._announceTimeout.dispose();
			this._announceTimeout = undefined;
		}
		if (search && this.isAccessible()) {
			this._announceTimeout = this.setTimeout(() => {
				this._announceTimeout = undefined;
				if (this.isOpen()) {
					let count = 0;
					$array.each(this._getNavItems(), (item) => {
						if (item.tagName == "LI") {
							count++;
						}
					});
					const language = this._root.language;
					this._root.readerAlert(count ? language.translate("Results: %1", undefined, "" + count) : language.translate("No results"));
				}
			}, 500);
		}
	}

	/**
	 * Adds an item to the end of the list as shown, without adding it to
	 * `items`.
	 *
	 * @param  info  Item
	 */
	public addItem(info: IDropdownListItem): void {
		const list = this.getPrivate("list")!;
		const item = document.createElement("li");
		item.className = "am5stock-list-item";
		item.setAttribute("title", $utils.htmlToText(info.subLabel || info.label));
		this._itemInfo.set(item, info);

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
			input.setAttribute("tabindex", "-1");
			// the item is the checkbox or radio button: the input is only drawn, and a
			// click on it goes to the item
			input.setAttribute("aria-hidden", "true");
			input.setAttribute("inert", "");
			if (info.value) {
				input.value = info.value;
			}
			if (info.form == "radio") {
				input.name = info.id;
				inputId += "-" + info.value;
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
				item.setAttribute("aria-checked", input.checked ? "true" : "false");
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
		label.innerHTML = this._root._sanitizeHTML(info.label);
		if (info.label == "") {
			label.style.display = "none";
		}
		item.appendChild(label);

		if (info.subLabel) {
			const subLabel = document.createElement("label");
			subLabel.className = "am5stock-list-sub";
			subLabel.innerHTML = this._root._sanitizeHTML(info.subLabel);
			item.appendChild(subLabel);
		}

		if (info.id == "separator") {
			item.innerHTML = "<hr>";
		}

		list.appendChild(item);
		this._setItemRole(item, info);

		// Add click event
		if (info.disabled) {
			item.className += " am5stock-disabled";
			item.setAttribute("aria-disabled", "true");
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

	public show(): void {
		this._updateChecked();
		super.show();
	}

	protected _setItemRole(item: HTMLElement, info: IDropdownListItem): void {
		const className = info.className || "";
		if (info.id == "separator") {
			item.setAttribute("role", "separator");
		}
		else if (className.indexOf("am5stock-list-info") != -1 || className.indexOf("am5stock-list-heading") != -1) {
			item.setAttribute("role", "presentation");
		}
		else {
			item.setAttribute("role", info.form == "checkbox" ? "menuitemcheckbox" : (info.form == "radio" ? "menuitemradio" : "menuitem"));
			const name = ($utils.htmlToText(info.label) || "").trim();
			if (name) {
				item.setAttribute("aria-label", name);
			}
			else {
				// an icon only
				const index = this.getPrivate("list")!.getElementsByTagName("li").length;
				item.setAttribute("aria-label", this._root.language.translateAny("Selection") + " #" + index);
			}
		}
	}

	// The checked state of checkboxes and radio buttons, and of the current
	// item of a list that shows one on its button
	protected _updateChecked(): void {
		const list = this.getPrivate("list");
		if (!list) {
			return;
		}
		const currentId = this.getPrivate("currentId");
		$array.each(list.getElementsByTagName("li"), (item) => {
			const info = this._itemInfo.get(item);
			if (!info || item.getAttribute("role") == "separator" || item.getAttribute("role") == "presentation") {
				return;
			}
			const input = item.getElementsByTagName("input")[0];
			if (info.form && input) {
				item.setAttribute("aria-checked", input.checked ? "true" : "false");
			}
			else if (currentId !== undefined) {
				item.setAttribute("role", "menuitemradio");
				item.setAttribute("aria-checked", info.id == currentId ? "true" : "false");
			}
		});
	}

	/**
	 * @ignore
	 */
	public _ariaRole(): "menu" | "dialog" {
		return "menu";
	}

	/**
	 * @ignore
	 */
	public _ariaElement(): HTMLElement | undefined {
		return this.getPrivate("list");
	}

	protected _getNavItems(): HTMLElement[] {
		const items: HTMLElement[] = [];
		const search = this.getPrivate("search");
		if (search && search.style.display != "none") {
			const input = search.getElementsByTagName("input")[0];
			if (input) {
				items.push(input);
			}
		}
		$array.each(this._getActiveItems(), (item) => {
			if ((item as HTMLElement).style.display != "none") {
				items.push(item as HTMLElement);
			}
		});
		return items;
	}

	/**
	 * @ignore
	 */
	public _focusFirst(): void {
		const items = this._getNavItems();
		let first = items[0];
		$array.each(items, (item) => {
			if (item.getAttribute("aria-checked") == "true" && first.tagName != "INPUT") {
				first = item;
			}
		});
		if (first) {
			$utils.focus(first);
		}
		else {
			super._focusFirst();
		}
	}

	/**
	 * @ignore
	 */
	public _maybeMakeAccessible(): void {
		super._maybeMakeAccessible();
		if (this.isAccessible() && this.getPrivate("list")) {
			const items = this._getActiveItems();
			items.forEach((item) => {
				(item as HTMLElement).setAttribute("tabindex", "-1");
			});
		}
	}

	protected _getActiveItems(): NodeList {
		return this.getPrivate("list")!.querySelectorAll(".am5stock-list-item:not(.am5stock-list-info, .am5stock-list-heading, .am5stock-disabled)");
	}

}
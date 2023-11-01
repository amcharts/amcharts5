import { StockControl, IStockControlSettings, IStockControlPrivate, IStockControlEvents } from "./StockControl";
import { Dropdown } from "./Dropdown";

export interface IDropdownControlSettings extends IStockControlSettings {
	fixedLabel?: boolean;
	scrollable?: boolean;
	html?: string;
}

export interface IDropdownControlPrivate extends IStockControlPrivate {
	dropdown?: Dropdown;
	container?: HTMLDivElement;
}

export interface IDropdownControlEvents extends IStockControlEvents {
}

/**
 * A generic control which creates a searchable list of items in a dropdown.
 *
 * Can be used in a [[StockToolbar]].
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/stock/toolbar/dropdown-list-control/} for more info
 */
export class DropdownControl extends StockControl {
	public static className: string = "DropdownControl";
	public static classNames: Array<string> = StockControl.classNames.concat([DropdownControl.className]);

	declare public _settings: IDropdownControlSettings;
	declare public _privateSettings: IDropdownControlPrivate;
	declare public _events: IDropdownControlEvents;

	protected _afterNew() {
		super._afterNew();

		const button = this.getPrivate("button")!;
		button.className = button.className + " am5stock-control-dropdown";
	}

	public _beforeChanged() {
		super._beforeChanged();
		if (this.isDirty("html")) {
			const container = this.getPrivate("container");
			if (container) {
				this.getPrivate("container")!.innerHTML = this.get("html", "");
			}
		}
	}

	protected _initElements(): void {
		super._initElements();

		// Create list
		const dropdownSettings: any = {
			control: this,
			parent: this.getPrivate("button"),
			scrollable: this.get("scrollable", false)
		}

		const dropdown = Dropdown.new(this._root, dropdownSettings);
		this.setPrivate("dropdown", dropdown);

		const container = document.createElement("div");
		container.className = "am5stock-control-list";

		dropdown.getPrivate("container")!.appendChild(container);
		this.setPrivate("container", container);

		const html = this.get("html", "");
		container.innerHTML = html;

		dropdown.events.on("closed", (_ev) => {
			this.set("active", false);
		});

		this.on("active", (active) => {
			if (active) {
				this.setTimeout(() => dropdown.show(), 10);
			}
			else {
				dropdown.hide();
			}
		});
	}

	protected _dispose(): void {
		super._dispose();
	}


}

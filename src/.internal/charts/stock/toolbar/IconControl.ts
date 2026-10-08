import type { Percent } from "../../../core/util/Percent";

import { StockControl, IStockControlSettings, IStockControlPrivate, IStockControlEvents } from "./StockControl";
import { DropdownList, IDropdownListItem } from "./DropdownList";
import { StockIcons } from "./StockIcons";

import * as $array from "../../../core/util/Array";

export interface IIcon {
	/**
	 * SVG path of the icon, drawn in a 50 by 50 box.
	 */
	svgPath: string;
	/**
	 * Scale of the icon on the chart.
	 */
	scale?: number;
	/**
	 * Horizontal point of the icon placed on the clicked spot.
	 */
	centerX?: Percent;
	/**
	 * Vertical point of the icon placed on the clicked spot.
	 */
	centerY?: Percent;
	/**
	 * Draws the icon without a fill, as an outline only.
	 */
	fillDisabled?: boolean;
}

export interface IIconControlSettings extends IStockControlSettings {
	/**
	 * Icons to pick from.
	 */
	icons: IIcon[];
}

export interface IIconControlPrivate extends IStockControlPrivate {
	list?: DropdownList;
}

export interface IIconControlEvents extends IStockControlEvents {
	/**
	 * An icon was picked, or selected with `setIconByPath()`.
	 */
	selected: {
		icon: IIcon
	}
}

/**
 * A dropdown of icons for the icon drawing tool. Created by
 * [[DrawingControl]]; not meant to be used on its own.
 */
export class IconControl extends StockControl {
	public static className: string = "IconControl";
	public static classNames: Array<string> = StockControl.classNames.concat([IconControl.className]);

	declare public _settings: IIconControlSettings;
	declare public _privateSettings: IIconControlPrivate;
	declare public _events: IIconControlEvents;

	protected _afterNew() {

		// Do parent stuff
		super._afterNew();

		// Create list of tools
		const list = DropdownList.new(this._root, {
			control: this,
			parent: this.getPrivate("button"),
			searchable: false
		});
		this.setPrivate("list", list);
		list.getPrivate("list")!.className = "am5stock-control-icons";

		list.events.on("closed", (_ev) => {
			this.set("active", false);
		});

		list.events.on("invoked", (ev) => {
			const item = <IIcon>JSON.parse(ev.item.id);
			let icon: IIcon | undefined;
			const icons = this.get("icons");
			$array.each(icons, (listIcon) => {
				if (item.svgPath == listIcon.svgPath) {
					icon = listIcon;
				}
			});
			if (icon) {
				this.setIcon(icon);
				this.events.dispatch("selected", {
					type: "selected",
					icon: icon,
					target: this
				});
			}
		});

		this.on("active", (active) => {
			if (active) {
				this.setTimeout(() => list.show(), 10);
			}
			else {
				list.hide();
			}
		});

		this._initIcons();
	}

	/**
	 * Shows an icon on the button. Does not dispatch `selected`.
	 *
	 * @param  icon  Icon
	 */
	public setIcon(icon: IIcon): void {
		this.getPrivate("icon")!.innerHTML = "";
		this.getPrivate("icon")!.appendChild(this._getDrawingIcon(icon));
		//this.getPrivate("label")!.style.display = "none";
	}

	/**
	 * Selects an icon by its SVG path: shows it on the button and dispatches
	 * `selected`.
	 *
	 * @since 5.9.0
	 * @param  path  SVG path of the icon
	 */
	public setIconByPath(path: string) {
		const icon = this.getIconByPath(path);
		if (icon !== undefined) {
			this.setIcon(icon);
			//this.set("currentItem", item);
			this.events.dispatch("selected", {
				type: "selected",
				icon: icon,
				target: this
			});
		}
	}

	/**
	 * Returns the icon with an SVG path from `icons`.
	 *
	 * @since 5.9.0
	 * @param  path  SVG path of the icon
	 * @return       Icon
	 */
	public getIconByPath(path: string): IIcon | undefined {
		let found: IIcon | undefined;
		const icons = this.get("icons", []);
		$array.eachContinue(icons, (icon) => {
			if (icon.svgPath == path) {
				found = icon;
				return false;
			}
			return true;
		});
		return found;
	}

	protected _initIcons(): void {
		const list = this.getPrivate("list")!;
		const icons = this.get("icons");
		const items: IDropdownListItem[] = [];
		$array.each(icons, (icon: IIcon) => {
			items.push({
				id: JSON.stringify(icon),
				label: "",
				icon: this._getDrawingIcon(icon)
			});
		})
		list.set("items", items);
	}

	public _getDrawingIcon(icon: IIcon): SVGElement {
		return StockIcons._getSVG({ viewbox: "0 0 50 50", path: icon.svgPath });
	}

	public _afterChanged() {
		super._afterChanged();

		if (this.isDirty("icons")) {
			this._initIcons();
		}
	}

	protected _dispose(): void {
		super._dispose();
	}


}

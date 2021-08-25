import { Container, IContainerSettings, IContainerPrivate, IContainerEvents } from "../../core/render/Container";
import { p100 } from "../../core/util/Percent";
import { registry } from "../Registry";

export interface IChartSettings extends IContainerSettings {
}

export interface IChartPrivate extends IContainerPrivate {
}

export interface IChartEvents extends IContainerEvents {
}

/**
 * A base class for all charts.
 */
export abstract class Chart extends Container {
	public static className: string = "Chart";
	public static classNames: Array<string> = Container.classNames.concat([Chart.className]);

	declare public _settings: IChartSettings;
	declare public _privateSettings: IChartPrivate;
	declare public _events: IChartEvents;

	/**
	 * A [[Container]] chart places its elements in.
	 * 
	 * @default Container.new()
	 */
	public readonly chartContainer: Container = this.children.push(Container.new(this._root, { width: p100, height: p100, interactiveChildren: false }));

	/**
	 * A [[Container]] chart places its bullets in.
	 * 
	 * @default Container.new()
	 */
	public readonly bulletsContainer: Container = Container.new(this._root, { interactiveChildren: false, isMeasured: false, position: "absolute", width: p100, height: p100 });

	protected _afterNew() {
		super._afterNew();
		if (!this._hasLicense()) {
			this._root._showBranding();
		}
	}

	/**
	 * To all the clever heads out there. Yes, we did not make any attempts to
	 * scramble this.
	 *
	 * This is a part of a tool meant for our users to manage their commercial
	 * licenses for removal of amCharts branding from charts.
	 *
	 * The only legit way to do so is to purchase a commercial license for amCharts:
	 * https://www.amcharts.com/online-store/
	 * 
	 * Removing or altering this code, or disabling amCharts branding in any other
	 * way is against the license and thus illegal.
	 */
	protected _hasLicense(): boolean {
		for (let i = 0; i < registry.licenses.length; i++) {
			if (registry.licenses[i].match(/^AM5C.{5,}/i)) {
				return true;
			}
		}
		return false;
	}
}
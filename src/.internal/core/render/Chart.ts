import { Container, IContainerSettings, IContainerPrivate, IContainerEvents } from "../../core/render/Container";
import { p100 } from "../../core/util/Percent";

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

}
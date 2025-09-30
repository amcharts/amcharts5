import { Container, IContainerPrivate, IContainerSettings } from "../../core/render/Container";
import { EditableLabel } from "../../core/render/EditableLabel";
import { Rectangle } from "../../core/render/Rectangle";
import { Triangle } from "../../core/render/Triangle";
import { color } from "../../core/util/Color";

export interface INumericStepperSettings extends IContainerSettings {
	value?: number;
}

export interface INumericStepperPrivate extends IContainerPrivate {
}

/**
 * Draws an interactive NumericStepper.
 *
 * @important
 * @since 5.14.0
 */
export class NumericStepper extends Container {

	public label: EditableLabel = this.children.push(EditableLabel.new(this._root, {}));
	public buttonsContainer: Container = this.children.push(Container.new(this._root, { themeTags: ["buttons"] }));
	public upButton: Triangle = this.buttonsContainer.children.push(Triangle.new(this._root, { themeTags: ["upbutton"] }));
	public downButton: Triangle = this.buttonsContainer.children.push(Triangle.new(this._root, { themeTags: ["downbutton"] }));

	declare public _settings: INumericStepperSettings;
	declare public _privateSettings: INumericStepperPrivate;

	public static className: string = "NumericStepper";
	public static classNames: Array<string> = Container.classNames.concat([NumericStepper.className]);


	protected _afterNew() {
		this.addTag("numericstepper");

		this.set("layout", this._root.horizontalLayout);

		this.label.adapters.add("text", (text) => {
			if (text) {
				text.replace(/\D/g, '');
			}
			if (text === "") {
				text = "0";
			}

			return text;
		})

		this.set("background", Rectangle.new(this._root, {
			fillOpacity: 0,
			fill: color(0xffffff)
		}));

		this.buttonsContainer.states.create("hidden", {
			opacity: 0,
			visible: true
		});

		this.events.on("pointerover", () => {
			this.buttonsContainer.set("active", true);
		})
		this.events.on("pointerout", () => {
			this.buttonsContainer.set("active", false);
		});

		this.label.on("text", (text) => {
			if (text) {
				const value = parseFloat(text);
				if (!isNaN(value)) {
					this.set("value", value);
				}
			}
		});

		this.upButton.events.on("click", () => {
			this.set("value", this.get("value", 0) + 1);
		});

		this.downButton.events.on("click", () => {
			this.set("value", Math.max(0, this.get("value", 0) - 1));
		});

		super._afterNew();
	}

	public _updateChildren(): void {
		super._updateChildren();

		const value = this.get("value", 0);
		const label = this.label;

		if(this.isDirty("value")) {
			label.set("text", value.toString());
		}

		if (this.isDirty("disabled")) {
			const disabled = this.get("disabled", false);

			this.set("interactive", !disabled);
			this.upButton.set("interactive", !disabled);
			this.downButton.set("interactive", !disabled);

			if (disabled) {
				this.label.set("editOn", "none")
				this.buttonsContainer.hide(0);

			} else {
				this.label.set("editOn", "click");
				this.buttonsContainer.show(0);
			}
		}
	}
}

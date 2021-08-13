import type { Entity } from "./Entity";


export class Value<T> {
	private _entity: Entity;
	private _value: T;
	private _dirty: boolean = false;

	constructor(entity: Entity, value: T) {
		this._entity = entity;
		this._value = value;

		entity.markDirty();
	}

	public get(): T {
		return this._value;
	}

	public set(value: T) {
		this._value = value;
		this._dirty = true;
		this._entity.markDirty();
	}

	public get dirty(): boolean {
		return this._dirty;
	}
}

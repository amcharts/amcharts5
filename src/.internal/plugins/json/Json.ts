import type { Root } from "../../core/Root";
import type { Sprite } from "../../core/render/Sprite";
import { Entity } from "../../core/util/Entity";
import { Container } from "../../core/render/Container";
import { Color } from "../../core/util/Color";
import { Template } from "../../core/util/Template";

import * as $type from "../../core/util/Type";
import * as $array from "../../core/util/Array";
import * as $object from "../../core/util/Object";

import type { IClasses } from "./Classes";
import classes from "./Classes";


interface IRef {
    [key: string]: any;
}


function isObject(value: any): value is { [key: string]: any } {
    return $type.isObject(value);
}


async function getClass(name: string): Promise<typeof Entity> {
    const promise = classes[name as keyof IClasses];
    return await promise() as typeof Entity;
}


function parseArray(root: Root, value: Array<unknown>, refs: Array<IRef>): Promise<any> {
    return Promise.all($array.map(value, (value) => parseType(root, value, refs)));
}


function lookupRef(refs: Array<IRef>, name: string): any {
    let i = refs.length;

    while (i--) {
        const sub = refs[i];

        if (name in sub) {
            return sub[name];
        }
    }

    throw new Error("Could not find ref #" + name);
}


interface IAdapter<E extends Entity> {
    key: keyof E["_settings"],
    callback: (value: E["_settings"][this["key"]], target: E, key: this["key"]) => E["_settings"][this["key"]],
}

type IParsedProperties = Array<(entity: Entity) => void>;

interface IParsedEntity<E extends Entity> {
    isValue: false,
    type: string | undefined,
    construct: typeof Entity | undefined,
    settings: object | undefined,
    adapters: Array<IAdapter<E>> | undefined,
    children: Array<Sprite> | undefined,
    properties: IParsedProperties | undefined,
    value: object,
}

type IParsed<E extends Entity>
    = IParsedEntity<E>
    | { isValue: true, value: any };


async function parseSettings<E extends Entity>(root: Root, object: object, refs: Array<IRef>): Promise<E["_settings"]> {
    const settings: { [key: string]: any } = {};

    await Promise.all($array.map($object.keys(object), async (key) => {
        settings[key] = await parseType(root, object[key], refs);
    }));

    return settings;
}


async function parseProperties(root: Root, object: object, refs: Array<IRef>): Promise<IParsedProperties> {
    return await Promise.all($array.map($object.keys(object), async (key) => {
        const parsed = await parseValue(root, object[key], refs);

        return (entity: Entity) => {
            const old = entity[key] as unknown;

            if (old && old instanceof Entity) {
                // TODO merge it if the value is an Entity
                if (parsed.isValue) {
                    throw new Error("Cannot merge value into Entity");
                }

                if (parsed.settings) {
                    old.setAll(parsed.settings);
                }

                mergeEntity(old, parsed);

            } else if (parsed.isValue) {
                // Merge Array into List
                if (old && $type.isArray(parsed.value)) {
                    $array.each(parsed.value, (value) => {
                        (old as any).push(value);
                    });

                } else {
                    // TODO merge it if the value is an Entity
                    (entity as any)[key] = parsed.value;
                }

            } else {
                (entity as any)[key] = constructEntity(root, parsed);
            }
        };
    }));
}


async function parseRefs(root: Root, object: { [key: string]: any }, refs: Array<IRef>): Promise<IRef> {
    const newRefs: IRef = {};

    await Promise.all($array.map($object.keys(object), async (key) => {
        newRefs[key] = await parseType(root, object[key], refs);
    }));

    return newRefs;
}


async function parseValue<E extends Entity>(root: Root, value: any, refs: Array<IRef>): Promise<IParsed<E>> {
    if ($type.isArray(value)) {
        return {
            isValue: true,
            value: await parseArray(root, value, refs),
        };

    } else if (isObject(value)) {
        if (value.type === "Color") {
            return {
                isValue: true,
                value: Color.fromAny(value.value),
            };

        } else if (value.type === "Template") {
            if (value.refs) {
                refs = refs.concat([await parseRefs(root, value.refs, refs)]);
            }

            const settings = (value.settings ? await parseSettings(root, value.settings, refs) : {});

            return {
                isValue: true,
                value: Template.new(settings),
            };

        } else {
            if (value.refs) {
                refs = refs.concat([await parseRefs(root, value.refs, refs)]);
            }

            const [construct, settings, properties, children] = await Promise.all([
                (value.type ? getClass(value.type) : Promise.resolve(undefined)),
                (value.settings ? parseSettings(root, value.settings, refs) : Promise.resolve(undefined)),
                (value.properties ? parseProperties(root, value.properties, refs) : Promise.resolve(undefined)),
                (value.children ? parseArray(root, value.children, refs) : Promise.resolve(undefined)),
            ]);

            return {
                isValue: false,
                type: value.type,
                construct,
                settings,
                adapters: value.adapters,
                children,
                properties,
                value,
            };
        }

    } else if ($type.isString(value)) {
        if (value[0] === "#") {
            const ref = value.slice(1);

            if (value[1] === "#") {
                return {
                    isValue: true,
                    value: ref,
                };

            } else {
                return {
                    isValue: true,
                    value: lookupRef(refs, ref),
                };
            }

        } else {
            return {
                isValue: true,
                value,
            };
        }

    } else {
        return {
            isValue: true,
            value,
        };
    }
}


function mergeEntity<E extends Entity>(entity: E, parsed: IParsedEntity<E>): void {
    if (parsed.adapters) {
        $array.each(parsed.adapters, (adapter) => {
            entity.adapters.add(adapter.key, adapter.callback);
        });
    }

    if (parsed.properties) {
        $array.each(parsed.properties, (fn) => {
            fn(entity);
        });
    }

    if (entity instanceof Container) {
        if (parsed.children) {
            entity.children.setAll(parsed.children);
        }
    }
}


function constructEntity<E extends Entity>(root: Root, parsed: IParsedEntity<E>): E | object {
    if (!parsed.construct) {
        return parsed.value;
    }

    const entity = parsed.construct.new(root, parsed.settings || {}) as E;

    mergeEntity(entity, parsed);

    return entity;
}


async function parseType(root: Root, value: unknown, refs: Array<IRef>): Promise<any> {
    const parsed = await parseValue(root, value, refs);

    if (parsed.isValue) {
        return parsed.value;

    } else {
        return constructEntity(root, parsed);
    }
}


export class JsonParser {
    async parse<E extends Entity>(root: Root, object: unknown): Promise<E> {
        return parseType(root, object, []);
    }

    async parseString<E extends Entity>(root: Root, string: string): Promise<E> {
        return await this.parse(root, JSON.parse(string));
    }
}

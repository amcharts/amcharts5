import type { Root } from "../../core/Root";
import type { Settings } from "../../core/util/Entity";
import { Entity } from "../../core/util/Entity";
import { Sprite } from "../../core/render/Sprite";
import { Container } from "../../core/render/Container";

import * as $type from "../../core/util/Type";
import * as $array from "../../core/util/Array";

import type { IClasses } from "./Classes";
import classes from "./Classes";

interface IAdapter<E extends Settings> {
    key: keyof E["_settings"],
    callback: (value: E["_settings"][this["key"]], target: E, key: this["key"]) => E["_settings"][this["key"]];
}

interface IJson {
    name: keyof IClasses;
    [key: string]: unknown;
}

function isJson(value: any): value is IJson {
    return $type.isObject(value) && !$type.isArray(value) && $type.isString((value as any).name);
}

export class JsonParser {
    parse<E extends Settings>(root: Root, object: unknown): E {
        if (isJson(object)) {
            const construct = classes[object.name] as any;
            if (!construct) {
                throw new Error("Could not find class `" + object.name + "`");
            }

            const entity = construct.new(root, object.settings) as E;

            if (entity instanceof Entity) {
                if (object.adapters) {
                    $array.each(object.adapters as Array<IAdapter<E>>, (adapter) => {
                        entity.adapters.add(adapter.key, adapter.callback);
                    });
                }
            }

            if (entity instanceof Container) {
                if (object.children) {
                    $array.each(object.children as Array<IJson>, (child) => {
                        const sprite = this.parse<Sprite>(root, child);

                        if (!(sprite instanceof Sprite)) {
                            throw new Error("Children must be Sprite");
                        }

                        entity.children.push(sprite);
                    });
                }
            }

            return entity;

        } else {
            throw new Error("JsonParser.parse requires an object which has a `name` property");
        }
    }

    parseString<E extends Settings>(root: Root, string: string): E {
        return this.parse(root, JSON.parse(string));
    }
}

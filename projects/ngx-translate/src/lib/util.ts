/* eslint-disable @typescript-eslint/no-explicit-any */

import { InterpolatableTranslationObject } from './translate.service';

/**
 * Determines if two objects or two values are equivalent.
 *
 * Two objects or values are considered equivalent if at least one of the following is true:
 *
 * * Both objects or values pass `===` comparison.
 * * Both objects or values are of the same type and all of their properties are equal by
 *   comparing them with `equals`.
 *
 * @param o1 Object or value to compare.
 * @param o2 Object or value to compare.
 * @returns true if arguments are equal.
 */
export function equals(o1: any, o2: any): boolean {
  if (o1 === o2) return true;
  if (o1 === null || o2 === null) return false;
  if (o1 !== o1 && o2 !== o2) return true; // NaN === NaN
  const t1 = typeof o1, t2 = typeof o2;
  let length: number, key: any, keySet: any;
  if (t1 == t2 && t1 == 'object') {
    if (Array.isArray(o1)) {
      if (!Array.isArray(o2)) return false;
      if ((length = o1.length) == o2.length) {
        for (key = 0; key < length; key++) {
          if (!equals(o1[key], o2[key])) return false;
        }
        return true;
      }
    } else {
      if (Array.isArray(o2)) {
        return false;
      }
      keySet = Object.create(null);
      for (key in o1) {
        if (!equals(o1[key], o2[key])) {
          return false;
        }
        keySet[key] = true;
      }
      for (key in o2) {
        if (!(key in keySet) && typeof o2[key] !== 'undefined') {
          return false;
        }
      }
      return true;
    }
  }
  return false;
}

export function isDefinedAndNotNull<T>(value: T | null | undefined): value is T {
  return typeof value !== 'undefined' && value !== null;
}


export function isDict(value: any): value is InterpolatableTranslationObject {
  return isObject(value) && !isArray(value) && value !== null;
}


export function isObject(value: any): value is Record<string, any> {
  return typeof value === 'object';
}

export function isArray(value: any): value is any[] {
  return Array.isArray(value);
}

export function isString(value: any): value is string {
  return typeof value === 'string';
}

export function isFunction(value: any): boolean {
  return typeof value === "function"
}

export function cloneDeep<T>(obj: Readonly<T>): T
{
  if (obj === null || typeof obj !== "object")
  {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => cloneDeep(item)) as unknown as T;
  }

  const clonedObj: Record<string, any> = {};

  Object.keys(obj).forEach((key) => {
    clonedObj[key] = cloneDeep((obj as Record<string, any>)[key]);
  });

  return clonedObj as T;
}

export function mergeDeep(target: Readonly<any>, source: any): any {
  const output = cloneDeep(target);

  if (!isObject(target))
  {
    return cloneDeep(source)
  }

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key: any) => {
      if (isDict(source[key])) {
        if (key in target) {
          output[key] = mergeDeep(target[key], source[key]);
        } else {
          Object.assign(output, {[key]: source[key]});
        }
      } else {
        Object.assign(output, {[key]: source[key]});
      }
    });
  }
  return output;
}


/**
 * Retrieves a value from a nested object using a dot-separated key path.
 *
 * Example usage:
 * ```ts
 * getValue({ key1: { keyA: 'valueI' }}, 'key1.keyA'); // returns 'valueI'
 * ```
 *
 * @param target The source object from which to retrieve the value.
 * @param key Dot-separated key path specifying the value to retrieve.
 * @returns The value at the specified key path, or `undefined` if not found.
 */
export function getValue(target: any, key: string): any
{
  const keys = key.split(".");

  key = "";
  do
  {
    key += keys.shift();
    if (
      isDefinedAndNotNull(target) &&
      (isDefinedAndNotNull(target[key]) || target[key] === null) &&
      (isDict(target[key]) || isArray(target[key]) || !keys.length)
    )
    {
      target = target[key];
      key = "";
    }
    else if (!keys.length)
    {
      target = undefined;
    }
    else
    {
      key += ".";
    }
  } while (keys.length);

  return target;
}

/**
 * Sets a value on object using a dot separated key.
 * This function modifies the object in place
 * parser.setValue({a:{b:{c: "test"}}}, 'a.b.c', "test2") ==> {a:{b:{c: "test2"}}}
 * @param target an object
 * @param key E.g. "a.b.c"
 * @param value to set
 * @deprecated use insertValue() instead
 */
export function setValue(target: any, key: string, value: any): void {
  const keys = key.split('.');
  let current = target;

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];

    // If we're at the last key, set the value
    if (i === keys.length - 1) {
      current[key] = value;
    } else {
      // If the key doesn't exist or isn't an object, create an empty object
      if (!current[key] || !isDict(current[key])) {
        current[key] = {};
      }
      current = current[key];
    }
  }
}



/**
 * Sets a value on object using a dot separated key.
 * Returns a clone of the object without modifying it
 * parser.setValue({a:{b:{c: "test"}}}, 'a.b.c', "test2") ==> {a:{b:{c: "test2"}}}
 * @param target an object
 * @param key E.g. "a.b.c"
 * @param value to set
 */
export function insertValue(target: Readonly<any>, key: string, value: any): any {
  return mergeDeep(target, createNestedObject(key, value));
}



function createNestedObject(dotSeparatedKey: string, value: any): Record<string, any> {
  return dotSeparatedKey.split('.').reduceRight((acc, key) => ({ [key]: acc }), value);
}

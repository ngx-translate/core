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
export function equals(o1: unknown, o2: unknown): boolean {
  if (o1 === o2) return true;
  if (o1 === null || o2 === null) return false;
  if (o1 !== o1 && o2 !== o2) return true; // NaN === NaN

  const t1 = typeof o1, t2 = typeof o2;
  let length: number;

  if (t1 == t2 && t1 == 'object') {
    if (Array.isArray(o1)) {
      if (!Array.isArray(o2)) return false;
      if ((length = o1.length) == o2.length) {
        for (let key = 0; key < length; key++) {
          if (!equals(o1[key], o2[key])) return false;
        }
        return true;
      }
    }
    else {
      if (Array.isArray(o2)) {
        return false;
      }
      if(isDict(o1) && isDict(o2)) {
        const keySet = Object.create(null);
        for (const key in o1) {
          if (!equals(o1[key], o2[key])) {
            return false;
          }
          keySet[key] = true;
        }
        for (const key in o2) {
          if (!(key in keySet) && typeof o2[key] !== 'undefined') {
            return false;
          }
        }
        return true;
      }
    }
  }
  return false;
}

export function isDefinedAndNotNull<T>(value: T | null | undefined): value is T {
  return typeof value !== 'undefined' && value !== null;
}

export function isDefined<T>(value: T | null | undefined): value is (T | null) {
  return value !== undefined;
}

export function isDict(value: unknown): value is InterpolatableTranslationObject {
  return isObject(value) && !isArray(value) && value !== null;
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isFunction(value: unknown): boolean {
  return typeof value === "function"
}

function cloneDeep(value: unknown): unknown {
  if (isArray(value)) {
    return value.map(item => cloneDeep(item));
  } else if (isDict(value)) {
    const cloned: Record<string, unknown> = {};
    Object.keys(value).forEach(key => {
      cloned[key] = cloneDeep((value as Record<string, unknown>)[key]);
    });
    return cloned;
  } else {
    return value;
  }
}

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export function mergeDeep(target: Readonly<unknown>, source: Readonly<unknown>): any {
  if (!isObject(target))
  {
    return cloneDeep(source)
  }

  const output = cloneDeep(target);

  if (isObject(output) && isObject(source)) {
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    Object.keys(source).forEach((key: any) => {
      if (isDict(source[key])) {
        if (key in target) {
          output[key] = mergeDeep(target[key] as Readonly<unknown>, source[key]);
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
export function getValue(target: unknown, key: string): unknown
{
  const keys = key.split(".");

  key = "";
  do
  {
    key += keys.shift();
    const isLastKey = !keys.length;

    if(isDefinedAndNotNull(target))
    {
      if (
        isDict(target) &&
        isDefined(target[key]) &&
        (isDict(target[key]) || isArray(target[key]) || isLastKey)
      )
      {
        target = target[key];
        key = "";
        continue;
      }

      if(isArray(target))
      {
        const index = parseInt(key, 10);
        if (
          isDefined(target[index]) &&
          (isDict(target[index]) || isArray(target[index]) || isLastKey)
        )
        {
          target = target[index];
          key = "";
          continue;
        }
      }
    }

    if (isLastKey)
    {
      target = undefined;
      continue;
    }
    key += ".";

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
export function setValue(target: Record<string, unknown>, key: string, value: unknown): void {
  const keys:string[] = key.split('.');
  let current:Record<string, unknown> = target;

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];

    if (i === keys.length - 1) {
      current[key] = value;
    } else {
      current = (current[key] && isDict(current[key])) ? current[key] : {};
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
export function insertValue<T>(target: Readonly<T>, key: string, value: unknown): T {
  return mergeDeep(target, createNestedObject(key, value) as Readonly<unknown>);
}



function createNestedObject(dotSeparatedKey: string, value: unknown): Record<string, unknown>|unknown
{
  return dotSeparatedKey
    .split('.')
    .reduceRight<unknown>((acc, key) => ({ [key]: acc }), value);
}

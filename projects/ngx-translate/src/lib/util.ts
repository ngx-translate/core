/* eslint-disable @typescript-eslint/no-explicit-any */

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

export function isDefined(value: any): boolean {
  return typeof value !== 'undefined' && value !== null;
}


export function isDict(value: any): boolean {
  return isObject(value) && !isArray(value) && value !== null;
}


export function isObject(value: any): boolean {
  return typeof value === 'object';
}

export function isArray(value: any): boolean {
  return Array.isArray(value);
}

export function isString(value: any): boolean {
  return typeof value === 'string';
}

export function isFunction(value: any):boolean {
  return typeof value === "function"
}


export function mergeDeep(target: any, source: any): any {
  const output = Object.assign({}, target);

  if (!isObject(target)) {
    return mergeDeep({}, source);
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
 * Gets a value from an object by composed key
 * getValue({ key1: { keyA: 'valueI' }}, 'key1.keyA') ==> 'valueI'
 * @param target
 * @param key
 */
export function getValue(target: any, key: string) {
  let keys = key.split(".");
  let matchedKey: string|undefined = key;
  while(keys.length) {
    [matchedKey, keys] = getLongestMatchingSubKey(target,keys);
    if (matchedKey===undefined)
      return undefined;
    target = target[matchedKey];
  }
  return target;
}

function getLongestMatchingSubKey(target: any, keys: string[]): [string|undefined, string[]] {
  let key = '';
  let matchedKey;
  let size;
  for (let i=0; i<keys.length; i++) {
    key += keys[i];
    if (isDefined(target[key])) {
      matchedKey = key;
      size = i+1;
    }
    key += '.';
  }
  return [matchedKey, isDefined(size) ? keys.slice(size) : keys];
}

/**
 * Gets a value from an object by composed key
 * parser.setValue({a:{b:{c: "test"}}}, 'a.b.c', "test2") ==> {a:{b:{c: "test2"}}}
 * @param target an object
 * @param key E.g. "a.b.c"
 * @param value to set
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



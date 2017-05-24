/* tslint:disable */
/**
 * @name equals
 *
 * @description
 * Determines if two objects or two values are equivalent.
 *
 * Two objects or values are considered equivalent if at least one of the following is true:
 *
 * * Both objects or values pass `===` comparison.
 * * Both objects or values are of the same type and all of their properties are equal by
 *   comparing them with `equals`.
 *
 * @param {*} o1 Object or value to compare.
 * @param {*} o2 Object or value to compare.
 * @returns {boolean} True if arguments are equal.
 */
export function equals(o1: any, o2: any): boolean {
    if(o1 === o2) return true;
    if(o1 === null || o2 === null) return false;
    if(o1 !== o1 && o2 !== o2) return true; // NaN === NaN
    let t1 = typeof o1, t2 = typeof o2, length: number, key: any, keySet: any;
    if(t1 == t2 && t1 == 'object') {
        if(Array.isArray(o1)) {
            if(!Array.isArray(o2)) return false;
            if((length = o1.length) == o2.length) {
                for(key = 0; key < length; key++) {
                    if(!equals(o1[key], o2[key])) return false;
                }
                return true;
            }
        } else {
            if(Array.isArray(o2)) {
                return false;
            }
            keySet = Object.create(null);
            for(key in o1) {
                if(!equals(o1[key], o2[key])) {
                    return false;
                }
                keySet[key] = true;
            }
            for(key in o2) {
                if(!(key in keySet) && typeof o2[key] !== 'undefined') {
                    return false;
                }
            }
            return true;
        }
    }
    return false;
}
/* tslint:enable */

export function isDefined(value: any): boolean {
    return typeof value !== 'undefined' && value !== null;
}

/** Start deep merge, from https://github.com/KyleAMathews/deepmerge **/
function isMergeableObject<T>(val: T): boolean {
    let nonNullObject = val && typeof val === 'object';

    return nonNullObject
        && Object.prototype.toString.call(val) !== '[object RegExp]'
        && Object.prototype.toString.call(val) !== '[object Date]';
}

function emptyTarget<T>(val: T): any {
    return Array.isArray(val) ? [] : {};
}

function cloneIfNecessary<T>(value: T, options: DeepMergeOptions<T>): T {
    let clone = options && options.clone === true;
    return clone && isMergeableObject(value) ? deepMerge(emptyTarget(value), value, options) : value;
}

function defaultArrayMerge<T>(target: T[], source: T[], options: DeepMergeOptions<T>): T[] {
    let destination = target.slice();
    source.forEach(function(e, i) {
        if(typeof destination[i] === 'undefined') {
            destination[i] = cloneIfNecessary(e, options);
        } else if(isMergeableObject(e)) {
            destination[i] = deepMerge(target[i], e, options);
        } else if(target.indexOf(e) === -1) {
            destination.push(cloneIfNecessary(e, options));
        }
    });
    return destination;
}

function mergeObject<T>(target: any, source: any, options: DeepMergeOptions<T>): T {
    let destination: any = {};
    if(isMergeableObject(target)) {
        Object.keys(target).forEach(function(key) {
            destination[key] = cloneIfNecessary(target[key], options)
        });
    }
    Object.keys(source).forEach(function(key) {
        if(!isMergeableObject(source[key]) || !target[key]) {
            destination[key] = cloneIfNecessary(source[key], options);
        } else {
            destination[key] = deepMerge(target[key], source[key], options);
        }
    });
    return destination;
}

export interface DeepMergeOptions<T> {
    clone?: boolean;

    arrayMerge?(destination: T, source: T, options?: DeepMergeOptions<T>): T;
}

export function deepMerge<T>(target: T, source: T, options?: DeepMergeOptions<T>): T {
    let array = Array.isArray(source);
    options = options || {arrayMerge: defaultArrayMerge} as any;
    let arrayMerge: any = options.arrayMerge || defaultArrayMerge;

    if(array) {
        return Array.isArray(target) ? arrayMerge(target, source, options) : cloneIfNecessary(source, options);
    } else {
        return mergeObject(target, source, options);
    }
}
/** End deep merge **/

import {
    equals,
    getValue,
    isArray,
    isDict,
    isDefinedAndNotNull,
    isDefined,
    isObject,
    isString,
    isFunction,
    setValue,
    insertValue,
    mergeDeep,
} from "../lib/util";

describe("Utils", () => {
    describe("deepMerge", () => {
        it("should merge properties from source into target", () => {
            const target = { a: 1, b: 2 };
            const source = { b: 3, c: 4 };
            const result = mergeDeep(target, source);

            expect(result).toEqual({ a: 1, b: 3, c: 4 });
        });

        it("should merge nested objects", () => {
            const target = { a: { b: 2 } };
            const source = { a: { c: 3 } };
            const result = mergeDeep(target, source);

            expect(result).toEqual({ a: { b: 2, c: 3 } });
        });

        it("should not modify the original target object", () => {
            const target = { a: { b: 2 } };
            const source = { a: { c: 3 } };
            const result = mergeDeep(target, source);

            expect(result).not.toBe(target);
            expect(target).toEqual({ a: { b: 2 } }); // Ensure the target is unchanged
        });

        it("should handle non-object properties in source", () => {
            const target = { a: { b: 2 } };
            const source = { a: 3 };
            const result = mergeDeep(target, source);

            expect(result).toEqual({ a: 3 });
        });

        it("should handle non-object properties in target", () => {
            const target = { a: 2 };
            const source = { a: { b: 3 } };
            const result = mergeDeep(target, source);

            expect(result).toEqual({ a: { b: 3 } });
        });

        it("should handle merging of arrays", () => {
            const target = { a: [1, 2, 3] };
            const source = { a: [4, 5] };
            const result = mergeDeep(target, source);

            expect(result).toEqual({ a: [4, 5] });
        });

        it("should merge deeply nested objects", () => {
            const target = { a: { b: { c: 1 } } };
            const source = { a: { b: { d: 2 } } };
            const result = mergeDeep(target, source);

            expect(result).toEqual({ a: { b: { c: 1, d: 2 } } });
        });

        it("should add new properties from the source if they do not exist in the target", () => {
            const target = { a: 1 };
            const source = { b: 2 };
            const result = mergeDeep(target, source);

            expect(result).toEqual({ a: 1, b: 2 });
        });

        it("should handle empty target object", () => {
            const target = {};
            const source = { a: 1, b: { c: 2 } };
            const result = mergeDeep(target, source);

            expect(result).toEqual({ a: 1, b: { c: 2 } });
        });

        it("should handle empty source object", () => {
            const target = { a: 1, b: 2 };
            const source = {};
            const result = mergeDeep(target, source);

            expect(result).toEqual({ a: 1, b: 2 });
        });
    });

    describe("equals", () => {
        it("should return true for strictly equal primitives", () => {
            expect(equals(1, 1)).toBeTrue();
            expect(equals("test", "test")).toBeTrue();
            expect(equals(true, true)).toBeTrue();
        });

        it("should return false for different primitives", () => {
            expect(equals(1, 2)).toBeFalse();
            expect(equals("test", "other")).toBeFalse();
            expect(equals(true, false)).toBeFalse();
        });

        it("should return true for null comparisons", () => {
            expect(equals(null, null)).toBeTrue();
        });

        it("should return false if one value is null", () => {
            expect(equals(null, 1)).toBeFalse();
            expect(equals({}, null)).toBeFalse();
        });

        it("should return true for NaN comparisons", () => {
            expect(equals(NaN, NaN)).toBeTrue();
        });

        it("should return true for equal arrays", () => {
            expect(equals([1, 2, 3], [1, 2, 3])).toBeTrue();
            expect(equals([], [])).toBeTrue();
        });

        it("should return false for arrays of different lengths", () => {
            expect(equals([1, 2], [1, 2, 3])).toBeFalse();
        });

        it("should return false for arrays with different elements", () => {
            expect(equals([1, 2, 3], [1, 2, 4])).toBeFalse();
        });

        it("should return true for deeply nested arrays", () => {
            expect(equals([1, [2, [3]]], [1, [2, [3]]])).toBeTrue();
        });

        it("should return true for equal objects", () => {
            expect(equals({ a: 1, b: 2 }, { a: 1, b: 2 })).toBeTrue();
        });

        it("should return false for objects with different properties", () => {
            expect(equals({ a: 1, b: 2 }, { a: 1, c: 3 })).toBeFalse();
        });

        it("should use strictly equal comparison", () => {
            expect(equals({ a: 1 }, { a: "1" })).toBeFalse();
        });

        it("should return false for objects with different property values", () => {
            expect(equals({ a: 1, b: 2 }, { a: 1, b: 3 })).toBeFalse();
        });

        it("should return true for deeply nested objects", () => {
            expect(equals({ a: { b: { c: 1 } } }, { a: { b: { c: 1 } } })).toBeTrue();
        });

        it("should return false for objects and arrays", () => {
            expect(equals({ a: 1 }, [1])).toBeFalse();
        });

        it("should return false for arrays and objects", () => {
            expect(equals([1], { 0: 1 })).toBeFalse();
        });

        it("should handle undefined properties correctly", () => {
            expect(equals({ a: 1, b: undefined }, { a: 1 })).toBeTrue();
            expect(equals({ a: 1 }, { a: 1, b: undefined })).toBeTrue();
            expect(equals({ a: 1, b: 2 }, { a: 1, b: undefined })).toBeFalse();
        });

        it("should return false when o2 has a property not present in o1", () => {
            const o1 = { a: 1, b: 2 };
            const o2 = { a: 1, b: 2, c: 3 }; // `c` is not present in `o1`

            expect(equals(o1, o2)).toBeFalse();
        });
    });

    describe("getValue()", () => {
        it("should get the addressed value", () => {
            expect(getValue({ key1: { key2: "value2" } }, "key1.key2")).toEqual("value2");
            expect(getValue({ key1: { key2: "value" } }, "keyWrong.key2")).not.toBeDefined();
            expect(getValue({ key1: { key2: { key3: "value3" } } }, "key1.key2.key3")).toEqual(
                "value3",
            );
            expect(
                getValue({ key1: { key2: { key3: "value3" } } }, "key1.keyWrong.key3"),
            ).not.toBeDefined();
            expect(
                getValue({ key1: { key2: { key3: "value3" } } }, "key1.key2.keyWrong"),
            ).not.toBeDefined();

            expect(getValue({ "key1.key2": { key3: "value3" } }, "key1.key2.key3")).toEqual(
                "value3",
            );
            expect(getValue({ key1: { "key2.key3": "value3" } }, "key1.key2.key3")).toEqual(
                "value3",
            );
            expect(getValue({ "key1.key2.key3": "value3" }, "key1.key2.key3")).toEqual("value3");
            expect(
                getValue({ "key1.key2": { key3: "value3" } }, "key1.key2.keyWrong"),
            ).not.toBeDefined();
            expect(
                getValue(
                    {
                        key1: "value1",
                        "key1.key2": "value2",
                    },
                    "key1.key2",
                ),
            ).toEqual("value2");

            expect(getValue({ "key1.key2": { key3: "value3" } }, "key1.key2")).toEqual({
                key3: "value3",
            });
        });

        it("should handle edge cases", () => {
            // strange cases that are currently permitted but make little sense
            expect(getValue(["A", "B", "C"], "1")).toEqual("B");
            expect(getValue(["A", ["a", "b", "c"], "C"], "1.2")).toEqual("c");

            expect(getValue("test", "key")).not.toBeDefined();
        });
    });

    describe("isDict()", () => {
        it("should accept objects as dictionaries", () => {
            expect(isDict({ a: "b" })).toEqual(true);
            expect(isDict({})).toEqual(true);

            expect(isDict(null)).toEqual(false);
            expect(isDict([])).toEqual(false);
            expect(isDict(123)).toEqual(false);
            expect(isDict("asd")).toEqual(false);
        });
    });

    describe("isArray()", () => {
        it("should accept objects as dictionaries", () => {
            expect(isArray([1, 2, 3])).toEqual(true);
            expect(isArray(["a", "b", "c"])).toEqual(true);
            expect(isArray([])).toEqual(true);

            expect(isArray(null)).toEqual(false);
            expect(isArray({})).toEqual(false);
            expect(isArray({ a: 123 })).toEqual(false);
            expect(isArray(123)).toEqual(false);
            expect(isArray("asd")).toEqual(false);
        });
    });

    describe("isDefinedAndNotNull()", () => {
        it("should return true for defined and non-null values", () => {
            expect(isDefinedAndNotNull(0)).toEqual(true);
            expect(isDefinedAndNotNull("")).toEqual(true);
            expect(isDefinedAndNotNull(false)).toEqual(true);
            expect(isDefinedAndNotNull([])).toEqual(true);
            expect(isDefinedAndNotNull({})).toEqual(true);
            expect(isDefinedAndNotNull("test")).toEqual(true);
            expect(isDefinedAndNotNull(123)).toEqual(true);
        });

        it("should return false for null or undefined values", () => {
            expect(isDefinedAndNotNull(null)).toEqual(false);
            expect(isDefinedAndNotNull(undefined)).toEqual(false);
        });
    });

    describe("isDefined()", () => {
        it("should return true for defined values including null", () => {
            expect(isDefined(0)).toEqual(true);
            expect(isDefined("")).toEqual(true);
            expect(isDefined(false)).toEqual(true);
            expect(isDefined([])).toEqual(true);
            expect(isDefined({})).toEqual(true);
            expect(isDefined("test")).toEqual(true);
            expect(isDefined(123)).toEqual(true);
            expect(isDefined(null)).toEqual(true);
        });

        it("should return false for undefined values", () => {
            expect(isDefined(undefined)).toEqual(false);
        });
    });

    describe("isObject()", () => {
        it("should return true for objects", () => {
            expect(isObject({})).toEqual(true);
            expect(isObject({ a: 1 })).toEqual(true);
            expect(isObject([])).toEqual(true);
            expect(isObject([1, 2, 3])).toEqual(true);
        });

        it("should return false for non-objects", () => {
            expect(isObject(null)).toEqual(false);
            expect(isObject(undefined)).toEqual(false);
            expect(isObject("string")).toEqual(false);
            expect(isObject(123)).toEqual(false);
            expect(isObject(true)).toEqual(false);
            expect(isObject(false)).toEqual(false);
        });
    });

    describe("isString()", () => {
        it("should return true for strings", () => {
            expect(isString("")).toEqual(true);
            expect(isString("test")).toEqual(true);
            expect(isString("123")).toEqual(true);
        });

        it("should return false for non-strings", () => {
            expect(isString(123)).toEqual(false);
            expect(isString(true)).toEqual(false);
            expect(isString(false)).toEqual(false);
            expect(isString(null)).toEqual(false);
            expect(isString(undefined)).toEqual(false);
            expect(isString({})).toEqual(false);
            expect(isString([])).toEqual(false);
        });
    });

    describe("isFunction()", () => {
        it("should return true for functions", () => {
            expect(isFunction(() => "test")).toEqual(true);
            expect(
                isFunction(function () {
                    return "test";
                }),
            ).toEqual(true);
            expect(isFunction(Array.isArray)).toEqual(true);
            expect(isFunction(console.log)).toEqual(true);
        });

        it("should return false for non-functions", () => {
            expect(isFunction("string")).toEqual(false);
            expect(isFunction(123)).toEqual(false);
            expect(isFunction(true)).toEqual(false);
            expect(isFunction(null)).toEqual(false);
            expect(isFunction(undefined)).toEqual(false);
            expect(isFunction({})).toEqual(false);
            expect(isFunction([])).toEqual(false);
        });
    });

    describe("setValue()", () => {
        it("should set values using dot notation on existing nested structure", () => {
            const target = { a: { b: { c: "old" } } };
            setValue(target, "a.b.c", "value");
            expect(target).toEqual({ a: { b: { c: "value" } } });
        });

        it("should overwrite existing values", () => {
            const target = { a: { b: { c: "old" } } };
            setValue(target, "a.b.c", "new");
            expect(target).toEqual({ a: { b: { c: "new" } } });
        });

        it("should handle single key", () => {
            const target = {};
            setValue(target, "key", "value");
            expect(target).toEqual({ key: "value" });
        });

        it("should handle empty key path", () => {
            const target = {};
            setValue(target, "", "value");
            expect(target).toEqual({ "": "value" });
        });

        it("should handle existing partial structure", () => {
            const target: Record<string, unknown> = { a: { b: {} } };
            setValue(target, "a.b.c", "value");
            expect(target).toEqual({ a: { b: { c: "value" } } });
        });
    });

    describe("insertValue()", () => {
        it("should insert values using dot notation without modifying original", () => {
            const target = { a: { b: "existing" } };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = insertValue(target, "a.c", "new") as any;

            expect(result.a.b).toEqual("existing");
            expect(result.a.c).toEqual("new");
            expect(target).toEqual({ a: { b: "existing" } }); // Original unchanged
        });

        it("should handle deep nesting", () => {
            const target = {};
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = insertValue(target, "a.b.c.d", "value") as any;

            expect(result.a.b.c.d).toEqual("value");
            expect(target).toEqual({}); // Original unchanged
        });

        it("should merge with existing nested objects", () => {
            const target = { a: { b: { x: 1 } } };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = insertValue(target, "a.b.y", 2) as any;

            expect(result.a.b.x).toEqual(1);
            expect(result.a.b.y).toEqual(2);
            expect(target).toEqual({ a: { b: { x: 1 } } }); // Original unchanged
        });

        it("should handle single key", () => {
            const target = { existing: "value" };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = insertValue(target, "new", "newValue") as any;

            expect(result.existing).toEqual("value");
            expect(result.new).toEqual("newValue");
            expect(target).toEqual({ existing: "value" }); // Original unchanged
        });

        it("should overwrite existing values", () => {
            const target = { a: { b: "old" } };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = insertValue(target, "a.b", "new") as any;

            expect(result.a.b).toEqual("new");
            expect(target).toEqual({ a: { b: "old" } }); // Original unchanged
        });
    });
});

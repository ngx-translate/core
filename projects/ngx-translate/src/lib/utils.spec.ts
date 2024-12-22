import {equals, getValue, isArray, isDict, mergeDeep} from "./util";


describe("Utils", () =>
{

  describe("deepMerge", () =>
  {

    it("should merge properties from source into target", () =>
    {
      const target = {a: 1, b: 2};
      const source = {b: 3, c: 4};
      const result = mergeDeep(target, source);

      expect(result).toEqual({a: 1, b: 3, c: 4});
    });

    it("should merge nested objects", () =>
    {
      const target = {a: {b: 2}};
      const source = {a: {c: 3}};
      const result = mergeDeep(target, source);

      expect(result).toEqual({a: {b: 2, c: 3}});
    });

    it("should not modify the original target object", () =>
    {
      const target = {a: {b: 2}};
      const source = {a: {c: 3}};
      const result = mergeDeep(target, source);

      expect(result).not.toBe(target);
      expect(target).toEqual({a: {b: 2}}); // Ensure target is unchanged
    });

    it("should handle non-object properties in source", () =>
    {
      const target = {a: {b: 2}};
      const source = {a: 3};
      const result = mergeDeep(target, source);

      expect(result).toEqual({a: 3});
    });

    it("should handle non-object properties in target", () =>
    {
      const target = {a: 2};
      const source = {a: {b: 3}};
      const result = mergeDeep(target, source);

      expect(result).toEqual({a: {b: 3}});
    });

    it("should handle merging of arrays", () =>
    {
      const target = {a: [1, 2, 3]};
      const source = {a: [4, 5]};
      const result = mergeDeep(target, source);

      expect(result).toEqual({a: [4, 5]});
    });

    it("should merge deeply nested objects", () =>
    {
      const target = {a: {b: {c: 1}}};
      const source = {a: {b: {d: 2}}};
      const result = mergeDeep(target, source);

      expect(result).toEqual({a: {b: {c: 1, d: 2}}});
    });

    it("should add new properties from the source if they do not exist in the target", () =>
    {
      const target = {a: 1};
      const source = {b: 2};
      const result = mergeDeep(target, source);

      expect(result).toEqual({a: 1, b: 2});
    });

    it("should handle empty target object", () =>
    {
      const target = {};
      const source = {a: 1, b: {c: 2}};
      const result = mergeDeep(target, source);

      expect(result).toEqual({a: 1, b: {c: 2}});
    });

    it("should handle empty source object", () =>
    {
      const target = {a: 1, b: 2};
      const source = {};
      const result = mergeDeep(target, source);

      expect(result).toEqual({a: 1, b: 2});
    });

  });

  describe("equals", () =>
  {


    it("should return true for strictly equal primitives", () =>
    {
      expect(equals(1, 1)).toBeTrue();
      expect(equals("test", "test")).toBeTrue();
      expect(equals(true, true)).toBeTrue();
    });

    it("should return false for different primitives", () =>
    {
      expect(equals(1, 2)).toBeFalse();
      expect(equals("test", "other")).toBeFalse();
      expect(equals(true, false)).toBeFalse();
    });

    it("should return true for null comparisons", () =>
    {
      expect(equals(null, null)).toBeTrue();
    });

    it("should return false if one value is null", () =>
    {
      expect(equals(null, 1)).toBeFalse();
      expect(equals({}, null)).toBeFalse();
    });

    it("should return true for NaN comparisons", () =>
    {
      expect(equals(NaN, NaN)).toBeTrue();
    });

    it("should return true for equal arrays", () =>
    {
      expect(equals([1, 2, 3], [1, 2, 3])).toBeTrue();
      expect(equals([], [])).toBeTrue();
    });

    it("should return false for arrays of different lengths", () =>
    {
      expect(equals([1, 2], [1, 2, 3])).toBeFalse();
    });

    it("should return false for arrays with different elements", () =>
    {
      expect(equals([1, 2, 3], [1, 2, 4])).toBeFalse();
    });

    it("should return true for deeply nested arrays", () =>
    {
      expect(equals([1, [2, [3]]], [1, [2, [3]]])).toBeTrue();
    });

    it("should return true for equal objects", () =>
    {
      expect(equals({a: 1, b: 2}, {a: 1, b: 2})).toBeTrue();
    });

    it("should return false for objects with different properties", () =>
    {
      expect(equals({a: 1, b: 2}, {a: 1, c: 3})).toBeFalse();
    });

    it("should use strictly equal comparison", () =>
    {
      expect(equals({a: 1}, {a: "1"})).toBeFalse();
    });

    it("should return false for objects with different property values", () =>
    {
      expect(equals({a: 1, b: 2}, {a: 1, b: 3})).toBeFalse();
    });

    it("should return true for deeply nested objects", () =>
    {
      expect(equals({a: {b: {c: 1}}}, {a: {b: {c: 1}}})).toBeTrue();
    });

    it("should return false for objects and arrays", () =>
    {
      expect(equals({a: 1}, [1])).toBeFalse();
    });

    it("should return false for arrays and objects", () =>
    {
      expect(equals([1], {0: 1})).toBeFalse();
    });

    it("should handle undefined properties correctly", () =>
    {
      expect(equals({a: 1, b: undefined}, {a: 1})).toBeTrue();
      expect(equals({a: 1}, {a: 1, b: undefined})).toBeTrue();
      expect(equals({a: 1, b: 2}, {a: 1, b: undefined})).toBeFalse();
    });

    it("should return false when o2 has a property not present in o1", () =>
    {
      const o1 = {a: 1, b: 2};
      const o2 = {a: 1, b: 2, c: 3}; // `c` is not present in `o1`

      expect(equals(o1, o2)).toBeFalse();
    });

  });


  describe('getValue()', () => {
    it('should get the addressed value', () => {

      expect(getValue({key1: {key2: "value2"}}, 'key1.key2')).toEqual("value2");
      expect(getValue({key1: {key2: "value"}}, 'keyWrong.key2')).not.toBeDefined();
      expect(getValue({key1: {key2: {key3: "value3"}}}, 'key1.key2.key3')).toEqual("value3");
      expect(getValue({key1: {key2: {key3: "value3"}}}, 'key1.keyWrong.key3')).not.toBeDefined();
      expect(getValue({key1: {key2: {key3: "value3"}}}, 'key1.key2.keyWrong')).not.toBeDefined();


      expect(getValue({'key1.key2': {key3: "value3"}}, 'key1.key2.key3')).toEqual("value3");
      expect(getValue({key1: {'key2.key3': "value3"}}, 'key1.key2.key3')).toEqual("value3");
      expect(getValue({'key1.key2.key3': "value3"}, 'key1.key2.key3')).toEqual("value3");
      expect(getValue({'key1.key2': {key3: "value3"}}, 'key1.key2.keyWrong')).not.toBeDefined();
      expect(getValue({
        'key1': "value1",
        'key1.key2': "value2"
      }, 'key1.key2')).toEqual("value2");
      expect(getValue({
        'key1': {'key3': "value1"},
        'key1.key2': "value2"
      }, 'key1.key2')).toEqual("value2");
      expect(getValue({
        'key1': ["a","b","c"],
        'key1.key2': "value2"
      }, 'key1.key2')).toEqual("value2");

      expect(getValue({'key1.key2': {key3: "value3"}}, 'key1.key2')).toEqual({key3: "value3"});
    });


    it('should handle edge cases', () => {

      // strange cases that are currently permitted but don't make much sense
      expect(getValue(['A', 'B', 'C'], '1')).toEqual("B");
      expect(getValue(['A', ['a', 'b', 'c'], 'C'], '1.2')).toEqual("c");

      expect(getValue("test", 'key')).not.toBeDefined();

      expect(getValue("test", '1')).toEqual("e"); /// useless: substring
    })

  });

  describe('isDict()', () =>
  {
    it('should accept objects as dictionaries', () =>
    {
      expect(isDict({a: "b"})).toEqual(true);
      expect(isDict({})).toEqual(true);

      expect(isDict(null)).toEqual(false);
      expect(isDict([])).toEqual(false);
      expect(isDict(123)).toEqual(false);
      expect(isDict("asd")).toEqual(false);
    }) ;
  });

  describe('isArray()', () =>
  {
    it('should accept objects as dictionaries', () =>
    {
      expect(isArray([1,2,3])).toEqual(true);
      expect(isArray(["a","b","c"])).toEqual(true);
      expect(isArray([])).toEqual(true);

      expect(isArray(null)).toEqual(false);
      expect(isArray({})).toEqual(false);
      expect(isArray({a:123})).toEqual(false);
      expect(isArray(123)).toEqual(false);
      expect(isArray("asd")).toEqual(false);
    }) ;
  });

});

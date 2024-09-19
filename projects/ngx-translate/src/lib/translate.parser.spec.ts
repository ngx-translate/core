import {TranslateDefaultParser, TranslateParser} from "../public-api";

describe('Parser', () => {
  let parser: TranslateParser;

  beforeEach(() => {
    parser = new TranslateDefaultParser();
  });

  it('is defined', () => {
    expect(TranslateParser).toBeDefined();
    expect(parser instanceof TranslateParser).toBeTruthy();
  });

  describe('interpolate()', () => {

    it('should interpolate strings', () => {
      expect(parser.interpolate("This is a {{ key }}", {key: "value"})).toEqual("This is a value");
    });

    it('should interpolate strings with falsy values', () => {
      expect(parser.interpolate("This is a {{ key }}", {key: ""})).toEqual("This is a ");
      expect(parser.interpolate("This is a {{ key }}", {key: 0})).toEqual("This is a 0");
    });

    it('should interpolate strings with object properties', () => {
      expect(parser.interpolate("This is a {{ key1.key2 }}", {key1: {key2: "value2"}})).toEqual("This is a value2");
      expect(parser.interpolate("This is a {{ key1.key2.key3 }}", {key1: {key2: {key3: "value3"}}})).toEqual("This is a value3");
    });

    it('should interpolate strings with arrays', () => {
      expect(parser.interpolate("This is a {{ key.0 }}", {key: ["A", "B", "C"]})).toEqual("This is a A");
      expect(parser.interpolate("This is a {{ key.11 }}", {key: ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"]})).toEqual("This is a L");
      expect(parser.interpolate("This is a {{ key.1.x }}", {key: ["A", {x: "B"}]})).toEqual("This is a B");
    });

    it('should support interpolation functions', () => {
      expect(parser.interpolate((v: string) => v.toUpperCase() + ' YOU!', 'bless')).toBe('BLESS YOU!');
    });

    it('should handle edge cases: array', () => {
      expect(parser.interpolate("This is an array {{ key1.key2 }}", {key1: {key2: ['A', 'B', 'C']}})).toEqual("This is an array A,B,C");
    });

    it('should handle edge cases: bool', () => {
      expect(parser.interpolate("This is a bool: {{ key1.key2 }}", {key1: {key2: true}})).toEqual("This is a bool: true");
    });

    it('should handle edge cases: object', () => {
      expect(parser.interpolate("This is a {{ key1.key2 }}", {key1: {key2: {key3: "value3"}}})).toEqual("This is a [object Object]");
    });

    it('should handle edge cases: object', () => {
      const object = {
        toString: () => "OBJECT A"
      }
      expect(parser.interpolate("This is {{ key1.key2 }}", {key1: {key2: object}})).toEqual("This is OBJECT A");
    });

  })


});

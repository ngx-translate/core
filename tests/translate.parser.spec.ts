import {Parser} from '../src/translate.parser';

export function main() {
    describe('Parser', () => {
        let parser: Parser;

        beforeEach(() => { parser = new Parser(); });

        it('is defined', () => {
            expect(Parser).toBeDefined();

            expect(parser instanceof Parser).toBeTruthy();
        });

        it('should interpolate', () => {
            expect(parser.interpolate("This is a {{ key }}", {key: "value"})).toEqual("This is a value");
        });

        it('should interpolate with object properties', () => {
            expect(parser.interpolate("This is a {{ key1.key2 }}", {key1: {key2: "value2"}})).toEqual("This is a value2");
            expect(parser.interpolate("This is a {{ key1.key2.key3 }}", {key1: {key2: {key3: "value3"}}})).toEqual("This is a value3");
        });

        it('should be able to flatten objects', () => {
            expect(parser.flattenObject({key1: {key2: "value2"}})).toEqual({"key1.key2": "value2"});
            expect(parser.flattenObject({key1: {key2: {key3: "value3"}}})).toEqual({"key1.key2.key3": "value3"});
        });
    });
}
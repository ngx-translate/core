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

        it('should get the addressed value', () => {
            expect(parser.getValue({key1: {key2: "value2"}}, 'key1.key2')).toEqual("value2");
            expect(parser.getValue({key1: {key2: "value"}}, 'keyWrong.key2')).not.toBeDefined();
            expect(parser.getValue({key1: {key2: {key3: "value3"}}}, 'key1.key2.key3')).toEqual("value3");
            expect(parser.getValue({key1: {key2: {key3: "value3"}}}, 'key1.keyWrong.key3')).not.toBeDefined();
            expect(parser.getValue({key1: {key2: {key3: "value3"}}}, 'key1.key2.keyWrong')).not.toBeDefined();


            expect(parser.getValue({'key1.key2': {key3: "value3"}}, 'key1.key2.key3')).toEqual("value3");
            expect(parser.getValue({key1: {'key2.key3': "value3"}}, 'key1.key2.key3')).toEqual("value3");
            expect(parser.getValue({'key1.key2.key3': "value3"}, 'key1.key2.key3')).toEqual("value3");
            expect(parser.getValue({'key1.key2': {key3: "value3"}}, 'key1.key2.keyWrong')).not.toBeDefined();

        });
    });
}
import {Parser} from '../src/translate.parser';
import {unescape} from "querystring";

describe('Parser', () => {
    let parser: Parser;

    beforeEach(() => {
        parser = new Parser();
    });

    it('is defined', () => {
        expect(Parser).toBeDefined();

        expect(parser instanceof Parser).toBeTruthy();
    });

    it('should interpolate', () => {
        expect(parser.interpolate("This is a {{ key }}", {key: "value"})).toEqual("This is a value");
    });

    it('should interpolate with falsy values', () => {
        expect(parser.interpolate("This is a {{ key }}", {key: ""})).toEqual("This is a ");
        expect(parser.interpolate("This is a {{ key }}", {key: 0})).toEqual("This is a 0");
        expect(parser.interpolate("This is a {{ key }}", {key: null})).toEqual("This is a null");
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
        expect(parser.getValue({
            'key1': "value1",
            'key1.key2': "value2"
        }, 'key1.key2')).toEqual("value2");

    });

    it('should interpolate using pluralization rules', () => {
        expect(parser.interpolate("I have {{key}} cat{{@key(|s)}}", {key: 1}, (value: any) => {
            return value === 1 ? 0 : 1;
        })).toEqual("I have 1 cat");
        expect(parser.interpolate("I have {{key}} cat{{@key(|s)}}", {key: 2}, (value: any) => {
            return value === 1 ? 0 : 1;
        })).toEqual("I have 2 cats");
        expect(parser.interpolate("I have {{key.key2}} cat{{@key.key2(|s)}}", {key: {key2: 2}}, (value: any) => {
            return value === 1 ? 0 : 1;
        })).toEqual("I have 2 cats");
        expect(parser.interpolate("I have {{key}} cat{{@key(|s)}}", {key: 2}, (value: any): any => {
            return undefined;
        })).toEqual("I have 2 cat");
        expect(parser.interpolate("I have {{key}} cat{{@key(|s)}}", {key: 2})).toEqual("I have 2 cat");
        expect(parser.interpolate("I have {{key}} cat{{@key2(|s)}}", {key: 2}, (value: any) => {
            return value === 1 ? 0 : 1;
        })).toEqual("I have 2 cat{{@key2(|s)}}");
        expect(parser.interpolate("I have {{key}} cat{{@key(|s)}}", {key: 2}, (value: any) => {
            return 3;
        })).toEqual("I have 2 cat");

        // Polish language examples
        expect(parser.interpolate("Mam {{key}} {{@key(kota|koty|kotów)}}", {key: 13}, (value: any) => {
            value = parseInt(value);
            if (isNaN(value)) return undefined;
            value = Math.abs(value);

            if (value === 1) {
                return 0;
            } else if (value % 10 <= 1 || value % 10 >= 5 || (value % 100 >= 11 && value % 100 <= 19)) {
                return 2;
            } else {
                return 1;
            }
        })).toEqual("Mam 13 kotów");
        expect(parser.interpolate("Mam {{key}} {{@key(kota|koty|kotów)}}", {key: 23}, (value: any) => {
            value = parseInt(value);
            if (isNaN(value)) return undefined;
            value = Math.abs(value);

            if (value === 1) {
                return 0;
            } else if (value % 10 <= 1 || value % 10 >= 5 || (value % 100 >= 11 && value % 100 <= 19)) {
                return 2;
            } else {
                return 1;
            }
        })).toEqual("Mam 23 koty");
    });
});

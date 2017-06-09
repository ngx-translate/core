import {TranslateParser, TranslateDefaultParser} from '../index';

describe('Parser', () => {
    let parser: TranslateParser;

    beforeEach(() => {
        parser = new TranslateDefaultParser();
    });

    it('is defined', () => {
        expect(TranslateParser).toBeDefined();

        expect(parser instanceof TranslateParser).toBeTruthy();
    });

    it('should parse', () => {
        expect(parser.parse({token: "This is a {{ key }}"}, 'token', {key: "value"})).toEqual("This is a value");
    });

    it('should parse with falsy values', () => {
        expect(parser.parse({token: "This is a {{ key }}"}, 'token', {key: ""})).toEqual("This is a ");
        expect(parser.parse({token: "This is a {{ key }}"}, 'token', {key: 0})).toEqual("This is a 0");
    });

    it('should parse with object properties', () => {
        expect(parser.parse({token: "This is a {{ key1.key2 }}"}, 'token', {key1: {key2: "value2"}})).toEqual("This is a value2");
        expect(parser.parse({token: "This is a {{ key1.key2.key3 }}"}, 'token', {key1: {key2: {key3: "value3"}}})).toEqual("This is a value3");
    });

    it('should get the addressed value', () => {
        expect(parser.parse({key1: {key2: "value2"}}, 'key1.key2')).toEqual("value2");
        expect(parser.parse({key1: {key2: "value"}}, 'keyWrong.key2')).not.toBeDefined();
        expect(parser.parse({key1: {key2: {key3: "value3"}}}, 'key1.key2.key3')).toEqual("value3");
        expect(parser.parse({key1: {key2: {key3: "value3"}}}, 'key1.keyWrong.key3')).not.toBeDefined();
        expect(parser.parse({key1: {key2: {key3: "value3"}}}, 'key1.key2.keyWrong')).not.toBeDefined();


        expect(parser.parse({'key1.key2': {key3: "value3"}}, 'key1.key2.key3')).toEqual("value3");
        expect(parser.parse({key1: {'key2.key3': "value3"}}, 'key1.key2.key3')).toEqual("value3");
        expect(parser.parse({'key1.key2.key3': "value3"}, 'key1.key2.key3')).toEqual("value3");
        expect(parser.parse({'key1.key2': {key3: "value3"}}, 'key1.key2.keyWrong')).not.toBeDefined();
        expect(parser.parse({
            'key1': "value1",
            'key1.key2': "value2"
        }, 'key1.key2')).toEqual("value2");

    });
});

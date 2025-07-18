import {
    getValue,
    InterpolateFunction,
    TranslateDefaultParser,
    TranslateParser,
} from "../public-api";

describe("Parser", () => {
    let parser: TranslateParser;

    beforeEach(() => {
        parser = new TranslateDefaultParser();
    });

    describe("interpolate()", () => {
        it("should interpolate strings", () => {
            expect(parser.interpolate("This is a {{ key }}", { key: "value" })).toEqual(
                "This is a value",
            );
        });

        it("should interpolate strings with falsy values", () => {
            expect(parser.interpolate("This is a {{ key }}", { key: "" })).toEqual("This is a ");
            expect(parser.interpolate("This is a {{ key }}", { key: 0 })).toEqual("This is a 0");
        });

        it("should interpolate strings with object properties", () => {
            expect(
                parser.interpolate("This is a {{ key1.key2 }}", { key1: { key2: "value2" } }),
            ).toEqual("This is a value2");
            expect(
                parser.interpolate("This is a {{ key1.key2.key3 }}", {
                    key1: { key2: { key3: "value3" } },
                }),
            ).toEqual("This is a value3");
        });

        it("should support interpolation functions", () => {
            const uc: InterpolateFunction = (params) => {
                return (getValue(params, "x") as string)?.toUpperCase() + " YOU!";
            };

            expect(parser.interpolate(uc, { x: "bless" })).toEqual("BLESS YOU!");
        });

        it("should handle edge cases: value not found", () => {
            expect(
                parser.interpolate("This is an array {{ key1.key2 }}", {
                    key1: { key3: ["A", "B", "C"] },
                }),
            ).toEqual("This is an array {{ key1.key2 }}");
        });

        it("should handle edge cases: array", () => {
            expect(
                parser.interpolate("This is an array {{ key1.key2 }}", {
                    key1: { key2: ["A", "B", "C"] },
                }),
            ).toEqual("This is an array A, B, C");
        });

        it("should handle edge cases: null", () => {
            expect(parser.interpolate("This is {{ key1.key2 }}", { key1: { key2: null } })).toEqual(
                "This is null",
            );
        });

        it("should handle edge cases: bool", () => {
            expect(
                parser.interpolate("This is a bool: {{ key1.key2 }}", { key1: { key2: true } }),
            ).toEqual("This is a bool: true");
        });

        it("should handle edge cases: object", () => {
            expect(
                parser.interpolate("Object value: {{ key1.key2 }}", {
                    key1: { key2: { key3: "value3" } },
                }),
            ).toEqual('Object value: {"key3":"value3"}');
        });

        it("should handle edge cases: object with custom toString", () => {
            const object = {
                toString: () => "OBJECT A",
            };
            expect(
                parser.interpolate("This is {{ key1.key2 }}", { key1: { key2: object } }),
            ).toEqual("This is OBJECT A");
        });

        it("should return undefined for non-string and non-function expressions", () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            expect(parser.interpolate(123 as any)).toBeUndefined();

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            expect(parser.interpolate(null as any)).toBeUndefined();

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            expect(parser.interpolate({} as any)).toBeUndefined();

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            expect(parser.interpolate([] as any)).toBeUndefined();

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            expect(parser.interpolate(true as any)).toBeUndefined();
        });
    });
});

import { _ } from "../lib/extraction-marker";

describe("Extraction Marker", () => {
    describe("_ function", () => {
        it("should return the same string key", () => {
            const key = "test.key";
            const result = _(key);
            expect(result).toBe(key);
        });

        it("should return the same string array", () => {
            const keys = ["test.key1", "test.key2"];
            const result = _(keys);
            expect(result).toBe(keys);
            expect(result).toEqual(keys);
        });

        it("should handle empty string", () => {
            const key = "";
            const result = _(key);
            expect(result).toBe(key);
        });

        it("should handle empty array", () => {
            const keys: string[] = [];
            const result = _(keys);
            expect(result).toBe(keys);
            expect(result).toEqual(keys);
        });

        it("should handle single element array", () => {
            const keys = ["single.key"];
            const result = _(keys);
            expect(result).toBe(keys);
            expect(result).toEqual(keys);
        });
    });
});

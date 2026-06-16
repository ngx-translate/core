import { TestBed } from "@angular/core/testing";
import {
    DeepKeys,
    provideTranslateLoader,
    TranslatePipe,
    TranslateService,
    TranslationObject,
} from "../public-api";
import { FakeLoader, provideTestableTranslateService } from "./test-helpers";

/**
 * Compile-time type-equality assertion. `Equal<A, B>` is `true` only when `A`
 * and `B` are mutually assignable, so a wrong `DeepKeys` result fails the build.
 */
type Equal<A, B> =
    (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

const translations: TranslationObject = { a: "A", b: { a: "BA", b: "BB" }, c: "C" };
type MyKeys = "a" | "b.a" | "b.b" | "c";

/**
 * These tests are validated primarily at COMPILE time: the `@ts-expect-error`
 * lines fail the build if the key-space stops being enforced, and the `Equal<>`
 * assertions fail if `DeepKeys` derives the wrong union. The jasmine assertions
 * only confirm the typed keys still resolve at runtime.
 */
describe("Typed translation keys", () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideTestableTranslateService({ loader: provideTranslateLoader(FakeLoader) }),
                { provide: TranslatePipe, useClass: TranslatePipe },
            ],
        });
    });

    describe("TranslateService<Key> — per-instance generic", () => {
        it("accepts in-union keys and rejects out-of-union keys", () => {
            const translate = TestBed.inject<TranslateService<MyKeys>>(TranslateService<MyKeys>);
            translate.use("en");
            translate.setTranslation("en", translations, true);

            // In-union keys: every key-accepting method compiles.
            translate.instant("a");
            translate.get("b.a");
            translate.stream("b.b");
            translate.getStreamOnTranslationChange("c");
            translate.translate("a");
            translate.translate(["a", "c"]);
            translate.getParsedResult("b.a");
            translate.set("a", "A");

            // @ts-expect-error - "c.c" is not a declared key
            translate.get("c.c");
            // @ts-expect-error - "b" is an intermediate object, not a leaf key
            translate.instant("b");
            // @ts-expect-error - arrays are key-checked element-wise
            translate.get(["a", "nope"]);
            // @ts-expect-error - set() is key-checked too
            translate.set("nope", "X");
            // @ts-expect-error - stream() is key-checked
            translate.stream("nope");
            // @ts-expect-error - getStreamOnTranslationChange() is key-checked
            translate.getStreamOnTranslationChange("b");
            // @ts-expect-error - translate() is key-checked
            translate.translate("nope");
            // @ts-expect-error - translate() arrays are key-checked element-wise
            translate.translate(["a", "nope"]);
            // @ts-expect-error - getParsedResult() is key-checked
            translate.getParsedResult("c.c");

            expect(translate.instant("a")).toBe("A");
        });

        it("keeps the parent/root chain typed to the same key-space", () => {
            const translate = TestBed.inject<TranslateService<MyKeys>>(TranslateService<MyKeys>);
            const root: TranslateService<MyKeys> = translate.getRoot();
            const parent: TranslateService<MyKeys> | null = translate.getParent();

            expect(root).toBe(translate);
            expect(parent).toBeNull();
        });
    });

    describe("TranslatePipe<Key> — per-instance generic", () => {
        it("accepts in-union keys and rejects out-of-union keys", () => {
            const translate = TestBed.inject<TranslateService<MyKeys>>(TranslateService<MyKeys>);
            const pipe = TestBed.inject<TranslatePipe<MyKeys>>(TranslatePipe<MyKeys>);
            translate.use("en");
            translate.setTranslation("en", translations, true);

            pipe.transform("a");
            pipe.transform("b.a");

            // @ts-expect-error - "c.c" is not a declared key
            pipe.transform("c.c");
            // @ts-expect-error - "b" is an intermediate object, not a leaf key
            pipe.transform("b");

            expect(pipe.transform("b.a")).toBe("BA");
        });
    });

    describe("Backward compatibility — default key type is string", () => {
        it("accepts arbitrary string keys when no generic is supplied", () => {
            const translate = TestBed.inject(TranslateService);
            translate.use("en");
            translate.setTranslation("en", translations, true);

            // Any string is allowed, so existing apps keep compiling unchanged.
            translate.instant("any.key.at.all");
            translate.get(["whatever", "you.like"]);
            translate.set("dynamic", "value");

            expect(translate.instant("a")).toBe("A");
        });
    });

    describe("DeepKeys — dotted leaf paths from a translation shape", () => {
        interface Sample {
            a: "A";
            b: { a: "BA"; b: "BB" };
            c: "C";
        }

        it("derives the leaf-path union", () => {
            const isLeafUnion: Equal<DeepKeys<Sample>, MyKeys> = true;
            expect(isLeafUnion).toBe(true);
        });

        it("excludes intermediate object paths", () => {
            const leaf: DeepKeys<Sample> = "b.a";
            // @ts-expect-error - "b" is an intermediate object, not a leaf path
            const intermediate: DeepKeys<Sample> = "b";

            expect(leaf).toBe("b.a");
            expect(intermediate).toBe("b");
        });

        it("treats array and non-string-primitive values as leaf keys", () => {
            // ngx-translate supports array translation values; they are
            // translated under their own key, not indexed into. Primitives
            // (number/boolean) and optional members must also survive as leaves.
            interface WithArrayAndPrimitives {
                bullets: string[];
                count: number;
                home: { title: "Home" };
                maybe?: string;
            }
            type Expected = "bullets" | "count" | "home.title" | "maybe";

            const isLeafUnion: Equal<DeepKeys<WithArrayAndPrimitives>, Expected> = true;
            const arrayKey: DeepKeys<WithArrayAndPrimitives> = "bullets";
            // @ts-expect-error - "bullets.0" is not a key: arrays are leaves, not indexed
            const indexed: DeepKeys<WithArrayAndPrimitives> = "bullets.0";

            expect(isLeafUnion).toBe(true);
            expect(arrayKey).toBe("bullets");
            expect(indexed).toBe("bullets.0");
        });
    });
});

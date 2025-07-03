import { TestBed } from "@angular/core/testing";
import { Observable, of } from "rxjs";
import {
    MissingTranslationHandler,
    MissingTranslationHandlerParams,
    provideTranslateService,
    TranslateLoader,
    TranslateService,
    StrictTranslation,
    TranslationObject,
    Translation,
} from "../public-api";
import { Injectable, Type } from "@angular/core";

let translations: TranslationObject = { TEST: "This is a test" };
const fakeTranslation: TranslationObject = { NOT_USED: "not used" };

@Injectable()
class FakeLoader implements TranslateLoader {
    getTranslation(lang: string): Observable<TranslationObject> {
        if (lang === "fake") {
            return of(fakeTranslation);
        }

        return of(translations);
    }
}

describe("MissingTranslationHandler", () => {
    let translate: TranslateService;
    let missingTranslationHandler: MissingTranslationHandler;

    @Injectable()
    class Missing implements MissingTranslationHandler {
        handle(params: MissingTranslationHandlerParams) {
            void params;
            return "handled";
        }
    }

    @Injectable()
    class MissingObs implements MissingTranslationHandler {
        handle(params: MissingTranslationHandlerParams): Observable<StrictTranslation> {
            return of(`handled: ${params.key}`);
        }
    }

    const prepare = (handlerClass: Type<MissingTranslationHandler>, defaultLang = true) => {
        TestBed.configureTestingModule({
            providers: [
                provideTranslateService({
                    loader: { provide: TranslateLoader, useClass: FakeLoader },
                    missingTranslationHandler: {
                        provide: MissingTranslationHandler,
                        useClass: handlerClass,
                    },
                    useDefaultLang: defaultLang,
                }),
            ],
        });
        translate = TestBed.inject(TranslateService);
        missingTranslationHandler = TestBed.inject(MissingTranslationHandler);
    };

    afterEach(() => {
        translations = { TEST: "This is a test" };
    });

    it("should use the MissingTranslationHandler when the key does not exist", () => {
        prepare(Missing);
        translate.use("en");
        spyOn(missingTranslationHandler, "handle").and.callThrough();

        translate.get("nonExistingKey").subscribe((res: Translation) => {
            expect(missingTranslationHandler.handle).toHaveBeenCalledWith(
                jasmine.objectContaining({ key: "nonExistingKey" }),
            );
            //test that the instance of the last called argument is string
            expect(res).toEqual("handled");
        });
    });

    it("should propagate interpolation params when the key does not exist", () => {
        prepare(Missing);
        translate.use("en");
        spyOn(missingTranslationHandler, "handle").and.callThrough();
        const interpolateParams = { some: "params" };

        translate.get("nonExistingKey", interpolateParams).subscribe((res: Translation) => {
            expect(missingTranslationHandler.handle).toHaveBeenCalledWith(
                jasmine.objectContaining({ interpolateParams: interpolateParams }),
            );
            //test that the instance of the last called argument is string
            expect(res).toEqual("handled");
        });
    });

    it("should propagate TranslationService params when the key does not exist", () => {
        prepare(Missing);
        translate.use("en");
        spyOn(missingTranslationHandler, "handle").and.callThrough();
        const interpolateParams = { some: "params" };

        translate.get("nonExistingKey", interpolateParams).subscribe((res: Translation) => {
            expect(missingTranslationHandler.handle).toHaveBeenCalledWith(
                jasmine.objectContaining({ translateService: translate }),
            );
            //test that the instance of the last called argument is string
            expect(res).toEqual("handled");
        });
    });

    it("should return the key when using MissingTranslationHandler & the handler returns nothing", () => {
        class MissingUndef implements MissingTranslationHandler {
            handle(
                params: MissingTranslationHandlerParams,
            ): StrictTranslation | Observable<StrictTranslation> {
                void params;
                const data: TranslationObject = {};
                return data["test"];
            }
        }

        prepare(MissingUndef);
        translate.use("en");
        spyOn(missingTranslationHandler, "handle").and.callThrough();

        translate.get("nonExistingKey").subscribe((res: Translation) => {
            expect(missingTranslationHandler.handle).toHaveBeenCalledWith(
                jasmine.objectContaining({ key: "nonExistingKey" }),
            );
            expect(res).toEqual("nonExistingKey");
        });
    });

    it("should not call the MissingTranslationHandler when the key exists", () => {
        prepare(Missing);
        translate.use("en");
        spyOn(missingTranslationHandler, "handle").and.callThrough();

        translate.get("TEST").subscribe(() => {
            expect(missingTranslationHandler.handle).not.toHaveBeenCalled();
        });
    });

    it("should use the MissingTranslationHandler when the key does not exist & we use instant translation", () => {
        prepare(Missing);
        translate.use("en");
        spyOn(missingTranslationHandler, "handle").and.callThrough();

        expect(translate.instant("nonExistingKey")).toEqual("handled");
        expect(missingTranslationHandler.handle).toHaveBeenCalledWith(
            jasmine.objectContaining({ key: "nonExistingKey" }),
        );
    });

    it("should wait for the MissingTranslationHandler when it returns an observable & we use get", () => {
        prepare(MissingObs);
        translate.use("en");
        spyOn(missingTranslationHandler, "handle").and.callThrough();

        translate.get("nonExistingKey").subscribe((res: Translation) => {
            expect(missingTranslationHandler.handle).toHaveBeenCalledWith(
                jasmine.objectContaining({ key: "nonExistingKey" }),
            );
            expect(res).toEqual("handled: nonExistingKey");
        });
    });

    it("should wait for the MissingTranslationHandler when it returns an observable & we use get with an array", () => {
        const tr: TranslationObject = {
            nonExistingKey1: "handled: nonExistingKey1",
            nonExistingKey2: "handled: nonExistingKey2",
            nonExistingKey3: "handled: nonExistingKey3",
        };

        prepare(MissingObs);
        translate.use("en");
        spyOn(missingTranslationHandler, "handle").and.callThrough();

        translate.get(Object.keys(tr)).subscribe((res: Translation) => {
            expect(missingTranslationHandler.handle).toHaveBeenCalledTimes(3);
            expect(res).toEqual(tr);
        });
    });

    it("should not wait for the MissingTranslationHandler when it returns an observable & we use instant", () => {
        prepare(MissingObs);
        translate.use("en");
        spyOn(missingTranslationHandler, "handle").and.callThrough();

        expect(translate.instant("nonExistingKey")).toEqual("nonExistingKey");
    });

    it("should not wait for the MissingTranslationHandler when it returns an observable & we use instant with an array", () => {
        const tr = {
            nonExistingKey1: "handled: nonExistingKey1",
            nonExistingKey2: "handled: nonExistingKey2",
            nonExistingKey3: "handled: nonExistingKey3",
        };

        prepare(MissingObs);
        translate.use("en");
        spyOn(missingTranslationHandler, "handle").and.callThrough();

        expect(translate.instant(Object.keys(tr)) as object).toEqual({
            nonExistingKey1: "nonExistingKey1",
            nonExistingKey2: "nonExistingKey2",
            nonExistingKey3: "nonExistingKey3",
        });
    });

    it("should not return default translation, but missing handler", () => {
        prepare(Missing, false);
        translate.use("en");
        translate.use("fake");

        spyOn(missingTranslationHandler, "handle").and.callThrough();
        translate.get("TEST").subscribe((res: Translation) => {
            expect(missingTranslationHandler.handle).toHaveBeenCalledWith(
                jasmine.objectContaining({ key: "TEST" }),
            );
            //test that the instance of the last called argument is string
            expect(res).toEqual("handled");
        });
    });

    it("should return default translation", () => {
        prepare(Missing, true);
        translate.use("en");
        translate.use("fake");

        spyOn(missingTranslationHandler, "handle").and.callThrough();
        translate.get("TEST").subscribe((res: Translation) => {
            expect(res).toEqual("This is a test");
        });
    });
});

import {Injector} from "@angular/core";
import {
    TranslateService,
    MissingTranslationHandler,
    MissingTranslationHandlerParams,
    TranslateLoader,
    LangChangeEvent,
    TranslationChangeEvent, TranslateModule
} from '../index';
import {Observable} from "rxjs/Observable";
import {getTestBed, TestBed} from "@angular/core/testing";

let translations: any = {"TEST": "This is a test"};
class FakeLoader implements TranslateLoader {
    getTranslation(lang: string): Observable<any> {
        return Observable.of(translations);
    }
}

describe('TranslateService', () => {
    let injector: Injector;
    let translate: TranslateService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [TranslateModule.forRoot({provide: TranslateLoader, useClass: FakeLoader})]
        });
        injector = getTestBed();
        translate = injector.get(TranslateService);
    });

    afterEach(() => {
        injector = undefined;
        translate = undefined;
        translations = {"TEST": "This is a test"};
    });

    it('is defined', () => {
        expect(TranslateService).toBeDefined();
        expect(translate).toBeDefined();
        expect(translate instanceof TranslateService).toBeTruthy();
    });

    it('should be able to get translations', () => {
        translations = {"TEST": "This is a test", "TEST2": "This is another test"};
        translate.use('en');

        // this will request the translation from the backend because we use a static files loader for TranslateService
        translate.get('TEST').subscribe((res: string) => {
            expect(res).toEqual('This is a test');
        });


        // this will request the translation from downloaded translations without making a request to the backend
        translate.get('TEST2').subscribe((res: string) => {
            expect(res).toEqual('This is another test');
        });
    });

    it('should be able to get an array translations', () => {
        translations = {"TEST": "This is a test", "TEST2": "This is another test2"};
        translate.use('en');

        // this will request the translation from the backend because we use a static files loader for TranslateService
        translate.get(['TEST', 'TEST2']).subscribe((res: string) => {
            expect(res).toEqual(translations);
        });
    });

    it("should fallback to the default language", () => {
        translations = {};
        translate.use('fr');

        translate.get('TEST').subscribe((res: string) => {
            expect(res).toEqual('TEST');

            translate.setDefaultLang('nl');
            translate.setTranslation('nl', {"TEST": "Dit is een test"});

            translate.get('TEST').subscribe((res2: string) => {
                expect(res2).toEqual('Dit is een test');
                expect(translate.getDefaultLang()).toEqual('nl');
            });
        });
    });

    it("should use the default language by default", () => {
        translate.setDefaultLang('nl');
        translate.setTranslation('nl', {"TEST": "Dit is een test"});

        translate.get('TEST').subscribe((res: string) => {
            expect(res).toEqual('Dit is een test');
        });
    });

    it("should return the key when it doesn't find a translation", () => {
        translate.use('en');

        translate.get('TEST2').subscribe((res: string) => {
            expect(res).toEqual('TEST2');
        });
    });

    it("should return the key when you haven't defined any translation", () => {
        translate.get('TEST').subscribe((res: string) => {
            expect(res).toEqual('TEST');
        });
    });

    it('should return an empty value', () => {
        translate.setDefaultLang('en');
        translate.setTranslation('en', {"TEST": ""});

        translate.get('TEST').subscribe((res: string) => {
            expect(res).toEqual('');
        });
    });

    it('should be able to get translations with params', () => {
        translations = {"TEST": "This is a test {{param}}"};
        translate.use('en');

        translate.get('TEST', {param: 'with param'}).subscribe((res: string) => {
            expect(res).toEqual('This is a test with param');
        });

    });

    it('should be able to get translations with nested params', () => {
        translations = {"TEST": "This is a test {{param.value}}"};
        translate.use('en');

        translate.get('TEST', {param: {value: 'with param'}}).subscribe((res: string) => {
            expect(res).toEqual('This is a test with param');
        });

    });

    it('should throw if you forget the key', () => {
        translate.use('en');

        expect(() => {
            translate.get(undefined);
        }).toThrowError('Parameter "key" required');

        expect(() => {
            translate.get('');
        }).toThrowError('Parameter "key" required');

        expect(() => {
            translate.get(null);
        }).toThrowError('Parameter "key" required');

        expect(() => {
            translate.instant(undefined);
        }).toThrowError('Parameter "key" required');
    });

    it('should be able to get translations with nested keys', () => {
        translations = {"TEST": {"TEST": "This is a test"}, "TEST2": {"TEST2": {"TEST2": "This is another test"}}};
        translate.use('en');

        translate.get('TEST.TEST').subscribe((res: string) => {
            expect(res).toEqual('This is a test');
        });


        translate.get('TEST2.TEST2.TEST2').subscribe((res: string) => {
            expect(res).toEqual('This is another test');
        });
    });

    it("shouldn't override the translations if you set the translations twice", (done: Function) => {
        translations = {};
        translate.setTranslation('en', {"TEST": "This is a test"}, true);
        translate.setTranslation('en', {"TEST2": "This is a test"}, true);
        translate.use('en');

        translate.get('TEST').subscribe((res: string) => {
            expect(res).toEqual('This is a test');
            expect(translations).toEqual({});
            done();
        });
    });

    it("shouldn't call the current loader if you set the translation yourself", (done: Function) => {
        translations = {};
        translate.setTranslation('en', {"TEST": "This is a test"});
        translate.use('en');

        translate.get('TEST').subscribe((res: string) => {
            expect(res).toEqual('This is a test');
            expect(translations).toEqual({});
            done();
        });
    });

    it('should be able to get instant translations', () => {
        translate.setTranslation('en', {"TEST": "This is a test"});
        translate.use('en');

        expect(translate.instant('TEST')).toEqual('This is a test');
    });

    it('should be able to get instant translations of an array', () => {
        let tr = {"TEST": "This is a test", "TEST2": "This is a test2"};
        translate.setTranslation('en', tr);
        translate.use('en');

        expect(translate.instant(['TEST', 'TEST2'])).toEqual(tr);
    });

    it('should return the key if instant translations are not available', () => {
        translate.setTranslation('en', {"TEST": "This is a test"});
        translate.use('en');

        expect(translate.instant('TEST2')).toEqual('TEST2');
    });

    it('should trigger an event when the translation value changes', () => {
        translate.setTranslation('en', {});
        translate.onTranslationChange.subscribe((event: TranslationChangeEvent) => {
            expect(event.translations).toBeDefined();
            expect(event.translations["TEST"]).toEqual("This is a test");
            expect(event.lang).toBe('en');
        });
        translate.set("TEST", "This is a test", 'en');
    });

    it('should trigger an event when the lang changes', () => {
        let tr = {"TEST": "This is a test"};
        translate.setTranslation('en', tr);
        translate.onLangChange.subscribe((event: LangChangeEvent) => {
            expect(event.lang).toBe('en');
            expect(event.translations).toEqual(tr);
        });
        translate.use('en');
    });

    it('should be able to reset a lang', (done: Function) => {
        translate.use('en');

        // this will request the translation from the backend because we use a static files loader for TranslateService
        translate.get('TEST').subscribe((res: string) => {
            expect(res).toEqual(translations['TEST']);

            // reset the lang as if it was never initiated
            translate.resetLang('en');

            expect(translate.instant('TEST')).toEqual('TEST');

            translate.get('TEST').subscribe((res2: string) => {
                expect(res2).toEqual('TEST'); // because the loader is "pristine" as if it was never called
                done();
            });
        });
    });

    it('should be able to reload a lang', () => {
        translations = {};
        translate.use('en');

        // this will request the translation from the loader
        translate.get('TEST').subscribe((res: string) => {
            expect(res).toEqual('TEST');

           translations = {"TEST": "This is a test 2"};

            // reset the lang as if it was never initiated
            translate.reloadLang('en').subscribe((res2: string) => {
                expect(translate.instant('TEST')).toEqual(translations['TEST']);
            });
        });
    });

    it('should be able to add new langs', () => {
        translate.addLangs(['pl', 'es']);
        expect(translate.getLangs()).toEqual(['pl', 'es']);
        translate.addLangs(['fr']);
        translate.addLangs(['pl', 'fr']);
        expect(translate.getLangs()).toEqual(['pl', 'es', 'fr']);

        // this will request the translation from the backend because we use a static files loader for TranslateService
        translate.use('en').subscribe((res: string) => {
            expect(translate.getLangs()).toEqual(['pl', 'es', 'fr', 'en']);
            translate.addLangs(['de']);
            expect(translate.getLangs()).toEqual(['pl', 'es', 'fr', 'en', 'de']);
        });
    });

    it('should be able to get the browserLang', () => {
        let browserLang = translate.getBrowserLang();
        expect(browserLang).toBeDefined();
        expect(typeof browserLang === 'string').toBeTruthy();
    });

    it('should be able to get the browserCultureLang', () => {
        let browserCultureLand = translate.getBrowserCultureLang();
        expect(browserCultureLand).toBeDefined();
        expect(typeof browserCultureLand === 'string').toBeTruthy();
    });
});

describe('MissingTranslationHandler', () => {
    let injector: Injector;
    let translate: TranslateService;
    let missingTranslationHandler: MissingTranslationHandler;

    class Missing implements MissingTranslationHandler {
        handle(params: MissingTranslationHandlerParams) {
            return "handled";
        }
    }

    class MissingObs implements MissingTranslationHandler {
        handle(params: MissingTranslationHandlerParams): Observable<any> {
            return Observable.of(`handled: ${params.key}`);
        }
    }

    let prepare = ((handlerClass: Function) => {
        TestBed.configureTestingModule({
            imports: [TranslateModule.forRoot({provide: TranslateLoader, useClass: FakeLoader})],
            providers: [
                { provide: MissingTranslationHandler, useClass: handlerClass }
            ]
        });
        injector = getTestBed();
        translate = injector.get(TranslateService);
        missingTranslationHandler = injector.get(MissingTranslationHandler);
    });

    afterEach(() => {
        injector = undefined;
        translate = undefined;
        translations = {"TEST": "This is a test"};
        missingTranslationHandler = undefined;
    });

    it('should use the MissingTranslationHandler when the key does not exist', () => {
        prepare(Missing);
        translate.use('en');
        spyOn(missingTranslationHandler, 'handle').and.callThrough();

        translate.get('nonExistingKey').subscribe((res: string) => {
            expect(missingTranslationHandler.handle).toHaveBeenCalledWith(jasmine.objectContaining({ key: 'nonExistingKey' }));
            //test that the instance of the last called argument is string
            expect(res).toEqual('handled');
        });
    });

    it('should propagate interpolation params when the key does not exist', () => {
        prepare(Missing);
        translate.use('en');
        spyOn(missingTranslationHandler, 'handle').and.callThrough();
        let interpolateParams = { some: 'params' };

        translate.get('nonExistingKey', interpolateParams).subscribe((res: string) => {
            expect(missingTranslationHandler.handle).toHaveBeenCalledWith(jasmine.objectContaining({ interpolateParams: interpolateParams }));
            //test that the instance of the last called argument is string
            expect(res).toEqual('handled');
        });
    });

    it('should propagate TranslationService params when the key does not exist', () => {
        prepare(Missing);
        translate.use('en');
        spyOn(missingTranslationHandler, 'handle').and.callThrough();
        let interpolateParams = { some: 'params' };

        translate.get('nonExistingKey', interpolateParams).subscribe((res: string) => {
            expect(missingTranslationHandler.handle).toHaveBeenCalledWith(jasmine.objectContaining({ translateService: translate }));
            //test that the instance of the last called argument is string
            expect(res).toEqual('handled');
        });
    });

    it('should return the key when using MissingTranslationHandler & the handler returns nothing', () => {
        class MissingUndef implements MissingTranslationHandler {
            handle(params: MissingTranslationHandlerParams) {
            }
        }

        prepare(MissingUndef);
        translate.use('en');
        spyOn(missingTranslationHandler, 'handle').and.callThrough();

        translate.get('nonExistingKey').subscribe((res: string) => {
            expect(missingTranslationHandler.handle).toHaveBeenCalledWith(jasmine.objectContaining({ key: 'nonExistingKey' }));
            expect(res).toEqual('nonExistingKey');
        });
    });

    it('should not call the MissingTranslationHandler when the key exists', () => {
        prepare(Missing);
        translate.use('en');
        spyOn(missingTranslationHandler, 'handle').and.callThrough();

        translate.get('TEST').subscribe(() => {
            expect(missingTranslationHandler.handle).not.toHaveBeenCalled();
        });
    });

    it('should use the MissingTranslationHandler when the key does not exist & we use instant translation', () => {
        prepare(Missing);
        translate.use('en');
        spyOn(missingTranslationHandler, 'handle').and.callThrough();

        expect(translate.instant('nonExistingKey')).toEqual('handled');
        expect(missingTranslationHandler.handle).toHaveBeenCalledWith(jasmine.objectContaining({ key: 'nonExistingKey' }));
    });

    it('should wait for the MissingTranslationHandler when it returns an observable & we use get', () => {
        prepare(MissingObs);
        translate.use('en');
        spyOn(missingTranslationHandler, 'handle').and.callThrough();

        translate.get('nonExistingKey').subscribe((res: string) => {
            expect(missingTranslationHandler.handle).toHaveBeenCalledWith(jasmine.objectContaining({ key: 'nonExistingKey' }));
            expect(res).toEqual('handled: nonExistingKey');
        });
    });

    it('should wait for the MissingTranslationHandler when it returns an observable & we use get with an array', () => {
        let tr = {
            nonExistingKey1: 'handled: nonExistingKey1',
            nonExistingKey2: 'handled: nonExistingKey2',
            nonExistingKey3: 'handled: nonExistingKey3'
        };

        prepare(MissingObs);
        translate.use('en');
        spyOn(missingTranslationHandler, 'handle').and.callThrough();

        translate.get(Object.keys(tr)).subscribe((res: string) => {
            expect(missingTranslationHandler.handle).toHaveBeenCalledTimes(3);
            expect(res).toEqual(tr);
        });
    });

    it('should not wait for the MissingTranslationHandler when it returns an observable & we use instant', () => {
        prepare(MissingObs);
        translate.use('en');
        spyOn(missingTranslationHandler, 'handle').and.callThrough();

        expect(translate.instant('nonExistingKey')).toEqual('nonExistingKey');
    });

    it('should not wait for the MissingTranslationHandler when it returns an observable & we use instant with an array', () => {
        let tr = {
            nonExistingKey1: 'handled: nonExistingKey1',
            nonExistingKey2: 'handled: nonExistingKey2',
            nonExistingKey3: 'handled: nonExistingKey3'
        };

        prepare(MissingObs);
        translate.use('en');
        spyOn(missingTranslationHandler, 'handle').and.callThrough();

        expect(translate.instant(Object.keys(tr))).toEqual({
            nonExistingKey1: 'nonExistingKey1',
            nonExistingKey2: 'nonExistingKey2',
            nonExistingKey3: 'nonExistingKey3'
        });
    });
});

describe('TranslateLoader', () => {
    let injector: Injector;
    let translate: TranslateService;

    let prepare = (_injector: Injector) => {
        translate = _injector.get(TranslateService);
    };

    it('should be able to provide TranslateStaticLoader', () => {
        TestBed.configureTestingModule({
            imports: [TranslateModule.forRoot({provide: TranslateLoader, useClass: FakeLoader})],
        });
        injector = getTestBed();
        prepare(injector);

        expect(translate).toBeDefined();
        expect(translate.currentLoader).toBeDefined();
        expect(translate.currentLoader instanceof FakeLoader).toBeTruthy();

        // the lang to use, if the lang isn't available, it will use the current loader to get them
        translate.use('en');

        // this will request the translation from the backend because we use a static files loader for TranslateService
        translate.get('TEST').subscribe((res: string) => {
            expect(res).toEqual('This is a test');
        });
    });

    it('should be able to provide any TranslateLoader', () => {
        class CustomLoader implements TranslateLoader {
            getTranslation(lang: string): Observable<any> {
                return Observable.of({"TEST": "This is also a test"});
            }
        }
        TestBed.configureTestingModule({
            imports: [TranslateModule.forRoot({provide: TranslateLoader, useClass: CustomLoader})]
        });
        injector = getTestBed();
        prepare(injector);

        expect(translate).toBeDefined();
        expect(translate.currentLoader).toBeDefined();
        expect(translate.currentLoader instanceof CustomLoader).toBeTruthy();

        // the lang to use, if the lang isn't available, it will use the current loader to get them
        translate.use('en');

        // this will request the translation from the CustomLoader
        translate.get('TEST').subscribe((res: string) => {
            expect(res).toEqual('This is also a test');
        });
    });

});

import {Injector} from "@angular/core";
import {TranslateService, TranslateLoader, LangChangeEvent, TranslationChangeEvent, TranslateModule} from '../index';
import {Observable} from "rxjs/Observable";
import {getTestBed, TestBed, fakeAsync, tick} from "@angular/core/testing";

import 'rxjs/add/observable/timer';
import 'rxjs/add/operator/mapTo';

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
            imports: [
                TranslateModule.forRoot({
                    loader: {provide: TranslateLoader, useClass: FakeLoader}
                })
            ]
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

    it('should not make duplicate requests', fakeAsync(() => {
        let getTranslationCalls = 0;
        spyOn(translate.currentLoader, 'getTranslation').and.callFake(() => {
            getTranslationCalls += 1;
            return Observable.timer(1000).mapTo(Observable.of(translations));
        });
        translate.use('en');
        translate.use('en');

        tick(1001);

        expect(getTranslationCalls).toEqual(1);
    }));
});

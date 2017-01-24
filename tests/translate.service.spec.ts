import {Injector} from "@angular/core";
import {ResponseOptions, Response, XHRBackend, HttpModule} from "@angular/http";
import {MockBackend, MockConnection} from "@angular/http/testing";
import {
    TranslateService,
    MissingTranslationHandler,
    MissingTranslationHandlerParams,
    TranslateLoader,
    TranslateStaticLoader,
    LangChangeEvent,
    TranslationChangeEvent, TranslateModule
} from './../ng2-translate';
import {Observable} from "rxjs/Observable";
import {getTestBed, TestBed} from "@angular/core/testing";

const mockBackendResponse = (connection: MockConnection, response: string) => {
    connection.mockRespond(new Response(new ResponseOptions({body: response})));
};

describe('TranslateService', () => {
    let injector: Injector;
    let backend: MockBackend;
    let translate: TranslateService;
    let connection: MockConnection; // this will be set when a new connection is emitted from the backend.

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpModule, TranslateModule.forRoot()],
            providers: [
                {provide: XHRBackend, useClass: MockBackend}
            ]
        });
        injector = getTestBed();
        backend = injector.get(XHRBackend);
        translate = injector.get(TranslateService);
        // sets the connection when someone tries to access the backend with an xhr request
        backend.connections.subscribe((c: MockConnection) => connection = c);
    });

    afterEach(() => {
        injector = undefined;
        backend = undefined;
        translate = undefined;
        connection = undefined;
    });

    it('is defined', () => {
        expect(TranslateService).toBeDefined();
        expect(translate).toBeDefined();
        expect(translate instanceof TranslateService).toBeTruthy();
    });

    it('should be able to get translations', () => {
        translate.use('en');

        // this will request the translation from the backend because we use a static files loader for TranslateService
        translate.get('TEST').subscribe((res: string) => {
            expect(res).toEqual('This is a test');
        });

        // mock response after the xhr request, otherwise it will be undefined
        mockBackendResponse(connection, '{"TEST": "This is a test", "TEST2": "This is another test"}');

        // this will request the translation from downloaded translations without making a request to the backend
        translate.get('TEST2').subscribe((res: string) => {
            expect(res).toEqual('This is another test');
        });
    });

    it('should be able to get an array translations', () => {
        var translations = {"TEST": "This is a test", "TEST2": "This is another test2"};
        translate.use('en');

        // this will request the translation from the backend because we use a static files loader for TranslateService
        translate.get(['TEST', 'TEST2']).subscribe((res: string) => {
            expect(res).toEqual(translations);
        });

        // mock response after the xhr request, otherwise it will be undefined
        mockBackendResponse(connection, JSON.stringify(translations));
    });

    it("should fallback to the default language", () => {
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

        mockBackendResponse(connection, '{}');
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

        translate.get('TEST').subscribe((res: string) => {
            expect(res).toEqual('TEST');
        });

        mockBackendResponse(connection, '{}');
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
        translate.use('en');

        translate.get('TEST', {param: 'with param'}).subscribe((res: string) => {
            expect(res).toEqual('This is a test with param');
        });

        mockBackendResponse(connection, '{"TEST": "This is a test {{param}}"}');
    });

    it('should be able to get translations with nested params', () => {
        translate.use('en');

        translate.get('TEST', {param: {value: 'with param'}}).subscribe((res: string) => {
            expect(res).toEqual('This is a test with param');
        });

        mockBackendResponse(connection, '{"TEST": "This is a test {{param.value}}"}');
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
        translate.use('en');

        translate.get('TEST.TEST').subscribe((res: string) => {
            expect(res).toEqual('This is a test');
        });

        mockBackendResponse(connection, '{"TEST": {"TEST": "This is a test"}, "TEST2": {"TEST2": {"TEST2": "This is another test"}}}');

        translate.get('TEST2.TEST2.TEST2').subscribe((res: string) => {
            expect(res).toEqual('This is another test');
        });
    });

    it("shouldn't override the translations if you set the translations twice ", (done: Function) => {
        translate.setTranslation('en', {"TEST": "This is a test"}, true);
        translate.setTranslation('en', {"TEST2": "This is a test"}, true);
        translate.use('en');

        translate.get('TEST').subscribe((res: string) => {
            expect(res).toEqual('This is a test');
            expect(connection).not.toBeDefined();
            done();
        });
    });

    it("shouldn't do a request to the backend if you set the translation yourself", (done: Function) => {
        translate.setTranslation('en', {"TEST": "This is a test"});
        translate.use('en');

        translate.get('TEST').subscribe((res: string) => {
            expect(res).toEqual('This is a test');
            expect(connection).not.toBeDefined();
            done();
        });
    });

    it('should be able to get instant translations', () => {
        translate.setTranslation('en', {"TEST": "This is a test"});
        translate.use('en');

        expect(translate.instant('TEST')).toEqual('This is a test');
    });

    it('should be able to get instant translations of an array', () => {
        var translations = {"TEST": "This is a test", "TEST2": "This is a test2"};
        translate.setTranslation('en', translations);
        translate.use('en');

        expect(translate.instant(['TEST', 'TEST2'])).toEqual(translations);
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
        var tr = {"TEST": "This is a test"};
        translate.setTranslation('en', tr);
        translate.onLangChange.subscribe((event: LangChangeEvent) => {
            expect(event.lang).toBe('en');
            expect(event.translations).toEqual(tr);
        });
        translate.use('en');
    });

    it('should be able to reset a lang', (done: Function) => {
        translate.use('en');
        spyOn(connection, 'mockRespond').and.callThrough();

        // this will request the translation from the backend because we use a static files loader for TranslateService
        translate.get('TEST').subscribe((res: string) => {
            expect(res).toEqual('This is a test');
            expect(connection.mockRespond).toHaveBeenCalledTimes(1);

            // reset the lang as if it was never initiated
            translate.resetLang('en');

            expect(translate.instant('TEST')).toEqual('TEST');

            // use set timeout because no request is really made and we need to trigger zone to resolve the observable
            setTimeout(() => {
                translate.get('TEST').subscribe((res2: string) => {
                    expect(res2).toEqual('TEST'); // because the loader is "pristine" as if it was never called
                    expect(connection.mockRespond).toHaveBeenCalledTimes(1);
                    done();
                });
            }, 10);
        });

        // mock response after the xhr request, otherwise it will be undefined
        mockBackendResponse(connection, '{"TEST": "This is a test"}');
    });

    it('should be able to reload a lang', () => {
        translate.use('en');

        // this will request the translation from the backend because we use a static files loader for TranslateService
        translate.get('TEST').subscribe((res: string) => {
            expect(res).toEqual('This is a test');

            // reset the lang as if it was never initiated
            translate.reloadLang('en').subscribe((res2: string) => {
                expect(translate.instant('TEST')).toEqual('This is a test 2');
            });

            mockBackendResponse(connection, '{"TEST": "This is a test 2"}');
        });

        // mock response after the xhr request, otherwise it will be undefined
        mockBackendResponse(connection, '{"TEST": "This is a test"}');
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

        // mock response after the xhr request, otherwise it will be undefined
        mockBackendResponse(connection, '{"TEST": "This is a test"}');
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
    let backend: MockBackend;
    let translate: TranslateService;
    let connection: MockConnection; // this will be set when a new connection is emitted from the backend.
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
            imports: [HttpModule, TranslateModule.forRoot()],
            providers: [
                { provide: MissingTranslationHandler, useClass: handlerClass },
                { provide: XHRBackend, useClass: MockBackend }
            ]
        });
        injector = getTestBed();
        backend = injector.get(XHRBackend);
        translate = injector.get(TranslateService);
        missingTranslationHandler = injector.get(MissingTranslationHandler);
        // sets the connection when someone tries to access the backend with an xhr request
        backend.connections.subscribe((c: MockConnection) => connection = c);
    });

    afterEach(() => {
        injector = undefined;
        backend = undefined;
        translate = undefined;
        connection = undefined;
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

        // mock response after the xhr request, otherwise it will be undefined
        mockBackendResponse(connection, '{"TEST": "This is a test"}');
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

        // mock response after the xhr request, otherwise it will be undefined
        mockBackendResponse(connection, '{"TEST": "This is a test"}');
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

        // mock response after the xhr request, otherwise it will be undefined
        mockBackendResponse(connection, '{"TEST": "This is a test"}');
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

        // mock response after the xhr request, otherwise it will be undefined
        mockBackendResponse(connection, '{"TEST": "This is a test"}');
    });

    it('should not call the MissingTranslationHandler when the key exists', () => {
        prepare(Missing);
        translate.use('en');
        spyOn(missingTranslationHandler, 'handle').and.callThrough();

        translate.get('TEST').subscribe(() => {
            expect(missingTranslationHandler.handle).not.toHaveBeenCalled();
        });

        // mock response after the xhr request, otherwise it will be undefined
        mockBackendResponse(connection, '{"TEST": "This is a test"}');
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

        // mock response after the xhr request, otherwise it will be undefined
        mockBackendResponse(connection, '{"TEST": "This is a test"}');
    });

    it('should wait for the MissingTranslationHandler when it returns an observable & we use get with an array', () => {
        let translations = {
            nonExistingKey1: 'handled: nonExistingKey1',
            nonExistingKey2: 'handled: nonExistingKey2',
            nonExistingKey3: 'handled: nonExistingKey3'
        };

        prepare(MissingObs);
        translate.use('en');
        spyOn(missingTranslationHandler, 'handle').and.callThrough();

        translate.get(Object.keys(translations)).subscribe((res: string) => {
            expect(missingTranslationHandler.handle).toHaveBeenCalledTimes(3);
            expect(res).toEqual(translations);
        });

        // mock response after the xhr request, otherwise it will be undefined
        mockBackendResponse(connection, '{"TEST": "This is a test"}');
    });

    it('should not wait for the MissingTranslationHandler when it returns an observable & we use instant', () => {
        prepare(MissingObs);
        translate.use('en');
        spyOn(missingTranslationHandler, 'handle').and.callThrough();

        expect(translate.instant('nonExistingKey')).toEqual('nonExistingKey');

        // mock response after the xhr request, otherwise it will be undefined
        mockBackendResponse(connection, '{"TEST": "This is a test"}');
    });

    it('should not wait for the MissingTranslationHandler when it returns an observable & we use instant with an array', () => {
        let translations = {
            nonExistingKey1: 'handled: nonExistingKey1',
            nonExistingKey2: 'handled: nonExistingKey2',
            nonExistingKey3: 'handled: nonExistingKey3'
        };

        prepare(MissingObs);
        translate.use('en');
        spyOn(missingTranslationHandler, 'handle').and.callThrough();

        expect(translate.instant(Object.keys(translations))).toEqual({
            nonExistingKey1: 'nonExistingKey1',
            nonExistingKey2: 'nonExistingKey2',
            nonExistingKey3: 'nonExistingKey3'
        });

        // mock response after the xhr request, otherwise it will be undefined
        mockBackendResponse(connection, '{"TEST": "This is a test"}');
    });
});

describe('TranslateLoader', () => {
    let injector: Injector;
    let backend: MockBackend;
    let translate: TranslateService;
    let connection: MockConnection; // this will be set when a new connection is emitted from the backend.

    var prepare = (_injector: Injector) => {
        backend = _injector.get(XHRBackend);
        translate = _injector.get(TranslateService);
        // sets the connection when someone tries to access the backend with an xhr request
        backend.connections.subscribe((c: MockConnection) => connection = c);
    };

    it('should be able to provide TranslateStaticLoader', () => {
        TestBed.configureTestingModule({
            imports: [HttpModule, TranslateModule.forRoot()],
            providers: [
                {provide: XHRBackend, useClass: MockBackend}
            ]
        });
        injector = getTestBed();
        prepare(injector);

        expect(translate).toBeDefined();
        expect(translate.currentLoader).toBeDefined();
        expect(translate.currentLoader instanceof TranslateStaticLoader).toBeTruthy();

        // the lang to use, if the lang isn't available, it will use the current loader to get them
        translate.use('en');

        // this will request the translation from the backend because we use a static files loader for TranslateService
        translate.get('TEST').subscribe((res: string) => {
            expect(res).toEqual('This is a test');
        });

        // mock response after the xhr request, otherwise it will be undefined
        mockBackendResponse(connection, '{"TEST": "This is a test"}');
    });

    it('should be able to provide any TranslateLoader', () => {
        class CustomLoader implements TranslateLoader {
            getTranslation(lang: string): Observable<any> {
                return Observable.of({"TEST": "This is a test"});
            }
        }
        TestBed.configureTestingModule({
            imports: [HttpModule, TranslateModule.forRoot({provide: TranslateLoader, useClass: CustomLoader})],
            providers: [
                {provide: XHRBackend, useClass: MockBackend}
            ]
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
            expect(res).toEqual('This is a test');
        });
    });

});

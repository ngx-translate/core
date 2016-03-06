import {it} from "angular2/testing";
import {provide, Injector} from "angular2/core";
import {
    ResponseOptions, Response, HTTP_PROVIDERS, Connection,
    XHRBackend
} from "angular2/http";
import {MockBackend, MockConnection} from "angular2/http/testing";
import {
    TRANSLATE_PROVIDERS,
    TranslateService, MissingTranslationHandler, TranslateLoader,
    TranslateStaticLoader,
    LangChangeEvent
} from './../ng2-translate';
import {Observable} from "rxjs/Observable";

export function main() {

    const mockBackendResponse = (connection: MockConnection, response: string) => {
        connection.mockRespond(new Response(new ResponseOptions({body: response})));
    };


    describe('TranslateService', () => {
        let injector: Injector;
        let backend: MockBackend;
        let translate: TranslateService;
        let connection: MockConnection; // this will be set when a new connection is emitted from the backend.

        beforeEach(() => {
            injector = Injector.resolveAndCreate([
                HTTP_PROVIDERS,
                // Provide a mocked (fake) backend for Http
                provide(XHRBackend, {useClass: MockBackend}),
                TRANSLATE_PROVIDERS
            ]);
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

            translate.setDefaultLang('en');
            translate.setTranslation('en', {"TEST": "This is a test"});

            translate.get('TEST').subscribe((res: string) => {
                expect(res).toEqual('This is a test');
            });

            mockBackendResponse(connection, '{}');
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

        it('should trigger an event when the lang changes', () => {
            var tr = {"TEST": "This is a test"};
            translate.setTranslation('en', tr);
            translate.onLangChange.subscribe((event: LangChangeEvent) => {
                expect(event.lang).toBe('en');
                expect(event.translations).toEqual(tr);
            });
            translate.use('en');
        });
    });
        
    describe('MissingTranslationHandler', () => {
        let injector: Injector;
        let backend: MockBackend;
        let translate: TranslateService;
        let connection: MockConnection; // this will be set when a new connection is emitted from the backend.
        let missingTranslationHandler: MissingTranslationHandler;
        
        class Missing implements MissingTranslationHandler {
            handle(key: string) {}
        }

        beforeEach(() => {
            injector = Injector.resolveAndCreate([
                HTTP_PROVIDERS,
                // Provide a mocked (fake) backend for Http
                provide(XHRBackend, {useClass: MockBackend}),
                TRANSLATE_PROVIDERS,
                provide(MissingTranslationHandler, { useClass: Missing })
            ]);
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
            translate.use('en');
            spyOn(missingTranslationHandler, 'handle');
            
            translate.get('nonExistingKey').subscribe(() => {
                expect(missingTranslationHandler.handle).toHaveBeenCalledWith('nonExistingKey');
            });

            // mock response after the xhr request, otherwise it will be undefined
            mockBackendResponse(connection, '{"TEST": "This is a test"}');
        });
        
        it('should not call the MissingTranslationHandler when the key exists', () => {
            translate.use('en');
            spyOn(missingTranslationHandler, 'handle');
            
            translate.get('TEST').subscribe(() => {
                expect(missingTranslationHandler.handle).not.toHaveBeenCalled();
            });
            
            // mock response after the xhr request, otherwise it will be undefined
            mockBackendResponse(connection, '{"TEST": "This is a test"}');
        });

        it('should use the MissingTranslationHandler when the key does not exist & we use instant translation', () => {
            translate.use('en');
            spyOn(missingTranslationHandler, 'handle');

            translate.instant('nonExistingKey');
            expect(missingTranslationHandler.handle).toHaveBeenCalledWith('nonExistingKey');
        });
    });

    describe('TranslateLoader', () => {
        let injector: Injector;
        let backend: MockBackend;
        let translate: TranslateService;
        let connection: MockConnection; // this will be set when a new connection is emitted from the backend.

        var prepare = (injector: Injector) => {
            backend = injector.get(XHRBackend);
            translate = injector.get(TranslateService);
            // sets the connection when someone tries to access the backend with an xhr request
            backend.connections.subscribe((c: MockConnection) => connection = c);
        };

        it('should be able to provide TranslateStaticLoader', () => {
            injector = Injector.resolveAndCreate([
                HTTP_PROVIDERS,
                // Provide a mocked (fake) backend for Http
                provide(XHRBackend, {useClass: MockBackend}),
                TRANSLATE_PROVIDERS
            ]);
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
            injector = Injector.resolveAndCreate([
                HTTP_PROVIDERS,
                // Provide a mocked (fake) backend for Http
                provide(XHRBackend, {useClass: MockBackend}),
                TRANSLATE_PROVIDERS,
                provide(TranslateLoader, { useClass: CustomLoader })
            ]);
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
}
import {it} from "angular2/testing";
import {provide, Injector} from "angular2/core";
import {
    ResponseOptions, Response, HTTP_PROVIDERS, Connection,
    XHRBackend
} from "angular2/http";
import {MockBackend, MockConnection} from "angular2/http/testing";
import {TranslateService, MissingTranslationHandler} from '../src/translate.service';

export function main() {

    describe('TranslateService', () => {
        let injector: Injector;
        let backend: MockBackend;
        let translate: TranslateService;
        let connection: MockConnection; // this will be set when a new connection is emitted from the backend.

        var prepareStaticTranslate = (lang: string = 'en') => {
            // this will load translate json files from src/public/i18n
            translate.useStaticFilesLoader();

            // the lang to use, if the lang isn't available, it will use the current loader to get them
            translate.use(lang);
        };

        var mockBackendResponse = (response: string) => {
            connection.mockRespond(new Response(new ResponseOptions({body: response})));
        };

        beforeEach(() => {
            injector = Injector.resolveAndCreate([
                HTTP_PROVIDERS,
                // Provide a mocked (fake) backend for Http
                provide(XHRBackend, {useClass: MockBackend}),
                TranslateService
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
            prepareStaticTranslate();

            // this will request the translation from the backend because we use a static files loader for TranslateService
            translate.get('TEST').subscribe((res: string) => {
                expect(res).toEqual('This is a test');
            });

            // mock response after the xhr request, otherwise it will be undefined
            mockBackendResponse('{"TEST": "This is a test", "TEST2": "This is another test"}');

            // this will request the translation from downloaded translations without making a request to the backend
            translate.get('TEST2').subscribe((res: string) => {
                expect(res).toEqual('This is another test');
            });
        });

        it("should fallback to the default language", () => {
            prepareStaticTranslate("fr");

            translate.setDefaultLang('en');
            translate.setTranslation('en', {"TEST": "This is a test"});

            translate.get('TEST').subscribe((res: string) => {
                expect(res).toEqual('This is a test');
            });

            mockBackendResponse('{}');
        });

        it("should return the key when it doesn't find a translation", () => {
            prepareStaticTranslate();

            translate.get('TEST').subscribe((res: string) => {
                expect(res).toEqual('TEST');
            });

            mockBackendResponse('{}');
        });

        it("should return the key when you haven't defined any translation", () => {
            translate.get('TEST').subscribe((res: string) => {
                expect(res).toEqual('TEST');
            });
        });

        it('should be able to get translations with params', () => {
            prepareStaticTranslate();

            translate.get('TEST', {param: 'with param'}).subscribe((res: string) => {
                expect(res).toEqual('This is a test with param');
            });

            mockBackendResponse('{"TEST": "This is a test {{param}}"}');
        });

        it('should be able to get translations with nested params', () => {
            prepareStaticTranslate();

            translate.get('TEST', {param: {value: 'with param'}}).subscribe((res: string) => {
                expect(res).toEqual('This is a test with param');
            });

            mockBackendResponse('{"TEST": "This is a test {{param.value}}"}');
        });

        it('should throw if you forget the key', () => {
            prepareStaticTranslate();

            expect(() => {
                translate.get(undefined);
            }).toThrowError('Parameter "key" required');
        });

        it('should be able to get translations with nested keys', () => {
            prepareStaticTranslate();

            translate.get('TEST.TEST').subscribe((res: string) => {
                expect(res).toEqual('This is a test');
            });

            mockBackendResponse('{"TEST": {"TEST": "This is a test"}, "TEST2": {"TEST2": {"TEST2": "This is another test"}}}');

            translate.get('TEST2.TEST2.TEST2').subscribe((res: string) => {
                expect(res).toEqual('This is another test');
            });
        });

        it("shouldn't do a request to the backend if you set the translation yourself", (done: Function) => {
            translate.setTranslation('en', {"TEST": "This is a test"});
            prepareStaticTranslate();

            translate.get('TEST').subscribe((res: string) => {
                expect(res).toEqual('This is a test');
                expect(connection).not.toBeDefined();
                done();
            });
        });
        
        function prepareMissingTranslationHandler() {
          class Missing implements MissingTranslationHandler {
                handle(key: string) {}
            }
            let handler = new Missing();
            spyOn(handler, 'handle');
            
            translate.setMissingTranslationHandler(handler);
            
            return handler;
        }
        
        it('should use the MissingTranslationHandler when the key does not exist', () => {
            prepareStaticTranslate();
            let handler = prepareMissingTranslationHandler();
            
            translate.get('nonExistingKey').subscribe(() => {
                expect(handler.handle).toHaveBeenCalledWith('nonExistingKey');
            });
        });
        
        it('should not call the MissingTranslationHandler when the key exists', () => {
            let handler = prepareMissingTranslationHandler();
            prepareStaticTranslate();
            
            translate.get('TEST').subscribe(() => {
                expect(handler.handle).not.toHaveBeenCalled();
            });
        });
    });
}
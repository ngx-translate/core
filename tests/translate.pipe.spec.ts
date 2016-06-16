import {TranslatePipe} from '../src/translate.pipe';
import {MockConnection, MockBackend} from "@angular/http/testing/mock_backend";
import {TRANSLATE_PROVIDERS, TranslateService} from "./../ng2-translate";
import {ResponseOptions, Response, XHRBackend, HTTP_PROVIDERS} from "@angular/http";
import {provide, Injector, ReflectiveInjector, ChangeDetectorRef} from "@angular/core";
import {LangChangeEvent} from "../src/translate.service";

class FakeChangeDetectorRef extends ChangeDetectorRef {
    markForCheck(): void {}

    detach(): void {}

    detectChanges(): void {}

    checkNoChanges(): void {}

    reattach(): void {}
}

export function main() {
    const mockBackendResponse = (connection: MockConnection, response: string) => {
        connection.mockRespond(new Response(new ResponseOptions({body: response})));
    };

    describe('TranslatePipe', () => {
        let injector: Injector;
        let backend: MockBackend;
        let translate: TranslateService;
        let connection: MockConnection; // this will be set when a new connection is emitted from the backend.
        let translatePipe: TranslatePipe;
        let ref: any;

        beforeEach(() => {
            injector = ReflectiveInjector.resolveAndCreate([
                HTTP_PROVIDERS,
                // Provide a mocked (fake) backend for Http
                provide(XHRBackend, {useClass: MockBackend}),
                TRANSLATE_PROVIDERS
            ]);
            backend = injector.get(XHRBackend);
            translate = injector.get(TranslateService);
            // sets the connection when someone tries to access the backend with an xhr request
            backend.connections.subscribe((c: MockConnection) => connection = c);

            ref = new FakeChangeDetectorRef();
            translatePipe = new TranslatePipe(translate, ref);
        });

        afterEach(() => {
            injector = undefined;
            backend = undefined;
            translate = undefined;
            connection = undefined;
            translatePipe = undefined;
            ref = undefined;
        });

        it('is defined', () => {
            expect(TranslatePipe).toBeDefined();
            expect(translatePipe).toBeDefined();
            expect(translatePipe instanceof TranslatePipe).toBeTruthy();
        });

        it('should translate a string', () => {
            translate.setTranslation('en', {"TEST": "This is a test"});
            translate.use('en');

            expect(translatePipe.transform('TEST')).toEqual("This is a test");
        });

        it('should call markForChanges when it translates a string', () => {
            translate.setTranslation('en', {"TEST": "This is a test"});
            translate.use('en');
            spyOn(ref, 'markForCheck').and.callThrough();

            translatePipe.transform('TEST');
            expect(ref.markForCheck).toHaveBeenCalled();
        });

        it('should translate a string with object parameters', () => {
            translate.setTranslation('en', {"TEST": "This is a test {{param}}"});
            translate.use('en');

            expect(translatePipe.transform('TEST', {param: "with param"})).toEqual("This is a test with param");
        });

        it('should translate a string with object as string parameters', () => {
            translate.setTranslation('en', {"TEST": "This is a test {{param}}"});
            translate.use('en');

            expect(translatePipe.transform('TEST', '{param: "with param"}')).toEqual("This is a test with param");
            expect(translatePipe.transform('TEST', '{"param": "with param"}')).toEqual("This is a test with param");
        });

        it('should update the value when the parameters change', () => {
            translate.setTranslation('en', {"TEST": "This is a test {{param}}"});
            translate.use('en');

            spyOn(translatePipe, 'updateValue').and.callThrough();
            spyOn(ref, 'markForCheck').and.callThrough();

            expect(translatePipe.transform('TEST', {param: "with param"})).toEqual("This is a test with param");
            // same value, shouldn't call 'updateValue' again
            expect(translatePipe.transform('TEST', {param: "with param"})).toEqual("This is a test with param");
            // different param, should call 'updateValue'
            expect(translatePipe.transform('TEST', {param: "with param2"})).toEqual("This is a test with param2");
            expect(translatePipe.updateValue).toHaveBeenCalledTimes(2);
            expect(ref.markForCheck).toHaveBeenCalledTimes(2);
        });

        it("should throw if you don't give an object parameter", () => {
            translate.setTranslation('en', {"TEST": "This is a test {{param}}"});
            translate.use('en');
            let param = 'param: "with param"';

            expect(() => {
                translatePipe.transform('TEST', param);
            }).toThrowError(`Wrong parameter in TranslatePipe. Expected a valid Object, received: ${param}`)
        });

        describe('should update translations on lang change', () => {
            it('with static loader', (done) => {
                translate.setTranslation('en', {"TEST": "This is a test"});
                translate.setTranslation('fr', {"TEST": "C'est un test"});
                translate.use('en');

                expect(translatePipe.transform('TEST')).toEqual("This is a test");

                // this will be resolved at the next lang change
                translate.onLangChange.subscribe((res: LangChangeEvent) => {
                    expect(res.lang).toEqual('fr');
                    expect(translatePipe.transform('TEST')).toEqual("C'est un test");
                    done();
                });

                translate.use('fr');
            });

            it('with file loader', (done) => {
                translate.use('en');
                mockBackendResponse(connection, '{"TEST": "This is a test"}');
                expect(translatePipe.transform('TEST')).toEqual("This is a test");

                // this will be resolved at the next lang change
                translate.onLangChange.subscribe((res: LangChangeEvent) => {
                    expect(res.lang).toEqual('fr');
                    expect(translatePipe.transform('TEST')).toEqual("C'est un test");
                    done();
                });

                translate.use('fr');
                mockBackendResponse(connection, `{"TEST": "C'est un test"}`);
            });
        });
    });
}
import {TranslatePipe} from '../src/translate.pipe';
import {MockConnection, MockBackend} from "angular2/src/http/backends/mock_backend";
import {TranslateService} from "../src/translate.service";
import {XHRBackend, HTTP_PROVIDERS} from "angular2/http";
import {provide, Injector} from "angular2/core";

export function main() {
    describe('TranslatePipe', () => {
        let injector: Injector;
        let backend: MockBackend;
        let translate: TranslateService;
        let connection: MockConnection; // this will be set when a new connection is emitted from the backend.
        let translatePipe: TranslatePipe;

        beforeEach(() => {
            injector = Injector.resolveAndCreate([
                HTTP_PROVIDERS,
                // Provide a mocked (fake) backend for Http
                provide(XHRBackend, {useClass: MockBackend}),
                TranslateService,
                TranslatePipe
            ]);
            backend = injector.get(XHRBackend);
            translate = injector.get(TranslateService);
            // sets the connection when someone tries to access the backend with an xhr request
            backend.connections.subscribe((c: MockConnection) => connection = c);

            translatePipe = injector.get(TranslatePipe);
        });

        it('is defined', () => {
            expect(TranslatePipe).toBeDefined();
            expect(translatePipe).toBeDefined();
            expect(translatePipe instanceof TranslatePipe).toBeTruthy();
        });

        it('should translate a string', () => {
            translate.setTranslation('en', {"TEST": "This is a test"});
            translate.use('en');

            expect(translatePipe.transform('TEST', [])).toEqual("This is a test");
        });

        it('should translate a string with object parameters', () => {
            translate.setTranslation('en', {"TEST": "This is a test {{param}}"});
            translate.use('en');

            expect(translatePipe.transform('TEST', [{param: "with param"}])).toEqual("This is a test with param");
        });

        it('should translate a string with object as string parameters', () => {
            translate.setTranslation('en', {"TEST": "This is a test {{param}}"});
            translate.use('en');

            expect(translatePipe.transform('TEST', ['{param: "with param"}'])).toEqual("This is a test with param");
            expect(translatePipe.transform('TEST', ['{"param": "with param"}'])).toEqual("This is a test with param");
        });

        it("should throw if you don't give an object parameter", () => {
            translate.setTranslation('en', {"TEST": "This is a test {{param}}"});
            translate.use('en');
            let param = 'param: "with param"';

            expect(() => {
                translatePipe.transform('TEST', [param]);
            }).toThrowError(`Wrong parameter in TranslatePipe. Expected a valid Object, received: ${param}`)
        });
    });
}
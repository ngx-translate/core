import {it, beforeEachProviders, inject} from "angular2/testing";
import {provide} from "angular2/core";
import {
    BaseRequestOptions, Http, ResponseOptions, Response, HTTP_PROVIDERS, Connection,
    XHRBackend
} from "angular2/http";
import {MockBackend, MockConnection} from "angular2/http/testing";
import {TranslateService} from '../src/translate.service';

export function main() {

    describe('TranslateService', () => {
        beforeEachProviders(() => [
            BaseRequestOptions,
            HTTP_PROVIDERS,
            // Provide a mocked (fake) backend for Http
            provide(XHRBackend, {useClass: MockBackend}),
            TranslateService
        ]);


        it('is defined', () => {
            expect(TranslateService).toBeDefined();
        });

        // this test is async, and yet it works thanks to Zone \o/
        it('should be able to get translations for the view', inject([XHRBackend, Http, TranslateService], (xhrBackend, http, translate) => {
            var connection: MockConnection; //this will be set when a new connection is emitted from the backend.
            xhrBackend.connections.subscribe((c: MockConnection) => connection = c);

            // this will load translate json files from src/public/i18n
            translate.useStaticFilesLoader();

            // the lang to use, if the lang isn't available, it will use the current loader to get them
            translate.use('en');

            // this will request the translation from the backend because we use a static files loader for TranslateService
            translate.get('TEST').subscribe((res: string) => {
                expect(res).toEqual('This is a test');
            });

            // mock response after the xhr request, otherwise it will be undefined
            connection.mockRespond(new Response(new ResponseOptions({body: '{"TEST": "This is a test"}'})));
        }));
    });
}
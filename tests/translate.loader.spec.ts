import {Injector} from "@angular/core";
import {TestBed, getTestBed} from "@angular/core/testing";
import {TranslateService, TranslateModule, TranslateLoader} from "../index";
import {Observable} from "rxjs/Observable";

let translations: any = {"TEST": "This is a test"};
class FakeLoader implements TranslateLoader {
    getTranslation(lang: string): Observable<any> {
        return Observable.of(translations);
    }
}

describe('TranslateLoader', () => {
    let injector: Injector;
    let translate: TranslateService;

    let prepare = (_injector: Injector) => {
        translate = _injector.get(TranslateService);
    };

    it('should be able to provide TranslateStaticLoader', () => {
        TestBed.configureTestingModule({
            imports: [
                TranslateModule.forRoot({
                    loader: {provide: TranslateLoader, useClass: FakeLoader}
                })
            ],
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
            imports: [
                TranslateModule.forRoot({
                    loader: {provide: TranslateLoader, useClass: CustomLoader}
                })
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
            expect(res).toEqual('This is also a test');
        });
    });

});

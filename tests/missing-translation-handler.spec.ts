import {Injector} from "@angular/core";
import {TestBed, getTestBed} from "@angular/core/testing";
import {Observable} from "rxjs/Observable";
import {
    TranslateService,
    MissingTranslationHandler,
    MissingTranslationHandlerParams,
    TranslateModule,
    TranslateLoader
} from "../index";

let translations: any = {"TEST": "This is a test"};
class FakeLoader implements TranslateLoader {
    getTranslation(lang: string): Observable<any> {
        return Observable.of(translations);
    }
}

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
            imports: [
                TranslateModule.forRoot({
                    loader: {provide: TranslateLoader, useClass: FakeLoader}
                })
            ],
            providers: [
                {provide: MissingTranslationHandler, useClass: handlerClass}
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
            expect(missingTranslationHandler.handle).toHaveBeenCalledWith(jasmine.objectContaining({key: 'nonExistingKey'}));
            //test that the instance of the last called argument is string
            expect(res).toEqual('handled');
        });
    });

    it('should propagate interpolation params when the key does not exist', () => {
        prepare(Missing);
        translate.use('en');
        spyOn(missingTranslationHandler, 'handle').and.callThrough();
        let interpolateParams = {some: 'params'};

        translate.get('nonExistingKey', interpolateParams).subscribe((res: string) => {
            expect(missingTranslationHandler.handle).toHaveBeenCalledWith(jasmine.objectContaining({interpolateParams: interpolateParams}));
            //test that the instance of the last called argument is string
            expect(res).toEqual('handled');
        });
    });

    it('should propagate TranslationService params when the key does not exist', () => {
        prepare(Missing);
        translate.use('en');
        spyOn(missingTranslationHandler, 'handle').and.callThrough();
        let interpolateParams = {some: 'params'};

        translate.get('nonExistingKey', interpolateParams).subscribe((res: string) => {
            expect(missingTranslationHandler.handle).toHaveBeenCalledWith(jasmine.objectContaining({translateService: translate}));
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
            expect(missingTranslationHandler.handle).toHaveBeenCalledWith(jasmine.objectContaining({key: 'nonExistingKey'}));
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
        expect(missingTranslationHandler.handle).toHaveBeenCalledWith(jasmine.objectContaining({key: 'nonExistingKey'}));
    });

    it('should wait for the MissingTranslationHandler when it returns an observable & we use get', () => {
        prepare(MissingObs);
        translate.use('en');
        spyOn(missingTranslationHandler, 'handle').and.callThrough();

        translate.get('nonExistingKey').subscribe((res: string) => {
            expect(missingTranslationHandler.handle).toHaveBeenCalledWith(jasmine.objectContaining({key: 'nonExistingKey'}));
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
            expect(res).toEqual(tr as any);
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
        } as any);
    });
});

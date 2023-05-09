import {TestBed} from "@angular/core/testing";
import {Observable, of} from "rxjs";
import {MissingTranslationHandler, MissingTranslationHandlerParams, TranslateLoader, TranslateModule, TranslateService} from "../public-api";

let translations: any = {"TEST": "This is a test"};
let fakeTranslation: any = {"NOT_USED": "not used"};

class FakeLoader implements TranslateLoader {
  getTranslation(lang: string): Observable<any> {
    if (lang === 'fake') {
      return of(fakeTranslation);
    }

    return of(translations);
  }
}

describe('MissingTranslationHandler', () => {
  let translate: TranslateService;
  let missingTranslationHandler: MissingTranslationHandler;

  class Missing implements MissingTranslationHandler {
    handle(params: MissingTranslationHandlerParams) {
      return "handled";
    }
  }

  class MissingObs implements MissingTranslationHandler {
    handle(params: MissingTranslationHandlerParams): Observable<any> {
      return of(`handled: ${params.key}`);
    }
  }

  let prepare = ((handlerClass: Function, defaultLang: boolean = true) => {
    TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot({
          loader: {provide: TranslateLoader, useClass: FakeLoader},
          useDefaultLang: defaultLang
        })
      ],
      providers: [
        {provide: MissingTranslationHandler, useClass: handlerClass}
      ]
    });
    translate = TestBed.inject(TranslateService);
    missingTranslationHandler = TestBed.inject(MissingTranslationHandler);
  });

  afterEach(() => {
    translations = {"TEST": "This is a test"};
  });

  it('should use the MissingTranslationHandler when the key does not exist', () => {
    prepare(Missing);
    translate.use('en');
    jest.spyOn(missingTranslationHandler, 'handle');

    translate.get('nonExistingKey').subscribe((res: string) => {
      expect(missingTranslationHandler.handle).toHaveBeenCalledWith(expect.objectContaining({key: 'nonExistingKey'}));
      //test that the instance of the last called argument is string
      expect(res).toEqual('handled');
    });
  });

  it('should propagate interpolation params when the key does not exist', () => {
    prepare(Missing);
    translate.use('en');
    jest.spyOn(missingTranslationHandler, 'handle');
    let interpolateParams = {some: 'params'};

    translate.get('nonExistingKey', interpolateParams).subscribe((res: string) => {
      expect(missingTranslationHandler.handle).toHaveBeenCalledWith(expect.objectContaining({interpolateParams: interpolateParams}));
      //test that the instance of the last called argument is string
      expect(res).toEqual('handled');
    });
  });

  it('should propagate TranslationService params when the key does not exist', () => {
    prepare(Missing);
    translate.use('en');
    jest.spyOn(missingTranslationHandler, 'handle');
    let interpolateParams = {some: 'params'};

    translate.get('nonExistingKey', interpolateParams).subscribe((res: string) => {
      expect(missingTranslationHandler.handle).toHaveBeenCalledWith(expect.objectContaining({translateService: translate}));
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
    jest.spyOn(missingTranslationHandler, 'handle');

    translate.get('nonExistingKey').subscribe((res: string) => {
      expect(missingTranslationHandler.handle).toHaveBeenCalledWith(expect.objectContaining({key: 'nonExistingKey'}));
      expect(res).toEqual('nonExistingKey');
    });
  });

  it('should not call the MissingTranslationHandler when the key exists', () => {
    prepare(Missing);
    translate.use('en');
    jest.spyOn(missingTranslationHandler, 'handle');

    translate.get('TEST').subscribe(() => {
      expect(missingTranslationHandler.handle).not.toHaveBeenCalled();
    });
  });

  it('should use the MissingTranslationHandler when the key does not exist & we use instant translation', () => {
    prepare(Missing);
    translate.use('en');
    jest.spyOn(missingTranslationHandler, 'handle');

    expect(translate.instant('nonExistingKey')).toEqual('handled');
    expect(missingTranslationHandler.handle).toHaveBeenCalledWith(expect.objectContaining({key: 'nonExistingKey'}));
  });

  it('should wait for the MissingTranslationHandler when it returns an observable & we use get', () => {
    prepare(MissingObs);
    translate.use('en');
    jest.spyOn(missingTranslationHandler, 'handle');

    translate.get('nonExistingKey').subscribe((res: string) => {
      expect(missingTranslationHandler.handle).toHaveBeenCalledWith(expect.objectContaining({key: 'nonExistingKey'}));
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
    jest.spyOn(missingTranslationHandler, 'handle');

    translate.get(Object.keys(tr)).subscribe((res: string) => {
      expect(missingTranslationHandler.handle).toHaveBeenCalledTimes(3);
      expect(res).toEqual(tr as any);
    });
  });

  it('should not wait for the MissingTranslationHandler when it returns an observable & we use instant', () => {
    prepare(MissingObs);
    translate.use('en');
    jest.spyOn(missingTranslationHandler, 'handle');

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
    jest.spyOn(missingTranslationHandler, 'handle');

    expect(translate.instant(Object.keys(tr))).toEqual({
      nonExistingKey1: 'nonExistingKey1',
      nonExistingKey2: 'nonExistingKey2',
      nonExistingKey3: 'nonExistingKey3'
    } as any);
  });

  it('should not return default translation, but missing handler', () => {
    prepare(Missing, false);
    translate.use('en');
    translate.use('fake');

    jest.spyOn(missingTranslationHandler, 'handle');
    translate.get('TEST').subscribe((res: string) => {
      expect(missingTranslationHandler.handle).toHaveBeenCalledWith(expect.objectContaining({key: 'TEST'}));
      //test that the instance of the last called argument is string
      expect(res).toEqual('handled');
    });
  });

  it('should return default translation', () => {
    prepare(Missing, true);
    translate.use('en');
    translate.use('fake');

    jest.spyOn(missingTranslationHandler, 'handle');
    translate.get('TEST').subscribe((res: string) => {
      expect(res).toEqual('This is a test');
    });
  });
});

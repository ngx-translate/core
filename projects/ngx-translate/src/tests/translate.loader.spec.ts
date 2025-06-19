import {TestBed} from "@angular/core/testing";
import {Observable, of} from "rxjs";
import {
  TranslateFakeLoader,
  TranslateLoader,
  TranslateService,
  TranslationObject,
  Translation,
  provideTranslateService
} from "../public-api";
import {Injectable} from "@angular/core";

const translations: TranslationObject = {"TEST": "This is a test"};

@Injectable()
class FakeLoader implements TranslateLoader {
  getTranslation(): Observable<TranslationObject> {
    return of(translations);
  }
}

describe('TranslateLoader', () => {
  let translate: TranslateService;

  it('should be able to provide TranslateStaticLoader', () => {
    TestBed.configureTestingModule({
      providers: [
        provideTranslateService({
          loader: {provide: TranslateLoader, useClass: FakeLoader}
        })
      ],
    });
    translate = TestBed.inject(TranslateService);

    expect(translate).toBeDefined();
    expect(translate.currentLoader).toBeDefined();
    expect(translate.currentLoader instanceof FakeLoader).toBeTruthy();

    // the lang to use, if the lang isn't available, it will use the current loader to get them
    translate.use('en');

    // this will request the translation from the backend because we use a static files loader for TranslateService
    translate.get('TEST').subscribe((res: Translation) => {
      expect(res).toEqual('This is a test');
    });
  });

  it('should be able to provide any TranslateLoader', () => {
    class CustomLoader implements TranslateLoader {
      getTranslation(): Observable<TranslationObject> {
        return of({"TEST": "This is also a test"});
      }
    }

    TestBed.configureTestingModule({
      providers: [
        provideTranslateService({
          loader: {provide: TranslateLoader, useClass: CustomLoader}
        })
      ]
    });
    translate = TestBed.inject(TranslateService);

    expect(translate).toBeDefined();
    expect(translate.currentLoader).toBeDefined();
    expect(translate.currentLoader instanceof CustomLoader).toBeTruthy();

    // the lang to use, if the lang isn't available, it will use the current loader to get them
    translate.use('en');

    // this will request the translation from the CustomLoader
    translate.get('TEST').subscribe((res: Translation) => {
      expect(res).toEqual('This is also a test');
    });
  });

  it('TranslateFakeLoader should return empty object', () => {
    TestBed.configureTestingModule({
      providers: [
        provideTranslateService({
          loader: {provide: TranslateLoader, useClass: TranslateFakeLoader}
        })
      ],
    });
    translate = TestBed.inject(TranslateService);

    expect(translate).toBeDefined();
    expect(translate.currentLoader).toBeDefined();
    expect(translate.currentLoader instanceof TranslateFakeLoader).toBeTruthy();

    // the lang to use, if the lang isn't available, it will use the current loader to get them
    translate.use('en');

    // this will request the translation from the backend because we use a static files loader for TranslateService
    translate.getTranslation('en').subscribe((res: Translation) => {
      expect(res).toEqual({});
    });
  });

});

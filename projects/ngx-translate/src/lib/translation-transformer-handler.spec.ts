import {TranslationObject} from "./translate.service";
import {isDict, provideTranslateService, TranslateService, TranslationTransformerHandler} from "../public-api";
import {Injectable} from "@angular/core";
import {TranslationTransformerHandlerParams} from "./translation-transformer-handler";
import {TestBed} from "@angular/core/testing";
import {TranslateLoader} from "./translate.loader";
import {Observable, of, tap} from "rxjs";

const translations: TranslationObject = {
  "TEST": "This is a test",
  "dictionary": {
    "_": "default translation",
    "first": "First translation {{placeholder}}",
  }
};

@Injectable()
class FakeLoader implements TranslateLoader {
  getTranslation(lang: string): Observable<TranslationObject> {
    void lang;
    return of(translations);
  }
}

describe('TranslationTransformerHandler', () => {
  let translate: TranslateService;
  let translationHandler: TranslationTransformerHandler;

  @Injectable()
  class CustomTranslationHandlerService implements TranslationTransformerHandler {
    handle(params: TranslationTransformerHandlerParams): unknown {
      if (isDict(params.rawTranslation)) {
        return params.key;
      }

      return params.rawTranslation;
    }
  }

  const prepareCustomHandler = () => {
    TestBed.configureTestingModule({
      providers: [
        provideTranslateService({
          loader: {provide: TranslateLoader, useClass: FakeLoader},
          translationTransformerHandler: {provide: TranslationTransformerHandler, useClass: CustomTranslationHandlerService},
        })
      ]
    });

    translate = TestBed.inject(TranslateService);
    translationHandler = TestBed.inject(TranslationTransformerHandler);
    translate.use('en');
  };

  const prepareDefaultHandler = () => {
    TestBed.configureTestingModule({
      providers: [
        provideTranslateService({
          loader: {provide: TranslateLoader, useClass: FakeLoader},
        })
      ]
    });

    translate = TestBed.inject(TranslateService);
    translationHandler = TestBed.inject(TranslationTransformerHandler);
    translate.use('en');
  };

  it('should use the standard FakeTranslationHandler and return an interpolated dictionary', () => {
    prepareDefaultHandler();
    translate.get("dictionary", {placeholder: "testPlaceholder"})
      .pipe(
        tap((result) => {
          expect(result).toEqual({
            "_": "default translation",
            "first": "First translation testPlaceholder",
          });
        })
      )
      .subscribe();
  })

  it('should use the standard FakeTranslationHandler and return the translation string', () => {
    prepareDefaultHandler();
    translate.get("TEST")
      .pipe(
        tap((result) => {
          expect(result).toEqual(translations["TEST"]);
        })
      )
      .subscribe();
  })

  it('should use CustomTranslationHandler and return the translation string', () => {
    prepareCustomHandler();
    spyOn(translationHandler, 'handle').and.callThrough();
    translate.get("TEST")
      .pipe(
        tap((result) => {
          expect(translationHandler.handle).toHaveBeenCalledWith(jasmine.objectContaining({key: "TEST", rawTranslation: translations["TEST"]}));
          expect(result).toEqual(translations["TEST"]);
        })
      )
      .subscribe();
  })

  it('should  use CustomTranslationHandler and return the key of the dictionary', () => {
    prepareCustomHandler();
    spyOn(translationHandler, 'handle').and.callThrough();
    translate.get("dictionary")
      .pipe(
        tap((result) => {
          expect(translationHandler.handle).toHaveBeenCalledWith(jasmine.objectContaining({key: "dictionary", rawTranslation: translations["dictionary"]}));
          expect(result).toEqual("dictionary");
        })
      )
      .subscribe();
  })
})

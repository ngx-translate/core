import {TestBed} from "@angular/core/testing";
import {Observable, of} from "rxjs";
import {TranslateCompiler, TranslateFakeCompiler, TranslateLoader, TranslateModule, TranslateService} from "../public-api";

let translations: any = {LOAD: 'This is a test'};

class FakeLoader implements TranslateLoader {
  getTranslation(lang: string): Observable<any> {
    return of(translations);
  }
}

describe('TranslateCompiler', () => {
  let translate: TranslateService;

  describe('with default TranslateFakeCompiler', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [
          TranslateModule.forRoot({
            loader: {provide: TranslateLoader, useClass: FakeLoader},
            compiler: {provide: TranslateCompiler, useClass: TranslateFakeCompiler}
          })
        ],
      });
      translate = TestBed.inject(TranslateService);

      translate.use('en');
    });

    it('should use the correct compiler', () => {
      expect(translate).toBeDefined();
      expect(translate.compiler).toBeDefined();
      expect(translate.compiler instanceof TranslateFakeCompiler).toBeTruthy();
    });

    it('should use the compiler on loading translations', () => {
      translate.get('LOAD').subscribe((res: string) => {
        expect(res).toBe('This is a test');
      });
    });

    it('should use the compiler on manually adding a translation object', () => {
      translate.setTranslation('en', {'SET-TRANSLATION': 'A manually added translation'});
      expect(translate.instant('SET-TRANSLATION')).toBe('A manually added translation');
    });

    it('should use the compiler on manually adding a single translation', () => {
      translate.set('SET', 'Another manually added translation', 'en');
      expect(translate.instant('SET')).toBe('Another manually added translation');
    });
  });

  describe('with a custom compiler implementation', () => {
    class CustomCompiler implements TranslateCompiler {
      compile(value: string, lang: string): string {
        return value + '|compiled';
      }

      compileTranslations(translation: any, lang: string): Object {
        return Object.keys(translation).reduce((acc: any, key) => {
          acc[key] = () => translation[key] + '|compiled';
          return acc;
        }, {});
      }
    }

    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [
          TranslateModule.forRoot({
            loader: {provide: TranslateLoader, useClass: FakeLoader},
            compiler: {provide: TranslateCompiler, useClass: CustomCompiler}
          })
        ],
      });
      translate = TestBed.inject(TranslateService);

      translate.use('en');
    });

    it('should use the correct compiler', () => {
      expect(translate).toBeDefined();
      expect(translate.compiler).toBeDefined();
      expect(translate.compiler instanceof CustomCompiler).toBeTruthy();
    });

    it('should use the compiler on loading translations', () => {
      translate.get('LOAD').subscribe((res: string) => {
        expect(res).toBe('This is a test|compiled');
      });
    });

    it('should use the compiler on manually adding a translation object', () => {
      translate.setTranslation('en', {'SET-TRANSLATION': 'A manually added translation'});
      expect(translate.instant('SET-TRANSLATION')).toBe('A manually added translation|compiled');
    });

    it('should use the compiler on manually adding a single translation', () => {
      translate.set('SET', 'Another manually added translation', 'en');
      expect(translate.instant('SET')).toBe('Another manually added translation|compiled');
    });
  });
});

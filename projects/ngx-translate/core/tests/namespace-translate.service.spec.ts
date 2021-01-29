import { TestBed } from "@angular/core/testing";
import { Observable, of, zip } from "rxjs";
import { take, toArray, first } from 'rxjs/operators';
import { TranslateLoader, TranslateModule, TranslateService, NamespaceTranslateService, TRANSLATION_NAMESPACE } from '../src/public_api';
import * as flatten from "flat";

let translations: any = { "NAMESPACE": { "TEST": "This is a namespace test" } };

class FakeLoader implements TranslateLoader {
  getTranslation(lang: string): Observable<any> {
    return of(translations);
  }
}

describe('NamespaceTranslateService', () => {

  describe('getNamespacedKey', () => {
    let namespaceTranslate: NamespaceTranslateService;
    let translate: TranslateService;

    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [
          TranslateModule.forRoot({
            loader: { provide: TranslateLoader, useClass: FakeLoader }
          })
        ],
        providers: [{ provide: TRANSLATION_NAMESPACE, useValue: "NAMESPACE" }]
      });
      namespaceTranslate = TestBed.inject(NamespaceTranslateService);
      translate = TestBed.inject(TranslateService);
    });

    afterEach(() => {
      namespaceTranslate = undefined;
      translate = undefined;
      translations = { "NAMESPACE": { "TEST": "This is a namespace test" } };
    });

    it('should prefix namespace to single key', () => {
      const result = namespaceTranslate["getNamespacedKey"]("TEST");
      expect(result).toBe("NAMESPACE.TEST");
    });

    it('should prefix namespace to multiple keys', () => {
      const result = namespaceTranslate["getNamespacedKey"](["TEST1", "TEST2"]);
      expect(result).toEqual(["NAMESPACE.TEST1", "NAMESPACE.TEST2"]);
    });

    it('should throw if you forget the key', () => {

      expect(() => {
        namespaceTranslate["getNamespacedKey"](undefined);
      }).toThrowError('Parameter "key" required');

      expect(() => {
        namespaceTranslate["getNamespacedKey"]('');
      }).toThrowError('Parameter "key" required');

      expect(() => {
        namespaceTranslate["getNamespacedKey"](null);
      }).toThrowError('Parameter "key" required');
    });

    it('should return unchanged key if no key is given and skipKeyCheck is true', () => {

      expect(
        namespaceTranslate["getNamespacedKey"](undefined, true)
      ).toBeUndefined()

      expect(
        namespaceTranslate["getNamespacedKey"]('', true)
      ).toBe('');

      expect(
        namespaceTranslate["getNamespacedKey"](null, true)
      ).toBeNull();

    });

  });

  describe('interaction between TranslateService and NamespaceTranslateService', () => {
    let namespaceTranslate: NamespaceTranslateService;
    let translate: TranslateService;

    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [
          TranslateModule.forRoot({
            loader: { provide: TranslateLoader, useClass: FakeLoader }
          })
        ],
        providers: [{ provide: TRANSLATION_NAMESPACE, useValue: "NAMESPACE" }]
      });
      namespaceTranslate = TestBed.inject(NamespaceTranslateService);
      translate = TestBed.inject(TranslateService);
    });

    afterEach(() => {
      namespaceTranslate = undefined;
      translate = undefined;
      translations = { "NAMESPACE": { "TEST": "This is a namespace test" } };
    });

    it('is defined', () => {
      expect(NamespaceTranslateService).toBeDefined();
      expect(namespaceTranslate).toBeDefined();
      expect(namespaceTranslate instanceof NamespaceTranslateService).toBeTruthy();
    });

    it('should be able to get translations', () => {
      translations = { "NAMESPACE": { "TEST": "This is a test", "TEST2": "This is another test" } };
      translate.use('en');

      // this will request the translation from the backend because we use a static files loader for TranslateService
      namespaceTranslate.get('TEST').subscribe((res: string) => {
        expect(res).toEqual('This is a test');
      });


      // this will request the translation from downloaded translations without making a request to the backend
      namespaceTranslate.get('TEST2').subscribe((res: string) => {
        expect(res).toEqual('This is another test');
      });
    });

    it('should be able to get an array translations', () => {
      translations = { "NAMESPACE": { "TEST": "This is a test", "TEST2": "This is another test2" } };
      translate.use('en');

      // this will request the translation from the backend because we use a static files loader for TranslateService
      namespaceTranslate.get(['TEST', 'TEST2']).subscribe((res: string) => {
        expect(res).toEqual(flatten(translations));
      });
    });

    it("should fallback to the default language", () => {
      translations = {};
      translate.use('fr');

      namespaceTranslate.get('TEST').subscribe((res: string) => {
        expect(res).toEqual('NAMESPACE.TEST');

        translate.setDefaultLang('nl');
        translate.setTranslation('nl', { "NAMESPACE": { "TEST": "Dit is een test" } });

        namespaceTranslate.get('TEST').subscribe((res2: string) => {
          expect(res2).toEqual('Dit is een test');
          expect(translate.getDefaultLang()).toEqual('nl');
        });
      });
    });

    it("should use the default language by default", () => {
      translate.setDefaultLang('nl');
      translate.setTranslation('nl', { "NAMESPACE": { "TEST": "Dit is een test" } });

      namespaceTranslate.get('TEST').subscribe((res: string) => {
        expect(res).toEqual('Dit is een test');
      });
    });

    it("should return the key when it doesn't find a translation", () => {
      translate.use('en');

      namespaceTranslate.get('TEST2').subscribe((res: string) => {
        expect(res).toEqual('NAMESPACE.TEST2');
      });
    });

    it("should return the key when you haven't defined any translation", () => {
      namespaceTranslate.get('TEST').subscribe((res: string) => {
        expect(res).toEqual('NAMESPACE.TEST');
      });
    });

    it('should return an empty value', () => {
      translate.setDefaultLang('en');
      translate.setTranslation('en', { "NAMESPACE": { "TEST": "" } });

      namespaceTranslate.get('TEST').subscribe((res: string) => {
        expect(res).toEqual('');
      });
    });

    it('should be able to get translations with params', () => {
      translations = { "NAMESPACE": { "TEST": "This is a test {{param}}" } };
      translate.use('en');

      namespaceTranslate.get('TEST', { param: 'with param' }).subscribe((res: string) => {
        expect(res).toEqual('This is a test with param');
      });

    });

    it('should be able to get translations with nested params', () => {
      translations = { "NAMESPACE": { "TEST": "This is a test {{param.value}}" } };
      translate.use('en');

      namespaceTranslate.get('TEST', { param: { value: 'with param' } }).subscribe((res: string) => {
        expect(res).toEqual('This is a test with param');
      });

    });

    it('should throw if you forget the key', () => {
      translate.use('en');

      expect(() => {
        namespaceTranslate.get(undefined);
      }).toThrowError('Parameter "key" required');

      expect(() => {
        namespaceTranslate.get('');
      }).toThrowError('Parameter "key" required');

      expect(() => {
        namespaceTranslate.get(null);
      }).toThrowError('Parameter "key" required');

      expect(() => {
        namespaceTranslate.instant(undefined);
      }).toThrowError('Parameter "key" required');
    });

    it('should be able to get translations with nested keys', () => {
      translations = { "NAMESPACE": { "TEST": { "TEST": "This is a test" }, "TEST2": { "TEST2": { "TEST2": "This is another test" } } } };
      translate.use('en');

      namespaceTranslate.get('TEST.TEST').subscribe((res: string) => {
        expect(res).toEqual('This is a test');
      });


      namespaceTranslate.get('TEST2.TEST2.TEST2').subscribe((res: string) => {
        expect(res).toEqual('This is another test');
      });
    });

    it("shouldn't call the current loader if you set the translation yourself", (done: Function) => {
      translations = {};
      translate.setTranslation('en', { "NAMESPACE": { "TEST": "This is a test" } });
      translate.use('en');

      namespaceTranslate.get('TEST').subscribe((res: string) => {
        expect(res).toEqual('This is a test');
        expect(translations).toEqual({});
        done();
      });
    });

    it('should be able to get a stream array', (done: Function) => {
      let tr = { "NAMESPACE": { "TEST": "This is a test", "TEST2": "This is a test2" } };
      translate.setTranslation('en', tr);
      translate.use('en');

      namespaceTranslate.getStreamOnTranslationChange(['TEST', 'TEST2']).subscribe((res: any) => {
        expect(res).toEqual(flatten(tr));
        done();
      });
    });

    it('should initially return the same value for getStreamOnTranslationChange and non-streaming get', (done: Function) => {
      translations = { "NAMESPACE": { "TEST": "This is a test" } };
      translate.use('en');

      zip(namespaceTranslate.getStreamOnTranslationChange('TEST'), namespaceTranslate.get('TEST')).subscribe((value: [string, string]) => {
        const [streamed, nonStreamed] = value;
        expect(streamed).toEqual('This is a test');
        expect(streamed).toEqual(nonStreamed);
        done();
      });
    });

    it('should be able to stream a translation on translation change', (done: Function) => {
      translations = { "NAMESPACE": { "TEST": "This is a test" } };
      translate.use('en');

      namespaceTranslate.getStreamOnTranslationChange('TEST').pipe(take(3), toArray()).subscribe((res: string[]) => {
        const expected = ['This is a test', 'I changed the test value!', 'I changed it again!'];
        expect(res).toEqual(expected);
        done();
      });
      translate.setTranslation('en', { "NAMESPACE": { "TEST": "I changed the test value!" } });
      translate.setTranslation('en', { "NAMESPACE": { "TEST": "I changed it again!" } });
    });

    it('should interpolate the same param into each streamed value when get strean on translation change', (done: Function) => {
      translations = { "NAMESPACE": { "TEST": "This is a test {{param}}" } };
      translate.use('en');

      namespaceTranslate.getStreamOnTranslationChange('TEST', { param: 'with param' }).subscribe((res: string[]) => {
        const expected = 'This is a test with param';
        expect(res).toEqual(expected);
        done();
      });
    });

    it('should be able to stream a translation for the current language', (done: Function) => {
      translations = { "NAMESPACE": { "TEST": "This is a test" } };
      translate.use('en');

      namespaceTranslate.stream('TEST').subscribe((res: string) => {
        expect(res).toEqual('This is a test');
        done();
      });
    });

    it('should be able to stream a translation of an array for the current language', (done: Function) => {
      let tr = { "NAMESPACE": { "TEST": "This is a test", "TEST2": "This is a test2" } };
      translate.setTranslation('en', tr);
      translate.use('en');

      namespaceTranslate.stream(['TEST', 'TEST2']).subscribe((res: any) => {
        expect(res).toEqual(flatten(tr));
        done();
      });
    });

    it('should initially return the same value for streaming and non-streaming get', (done: Function) => {
      translations = { "NAMESPACE": { "TEST": "This is a test" } };
      translate.use('en');

      zip(namespaceTranslate.stream('TEST'), namespaceTranslate.get('TEST')).subscribe((value: [string, string]) => {
        const [streamed, nonStreamed] = value;
        expect(streamed).toEqual('This is a test');
        expect(streamed).toEqual(nonStreamed);
        done();
      });
    });

    it('should update streaming translations on language change', (done: Function) => {
      translations = { "NAMESPACE": { "TEST": "This is a test" } };
      translate.use('en');

      namespaceTranslate.stream('TEST').pipe(take(3), toArray()).subscribe((res: string[]) => {
        const expected = ['This is a test', 'Dit is een test', 'This is a test'];
        expect(res).toEqual(expected);
        done();
      });

      translate.setTranslation('nl', { "NAMESPACE": { "TEST": "Dit is een test" } });
      translate.use('nl');
      translate.use('en');
    });

    it('should update lazy streaming translations on translation change', (done: Function) => {
      translations = { "NAMESPACE": { "TEST": "This is a test" } };
      translate.use('en');

      const translation$ = namespaceTranslate.getStreamOnTranslationChange('TEST');

      translate.setTranslation('en', { "NAMESPACE": { "TEST": "This is a test2" } });

      translation$.pipe(first()).subscribe((res: string[]) => {
        const expected = "This is a test2";
        expect(res).toEqual(expected);
        done();
      });
    });

    it('should update lazy streaming translations on language change', (done: Function) => {
      translations = { "NAMESPACE": { "TEST": "This is a test" } };
      translate.use('en');

      const translation$ = namespaceTranslate.stream('TEST');

      translate.setTranslation('nl', { "NAMESPACE": { "TEST": "Dit is een test" } });
      translate.use('nl');

      translation$.pipe(first()).subscribe((res: string[]) => {
        const expected = 'Dit is een test';
        expect(res).toEqual(expected);
        done();
      });
    });

    it('should update streaming translations of an array on language change', (done: Function) => {
      const en = { "NAMESPACE": { "TEST": "This is a test", "TEST2": "This is a test2" } };
      const nl = { "NAMESPACE": { "TEST": "Dit is een test", "TEST2": "Dit is een test2" } };
      translate.setTranslation('en', en);
      translate.use('en');

      namespaceTranslate.stream(['TEST', 'TEST2']).pipe(take(3), toArray()).subscribe((res: any[]) => {
        const expected = [flatten(en), flatten(nl), flatten(en)];
        expect(res).toEqual(expected);
        done();
      });

      translate.setTranslation('nl', nl);
      translate.use('nl');
      translate.use('en');
    });

    it('should interpolate the same param into each streamed value', (done: Function) => {
      translations = { "NAMESPACE": { "TEST": "This is a test {{param}}" } };
      translate.use('en');

      namespaceTranslate.stream('TEST', { param: 'with param' }).pipe(take(3), toArray()).subscribe((res: string[]) => {
        const expected = [
          'This is a test with param',
          'Dit is een test with param',
          'This is a test with param'
        ];
        expect(res).toEqual(expected);
        done();
      });

      translate.setTranslation('nl', { "NAMESPACE": { "TEST": "Dit is een test {{param}}" } });
      translate.use('nl');
      translate.use('en');
    });

    it('should be able to get instant translations', () => {
      translate.setTranslation('en', { "NAMESPACE": { "TEST": "This is a test" } });
      translate.use('en');

      expect(namespaceTranslate.instant('TEST')).toEqual('This is a test');
    });

    it('should be able to get instant translations of an array', () => {
      let tr = { "NAMESPACE": { "TEST": "This is a test", "TEST2": "This is a test2" } };
      translate.setTranslation('en', tr);
      translate.use('en');

      expect(namespaceTranslate.instant(['TEST', 'TEST2'])).toEqual(flatten(tr));
    });

    it('should return the key if instant translations are not available', () => {
      translate.setTranslation('en', { "NAMESPACE": { "TEST": "This is a test" } });
      translate.use('en');

      expect(namespaceTranslate.instant('TEST2')).toEqual('NAMESPACE.TEST2');
    });
  });
});

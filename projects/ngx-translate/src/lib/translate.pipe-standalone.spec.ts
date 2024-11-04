import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Injectable,
  Type,
  ViewContainerRef
} from "@angular/core";
import {TestBed} from "@angular/core/testing";
import {Observable, of, timer} from "rxjs";
import {
  DefaultLangChangeEvent,
  LangChangeEvent, MissingTranslationHandler, MissingTranslationHandlerParams, provideTranslateService,
  TranslateLoader,
  TranslatePipe,
  TranslateService, Translation,
  TranslationObject
} from "../public-api";
import {map} from "rxjs/operators";

class FakeChangeDetectorRef extends ChangeDetectorRef {
  markForCheck(): void {
    // Intentionally left empty
  }

  detach(): void {
    // Intentionally left empty
  }

  detectChanges(): void {
    // Intentionally left empty
  }

  checkNoChanges(): void {
    // Intentionally left empty
  }

  reattach(): void {
    // Intentionally left empty
  }
}

@Injectable()
@Component({
  selector: 'lib-hmx-app',
  standalone: true,
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `{{'TEST' | translate}}`
})
class AppComponent {
  viewContainerRef: ViewContainerRef;

  constructor(viewContainerRef: ViewContainerRef) {
    this.viewContainerRef = viewContainerRef;
  }
}

let translations: TranslationObject = {"TEST": "This is a test"};

@Injectable()
class FakeLoader implements TranslateLoader {
  getTranslation(lang: string): Observable<TranslationObject> {
    void lang;
    return of(translations);
  }
}

@Injectable()
class DelayedFrenchLoader implements TranslateLoader {
  getTranslation(lang: string): Observable<TranslationObject> {
    return lang === 'fr' ? timer(10).pipe(map(() => translations)) : of(translations);
  }
}

@Injectable()
class MissingObs implements MissingTranslationHandler {
  handle(params: MissingTranslationHandlerParams): Translation|Observable<Translation> {
    return timer(1).pipe(map(() => `handled: ${params.key}`));
  }
}

describe('TranslatePipe (standalone)', () => {
  let translate: TranslateService;
  let translatePipe: TranslatePipe;
  let ref: FakeChangeDetectorRef;

  const prepare = ({handlerClass, loaderClass}: {handlerClass?: Type<MissingTranslationHandler>; loaderClass?: Type<TranslateLoader>} = {}) => {

      const missingTranslationHandler  = handlerClass
                                         ? {missingTranslationHandler:{provide: MissingTranslationHandler, useClass: handlerClass}}
                                         : {};

    TestBed.configureTestingModule({
      providers: [
        provideTranslateService({
        loader: { provide: TranslateLoader, useClass: loaderClass ?? FakeLoader },
        ... missingTranslationHandler,
        useDefaultLang: !handlerClass
      })]
    });
    translate = TestBed.inject(TranslateService);
    ref = new FakeChangeDetectorRef();
    translatePipe = new TranslatePipe(translate, ref);
  };

  afterEach(() => {
    translations = {"TEST": "This is a test"};
  });

  it('is defined', () => {
    prepare();
    expect(TranslatePipe).toBeDefined();
    expect(translatePipe).toBeDefined();
    expect(translatePipe instanceof TranslatePipe).toBeTruthy();
  });

  it('should translate a string', () => {
    prepare();
    translate.setTranslation('en', {"TEST": "This is a test"});
    translate.use('en');

    expect(translatePipe.transform('TEST')).toEqual("This is a test");
  });

  it('should call markForChanges when it translates a string', () => {
    prepare();
    translate.setTranslation('en', {"TEST": "This is a test"});
    translate.use('en');
    spyOn(ref, 'markForCheck').and.callThrough();

    translatePipe.transform('TEST');
    expect(ref.markForCheck).toHaveBeenCalled();
  });

  it('should translate a string with object parameters', () => {
    prepare();
    translate.setTranslation('en', {"TEST": "This is a test {{param}}"});
    translate.use('en');

    expect(translatePipe.transform('TEST', {param: "with param"})).toEqual("This is a test with param");
  });

  it('should translate a string with object as string parameters', () => {
    prepare();
    translate.setTranslation('en', {"TEST": "This is a test {{param}}"});
    translate.use('en');

    expect(translatePipe.transform('TEST', '{param: "with param"}')).toEqual("This is a test with param");
    expect(translatePipe.transform('TEST', '{"param": "with param"}')).toEqual("This is a test with param");
    expect(translatePipe.transform('TEST', "{param: 'with param'}")).toEqual("This is a test with param");
    expect(translatePipe.transform('TEST', "{'param' : 'with param'}")).toEqual("This is a test with param");
  });

  it('should translate a string with object as multiple string parameters', () => {
    prepare();
    translate.setTranslation('en', {"TEST": "This is a test {{param1}} {{param2}}"});
    translate.use('en');

    expect(translatePipe.transform('TEST', '{param1: "with param-1", param2: "and param-2"}'))
      .toEqual("This is a test with param-1 and param-2");
    expect(translatePipe.transform('TEST', '{"param1": "with param-1", "param2": "and param-2"}'))
      .toEqual("This is a test with param-1 and param-2");
    expect(translatePipe.transform('TEST', "{param1: 'with param-1', param2: 'and param-2'}"))
      .toEqual("This is a test with param-1 and param-2");
    expect(translatePipe.transform('TEST', "{'param1' : 'with param-1', 'param2': 'and param-2'}"))
      .toEqual("This is a test with param-1 and param-2");
  });

  it('should translate a string with object as nested string parameters', () => {
    prepare();
    translate.setTranslation('en', {"TEST": "This is a test {{param.one}} {{param.two}}"});
    translate.use('en');

    expect(translatePipe.transform('TEST', '{param: {one: "with param-1", two: "and param-2"}}'))
      .toEqual("This is a test with param-1 and param-2");
    expect(translatePipe.transform('TEST', '{"param": {"one": "with param-1", "two": "and param-2"}}'))
      .toEqual("This is a test with param-1 and param-2");
    expect(translatePipe.transform('TEST', "{param: {one: 'with param-1', two: 'and param-2'}}"))
      .toEqual("This is a test with param-1 and param-2");
    expect(translatePipe.transform('TEST', "{'param' : {'one': 'with param-1', 'two': 'and param-2'}}"))
      .toEqual("This is a test with param-1 and param-2");
  });

  it('should translate an object', () => {
    prepare();

    translate.setTranslation('en', {
      OBJECT: {
        TEST: 'This is a test'
      }
    });
    translate.use('en');

    expect(translatePipe.transform('OBJECT')).toEqual({ TEST: 'This is a test' });
  });

  it('should translate an object with another object as string parameters', () => {
    prepare();

    translate.setTranslation('en', {
      OBJECT: {
        TEST: 'This is a test {{param}}'
      }
    });
    translate.use('en');

    expect(translatePipe.transform('OBJECT', { param: 'with param-1' })).toEqual({ TEST: 'This is a test with param-1' });
  });

  it('should update the value when the parameters change', () => {
    prepare();
    translate.setTranslation('en', {"TEST": "This is a test {{param}}"});
    translate.use('en');

    spyOn(translatePipe, 'updateValue').and.callThrough();
    spyOn(ref, 'markForCheck').and.callThrough();

    expect(translatePipe.transform('TEST', {param: "with param"})).toEqual("This is a test with param");
    expect(translatePipe.updateValue).toHaveBeenCalledTimes(1);

    // same value, shouldn't call 'updateValue' again
    expect(translatePipe.transform('TEST', {param: "with param"})).toEqual("This is a test with param");
    expect(translatePipe.updateValue).toHaveBeenCalledTimes(1);

    // different param, should call 'updateValue'
    expect(translatePipe.transform('TEST', {param: "with param2"})).toEqual("This is a test with param2");
    expect(translatePipe.updateValue).toHaveBeenCalledTimes(2);

    expect(ref.markForCheck).toHaveBeenCalledTimes(2);
  });

  it("should throw if you don't give an object parameter", () => {
    prepare();
    translate.setTranslation('en', {"TEST": "This is a test {{param}}"});
    translate.use('en');
    const param = 'param: "with param"';

    expect(() => {
      translatePipe.transform('TEST', param);
    }).toThrowError(`Wrong parameter in TranslatePipe. Expected a valid Object, received: ${param}`);
  });

  it("should return given falsey or non length query", () => {
    prepare();
    translate.setTranslation('en', {"TEST": "This is a test"});
    translate.use('en');

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    expect(translatePipe.transform(null as any)).toBeNull();

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    expect(translatePipe.transform(undefined as any)).toBeUndefined();

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    expect(translatePipe.transform(1234 as any)).toBe(1234);
  });

  describe('should update translations on lang change', () => {
    it('with fake loader', (done) => {
      prepare();
      translate.setTranslation('en', {"TEST": "This is a test"});
      translate.setTranslation('fr', {"TEST": "C'est un test"});
      translate.use('en');

      expect(translatePipe.transform('TEST')).toEqual("This is a test");

      // this will be resolved at the next lang change
      const subscription = translate.onLangChange.subscribe((res: LangChangeEvent) => {
        expect(res.lang).toEqual('fr');
        expect(translatePipe.transform('TEST')).toEqual("C'est un test");
        subscription.unsubscribe();
        done();
      });

      translate.use('fr');
    });

    it('with file loader', (done) => {
      prepare();
      translate.use('en');
      expect(translatePipe.transform('TEST')).toEqual("This is a test");

      // this will be resolved at the next lang change
      const subscription = translate.onLangChange.subscribe((res: LangChangeEvent) => {
        // let it update the translations
        setTimeout(() => {
          expect(res.lang).toEqual('fr');
          expect(translatePipe.transform('TEST')).toEqual("C'est un test");
          subscription.unsubscribe();
          done();
        });
      });

      translations = {"TEST": "C'est un test"};
      translate.use('fr');
    });

    it('should detect changes with OnPush', () => {
      prepare();
      const fixture = TestBed.createComponent(AppComponent);
      fixture.detectChanges();
      expect(fixture.debugElement.nativeElement.innerHTML).toEqual("TEST");
      translate.use('en');
      fixture.detectChanges();
      expect(fixture.debugElement.nativeElement.innerHTML).toEqual("This is a test");
    });
  });

  describe('should update translations on default lang change', () => {
    it('with fake loader', (done) => {
      prepare();
      translate.setTranslation('en', {"TEST": "This is a test"});
      translate.setTranslation('fr', {"TEST": "C'est un test"});
      translate.setDefaultLang('en');

      expect(translatePipe.transform('TEST')).toEqual("This is a test");

      // this will be resolved at the next lang change
      const subscription = translate.onDefaultLangChange.subscribe((res: DefaultLangChangeEvent) => {
        expect(res.lang).toEqual('fr');
        expect(translatePipe.transform('TEST')).toEqual("C'est un test");
        subscription.unsubscribe();
        done();
      });

      translate.setDefaultLang('fr');
    });

    it('with file loader', (done) => {
      prepare();
      translate.setDefaultLang('en');
      expect(translatePipe.transform('TEST')).toEqual("This is a test");

      // this will be resolved at the next lang change
      const subscription = translate.onDefaultLangChange.subscribe((res: DefaultLangChangeEvent) => {
        // let it update the translations
        setTimeout(() => {
          expect(res.lang).toEqual('fr');
          expect(translatePipe.transform('TEST')).toEqual("C'est un test");
          subscription.unsubscribe();
          done();
        });
      });

      translations = {"TEST": "C'est un test"};
      translate.setDefaultLang('fr');
    });

    it('without proper key', (done) => {
      prepare({ handlerClass: MissingObs, loaderClass: DelayedFrenchLoader });
      translate.use('en');
      expect(translatePipe.transform('nonExistingKey')).toEqual("");

      // this will be resolved at the next lang change
      const subscription = translate.onLangChange.subscribe((res: DefaultLangChangeEvent) => {
        expect(res.lang).toEqual('fr');
        expect(translatePipe.transform('nonExistingKey')).toEqual("handled: nonExistingKey");
        subscription.unsubscribe();
        done();
      });

      translations = {"TEST": "C'est un test"};
      translate.use('fr');
    })

    it('should detect changes with OnPush', () => {
      prepare();

      const fixture = TestBed.createComponent(AppComponent);
      fixture.detectChanges();
      expect(fixture.debugElement.nativeElement.innerHTML).toEqual("TEST");
      translate.setDefaultLang('en');
      fixture.detectChanges();
      expect(fixture.debugElement.nativeElement.innerHTML).toEqual("This is a test");
    });
  });
});

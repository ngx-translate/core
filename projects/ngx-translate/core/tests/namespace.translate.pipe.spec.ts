import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Injectable, ViewContainerRef } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { Observable, of } from "rxjs";
import { DefaultLangChangeEvent, LangChangeEvent, TranslateLoader, TranslateModule, TranslateService, NamespaceTranslatePipe, NamespaceTranslateService, TRANSLATION_NAMESPACE } from "../src/public_api";


class FakeChangeDetectorRef extends ChangeDetectorRef {
  markForCheck(): void {
  }

  detach(): void {
  }

  detectChanges(): void {
  }

  checkNoChanges(): void {
  }

  reattach(): void {
  }
}

@Injectable()
@Component({
  selector: 'hmx-app',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `{{'TEST' | namespaceTranslate}}`
})
class App {
  viewContainerRef: ViewContainerRef;

  constructor(viewContainerRef: ViewContainerRef) {
    this.viewContainerRef = viewContainerRef;
  }
}

let translations: any = { "NAMESPACE": { "TEST": "This is a test" } };

class FakeLoader implements TranslateLoader {
  getTranslation(lang: string): Observable<any> {
    return of(translations);
  }
}

describe('NamespaceTranslatePipe', () => {
  let translate: TranslateService;
  let namespaceTranslate: NamespaceTranslateService;
  let namespaceTranslatePipe: NamespaceTranslatePipe;
  let ref: any;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: FakeLoader }
        })
      ],
      providers: [{ provide: TRANSLATION_NAMESPACE, useValue: "NAMESPACE" }],
      declarations: [App]
    });
    translate = TestBed.inject(TranslateService);
    namespaceTranslate = TestBed.inject(NamespaceTranslateService);
    ref = new FakeChangeDetectorRef();
    namespaceTranslatePipe = new NamespaceTranslatePipe(namespaceTranslate, translate, ref);
  });

  afterEach(() => {
    translate = undefined;
    translations = { "NAMESPACE": { "TEST": "This is a test" } };
    namespaceTranslatePipe = undefined;
    ref = undefined;
  });

  it('is defined', () => {
    expect(namespaceTranslatePipe).toBeDefined();
    expect(namespaceTranslatePipe).toBeDefined();
    expect(namespaceTranslatePipe instanceof NamespaceTranslatePipe).toBeTruthy();
  });

  it('should translate a string', () => {
    translate.setTranslation('en', { "NAMESPACE": { "TEST": "This is a test" } });
    translate.use('en');

    expect(namespaceTranslatePipe.transform('TEST')).toEqual("This is a test");
  });

  it('should call markForChanges when it translates a string', () => {
    translate.setTranslation('en', { "NAMESPACE": { "TEST": "This is a test" } });
    translate.use('en');
    spyOn(ref, 'markForCheck').and.callThrough();

    namespaceTranslatePipe.transform('TEST');
    expect(ref.markForCheck).toHaveBeenCalled();
  });

  it('should translate a string with object parameters', () => {
    translate.setTranslation('en', { "NAMESPACE": { "TEST": "This is a test {{param}}" } });
    translate.use('en');

    expect(namespaceTranslatePipe.transform('TEST', { param: "with param" })).toEqual("This is a test with param");
  });

  it('should translate a string with object as string parameters', () => {
    translate.setTranslation('en', { "NAMESPACE": { "TEST": "This is a test {{param}}" } });
    translate.use('en');

    expect(namespaceTranslatePipe.transform('TEST', '{param: "with param"}')).toEqual("This is a test with param");
    expect(namespaceTranslatePipe.transform('TEST', '{"param": "with param"}')).toEqual("This is a test with param");
    expect(namespaceTranslatePipe.transform('TEST', "{param: 'with param'}")).toEqual("This is a test with param");
    expect(namespaceTranslatePipe.transform('TEST', "{'param' : 'with param'}")).toEqual("This is a test with param");
  });

  it('should translate a string with object as multiple string parameters', () => {
    translate.setTranslation('en', { "NAMESPACE": { "TEST": "This is a test {{param1}} {{param2}}" } });
    translate.use('en');

    expect(namespaceTranslatePipe.transform('TEST', '{param1: "with param-1", param2: "and param-2"}'))
      .toEqual("This is a test with param-1 and param-2");
    expect(namespaceTranslatePipe.transform('TEST', '{"param1": "with param-1", "param2": "and param-2"}'))
      .toEqual("This is a test with param-1 and param-2");
    expect(namespaceTranslatePipe.transform('TEST', "{param1: 'with param-1', param2: 'and param-2'}"))
      .toEqual("This is a test with param-1 and param-2");
    expect(namespaceTranslatePipe.transform('TEST', "{'param1' : 'with param-1', 'param2': 'and param-2'}"))
      .toEqual("This is a test with param-1 and param-2");
  });

  it('should translate a string with object as nested string parameters', () => {
    translate.setTranslation('en', { "NAMESPACE": { "TEST": "This is a test {{param.one}} {{param.two}}" } });
    translate.use('en');

    expect(namespaceTranslatePipe.transform('TEST', '{param: {one: "with param-1", two: "and param-2"}}'))
      .toEqual("This is a test with param-1 and param-2");
    expect(namespaceTranslatePipe.transform('TEST', '{"param": {"one": "with param-1", "two": "and param-2"}}'))
      .toEqual("This is a test with param-1 and param-2");
    expect(namespaceTranslatePipe.transform('TEST', "{param: {one: 'with param-1', two: 'and param-2'}}"))
      .toEqual("This is a test with param-1 and param-2");
    expect(namespaceTranslatePipe.transform('TEST', "{'param' : {'one': 'with param-1', 'two': 'and param-2'}}"))
      .toEqual("This is a test with param-1 and param-2");
  });

  it('should update the value when the parameters change', () => {
    translate.setTranslation('en', { "NAMESPACE": { "TEST": "This is a test {{param}}" } });
    translate.use('en');

    spyOn(namespaceTranslatePipe, 'updateValue').and.callThrough();
    spyOn(ref, 'markForCheck').and.callThrough();

    expect(namespaceTranslatePipe.transform('TEST', { param: "with param" })).toEqual("This is a test with param");
    // same value, shouldn't call 'updateValue' again
    expect(namespaceTranslatePipe.transform('TEST', { param: "with param" })).toEqual("This is a test with param");
    // different param, should call 'updateValue'
    expect(namespaceTranslatePipe.transform('TEST', { param: "with param2" })).toEqual("This is a test with param2");
    expect(namespaceTranslatePipe.updateValue).toHaveBeenCalledTimes(2);
    expect(ref.markForCheck).toHaveBeenCalledTimes(2);
  });

  it("should throw if you don't give an object parameter", () => {
    translate.setTranslation('en', { "NAMESPACE": { "TEST": "This is a test {{param}}" } });
    translate.use('en');
    let param = 'param: "with param"';

    expect(() => {
      namespaceTranslatePipe.transform('TEST', param);
    }).toThrowError(`Wrong parameter in NamespaceTranslatePipe. Expected a valid Object, received: ${param}`);
  });

  it("should return given falsey or non length query", () => {
    translate.setTranslation('en', { "NAMESPACE": { "TEST": "This is a test" } });
    translate.use('en');

    expect(namespaceTranslatePipe.transform(null)).toBeNull();
    expect(namespaceTranslatePipe.transform(undefined)).toBeUndefined();
    expect(namespaceTranslatePipe.transform(1234 as any)).toBe(1234);
  });

  describe('should update translations on lang change', () => {
    it('with fake loader', (done) => {
      translate.setTranslation('en', { "NAMESPACE": { "TEST": "This is a test" } });
      translate.setTranslation('fr', { "NAMESPACE": { "TEST": "C'est un test" } });
      translate.use('en');

      expect(namespaceTranslatePipe.transform('TEST')).toEqual("This is a test");

      // this will be resolved at the next lang change
      let subscription = translate.onLangChange.subscribe((res: LangChangeEvent) => {
        expect(res.lang).toEqual('fr');
        expect(namespaceTranslatePipe.transform('TEST')).toEqual("C'est un test");
        subscription.unsubscribe();
        done();
      });

      translate.use('fr');
    });

    it('with file loader', (done) => {
      translate.use('en');
      expect(namespaceTranslatePipe.transform('TEST')).toEqual("This is a test");

      // this will be resolved at the next lang change
      let subscription = translate.onLangChange.subscribe((res: LangChangeEvent) => {
        // let it update the translations
        setTimeout(() => {
          expect(res.lang).toEqual('fr');
          expect(namespaceTranslatePipe.transform('TEST')).toEqual("C'est un test");
          subscription.unsubscribe();
          done();
        });
      });

      translations = { "NAMESPACE": { "TEST": "C'est un test" } };
      translate.use('fr');
    });

    it('should detect changes with OnPush', () => {
      let fixture = (<any>TestBed).createComponent(App);
      fixture.detectChanges();
      expect(fixture.debugElement.nativeElement.innerHTML).toEqual("NAMESPACE.TEST");
      translate.use('en');
      fixture.detectChanges();
      expect(fixture.debugElement.nativeElement.innerHTML).toEqual("This is a test");
    });
  });

  describe('should update translations on default lang change', () => {
    it('with fake loader', (done) => {
      translate.setTranslation('en', { "NAMESPACE": { "TEST": "This is a test" } });
      translate.setTranslation('fr', { "NAMESPACE": { "TEST": "C'est un test" } });
      translate.setDefaultLang('en');

      expect(namespaceTranslatePipe.transform('TEST')).toEqual("This is a test");

      // this will be resolved at the next lang change
      let subscription = translate.onDefaultLangChange.subscribe((res: DefaultLangChangeEvent) => {
        expect(res.lang).toEqual('fr');
        expect(namespaceTranslatePipe.transform('TEST')).toEqual("C'est un test");
        subscription.unsubscribe();
        done();
      });

      translate.setDefaultLang('fr');
    });

    it('with file loader', (done) => {
      translate.setDefaultLang('en');
      expect(namespaceTranslatePipe.transform('TEST')).toEqual("This is a test");

      // this will be resolved at the next lang change
      let subscription = translate.onDefaultLangChange.subscribe((res: DefaultLangChangeEvent) => {
        // let it update the translations
        setTimeout(() => {
          expect(res.lang).toEqual('fr');
          expect(namespaceTranslatePipe.transform('TEST')).toEqual("C'est un test");
          subscription.unsubscribe();
          done();
        });
      });

      translations = { "NAMESPACE": { "TEST": "C'est un test" } };
      translate.setDefaultLang('fr');
    });

    it('should detect changes with OnPush', () => {
      let fixture = (<any>TestBed).createComponent(App);
      fixture.detectChanges();
      expect(fixture.debugElement.nativeElement.innerHTML).toEqual("NAMESPACE.TEST");
      translate.setDefaultLang('en');
      fixture.detectChanges();
      expect(fixture.debugElement.nativeElement.innerHTML).toEqual("This is a test");
    });
  });
});

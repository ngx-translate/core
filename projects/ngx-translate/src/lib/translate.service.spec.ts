import {fakeAsync, TestBed, tick} from "@angular/core/testing";
import {Observable, of, timer, zip, defer, EMPTY} from "rxjs";
import {take, toArray, first, map} from "rxjs/operators";
import {
  LangChangeEvent,
  TranslateLoader,
  TranslateService,
  TranslationChangeEvent, TranslationObject, Translation, provideTranslateService, TranslatePipe, TranslateModule
} from "../public-api";
import {Component, ENVIRONMENT_INITIALIZER, inject} from "@angular/core";
import {provideRouter, Router, RouterOutlet} from "@angular/router";
import {provideLocationMocks} from "@angular/common/testing";


let translations: TranslationObject = {"TEST": "This is a test"};


interface FakeNavigator
{
  languages?: string[],
  language?: string,
  browserLanguage?: string,
  userLanguage?: string,
}


class FakeLoader implements TranslateLoader
{
  getTranslation(): Observable<TranslationObject>
  {
    return of(translations);
  }
}




describe("TranslateService (Delayed loading)", () =>
{
  let translate: TranslateService;

  class DelayedLoader implements TranslateLoader {
    getTranslation(lang: string): Observable<TranslationObject> {
      if(lang === "delay-10")
      {
        return timer(10).pipe(map(() => ({"x": "delay 10"}) ));
      }
      else if(lang === "delay-20")
      {
        return timer(20).pipe(map(() => ({"x": "delay 20"}) ));
      }
      else if(lang === "delay-0")
      {
        return of({"x": "no delay"});
      }
      else {
        throw new Error(`Unknown language: ${lang}`);
      }
    }
  }


  beforeEach(() =>
  {
    TestBed.configureTestingModule({
      providers: [
        provideTranslateService({
          loader: {provide: TranslateLoader, useClass: DelayedLoader}
        })
      ]
    });
    translate = TestBed.inject(TranslateService);
  });


  it("currentLang should be the language, on which use() was called last - in order", fakeAsync(() =>
  {
    const completionOrder:string[] = [];

    translate.use("delay-0").subscribe(() => completionOrder.push("delay-0"));
    expect(translate.currentLang).toEqual("delay-0");

    translate.use("delay-10").subscribe(() => completionOrder.push("delay-10"));
    expect(translate.currentLang).toEqual("delay-0"); // stays until loaded

    translate.use("delay-20").subscribe(() => completionOrder.push("delay-20"));
    expect(translate.currentLang).toEqual("delay-0"); // stays until loaded

    tick(50);

    expect(completionOrder).toEqual(["delay-0", "delay-10", "delay-20"]);

    expect(translate.currentLang).toEqual("delay-20");
  }));


  it("currentLang should be the language, on which use() was called last - reverse order", fakeAsync(() =>
  {
    const completionOrder: string[] = [];

    expect(translate.currentLang).toBeUndefined();

    translate.use("delay-20").subscribe(() => completionOrder.push("delay-20"));
    expect(translate.currentLang).toEqual("delay-20");

    translate.use("delay-10").subscribe(() => completionOrder.push("delay-10"));
    expect(translate.currentLang).toEqual("delay-20"); // stays until completed

    translate.use("delay-0").subscribe(() => completionOrder.push("delay-0"));
    expect(translate.currentLang).toEqual("delay-0"); // this one completes immediately

    tick(50);

    expect(completionOrder).toEqual(["delay-0", "delay-10", "delay-20"]);

    expect(translate.currentLang).toEqual("delay-0");
  }));


});

describe("TranslateService", () =>
{
  let translate: TranslateService;

  const fakeNavigator: FakeNavigator = ((window.navigator as unknown) as FakeNavigator);

  beforeEach(() =>
  {
    TestBed.configureTestingModule({
      providers: [
        provideTranslateService({
          loader: {provide: TranslateLoader, useClass: FakeLoader}
        })
      ]
    });
    translate = TestBed.inject(TranslateService);
  });

  afterEach(() =>
  {
    translations = {"TEST": "This is a test"};
  });

  it("is defined", () =>
  {
    expect(TranslateService).toBeDefined();
    expect(translate).toBeDefined();
  });

  it("should be able to get translations", () =>
  {
    translations = {"TEST": "This is a test", "TEST2": "This is another test"};
    translate.use("en");

    // this will request the translation from the backend because we use a static files loader for TranslateService
    translate.get("TEST").subscribe((res: Translation) =>
    {
      expect(res).toEqual("This is a test");
    });

    // this will request the translation from downloaded translations without making a request to the backend
    translate.get("TEST2").subscribe((res: Translation) =>
    {
      expect(res).toEqual("This is another test");
    });
  });

  it("should be able to get an array translations", () =>
  {
    translations = {"TEST": "This is a test", "TEST2": "This is another test2"};
    translate.use("en");

    // this will request the translation from the backend because we use a static files loader for TranslateService
    translate.get(["TEST", "TEST2"]).subscribe((res: Translation) =>
    {
      expect(res).toEqual(translations);
    });
  });

  it("should fallback to the default language", () =>
  {
    translations = {};
    translate.use("fr");

    translate.get("TEST").subscribe((res: Translation) =>
    {
      expect(res).toEqual("TEST");

      translate.setDefaultLang("nl");
      translate.setTranslation("nl", {"TEST": "Dit is een test"});

      translate.get("TEST").subscribe((res2: Translation) =>
      {
        expect(res2).toEqual("Dit is een test");
        expect(translate.getDefaultLang()).toEqual("nl");
      });
    });
  });

  it("should use the default language by default", () =>
  {
    translate.setDefaultLang("nl");
    translate.setTranslation("nl", {"TEST": "Dit is een test"});

    translate.get("TEST").subscribe((res: Translation) =>
    {
      expect(res).toEqual("Dit is een test");
    });
  });

  it("should return the key when it doesn't find a translation", () =>
  {
    translate.use("en");

    translate.get("TEST2").subscribe((res: Translation) =>
    {
      expect(res).toEqual("TEST2");
    });
  });

  it("should return the key when you haven't defined any translation", () =>
  {
    translate.get("TEST").subscribe((res: Translation) =>
    {
      expect(res).toEqual("TEST");
    });
  });

  it("should return an empty value", () =>
  {
    translate.setDefaultLang("en");
    translate.setTranslation("en", {"TEST": ""});

    translate.get("TEST").subscribe((res: Translation) =>
    {
      expect(res).toEqual("");
    });
  });

  it("should be able to get translations with params", () =>
  {
    translations = {"TEST": "This is a test {{param}}"};
    translate.use("en");

    translate.get("TEST", {param: "with param"}).subscribe((res: Translation) =>
    {
      expect(res).toEqual("This is a test with param");
    });

  });

  it("should be able to get translations with nested params", () =>
  {
    translations = {"TEST": "This is a test {{param.value}}"};
    translate.use("en");

    translate.get("TEST", {param: {value: "with param"}}).subscribe((res: Translation) =>
    {
      expect(res).toEqual("This is a test with param");
    });

  });

  it("should throw if you forget the key", () =>
  {
    translate.use("en");

    expect(() =>
    {
      const key: Record<string, string> = {};
      translate.get(key["x"]);
    }).toThrowError("Parameter \"key\" is required and cannot be empty");

    expect(() =>
    {
      translate.get("");
    }).toThrowError("Parameter \"key\" is required and cannot be empty");

    expect(() =>
    {
      const key: Record<string, string> = {};
      translate.instant(key["x"]);
    }).toThrowError("Parameter \"key\" is required and cannot be empty");
  });

  it("should be able to get translations with nested keys", () =>
  {
    translations = {"TEST": {"TEST": "This is a test"}, "TEST2": {"TEST2": {"TEST2": "This is another test"}}};
    translate.use("en");

    translate.get("TEST.TEST").subscribe((res: Translation) =>
    {
      expect(res).toEqual("This is a test");
    });


    translate.get("TEST2.TEST2.TEST2").subscribe((res: Translation) =>
    {
      expect(res).toEqual("This is another test");
    });
  });

  it("should merge translations if option shouldMerge is true", (done: DoneFn) =>
  {
    translations = {};
    translate.setTranslation("en", {"TEST": {"sub1": "value1"}}, true);
    translate.setTranslation("en", {"TEST": {"sub2": "value2"}}, true);
    translate.use("en");

    translate.get("TEST").subscribe((res: Translation) =>
    {
      expect(res).toEqual({"sub1": "value1", "sub2": "value2"});
      expect(translations).toEqual({});
      done();
    });
  });

  it("should merge non-valid JSON translations if option shouldMerge is true", () =>
  {
    translations = {};
    translate.setTranslation("en", {"TEST": {"sub1": () => "value1"}}, true);
    translate.setTranslation("en", {"TEST": {"sub2": () => "value2"}}, true);
    translate.use("en");

    translate.get("TEST.sub1").subscribe((res: Translation) =>
    {
      expect(res).toEqual("value1");
    });
    translate.get("TEST.sub2").subscribe((res: Translation) =>
    {
      expect(res).toEqual("value2");
    });
  });

  it("shouldn't call the current loader if you set the translation yourself", (done: DoneFn) =>
  {
    translations = {};
    translate.setTranslation("en", {"TEST": "This is a test"});
    translate.use("en");

    translate.get("TEST").subscribe((res: Translation) =>
    {
      expect(res).toEqual("This is a test");
      expect(translations).toEqual({});
      done();
    });
  });

  describe("getStreamOnTranslationChange", () =>
  {

    it("throws error if empty key is provided for stream", () =>
    {
      expect(() =>
      {
        translate.getStreamOnTranslationChange("");
      }).toThrowError("Parameter \"key\" is required and cannot be empty");
    });


    it("should be able to get a stream array", (done: DoneFn) =>
    {
      const tr = {"TEST": "This is a test", "TEST2": "This is a test2"};
      translate.setTranslation("en", tr);
      translate.use("en");

      translate.getStreamOnTranslationChange(["TEST", "TEST2"]).subscribe((res: Translation) =>
      {
        expect(res).toEqual(tr);
        done();
      });
    });

    it("returns a function", (done: DoneFn) =>
    {
      translate.setTranslation("en", {"TEST": "This is a test"});
      translate.use("en");

      translate.getStreamOnTranslationChange(["TEST"]).subscribe((res: Translation) =>
      {
        expect(res).toEqual({"TEST": "This is a test"});
        done();
      });
    });

    it("should initially return the same value for getStreamOnTranslationChange and non-streaming get", (done: DoneFn) =>
    {
      translations = {"TEST": "This is a test"};
      translate.use("en");

      zip(
        translate.getStreamOnTranslationChange("TEST"),
        translate.get("TEST")
      ).subscribe((value: Translation[]) =>
        {
          const [streamed, nonStreamed] = value;
          expect(streamed).toEqual("This is a test");
          expect(streamed).toEqual(nonStreamed);
          done();
        }
      );
    });

    it("should be able to stream a translation on translation change", (done: DoneFn) =>
    {
      translations = {"TEST": "This is a test"};
      translate.use("en");

      translate.getStreamOnTranslationChange("TEST")
               .pipe(take(3), toArray())
               .subscribe((res: Translation[]) =>
               {
                 const expected = ["This is a test", "I changed the test value!", "I changed it again!"];
                 expect(res).toEqual(expected);
                 done();
               });

      translate.setTranslation("en", {"TEST": "I changed the test value!"});
      translate.setTranslation("en", {"TEST": "I changed it again!"});
    });

    it("should interpolate the same param into each streamed value when get stream on translation change", (done: DoneFn) =>
    {
      translations = {"TEST": "This is a test {{param}}"};
      translate.use("en");

      translate.getStreamOnTranslationChange("TEST", {param: "with param"}).subscribe((res: Translation) =>
      {
        const expected = "This is a test with param";
        expect(res).toEqual(expected);
        done();
      });
    });


  });


  it("should be able to stream a translation for the current language", (done: DoneFn) =>
  {
    translations = {"TEST": "This is a test"};
    translate.use("en");

    translate.stream("TEST").subscribe((res: Translation) =>
    {
      expect(res).toEqual("This is a test");
      done();
    });
  });

  it("should be able to stream a translation of an array for the current language", (done: DoneFn) =>
  {
    const tr = {"TEST": "This is a test", "TEST2": "This is a test2"};
    translate.setTranslation("en", tr);
    translate.use("en");

    translate.stream(["TEST", "TEST2"]).subscribe((res: Translation) =>
    {
      expect(res).toEqual(tr);
      done();
    });
  });

  it("should initially return the same value for streaming and non-streaming get", (done: DoneFn) =>
  {
    translations = {"TEST": "This is a test"};
    translate.use("en");

    zip(
      translate.stream("TEST"),
      translate.get("TEST")
    ).subscribe((value: Translation[]) =>
    {
      const [streamed, nonStreamed] = value as string[];
      expect(streamed).toEqual("This is a test");
      expect(streamed).toEqual(nonStreamed);
      done();
    });
  });

  it("should update streaming translations on language change", (done: DoneFn) =>
  {
    translations = {"TEST": "This is a test"};
    translate.use("en");

    translate.stream("TEST")
             .pipe(take(3), toArray())
             .subscribe((res: Translation[]) =>
    {
      const expected = ["This is a test", "Dit is een test", "This is a test"];
      expect(res).toEqual(expected);
      done();
    });

    translate.setTranslation("nl", {"TEST": "Dit is een test"});
    translate.use("nl");
    translate.use("en");
  });

  it("should update lazy streaming translations on translation change", (done: DoneFn) =>
  {
    translations = {"TEST": "This is a test"};
    translate.use("en");

    const translation$ = translate.getStreamOnTranslationChange("TEST");

    translate.setTranslation("en", {"TEST": "This is a test2"});

    translation$.pipe(first()).subscribe((res: Translation) =>
    {
      const expected = "This is a test2";
      expect(res).toEqual(expected);
      done();
    });
  });

  it("should update lazy streaming translations on language change", (done: DoneFn) =>
  {
    translations = {"TEST": "This is a test"};
    translate.use("en");

    const translation$ = translate.stream("TEST");

    translate.setTranslation("nl", {"TEST": "Dit is een test"});
    translate.use("nl");

    translation$.pipe(first()).subscribe((res: Translation) =>
    {
      const expected = "Dit is een test";
      expect(res).toEqual(expected);
      done();
    });
  });

  it("should update streaming translations of an array on language change", (done: DoneFn) =>
  {
    const en = {"TEST": "This is a test", "TEST2": "This is a test2"};
    const nl = {"TEST": "Dit is een test", "TEST2": "Dit is een test2"};
    translate.setTranslation("en", en);
    translate.use("en");

    translate.stream(["TEST", "TEST2"])
             .pipe(take(3), toArray())
             .subscribe((res: Translation[]) =>
    {
      const expected = [en, nl, en];
      expect(res).toEqual(expected);
      done();
    });

    translate.setTranslation("nl", nl);
    translate.use("nl");
    translate.use("en");
  });

  it("should interpolate the same param into each streamed value", (done: DoneFn) =>
  {
    translations = {"TEST": "This is a test {{param}}"};
    translate.use("en");

    translate.stream("TEST", {param: "with param"})
             .pipe(take(3), toArray())
             .subscribe((res: Translation[]) =>
    {
      const expected = [
        "This is a test with param",
        "Dit is een test with param",
        "This is a test with param"
      ];
      expect(res).toEqual(expected);
      done();
    });

    translate.setTranslation("nl", {"TEST": "Dit is een test {{param}}"});
    translate.use("nl");
    translate.use("en");
  });


  describe("instant()", () =>
  {
    it("should be able to get instant translations", () =>
    {
      translate.setTranslation("en", {"TEST": "This is a test"});
      translate.use("en");

      expect(translate.instant("TEST")).toEqual("This is a test");
    });

    it("should be able to get instant translations of an array", () =>
    {
      const tr = {"TEST": "This is a test", "TEST2": "This is a test2"};
      translate.setTranslation("en", tr);
      translate.use("en");

      expect(translate.instant(["TEST", "TEST2"])).toEqual(tr);
    });

    it("should return the key if instant translations are not available", () =>
    {
      translate.setTranslation("en", {"TEST": "This is a test"});
      translate.use("en");

      expect(translate.instant("TEST2")).toEqual("TEST2");
    });

    it("should be able to get instant translations of an array", () =>
    {
      const tr = {"TEST": "This is a test", "TEST2": "This is a test2"};
      translate.setTranslation("en", tr);
      translate.use("en");

      expect(translate.instant(["TEST", "TEST2"])).toEqual(tr);
    });

    it("should be able interpolate parameters in array", () =>
    {
      const tr = {"TEST": "Hello {{value}} 1!", "TEST2": "Hello {{value}} 2!"};
      translate.setTranslation("en", tr);
      translate.use("en");

      expect(translate.instant(["TEST", "TEST2"], {value: "world"})).toEqual({
        "TEST": "Hello world 1!",
        "TEST2": "Hello world 2!"
      });
    });

    it("should be able to return sub-trees", () =>
    {
      const tr = {a: {b: {x: "X", y: "Y"}}};
      translate.setTranslation("en", tr);
      translate.use("en");

      expect(translate.instant("a.b")).toEqual({x: "X", y: "Y"});
    });

    it("should be able to interpolate in sub-trees", () =>
    {
      const tr = {a: {b: {x: "{{value}} 1", y: "{{value}} 2"}}};
      translate.setTranslation("en", tr);
      translate.use("en");

      expect(translate.instant("a.b", {value: "world"})).toEqual({x: "world 1", y: "world 2"});
    });

    it("should be able to return arrays", () =>
    {
      const tr = {a: {b: ["X", "Y"]}};
      translate.setTranslation("en", tr);
      translate.use("en");

      expect(translate.instant("a.b")).toEqual(["X", "Y"]);
    });

    it("should  interpolate in arrays", () =>
    {
      const tr = {a: {b: ["{{value}} 1", "{{value}} 2"]}};
      translate.setTranslation("en", tr);
      translate.use("en");

      expect(translate.instant("a.b", {value: "world"})).toEqual(["world 1", "world 2"]);
    });
  });

  describe("set()", () => {
    it('should set translations with nested key (string)', () => {
      translate.setTranslation("en", {profile: "test"});
      translate.use("en");
      translate.set('profile.name', 'Profile Name', "en");
      expect(translate.instant("profile.name")).toEqual('Profile Name');
    });

    it('should set translations with nested key (object)', () => {
      translate.setTranslation("en", {profile: "test"});
      translate.use("en");
      translate.set('a.b', {c: {d: "setting nested object"}}, "en");
      expect(translate.instant("a.b.c.d")).toEqual("setting nested object");
    });

    it("should trigger an event when the translation value changes", () =>
    {
      translate.setTranslation("en", {});
      translate.onTranslationChange.subscribe((event: TranslationChangeEvent) =>
      {
        expect(event.translations).toBeDefined();
        expect((event.translations)["TEST"]).toEqual("This is a test");
        expect(event.lang).toBe("en");
      });
      translate.set("TEST", "This is a test", "en");
    });

    it("should set the translation of the current language", () =>
    {
      translate.setTranslation("en", {});
      translate.use("en");

      translate.onTranslationChange.subscribe((event: TranslationChangeEvent) =>
      {
        expect(event.translations).toBeDefined();
        expect((event.translations)["TEST"]).toEqual("This is a test");
        expect(event.lang).toBe("en");
      });
      translate.set("TEST", "This is a test");
    });
  });

  it("should trigger an event when the lang changes", () =>
  {
    const tr: TranslationObject = {"TEST": "This is a test"};
    translate.setTranslation("en", tr);
    translate.onLangChange.subscribe((event: LangChangeEvent) =>
    {
      expect(event.lang).toBe("en");
      expect(event.translations).toEqual(tr);
    });
    translate.use("en");
  });

  it("should be able to reset a lang", (done: DoneFn) =>
  {
    translate.use("en");

    // this will request the translation from the backend because we use a static files loader for TranslateService
    translate.get("TEST").subscribe((res: Translation) =>
    {
      expect(res).toEqual(translations["TEST"]);

      // reset the lang as if it was never initiated
      translate.resetLang("en");

      expect(translate.instant("TEST")).toEqual("TEST");

      translate.get("TEST").subscribe((res2: Translation) =>
      {
        expect(res2).toEqual("TEST"); // because the loader is "pristine" as if it was never called
        done();
      });
    });
  });

  it("should be able to reload a lang", () =>
  {
    translations = {};
    translate.use("en");

    // this will request the translation from the loader
    translate.get("TEST").subscribe((res: Translation) =>
    {
      expect(res).toEqual("TEST");

      translations = {"TEST": "This is a test 2"};

      // reset the lang as if it was never initiated
      translate.reloadLang("en").subscribe(() =>
      {
        expect(translate.instant("TEST")).toEqual(translations["TEST"]);
      });
    });
  });

  it("should be able to add new languages", () =>
  {
    translate.addLangs(["pl", "es"]);
    expect(translate.getLangs()).toEqual(["pl", "es"]);
    translate.addLangs(["fr"]);
    translate.addLangs(["pl", "fr"]);
    expect(translate.getLangs()).toEqual(["pl", "es", "fr"]);

    // this will request the translation from the backend because we use a static files loader for TranslateService
    translate.use("en").subscribe(() =>
    {
      expect(translate.getLangs()).toEqual(["pl", "es", "fr", "en"]);
      translate.addLangs(["de"]);
      expect(translate.getLangs()).toEqual(["pl", "es", "fr", "en", "de"]);
    });
  });

  it("should be able to set the langs property directly", () =>
  {
    translate.langs = ["pl", "es"];
    expect(translate.getLangs()).toEqual(["pl", "es"]);
  });

  it("should be able to get the browserLang", () =>
  {
    const browserLang = translate.getBrowserLang();
    expect(browserLang).toBeDefined();
    expect(typeof browserLang === "string").toBeTruthy();
  });

  it("should be able to get the browserCultureLang", () =>
  {
    const browserCultureLand = translate.getBrowserCultureLang();
    expect(browserCultureLand).toBeDefined();
    expect(typeof browserCultureLand === "string").toBeTruthy();
  });

  it("should not make duplicate getTranslation calls", fakeAsync(() =>
  {
    let getTranslationCalls = 0;
    spyOn(translate.currentLoader, "getTranslation").and.callFake(() =>
    {
      getTranslationCalls += 1;
      return timer(1000).pipe(map(() => translations));
    });
    translate.use("en");
    translate.use("en");

    tick(1001);

    expect(getTranslationCalls).toEqual(1);
  }));

  it("should subscribe to the loader just once", () =>
  {
    let subscriptions = 0;
    spyOn(translate.currentLoader, "getTranslation").and.callFake(() =>
    {
      return defer(() =>
      {
        subscriptions++;
        return of(translations);
      });
    });
    translate.use("en");
    translate.use("en");
    translate.use("en").subscribe();
    translate.use("en").subscribe();

    expect(subscriptions).toEqual(1);
  });

  it("should compile translations only once, even when subscribing to translations while translations are loading", fakeAsync(() =>
  {
    spyOn(translate.currentLoader, "getTranslation").and.callFake(() =>
    {
      return timer(1000).pipe(map(() => translations));
    });

    let translateCompilerCallCount = 0;
    spyOn(translate.compiler, "compile").and.callFake((value) =>
    {
      ++translateCompilerCallCount;
      return value;
    });
    spyOn(translate.compiler, "compileTranslations").and.callFake((value) =>
    {
      ++translateCompilerCallCount;
      return value;
    });

    translate.setDefaultLang("en-US");
    translate.get("TEST1").subscribe();
    translate.get("TEST2").subscribe();
    translate.get("TEST3").subscribe();
    translate.get("TEST4").subscribe();

    tick(1001);

    expect(translateCompilerCallCount).toBe(1);
  }));

  it("throws error if empty key is provided for stream", () =>
  {
    expect(() =>
    {
      translate.stream("");
    }).toThrowError("Parameter \"key\" required");
  });


  describe("getBrowserLang()", () =>
  {


    it("should return undefined when window is undefined", () =>
    {
      // @ts-expect-error we simulate that the property does not exist - lint does not like this
      spyOnProperty(window, "navigator", "get").and.returnValue(void 0);
      expect(translate.getBrowserLang()).toBeUndefined();
    });


    it("should return undefined if window is undefined", () =>
    {
      // @ts-expect-error we simulate that the property does not exist - lint does not like this
      spyOnProperty(window, "navigator", "get").and.returnValue(void 0);

      expect(translate.getBrowserLang()).toBeUndefined();
    });

    it("should return undefined if window.navigator is undefined", () =>
    {
      // @ts-expect-error we simulate that the property does not exist - lint does not like this
      spyOnProperty(window, "navigator", "get").and.returnValue(void 0);

      expect(translate.getBrowserLang()).toBeUndefined();
    });

    it("should return the first language from window.navigator.languages", () =>
    {
      spyOnProperty(window.navigator, "languages", "get").and.returnValue(["fr-FR", "en-US"]);

      expect(translate.getBrowserLang()).toBe("fr");
    });

    it("should accept _ as separator in language codes", () =>
    {
      spyOnProperty(window.navigator, "languages", "get").and.returnValue(["fr_FR", "en_US"]);

      expect(translate.getBrowserLang()).toBe("fr");
    });

    it("should return window.navigator.language if window.navigator.languages is not defined", () =>
    {
      // @ts-expect-error we simulate that the property does not exist - lint does not like this
      spyOnProperty(window.navigator, "languages", "get").and.returnValue(undefined);
      spyOnProperty(window.navigator, "language", "get").and.returnValue("es-ES");

      expect(translate.getBrowserLang()).toBe("es");
    });

    it("should return window.navigator.browserLanguage if other properties are not defined", () =>
    {
      // @ts-expect-error we simulate that the property does not exist - lint does not like this
      spyOnProperty(window.navigator, "languages", "get").and.returnValue(undefined);

      // @ts-expect-error we simulate that the property does not exist - lint does not like this
      spyOnProperty(window.navigator, "language", "get").and.returnValue(undefined);
      ((window.navigator as unknown) as FakeNavigator).browserLanguage = "de-DE";

      expect(translate.getBrowserLang()).toBe("de");
    });

    it("should return window.navigator.userLanguage if other properties are not defined", () =>
    {
      // @ts-expect-error we simulate that the property does not exist - lint does not like this
      spyOnProperty(window.navigator, "languages", "get").and.returnValue(undefined);

      // @ts-expect-error we simulate that the property does not exist - lint does not like this
      spyOnProperty(window.navigator, "language", "get").and.returnValue(undefined);

      fakeNavigator.browserLanguage = undefined;
      fakeNavigator.userLanguage = "it-IT";

      expect(translate.getBrowserLang()).toBe("it");
    });

    it("should return undefined if all navigator properties are undefined", () =>
    {
      // @ts-expect-error we simulate that the property does not exist - lint does not like this
      spyOnProperty(window.navigator, "languages", "get").and.returnValue(undefined);

      // @ts-expect-error we simulate that the property does not exist - lint does not like this
      spyOnProperty(window.navigator, "language", "get").and.returnValue(undefined);
      fakeNavigator.browserLanguage = undefined;
      fakeNavigator.userLanguage = undefined;

      expect(translate.getBrowserLang()).toBeUndefined();
    });

    it("should handle language codes with underscores", () =>
    {
      spyOnProperty(window.navigator, "language", "get").and.returnValue("en_US");

      expect(translate.getBrowserLang()).toBe("en");
    });
  });

  describe("getBrowserCultureLang", () =>
  {

    it("should return undefined if window is undefined", () =>
    {
      // @ts-expect-error we simulate that the property does not exist - lint does not like this
      spyOnProperty(window, "navigator", "get").and.returnValue(undefined);

      expect(translate.getBrowserCultureLang()).toBeUndefined();
    });

    it("should return undefined if window.navigator is undefined", () =>
    {
      // @ts-expect-error we simulate that the property does not exist - lint does not like this
      spyOnProperty(window, "navigator", "get").and.returnValue(undefined);

      expect(translate.getBrowserCultureLang()).toBeUndefined();
    });

    it("should return the first language from window.navigator.languages", () =>
    {
      spyOnProperty(window.navigator, "languages", "get").and.returnValue(["fr-FR", "en-US"]);

      expect(translate.getBrowserCultureLang()).toBe("fr-FR");
    });

    it("should return window.navigator.language if window.navigator.languages is not defined", () =>
    {
      // @ts-expect-error we simulate that the property does not exist - lint does not like this
      spyOnProperty(window.navigator, "languages", "get").and.returnValue(undefined);
      spyOnProperty(window.navigator, "language", "get").and.returnValue("es-ES");

      expect(translate.getBrowserCultureLang()).toBe("es-ES");
    });

    it("should return window.navigator.browserLanguage if other properties are not defined", () =>
    {
      // @ts-expect-error we simulate that the property does not exist - lint does not like this
      spyOnProperty(window.navigator, "languages", "get").and.returnValue(undefined);

      // @ts-expect-error we simulate that the property does not exist - lint does not like this
      spyOnProperty(window.navigator, "language", "get").and.returnValue(undefined);
      fakeNavigator.browserLanguage = "de-DE";

      expect(translate.getBrowserCultureLang()).toBe("de-DE");
    });

    it("should return window.navigator.userLanguage if other properties are not defined", () =>
    {
      // @ts-expect-error we simulate that the property does not exist - lint does not like this
      spyOnProperty(window.navigator, "languages", "get").and.returnValue(undefined);

      // @ts-expect-error we simulate that the property does not exist - lint does not like this
      spyOnProperty(window.navigator, "language", "get").and.returnValue(undefined);
      fakeNavigator.browserLanguage = undefined;
      fakeNavigator.userLanguage = "it-IT";

      expect(translate.getBrowserCultureLang()).toBe("it-IT");
    });

    it("should return undefined if all navigator properties are undefined", () =>
    {
      // @ts-expect-error we simulate that the property does not exist - lint does not like this
      spyOnProperty(window.navigator, "languages", "get").and.returnValue(undefined);

      // @ts-expect-error we simulate that the property does not exist - lint does not like this
      spyOnProperty(window.navigator, "language", "get").and.returnValue(undefined);

      fakeNavigator.browserLanguage = undefined;
      fakeNavigator.userLanguage = undefined;

      expect(translate.getBrowserCultureLang()).toBeUndefined();
    });
  });
});



describe("TranslateService (extends, setTranslations)", () =>
{
  let translate: TranslateService;

  beforeEach(() =>
  {
    TestBed.configureTestingModule({
      providers: [
        provideTranslateService({
          loader: {provide: TranslateLoader, useClass: FakeLoader},
          extend: true
        })
      ]
    });
    translate = TestBed.inject(TranslateService);
  });

  afterEach(() =>
  {
    translations = {"TEST": "This is a test"};
  });

  it("extends existing translations using setTranslation", () =>
  {
    translate.use("en");
    translate.setTranslation("en", {a: "A1", b: "B1", c: { a: "CA1", b: "CB1"} });
    translate.setTranslation("en", {a: "A2", c: {b: "CB2"},  d: "D2"});

    expect(translate.instant("a")).toEqual("A2");
    expect(translate.instant("b")).toEqual("B1");
    expect(translate.instant("c.a")).toEqual("CA1");
    expect(translate.instant("c.b")).toEqual("CB2");
    expect(translate.instant("d")).toEqual("D2");
  });
})


describe('TranslateService (extends, lazy loading)', () => {
  const rootTranslations = {
    en: {root: {name: "Root translation"}},
    fr: {root: {name: "Traduction Racine"}}
  }

  const nestedTranslations = {
    en: {nested: {name: "A translated name in english"}},
    fr: {nested: {name: "Un nom traduit en francais"}}
  }

  class StaticTranslateLoader implements TranslateLoader {
    constructor(private translations: Record<string, unknown>) {
    }

    getTranslation(lang: string) {
      const translations = this.translations[lang];
      if (translations) {
        return of(translations)
      } else {
        return EMPTY;
      }
    }
  }

  @Component({
    standalone: true,
    selector: "lib-nested",
    template: `
      <div class="nested">{{ 'nested.name' | translate }}</div>
      <div class="root">{{ 'root.name' | translate }}</div>
    `,
    imports: [
      TranslatePipe
    ],
    providers: [
      TranslateModule.forChild({
        extend: true,
        loader: {
          provide: TranslateLoader,
          useFactory: () => new StaticTranslateLoader(nestedTranslations),
        },
      }).providers!
    ]
  })
  class TranslatedComponent {
  }

  @Component({
    standalone: true,
    imports: [RouterOutlet],
    selector: "lib-test",
    template: `
      <router-outlet/>
    `
  })
  class AppTestComponent {

  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideTranslateService({
          extend: true,
          loader: {
            provide: TranslateLoader,
            useFactory: () => new StaticTranslateLoader(rootTranslations)
          }
        }),
        provideLocationMocks(),
        provideRouter([
          {path: '', component: TranslatedComponent}
        ]),
        {provide: ENVIRONMENT_INITIALIZER, useValue: () => inject(TranslateService).use('fr'), multi: true}
      ]
    }).compileComponents();
  })

  it('should translate both keys', async () => {
    const router = TestBed.inject(Router)
    const fixture = TestBed.createComponent(AppTestComponent);
    router.initialNavigation();
    await router.navigate(['/'])
    fixture.detectChanges();

    const app = fixture.nativeElement

    const rootfr = app.querySelector("div.root");
    const nestedfr = app.querySelector("div.nested");

    expect(rootfr.textContent).toEqual("Traduction Racine");
    expect(nestedfr.textContent).toEqual("Un nom traduit en francais");

    TestBed.inject(TranslateService).currentLang = 'en'
    fixture.detectChanges();

    const root = app.querySelector("div.root");
    const nested = app.querySelector("div.nested");

    expect(root.textContent).toEqual("Root translation");
    expect(nested.textContent).toEqual("A translated name in english");
  })
})


describe('TranslateService (isolate)', () => {
  const translationsRoot = {
    en: {test : "en-root"},
    de: {test : "de-root"}
  }

  const translationsChild = {
    en: {test: "en-child"},
    de: {test : "de-child"}
  }

  class StaticTranslateLoader implements TranslateLoader {
    constructor(private translations: Record<string, unknown>) {
    }

    getTranslation(lang: string) {
      const translations = this.translations[lang];
      if (translations) {
        return of(translations)
      } else {
        return EMPTY;
      }
    }
  }

  @Component({
    standalone: true,
    selector: "lib-isolated-child",
    template: `
      <div class="isolated-child">{{ 'test' | translate }}</div>
    `,
    imports: [
      TranslatePipe
    ],
    providers: [
      TranslateModule.forChild({
        isolate: true,
        loader: {
          provide: TranslateLoader,
          useFactory: () => new StaticTranslateLoader(translationsChild),
        },
      }).providers!
    ]
  })
  class IsolatedChildComponent
  {
    constructor(private translate:TranslateService)
    {
      translate.use("de");
    }
  }

  @Component({
    standalone: true,
    selector: "lib-shared-child",
    template: `
      <div class="shared-child">{{ 'test' | translate }}</div>
    `,
    imports: [
      TranslatePipe
    ],
    providers: [
      TranslateModule.forChild({}).providers!
    ]
  })
  class SharedChildComponent
  {
  }

  @Component({
    standalone: true,
    imports: [RouterOutlet, IsolatedChildComponent, SharedChildComponent, TranslatePipe],
    selector: "lib-test",
    template: `
      <div class="root">{{ 'test' | translate }}</div>
      <lib-isolated-child/>
      <lib-shared-child/>
    `
  })
  class AppTestComponent {
    constructor(private translate:TranslateService)
    {
      translate.use("en");
    }
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideTranslateService({
          extend: true,
          loader: {
            provide: TranslateLoader,
            useFactory: () => new StaticTranslateLoader(translationsRoot)
          }
        }),
      ]
    }).compileComponents();
  })

  it('switches root and child component independently', async () => {
    const fixture = TestBed.createComponent(AppTestComponent);

    const app = fixture.nativeElement

    fixture.detectChanges();

    expect(app.querySelector("div.root").textContent).toEqual("en-root");
    expect(app.querySelector("div.isolated-child").textContent).toEqual("de-child");
    expect(app.querySelector("div.shared-child").textContent).toEqual("en-root");

    // switch root
    TestBed.inject(TranslateService).use("de");
    fixture.detectChanges();

    expect(app.querySelector("div.root").textContent).toEqual("de-root");
    expect(app.querySelector("div.isolated-child").textContent).toEqual("de-child");
    expect(app.querySelector("div.shared-child").textContent).toEqual("de-root");
  })
})
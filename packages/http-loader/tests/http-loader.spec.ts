import {HttpClient} from "@angular/common/http";
import {HttpClientTestingModule, HttpTestingController} from "@angular/common/http/testing";
import {TestBed} from "@angular/core/testing";
import {TranslateLoader, TranslateModule, TranslateService} from "@ngx-translate/core";
import {TranslateHttpLoader} from "../public-api";

describe('TranslateLoader', () => {
  let translate: TranslateService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useFactory: (httpClient: HttpClient) => new TranslateHttpLoader(httpClient),
            deps: [HttpClient]
          }
        })
      ],
      providers: [TranslateService]
    });
    translate = TestBed.inject(TranslateService);
    http = TestBed.inject(HttpTestingController);
  });

  it('should be able to provide TranslateHttpLoader', () => {
    expect(TranslateHttpLoader).toBeDefined();
    expect(translate.currentLoader).toBeDefined();
    expect(translate.currentLoader instanceof TranslateHttpLoader).toBeTruthy();
  });

  it('should be able to get translations', () => {
    translate.use('en');

    // this will request the translation from the backend because we use a static files loader for TranslateService
    translate.get('TEST').subscribe((res: string) => {
      expect(res).toEqual('This is a test');
    });

    // mock response after the xhr request, otherwise it will be undefined
    http.expectOne('/assets/i18n/en.json').flush({
      "TEST": "This is a test",
      "TEST2": "This is another test"
    });

    // this will request the translation from downloaded translations without making a request to the backend
    translate.get('TEST2').subscribe((res: string) => {
      expect(res).toEqual('This is another test');
    });
  });

  it('should be able to reload a lang', () => {
    translate.use('en');

    // this will request the translation from the backend because we use a static files loader for TranslateService
    translate.get('TEST').subscribe((res: string) => {
      expect(res).toEqual('This is a test');

      // reset the lang as if it was never initiated
      translate.reloadLang('en').subscribe((res2: string) => {
        expect(translate.instant('TEST')).toEqual('This is a test 2');
      });

      http.expectOne('/assets/i18n/en.json').flush({"TEST": "This is a test 2"});
    });

    // mock response after the xhr request, otherwise it will be undefined
    http.expectOne('/assets/i18n/en.json').flush({"TEST": "This is a test"});
  });

  it('should be able to reset a lang', (done: Function) => {
    translate.use('en');
    jest.spyOn(http, 'expectOne');

    // this will request the translation from the backend because we use a static files loader for TranslateService
    translate.get('TEST').subscribe((res: string) => {
      expect(res).toEqual('This is a test');
      expect(http.expectOne).toHaveBeenCalledTimes(1);

      // reset the lang as if it was never initiated
      translate.resetLang('en');

      expect(translate.instant('TEST')).toEqual('TEST');

      // use set timeout because no request is really made and we need to trigger zone to resolve the observable
      setTimeout(() => {
        translate.get('TEST').subscribe((res2: string) => {
          expect(res2).toEqual('TEST'); // because the loader is "pristine" as if it was never called
          expect(http.expectOne).toHaveBeenCalledTimes(1);
          done();
        });
      }, 10);
    });

    // mock response after the xhr request, otherwise it will be undefined
    http.expectOne('/assets/i18n/en.json').flush({"TEST": "This is a test"});
  });
});

import {
  Component,
  provide,
  View
} from "angular2/core";
import {HTTP_PROVIDERS, Http} from "angular2/http";
import {
  setBaseTestProviders,
  describe,
  expect,
  ComponentFixture,
  injectAsync,
  it,
  TestComponentBuilder
} from 'angular2/testing';
import {
  TEST_BROWSER_PLATFORM_PROVIDERS,
  TEST_BROWSER_APPLICATION_PROVIDERS
} from 'angular2/platform/testing/browser';

import {TranslateDirective} from '../src/translate.directive';
import {TranslateService} from "../src/translate.service";

function checkTranslation(fixture: ComponentFixture) {
  fixture.detectChanges();
  let domEl = fixture.debugElement.children[0].nativeElement;
  expect(domEl).toHaveText('This is a test');
}

export function main() {
  describe('TranslateDirective', () => {
    setBaseTestProviders(TEST_BROWSER_PLATFORM_PROVIDERS, TEST_BROWSER_APPLICATION_PROVIDERS);

    it('should translate a string with the key in innerHTML',
      injectAsync([TestComponentBuilder], (tcb: TestComponentBuilder) => {
        return tcb
          .overrideTemplate(TestComponent, `<span translate>SIMPLE_STRING</span>`)
          .createAsync(TestComponent)
          .then(checkTranslation);
      })
    );

    it('should translate a string with the key as an attribute',
      injectAsync([TestComponentBuilder], (tcb: TestComponentBuilder) => {
        return tcb
          .overrideTemplate(TestComponent, `<span translate="SIMPLE_STRING"></span>`)
          .createAsync(TestComponent)
          .then(checkTranslation);
      })
    );

    it('should translate a string with the key in innerHTML and interpolation',
      injectAsync([TestComponentBuilder], (tcb: TestComponentBuilder) => {
        return tcb
          .overrideTemplate(TestComponent, `<span translate [translate-values]="{test: 'test'}">WITH_INTERPOLATION</span>`)
          .createAsync(TestComponent)
          .then(checkTranslation);
      })
    );

    it('should translate a string with the key as an attribute and interpolation',
      injectAsync([TestComponentBuilder], (tcb: TestComponentBuilder) => {
        return tcb
          .overrideTemplate(TestComponent, `<span translate="WITH_INTERPOLATION" [translate-values]="{test: 'test'}"></span>`)
          .createAsync(TestComponent)
          .then(checkTranslation);
      })
    );
  });
}

@Component({
  selector: 'test-cmp',
  providers: [provide(TranslateService, {
    useFactory: (http: Http) => {
      var translate = new TranslateService(http);
      translate.setTranslation('en', {
        "SIMPLE_STRING": "This is a test",
        "WITH_INTERPOLATION": "This is a {{test}}"
       });
      translate.use('en');
      return translate;
    }, deps: [Http]
  }), HTTP_PROVIDERS]
})
@View({ directives: [TranslateDirective] })
class TestComponent {}

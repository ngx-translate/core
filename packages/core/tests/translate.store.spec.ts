import {Location} from '@angular/common';
import {Component, ModuleWithProviders, NgModule} from "@angular/core";
import {ComponentFixture, fakeAsync, inject, TestBed, tick} from "@angular/core/testing";
import {Route, Router, RouterModule} from "@angular/router";
import {RouterTestingModule} from "@angular/router/testing";
import {TranslateModule, TranslateService} from "../public-api";

@Component({
  selector: 'root-cmp',
  template: `
      <router-outlet></router-outlet>`
})
class RootComponent {
  constructor(public translate: TranslateService) {
    translate.setTranslation('en', {
      "TEST": "Root",
      'ROOT': 'Root'
    });
    translate.use('en');
  }
}

@Component({
  selector: 'lazy',
  template: 'lazy-loaded-parent [<router-outlet></router-outlet>]'
})
class ParentLazyLoadedComponent {
}

function getLazyLoadedModule(importedModule: ModuleWithProviders<{}>) {
  @Component({selector: 'lazy', template: 'lazy-loaded-child'})
  class ChildLazyLoadedComponent {
    constructor(public translate: TranslateService) {
      translate.setTranslation('en', {
        "TEST": "Lazy",
        'CHILD': 'Child'
      });
      translate.use('en');
      expect(translate.instant('TEST')).toEqual('Lazy');
    }
  }

  @NgModule({
    declarations: [ParentLazyLoadedComponent, ChildLazyLoadedComponent],
    imports: [
      RouterModule.forChild([<Route>{
        path: 'loaded',
        component: ParentLazyLoadedComponent,
        children: [{path: 'child', component: ChildLazyLoadedComponent}]
      }]),
      importedModule
    ]
  })
  class LoadedModule {
  }

  return LoadedModule;
}

function advance(fixture: ComponentFixture<any>): void {
  tick();
  fixture.detectChanges();
}

function createRoot(router: Router, type: any): ComponentFixture<any> {
  const f = TestBed.createComponent(type);
  advance(f);
  router.initialNavigation();
  advance(f);
  return f;
}

describe("module", () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        TranslateModule.forRoot(),
      ],
      declarations: [RootComponent]
    });
  });

  it("should work when lazy loaded using forChild", fakeAsync(inject(
    [Router, Location],
    (router: Router, location: Location) => {
      const LoadedModule = getLazyLoadedModule(TranslateModule.forChild());

      const fixture = createRoot(router, RootComponent),
        translate = TestBed.inject(TranslateService);

      expect(translate.instant('TEST')).toEqual('Root');

      router.resetConfig([{path: 'lazy', loadChildren: () => LoadedModule}]);

      router.navigateByUrl('/lazy/loaded/child');
      advance(fixture);

      expect(location.path()).toEqual('/lazy/loaded/child');

      // since the root module imports the TranslateModule with forRoot and the lazy loaded module with forChild
      // the translate service is shared between both modules
      // the constructor of the ChildLazyLoadedComponent overwrote the "TEST" key of the root TranslateService
      expect(translate.instant('TEST')).toEqual('Lazy');
    }))
  );

  it("should create 2 instances of the service when lazy loaded using forRoot", fakeAsync(inject(
    [Router, Location],
    (router: Router, location: Location) => {
      const LoadedModule = getLazyLoadedModule(TranslateModule.forRoot());

      const fixture = createRoot(router, RootComponent),
        translate = TestBed.inject(TranslateService);

      expect(translate.instant('TEST')).toEqual('Root');

      router.resetConfig([{path: 'lazy', loadChildren: () => LoadedModule}]);

      router.navigateByUrl('/lazy/loaded/child');
      advance(fixture);

      expect(location.path()).toEqual('/lazy/loaded/child');

      // since both the root module and the lazy loaded module use forRoot to define the TranslateModule
      // the translate service is NOT shared, and 2 instances co-exist
      // the constructor of the ChildLazyLoadedComponent didn't overwrote the "TEST" key of the root TranslateService
      expect(translate.instant('TEST')).toEqual('Root');
    }))
  );

  it("should create 2 instances of the service when lazy loaded using forChild and isolate true", fakeAsync(inject(
    [Router, Location],
    (router: Router, location: Location) => {
      const LoadedModule = getLazyLoadedModule(TranslateModule.forChild({isolate: true}));

      const fixture = createRoot(router, RootComponent),
        translate = TestBed.inject(TranslateService);

      expect(translate.instant('TEST')).toEqual('Root');

      router.resetConfig([{path: 'lazy', loadChildren: () => LoadedModule}]);

      router.navigateByUrl('/lazy/loaded/child');
      advance(fixture);

      expect(location.path()).toEqual('/lazy/loaded/child');

      // since both the root module and the lazy loaded module use forRoot to define the TranslateModule
      // the translate service is NOT shared, and 2 instances co-exist
      // the constructor of the ChildLazyLoadedComponent didn't overwrote the "TEST" key of the root TranslateService
      expect(translate.instant('TEST')).toEqual('Root');
    }))
  );

  it("should relay events when lazy loading & using forChild with isolate false", fakeAsync(inject(
    [Router],
    (router: Router) => {
      const LoadedModule = getLazyLoadedModule(TranslateModule.forChild());

      const fixture = createRoot(router, RootComponent),
        translate = TestBed.inject(TranslateService);

      let spy = jest.fn();
      let sub = translate.onTranslationChange.subscribe(spy);

      expect(spy).toHaveBeenCalledTimes(0);

      router.resetConfig([{path: 'lazy', loadChildren: () => LoadedModule}]);

      router.navigateByUrl('/lazy/loaded/child');
      advance(fixture);

      expect(spy).toHaveBeenCalledTimes(1);
      sub.unsubscribe();
    }))
  );

  it("should not relay events when lazy loading & using forChild with isolate true", fakeAsync(inject(
    [Router],
    (router: Router) => {
      const LoadedModule = getLazyLoadedModule(TranslateModule.forChild({isolate: true}));

      const fixture = createRoot(router, RootComponent),
        translate = TestBed.inject(TranslateService);

      let spy = jest.fn();
      let sub = translate.onTranslationChange.subscribe(spy);

      expect(spy).toHaveBeenCalledTimes(0);

      router.resetConfig([{path: 'lazy', loadChildren: () => LoadedModule}]);

      router.navigateByUrl('/lazy/loaded/child');
      advance(fixture);

      expect(spy).toHaveBeenCalledTimes(0);
      sub.unsubscribe();
    }))
  );

  it('should extend translations with extend true', fakeAsync(inject(
    [Router],
    (router: Router) => {
      const LoadedModule = getLazyLoadedModule(TranslateModule.forChild({ extend: true }));

      const fixture = createRoot(router, RootComponent);
      const translate: TranslateService = TestBed.inject(TranslateService);

      router.resetConfig([{path: 'lazy', loadChildren: () => LoadedModule}]);

      router.navigateByUrl('/lazy/loaded/child');
      advance(fixture);

      expect(translate.instant('TEST')).toEqual('Lazy');
      expect(translate.instant('ROOT')).toEqual('Root');
      expect(translate.instant('CHILD')).toEqual('Child');
    }))
  );
});

import {Location} from '@angular/common';
import {Component, ModuleWithProviders, NgModule, Type} from "@angular/core";
import {ComponentFixture, fakeAsync, inject, TestBed, tick} from "@angular/core/testing";
import {provideRouter, Router, RouterModule} from "@angular/router";
import {TranslateModule, TranslateService} from"../public-api";

@Component({
  // eslint-disable-next-line @angular-eslint/prefer-standalone
  standalone: false,
  selector: 'lib-root-cmp',
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
  // eslint-disable-next-line @angular-eslint/prefer-standalone
  standalone: false,
  selector: 'lib-lazy',
  template: 'lazy-loaded-parent [<router-outlet></router-outlet>]'
})
class ParentLazyLoadedComponent {
}

function getLazyLoadedModule<T extends object>(importedModule: ModuleWithProviders<T>) {
  // eslint-disable-next-line @angular-eslint/prefer-standalone
  @Component({selector: 'lib-lazy', template: 'lazy-loaded-child', standalone: false})
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
      RouterModule.forChild([{
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

function advance<T>(fixture: ComponentFixture<T>): void {
  tick();
  fixture.detectChanges();
}

function createRoot<T>(router: Router, type: Type<T>): ComponentFixture<T> {
  const f = TestBed.createComponent(type);
  advance(f);
  router.initialNavigation();
  advance(f);
  return f;
}

describe("TranslateStore", () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterModule,
        TranslateModule.forRoot(),
      ],
      declarations: [RootComponent],
      providers: [
        provideRouter([]),
      ],
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

      const fixture = createRoot(router, RootComponent);
      const translate = TestBed.inject(TranslateService);

      const spy = jasmine.createSpy('translationChangeSpy');
      const sub = translate.onTranslationChange.subscribe(spy);

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

      const fixture = createRoot(router, RootComponent);
      const translate = TestBed.inject(TranslateService);

      const spy = jasmine.createSpy('translationChangeSpy');
      const sub = translate.onTranslationChange.subscribe(spy);

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

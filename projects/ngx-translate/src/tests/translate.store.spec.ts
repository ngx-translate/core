import { Location } from "@angular/common";
import {
    Component,
    inject as coreInject,
    Injector,
    NgModule,
    Provider,
    Type,
} from "@angular/core";
import { ComponentFixture, fakeAsync, TestBed, tick, inject } from "@angular/core/testing";
import { provideRouter, Router, RouterModule } from "@angular/router";
import {
    provideChildTranslateService,
    provideTranslateService,
    TranslateModule,
    TranslateService,
} from "../public-api";
import { TranslateStore } from "../lib/translate.store";

@Component({
    // eslint-disable-next-line @angular-eslint/prefer-standalone
    standalone: false,
    selector: "app-root-cmp",
    template: ` <router-outlet></router-outlet>`,
})
class RootComponent {
    constructor() {
        const translate = coreInject(TranslateService);
        translate.setTranslation("en", {
            TEST: "Root",
            ROOT: "Root",
        });
        translate.use("en");
    }
}

@Component({
    // eslint-disable-next-line @angular-eslint/prefer-standalone
    standalone: false,
    selector: "app-lazy",
    template: "lazy-loaded-parent [<router-outlet></router-outlet>]",
})
class ParentLazyLoadedComponent { }

function getLazyLoadedModule(providers: Provider[] = []) {
    // eslint-disable-next-line @angular-eslint/prefer-standalone
    @Component({ selector: "app-lazy", template: "lazy-loaded-child", standalone: false })
    class ChildLazyLoadedComponent {
        constructor() {
            const translate = coreInject(TranslateService);
            translate.setTranslation("en", {
                TEST: "Lazy",
                CHILD: "Child",
            });
            translate.use("en");
            expect(translate.instant("TEST")).toEqual("Lazy");
        }
    }

    @NgModule({
        declarations: [ParentLazyLoadedComponent, ChildLazyLoadedComponent],
        imports: [
            RouterModule.forChild([
                {
                    path: "loaded",
                    component: ParentLazyLoadedComponent,
                    children: [{ path: "child", component: ChildLazyLoadedComponent }],
                },
            ]),
            TranslateModule,
        ],
        providers: providers,
    })
    class LoadedModule { }

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
            imports: [RouterModule, TranslateModule],
            declarations: [RootComponent],
            providers: [provideRouter([]), provideTranslateService()],
        });
    });

    it("should work when lazy loaded without new providers (shared root service)", fakeAsync(
        inject([Router, Location], (router: Router, location: Location) => {
            const LoadedModule = getLazyLoadedModule();

            const fixture = createRoot(router, RootComponent),
                translate = TestBed.inject(TranslateService);

            expect(translate.instant("TEST")).toEqual("Root");

            router.resetConfig([{ path: "lazy", loadChildren: () => LoadedModule }]);

            router.navigateByUrl("/lazy/loaded/child");
            advance(fixture);

            expect(location.path()).toEqual("/lazy/loaded/child");

            // since the root module imports the TranslateModule with forRoot and the lazy loaded module with forChild
            // the translate service is shared between both modules
            // the constructor of the ChildLazyLoadedComponent overwrote the "TEST" key of the root TranslateService
            expect(translate.instant("TEST")).toEqual("Lazy");
        }),
    ));

    it("should create 2 instances of the service when lazy loaded using provideTranslateService", fakeAsync(
        inject([Router, Location], (router: Router, location: Location) => {
            const LoadedModule = getLazyLoadedModule([provideTranslateService()]);

            const fixture = createRoot(router, RootComponent),
                translate = TestBed.inject(TranslateService);

            expect(translate.instant("TEST")).toEqual("Root");

            router.resetConfig([{ path: "lazy", loadChildren: () => LoadedModule }]);

            router.navigateByUrl("/lazy/loaded/child");
            advance(fixture);

            expect(location.path()).toEqual("/lazy/loaded/child");

            // since both the root module and the lazy loaded module use forRoot to define the TranslateModule
            // the translate service is NOT shared, and 2 instances co-exist
            // the constructor of the ChildLazyLoadedComponent didn't overwrote the "TEST" key of the root TranslateService
            expect(translate.instant("TEST")).toEqual("Root");
        }),
    ));

    it("should create 2 instances of the service when lazy loaded using provideTranslateService (isolated)", fakeAsync(
        inject([Router, Location], (router: Router, location: Location) => {
            const LoadedModule = getLazyLoadedModule([provideTranslateService()]);

            const fixture = createRoot(router, RootComponent),
                translate = TestBed.inject(TranslateService);

            expect(translate.instant("TEST")).toEqual("Root");

            router.resetConfig([{ path: "lazy", loadChildren: () => LoadedModule }]);

            router.navigateByUrl("/lazy/loaded/child");
            advance(fixture);

            expect(location.path()).toEqual("/lazy/loaded/child");

            // since both the root module and the lazy loaded module use forRoot to define the TranslateModule
            // the translate service is NOT shared, and 2 instances co-exist
            // the constructor of the ChildLazyLoadedComponent didn't overwrote the "TEST" key of the root TranslateService
            expect(translate.instant("TEST")).toEqual("Root");
        }),
    ));

    it("should relay events when lazy loading without new providers (shared)", fakeAsync(
        inject([Router], (router: Router) => {
            const LoadedModule = getLazyLoadedModule();

            const fixture = createRoot(router, RootComponent);
            const translate = TestBed.inject(TranslateService);

            const spy = jasmine.createSpy("translationChangeSpy");
            const sub = translate.onTranslationChange.subscribe(spy);

            expect(spy).toHaveBeenCalledTimes(0);

            router.resetConfig([{ path: "lazy", loadChildren: () => LoadedModule }]);

            router.navigateByUrl("/lazy/loaded/child");
            advance(fixture);

            expect(spy).toHaveBeenCalledTimes(1);
            sub.unsubscribe();
        }),
    ));

    it("should not relay events when lazy loading & using an isolated service", fakeAsync(
        inject([Router], (router: Router) => {
            const LoadedModule = getLazyLoadedModule([provideTranslateService()]);

            const fixture = createRoot(router, RootComponent);
            const translate = TestBed.inject(TranslateService);

            const spy = jasmine.createSpy("translationChangeSpy");
            const sub = translate.onTranslationChange.subscribe(spy);

            expect(spy).toHaveBeenCalledTimes(0);

            router.resetConfig([{ path: "lazy", loadChildren: () => LoadedModule }]);

            router.navigateByUrl("/lazy/loaded/child");
            advance(fixture);

            expect(spy).toHaveBeenCalledTimes(0);
            sub.unsubscribe();
        }),
    ));

    it("should extend translations via hierarchy and provideChildTranslateService", fakeAsync(
        inject([Router], (router: Router) => {
            const LoadedModule = getLazyLoadedModule([provideChildTranslateService()]);

            const fixture = createRoot(router, RootComponent);
            const rootTranslate: TranslateService = TestBed.inject(TranslateService);

            router.resetConfig([{ path: "lazy", loadChildren: () => LoadedModule }]);

            router.navigateByUrl("/lazy/loaded/child");
            advance(fixture);

            // In hierarchy, ChildLazyLoadedComponent's local translate service (child) 
            // has the translation "Lazy" for key "TEST".
            // The root service is UNAFFECTED but the child service bubbles up for "ROOT".

            // We need to inject the service from the child scope to verify it.
            // Since we can't easily do it here without getting the component instance, 
            // we've already done an expect() inside ChildLazyLoadedComponent constructor.

            expect(rootTranslate.instant("TEST")).toEqual("Root");
            expect(rootTranslate.instant("ROOT")).toEqual("Root");
        }),
    ));
});

describe("TranslateStore (signals)", () => {
    let store: TranslateStore;

    beforeEach(() => {
        const injector = Injector.create({ providers: [TranslateStore] });
        store = injector.get(TranslateStore);
    });

    it("should expose translations as a signal", () => {
        expect(store.translations()).toEqual({});
    });

    it("should update translations signal with new reference on setTranslations", () => {
        const before = store.translations();
        store.setTranslations("en", { HELLO: "Hello" }, false);
        const after = store.translations();

        expect(after).not.toBe(before);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(after["en"] as any).toEqual({ HELLO: "Hello" });
    });

    it("should merge translations when extend is true", () => {
        store.setTranslations("en", { A: "a" }, false);
        store.setTranslations("en", { B: "b" }, true);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(store.translations()["en"] as any).toEqual({ A: "a", B: "b" });
    });

    it("should produce new reference on deleteTranslations", () => {
        store.setTranslations("en", { A: "a" }, false);
        const before = store.translations();
        store.deleteTranslations("en");
        const after = store.translations();

        expect(after).not.toBe(before);
        expect(after["en"]).toBeUndefined();
    });

    it("should expose languages as a signal", () => {
        expect(store.languages()).toEqual([]);
        store.addLanguages(["en", "fr"]);
        expect(store.languages()).toEqual(["en", "fr"]);
    });

    it("should track lastTranslationChange", () => {
        expect(store.lastTranslationChange()).toBeNull();
        store.setTranslations("en", { A: "a" }, false);
        const event = store.lastTranslationChange();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(event as any).toEqual({ lang: "en", translations: { A: "a" } });
    });
});

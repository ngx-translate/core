import { Injector } from "@angular/core";
import { Observable, of } from "rxjs";
import {
    provideChildTranslateService,
    provideTranslateService,
    TranslateLoader,
    TranslateService,
    TranslationObject,
} from "../public-api";

class FakeLoader implements TranslateLoader {
    getTranslation(): Observable<TranslationObject> {
        return of({});
    }
}

/**
 * `instant()` calls with an unloaded lang should warn the developer that no
 * translations exist. Pre-fix, each service instance had its own
 * `warnedUnloadedInstantLangs` Set, so N services in one chain produced N
 * warns for the same (chain, lang) pair. Post-fix, the warn is delegated
 * through `getRoot()`, scoping it to one warn per (isolated subtree,
 * unloaded lang) pair.
 */
describe("instant() warn scope", () => {
    function setup() {
        const rootInjector = Injector.create({
            providers: [
                provideTranslateService({
                    loader: { provide: TranslateLoader, useValue: new FakeLoader() },
                }),
            ],
        });
        const rootService = rootInjector.get(TranslateService);

        const childAInjector = Injector.create({
            providers: [
                provideChildTranslateService({
                    loader: { provide: TranslateLoader, useValue: new FakeLoader() },
                }),
            ],
            parent: rootInjector,
        });
        const childAService = childAInjector.get(TranslateService);

        const childBInjector = Injector.create({
            providers: [
                provideChildTranslateService({
                    loader: { provide: TranslateLoader, useValue: new FakeLoader() },
                }),
            ],
            parent: rootInjector,
        });
        const childBService = childBInjector.get(TranslateService);

        const isolatedInjector = Injector.create({
            providers: [
                provideTranslateService({
                    loader: { provide: TranslateLoader, useValue: new FakeLoader() },
                }),
            ],
            parent: rootInjector,
        });
        const isolatedService = isolatedInjector.get(TranslateService);

        return { rootService, childAService, childBService, isolatedService };
    }

    it("emits exactly one warn per isolated subtree for an unloaded lang", () => {
        const { rootService, childAService, childBService, isolatedService } = setup();

        const warnSpy = spyOn(console, "warn");

        rootService.instant("KEY", undefined, "de");
        childAService.instant("KEY", undefined, "de");
        childBService.instant("KEY", undefined, "de");
        isolatedService.instant("KEY", undefined, "de");

        // 2 warns: once for the outer chain (root + child A + child B), once for
        // the isolated subtree.
        expect(warnSpy).toHaveBeenCalledTimes(2);

        // A second round of identical calls adds zero new warns.
        rootService.instant("KEY", undefined, "de");
        childAService.instant("KEY", undefined, "de");
        childBService.instant("KEY", undefined, "de");
        isolatedService.instant("KEY", undefined, "de");

        expect(warnSpy).toHaveBeenCalledTimes(2);
    });
});

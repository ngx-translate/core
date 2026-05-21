import { TestBed } from "@angular/core/testing";
import { Injector, computed, effect, runInInjectionContext } from "@angular/core";
import { Observable, Subject } from "rxjs";
import { LoadingTranslationsRegistry } from "../lib/loading-translations-registry";
import type { InterpolatableTranslationObject } from "../public-api";

function obs(): Observable<InterpolatableTranslationObject> {
    return new Subject<InterpolatableTranslationObject>().asObservable();
}

describe("LoadingTranslationsRegistry", () => {
    let injector: Injector;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        injector = TestBed.inject(Injector);
    });

    it("set + get return the same Observable", () => {
        const r = new LoadingTranslationsRegistry();
        const o = obs();
        r.set("de", o);
        expect(r.get("de")).toBe(o);
    });

    it("clear removes the entry", () => {
        const r = new LoadingTranslationsRegistry();
        r.set("de", obs());
        r.clear("de");
        expect(r.get("de")).toBeUndefined();
    });

    it("clearIfOwner removes only when token matches", () => {
        const r = new LoadingTranslationsRegistry();
        const obsA = obs();
        const obsB = obs();
        r.set("de", obsA);
        // Stale-finalize race: a newer load replaced the entry; old token must NOT clobber.
        r.set("de", obsB);
        r.clearIfOwner("de", obsA);
        expect(r.get("de")).toBe(obsB);

        // Matching token clears.
        r.clearIfOwner("de", obsB);
        expect(r.get("de")).toBeUndefined();
    });

    it("hasAny reflects entry count transitions", () => {
        const r = new LoadingTranslationsRegistry();
        expect(r.hasAny()).toBe(false);
        r.set("de", obs());
        expect(r.hasAny()).toBe(true);
        r.set("fr", obs());
        expect(r.hasAny()).toBe(true);
        r.clear("de");
        expect(r.hasAny()).toBe(true);
        r.clear("fr");
        expect(r.hasAny()).toBe(false);
    });

    it("isLoading(lang) is true only for set languages", () => {
        const r = new LoadingTranslationsRegistry();
        r.set("de", obs());
        expect(r.isLoading("de")).toBe(true);
        expect(r.isLoading("fr")).toBe(false);
    });

    it("hasAny is reactive inside computed/effect", () => {
        const r = new LoadingTranslationsRegistry();
        runInInjectionContext(injector, () => {
            const observed: boolean[] = [];
            const c = computed(() => r.hasAny());
            effect(() => observed.push(c()));
            TestBed.flushEffects();
            r.set("de", obs());
            TestBed.flushEffects();
            r.clear("de");
            TestBed.flushEffects();
            expect(observed).toEqual([false, true, false]);
        });
    });
});

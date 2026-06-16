import { effect, Injector, runInInjectionContext, signal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import {
    provideTranslateLoader,
    provideTranslateService,
    TranslateService,
} from "../public-api";
import { TranslateStore } from "../lib/translate.store";
import { FakeLoader } from "./test-helpers";

// Runs `body` inside an effect that has exactly one intended dependency (a
// signal it reads first). The body's mutating call is fired once (guarded by a
// flag) so a leak surfaces as a spurious re-run, not an infinite loop. Returns
// how many times the effect ran after the first flush. A well-behaved command
// yields 1; a command that leaks signal reads into the effect yields 2.
function effectRunsWhenCalling(injector: Injector, body: () => void): number {
    const trigger = signal(0);
    let runCount = 0;
    let didRun = false;

    runInInjectionContext(injector, () => {
        effect(() => {
            trigger();
            runCount++;
            if (!didRun) {
                didRun = true;
                body();
            }
        });
    });

    TestBed.flushEffects();
    return runCount;
}

// Regression tests for https://github.com/ngx-translate/core/issues/1633
//
// The translation mutators are commands, not reactive reads: a caller that
// invokes one from inside an effect should not have that effect re-fire as a
// side effect. Each mutator runs its body in `untracked` to enforce this.
//
// An effect re-fires only if a tracked signal's version differs after the run
// from the version the effect recorded when it READ the signal. That makes the
// mutators split into two groups:
//
//   - use / setFallbackLang / reloadLang DEMONSTRABLY leak: they read a signal
//     (_currentLang, the loading registry) whose LAST touch in the synchronous
//     body is a WRITE, with no read-after — so the recorded version is stale
//     and the effect re-fires. These tests FAIL without the fix (runCount 2).
//
//   - setTranslations / setTranslation / set do NOT self-retrigger today: they
//     happen to read `translations` one last time AFTER their write (building
//     the change event), so the recorded version matches the final one. Their
//     `untracked` wrap is defensive — it keeps the "a command never leaks
//     reads" invariant even if that incidental read ordering changes. These
//     tests PASS with or without the fix; they document the invariant rather
//     than guard a current regression.
describe("issue #1633 — translation mutators must not leak signal reads into the caller", () => {
    beforeEach(() => TestBed.resetTestingModule());

    function configure(withLoader = false): { service: TranslateService; injector: Injector } {
        TestBed.configureTestingModule({
            providers: [
                withLoader
                    ? provideTranslateService({ loader: provideTranslateLoader(FakeLoader) })
                    : provideTranslateService(),
            ],
        });
        return { service: TestBed.inject(TranslateService), injector: TestBed.inject(Injector) };
    }

    // --- Invariant documentation (these pass with OR without the fix) ---

    it("store.setTranslations inside an effect does not re-trigger the effect [invariant]", () => {
        const { injector } = configure();
        const store = TestBed.inject(TranslateStore);
        expect(effectRunsWhenCalling(injector, () => store.setTranslations("en", { A: "a" }, true))).toBe(1);
    });

    it("service.setTranslation inside an effect does not re-trigger the effect [invariant]", () => {
        const { service, injector } = configure();
        expect(effectRunsWhenCalling(injector, () => service.setTranslation("en", { A: "a" }, true))).toBe(1);
    });

    it("service.set inside an effect does not re-trigger the effect [invariant]", () => {
        const { service, injector } = configure(true);
        service.use("en");
        expect(effectRunsWhenCalling(injector, () => service.set("HELLO", "Hello"))).toBe(1);
    });

    // --- Real regressions (these FAIL without the fix: runCount 2) ---

    it("service.use inside an effect does not re-trigger the effect", () => {
        // The idiomatic effect(() => translate.use(lang())): use() reads
        // _currentLang and the loading registry, then writes them with no
        // read-after — a stale recorded version that re-fires the effect.
        const { service, injector } = configure(true);
        expect(effectRunsWhenCalling(injector, () => service.use("en"))).toBe(1);
    });

    it("service.setFallbackLang inside an effect does not re-trigger the effect", () => {
        const { service, injector } = configure(true);
        expect(effectRunsWhenCalling(injector, () => service.setFallbackLang("en"))).toBe(1);
    });

    it("service.reloadLang inside an effect does not re-trigger the effect", () => {
        const { service, injector } = configure(true);
        service.use("en");
        expect(effectRunsWhenCalling(injector, () => service.reloadLang("en"))).toBe(1);
    });
});

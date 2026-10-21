import { Injector } from "@angular/core";
import { EMPTY, Observable, Subject, throwError } from "rxjs";
import {
    provideTranslateService,
    TranslateLoader,
    TranslateService,
    TranslationObject,
} from "../public-api";

/**
 * Loader that rejects "de" but succeeds for everything else with empty
 * translations. Used by the simple first-call / second-call cases.
 */
class RejectingLoader implements TranslateLoader {
    getTranslation(lang: string): Observable<TranslationObject> {
        if (lang === "de") {
            return throwError(() => new Error("Load failed"));
        }
        return new Observable((sub) => {
            sub.next({});
            sub.complete();
        });
    }
}

/**
 * Controllable loader: each call to getTranslation(lang) returns a Subject
 * the test can resolve or reject in any order. Lets us script races
 * deterministically without timer flakiness.
 */
class ControllableLoader implements TranslateLoader {
    private subjects = new Map<string, Subject<TranslationObject>>();

    getTranslation(lang: string): Observable<TranslationObject> {
        const subject = new Subject<TranslationObject>();
        this.subjects.set(lang, subject);
        return subject.asObservable();
    }

    resolve(lang: string, translations: TranslationObject = {}): void {
        const subject = this.subjects.get(lang);
        if (!subject) throw new Error(`No pending load for "${lang}"`);
        subject.next(translations);
        subject.complete();
        this.subjects.delete(lang);
    }

    reject(lang: string, err: Error = new Error(`Load failed for ${lang}`)): void {
        const subject = this.subjects.get(lang);
        if (!subject) throw new Error(`No pending load for "${lang}"`);
        subject.error(err);
        this.subjects.delete(lang);
    }
}

function buildService(loader: TranslateLoader): TranslateService {
    const injector = Injector.create({
        providers: [
            provideTranslateService({
                loader: { provide: TranslateLoader, useValue: loader },
            }),
        ],
    });
    return injector.get(TranslateService);
}

describe("use() rollback + isLoading", () => {
    beforeEach(() => {
        vi.spyOn(console, "warn").mockReturnValue(undefined);
    });

    it("Case 1: first-call failure leaves currentLang null and toggles isLoading", () =>
        new Promise<void>((resolve, reject) => {
            const svc = buildService(new RejectingLoader());

            expect(svc.isLoading()).toBe(false);

            svc.use("de").subscribe({
                next: () => reject("expected error"),
                error: () => {
                    expect(svc.getCurrentLang()).toBeNull();
                    expect(svc.isLoading()).toBe(false);
                    resolve();
                },
            });

            // While the error propagates synchronously through throwError, the
            // counter should have been incremented and then decremented via finalize.
            // (Assertion order intentional: we check post-error in the error handler.)
        }));

    it("Case 2: subsequent-call failure preserves prior currentLang", () =>
        new Promise<void>((resolve, reject) => {
            const svc = buildService(new RejectingLoader());

            svc.use("en").subscribe({
                next: () => {
                    expect(svc.getCurrentLang()).toBe("en");
                    svc.use("de").subscribe({
                        next: () => reject("expected error"),
                        error: () => {
                            expect(svc.getCurrentLang()).toBe("en");
                            // A subsequent successful use("en") must still be able to fire
                            // changeLang — i.e. lastUseLanguage was also rolled back.
                            svc.use("en").subscribe({
                                next: () => {
                                    expect(svc.getCurrentLang()).toBe("en");
                                    resolve();
                                },
                            });
                        },
                    });
                },
                error: () => reject("en load should succeed"),
            });
        }));

    it("Case 3: 2-call race — b fails before a resolves, final currentLang === a", () =>
        new Promise<void>((resolve, reject) => {
            const loader = new ControllableLoader();
            const svc = buildService(loader);

            let aSettled = false;
            let bSettled = false;

            svc.use("a").subscribe({
                next: () => {
                    aSettled = true;
                    checkDone();
                },
                error: () => reject("a should succeed"),
            });

            svc.use("b").subscribe({
                next: () => reject("b should fail"),
                error: () => {
                    bSettled = true;
                    checkDone();
                },
            });

            // b fails first, then a resolves.
            loader.reject("b");
            loader.resolve("a");

            function checkDone() {
                if (aSettled && bSettled) {
                    expect(svc.getCurrentLang()).toBe("a");
                    expect(svc.isLoading()).toBe(false);
                    resolve();
                }
            }
        }));

    it("Case 4: 3-call race — c fails first; ends at b (the latest success), no corruption", () =>
        new Promise<void>((resolve, reject) => {
            const loader = new ControllableLoader();
            const svc = buildService(loader);

            let aSettled = false;
            let bSettled = false;
            let cSettled = false;

            svc.use("a").subscribe({
                next: () => {
                    aSettled = true;
                    checkDone();
                },
                error: () => reject("a should succeed"),
            });

            svc.use("b").subscribe({
                next: () => {
                    bSettled = true;
                    checkDone();
                },
                error: () => reject("b should succeed"),
            });

            svc.use("c").subscribe({
                next: () => reject("c should fail"),
                error: () => {
                    cSettled = true;
                    checkDone();
                },
            });

            // c fails first → rollback restores (prev_at_c_entry, "b") so
            // lastUseLanguage becomes "b". Then a resolves but its changeLang
            // is discarded by the guard (lastUseLanguage !== "a"). Then b resolves
            // and changeLang succeeds.
            loader.reject("c");
            loader.resolve("a");
            loader.resolve("b");

            function checkDone() {
                if (aSettled && bSettled && cSettled) {
                    // Known limitation: this asserts no-corruption, not full
                    // changeLang emission fidelity. State ends at "b" (the most
                    // recent successful changeLang); intermediate "a" success is
                    // intentionally dropped.
                    expect(svc.getCurrentLang()).toBe("b");
                    expect(svc.isLoading()).toBe(false);
                    resolve();
                }
            }
        }));

    it("Case 5: EMPTY-completion loader settles isLoading to false", () =>
        new Promise<void>((resolve) => {
            class EmptyLoader implements TranslateLoader {
                getTranslation(): Observable<TranslationObject> {
                    return EMPTY;
                }
            }
            const svc = buildService(new EmptyLoader());

            expect(svc.isLoading()).toBe(false);
            svc.use("x").subscribe({
                complete: () => {
                    // finalize() must have decremented even though neither next nor
                    // error fired — this is the regression test for the original
                    // next/error-based decrement bug.
                    expect(svc.isLoading()).toBe(false);
                    resolve();
                },
            });
        }));

    it("isLoading is true mid-load and resets after success", () =>
        new Promise<void>((resolve) => {
            const loader = new ControllableLoader();
            const svc = buildService(loader);

            svc.use("en").subscribe({
                next: () => {
                    expect(svc.isLoading()).toBe(false);
                    resolve();
                },
            });

            // After the subscribe call, the load is in flight.
            expect(svc.isLoading()).toBe(true);
            loader.resolve("en");
        }));

    it("setFallbackLang participates in isLoading and settles on success", () =>
        new Promise<void>((resolve) => {
            const loader = new ControllableLoader();
            const svc = buildService(loader);

            svc.setFallbackLang("en").subscribe({
                next: () => {
                    expect(svc.isLoading()).toBe(false);
                    resolve();
                },
            });

            expect(svc.isLoading()).toBe(true);
            loader.resolve("en");
        }));

    it("setFallbackLang participates in isLoading and settles on error", () =>
        new Promise<void>((resolve) => {
            const svc = buildService(new RejectingLoader());

            expect(svc.isLoading()).toBe(false);
            svc.setFallbackLang("de").subscribe({
                error: () => {
                    expect(svc.isLoading()).toBe(false);
                    resolve();
                },
            });
        }));

    it("isLoading composes use() and setFallbackLang() in parallel", () =>
        new Promise<void>((resolve) => {
            const loader = new ControllableLoader();
            const svc = buildService(loader);

            let useDone = false;
            let fallbackDone = false;

            svc.use("en").subscribe({
                next: () => {
                    useDone = true;
                    check();
                },
            });
            svc.setFallbackLang("fr").subscribe({
                next: () => {
                    fallbackDone = true;
                    check();
                },
            });

            // Both in flight: isLoading must be true.
            expect(svc.isLoading()).toBe(true);

            // Resolve fallback first — isLoading must still be true (use() in flight).
            loader.resolve("fr");
            expect(svc.isLoading()).toBe(true);

            loader.resolve("en");

            function check() {
                if (useDone && fallbackDone) {
                    expect(svc.isLoading()).toBe(false);
                    resolve();
                }
            }
        }));
});

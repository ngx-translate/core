import { EnvironmentInjector, Injector } from "@angular/core";
import { fakeAsync, tick } from "@angular/core/testing";
import { catchError, Observable, retry } from "rxjs";
import {
    provideChildTranslateService,
    provideTranslateService,
    RootTranslateServiceConfig,
    TRANSLATE_SERVICE_CONFIG,
    TranslateLoader,
    TranslateRetryConfig,
    TranslateService,
    TranslateServiceConfig,
    TranslationObject,
} from "../public-api";

/** Fails the first `failures` subscriptions per lang, then succeeds. */
class FlakyLoader implements TranslateLoader {
    private calls = new Map<string, number>();
    failures: number;

    constructor(
        failures: number,
        public error: unknown = new Error("Http failure during parsing"),
    ) {
        this.failures = failures;
    }

    getCalls(lang: string): number {
        return this.calls.get(lang) ?? 0;
    }

    getTranslation(lang: string): Observable<TranslationObject> {
        /*
         * Count per subscription, matching real loaders (each resubscription
         * issues a fresh request).
         */
        return new Observable<TranslationObject>((subscriber) => {
            const count = (this.calls.get(lang) ?? 0) + 1;
            this.calls.set(lang, count);
            if (count <= this.failures) {
                subscriber.error(this.error);
                return;
            }
            subscriber.next({ TEST: `translation ${lang}` });
            subscriber.complete();
        });
    }
}

function buildService(
    loader: TranslateLoader,
    config: RootTranslateServiceConfig = {},
): TranslateService {
    const injector = Injector.create({
        providers: [
            provideTranslateService({
                loader: { provide: TranslateLoader, useValue: loader },
                ...config,
            }),
        ],
    });
    return injector.get(TranslateService);
}

describe("retry", () => {
    beforeEach(() => {
        spyOn(console, "warn");
    });

    it("forwards retry to the TRANSLATE_SERVICE_CONFIG provider", () => {
        const providers = provideTranslateService({ retry: 3 });
        const configProvider = providers.find(
            (provider) => (provider as { provide?: unknown }).provide === TRANSLATE_SERVICE_CONFIG,
        ) as { useValue: TranslateServiceConfig };
        expect(configProvider.useValue.retry).toBe(3);
    });

    it("retries a transient load failure and succeeds", fakeAsync(() => {
        const loader = new FlakyLoader(1);
        const svc = buildService(loader, { retry: 2 });

        svc.use("en").subscribe({
            error: () => fail("load should succeed after retry"),
        });

        tick(99);
        expect(loader.getCalls("en")).toBe(1);
        tick(1);
        expect(svc.getCurrentLang()).toBe("en");
        expect(svc.instant("TEST")).toBe("translation en");
        expect(loader.getCalls("en")).toBe(2);
        expect(svc.isLoading()).toBe(false);
    }));

    it("uses the default 100 ms delay for a count-only policy", fakeAsync(() => {
        const loader = new FlakyLoader(1);
        const svc = buildService(loader, { retry: { count: 1 } });
        svc.use("en").subscribe({ error: fail });

        tick(99);
        expect(loader.getCalls("en")).toBe(1);
        expect(svc.isLoading()).toBeTrue();
        tick(1);
        expect(loader.getCalls("en")).toBe(2);
        expect(svc.instant("TEST")).toBe("translation en");
        expect(svc.isLoading()).toBeFalse();
    }));

    [0, 250].forEach((delay) => {
        it(`supports a fixed ${delay} ms retry delay`, fakeAsync(() => {
            const loader = new FlakyLoader(2);
            const svc = buildService(loader, { retry: { count: 2, delay } });
            svc.use("en").subscribe({ error: fail });

            expect(loader.getCalls("en")).toBe(1);
            if (delay > 0) {
                tick(delay - 1);
                expect(loader.getCalls("en")).toBe(1);
                tick(1);
                expect(loader.getCalls("en")).toBe(2);
                expect(svc.isLoading()).toBeTrue();
            }
            tick(delay);
            expect(loader.getCalls("en")).toBe(3);
            expect(svc.instant("TEST")).toBe("translation en");
            expect(svc.isLoading()).toBeFalse();
        }));
    });

    [-1, NaN, Infinity, -Infinity, 2 ** 31].forEach((delayMs) => {
        [false, true].forEach((calculated) => {
            it(`rejects an invalid ${calculated ? "calculated" : "fixed"} delay of ${delayMs}`, fakeAsync(() => {
                const loader = new FlakyLoader(99);
                const svc = buildService(loader, {
                    retry: { count: 2, delay: calculated ? () => delayMs : delayMs },
                });
                const error = jasmine.createSpy("error");
                svc.use("en").subscribe({ error });

                expect(error).toHaveBeenCalledOnceWith(jasmine.any(RangeError));
                expect(error.calls.mostRecent().args[0].message).toContain(
                    "retry delay must be a finite number between 0 and 2147483647 milliseconds",
                );
                expect(loader.getCalls("en")).toBe(1);
                expect(svc.isLoading()).toBeFalse();
                expect(svc.getCurrentLang()).toBeNull();
                tick(1000);
                expect(loader.getCalls("en")).toBe(1);
            }));
        });
    });

    it("accepts the maximum supported retry delay", fakeAsync(() => {
        const loader = new FlakyLoader(1);
        const svc = buildService(loader, { retry: { count: 1, delay: 2 ** 31 - 1 } });
        svc.use("en").subscribe({ error: fail });

        tick(2 ** 31 - 2);
        expect(loader.getCalls("en")).toBe(1);
        expect(svc.isLoading()).toBeTrue();
        tick(1);
        expect(loader.getCalls("en")).toBe(2);
        expect(svc.isLoading()).toBeFalse();
    }));

    (["delay", "shouldRetry"] as const).forEach((callback) => {
        it(`propagates an exception from ${callback} without retrying`, fakeAsync(() => {
            const loader = new FlakyLoader(99);
            const callbackError = new Error("Retry callback failed");
            const policy: TranslateRetryConfig = { count: 2 };
            policy[callback] = () => {
                throw callbackError;
            };
            const svc = buildService(loader, { retry: policy });
            const error = jasmine.createSpy("error");
            const pending = svc.use("en");
            pending.subscribe({ error });

            expect(error).toHaveBeenCalledOnceWith(callbackError);
            expect(loader.getCalls("en")).toBe(1);
            expect(svc.isLoading()).toBeFalse();
            expect(svc.getCurrentLang()).toBeNull();
            pending.subscribe({ error });
            tick(1000);
            expect(error).toHaveBeenCalledTimes(2);
            expect(loader.getCalls("en")).toBe(1);
        }));
    });

    it("snapshots the policy at construction for active and future loads", fakeAsync(() => {
        const loader = new FlakyLoader(2);
        const delay = jasmine.createSpy("delay").and.returnValue(100);
        const shouldRetry = jasmine.createSpy("shouldRetry").and.returnValue(true);
        const policy: TranslateRetryConfig = { count: 2, delay, shouldRetry };
        const svc = buildService(loader, { retry: policy });
        policy.count = 0;
        svc.use("en").subscribe({ error: fail });
        policy.delay = 1;
        policy.shouldRetry = () => false;

        tick(100);
        expect(loader.getCalls("en")).toBe(2);
        expect(svc.isLoading()).toBeTrue();
        tick(99);
        expect(loader.getCalls("en")).toBe(2);
        tick(1);
        expect(loader.getCalls("en")).toBe(3);
        expect(svc.isLoading()).toBeFalse();
        svc.use("fr").subscribe({ error: fail });
        tick(200);
        expect(loader.getCalls("fr")).toBe(3);
        expect(svc.getCurrentLang()).toBe("fr");
        expect(delay).toHaveBeenCalledTimes(4);
        expect(shouldRetry).toHaveBeenCalledTimes(4);
    }));

    it("shares backoff across callers and numbers retries from one for each load", fakeAsync(() => {
        const loader = new FlakyLoader(2, { status: 503 });
        const delay = jasmine
            .createSpy("delay")
            .and.callFake((_error: unknown, retryAttempt: number) => 250 * 2 ** (retryAttempt - 1));
        const svc = buildService(loader, { retry: { count: 2, delay } });
        const next = jasmine.createSpy("next");
        svc.use("en").subscribe({ next, error: fail });
        tick(100);
        svc.use("en").subscribe({ next, error: fail });
        const translation = jasmine.createSpy("translation");
        svc.get("TEST").subscribe({ next: translation, error: fail });

        expect(loader.getCalls("en")).toBe(1);
        expect(delay).toHaveBeenCalledOnceWith(loader.error, 1);
        tick(149);
        expect(loader.getCalls("en")).toBe(1);
        tick(1);
        expect(loader.getCalls("en")).toBe(2);
        expect(delay.calls.allArgs()).toEqual([
            [loader.error, 1],
            [loader.error, 2],
        ]);
        expect(svc.isLoading()).toBeTrue();
        tick(499);
        expect(next).not.toHaveBeenCalled();
        expect(translation).not.toHaveBeenCalled();
        tick(1);
        expect(loader.getCalls("en")).toBe(3);
        expect(next).toHaveBeenCalledTimes(2);
        expect(translation).toHaveBeenCalledOnceWith("translation en");
        expect(svc.isLoading()).toBeFalse();

        svc.setFallbackLang("fr").subscribe({ error: fail });
        expect(delay).toHaveBeenCalledWith(loader.error, 1);
        expect(delay.calls.mostRecent().args).toEqual([loader.error, 1]);
        tick(750);
        expect(loader.getCalls("fr")).toBe(3);
        expect(svc.isLoading()).toBeFalse();
    }));

    it("applies the retry policy to every language in a fallback chain", fakeAsync(() => {
        const loader = new FlakyLoader(1);
        const svc = buildService(loader, { retry: { count: 1, delay: 250 } });
        const next = jasmine.createSpy("next");
        svc.setFallbackLangs(["fr", "en"]).subscribe({ next, error: fail });

        tick(249);
        expect(loader.getCalls("fr")).toBe(1);
        expect(loader.getCalls("en")).toBe(1);
        expect(next).not.toHaveBeenCalled();
        expect(svc.isLoading()).toBeTrue();
        tick(1);

        expect(loader.getCalls("fr")).toBe(2);
        expect(loader.getCalls("en")).toBe(2);
        expect(next).toHaveBeenCalledOnceWith([
            { TEST: "translation fr" },
            { TEST: "translation en" },
        ]);
        expect(svc.getFallbackLangs()).toEqual(["fr", "en"]);
        expect(svc.instant("TEST")).toBe("translation fr");
        expect(svc.isLoading()).toBeFalse();
    }));

    it("propagates a rejected error immediately to all subscribers without retrying", fakeAsync(() => {
        const loader = new FlakyLoader(99, { status: 404 });
        const shouldRetry = jasmine.createSpy("shouldRetry").and.returnValue(false);
        const delay = jasmine.createSpy("delay").and.returnValue(500);
        const svc = buildService(loader, { retry: { count: 2, delay, shouldRetry } });
        const error = jasmine.createSpy("error");
        const pending = svc.use("en");
        pending.subscribe({ error });
        pending.subscribe({ error });

        expect(error.calls.allArgs()).toEqual([[loader.error], [loader.error]]);
        expect(shouldRetry).toHaveBeenCalledOnceWith(loader.error);
        expect(delay).not.toHaveBeenCalled();
        expect(loader.getCalls("en")).toBe(1);
        expect(svc.isLoading()).toBeFalse();
        expect(svc.getCurrentLang()).toBeNull();
        tick(1000);
        pending.subscribe({ error });
        expect(error).toHaveBeenCalledTimes(3);
        expect(loader.getCalls("en")).toBe(1);

        loader.failures = 0;
        svc.use("en").subscribe({ error: fail });
        expect(loader.getCalls("en")).toBe(2);
        expect(svc.instant("TEST")).toBe("translation en");
    }));

    it("checks each failure before calculating its delay", fakeAsync(() => {
        const transientError = { transient: true };
        const loader = new FlakyLoader(99, transientError);
        const shouldRetry = jasmine
            .createSpy("shouldRetry")
            .and.callFake((error: unknown) => error === transientError);
        const delay = jasmine.createSpy("delay").and.returnValue(250);
        const svc = buildService(loader, { retry: { count: 3, delay, shouldRetry } });
        const error = jasmine.createSpy("error");
        svc.reloadLang("en").subscribe({ error });
        expect(svc.isLoading()).toBeTrue();
        loader.error = { transient: false };
        tick(250);

        expect(shouldRetry.calls.allArgs()).toEqual([[transientError], [loader.error]]);
        expect(delay).toHaveBeenCalledOnceWith(transientError, 1);
        expect(error).toHaveBeenCalledOnceWith(loader.error);
        expect(loader.getCalls("en")).toBe(2);
        expect(svc.isLoading()).toBeFalse();
    }));

    [0, -1].forEach((count) => {
        it(`disables policy retries when count is ${count}`, fakeAsync(() => {
            const loader = new FlakyLoader(99);
            const shouldRetry = jasmine.createSpy("shouldRetry");
            const delay = jasmine.createSpy("delay");
            const svc = buildService(loader, { retry: { count, shouldRetry, delay } });
            const error = jasmine.createSpy("error");
            svc.use("en").subscribe({ error });

            expect(error).toHaveBeenCalledOnceWith(loader.error);
            expect(loader.getCalls("en")).toBe(1);
            expect(shouldRetry).not.toHaveBeenCalled();
            expect(delay).not.toHaveBeenCalled();
            expect(svc.isLoading()).toBeFalse();
        }));
    });

    it("shares the final failure when a policy exhausts its retry count", fakeAsync(() => {
        const loader = new FlakyLoader(99);
        const shouldRetry = jasmine.createSpy("shouldRetry").and.returnValue(true);
        const svc = buildService(loader, { retry: { count: 2, delay: 50, shouldRetry } });
        const error = jasmine.createSpy("error");
        const pending = svc.use("en");
        pending.subscribe({ error });
        tick(99);
        expect(error).not.toHaveBeenCalled();
        expect(svc.isLoading()).toBeTrue();
        tick(1);
        expect(error).toHaveBeenCalledOnceWith(loader.error);
        expect(loader.getCalls("en")).toBe(3);
        expect(shouldRetry).toHaveBeenCalledTimes(2);
        expect(svc.isLoading()).toBeFalse();
        pending.subscribe({ error });
        expect(error).toHaveBeenCalledTimes(2);
        expect(loader.getCalls("en")).toBe(3);
    }));

    [undefined, 0, -1].forEach((retryCount) => {
        it(`preserves synchronous failure resubscriptions with retry=${retryCount}`, fakeAsync(() => {
            const loader = new FlakyLoader(99);
            const svc = buildService(loader, { retry: retryCount });
            const error = jasmine.createSpy("error");
            const pending = svc.use("en");
            expect(loader.getCalls("en")).toBe(2);
            pending.subscribe({ error });

            expect(error).toHaveBeenCalledOnceWith(loader.error);
            expect(loader.getCalls("en")).toBe(3);
            expect(svc.getCurrentLang()).toBeNull();
            expect(svc.isLoading()).toBeFalse();
            pending.subscribe({ error });
            expect(loader.getCalls("en")).toBe(4);
        }));
    });

    it("preserves consumer RxJS retry with a numeric retry count", fakeAsync(() => {
        const loader = new FlakyLoader(3);
        const svc = buildService(loader, { retry: 2 });
        const next = jasmine.createSpy("next");
        svc.use("en").pipe(retry(1)).subscribe({ next, error: fail });

        tick(200);
        expect(loader.getCalls("en")).toBe(4);
        expect(next).toHaveBeenCalledOnceWith({ TEST: "translation en" });
        expect(svc.isLoading()).toBeFalse();
    }));

    (["use", "setFallbackLang", "reloadLang"] as const).forEach((method) => {
        it(`starts a fresh policy load from ${method} inside an error handler`, fakeAsync(() => {
            const loader = new FlakyLoader(3);
            const svc = buildService(loader, { retry: { count: 1, delay: 50 } });
            const next = jasmine.createSpy("next");
            const pending = svc[method]("en");
            pending
                .pipe(
                    catchError((error: unknown) => {
                        expect(error).toBe(loader.error);
                        expect(svc.isLoading()).toBeFalse();
                        return svc[method]("en");
                    }),
                )
                .subscribe({ next, error: fail });

            tick(50);
            expect(loader.getCalls("en")).toBe(3);
            expect(svc.isLoading()).toBeTrue();
            tick(49);
            expect(next).not.toHaveBeenCalled();
            tick(1);
            expect(loader.getCalls("en")).toBe(4);
            expect(next).toHaveBeenCalledOnceWith({ TEST: "translation en" });
            expect(svc.isLoading()).toBeFalse();
            if (method === "use") expect(svc.getCurrentLang()).toBe("en");
            if (method === "setFallbackLang") expect(svc.getFallbackLang()).toBe("en");

            const originalError = jasmine.createSpy("originalError");
            pending.subscribe({ error: originalError });
            expect(originalError).toHaveBeenCalledOnceWith(loader.error);
            expect(loader.getCalls("en")).toBe(4);
        }));
    });

    it("does not roll back a successful recovery when other callers share the failed load", fakeAsync(() => {
        const loader = new FlakyLoader(2);
        const svc = buildService(loader, { retry: { count: 1, delay: 50 } });
        svc.setTranslation("fr", { TEST: "before" });
        svc.use("fr");
        const next = jasmine.createSpy("next");
        svc.use("en")
            .pipe(catchError(() => svc.use("en")))
            .subscribe({ next, error: fail });
        const error = jasmine.createSpy("error");
        svc.use("en").subscribe({ error });

        tick(50);
        expect(loader.getCalls("en")).toBe(3);
        expect(next).toHaveBeenCalledOnceWith({ TEST: "translation en" });
        expect(error).toHaveBeenCalledOnceWith(loader.error);
        expect(svc.getCurrentLang()).toBe("en");
        expect(svc.instant("TEST")).toBe("translation en");
        expect(svc.isLoading()).toBeFalse();
    }));

    it("keeps isLoading true while retrying, then settles", fakeAsync(() => {
        const loader = new FlakyLoader(2);
        const svc = buildService(loader, { retry: 3 });

        svc.use("en").subscribe({ error: () => fail("load should succeed") });

        expect(svc.isLoading()).toBe(true);
        tick(100);
        expect(loader.getCalls("en")).toBe(2);
        expect(svc.isLoading()).toBe(true);
        tick(100);
        expect(svc.getCurrentLang()).toBe("en");
        expect(svc.isLoading()).toBe(false);
    }));

    it("surfaces the error once retries are exhausted and allows a fresh load", fakeAsync(() => {
        const loader = new FlakyLoader(99);
        const svc = buildService(loader, { retry: 2 });

        let errored = false;
        svc.use("en").subscribe({
            error: () => (errored = true),
        });

        tick(100);
        tick(100);
        expect(errored).toBe(true);
        expect(loader.getCalls("en")).toBe(3);
        expect(svc.getCurrentLang()).toBeNull();

        loader.failures = 0;
        svc.use("en").subscribe({ error: () => fail("fresh load should succeed") });
        expect(svc.getCurrentLang()).toBe("en");
        expect(loader.getCalls("en")).toBe(4);
    }));

    it("child service retries its own transient load failure", fakeAsync(() => {
        const rootLoader = new FlakyLoader(0);
        const childLoader = new FlakyLoader(1);
        const parent = Injector.create({
            providers: [
                provideTranslateService({
                    loader: { provide: TranslateLoader, useValue: rootLoader },
                    lang: "en",
                }),
            ],
        });
        const child = Injector.create({
            providers: [
                provideChildTranslateService({
                    loader: { provide: TranslateLoader, useValue: childLoader },
                    retry: 2,
                }),
            ],
            parent,
        });
        const childSvc = child.get(TranslateService);

        tick(100);
        expect(childLoader.getCalls("en")).toBe(2);
        expect(childSvc.getTranslations("en")).toBeDefined();
    }));

    it("uses independent policies for root, child, and isolated services", fakeAsync(() => {
        const rootLoader = new FlakyLoader(1);
        const childLoader = new FlakyLoader(1);
        const isolatedLoader = new FlakyLoader(1);
        const parent = Injector.create({
            providers: [
                provideTranslateService({
                    loader: { provide: TranslateLoader, useValue: rootLoader },
                    retry: { count: 1, delay: 100 },
                }),
            ],
        });
        const child = Injector.create({
            providers: [
                provideChildTranslateService({
                    loader: { provide: TranslateLoader, useValue: childLoader },
                    retry: { count: 1, delay: 250 },
                }),
            ],
            parent,
        });
        const isolated = Injector.create({
            providers: [
                provideTranslateService({
                    loader: { provide: TranslateLoader, useValue: isolatedLoader },
                    retry: { count: 1, delay: 50 },
                }),
            ],
            parent: child,
        });
        const rootSvc = parent.get(TranslateService);
        const childSvc = child.get(TranslateService);
        const isolatedSvc = isolated.get(TranslateService);

        childSvc.use("en").subscribe({ error: fail });
        expect(rootSvc.isLoading()).toBeTrue();
        expect(childSvc.isLoading()).toBeTrue();
        expect(isolatedSvc.isLoading()).toBeFalse();
        expect(childLoader.getCalls("en")).toBe(0);
        tick(100);
        expect(rootLoader.getCalls("en")).toBe(2);
        expect(childLoader.getCalls("en")).toBe(1);
        expect(rootSvc.isLoading()).toBeFalse();
        expect(childSvc.isLoading()).toBeTrue();

        isolatedSvc.use("fr").subscribe({ error: fail });
        tick(50);
        expect(isolatedLoader.getCalls("fr")).toBe(2);
        expect(isolatedSvc.isLoading()).toBeFalse();
        expect(childSvc.isLoading()).toBeTrue();
        tick(199);
        expect(childLoader.getCalls("en")).toBe(1);
        tick(1);
        expect(childLoader.getCalls("en")).toBe(2);
        expect(childSvc.isLoading()).toBeFalse();
        expect(childSvc.instant("TEST")).toBe("translation en");
        expect(rootSvc.getCurrentLang()).toBe("en");
        expect(isolatedSvc.getCurrentLang()).toBe("fr");
        // Angular <20 types Injector.create() as Injector, without destroy().
        (isolated as EnvironmentInjector).destroy();
        (child as EnvironmentInjector).destroy();
        (parent as EnvironmentInjector).destroy();
    }));

    it("does not inherit the root's retry policy for child loads", fakeAsync(() => {
        const rootLoader = new FlakyLoader(1);
        const childLoader = new FlakyLoader(99);
        const parent = Injector.create({
            providers: [
                provideTranslateService({
                    loader: { provide: TranslateLoader, useValue: rootLoader },
                    retry: { count: 2, delay: 250 },
                    lang: "en",
                }),
            ],
        });
        const child = Injector.create({
            providers: [
                provideChildTranslateService({
                    loader: { provide: TranslateLoader, useValue: childLoader },
                }),
            ],
            parent,
        });
        const rootSvc = parent.get(TranslateService);
        tick(250);
        const childSvc = child.get(TranslateService);
        tick(1000);
        expect(rootLoader.getCalls("en")).toBe(2);
        // Legacy sharing subscribes once for loading and again for the child constructor.
        expect(childLoader.getCalls("en")).toBe(2);
        expect(rootSvc.isLoading()).toBeFalse();
        expect(childSvc.isLoading()).toBeFalse();
        (child as EnvironmentInjector).destroy();
        (parent as EnvironmentInjector).destroy();
    }));

    [2, { count: 2, delay: 100 }].forEach((retry) => {
        describe(`cancellation with a ${typeof retry === "number" ? "numeric retry count" : "retry policy"}`, () => {
            it("cancels a scheduled retry and completes subscribers without an error", fakeAsync(() => {
                const loader = new FlakyLoader(99);
                const svc = buildService(loader, { retry });
                const next = jasmine.createSpy("next");
                const error = jasmine.createSpy("error");
                const complete = jasmine.createSpy("complete");
                const load = svc.use("fr");
                load.subscribe({ next, error, complete });
                tick(50);

                svc.deleteLanguage("fr");
                expect(svc.isLoading()).toBeFalse();
                expect(complete).toHaveBeenCalledTimes(1);
                load.subscribe({ next, error, complete });
                tick(1000);

                expect(loader.getCalls("fr")).toBe(1);
                expect(complete).toHaveBeenCalledTimes(2);
                expect(next).not.toHaveBeenCalled();
                expect(error).not.toHaveBeenCalled();
                expect(svc.getTranslations("fr")).toBeUndefined();
                expect(svc.getLangs()).not.toContain("fr");
                expect(console.warn).not.toHaveBeenCalled();
            }));

            it("allows a fresh load with its own retries after cancellation", fakeAsync(() => {
                const loader = new FlakyLoader(2);
                const svc = buildService(loader, { retry });
                svc.use("fr");
                tick(50);
                svc.deleteLanguage("fr");

                svc.use("fr");
                tick(50);
                expect(loader.getCalls("fr")).toBe(2);
                expect(svc.isLoading()).toBeTrue();
                tick(50);

                expect(loader.getCalls("fr")).toBe(3);
                expect(svc.instant("TEST")).toBe("translation fr");
                expect(svc.isLoading()).toBeFalse();
            }));

            it("cancels a retry that would otherwise restore the deleted language", fakeAsync(() => {
                const loader = new FlakyLoader(1);
                const svc = buildService(loader, { retry });
                svc.use("fr");

                svc.deleteLanguage("fr");
                tick(100);

                expect(loader.getCalls("fr")).toBe(1);
                expect(svc.getLangs()).not.toContain("fr");
                expect(svc.instant("TEST")).toBe("TEST");
            }));

            it("keeps another language's retries running", fakeAsync(() => {
                const loader = new FlakyLoader(1);
                const svc = buildService(loader, { retry });
                svc.reloadLang("en");
                svc.reloadLang("fr");

                svc.deleteLanguage("fr");
                expect(svc.isLoading()).toBeTrue();
                tick(100);

                expect(loader.getCalls("fr")).toBe(1);
                expect(loader.getCalls("en")).toBe(2);
                expect(svc.instant("TEST", undefined, "en")).toBe("translation en");
                expect(svc.isLoading()).toBeFalse();
            }));
        });
    });
});

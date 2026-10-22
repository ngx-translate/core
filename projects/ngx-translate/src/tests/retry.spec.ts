import { Injector } from "@angular/core";
import { fakeAsync, tick } from "@angular/core/testing";
import { Observable } from "rxjs";
import {
    provideChildTranslateService,
    provideTranslateService,
    TRANSLATE_SERVICE_CONFIG,
    TranslateLoader,
    TranslateService,
    TranslateServiceConfig,
    TranslationObject,
} from "../public-api";

/** Fails the first `failures` subscriptions per lang, then succeeds. */
class FlakyLoader implements TranslateLoader {
    private calls = new Map<string, number>();
    failures: number;

    constructor(failures: number) {
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
                subscriber.error(new Error("Http failure during parsing"));
                return;
            }
            subscriber.next({ TEST: `translation ${lang}` });
            subscriber.complete();
        });
    }
}

function buildService(loader: FlakyLoader, config: { retry?: number } = {}): TranslateService {
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

        tick(100);
        expect(svc.getCurrentLang()).toBe("en");
        expect(svc.instant("TEST")).toBe("translation en");
        expect(loader.getCalls("en")).toBe(2);
        expect(svc.isLoading()).toBe(false);
    }));

    it("does not retry by default — a failure surfaces without delay", fakeAsync(() => {
        const loader = new FlakyLoader(99);
        const svc = buildService(loader);

        let errored = false;
        svc.use("en").subscribe({
            error: () => (errored = true),
        });

        expect(errored).toBe(true);
        expect(svc.getCurrentLang()).toBeNull();
        expect(svc.isLoading()).toBe(false);
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

    it("cancels a scheduled retry and completes subscribers without an error", fakeAsync(() => {
        const loader = new FlakyLoader(99);
        const svc = buildService(loader, { retry: 2 });
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
        const svc = buildService(loader, { retry: 2 });
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
        const svc = buildService(loader, { retry: 2 });
        svc.use("fr");

        svc.deleteLanguage("fr");
        tick(100);

        expect(loader.getCalls("fr")).toBe(1);
        expect(svc.getLangs()).not.toContain("fr");
        expect(svc.instant("TEST")).toBe("TEST");
    }));

    it("keeps another language's retries running", fakeAsync(() => {
        const loader = new FlakyLoader(1);
        const svc = buildService(loader, { retry: 2 });
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

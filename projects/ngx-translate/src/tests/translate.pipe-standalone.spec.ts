import { AsyncPipe } from "@angular/common";
import { ChangeDetectionStrategy, Component, Injectable, Provider, signal } from "@angular/core";
import { ComponentFixture, fakeAsync, TestBed, tick } from "@angular/core/testing";
import { Observable, of, Subject } from "rxjs";
import {
    provideTranslateService,
    TranslateLoader,
    TranslatePipe,
    TranslateService,
    TranslationObject,
} from "../public-api";
import { DelayedFakeLoader } from "./test-helpers";

@Injectable()
@Component({
    standalone: true,
    selector: "app-hmx-app",
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [TranslatePipe],
    template: `{{ "TEST" | translate }}`,
})
class AppComponent {}

@Component({
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [TranslatePipe],
    template: `
        <span id="current">{{ "TEST" | translate: { name: "Ada" } }}</span>
        <span id="selected">{{ "TEST" | translate: { name: "Ada" } : language() }}</span>
        <span id="french">{{ "LABEL" | translate: undefined : "fr" }}</span>
    `,
})
class MultilingualComponent {
    language = signal<string | undefined>("fr");
}

@Component({
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [AsyncPipe, TranslatePipe],
    template: `{{ "TEST" | translate: withParams() && params : (language$ | async) }}`,
})
class NullableLanguageComponent {
    language$ = new Subject<string | null>();
    withParams = signal(false);
    params = { name: "Ada" };
}

@Injectable()
class FakeLoader implements TranslateLoader {
    getTranslation(lang: string): Observable<TranslationObject> {
        void lang;
        return of({ TEST: "This is a test" });
    }
}

describe("TranslatePipe (standalone)", () => {
    let translate: TranslateService;
    let fixture: ComponentFixture<AppComponent>;

    const prepare = (loader?: Provider) => {
        const providers = loader ? [loader] : [{ provide: TranslateLoader, useClass: FakeLoader }];

        TestBed.configureTestingModule({
            providers: [provideTranslateService({}), ...providers],
            imports: [AppComponent],
        });
        translate = TestBed.inject(TranslateService);
        fixture = TestBed.createComponent(AppComponent);
    };

    it("should render multiple languages and update a bound language with OnPush", () => {
        TestBed.configureTestingModule({ providers: [provideTranslateService()] });
        const service = TestBed.inject(TranslateService);
        service.setTranslation("en", { TEST: "Hello {{name}}" });
        service.setTranslation("fr", { TEST: "Bonjour {{name}}", LABEL: "Français" });
        service.setTranslation("de", { TEST: "Hallo {{name}}" });
        service.use("en");
        const multilingual = TestBed.createComponent(MultilingualComponent);
        const element: HTMLElement = multilingual.nativeElement;

        multilingual.detectChanges();
        expect(element.querySelector("#current")?.textContent).toBe("Hello Ada");
        expect(element.querySelector("#selected")?.textContent).toBe("Bonjour Ada");
        expect(element.querySelector("#french")?.textContent).toBe("Français");

        multilingual.componentInstance.language.set("de");
        multilingual.detectChanges();
        expect(element.querySelector("#selected")?.textContent).toBe("Hallo Ada");
        expect(element.querySelector("#current")?.textContent).toBe("Hello Ada");

        service.setTranslation("de", { TEST: "Guten Tag {{name}}" });
        multilingual.detectChanges();
        expect(element.querySelector("#selected")?.textContent).toBe("Guten Tag Ada");

        multilingual.componentInstance.language.set(undefined);
        multilingual.detectChanges();
        expect(element.querySelector("#selected")?.textContent).toBe("Hello Ada");
    });

    it("should accept nullable async languages and conditional interpolation parameters", () => {
        TestBed.configureTestingModule({ providers: [provideTranslateService()] });
        const service = TestBed.inject(TranslateService);
        service.setTranslation("en", { TEST: "Hello {{name}}" });
        service.setTranslation("fr", { TEST: "Bonjour {{name}}" });
        service.use("en");
        const nullable = TestBed.createComponent(NullableLanguageComponent);
        const element: HTMLElement = nullable.nativeElement;

        nullable.detectChanges();
        expect(element.textContent).toBe("Hello {{name}}");

        nullable.componentInstance.language$.next("fr");
        nullable.detectChanges();
        expect(element.textContent).toBe("Bonjour {{name}}");

        nullable.componentInstance.withParams.set(true);
        nullable.detectChanges();
        expect(element.textContent).toBe("Bonjour Ada");

        nullable.componentInstance.language$.next(null);
        nullable.detectChanges();
        expect(element.textContent).toBe("Hello Ada");

        service.use("fr");
        nullable.detectChanges();
        expect(element.textContent).toBe("Bonjour Ada");
    });

    describe("should update translations on lang change - sync", () => {
        it("should detect changes with OnPush", () => {
            prepare();
            fixture.detectChanges();
            expect(fixture.debugElement.nativeElement.innerHTML).toEqual("TEST");
            translate.use("en");
            fixture.detectChanges();
            expect(fixture.debugElement.nativeElement.innerHTML).toEqual("This is a test");
        });
    });

    describe("should update translations on lang change - async", () => {
        it("should detect changes with OnPush", fakeAsync(() => {
            prepare({ provide: TranslateLoader, useClass: DelayedFakeLoader });

            fixture.detectChanges();
            expect(fixture.debugElement.nativeElement.innerHTML).toEqual("TEST");

            translate.use("en");
            fixture.detectChanges();
            expect(fixture.debugElement.nativeElement.innerHTML).toEqual("TEST");

            tick(10);
            fixture.detectChanges();
            expect(fixture.debugElement.nativeElement.innerHTML).toEqual("This is a test");
        }));
    });
});

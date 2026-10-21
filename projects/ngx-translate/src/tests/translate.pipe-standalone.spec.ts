import { ChangeDetectionStrategy, Component, Injectable, Provider } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Observable, of } from "rxjs";
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
        it("should detect changes with OnPush", () => {
            vi.useFakeTimers();
            prepare({ provide: TranslateLoader, useClass: DelayedFakeLoader });

            fixture.detectChanges();
            expect(fixture.debugElement.nativeElement.innerHTML).toEqual("TEST");

            translate.use("en");
            fixture.detectChanges();
            expect(fixture.debugElement.nativeElement.innerHTML).toEqual("TEST");

            vi.advanceTimersByTime(10);
            fixture.detectChanges();
            expect(fixture.debugElement.nativeElement.innerHTML).toEqual("This is a test");
        });
    });
});

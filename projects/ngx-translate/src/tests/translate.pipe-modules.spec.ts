import { ChangeDetectionStrategy, Component, Injectable, Provider } from "@angular/core";
import { ComponentFixture, fakeAsync, TestBed, tick } from "@angular/core/testing";
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
    imports: [TranslatePipe],
    selector: "app-hmx-app",
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `{{ "TEST" | translate }}`,
})
class AppComponent { }

@Injectable()
class FakeLoader implements TranslateLoader {
    getTranslation(lang: string): Observable<TranslationObject> {
        void lang;
        return of({ TEST: "This is a test" });
    }
}

describe("TranslatePipe (module)", () => {
    let translate: TranslateService;
    let fixture: ComponentFixture<AppComponent>;

    const prepare = (loader?: Provider) => {
        TestBed.configureTestingModule({
            imports: [AppComponent],
            providers: [
                provideTranslateService({
                    loader: loader ?? { provide: TranslateLoader, useClass: FakeLoader },
                }),
            ],
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

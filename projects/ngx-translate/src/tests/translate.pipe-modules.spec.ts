import { ChangeDetectionStrategy, Component, Injectable } from "@angular/core";
import { ComponentFixture, fakeAsync, TestBed, tick } from "@angular/core/testing";
import { Observable, of } from "rxjs";
import {
    provideTranslateService,
    TranslateLoader,
    TranslatePipe,
    TranslateProvider,
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

// File-name is historical: these tests covered the `TranslateModule.forRoot`
// path in v17 and were retained against `provideTranslateService` in v18.
describe("TranslatePipe (provider config)", () => {
    let translate: TranslateService;
    let fixture: ComponentFixture<AppComponent>;

    const prepare = (loader?: TranslateProvider) => {
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

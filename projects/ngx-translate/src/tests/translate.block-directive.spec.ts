import { Component } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { TranslateService } from "../lib/translate.service";
import { provideTranslateService } from "../lib/translate.providers";
import { TranslateBlockDirective } from "../lib/translate-block.directive";

@Component({
    standalone: true,
    imports: [TranslateBlockDirective],
    template: `
        <ng-container *translateBlock="let t">
            <span class="title">{{ t("TEST") }}</span>
            <span class="greeting">{{ t("GREETING", { name: userName }) }}</span>
        </ng-container>
    `,
})
class TestComponent {
    userName = "World";
}

@Component({
    standalone: true,
    imports: [TranslateBlockDirective],
    template: `
        <div *translateBlock="let t">
            <span class="nested">{{ t("TEST") }}</span>
        </div>
    `,
})
class NestedComponent {}

describe("TranslateBlockDirective", () => {
    let translate: TranslateService;

    const EN = { TEST: "This is a test", GREETING: "Hello, {{name}}!" };
    const FR = { TEST: "Ceci est un test", GREETING: "Bonjour, {{name}} !" };

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [TestComponent, NestedComponent],
            providers: [provideTranslateService()],
        });
        translate = TestBed.inject(TranslateService);
        translate.setTranslation("en", EN);
        translate.setTranslation("fr", FR);
        translate.use("en");
    });

    it("should translate using the t() function", () => {
        const fixture = TestBed.createComponent(TestComponent);
        fixture.detectChanges();

        const el = fixture.nativeElement.querySelector(".title");
        expect(el.textContent).toBe("This is a test");
    });

    it("should interpolate parameters", () => {
        const fixture = TestBed.createComponent(TestComponent);
        fixture.detectChanges();

        const el = fixture.nativeElement.querySelector(".greeting");
        expect(el.textContent).toBe("Hello, World!");
    });

    it("should update when language changes", () => {
        const fixture = TestBed.createComponent(TestComponent);
        fixture.detectChanges();

        const el = fixture.nativeElement.querySelector(".title");
        expect(el.textContent).toBe("This is a test");

        translate.use("fr");
        fixture.detectChanges();

        expect(el.textContent).toBe("Ceci est un test");
    });

    it("should update when translations are modified", () => {
        const fixture = TestBed.createComponent(TestComponent);
        fixture.detectChanges();

        const el = fixture.nativeElement.querySelector(".title");
        expect(el.textContent).toBe("This is a test");

        translate.setTranslation("en", { TEST: "Updated test", GREETING: EN.GREETING });
        fixture.detectChanges();

        expect(el.textContent).toBe("Updated test");
    });

    it("should update when component property changes", () => {
        const fixture = TestBed.createComponent(TestComponent);
        fixture.detectChanges();

        const el = fixture.nativeElement.querySelector(".greeting");
        expect(el.textContent).toBe("Hello, World!");

        fixture.componentInstance.userName = "Andreas";
        fixture.detectChanges();

        expect(el.textContent).toBe("Hello, Andreas!");
    });

    it("should work on non-ng-container elements", () => {
        const fixture = TestBed.createComponent(NestedComponent);
        fixture.detectChanges();

        const el = fixture.nativeElement.querySelector(".nested");
        expect(el.textContent).toBe("This is a test");
    });

    it("should return key when translation is missing", () => {
        translate.setTranslation("en", {});
        const fixture = TestBed.createComponent(TestComponent);
        fixture.detectChanges();

        const el = fixture.nativeElement.querySelector(".title");
        expect(el.textContent).toBe("TEST");
    });
});

import {
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    inject,
    signal,
    Type,
} from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import {
    InterpolateFunction,
    InterpolationParameters,
    provideTranslateParser,
    provideTranslateService,
    TranslateDefaultParser,
    TranslateParser,
    TranslatePipe,
    TranslateService,
    TranslateSlotDirective,
    TranslateSlotsComponent,
} from "../public-api";

@Component({
    selector: "app-slot-counter",
    standalone: true,
    template: `<button type="button" (click)="count.set(count() + 1)">{{ count() }}</button>`,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
class SlotCounter {
    static created = 0;
    static destroyed = 0;
    readonly count = signal(0);

    constructor() {
        SlotCounter.created++;
        inject(DestroyRef).onDestroy(() => SlotCounter.destroyed++);
    }
}

@Component({
    selector: "app-slots-host",
    standalone: true,
    imports: [TranslateSlotsComponent, TranslateSlotDirective, TranslatePipe, SlotCounter],
    template: `
        <span [translateSlots]="key()" [translateParams]="params()" aria-label="Upload files">
            <ng-template [translateSlot]="slotName()">
                <a href="/files">{{ "FILE_SELECT" | translate }}</a>
            </ng-template>
            <ng-template translateSlot="counter"><app-slot-counter /></ng-template>
            @if (conditional()) {
                <ng-template translateSlot="conditional"><strong>Conditional</strong></ng-template>
            }
        </span>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
class SlotsHost {
    readonly key = signal("TEXT_WITH_LINK");
    readonly params = signal<InterpolationParameters | undefined>(undefined);
    readonly slotName = signal("uploadTextFileSelect");
    readonly conditional = signal(false);
}

@Component({
    selector: "app-nested-slots-host",
    standalone: true,
    imports: [TranslateSlotsComponent, TranslateSlotDirective],
    template: `<span translateSlots="OUTER"
        ><ng-template translateSlot="link"
            ><span translateSlots="INNER"
                ><ng-template translateSlot="link"><em>nested</em></ng-template></span
            ></ng-template
        ></span
    >`,
})
class NestedSlotsHost {}

@Component({
    selector: "app-duplicate-slots-host",
    standalone: true,
    imports: [TranslateSlotsComponent, TranslateSlotDirective],
    template: `<span translateSlots="TEXT_WITH_LINK"
        ><ng-template translateSlot="link">one</ng-template
        ><ng-template translateSlot="link">two</ng-template></span
    >`,
})
class DuplicateSlotsHost {}

class UpperCaseParser extends TranslateDefaultParser {
    override interpolate(expr: InterpolateFunction | string, params?: InterpolationParameters) {
        return super.interpolate(expr, params)?.toUpperCase();
    }
}

describe("TranslateSlotsComponent", () => {
    let translate: TranslateService;

    const configure = (parser: Type<TranslateParser> = TranslateDefaultParser) => {
        TestBed.configureTestingModule({
            providers: [provideTranslateService({ parser: provideTranslateParser(parser) })],
        });
        translate = TestBed.inject(TranslateService);
        translate.setTranslation("en", {
            TEXT_WITH_LINK: "Drop files here or {{uploadTextFileSelect}}",
            FILE_SELECT: "click",
        });
        translate.setTranslation("fr", {
            TEXT_WITH_LINK: "{{uploadTextFileSelect}} pour déposer vos fichiers",
            FILE_SELECT: "choisir",
        });
        translate.use("en");
    };
    const createFixture = <T>(component: Type<T>): ComponentFixture<T> => {
        const fixture = TestBed.createComponent(component);
        fixture.autoDetectChanges();
        return fixture;
    };
    const host = (fixture: ComponentFixture<unknown>): HTMLSpanElement =>
        (fixture.nativeElement as HTMLElement).querySelector("span")!;

    beforeEach(() => {
        SlotCounter.created = 0;
        SlotCounter.destroyed = 0;
        spyOn(console, "warn");
        configure();
    });

    it("renders text and slots without a wrapper element", async () => {
        const fixture = createFixture(SlotsHost);
        await fixture.whenStable();
        expect(host(fixture).textContent).toBe("Drop files here or click");
        expect(host(fixture).children.length).toBe(1);
        expect(host(fixture).firstElementChild?.tagName).toBe("A");
        expect(host(fixture).getAttribute("aria-label")).toBe("Upload files");
        expect(SlotCounter.created).toBe(0);
    });

    it("updates text and nested pipes on language change and keeps slot nodes", async () => {
        const fixture = createFixture(SlotsHost);
        await fixture.whenStable();
        const link = host(fixture).querySelector("a");
        translate.use("fr");
        await fixture.whenStable();
        expect(host(fixture).textContent).toBe("choisir pour déposer vos fichiers");
        expect(host(fixture).querySelector("a")).toBe(link);
    });

    it("updates on key and param changes and keeps slot nodes", async () => {
        translate.set("GREETING", "Hello {{name}}, {{uploadTextFileSelect}}", "en");
        const fixture = createFixture(SlotsHost);
        await fixture.whenStable();
        const link = host(fixture).querySelector("a");
        fixture.componentInstance.key.set("GREETING");
        fixture.componentInstance.params.set({ name: "Ada" });
        await fixture.whenStable();
        expect(host(fixture).textContent).toBe("Hello Ada, click");
        fixture.componentInstance.params.set({ name: "Grace" });
        await fixture.whenStable();
        expect(host(fixture).textContent).toBe("Hello Grace, click");
        expect(host(fixture).querySelector("a")).toBe(link);
    });

    it("keeps component state when slots are reordered", async () => {
        translate.set("TEXT_WITH_LINK", "{{counter}} {{uploadTextFileSelect}}", "en");
        translate.set("TEXT_WITH_LINK", "{{uploadTextFileSelect}} {{counter}}", "fr");
        const fixture = createFixture(SlotsHost);
        await fixture.whenStable();
        const button = host(fixture).querySelector("button")!;
        button.click();
        await fixture.whenStable();
        translate.use("fr");
        await fixture.whenStable();
        expect(host(fixture).querySelector("button")).toBe(button);
        expect(host(fixture).textContent).toBe("choisir 1");
        expect(SlotCounter.created).toBe(1);
        expect(SlotCounter.destroyed).toBe(0);
    });

    it("creates independent views for repeated slots and destroys removed ones", async () => {
        translate.set("TEXT_WITH_LINK", "{{counter}}{{counter}}", "en");
        const fixture = createFixture(SlotsHost);
        await fixture.whenStable();
        const buttons = host(fixture).querySelectorAll("button");
        buttons[0].click();
        await fixture.whenStable();
        expect(buttons[0].textContent).toBe("1");
        expect(buttons[1].textContent).toBe("0");
        translate.set("TEXT_WITH_LINK", "No controls", "en");
        await fixture.whenStable();
        expect(host(fixture).textContent).toBe("No controls");
        expect(SlotCounter.destroyed).toBe(2);
    });

    it("reacts to conditional slots and slot name changes", async () => {
        translate.set("TEXT_WITH_LINK", "{{conditional}} {{renamed}}", "en");
        const fixture = createFixture(SlotsHost);
        await fixture.whenStable();
        expect(host(fixture).textContent).toBe("{{conditional}} {{renamed}}");
        fixture.componentInstance.conditional.set(true);
        fixture.componentInstance.slotName.set("renamed");
        await fixture.whenStable();
        expect(host(fixture).textContent).toBe("Conditional click");
        fixture.componentInstance.conditional.set(false);
        await fixture.whenStable();
        expect(host(fixture).querySelector("strong")).toBeNull();
        expect(host(fixture).textContent).toBe("{{conditional}} click");
    });

    it("renders translations and params as text only", async () => {
        const html = '<img src="x" onerror="alert(1)"><script>alert(1)</script>';
        translate.set("TEXT_WITH_LINK", `${html} {{name}} {{uploadTextFileSelect}}`, "en");
        const fixture = TestBed.createComponent(SlotsHost);
        fixture.componentInstance.params.set({ name: "{{counter}}" });
        fixture.autoDetectChanges();
        await fixture.whenStable();
        expect(host(fixture).textContent).toBe(`${html} {{counter}} click`);
        expect(host(fixture).querySelector("img, script, button")).toBeNull();
    });

    it("renders the key for a missing translation and updates once it is added", async () => {
        translate.setTranslation("en", { FILE_SELECT: "click" });
        const fixture = createFixture(SlotsHost);
        await fixture.whenStable();
        expect(host(fixture).textContent).toBe("TEXT_WITH_LINK");
        translate.set("TEXT_WITH_LINK", "Loaded {{uploadTextFileSelect}}", "en");
        await fixture.whenStable();
        expect(host(fixture).textContent).toBe("Loaded click");
    });

    it("produces the same text as instant() and logs no warnings", async () => {
        translate.set("TEXT_WITH_LINK", "{{{name}}} {{unknown}} {{uploadTextFileSelect}}", "en");
        const fixture = TestBed.createComponent(SlotsHost);
        fixture.componentInstance.params.set({ name: "Ada" });
        fixture.autoDetectChanges();
        await fixture.whenStable();
        expect(host(fixture).textContent).toBe(
            translate.instant("TEXT_WITH_LINK", { name: "Ada", uploadTextFileSelect: "click" }),
        );
        expect(console.warn).not.toHaveBeenCalled();
    });

    it("supports compiled translations", async () => {
        translate.setCompiledTranslation("en", {
            TEXT_WITH_LINK: (params?: InterpolationParameters) =>
                `${params?.["count"]} files, ${params?.["uploadTextFileSelect"]}`,
            FILE_SELECT: "click",
        });
        const fixture = TestBed.createComponent(SlotsHost);
        fixture.componentInstance.params.set({ count: 2 });
        fixture.autoDetectChanges();
        await fixture.whenStable();
        expect(host(fixture).textContent).toBe("2 files, click");
        expect(host(fixture).querySelector("a")).not.toBeNull();
    });

    it("uses the configured parser, including subclasses that override interpolate()", async () => {
        TestBed.resetTestingModule();
        configure(UpperCaseParser);
        const fixture = createFixture(SlotsHost);
        await fixture.whenStable();
        expect(host(fixture).textContent).toBe("DROP FILES HERE OR CLICK");
        expect(host(fixture).querySelector("a")).not.toBeNull();
    });

    it("keeps slots intact when Math.random() uses scientific notation", async () => {
        TestBed.resetTestingModule();
        configure(UpperCaseParser);
        spyOn(Math, "random").and.returnValue(1.23456789e-7);
        const fixture = createFixture(SlotsHost);
        await fixture.whenStable();
        expect(host(fixture).textContent).toBe("DROP FILES HERE OR CLICK");
        expect(host(fixture).querySelector("a")).not.toBeNull();
    });

    it("scopes nested slot names to their own host", async () => {
        translate.setTranslation("en", { OUTER: "Outer {{link}}", INNER: "Inner {{link}}" });
        const fixture = createFixture(NestedSlotsHost);
        await fixture.whenStable();
        expect(host(fixture).textContent).toBe("Outer Inner nested");
        expect(host(fixture).querySelectorAll("em").length).toBe(1);
    });

    it("rejects duplicate slot names", () => {
        spyOn(console, "error");
        expect(() => createFixture(DuplicateSlotsHost)).toThrowError(
            /duplicate translateSlot "link"/,
        );
    });

    it("rejects slot names that are also params, including nested keys", () => {
        spyOn(console, "error");
        const cases: [string, InterpolationParameters][] = [
            ["uploadTextFileSelect", { uploadTextFileSelect: "text" }],
            ["user.link", { user: { link: "text" } }],
        ];
        for (const [slotName, params] of cases) {
            const fixture = TestBed.createComponent(SlotsHost);
            fixture.componentInstance.slotName.set(slotName);
            fixture.componentInstance.params.set(params);
            expect(() => fixture.autoDetectChanges()).toThrowError(
                /also passed in translateParams/,
            );
        }
    });
});

import { ChangeDetectionStrategy, Component, Injectable, inject, input } from "@angular/core";
import {
    InterpolatableTranslation,
    InterpolateFunction,
    InterpolationContext,
    InterpolationParameters,
    provideTranslateParser,
    provideTranslateService,
    TranslateDefaultParser,
    TranslatePipe,
    TranslateService,
    TranslationLookupResult,
} from "@ngx-translate/core";

/** Appends the language reported in the interpolation context, e.g. "OK [en]". */
@Injectable()
class ShowContextLangParser extends TranslateDefaultParser {
    public override interpolate(
        expr: InterpolateFunction | string,
        params?: InterpolationParameters,
        context?: InterpolationContext,
    ): string | undefined {
        return `${super.interpolate(expr, params, context) ?? ""} [${context?.lang ?? "?"}]`;
    }
}

// Both overrides take "status.ok" from "en", even though "de" (active) has the same text.

/** Deprecated path: reports via callback, but the equality guard cannot tell "OK" from "OK". */
@Injectable()
class LegacyLookupService extends TranslateService {
    protected override getTextToInterpolate(
        key: string,
        lang?: string,
        onLookup?: (lookup: TranslationLookupResult) => void,
    ): InterpolatableTranslation | undefined {
        const reported = super.getTextToInterpolate(key, lang, onLookup); // reports "de"
        return key === "status.ok" ? this.store.getTranslationValue("en", key) : reported;
    }
}

/** New path: translation and context are returned together and cannot diverge. */
@Injectable()
class StructuredLookupService extends TranslateService {
    protected override lookupTranslation(
        key: string,
        lang?: string,
    ): TranslationLookupResult | undefined {
        if (key === "status.ok") {
            const translation = this.store.getTranslationValue("en", key);
            return translation === undefined
                ? undefined
                : { translation, context: { key, lang: "en" } };
        }
        return super.lookupTranslation(key, lang);
    }
}

const providersFor = (serviceClass: typeof TranslateService) => [
    provideTranslateService({
        lang: "de",
        fallbackLang: "en",
        parser: provideTranslateParser(ShowContextLangParser),
    }),
    { provide: TranslateService, useClass: serviceClass },
];

/** Renders the demo keys with the TranslateService provided by its host. */
@Component({
    selector: "app-lookup-box",
    imports: [TranslatePipe],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="sub-card">
            <h4>{{ title() }}</h4>
            @for (key of keys; track key) {
                <div class="translation-item">
                    <span class="key">{{ key }}</span>
                    <span class="value">{{ key | translate }}</span>
                </div>
            }
        </div>
    `,
})
class LookupBoxComponent {
    readonly title = input.required<string>();
    protected readonly keys = ["status.ok", "greeting", "only.en"];

    constructor() {
        const translate = inject(TranslateService);
        translate.setTranslation("de", { "status.ok": "OK", greeting: "Hallo" });
        translate.setTranslation("en", {
            "status.ok": "OK",
            greeting: "Hello",
            "only.en": "Only English",
        });
    }
}

@Component({
    selector: "app-legacy-lookup-host",
    imports: [LookupBoxComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: providersFor(LegacyLookupService),
    template: `<app-lookup-box title="getTextToInterpolate() override (deprecated)" />`,
})
class LegacyLookupHostComponent {}

@Component({
    selector: "app-structured-lookup-host",
    imports: [LookupBoxComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: providersFor(StructuredLookupService),
    template: `<app-lookup-box title="lookupTranslation() override" />`,
})
class StructuredLookupHostComponent {}

@Component({
    selector: "app-lookup-context",
    imports: [LegacyLookupHostComponent, StructuredLookupHostComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="card">
            <h2>Lookup context (#1693)</h2>
            <div class="info-box">
                Active language <code>de</code>, fallback <code>en</code>. Each value shows the
                language reported to the parser in brackets. Both services take
                <code>status.ok</code> from <code>en</code>, while <code>de</code> has the identical
                text.
            </div>
            <div class="demo-grid">
                <app-legacy-lookup-host />
                <app-structured-lookup-host />
            </div>
        </div>
    `,
})
export class LookupContextComponent {}

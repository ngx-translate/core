import { ChangeDetectionStrategy, Component, DestroyRef, inject } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
    TranslateService,
    TranslatePipe,
    provideChildTranslateService,
} from "@ngx-translate/core";
import { provideTranslateHttpLoader } from "@ngx-translate/http-loader";
import { LanguageSwitchComponent } from "../../components/language-switch/language-switch.component";
import { NestedComponent } from "./nested/nested.component";
import { HierarchyVizComponent } from "../../components/hierarchy-viz/hierarchy-viz.component";
import { MethodsComparisonComponent } from "../../components/methods-comparison/methods-comparison.component";
import { ConsoleLogService } from "../../services/console-log.service";

@Component({
    selector: "app-extended",
    imports: [
        TranslatePipe,
        LanguageSwitchComponent,
        NestedComponent,
        HierarchyVizComponent,
        MethodsComparisonComponent,
    ],
    providers: [
        provideChildTranslateService({
            loader: provideTranslateHttpLoader({
                prefix: "./i18n-extended/",
                suffix: ".json",
                enforceLoading: true,
            }),
        }),
    ],
    template: `
        <div class="card">
            <h2>Connected Child Service</h2>
            <div class="info-box info">
                This component uses <code>provideChildTranslateService()</code>. It has its own
                translations but <strong>falls back</strong> to the parent (root) for missing keys.
                It also inherits the global language state.
            </div>

            <div style="margin-bottom: 2rem;">
                <h4><span>🌐</span> Global Language Control</h4>
                <p style="font-size: 0.875rem; color: var(--text-muted); margin-bottom: 0.5rem;">
                    This affects the root service and all child services.
                </p>
                <app-language-switch />
            </div>

            <div class="demo-grid">
                <div class="sub-card">
                    <h4><span>🌿</span> Local & Derived Translations</h4>
                    <div class="translation-item">
                        <span class="key">extended.own</span>
                        <span class="value">{{ "extended.own" | translate }}</span>
                        <em style="font-size: 0.7rem; color: var(--accent); display: block;"
                            >(Found locally)</em
                        >
                    </div>
                    <div class="translation-item">
                        <span class="key">root.own</span>
                        <span class="value">{{ "root.own" | translate }}</span>
                        <em style="font-size: 0.7rem; color: var(--primary); display: block;"
                            >(Fallback to Root)</em
                        >
                    </div>
                    <div class="translation-item">
                        <span class="key">shared.greeting</span>
                        <span class="value">{{ "shared.greeting" | translate }}</span>
                        <em style="font-size: 0.7rem; color: var(--accent); display: block;"
                            >(Overridden locally)</em
                        >
                    </div>
                </div>

                <div class="sub-card">
                    <h4><span>⚙️</span> Configuration</h4>
                    <p>
                        <strong>Current Lang:</strong> <code>{{ translate.getCurrentLang() }}</code>
                    </p>
                    <p><strong>Is Root:</strong> <code>false</code></p>
                    <p><strong>Has Parent:</strong> <code>true</code></p>
                </div>
            </div>

            <div class="sub-card" style="margin-top: 1.5rem;">
                <app-methods-comparison />
            </div>

            <app-nested />

            <app-hierarchy-viz />
        </div>
    `,
    styles: [],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExtendedComponent {
    translate = inject(TranslateService);
    private consoleLog = inject(ConsoleLogService);
    private destroyRef = inject(DestroyRef);

    constructor() {
        this.translate.addLangs(["de", "en"]);

        this.translate.onLangChange
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((event) => {
                this.consoleLog.log("[extended] onLangChange", { lang: event.lang });
            });

        this.translate.onFallbackLangChange
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((event) => {
                this.consoleLog.log("[extended] onFallbackLangChange", { lang: event.lang });
            });

        this.translate.onTranslationChange
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((event) => {
                this.consoleLog.log("[extended] onTranslationChange", event);
            });
    }
}

import { ChangeDetectionStrategy, Component, DestroyRef, inject } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
    TranslateService,
    TranslatePipe,
    provideTranslateService,
} from "@ngx-translate/core";
import { provideTranslateHttpLoader } from "@ngx-translate/http-loader";
import { LanguageSwitchComponent } from "../../components/language-switch/language-switch.component";
import { HierarchyVizComponent } from "../../components/hierarchy-viz/hierarchy-viz.component";
import { MethodsComparisonComponent } from "../../components/methods-comparison/methods-comparison.component";
import { IconComponent } from "../../components/icon/icon.component";
import { IsolatedChildComponent } from "./isolated-child/isolated-child.component";
import { ConsoleLogService } from "../../services/console-log.service";

@Component({
    selector: "app-isolated",
    imports: [
        TranslatePipe,
        LanguageSwitchComponent,
        HierarchyVizComponent,
        MethodsComparisonComponent,
        IconComponent,
        IsolatedChildComponent,
    ],
    providers: [
        provideTranslateService({
            loader: provideTranslateHttpLoader({
                prefix: "./i18n-isolated/",
                suffix: ".json",
                enforceLoading: true,
            }),
        }),
    ],
    template: `
        <div class="card">
            <h2>Isolated Service</h2>
            <div class="info-box warning">
                This service is completely isolated. Changing the root language above has no effect
                here.
            </div>

            <div style="margin-bottom: 2rem;">
                <h4><app-icon name="globe" /> Local Language Control</h4>
                <p style="font-size: 0.875rem; color: var(--text-muted); margin-bottom: 0.5rem;">
                    This switcher only affects THIS component and its children.
                </p>
                <app-language-switch />
            </div>

            <div class="demo-grid">
                <div class="sub-card">
                    <h4><app-icon name="lock" /> Isolated Translations</h4>
                    <div class="translation-item">
                        <span class="key">isolated.own</span>
                        <span class="value">{{ "isolated.own" | translate }}</span>
                    </div>
                    <div class="translation-item">
                        <span class="key">root.own</span>
                        <span class="value">{{ "root.own" | translate }}</span>
                        <em style="font-size: 0.7rem; color: #ef4444; display: block;"
                            >(Not found/Fallback to key)</em
                        >
                    </div>
                    <div class="translation-item">
                        <span class="key">shared.greeting</span>
                        <span class="value">{{ "shared.greeting" | translate }}</span>
                    </div>
                </div>

                <div class="sub-card">
                    <h4><app-icon name="cog" /> Configuration</h4>
                    <p>
                        <strong>Current Lang:</strong> <code>{{ translate.getCurrentLang() }}</code>
                    </p>
                    <p>
                        <strong>Fallback Lang:</strong>
                        <code>{{ translate.getFallbackLang() || "None" }}</code>
                    </p>
                    <p>
                        <strong>Is Root:</strong> <code>true</code>
                        <small>(Isolated services are roots of their own trees)</small>
                    </p>
                </div>
            </div>

            <div class="sub-card" style="margin-top: 1.5rem;">
                <app-methods-comparison />
            </div>

            <app-isolated-child />

            <app-hierarchy-viz />
        </div>
    `,
    styles: [],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IsolatedComponent {
    translate = inject(TranslateService);
    private consoleLog = inject(ConsoleLogService);
    private destroyRef = inject(DestroyRef);

    constructor() {
        this.translate.addLangs(["de", "en"]);
        this.translate.setFallbackLang("en");
        this.translate.use("en");

        this.translate.onLangChange
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((event) => {
                this.consoleLog.log("[isolated] onLangChange", { lang: event.lang });
            });

        this.translate.onFallbackLangChange
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((event) => {
                this.consoleLog.log("[isolated] onFallbackLangChange", { lang: event.lang });
            });

        this.translate.onTranslationChange
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((event) => {
                this.consoleLog.log("[isolated] onTranslationChange", event);
            });
    }
}

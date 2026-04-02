import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { TranslateService, TranslatePipe, provideTranslateService } from "@ngx-translate/core";
import { provideTranslateHttpLoader } from "@ngx-translate/http-loader";
import { LanguageSwitchComponent } from "../../components/language-switch/language-switch.component";
import { HierarchyVizComponent } from "../../components/hierarchy-viz/hierarchy-viz.component";

@Component({
    selector: "app-isolated",
    imports: [TranslatePipe, LanguageSwitchComponent, HierarchyVizComponent],
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
                This service is completely isolated. Changing the root language above has no effect here.
            </div>

            <div style="margin-bottom: 2rem;">
                <h4><span>🌐</span> Local Language Control</h4>
                <p style="font-size: 0.875rem; color: var(--text-muted); margin-bottom: 0.5rem;">
                    This switcher only affects THIS component and its children.
                </p>
                <app-language-switch />
            </div>

            <div class="demo-grid">
                <div class="sub-card">
                    <h4><span>🔒</span> Isolated Translations</h4>
                    <div class="translation-item">
                        <span class="key">isolated.own</span>
                        <span class="value">{{ "isolated.own" | translate }}</span>
                    </div>
                    <div class="translation-item">
                        <span class="key">root.own</span>
                        <span class="value">{{ "root.own" | translate }}</span>
                        <em style="font-size: 0.7rem; color: #ef4444; display: block;">(Not found/Fallback to key)</em>
                    </div>
                    <div class="translation-item">
                        <span class="key">shared.greeting</span>
                        <span class="value">{{ "shared.greeting" | translate }}</span>
                    </div>
                </div>

                <div class="sub-card">
                    <h4><span>⚙️</span> Configuration</h4>
                    <p><strong>Current Lang:</strong> <code>{{ translate.getCurrentLang() }}</code></p>
                    <p><strong>Fallback Lang:</strong> <code>{{ translate.getFallbackLang() || 'None' }}</code></p>
                    <p><strong>Is Root:</strong> <code>true</code> <small>(Isolated services are roots of their own trees)</small></p>
                </div>
            </div>

            <app-hierarchy-viz />
        </div>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IsolatedComponent {
    translate = inject(TranslateService);

    constructor() {
        this.translate.addLangs(["de", "en"]);
        this.translate.setFallbackLang("en");
        this.translate.use("en");
    }
}

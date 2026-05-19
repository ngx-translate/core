import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { TranslateService, TranslatePipe } from "@ngx-translate/core";
import { HierarchyVizComponent } from "../../components/hierarchy-viz/hierarchy-viz.component";
import { MethodsComparisonComponent } from "../../components/methods-comparison/methods-comparison.component";
import { IconComponent } from "../../components/icon/icon.component";

@Component({
    selector: "app-global",
    imports: [TranslatePipe, HierarchyVizComponent, MethodsComparisonComponent, IconComponent],
    template: `
        <div class="card">
            <h2>Root Service (Global)</h2>
            <div class="info-box info">
                This component uses the root <code>TranslateService</code> directly. All
                translations come from the root service configured in <code>app.config.ts</code>.
            </div>

            <div class="demo-grid">
                <div class="sub-card">
                    <h4><app-icon name="home" /> Root Translations</h4>
                    <div class="translation-item">
                        <span class="key">root.own</span>
                        <span class="value">{{ "root.own" | translate }}</span>
                    </div>
                    <div class="translation-item">
                        <span class="key">shared.greeting</span>
                        <span class="value">{{ "shared.greeting" | translate }}</span>
                    </div>
                    <div class="translation-item">
                        <span class="key">demo.title</span>
                        <span class="value">{{ "demo.title" | translate }}</span>
                    </div>
                </div>

                <div class="sub-card">
                    <h4><app-icon name="cog" /> Configuration</h4>
                    <p>
                        <strong>Current Lang:</strong> <code>{{ translate.getCurrentLang() }}</code>
                    </p>
                    <p>
                        <strong>Fallback Lang:</strong>
                        <code>{{ translate.getFallbackLang() }}</code>
                    </p>
                    <p><strong>Is Root:</strong> <code>true</code></p>
                </div>
            </div>

            <div class="sub-card" style="margin-top: 1.5rem;">
                <app-methods-comparison />
            </div>

            <app-hierarchy-viz />
        </div>
    `,
    styles: [],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GlobalComponent {
    translate = inject(TranslateService);
}

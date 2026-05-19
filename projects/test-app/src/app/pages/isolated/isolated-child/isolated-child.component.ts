import { ChangeDetectionStrategy, Component } from "@angular/core";
import { TranslatePipe, provideChildTranslateService } from "@ngx-translate/core";
import { provideTranslateHttpLoader } from "@ngx-translate/http-loader";
import { MethodsComparisonComponent } from "../../../components/methods-comparison/methods-comparison.component";
import { HierarchyVizComponent } from "../../../components/hierarchy-viz/hierarchy-viz.component";

@Component({
    selector: "app-isolated-child",
    imports: [TranslatePipe, MethodsComparisonComponent, HierarchyVizComponent],
    providers: [
        provideChildTranslateService({
            loader: provideTranslateHttpLoader({
                prefix: "./i18n-isolated-child/",
                suffix: ".json",
                enforceLoading: true,
            }),
        }),
    ],
    template: `
        <div class="sub-card" style="margin-top: 2rem; border-style: dashed; background: #f8fafc;">
            <h4>Child of Isolated Service</h4>
            <p style="font-size: 0.875rem; color: var(--text-muted); margin-bottom: 1rem;">
                A child service nested inside the isolated tree. It falls back to the isolated
                root, NOT to the global root.
            </p>
            <div class="translation-item">
                <span class="key">isolated-child.own</span>
                <span class="value">{{ "isolated-child.own" | translate }}</span>
                <em style="font-size: 0.7rem; color: var(--accent); display: block;"
                    >(Found locally)</em
                >
            </div>
            <div class="translation-item">
                <span class="key">isolated.own</span>
                <span class="value">{{ "isolated.own" | translate }}</span>
                <em style="font-size: 0.7rem; color: var(--primary); display: block;"
                    >(Fallback to Isolated Root)</em
                >
            </div>
            <div class="translation-item">
                <span class="key">root.own</span>
                <span class="value">{{ "root.own" | translate }}</span>
                <em style="font-size: 0.7rem; color: #ef4444; display: block;"
                    >(Not found — global root is invisible from here)</em
                >
            </div>

            <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px dashed var(--border);">
                <app-methods-comparison />
            </div>

            <app-hierarchy-viz />
        </div>
    `,
    styles: [],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IsolatedChildComponent {}

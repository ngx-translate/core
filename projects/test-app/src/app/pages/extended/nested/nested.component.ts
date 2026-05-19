import { ChangeDetectionStrategy, Component } from "@angular/core";
import { TranslatePipe, provideChildTranslateService } from "@ngx-translate/core";
import { provideTranslateHttpLoader } from "@ngx-translate/http-loader";
import { MethodsComparisonComponent } from "../../../components/methods-comparison/methods-comparison.component";
import { HierarchyVizComponent } from "../../../components/hierarchy-viz/hierarchy-viz.component";
import { IconComponent } from "../../../components/icon/icon.component";

@Component({
    selector: "app-nested",
    imports: [TranslatePipe, MethodsComparisonComponent, HierarchyVizComponent, IconComponent],
    providers: [
        provideChildTranslateService({
            loader: provideTranslateHttpLoader({
                prefix: "./i18n-nested/",
                suffix: ".json",
                enforceLoading: true,
            }),
        }),
    ],
    template: `
        <div class="sub-card" style="margin-top: 2rem; border-style: dashed; background: #f8fafc;">
            <h4><app-icon name="cube" /> Nested Component (Grandchild)</h4>
            <div class="translation-item">
                <span class="key">nested.own</span>
                <span class="value">{{ "nested.own" | translate }}</span>
                <em style="font-size: 0.7rem; color: var(--accent); display: block;"
                    >(Found locally)</em
                >
            </div>
            <div class="translation-item">
                <span class="key">extended.own</span>
                <span class="value">{{ "extended.own" | translate }}</span>
                <em style="font-size: 0.7rem; color: var(--secondary); display: block;"
                    >(Fallback to Parent)</em
                >
            </div>
            <div class="translation-item">
                <span class="key">root.own</span>
                <span class="value">{{ "root.own" | translate }}</span>
                <em style="font-size: 0.7rem; color: var(--primary); display: block;"
                    >(Fallback to Root)</em
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
export class NestedComponent {}

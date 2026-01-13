import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { TranslateService, TranslatePipe, provideChildTranslateService } from "@ngx-translate/core";
import { provideTranslateHttpLoader } from "@ngx-translate/http-loader";

@Component({
    selector: "app-nested",
    imports: [TranslatePipe],
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
            <h4><span>🍀</span> Nested Component (Grandchild)</h4>
            <div class="translation-item">
                <span class="key">nested.own</span>
                <span class="value">{{ "nested.own" | translate }}</span>
                <em style="font-size: 0.7rem; color: var(--accent); display: block;">(Found locally)</em>
            </div>
            <div class="translation-item">
                <span class="key">extended.own</span>
                <span class="value">{{ "extended.own" | translate }}</span>
                <em style="font-size: 0.7rem; color: var(--primary); display: block;">(Fallback to Parent)</em>
            </div>
            <div class="translation-item">
                <span class="key">root.own</span>
                <span class="value">{{ "root.own" | translate }}</span>
                <em style="font-size: 0.7rem; color: var(--primary); display: block;">(Fallback to Root)</em>
            </div>
        </div>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NestedComponent {
    translate = inject(TranslateService);
}

import { ChangeDetectionStrategy, Component, computed, inject, signal } from "@angular/core";
import { toObservable, toSignal } from "@angular/core/rxjs-interop";
import { switchMap } from "rxjs";
import {
    TranslateService,
    TranslatePipe,
    TranslateDirective,
    provideTranslateService,
} from "@ngx-translate/core";
import { provideTranslateHttpLoader } from "@ngx-translate/http-loader";
import { LanguageSwitchComponent } from "../../components/language-switch/language-switch.component";
import { HierarchyVizComponent } from "../../components/hierarchy-viz/hierarchy-viz.component";

@Component({
    selector: "app-isolated",
    imports: [TranslatePipe, TranslateDirective, LanguageSwitchComponent, HierarchyVizComponent],
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
                    <h4><span>⚙️</span> Configuration</h4>
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
                <h4><span>🔬</span> Translation Methods Comparison</h4>
                <p style="font-size: 0.875rem; color: var(--text-muted); margin-bottom: 1rem;">
                    Type a name below — all four methods translate <code>demo.greeting</code> with
                    it.
                </p>
                <input
                    type="text"
                    [value]="name()"
                    (input)="name.set($any($event.target).value)"
                    placeholder="Enter a name..."
                    class="demo-input"
                />
                <div class="method-grid">
                    <div class="method-item">
                        <span class="method-label">Pipe</span>
                        <span class="method-value">{{
                            "demo.greeting" | translate: { name: name() }
                        }}</span>
                    </div>
                    <div class="method-item">
                        <span class="method-label">Directive</span>
                        <span
                            class="method-value"
                            [translate]="'demo.greeting'"
                            [translateParams]="{ name: name() }"
                        ></span>
                    </div>
                    <div class="method-item">
                        <span class="method-label">Observable (get)</span>
                        <span class="method-value">{{ greetingObs() }}</span>
                    </div>
                    <div class="method-item">
                        <span class="method-label">Signal (translate)</span>
                        <span class="method-value">{{ greetingSignal() }}</span>
                    </div>
                </div>
            </div>

            <app-hierarchy-viz />
        </div>
    `,
    styles: `
        .demo-input {
            width: 100%;
            padding: 0.625rem 1rem;
            border: 1px solid var(--border);
            border-radius: var(--radius-sm);
            font-size: 0.9375rem;
            font-family: inherit;
            margin-bottom: 1rem;
            transition: border-color 0.2s;

            &:focus {
                outline: none;
                border-color: var(--primary);
            }
        }

        .method-grid {
            display: grid;
            gap: 0.5rem;
        }

        .method-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.5rem 0.75rem;
            background: white;
            border-radius: var(--radius-sm);
            border: 1px solid var(--border);
        }

        .method-label {
            font-size: 0.75rem;
            font-weight: 600;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        .method-value {
            color: var(--text-main);
        }
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IsolatedComponent {
    translate = inject(TranslateService);

    name = signal("World");

    greetingObs = toSignal(
        toObservable(this.name).pipe(
            switchMap((name) => this.translate.get("demo.greeting", { name })),
        ),
    );

    greetingSignal = this.translate.translate(
        "demo.greeting",
        computed(() => ({ name: this.name() })),
    );

    constructor() {
        this.translate.addLangs(["de", "en"]);
        this.translate.setFallbackLang("en");
        this.translate.use("en");
    }
}

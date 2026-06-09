import { Component, inject, input, ChangeDetectionStrategy } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";

@Component({
    selector: "app-language-switch",
    template: `
        @if (label()) {
            <span class="label">{{ label() }}</span>
        }
        @for (lang of translate.getLangs(); track lang) {
            <button (click)="switchLang(lang)" [class.active]="translate.getCurrentLang() === lang">
                {{ lang }}
            </button>
        }
    `,
    changeDetection: ChangeDetectionStrategy.Default,
    styles: `
        :host {
            display: flex;
            gap: 0.5rem;
            align-items: center;
        }

        .label {
            font-size: 0.75rem;
            font-weight: 600;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        button {
            background: white;
            border: 1px solid var(--border);
            padding: 0.5rem 1rem;
            font-size: 0.875rem;
            font-weight: 600;
            color: var(--text-muted);
            border-radius: var(--radius-sm);
            cursor: pointer;
            transition: all 0.2s;
            text-transform: uppercase;
            letter-spacing: 0.025em;

            &:hover {
                background: #f8fafc;
                color: var(--text-main);
                border-color: var(--secondary);
            }

            &.active {
                background: var(--primary);
                color: white;
                border-color: var(--primary);
                box-shadow: var(--shadow-sm);
            }
        }
    `,
})
export class LanguageSwitchComponent {
    translate = inject(TranslateService);

    label = input<string>();
    isRoot = input(false);

    switchLang(lang: string) {
        this.translate.use(lang);
        if (this.isRoot()) {
            document.body.classList.add("root-lang-changed");
            setTimeout(() => document.body.classList.remove("root-lang-changed"), 600);
        }
    }
}

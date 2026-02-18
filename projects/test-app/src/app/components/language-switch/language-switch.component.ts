import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";

@Component({
    selector: "app-language-switch",
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        @for (lang of translate.$languages(); track lang) {
            <button
                (click)="translate.use(lang)"
                [class.active]="translate.getCurrentLang() === lang"
            >
                {{ lang }}
            </button>
        }
    `,
    styles: `
        :host {
            display: flex;
            gap: 0.5rem;
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
}

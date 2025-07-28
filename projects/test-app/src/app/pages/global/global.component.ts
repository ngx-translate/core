import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { PageContentComponent } from "../../components/page-content/page-content.component";
import { TranslateService } from "@ngx-translate/core";
import { LanguageSwitchComponent } from "../../components/language-switch/language-switch.component";

@Component({
    selector: "app-second",
    imports: [
        // Components
        PageContentComponent,
        LanguageSwitchComponent,
    ],
    template: `
        <h2>Component uses global TranslateService</h2>
        <app-language-switch />
        <app-page-content></app-page-content>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GlobalComponent {
    public translate = inject(TranslateService);
}

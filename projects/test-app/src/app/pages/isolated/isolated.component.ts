import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { PageContentComponent } from "../../components/page-content/page-content.component";
import { TranslateService, provideTranslateService } from "@ngx-translate/core";
import { provideTranslateHttpLoader } from "@ngx-translate/http-loader";
import { LanguageSwitchComponent } from "../../components/language-switch/language-switch.component";

@Component({
    selector: "app-first",
    imports: [
        // Components
        PageContentComponent,
        LanguageSwitchComponent,
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
    template: ` <h2>Component uses isolated TranslateService</h2>
        <app-language-switch />
        <app-page-content />`,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IsolatedComponent {
    public translate = inject(TranslateService);

    constructor() {
        this.translate.use("de");
        this.translate.addLangs(["de", "en"]);
    }
}

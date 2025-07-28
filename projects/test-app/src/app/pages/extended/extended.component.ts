import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { TranslateService, provideChildTranslateService } from "@ngx-translate/core";
import { provideTranslateHttpLoader } from "@ngx-translate/http-loader";
import { LanguageSwitchComponent } from "../../components/language-switch/language-switch.component";
import { PageContentComponent } from "../../components/page-content/page-content.component";

@Component({
    selector: "app-first",
    imports: [
        // Components
        PageContentComponent,
        LanguageSwitchComponent,
    ],
    providers: [
        provideChildTranslateService({
            extend: true,
            loader: provideTranslateHttpLoader({
                prefix: "./i18n-extended/",
                suffix: ".json",
                enforceLoading: true,
            }),
        }),
    ],
    template: ` <h2>Component uses global TranslateService with extend</h2>
        <app-language-switch />
        <app-page-content />`,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExtendedComponent {
    public translate = inject(TranslateService);

    constructor() {
        this.translate.use("de");
        this.translate.addLangs(["de", "en"]);
    }
}

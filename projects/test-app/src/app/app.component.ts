import { Component, inject, OnInit } from "@angular/core";
import { RouterModule } from "@angular/router";
import { _, TranslateService, TranslationObject } from "@ngx-translate/core";
import { map } from "rxjs";
import { LanguageSwitchComponent } from "./components/language-switch/language-switch.component";

@Component({
    selector: "app-root",
    standalone: true,
    imports: [
        RouterModule,

        // Components
        LanguageSwitchComponent,
    ],
    templateUrl: "./app.component.html",
})
export class AppComponent implements OnInit {
    private translate = inject(TranslateService);

    title = _("test-app");

    ngOnInit() {
        // Service Get method with a set of string[]
        this.translate
            .get(["demo.simple.text-as-attribute", "demo.simple.text-as-content"])
            .pipe(
                map((arr: TranslationObject) => {
                    return Object.values(arr).join(", ");
                }),
            )
            .subscribe((result: string) => {
                console.info(".get([])", result);

                const instantTranslation = this.translate.instant("demo.simple.text-as-attribute");
                console.info("instant", instantTranslation);
            });

        this.translate.onTranslationChange.subscribe((event) => {
            console.info("onTranslationChange", event);
        });
    }

    reloadLang() {
        this.translate.reloadLang(this.translate.getCurrentLang()).subscribe((translations) => {
            console.info("reloadLang", translations);
        });
    }
}

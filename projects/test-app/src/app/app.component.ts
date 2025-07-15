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
    private _translate = inject(TranslateService);

    title = _("test-app");

    constructor() {
        this._translate.addLangs(["de", "en"]);
        this._translate.setFallbackLang("en");
        this._translate.use("en");
    }

    ngOnInit() {
        // Service Get method with a set of string[]
        this._translate
            .get(["demo.simple.text-as-attribute", "demo.simple.text-as-content"])
            .pipe(
                map((arr: TranslationObject) => {
                    return Object.values(arr).join(", ");
                }),
            )
            .subscribe(console.info);
    }
}

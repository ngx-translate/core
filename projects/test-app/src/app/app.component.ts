import { Component, inject, OnInit } from "@angular/core";
import { _, TranslateDirective, TranslatePipe, TranslateService } from "@ngx-translate/core";
import { map } from "rxjs";
import { TranslationObject } from "../../../ngx-translate/src/public-api";
import { LanguageSwitchComponent } from "./language-switch/language-switch.component";
import { StandaloneComponent } from "./standalone/standalone.component";

@Component({
    selector: "app-root",
    standalone: true,
    imports: [
        // Components
        LanguageSwitchComponent,
        StandaloneComponent,

        // Vendors
        TranslateDirective,
        TranslatePipe,
    ],
    templateUrl: "./app.component.html",
})
export class AppComponent implements OnInit {
    private _translate = inject(TranslateService);

    title = _("test-app");

    constructor() {
        this._translate.addLangs(["de", "en"]);
        this._translate.setDefaultLang("en");
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

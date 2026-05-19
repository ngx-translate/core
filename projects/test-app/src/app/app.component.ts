import { Component, inject, OnInit } from "@angular/core";
import { RouterModule } from "@angular/router";
import { _, TranslateService, TranslationObject } from "@ngx-translate/core";
import { map } from "rxjs";
import { ConsoleComponent } from "./components/console/console.component";
import { LanguageSwitchComponent } from "./components/language-switch/language-switch.component";
import { ConsoleLogService } from "./services/console-log.service";

@Component({
    selector: "app-root",
    imports: [
        RouterModule,

        // Components
        ConsoleComponent,
        LanguageSwitchComponent,
    ],
    templateUrl: "./app.component.html",
})
export class AppComponent implements OnInit {
    private translate = inject(TranslateService);
    private consoleLog = inject(ConsoleLogService);

    // just a translation id - not used anywhere
    title = _("demo.title");

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
                this.consoleLog.log(".get([])", result);

                const instantTranslation = this.translate.instant("demo.simple.text-as-attribute");
                this.consoleLog.log("instant", instantTranslation);
            });

        this.translate.onTranslationChange.subscribe((event) => {
            this.consoleLog.log("[root] onTranslationChange", event);
        });

        this.translate.onLangChange.subscribe((event) => {
            this.consoleLog.log("[root] onLangChange", { lang: event.lang });
        });

        this.translate.onFallbackLangChange.subscribe((event) => {
            this.consoleLog.log("[root] onFallbackLangChange", { lang: event.lang });
        });
    }

    reloadLang() {
        this.translate.reloadLang(this.translate.getCurrentLang()!).subscribe((translations) => {
            this.consoleLog.log("reloadLang", translations);
        });
    }
}

import { Component } from "@angular/core";
import { _, TranslateDirective, TranslatePipe, TranslateService } from "@ngx-translate/core";
import { StandaloneComponent } from "./standalone.component";


@Component({
    selector: "app-root",
    standalone: true,
    imports: [TranslateDirective, TranslatePipe, StandaloneComponent],
    templateUrl: "./app.component.html",
    styleUrl: "./app.component.scss"
})
export class AppComponent
{
    title = _("test-app");

    constructor(private translate: TranslateService) {
        this.translate.addLangs(['de', 'en']);
        this.translate.setDefaultLang('en');
        this.translate.use('en');
    }
}

import {Component} from "@angular/core";
import {TranslatePipe, TranslateDirective} from "@codeandweb/ngx-translate";


@Component({
    selector: "app-standalone-component",
    standalone: true,
    imports: [TranslateDirective, TranslatePipe],
    templateUrl: "./standalone.component.html"
})
export class StandaloneComponent
{

}

import {Component} from "@angular/core";
import {TranslatePipe, TranslateDirective} from "@ngx-translate/core";


@Component({
    selector: "app-standalone-component",
    standalone: true,
    imports: [TranslateDirective, TranslatePipe],
    templateUrl: "./standalone.component.html"
})
export class StandaloneComponent
{

}

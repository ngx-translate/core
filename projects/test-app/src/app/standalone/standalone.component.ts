import { ChangeDetectionStrategy, Component } from "@angular/core";
import { TranslateDirective, TranslatePipe } from "@ngx-translate/core";


@Component({
    selector: "app-standalone-component",
    standalone: true,
    imports: [TranslateDirective, TranslatePipe],
    styleUrl: "./standalone.component.scss",
    templateUrl: "./standalone.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StandaloneComponent
{

}

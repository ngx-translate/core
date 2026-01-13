import { ChangeDetectionStrategy, Component } from "@angular/core";
import { TranslateDirective, TranslatePipe } from "@ngx-translate/core";
import { StandaloneComponent } from "../standalone/standalone.component";

@Component({
    selector: "app-page-content",
    imports: [StandaloneComponent, TranslateDirective, TranslatePipe],
    templateUrl: "./page-content.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageContentComponent {}

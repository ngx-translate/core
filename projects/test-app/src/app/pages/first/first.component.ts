import { ChangeDetectionStrategy, Component } from "@angular/core";
import { PageContentComponent } from "../../components/page-content/page-content.component";

@Component({
    selector: "app-first",
    imports: [
        // Components
        PageContentComponent,
    ],
    template: `<app-page-content></app-page-content>`,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FirstComponent {}

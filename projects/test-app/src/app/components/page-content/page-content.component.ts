import { ChangeDetectionStrategy, Component } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { TranslateDirective, TranslatePipe } from "@ngx-translate/core";
import { StandaloneComponent } from "../standalone/standalone.component";

@Component({
    selector: "app-page-content",
    imports: [
        // Components
        StandaloneComponent,

        // Vendors
        TranslateDirective,
        TranslatePipe,

        // Mat
        FormsModule,
        ReactiveFormsModule,
        MatSelectModule,
        MatFormFieldModule,
    ],
    templateUrl: "./page-content.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageContentComponent {}

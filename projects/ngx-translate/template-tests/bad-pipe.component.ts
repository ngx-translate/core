import { Component } from "@angular/core";
import { TranslatePipe } from "@ngx-translate/core";
import "./registry";

/**
 * Negative proof for the `| translate` pipe: an out-of-union key must be
 * rejected by `strictTemplates`. The runner expects this program to FAIL to
 * compile, citing `does.not.exist`. If it compiles, pipe key enforcement
 * regressed in templates.
 */
@Component({
    selector: "app-bad-pipe",
    standalone: true,
    imports: [TranslatePipe],
    template: `{{ "does.not.exist" | translate }}`,
})
export class BadPipeComponent {}

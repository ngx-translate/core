import { Component } from "@angular/core";
import { TranslateDirective } from "@ngx-translate/core";
import "./registry";

/**
 * Negative proof for the `[translate]` directive: an out-of-union key must be
 * rejected by `strictTemplates`. The runner expects this program to FAIL to
 * compile, citing `does.not.exist`.
 */
@Component({
    selector: "app-bad-directive",
    standalone: true,
    imports: [TranslateDirective],
    template: `<p [translate]="'does.not.exist'"></p>`,
})
export class BadDirectiveComponent {}

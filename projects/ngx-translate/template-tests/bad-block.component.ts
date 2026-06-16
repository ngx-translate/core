import { Component } from "@angular/core";
import { TranslateBlockDirective } from "@ngx-translate/core";
import "./registry";

/**
 * Negative proof for the `*translateBlock` `t()` helper: an out-of-union key
 * must be rejected by `strictTemplates`. The runner expects this program to
 * FAIL to compile, citing `does.not.exist`. This is the surface the type-level
 * test can only assert by contract; here it is checked by a real ngtsc compile.
 */
@Component({
    selector: "app-bad-block",
    standalone: true,
    imports: [TranslateBlockDirective],
    template: `<ng-container *translateBlock="let t">{{ t("does.not.exist") }}</ng-container>`,
})
export class BadBlockComponent {}

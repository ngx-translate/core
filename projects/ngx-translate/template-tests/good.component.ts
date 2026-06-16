import { Component } from "@angular/core";
import { TranslateBlockDirective, TranslateDirective, TranslatePipe } from "@ngx-translate/core";
import "./registry";

/**
 * Positive end-to-end proof: with the registry augmented, in-union keys compile
 * clean under `strictTemplates` across all three template surfaces — the
 * `| translate` pipe, the `[translate]` directive, and the `*translateBlock`
 * `t()` helper. If template typing regressed (lost) or over-narrowed
 * (rejected a valid key), this component would fail to compile.
 */
@Component({
    selector: "app-good-keys",
    standalone: true,
    imports: [TranslatePipe, TranslateDirective, TranslateBlockDirective],
    template: `
        <p>{{ "home.title" | translate }}</p>
        <p [translate]="'nav.back'"></p>
        <ng-container *translateBlock="let t">{{ t("home.subtitle") }}</ng-container>
    `,
})
export class GoodKeysComponent {}

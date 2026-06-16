import { Directive, inject, OnInit, TemplateRef, ViewContainerRef } from "@angular/core";
import { TranslateService } from "./translate.service";
import {
    InterpolationParameters,
    Translation,
    TranslationKey,
} from "./translate.service.interface";

export class TranslateBlockContext {
    // `$implicit` is the `t` bound via `*translateBlock="let t"`. Typing its key
    // parameter to TranslationKey is what makes `{{ t('key') }}` key-checked
    // under strictTemplates (Angular reads this context type via the
    // ngTemplateContextGuard below), matching the registry-default typing the
    // `| translate` pipe and `[translate]` directive get.
    constructor(
        public $implicit: (key: TranslationKey, params?: InterpolationParameters) => Translation,
    ) {}
}

@Directive({
    // eslint-disable-next-line @angular-eslint/directive-selector
    selector: "[translateBlock]",
    standalone: true,
})
export class TranslateBlockDirective implements OnInit {
    private templateRef = inject(TemplateRef<TranslateBlockContext>);
    private viewContainer = inject(ViewContainerRef);
    private translateService = inject(TranslateService);

    ngOnInit(): void {
        const translateFn = (
            key: TranslationKey,
            params?: InterpolationParameters,
        ): Translation => {
            // instant() internally reads the store's translations() signal, which establishes
            // Angular signal tracking during template evaluation — no explicit subscription needed.
            return this.translateService.instant(key, params);
        };

        this.viewContainer.createEmbeddedView(
            this.templateRef,
            new TranslateBlockContext(translateFn),
        );
    }

    static ngTemplateContextGuard(
        _dir: TranslateBlockDirective,
        _ctx: unknown,
    ): _ctx is TranslateBlockContext {
        return true;
    }
}

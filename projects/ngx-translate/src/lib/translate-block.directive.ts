import { Directive, inject, OnInit, TemplateRef, ViewContainerRef } from "@angular/core";
import { TranslateService } from "./translate.service";
import { InterpolationParameters, Translation } from "./translate.service.interface";

export class TranslateBlockContext {
    constructor(public $implicit: (key: string, params?: InterpolationParameters) => Translation) {}
}

@Directive({
    selector: "[translateBlock]",
    standalone: true,
})
export class TranslateBlockDirective implements OnInit {
    private templateRef = inject(TemplateRef<TranslateBlockContext>);
    private viewContainer = inject(ViewContainerRef);
    private translateService = inject(TranslateService);

    ngOnInit(): void {
        const translateFn = (key: string, params?: InterpolationParameters): Translation => {
            // instant() internally reads the store's translations() signal, which establishes
            // Angular signal tracking during template evaluation — no explicit subscription needed.
            return this.translateService.instant(key, params);
        };

        this.viewContainer.createEmbeddedView(this.templateRef, new TranslateBlockContext(translateFn));
    }

    static ngTemplateContextGuard(
        _dir: TranslateBlockDirective,
        _ctx: unknown,
    ): _ctx is TranslateBlockContext {
        return true;
    }
}

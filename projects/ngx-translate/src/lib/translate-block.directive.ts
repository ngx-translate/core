import {
    ChangeDetectorRef,
    DestroyRef,
    Directive,
    EmbeddedViewRef,
    inject,
    OnInit,
    TemplateRef,
    ViewContainerRef,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
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
    private changeDetectorRef = inject(ChangeDetectorRef);
    private destroyRef = inject(DestroyRef);

    private viewRef: EmbeddedViewRef<TranslateBlockContext> | null = null;

    ngOnInit(): void {
        const translateFn = (key: string, params?: InterpolationParameters): Translation => {
            return this.translateService.instant(key, params);
        };

        const context = new TranslateBlockContext(translateFn);
        this.viewRef = this.viewContainer.createEmbeddedView(this.templateRef, context);

        this.translateService.onTranslationRefresh
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
                this.changeDetectorRef.markForCheck();
                this.viewRef?.markForCheck();
            });
    }

    static ngTemplateContextGuard(
        _dir: TranslateBlockDirective,
        _ctx: unknown,
    ): _ctx is TranslateBlockContext {
        return true;
    }
}

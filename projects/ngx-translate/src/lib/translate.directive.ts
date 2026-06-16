import {
    AfterViewChecked,
    ChangeDetectorRef,
    DestroyRef,
    Directive,
    effect,
    ElementRef,
    inject,
    Injector,
    Input,
    signal,
    Signal,
    WritableSignal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { TranslateService } from "./translate.service";
import { equals, isDefinedAndNotNull, isString } from "./util";
import {
    InterpolationParameters,
    Translation,
    TranslationKey,
    TranslationObject,
} from "./translate.service.interface";
import { ContentKeyHandler } from "./translate-content-key";

@Directive({
    // eslint-disable-next-line @angular-eslint/directive-selector
    selector: "[translate],[ngx-translate]",
    standalone: true,
})
export class TranslateDirective implements AfterViewChecked {
    private translateService = inject(TranslateService);
    private element = inject(ElementRef);
    private destroyRef = inject(DestroyRef);
    private changeDetectorRef = inject(ChangeDetectorRef);
    private injector = inject(Injector);

    private key!: TranslationKey;
    private currentParams?: InterpolationParameters;

    // Signal-based explicit key path
    private keySignal: WritableSignal<TranslationKey> | null = null;
    private paramsSignal: WritableSignal<InterpolationParameters | undefined> | null = null;
    private translationSignal: Signal<Translation | TranslationObject> | null = null;
    private effectCreated = false;

    // Deprecated content-as-key path
    private contentKeyHandler: ContentKeyHandler | null = null;

    @Input() set translate(key: TranslationKey) {
        if (key) {
            this.key = key;

            if (!this.keySignal) {
                this.keySignal = signal(key);
                this.paramsSignal = signal<InterpolationParameters | undefined>(this.currentParams);
                this.translationSignal = this.translateService.translate(
                    this.keySignal,
                    this.paramsSignal,
                );
                this.setupEffect();
            } else {
                this.keySignal.set(key);
            }
        }
    }

    @Input() set translateParams(params: InterpolationParameters) {
        if (!equals(this.currentParams, params)) {
            this.currentParams = params;

            if (this.paramsSignal) {
                this.paramsSignal.set(params);
            } else if (this.contentKeyHandler) {
                this.contentKeyHandler.checkNodes(params, true);
            }
        }
    }

    constructor() {
        this.translateService.onTranslationRefresh
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
                if (this.translationSignal) {
                    this.writeTranslationToDOM();
                } else if (this.contentKeyHandler) {
                    this.contentKeyHandler.checkNodes(this.currentParams, true);
                }
            });
    }

    ngAfterViewChecked() {
        if (!this.keySignal && !this.contentKeyHandler) {
            // No explicit key was bound — activate deprecated content-as-key path
            this.contentKeyHandler = new ContentKeyHandler(
                this.element,
                this.changeDetectorRef,
                this.translateService,
            );
        }

        if (this.contentKeyHandler) {
            this.contentKeyHandler.checkNodes(this.currentParams);
        }
    }

    private setupEffect(): void {
        if (this.effectCreated) {
            return;
        }
        this.effectCreated = true;

        effect(
            () => {
                const value = this.translationSignal!();
                this.writeToDOM(value);
            },
            { injector: this.injector },
        );
    }

    private writeTranslationToDOM(): void {
        if (this.translationSignal) {
            const value = this.translationSignal();
            this.writeToDOM(value);
        }
    }

    private writeToDOM(value: Translation | TranslationObject): void {
        const el = this.element.nativeElement;
        let text: string;

        if (isString(value)) {
            text = value as string;
        } else if (!isDefinedAndNotNull(value)) {
            text = this.key;
        } else {
            text = JSON.stringify(value);
        }

        el.textContent = text;
        this.changeDetectorRef.markForCheck();
    }
}

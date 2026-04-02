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
    StrictTranslation,
    Translation,
    TranslationObject,
} from "./translate.service.interface";

interface ExtendedNode extends Text {
    originalContent: string;
    currentValue: string;
    lookupKey: string;
    lastKey: string | null;
    data: string;
}

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

    private key!: string;
    private lastParams?: InterpolationParameters;
    private currentParams?: InterpolationParameters;

    // Signal-based key-input path
    private useSignalPath = false;
    private keySignal: WritableSignal<string> | null = null;
    private paramsSignal: WritableSignal<InterpolationParameters | undefined> | null = null;
    private translationSignal: Signal<Translation | TranslationObject> | null = null;
    private effectCreated = false;

    @Input() set translate(key: string) {
        if (key) {
            this.key = key;

            if (!this.useSignalPath) {
                // First time key is set — switch to signal path
                this.useSignalPath = true;
                this.keySignal = signal(key);
                this.paramsSignal = signal<InterpolationParameters | undefined>(this.currentParams);
                this.translationSignal = this.translateService.translate(
                    this.keySignal,
                    this.paramsSignal,
                );
                this.setupEffect();
            } else {
                // Subsequent key changes — just update the signal
                this.keySignal!.set(key);
            }
        }
    }

    @Input() set translateParams(params: InterpolationParameters) {
        if (!equals(this.currentParams, params)) {
            this.currentParams = params;

            if (this.useSignalPath && this.paramsSignal) {
                // Signal path: update the params signal
                this.paramsSignal.set(params);
            } else {
                // Content-as-key path: use imperative logic
                this.checkNodes(true);
            }
        }
    }

    constructor() {
        // Subscribe to all translation-related change events
        this.translateService.onTranslationRefresh
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
                if (this.useSignalPath) {
                    // Signal path: read the computed signal and write to DOM synchronously.
                    // The effect() handles async signal-only changes, but onTranslationRefresh
                    // fires synchronously after use()/setFallbackLang() for immediate DOM updates.
                    this.writeTranslationToDOM();
                } else {
                    // Content-as-key path: imperative DOM walking
                    this.checkNodes(true);
                }
            });
    }

    ngAfterViewChecked() {
        if (!this.useSignalPath) {
            this.checkNodes();
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

    private checkNodes(forceUpdate = false): void {
        let nodes: NodeList = this.element.nativeElement.childNodes;
        // if the element is empty
        if (!nodes.length) {
            // we add the key as content
            this.setContent(this.element.nativeElement, this.key);
            nodes = this.element.nativeElement.childNodes;
        }

        nodes.forEach((n) => {
            const node = n as ExtendedNode;
            if (node.nodeType === 3) {
                // node type 3 is a text node
                let key!: string;
                if (forceUpdate) {
                    node.lastKey = null;
                }
                if (isDefinedAndNotNull(node.lookupKey)) {
                    key = node.lookupKey;
                } else if (this.key) {
                    key = this.key;
                } else {
                    const content = this.getContent(node);
                    const trimmedContent = content.trim();
                    if (trimmedContent.length) {
                        node.lookupKey = trimmedContent;
                        // we want to use the content as a key, not the translation value
                        if (content !== node.currentValue) {
                            key = trimmedContent;
                            // the content was changed from the user, we'll use it as a reference if needed
                            node.originalContent = content || node.originalContent;
                        } else if (node.originalContent) {
                            // the content seems ok, but the lang has changed
                            // the current content is the translation, not the key, use the last real content as key
                            key = node.originalContent.trim();
                        }
                    }
                }
                this.updateValue(key, node);
            }
        });
    }

    private updateValue(key: string, node: ExtendedNode): void {
        if (!key) {
            return;
        }

        if (node.lastKey === key && this.lastParams === this.currentParams) {
            return;
        }

        this.lastParams = this.currentParams;

        const res: StrictTranslation = this.translateService.instant(key, this.currentParams);

        if (res !== key || !node.lastKey) {
            node.lastKey = key;
        }
        if (!node.originalContent) {
            node.originalContent = this.getContent(node);
        }

        if (isString(res)) {
            node.currentValue = res;
        } else if (!isDefinedAndNotNull(res)) {
            node.currentValue = node.originalContent || key;
        } else {
            node.currentValue = JSON.stringify(res);
        }

        // we replace in the original content to preserve spaces that we might have trimmed
        this.setContent(
            node,
            this.key ? node.currentValue : node.originalContent.replace(key, node.currentValue),
        );
        this.changeDetectorRef.markForCheck();
    }

    private getContent(node: ExtendedNode): string {
        return (isDefinedAndNotNull(node.textContent) ? node.textContent : node.data) as string;
    }

    private setContent(node: ExtendedNode, content: string): void {
        if (isDefinedAndNotNull(node.textContent)) {
            node.textContent = content;
        } else {
            node.data = content;
        }
    }
}

import {
    AfterViewChecked,
    ChangeDetectorRef,
    Directive,
    ElementRef,
    inject,
    Input,
    OnDestroy,
} from "@angular/core";
import { Subscription, isObservable } from "rxjs";
import {
    FallbackLangChangeEvent,
    InterpolatableTranslation,
    LangChangeEvent,
    TranslateService,
    TranslationChangeEvent,
    StrictTranslation,
    InterpolationParameters,
} from "./translate.service";
import { equals, isDefinedAndNotNull, isString } from "./util";

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
export class TranslateDirective implements AfterViewChecked, OnDestroy {
    private translateService: TranslateService = inject(TranslateService);
    private element: ElementRef = inject(ElementRef);
    private _ref: ChangeDetectorRef = inject(ChangeDetectorRef);

    private key!: string;
    private lastParams?: InterpolationParameters;
    private currentParams?: InterpolationParameters;
    private readonly onLangChangeSub!: Subscription;
    private readonly onFallbackLangChangeSub!: Subscription;
    private readonly onTranslationChangeSub!: Subscription;

    @Input() set translate(key: string) {
        if (key) {
            this.key = key;
            this.checkNodes();
        }
    }

    @Input() set translateParams(params: InterpolationParameters) {
        if (!equals(this.currentParams, params)) {
            this.currentParams = params;
            this.checkNodes(true);
        }
    }

    constructor() {
        // subscribe to onTranslationChange event, in case the translations of the current lang change
        if (!this.onTranslationChangeSub) {
            this.onTranslationChangeSub = this.translateService.onTranslationChange.subscribe(
                (event: TranslationChangeEvent) => {
                    if (event.lang === this.translateService.currentLang) {
                        this.checkNodes(true, event.translations);
                    }
                },
            );
        }

        // subscribe to onLangChange event, in case the language changes
        if (!this.onLangChangeSub) {
            this.onLangChangeSub = this.translateService.onLangChange.subscribe(
                (event: LangChangeEvent) => {
                    this.checkNodes(true, event.translations);
                },
            );
        }

        // subscribe to onFallbackLangChange event, in case the fallback language changes
        if (!this.onFallbackLangChangeSub) {
            this.onFallbackLangChangeSub = this.translateService.onFallbackLangChange.subscribe(
                (event: FallbackLangChangeEvent) => {
                    void event;
                    this.checkNodes(true);
                },
            );
        }
    }

    ngAfterViewChecked() {
        this.checkNodes();
    }

    checkNodes(forceUpdate = false, translations?: InterpolatableTranslation) {
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
                this.updateValue(key, node, translations);
            }
        });
    }

    updateValue(key: string, node: ExtendedNode, translations?: InterpolatableTranslation) {
        if (key) {
            if (node.lastKey === key && this.lastParams === this.currentParams) {
                return;
            }

            this.lastParams = this.currentParams;

            const onTranslation = (res: StrictTranslation) => {
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
                    this.key
                        ? node.currentValue
                        : node.originalContent.replace(key, node.currentValue),
                );
                this._ref.markForCheck();
            };

            if (isDefinedAndNotNull(translations)) {
                const res = this.translateService.getParsedResult(key, this.currentParams);
                if (isObservable(res)) {
                    res.subscribe({ next: onTranslation });
                } else {
                    onTranslation(res);
                }
            } else {
                this.translateService.get(key, this.currentParams).subscribe(onTranslation);
            }
        }
    }

    getContent(node: ExtendedNode): string {
        return (isDefinedAndNotNull(node.textContent) ? node.textContent : node.data) as string;
    }

    setContent(node: ExtendedNode, content: string): void {
        if (isDefinedAndNotNull(node.textContent)) {
            node.textContent = content;
        } else {
            node.data = content;
        }
    }

    ngOnDestroy() {
        if (this.onLangChangeSub) {
            this.onLangChangeSub.unsubscribe();
        }

        if (this.onFallbackLangChangeSub) {
            this.onFallbackLangChangeSub.unsubscribe();
        }

        if (this.onTranslationChangeSub) {
            this.onTranslationChangeSub.unsubscribe();
        }
    }
}

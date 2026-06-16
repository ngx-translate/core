import { ChangeDetectorRef, ElementRef } from "@angular/core";
import { TranslateService } from "./translate.service";
import { InterpolationParameters, StrictTranslation } from "./translate.service.interface";
import { isDefinedAndNotNull, isString } from "./util";

interface ExtendedNode extends Text {
    originalContent: string;
    currentValue: string;
    lookupKey: string;
    lastKey: string | null;
    data: string;
}

/**
 * @deprecated Using element content as a translation key is deprecated and
 * will be removed in v19. Use `[translate]="'KEY'"` or `*translateBlock="let t"`
 * instead.
 */
export class ContentKeyHandler {
    private lastParams?: InterpolationParameters;

    constructor(
        private element: ElementRef,
        private changeDetectorRef: ChangeDetectorRef,
        // Pinned to the unconstrained `string` key-space (not the augmentable
        // `TranslateService` default, which narrows to the app's key union):
        // the content-as-key path scrapes arbitrary DOM text and calls
        // `instant()` with it, so the keys cannot be constrained to a union.
        private translateService: TranslateService<string>,
    ) {
        // Pass the offending element as a second `console.warn` arg so DevTools
        // can highlight it. Warn per element rather than once-per-page because
        // a single console line for an entire app of 50+ legacy elements is
        // not actionable; this matches the spirit of Angular's own
        // deprecation warnings (e.g. `provideHttpClient` migration warnings).
        console.warn(
            "@ngx-translate/core: Using element content as a translation key " +
                "is deprecated and will be removed in v19. " +
                'Use [translate]="\'KEY\'" or *translateBlock="let t" instead.',
            this.element?.nativeElement,
        );
    }

    checkNodes(currentParams: InterpolationParameters | undefined, forceUpdate = false): void {
        const nodes: NodeList = this.element.nativeElement.childNodes;
        if (!nodes.length) {
            return;
        }

        nodes.forEach((n) => {
            const node = n as ExtendedNode;
            if (node.nodeType === 3) {
                let key!: string;
                if (forceUpdate) {
                    node.lastKey = null;
                }
                if (isDefinedAndNotNull(node.lookupKey)) {
                    key = node.lookupKey;
                } else {
                    const content = this.getContent(node);
                    const trimmedContent = content.trim();
                    if (trimmedContent.length) {
                        node.lookupKey = trimmedContent;
                        if (content !== node.currentValue) {
                            key = trimmedContent;
                            node.originalContent = content || node.originalContent;
                        } else if (node.originalContent) {
                            key = node.originalContent.trim();
                        }
                    }
                }
                this.updateValue(key, node, currentParams);
            }
        });
    }

    private updateValue(
        key: string,
        node: ExtendedNode,
        currentParams: InterpolationParameters | undefined,
    ): void {
        if (!key) {
            return;
        }

        if (node.lastKey === key && this.lastParams === currentParams) {
            return;
        }

        this.lastParams = currentParams;

        const res: StrictTranslation = this.translateService.instant(key, currentParams);

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

        this.setContent(node, node.originalContent.replace(key, node.currentValue));
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

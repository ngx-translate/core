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
 * @deprecated Using element content as a translation key is deprecated.
 * Use [translate]="'KEY'" or *translateBlock="let t" instead.
 * This class will be removed in the next major version.
 */
export class ContentKeyHandler {
    private static warned = false;

    private lastParams?: InterpolationParameters;

    constructor(
        private element: ElementRef,
        private changeDetectorRef: ChangeDetectorRef,
        private translateService: TranslateService,
    ) {
        if (!ContentKeyHandler.warned) {
            ContentKeyHandler.warned = true;
            console.warn(
                "@ngx-translate: Using element content as a translation key is deprecated. " +
                    'Use [translate]="\'KEY\'" or *translateBlock="let t" instead. ' +
                    "This feature will be removed in the next major version.",
            );
        }
    }

    checkNodes(currentParams: InterpolationParameters | undefined, forceUpdate = false): void {
        let nodes: NodeList = this.element.nativeElement.childNodes;
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

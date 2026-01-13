import {
    AfterViewChecked,
    ChangeDetectorRef,
    DestroyRef,
    Directive,
    ElementRef,
    inject,
    Input,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { TranslateService } from "./translate.service";
import { equals, isDefinedAndNotNull, isString } from "./util";
import { InterpolationParameters, StrictTranslation } from "./translate.service.interface";

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

    private key!: string;
    private lastParams?: InterpolationParameters;
    private currentParams?: InterpolationParameters;

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
        // Subscribe to all translation-related change events
        this.translateService.onTranslationRefresh
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => this.checkNodes(true));
    }

    ngAfterViewChecked() {
        this.checkNodes();
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

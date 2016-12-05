import {Directive, ElementRef, AfterViewChecked, Input, OnDestroy} from "@angular/core";
import {Subscription} from "rxjs";
import {isDefined} from "./util";
import {TranslateService, LangChangeEvent} from "./translate.service";

@Directive({
    selector: '[translate]'
})
export class TranslateDirective implements AfterViewChecked, OnDestroy {
    key: string;
    lastParams: any;
    onLangChangeSub: Subscription;

    @Input() set translate(key: string) {
        if(key) {
            this.key = key;
            this.checkNodes();
        }
    }

    @Input() translateParams: any;

    constructor(private translateService: TranslateService, private element: ElementRef) {
        // subscribe to onLangChange event, in case the language changes
        if(!this.onLangChangeSub) {
            this.onLangChangeSub = this.translateService.onLangChange.subscribe((event: LangChangeEvent) => {
                this.checkNodes(true);
            });
        }
    }

    ngAfterViewChecked() {
        this.checkNodes();
    }

    checkNodes(langChanged = false) {
        let nodes: NodeList = this.element.nativeElement.childNodes;
        for(let i = 0; i < nodes.length; ++i) {
            let node: any = nodes[i];
            if(node.nodeType === 3) { // node type 3 is a text node
                let key: string;
                if(this.key) {
                    key = this.key;
                } else {
                    let content = node.textContent.trim();
                    if(content.length) {
                        // we want to use the content as a key, not the translation value
                        if(content !== node.currentValue) {
                            key = content;
                            // the content was changed from the user, we'll use it as a reference if needed
                            node.originalContent = node.textContent;
                        } else if(node.originalContent && langChanged) { // the content seems ok, but the lang has changed
                            // the current content is the translation, not the key, use the last real content as key
                            key = node.originalContent.trim();
                        }
                    }
                }
                this.updateValue(key, node);
            }
        }
    }

    updateValue(key: string, node: any) {
        if(key) {
            let interpolateParams: Object = this.translateParams;
            if(node.lastKey === key && this.lastParams === interpolateParams) {
                return;
            }

            this.lastParams = interpolateParams;
            this.translateService.get(key, interpolateParams).subscribe((res: string | any) => {
                if(res !== key) {
                    node.lastKey = key;
                }
                if(!node.originalContent) {
                    node.originalContent = node.textContent;
                }
                node.currentValue = isDefined(res) ? res : (node.originalContent || key);
                // we replace in the original content to preserve spaces that we might have trimmed
                node.textContent = this.key ? node.currentValue : node.originalContent.replace(key, node.currentValue);
            });
        }
    }

    ngOnDestroy() {
        if(this.onLangChangeSub) {
            this.onLangChangeSub.unsubscribe();
        }
    }
}

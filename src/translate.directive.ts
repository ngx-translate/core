import {Directive, ElementRef, AfterViewChecked, Input, OnDestroy} from '@angular/core';
import {Subscription} from 'rxjs';
import {isDefined} from './util';
import {TranslateService, LangChangeEvent} from './translate.service';
import {TranslationChangeEvent} from "./translate.service";
import {DefaultLangChangeEvent} from "./translate.service";

@Directive({
    selector: '[translate],[ng2-translate]'
})
export class TranslateDirective implements AfterViewChecked, OnDestroy {
    key: string;
    lastParams: any;
    onLangChangeSub: Subscription;
    onDefaultLangChangeSub: Subscription;
    onTranslationChangeSub: Subscription;

    @Input() set translate(key: string) {
        if(key) {
            this.key = key;
            this.checkNodes();
        }
    }

    @Input() translateParams: any;

    constructor(private translateService: TranslateService, private element: ElementRef) {
        // subscribe to onTranslationChange event, in case the translations of the current lang change
        if(!this.onTranslationChangeSub) {
            this.onTranslationChangeSub = this.translateService.onTranslationChange.subscribe((event: TranslationChangeEvent) => {
                if(event.lang === this.translateService.currentLang) {
                    this.checkNodes(true, event.translations);
                }
            });
        }

        // subscribe to onLangChange event, in case the language changes
        if(!this.onLangChangeSub) {
            this.onLangChangeSub = this.translateService.onLangChange.subscribe((event: LangChangeEvent) => {
                this.checkNodes(true, event.translations);
            });
        }

        // subscribe to onDefaultLangChange event, in case the default language changes
        if(!this.onDefaultLangChangeSub) {
            this.onDefaultLangChangeSub = this.translateService.onDefaultLangChange.subscribe((event: DefaultLangChangeEvent) => {
                this.checkNodes(true);
            });
        }
    }

    ngAfterViewChecked() {
        this.checkNodes();
    }

    checkNodes(forceUpdate = false, translations?: any) {
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
                        } else if(node.originalContent && forceUpdate) { // the content seems ok, but the lang has changed
                            node.lastKey = null;
                            // the current content is the translation, not the key, use the last real content as key
                            key = node.originalContent.trim();
                        }
                    }
                }
                this.updateValue(key, node, translations);
            }
        }
    }

    updateValue(key: string, node: any, translations: any) {
        if(key) {
            let interpolateParams: Object = this.translateParams;
            if(node.lastKey === key && this.lastParams === interpolateParams) {
                return;
            }

            this.lastParams = interpolateParams;

            let onTranslation = (res: string) => {
                if(res !== key) {
                    node.lastKey = key;
                }
                if(!node.originalContent) {
                    node.originalContent = node.textContent;
                }
                node.currentValue = isDefined(res) ? res : (node.originalContent || key);
                // we replace in the original content to preserve spaces that we might have trimmed
                node.textContent = this.key ? node.currentValue : node.originalContent.replace(key, node.currentValue);
            };

            if(isDefined(translations)) {
                let res = this.translateService.getParsedResult(translations, key, interpolateParams);
                if(typeof res.subscribe === "function") {
                    res.subscribe(onTranslation);
                } else {
                    onTranslation(res);
                }
            } else {
                this.translateService.get(key, interpolateParams).subscribe(onTranslation);
            }
        }
    }

    ngOnDestroy() {
        if(this.onLangChangeSub) {
            this.onLangChangeSub.unsubscribe();
        }

        if(this.onDefaultLangChangeSub) {
            this.onDefaultLangChangeSub.unsubscribe();
        }

        if(this.onTranslationChangeSub) {
            this.onTranslationChangeSub.unsubscribe();
        }
    }
}

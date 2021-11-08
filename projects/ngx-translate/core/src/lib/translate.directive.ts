import {AfterViewChecked, ChangeDetectorRef, Directive, ElementRef, Input, OnDestroy} from '@angular/core';
import {Subscription, isObservable} from 'rxjs';
import {DefaultLangChangeEvent, LangChangeEvent, TranslateService, TranslationChangeEvent} from './translate.service';
import {equals, isDefined} from './util';

@Directive({
  selector: '[translate],[ngx-translate]'
})
export class TranslateDirective implements AfterViewChecked, OnDestroy {
  key!: string;
  lastParams: any;
  currentParams: any;
  onLangChangeSub!: Subscription;
  onDefaultLangChangeSub!: Subscription;
  onTranslationChangeSub!: Subscription;

  @Input() set translate(key: string) {
    if (key) {
      this.key = key;
      this.checkNodes();
    }
  }

  @Input() set translateParams(params: any) {
    if (!equals(this.currentParams, params)) {
      this.currentParams = params;
      this.checkNodes(true);
    }
  }

  constructor(private translateService: TranslateService, private element: ElementRef, private _ref: ChangeDetectorRef) {
    // subscribe to onTranslationChange event, in case the translations of the current lang change
    if (!this.onTranslationChangeSub) {
      this.onTranslationChangeSub = this.translateService.onTranslationChange.subscribe((event: TranslationChangeEvent) => {
        if (event.lang === this.translateService.currentLang) {
          this.checkNodes(true, event.translations);
        }
      });
    }

    // subscribe to onLangChange event, in case the language changes
    if (!this.onLangChangeSub) {
      this.onLangChangeSub = this.translateService.onLangChange.subscribe((event: LangChangeEvent) => {
        this.checkNodes(true, event.translations);
      });
    }

    // subscribe to onDefaultLangChange event, in case the default language changes
    if (!this.onDefaultLangChangeSub) {
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
    // if the element is empty
    if (!nodes.length) {
      // we add the key as content
      this.setContent(this.element.nativeElement, this.key);
      nodes = this.element.nativeElement.childNodes;
    }
    for (let i = 0; i < nodes.length; ++i) {
      let node: any = nodes[i];
      if (node.nodeType === 3) { // node type 3 is a text node
        let key!: string;
        if (forceUpdate) {
          node.lastKey = null;
        }
        if(isDefined(node.lookupKey)) {
          key = node.lookupKey;
        } else if (this.key) {
          key = this.key;
        } else {
          let content = this.getContent(node);
          let trimmedContent = content.trim();
          if (trimmedContent.length) {
            node.lookupKey = trimmedContent;
            // we want to use the content as a key, not the translation value
            if (content !== node.currentValue) {
              key = trimmedContent;
              // the content was changed from the user, we'll use it as a reference if needed
              node.originalContent = content || node.originalContent;
            } else if (node.originalContent) { // the content seems ok, but the lang has changed
              // the current content is the translation, not the key, use the last real content as key
              key = node.originalContent.trim();
            } else if (content !== node.currentValue) {
              // we want to use the content as a key, not the translation value
              key = trimmedContent;
              // the content was changed from the user, we'll use it as a reference if needed
              node.originalContent = content || node.originalContent;
            }
          }
        }
        this.updateValue(key, node, translations);
      }
    }
  }

  updateValue(key: string, node: any, translations: any) {
    if (key) {
      if (node.lastKey === key && this.lastParams === this.currentParams) {
        return;
      }

      this.lastParams = this.currentParams;

      let onTranslation = (res: unknown) => {
        if (res !== key) {
          node.lastKey = key;
        }
        if (!node.originalContent) {
          node.originalContent = this.getContent(node);
        }
        node.currentValue = isDefined(res) ? res : (node.originalContent || key);
        // we replace in the original content to preserve spaces that we might have trimmed
        this.setContent(node, this.key ? node.currentValue : node.originalContent.replace(key, node.currentValue));
        this._ref.markForCheck();
      };

      if (isDefined(translations)) {
        let res = this.translateService.getParsedResult(translations, key, this.currentParams);
        if (isObservable(res)) {
          res.subscribe({next: onTranslation});
        } else {
          onTranslation(res);
        }
      } else {
        this.translateService.get(key, this.currentParams).subscribe(onTranslation);
      }
    }
  }

  getContent(node: any): string {
    return isDefined(node.textContent) ? node.textContent : node.data;
  }

  setContent(node: any, content: string): void {
    if (isDefined(node.textContent)) {
      node.textContent = content;
    } else {
      node.data = content;
    }
  }

  ngOnDestroy() {
    if (this.onLangChangeSub) {
      this.onLangChangeSub.unsubscribe();
    }

    if (this.onDefaultLangChangeSub) {
      this.onDefaultLangChangeSub.unsubscribe();
    }

    if (this.onTranslationChangeSub) {
      this.onTranslationChangeSub.unsubscribe();
    }
  }
}

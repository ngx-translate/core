import {AfterViewChecked, ChangeDetectorRef, Directive, ElementRef, Input, OnDestroy} from '@angular/core';
import {Subscription, isObservable} from 'rxjs';
import {
  DefaultLangChangeEvent,
  InterpolatableTranslation,
  LangChangeEvent,
  TranslateService,
  TranslationChangeEvent,
  Translation
} from "./translate.service";
import {equals, isDefined} from './util';
import {InterpolationParameters} from "./translate.parser";

interface ExtendedNode extends Text {
  originalContent: string;
  currentValue: Translation;
  lookupKey: string;
  lastKey: string|null;
  data: string;
}


@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: '[translate],[ngx-translate]'
})
export class TranslateDirective implements AfterViewChecked, OnDestroy {
  key!: string;
  lastParams: InterpolationParameters;
  currentParams: InterpolationParameters;
  onLangChangeSub!: Subscription;
  onDefaultLangChangeSub!: Subscription;
  onTranslationChangeSub!: Subscription;

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
        void event;
        this.checkNodes(true);
      });
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

    nodes.forEach(( n) => {
      const node= n as ExtendedNode;
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
          const content = this.getContent(node);
          const trimmedContent = content.trim();
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
            }
          }
        }
        this.updateValue(key, node, translations);
      }
    })
  }

  updateValue(key: string, node: ExtendedNode, translations?: InterpolatableTranslation) {
    if (key) {
      if (node.lastKey === key && this.lastParams === this.currentParams) {
        return;
      }

      this.lastParams = this.currentParams;

      const onTranslation = (res: Translation) => {
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
        const res = this.translateService.getParsedResult(translations as InterpolatableTranslation, key, this.currentParams);
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

  getContent(node: ExtendedNode): string {
    return (isDefined(node.textContent) ? node.textContent : node.data) as string;
  }

  setContent(node: ExtendedNode, content: string): void {
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

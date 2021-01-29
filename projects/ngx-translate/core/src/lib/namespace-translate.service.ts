import { Inject, Injectable, InjectionToken, Provider } from '@angular/core';
import { Observable } from 'rxjs';
import { TranslateService } from './translate.service';
import { isDefined } from './util';

export const TRANSLATION_NAMESPACE = new InjectionToken<string>('TRANSLATION_NAMESPACE');

/**
 * Wraps the `getParsedResult`, `get`, `getStreamOnTranslationChange`, `stream` and `instant` functions of the
 * TranslateService and prefixes the key given to those functions with the provided namespace.
 *
 * To access the functionality of this service in your html files use the `namespace-translate` pipe or
 * the `namespaceTranslate` directive
 *
 * Use the @see `NamespaceTranslateProvider.forChild` function to provide this service
 * to your component, service, pipe, module, ...
 */
@Injectable()
export class NamespaceTranslateService {

  constructor(private readonly translateService: TranslateService,
    @Inject(TRANSLATION_NAMESPACE) private readonly namespace: string) {
  }

  /**
   * Returns the parsed result of the translations
   */
  public getParsedResult(translations: any, key: any, interpolateParams?: Object): any {
    const namespacedKey = this.getNamespacedKey(key, true);
    return this.translateService.getParsedResult(translations, namespacedKey, interpolateParams);
  }

  /**
   * Gets the translated value of a key for the given namespace (or an array of keys)
   * @returns the translated key, or an object of translated keys
   */
  public get(key: string | Array<string>, interpolateParams?: Object): Observable<string | any> {
    const namespacedKey = this.getNamespacedKey(key);
    return this.translateService.get(namespacedKey, interpolateParams);
  }

  /**
   * Returns a stream of translated values of a key (or an array of keys) which updates
   * whenever the translation changes.
   * @returns A stream of the translated key, or an object of translated keys
   */
  public getStreamOnTranslationChange(key: string | Array<string>, interpolateParams?: Object): Observable<string | any> {
    const namespacedKey = this.getNamespacedKey(key);
    return this.translateService.getStreamOnTranslationChange(namespacedKey, interpolateParams);
  }

  /**
   * Returns a stream of translated values of a key for the given namespace (or an array of keys) which updates
   * whenever the language changes.
   * @returns A stream of the translated key, or an object of translated keys
   */
  public stream(key: string | Array<string>, interpolateParams?: Object): Observable<string | any> {
    const namespacedKey = this.getNamespacedKey(key);
    return this.translateService.stream(namespacedKey, interpolateParams);
  }

  /**
   * Returns a translation instantly from the internal state of loaded translation.
   * All rules regarding the current language, the preferred language of even fallback languages will be used except any promise handling.
   */
  public instant(key: string | Array<string>, interpolateParams?: Object): string | any {
    const namespacedKey = this.getNamespacedKey(key);
    return this.translateService.instant(namespacedKey, interpolateParams);
  }


  /**
   * Prefixes the given key(s) with the namespace and returns the new key(s)
   * @param key The key to prefix with the namespace.
   */
  private getNamespacedKey(key: string | Array<string>, skipKeyCheck?: boolean) {
    if (!skipKeyCheck && (!isDefined(key) || !key.length)) {
      throw new Error(`Parameter "key" required`);
    } else if (!isDefined(key) || !key.length) {
      // returns the given value unmodified
      return key;
    }

    if (key instanceof Array) {
      return key.map(k => this.namespace + "." + k);
    }
    return this.namespace + "." + key;
  }
}

// const namespaceTranslateFactory = (namespace: string) => (translate: TranslateService) => {
//   return new NamespaceTranslateService(translate, namespace);
// }

// // @dynamic
// export class NamespaceTranslateProvider {
//   /**
//    * provides the NamespaceTranslateService to your component, service, pipe, module, ...
//    * @param namespace The namespace that should be prefixed to keys given functions of the NamespaceTranslateService.
//    * It should not end with a "." because it inserted automatically between the namespace and the key!
//    */
//   static forChild(namespace: string): Provider {
//     return {
//       provide: NamespaceTranslateService,
//       useFactory: namespaceTranslateFactory(namespace),
//       deps: [TranslateService]
//     }
//   }
// }

import {Injectable} from "@angular/core";
import {InterpolatableTranslation} from "./translate.service";

export interface TranslationTransformerHandlerParams {
  /**
   * the key present in the translation files
   */
  key: string;

  /**
   * interpolable translation object or string returned from the store
   */
  rawTranslation: InterpolatableTranslation;
}

export abstract class TranslationTransformerHandler {
  /**
   * A function that transforms the interpolable translation retrieved from the translation file.
   *
   * @param params key and returned interpolable translation from the store
   * @returns a transformed interpolable translation
   *
   * It returns the interpolable translation transformed by the handler logic
   */
  abstract handle(params: TranslationTransformerHandlerParams): InterpolatableTranslation;
}

/**
 * This handler is just a placeholder that does nothing, in case you don't need a translation transformer handler at all
 */
@Injectable()
export class FakeTranslationTransformerHandler implements TranslationTransformerHandler {
  handle(params: TranslationTransformerHandlerParams): InterpolatableTranslation {
    return params.rawTranslation;
  }
}

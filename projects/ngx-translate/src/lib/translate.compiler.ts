import {Injectable} from "@angular/core";
import {InterpolateFunction} from "./translate.parser";

export abstract class TranslateCompiler {
  abstract compile(value: string, lang: string): string | InterpolateFunction;

  abstract compileTranslations(translations: any, lang: string): any;
}

/**
 * This compiler is just a placeholder that does nothing, in case you don't need a compiler at all
 */
@Injectable()
export class TranslateFakeCompiler extends TranslateCompiler {
  compile(value: string, lang: string): string | InterpolateFunction {
    void lang;
    return value;
  }

  compileTranslations(translations: any, lang: string): any {
    void lang;
    return translations;
  }
}

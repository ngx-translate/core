import { Injectable } from "@angular/core";
import { InterpolateFunction } from "./translate.parser";
import {
    InterpolatableTranslation,
    InterpolatableTranslationObject,
    TranslationObject,
} from "./translate.service";

export abstract class TranslateCompiler {
    abstract compile(value: string, lang: string): InterpolatableTranslation;

    abstract compileTranslations(
        translations: TranslationObject,
        lang: string,
    ): InterpolatableTranslationObject;
}

/**
 * This compiler is just a placeholder that does nothing; in case you don't need a compiler at all
 */
@Injectable()
export class TranslateFakeCompiler extends TranslateCompiler {
    compile(value: string, lang: string): string | InterpolateFunction {
        void lang;
        return value;
    }

    compileTranslations(
        translations: TranslationObject,
        lang: string,
    ): InterpolatableTranslationObject {
        void lang;
        return translations;
    }
}

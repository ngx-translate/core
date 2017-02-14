import {TranslateService} from "./translate.service";
import {Injectable} from "@angular/core";

export interface MissingTranslationHandlerParams {
    /**
     * the key that's missing in translation files
     *
     * @type {string}
     */
    key: string;

    /**
     * an instance of the service that was unable to translate the key.
     *
     * @type {TranslateService}
     */
    translateService: TranslateService;

    /**
     * interpolation params that were passed along for translating the given key.
     *
     * @type {Object}
     */
    interpolateParams?: Object;
}

export abstract class MissingTranslationHandler {
    /**
     * A function that handles missing translations.
     *
     * @abstract
     * @param {MissingTranslationHandlerParams} params context for resolving a missing translation
     * @returns {any} a value or an observable
     * If it returns a value, then this value is used.
     * If it return an observable, the value returned by this observable will be used (except if the method was "instant").
     * If it doesn't return then the key will be used as a value
     */
    abstract handle(params: MissingTranslationHandlerParams): any;
}

/**
 * This handler is just a placeholder that does nothing, in case you don't need a missing translation handler at all
 */
@Injectable()
export class FakeMissingTranslationHandler implements MissingTranslationHandler {
    handle(params: MissingTranslationHandlerParams): string {
        return params.key;
    }
}

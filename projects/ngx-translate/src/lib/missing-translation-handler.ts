import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { TranslateService } from "./translate.service";
import { StrictTranslation } from "./translate.service.interface";

export interface MissingTranslationHandlerParams {
    /**
     * the key that's missing in translation files
     */
    key: string;

    /**
     * an instance of the service that was unable to translate the key.
     *
     * Pinned to the unconstrained `string` key-space (not the augmentable
     * `TranslateService` default, which narrows to the app's key union): a
     * handler fires *because* a key was missing, so it must stay key-agnostic
     * and work regardless of which typed key-space the originating service uses.
     */
    translateService: TranslateService<string>;

    /**
     * interpolation params that were passed along for translating the given key.
     */
    interpolateParams?: object;
}

export abstract class MissingTranslationHandler {
    /**
     * A function that handles missing translations.
     *
     * @param params context for resolving a missing translation
     * @returns a value or an observable
     *
     * If it returns a value, then this value is used.
     * If it returns an observable, the value returned by this observable will be used (except if the method was "instant").
     * If it returns undefined, the key will be used as a value
     */
    abstract handle(
        params: MissingTranslationHandlerParams,
    ): StrictTranslation | Observable<StrictTranslation>;
}

/**
 * This handler is just a placeholder that does nothing; in case you don't need a missing translation handler at all
 */
@Injectable()
export class DefaultMissingTranslationHandler implements MissingTranslationHandler {
    handle(params: MissingTranslationHandlerParams): string {
        return params.key;
    }
}

import {Injectable} from "@angular/core";
import {isDefined} from "./util";

export abstract class TranslateParser {
    /**
     * Retrieves a translated value from the a set of translations and interpolates it with the parameters provided
     * "This is a {{ key }}" ==> "This is a value", with params = { key: "value" }
     * @param translations
     * @param key
     * @param params
     * @returns {string}
     */
    abstract parse(translations: any, key: any, params?: any): string
}

@Injectable()
export class TranslateDefaultParser extends TranslateParser {
    templateMatcher: RegExp = /{{\s?([^{}\s]*)\s?}}/g;

    public parse(translations: any, key: any, params?: any): string {
        return this.interpolate(TranslateDefaultParser.getValue(translations, key), params);
    }

    protected interpolate(expr: any, params?: any): string {
        if(typeof expr !== 'string' || !params) {
            return expr;
        }

        return expr.replace(this.templateMatcher, (substring: string, b: string) => {
            let r = TranslateDefaultParser.getValue(params, b);
            return isDefined(r) ? r : substring;
        });
    }

    protected static getValue(target: any, key: any): string {
        let keys = key.toString().split('.');
        key = '';
        do {
            key += keys.shift();
            if(isDefined(target) && isDefined(target[key]) && (typeof target[key] === 'object' || !keys.length)) {
                target = target[key];
                key = '';
            } else if(!keys.length) {
                target = undefined;
            } else {
                key += '.';
            }
        } while(keys.length);

        return target;
    }
}

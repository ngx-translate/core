export class Parser {
    templateMatcher: RegExp = /{{\s?([^{}\s]*)\s?}}/g;
    declensionMatcher: RegExp = /{{\s?@([^{}\s\(]*)\s?\(([^{}\)]*)\)\s?}}/g;

    /**
     * Interpolates a string to replace parameters
     * "This is a {{ key }}" ==> "This is a value", with params = { key: "value" }
     * or
     * "I have {{key}} cat{{@key(|s)}}" ==> "I have 2 cats", with params = { key: 2 }
     * and declensionRule = (value: any) => { return value === 1 ? 0 : 1; }
     * @param expr
     * @param params
     * @param declensionRule
     * @returns {string}
     */
    public interpolate(expr: string, params?: any, declensionRule?: Function): string {
        if (typeof expr !== 'string' || !params) {
            return expr;
        }
        
        return expr
            .replace(this.declensionMatcher, (substring: string, b:string, words:string) => {
                var wordsArr: Array<string> = words.split('|'),
                    r = this.getValue(params, b),
                    which = 0;

                if (typeof r === 'undefined') return substring;

                if (typeof declensionRule === 'function') {
                    which = declensionRule(r);
                }

                if (typeof which === 'number' && which > 0 && which < wordsArr.length) {
                    return wordsArr[which];
                }

                return wordsArr[0];
            })
            .replace(this.templateMatcher, (substring: string, b: string) => {
                var r = this.getValue(params, b);
                return typeof r !== 'undefined' ? r : substring;
            });
    }

    /**
     * Gets a value from an object by composed key
     * parser.getValue({ key1: { keyA: 'valueI' }}, 'key1.keyA') ==> 'valueI'
     * @param target
     * @param key
     * @returns {string}
     */
    public getValue(target: any, key: string): string {
        let keys = key.split('.');
        key = '';
        do {
            key += keys.shift();
            if (target!==undefined && target[key] !== undefined && (typeof target[key] === 'object' || !keys.length)) {
                target = target[key];
                key = '';
            } else if (!keys.length) {
                target = undefined;
            } else {
                key += '.';
            }
        } while (keys.length);
        
        return target;
    }

}

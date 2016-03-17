export class Parser {
    templateMatcher: RegExp = /{{\s?([^{}\s]*)\s?}}/g;


    /**
     * Interpolates a string to replace parameters
     * "This is a {{ key }}" ==> "This is a value", with params = { key: "value" }
     * @param expr
     * @param params
     * @returns {string}
     */
    public interpolate(expr: string, params?: any): string {
        if (typeof expr !== 'string' || !params) {
            return expr;
        }
        
        return expr.replace(this.templateMatcher, (substring: string, b: string) => {
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
            if (target[key] && (typeof target[key] === 'object' || !keys.length)) {
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

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
        if(!params) {
            return expr;
        } else {
            params = this.flattenObject(params);
        }

        return expr.replace(this.templateMatcher, function (substring: string, b: string): string {
            var r = params[b];
            return typeof r !== 'undefined' ? r : substring;
        });
    }

    /**
     * Flattens an object
     * { key1: { keyA: 'valueI' }} ==> { 'key1.keyA': 'valueI' }
     * @param target
     * @returns {Object}
     */
    public flattenObject(target: Object): Object {
        var delimiter = '.';
        var maxDepth: number;
        var currentDepth = 1;
        var output: any = {};

        function step(object: any, prev?: string) {
            Object.keys(object).forEach(function (key) {
                var value = object[key];
                var newKey = prev ? prev + delimiter + key : key;

                maxDepth = currentDepth + 1;

                if(!Array.isArray(value) && typeof value === 'object' && Object.keys(value).length && currentDepth < maxDepth) {
                    ++currentDepth;
                    return step(value, newKey);
                }

                output[newKey] = value;
            });
        }

        step(target);

        return output;
    }

}

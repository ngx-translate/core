"use strict";
var Parser = (function () {
    function Parser() {
        this.templateMatcher = /{{\s?([^{}\s]*)\s?}}/g;
    }
    /**
     * Interpolates a string to replace parameters
     * "This is a {{ key }}" ==> "This is a value", with params = { key: "value" }
     * @param expr
     * @param params
     * @returns {string}
     */
    Parser.prototype.interpolate = function (expr, params) {
        var _this = this;
        if (typeof expr !== 'string' || !params) {
            return expr;
        }
        return expr.replace(this.templateMatcher, function (substring, b) {
            var r = _this.getValue(params, b);
            return typeof r !== 'undefined' ? r : substring;
        });
    };
    /**
     * Gets a value from an object by composed key
     * parser.getValue({ key1: { keyA: 'valueI' }}, 'key1.keyA') ==> 'valueI'
     * @param target
     * @param key
     * @returns {string}
     */
    Parser.prototype.getValue = function (target, key) {
        var keys = key.split('.');
        key = '';
        do {
            key += keys.shift();
            if (target[key] !== undefined && (typeof target[key] === 'object' || !keys.length)) {
                target = target[key];
                key = '';
            }
            else if (!keys.length) {
                target = undefined;
            }
            else {
                key += '.';
            }
        } while (keys.length);
        return target;
    };
    return Parser;
}());
exports.Parser = Parser;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNsYXRlLnBhcnNlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInRyYW5zbGF0ZS5wYXJzZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0lBQUE7UUFDSSxvQkFBZSxHQUFXLHVCQUF1QixDQUFDO0lBOEN0RCxDQUFDO0lBM0NHOzs7Ozs7T0FNRztJQUNJLDRCQUFXLEdBQWxCLFVBQW1CLElBQVksRUFBRSxNQUFZO1FBQTdDLGlCQVNDO1FBUkcsRUFBRSxDQUFDLENBQUMsT0FBTyxJQUFJLEtBQUssUUFBUSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztZQUN0QyxNQUFNLENBQUMsSUFBSSxDQUFDO1FBQ2hCLENBQUM7UUFFRCxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFLFVBQUMsU0FBaUIsRUFBRSxDQUFTO1lBQ25FLElBQUksQ0FBQyxHQUFHLEtBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2pDLE1BQU0sQ0FBQyxPQUFPLENBQUMsS0FBSyxXQUFXLEdBQUcsQ0FBQyxHQUFHLFNBQVMsQ0FBQztRQUNwRCxDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7SUFFRDs7Ozs7O09BTUc7SUFDSSx5QkFBUSxHQUFmLFVBQWdCLE1BQVcsRUFBRSxHQUFXO1FBQ3BDLElBQUksSUFBSSxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDMUIsR0FBRyxHQUFHLEVBQUUsQ0FBQztRQUNULEdBQUcsQ0FBQztZQUNBLEdBQUcsSUFBSSxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDcEIsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxLQUFLLFNBQVMsSUFBSSxDQUFDLE9BQU8sTUFBTSxDQUFDLEdBQUcsQ0FBQyxLQUFLLFFBQVEsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2pGLE1BQU0sR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ3JCLEdBQUcsR0FBRyxFQUFFLENBQUM7WUFDYixDQUFDO1lBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7Z0JBQ3RCLE1BQU0sR0FBRyxTQUFTLENBQUM7WUFDdkIsQ0FBQztZQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNKLEdBQUcsSUFBSSxHQUFHLENBQUM7WUFDZixDQUFDO1FBQ0wsQ0FBQyxRQUFRLElBQUksQ0FBQyxNQUFNLEVBQUU7UUFFdEIsTUFBTSxDQUFDLE1BQU0sQ0FBQztJQUNsQixDQUFDO0lBRUwsYUFBQztBQUFELENBQUMsQUEvQ0QsSUErQ0M7QUEvQ1ksY0FBTSxTQStDbEIsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBjbGFzcyBQYXJzZXIge1xuICAgIHRlbXBsYXRlTWF0Y2hlcjogUmVnRXhwID0gL3t7XFxzPyhbXnt9XFxzXSopXFxzP319L2c7XG5cblxuICAgIC8qKlxuICAgICAqIEludGVycG9sYXRlcyBhIHN0cmluZyB0byByZXBsYWNlIHBhcmFtZXRlcnNcbiAgICAgKiBcIlRoaXMgaXMgYSB7eyBrZXkgfX1cIiA9PT4gXCJUaGlzIGlzIGEgdmFsdWVcIiwgd2l0aCBwYXJhbXMgPSB7IGtleTogXCJ2YWx1ZVwiIH1cbiAgICAgKiBAcGFyYW0gZXhwclxuICAgICAqIEBwYXJhbSBwYXJhbXNcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfVxuICAgICAqL1xuICAgIHB1YmxpYyBpbnRlcnBvbGF0ZShleHByOiBzdHJpbmcsIHBhcmFtcz86IGFueSk6IHN0cmluZyB7XG4gICAgICAgIGlmICh0eXBlb2YgZXhwciAhPT0gJ3N0cmluZycgfHwgIXBhcmFtcykge1xuICAgICAgICAgICAgcmV0dXJuIGV4cHI7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBleHByLnJlcGxhY2UodGhpcy50ZW1wbGF0ZU1hdGNoZXIsIChzdWJzdHJpbmc6IHN0cmluZywgYjogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICB2YXIgciA9IHRoaXMuZ2V0VmFsdWUocGFyYW1zLCBiKTtcbiAgICAgICAgICAgIHJldHVybiB0eXBlb2YgciAhPT0gJ3VuZGVmaW5lZCcgPyByIDogc3Vic3RyaW5nO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXRzIGEgdmFsdWUgZnJvbSBhbiBvYmplY3QgYnkgY29tcG9zZWQga2V5XG4gICAgICogcGFyc2VyLmdldFZhbHVlKHsga2V5MTogeyBrZXlBOiAndmFsdWVJJyB9fSwgJ2tleTEua2V5QScpID09PiAndmFsdWVJJ1xuICAgICAqIEBwYXJhbSB0YXJnZXRcbiAgICAgKiBAcGFyYW0ga2V5XG4gICAgICogQHJldHVybnMge3N0cmluZ31cbiAgICAgKi9cbiAgICBwdWJsaWMgZ2V0VmFsdWUodGFyZ2V0OiBhbnksIGtleTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICAgICAgbGV0IGtleXMgPSBrZXkuc3BsaXQoJy4nKTtcbiAgICAgICAga2V5ID0gJyc7XG4gICAgICAgIGRvIHtcbiAgICAgICAgICAgIGtleSArPSBrZXlzLnNoaWZ0KCk7XG4gICAgICAgICAgICBpZiAodGFyZ2V0W2tleV0gIT09IHVuZGVmaW5lZCAmJiAodHlwZW9mIHRhcmdldFtrZXldID09PSAnb2JqZWN0JyB8fCAha2V5cy5sZW5ndGgpKSB7XG4gICAgICAgICAgICAgICAgdGFyZ2V0ID0gdGFyZ2V0W2tleV07XG4gICAgICAgICAgICAgICAga2V5ID0gJyc7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKCFrZXlzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHRhcmdldCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAga2V5ICs9ICcuJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSB3aGlsZSAoa2V5cy5sZW5ndGgpO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRhcmdldDtcbiAgICB9XG5cbn1cbiJdfQ==
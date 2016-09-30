!function(e){function r(e,r,t){e in l||(l[e]={name:e,declarative:!0,deps:r,declare:t,normalizedDeps:r})}function t(e){return p[e]||(p[e]={name:e,dependencies:[],exports:{},importers:[]})}function n(r){if(!r.module){var o=r.module=t(r.name),a=r.module.exports,u=r.declare.call(e,function(e,r){if(o.locked=!0,"object"==typeof e)for(var t in e)a[t]=e[t];else a[e]=r;for(var n=0,u=o.importers.length;u>n;n++){var i=o.importers[n];if(!i.locked)for(var l=0;l<i.dependencies.length;++l)i.dependencies[l]===o&&i.setters[l](a)}return o.locked=!1,r},r.name);o.setters=u.setters,o.execute=u.execute;for(var s=0,d=r.normalizedDeps.length;d>s;s++){var f,c=r.normalizedDeps[s],v=l[c],m=p[c];m?f=m.exports:v&&!v.declarative?f=v.esModule:v?(n(v),m=v.module,f=m.exports):f=i(c),m&&m.importers?(m.importers.push(o),o.dependencies.push(m)):o.dependencies.push(null),o.setters[s]&&o.setters[s](f)}}}function o(r){var t={};if(("object"==typeof r||"function"==typeof r)&&r!==e)if(d)for(var n in r)"default"!==n&&a(t,r,n);else{var o=r&&r.hasOwnProperty;for(var n in r)"default"===n||o&&!r.hasOwnProperty(n)||(t[n]=r[n])}return t["default"]=r,c(t,"__useDefault",{value:!0}),t}function a(e,r,t){try{var n;(n=Object.getOwnPropertyDescriptor(r,t))&&c(e,t,n)}catch(o){return e[t]=r[t],!1}}function u(r,t){var n=l[r];if(n&&!n.evaluated&&n.declarative){t.push(r);for(var o=0,a=n.normalizedDeps.length;a>o;o++){var d=n.normalizedDeps[o];-1==s.call(t,d)&&(l[d]?u(d,t):i(d))}n.evaluated||(n.evaluated=!0,n.module.execute.call(e))}}function i(e){if(m[e])return m[e];if("@node/"==e.substr(0,6))return m[e]=o(v(e.substr(6)));var r=l[e];if(!r)throw"Module "+e+" not present.";return n(l[e]),u(e,[]),l[e]=void 0,r.declarative&&c(r.module.exports,"__esModule",{value:!0}),m[e]=r.declarative?r.module.exports:r.esModule}var l={},s=Array.prototype.indexOf||function(e){for(var r=0,t=this.length;t>r;r++)if(this[r]===e)return r;return-1},d=!0;try{Object.getOwnPropertyDescriptor({a:0},"a")}catch(f){d=!1}var c;!function(){try{Object.defineProperty({},"a",{})&&(c=Object.defineProperty)}catch(e){c=function(e,r,t){try{e[r]=t.value||t.get.call(e)}catch(n){}}}}();var p={},v="undefined"!=typeof System&&System._nodeRequire||"undefined"!=typeof require&&require.resolve&&"undefined"!=typeof process&&require,m={"@empty":{}};return function(e,t,n,a){return function(u){u(function(u){for(var l=0;l<t.length;l++)(function(e,r){r&&r.__esModule?m[e]=r:m[e]=o(r)})(t[l],arguments[l]);a({register:r});var s=i(e[0]);if(e.length>1)for(var l=1;l<e.length;l++)i(e[l]);return n?s["default"]:s})}}}("undefined"!=typeof self?self:global)

(["1"], ["3","c","5","6","8","9","7","a"], false, function($__System) {
var require = this.require, exports = this.exports, module = this.module;
$__System.register("2", ["3", "4"], function(exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var core_1, translate_service_1;
    var TranslatePipe;
    return {
        setters:[
            function (core_1_1) {
                core_1 = core_1_1;
            },
            function (translate_service_1_1) {
                translate_service_1 = translate_service_1_1;
            }],
        execute: function() {
            exports_1("TranslatePipe", TranslatePipe = (function () {
                function TranslatePipe(translate, _ref) {
                    this.translate = translate;
                    this._ref = _ref;
                    this.value = '';
                }
                /* tslint:disable */
                /**
                 * @name equals
                 *
                 * @description
                 * Determines if two objects or two values are equivalent.
                 *
                 * Two objects or values are considered equivalent if at least one of the following is true:
                 *
                 * * Both objects or values pass `===` comparison.
                 * * Both objects or values are of the same type and all of their properties are equal by
                 *   comparing them with `equals`.
                 *
                 * @param {*} o1 Object or value to compare.
                 * @param {*} o2 Object or value to compare.
                 * @returns {boolean} True if arguments are equal.
                 */
                TranslatePipe.prototype.equals = function (o1, o2) {
                    if (o1 === o2)
                        return true;
                    if (o1 === null || o2 === null)
                        return false;
                    if (o1 !== o1 && o2 !== o2)
                        return true; // NaN === NaN
                    var t1 = typeof o1, t2 = typeof o2, length, key, keySet;
                    if (t1 == t2 && t1 == 'object') {
                        if (Array.isArray(o1)) {
                            if (!Array.isArray(o2))
                                return false;
                            if ((length = o1.length) == o2.length) {
                                for (key = 0; key < length; key++) {
                                    if (!this.equals(o1[key], o2[key]))
                                        return false;
                                }
                                return true;
                            }
                        }
                        else {
                            if (Array.isArray(o2)) {
                                return false;
                            }
                            keySet = Object.create(null);
                            for (key in o1) {
                                if (!this.equals(o1[key], o2[key])) {
                                    return false;
                                }
                                keySet[key] = true;
                            }
                            for (key in o2) {
                                if (!(key in keySet) && typeof o2[key] !== 'undefined') {
                                    return false;
                                }
                            }
                            return true;
                        }
                    }
                    return false;
                };
                /* tslint:enable */
                TranslatePipe.prototype.updateValue = function (key, interpolateParams) {
                    var _this = this;
                    this.translate.get(key, interpolateParams).subscribe(function (res) {
                        _this.value = res ? res : key;
                        _this.lastKey = key;
                        _this._ref.markForCheck();
                    });
                };
                TranslatePipe.prototype.transform = function (query) {
                    var _this = this;
                    var args = [];
                    for (var _i = 1; _i < arguments.length; _i++) {
                        args[_i - 1] = arguments[_i];
                    }
                    if (!query || query.length === 0) {
                        return query;
                    }
                    // if we ask another time for the same key, return the last value
                    if (this.equals(query, this.lastKey) && this.equals(args, this.lastParams)) {
                        return this.value;
                    }
                    var interpolateParams;
                    if (args.length && args[0] !== null) {
                        if (typeof args[0] === 'string' && args[0].length) {
                            // we accept objects written in the template such as {n:1},
                            // which is why we might need to change it to real JSON objects such as {"n":1}
                            try {
                                interpolateParams = JSON.parse(args[0].replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2": '));
                            }
                            catch (e) {
                                throw new SyntaxError("Wrong parameter in TranslatePipe. Expected a valid Object, received: " + args[0]);
                            }
                        }
                        else if (typeof args[0] === 'object' && !Array.isArray(args[0])) {
                            interpolateParams = args[0];
                        }
                    }
                    // store the query, in case it changes
                    this.lastKey = query;
                    // store the params, in case they change
                    this.lastParams = args;
                    // set the value
                    this.updateValue(query, interpolateParams);
                    // if there is a subscription to onLangChange, clean it
                    this._dispose();
                    // subscribe to onTranslationChange event, in case the translations change
                    if (!this.onTranslationChange) {
                        this.onTranslationChange = this.translate.onTranslationChange.subscribe(function (event) {
                            if (_this.lastKey && event.lang === _this.translate.currentLang) {
                                _this.lastKey = null;
                                _this.updateValue(query, interpolateParams);
                            }
                        });
                    }
                    // subscribe to onLangChange event, in case the language changes
                    if (!this.onLangChange) {
                        this.onLangChange = this.translate.onLangChange.subscribe(function (event) {
                            if (_this.lastKey) {
                                _this.lastKey = null; // we want to make sure it doesn't return the same value until it's been updated
                                _this.updateValue(query, interpolateParams);
                            }
                        });
                    }
                    return this.value;
                };
                /**
                 * Clean any existing subscription to change events
                 * @private
                 */
                TranslatePipe.prototype._dispose = function () {
                    if (typeof this.onTranslationChange !== 'undefined') {
                        this.onTranslationChange.unsubscribe();
                        this.onTranslationChange = undefined;
                    }
                    if (typeof this.onLangChange !== 'undefined') {
                        this.onLangChange.unsubscribe();
                        this.onLangChange = undefined;
                    }
                };
                TranslatePipe.prototype.ngOnDestroy = function () {
                    this._dispose();
                };
                TranslatePipe.decorators = [
                    { type: core_1.Injectable },
                    { type: core_1.Pipe, args: [{
                                name: 'translate',
                                pure: false // required to update the value when the promise is resolved
                            },] },
                ];
                /** @nocollapse */
                TranslatePipe.ctorParameters = [
                    { type: translate_service_1.TranslateService, },
                    { type: core_1.ChangeDetectorRef, },
                ];
                return TranslatePipe;
            }()));
        }
    }
});

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNsYXRlLnBpcGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ0cmFuc2xhdGUucGlwZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7O1FBRVcsYUFBYTs7Ozs7Ozs7OztZQUFiLDJCQUFBLGFBQWEsR0FBRyxDQUFDO2dCQUN4Qix1QkFBdUIsU0FBUyxFQUFFLElBQUk7b0JBQ2xDLElBQUksQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDO29CQUMzQixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztvQkFDakIsSUFBSSxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUM7Z0JBQ3BCLENBQUM7Z0JBQ0Qsb0JBQW9CO2dCQUNwQjs7Ozs7Ozs7Ozs7Ozs7O21CQWVHO2dCQUNILGFBQWEsQ0FBQyxTQUFTLENBQUMsTUFBTSxHQUFHLFVBQVUsRUFBRSxFQUFFLEVBQUU7b0JBQzdDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUM7d0JBQ1YsTUFBTSxDQUFDLElBQUksQ0FBQztvQkFDaEIsRUFBRSxDQUFDLENBQUMsRUFBRSxLQUFLLElBQUksSUFBSSxFQUFFLEtBQUssSUFBSSxDQUFDO3dCQUMzQixNQUFNLENBQUMsS0FBSyxDQUFDO29CQUNqQixFQUFFLENBQUMsQ0FBQyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLENBQUM7d0JBQ3ZCLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxjQUFjO29CQUMvQixJQUFJLEVBQUUsR0FBRyxPQUFPLEVBQUUsRUFBRSxFQUFFLEdBQUcsT0FBTyxFQUFFLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxNQUFNLENBQUM7b0JBQ3hELEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLFFBQVEsQ0FBQyxDQUFDLENBQUM7d0JBQzdCLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDOzRCQUNw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
$__System.register("4", ["3", "5", "6", "7", "8", "9", "a", "b"], function(exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var core_1, Observable_1, translate_parser_1;
    var MissingTranslationHandler, TranslateLoader, TranslateStaticLoader, TranslateService;
    return {
        setters:[
            function (core_1_1) {
                core_1 = core_1_1;
            },
            function (Observable_1_1) {
                Observable_1 = Observable_1_1;
            },
            function (_1) {},
            function (_2) {},
            function (_3) {},
            function (_4) {},
            function (_5) {},
            function (translate_parser_1_1) {
                translate_parser_1 = translate_parser_1_1;
            }],
        execute: function() {
            exports_1("MissingTranslationHandler", MissingTranslationHandler = (function () {
                function MissingTranslationHandler() {
                }
                return MissingTranslationHandler;
            }()));
            exports_1("TranslateLoader", TranslateLoader = (function () {
                function TranslateLoader() {
                }
                return TranslateLoader;
            }()));
            exports_1("TranslateStaticLoader", TranslateStaticLoader = (function () {
                function TranslateStaticLoader(http, prefix, suffix) {
                    if (prefix === void 0) {
                        prefix = "i18n";
                    }
                    if (suffix === void 0) {
                        suffix = ".json";
                    }
                    this.http = http;
                    this.prefix = prefix;
                    this.suffix = suffix;
                }
                /**
                 * Gets the translations from the server
                 * @param lang
                 * @returns {any}
                 */
                TranslateStaticLoader.prototype.getTranslation = function (lang) {
                    return this.http.get(this.prefix + "/" + lang + this.suffix)
                        .map(function (res) { return res.json(); });
                };
                return TranslateStaticLoader;
            }()));
            exports_1("TranslateService", TranslateService = (function () {
                /**
                 *
                 * @param http The Angular 2 http provider
                 * @param currentLoader An instance of the loader currently used
                 * @param missingTranslationHandler A handler for missing translations.
                 */
                function TranslateService(currentLoader, missingTranslationHandler) {
                    this.currentLoader = currentLoader;
                    this.missingTranslationHandler = missingTranslationHandler;
                    /**
                     * The lang currently used
                     */
                    this.currentLang = this.defaultLang;
                    /**
                     * An EventEmitter to listen to translation change events
                     * onTranslationChange.subscribe((params: TranslationChangeEvent) => {
                     *     // do something
                     * });
                     * @type {ng.EventEmitter<TranslationChangeEvent>}
                     */
                    this.onTranslationChange = new core_1.EventEmitter();
                    /**
                     * An EventEmitter to listen to lang change events
                     * onLangChange.subscribe((params: LangChangeEvent) => {
                     *     // do something
                     * });
                     * @type {ng.EventEmitter<LangChangeEvent>}
                     */
                    this.onLangChange = new core_1.EventEmitter();
                    this.translations = {};
                    this.langs = [];
                    this.parser = new translate_parser_1.Parser();
                }
                /**
                 * Sets the default language to use as a fallback
                 * @param lang
                 */
                TranslateService.prototype.setDefaultLang = function (lang) {
                    this.defaultLang = lang;
                };
                /**
                 * Changes the lang currently used
                 * @param lang
                 * @returns {Observable<*>}
                 */
                TranslateService.prototype.use = function (lang) {
                    var _this = this;
                    var pending;
                    // check if this language is available
                    if (typeof this.translations[lang] === "undefined") {
                        // not available, ask for it
                        pending = this.getTranslation(lang);
                    }
                    if (typeof pending !== "undefined") {
                        // on init set the currentLang immediately
                        if (!this.currentLang) {
                            this.currentLang = lang;
                        }
                        pending.subscribe(function (res) {
                            _this.changeLang(lang);
                        });
                        return pending;
                    }
                    else {
                        this.changeLang(lang);
                        return Observable_1.Observable.of(this.translations[lang]);
                    }
                };
                /**
                 * Gets an object of translations for a given language with the current loader
                 * @param lang
                 * @returns {Observable<*>}
                 */
                TranslateService.prototype.getTranslation = function (lang) {
                    var _this = this;
                    this.pending = this.currentLoader.getTranslation(lang).share();
                    this.pending.subscribe(function (res) {
                        _this.translations[lang] = res;
                        _this.updateLangs();
                    }, function (err) {
                        throw err;
                    }, function () {
                        _this.pending = undefined;
                    });
                    return this.pending;
                };
                /**
                 * Manually sets an object of translations for a given language
                 * @param lang
                 * @param translations
                 * @param shouldMerge
                 */
                TranslateService.prototype.setTranslation = function (lang, translations, shouldMerge) {
                    if (shouldMerge === void 0) {
                        shouldMerge = false;
                    }
                    if (shouldMerge && this.translations[lang]) {
                        Object.assign(this.translations[lang], translations);
                        this.onTranslationChange.emit({ translations: translations, lang: lang });
                    }
                    else {
                        this.translations[lang] = translations;
                    }
                    this.updateLangs();
                };
                /**
                 * Returns an array of currently available langs
                 * @returns {any}
                 */
                TranslateService.prototype.getLangs = function () {
                    return this.langs;
                };
                /**
                 * @param langs
                 * Add available langs
                 */
                TranslateService.prototype.addLangs = function (langs) {
                    var _this = this;
                    langs.forEach(function (lang) {
                        if (_this.langs.indexOf(lang) === -1) {
                            _this.langs.push(lang);
                        }
                    });
                };
                /**
                 * Update the list of available langs
                 */
                TranslateService.prototype.updateLangs = function () {
                    this.addLangs(Object.keys(this.translations));
                };
                /**
                 * Returns the parsed result of the translations
                 * @param translations
                 * @param key
                 * @param interpolateParams
                 * @returns {any}
                 */
                TranslateService.prototype.getParsedResult = function (translations, key, interpolateParams) {
                    var res;
                    if (key instanceof Array) {
                        var result = {}, observables = false;
                        for (var _i = 0, key_1 = key; _i < key_1.length; _i++) {
                            var k = key_1[_i];
                            result[k] = this.getParsedResult(translations, k, interpolateParams);
                            if (typeof result[k].subscribe === "function") {
                                observables = true;
                            }
                        }
                        if (observables) {
                            var mergedObs = void 0;
                            for (var _a = 0, key_2 = key; _a < key_2.length; _a++) {
                                var k = key_2[_a];
                                var obs = typeof result[k].subscribe === "function" ? result[k] : Observable_1.Observable.of(result[k]);
                                if (typeof mergedObs === "undefined") {
                                    mergedObs = obs;
                                }
                                else {
                                    mergedObs = mergedObs.merge(obs);
                                }
                            }
                            return mergedObs.toArray().map(function (arr) {
                                var obj = {};
                                arr.forEach(function (value, index) {
                                    obj[key[index]] = value;
                                });
                                return obj;
                            });
                        }
                        return result;
                    }
                    if (translations) {
                        res = this.parser.interpolate(this.parser.getValue(translations, key), interpolateParams);
                    }
                    if (typeof res === "undefined" && this.defaultLang && this.defaultLang !== this.currentLang) {
                        res = this.parser.interpolate(this.parser.getValue(this.translations[this.defaultLang], key), interpolateParams);
                    }
                    if (!res && this.missingTranslationHandler) {
                        res = this.missingTranslationHandler.handle(key);
                    }
                    return res || key;
                };
                /**
                 * Gets the translated value of a key (or an array of keys)
                 * @param key
                 * @param interpolateParams
                 * @returns {any} the translated key, or an object of translated keys
                 */
                TranslateService.prototype.get = function (key, interpolateParams) {
                    var _this = this;
                    if (!key) {
                        throw new Error("Parameter \"key\" required");
                    }
                    // check if we are loading a new translation to use
                    if (this.pending) {
                        return Observable_1.Observable.create(function (observer) {
                            var onComplete = function (res) {
                                observer.next(res);
                                observer.complete();
                            };
                            _this.pending.subscribe(function (res) {
                                res = _this.getParsedResult(res, key, interpolateParams);
                                if (typeof res.subscribe === "function") {
                                    res.subscribe(onComplete);
                                }
                                else {
                                    onComplete(res);
                                }
                            });
                        });
                    }
                    else {
                        var res = this.getParsedResult(this.translations[this.currentLang], key, interpolateParams);
                        if (typeof res.subscribe === "function") {
                            return res;
                        }
                        else {
                            return Observable_1.Observable.of(res);
                        }
                    }
                };
                /**
                 * Returns a translation instantly from the internal state of loaded translation.
                 * All rules regarding the current language, the preferred language of even fallback languages will be used except any promise handling.
                 * @param key
                 * @param interpolateParams
                 * @returns {string}
                 */
                TranslateService.prototype.instant = function (key, interpolateParams) {
                    if (!key) {
                        throw new Error("Parameter \"key\" required");
                    }
                    var res = this.getParsedResult(this.translations[this.currentLang], key, interpolateParams);
                    if (typeof res.subscribe !== "undefined") {
                        if (key instanceof Array) {
                            var obj_1 = {};
                            key.forEach(function (value, index) {
                                obj_1[key[index]] = key[index];
                            });
                            return obj_1;
                        }
                        return key;
                    }
                    else {
                        return res;
                    }
                };
                /**
                 * Sets the translated value of a key
                 * @param key
                 * @param value
                 * @param lang
                 */
                TranslateService.prototype.set = function (key, value, lang) {
                    if (lang === void 0) {
                        lang = this.currentLang;
                    }
                    this.translations[lang][key] = value;
                    this.updateLangs();
                    this.onTranslationChange.emit({ translations: (_a = {}, _a[key] = value, _a), lang: lang });
                    var _a;
                };
                /**
                 * Changes the current lang
                 * @param lang
                 */
                TranslateService.prototype.changeLang = function (lang) {
                    this.currentLang = lang;
                    this.onLangChange.emit({ lang: lang, translations: this.translations[lang] });
                };
                /**
                 * Allows to reload the lang file from the file
                 * @param lang
                 * @returns {Observable<any>}
                 */
                TranslateService.prototype.reloadLang = function (lang) {
                    this.resetLang(lang);
                    return this.getTranslation(lang);
                };
                /**
                 * Deletes inner translation
                 * @param lang
                 */
                TranslateService.prototype.resetLang = function (lang) {
                    this.translations[lang] = undefined;
                };
                TranslateService.prototype.getBrowserLang = function () {
                    if (typeof window === 'undefined' || typeof window.navigator === 'undefined') {
                        return undefined;
                    }
                    var browserLang = window.navigator.languages ? window.navigator.languages[0] : null;
                    browserLang = browserLang || window.navigator.language || window.navigator.browserLanguage || window.navigator.userLanguage;
                    if (browserLang.indexOf('-') !== -1) {
                        browserLang = browserLang.split('-')[0];
                    }
                    if (browserLang.indexOf('_') !== -1) {
                        browserLang = browserLang.split('_')[0];
                    }
                    return browserLang;
                };
                TranslateService.decorators = [
                    { type: core_1.Injectable },
                ];
                /** @nocollapse */
                TranslateService.ctorParameters = [
                    { type: TranslateLoader, },
                    { type: MissingTranslationHandler, decorators: [{ type: core_1.Optional },] },
                ];
                return TranslateService;
            }()));
        }
    }
});

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNsYXRlLnNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ0cmFuc2xhdGUuc2VydmljZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7O1FBUVcseUJBQXlCLEVBS3pCLGVBQWUsRUFLZixxQkFBcUIsRUFtQnJCLGdCQUFnQjs7Ozs7Ozs7Ozs7Ozs7Ozs7O1lBN0JoQix1Q0FBQSx5QkFBeUIsR0FBRyxDQUFDO2dCQUNwQztnQkFDQSxDQUFDO2dCQUNELE1BQU0sQ0FBQyx5QkFBeUIsQ0FBQztZQUNyQyxDQUFDLEVBQUUsQ0FBQyxDQUFBLENBQUM7WUFDTSw2QkFBQSxlQUFlLEdBQUcsQ0FBQztnQkFDMUI7Z0JBQ0EsQ0FBQztnQkFDRCxNQUFNLENBQUMsZUFBZSxDQUFDO1lBQzNCLENBQUMsRUFBRSxDQUFDLENBQUEsQ0FBQztZQUNNLG1DQUFBLHFCQUFxQixHQUFHLENBQUM7Z0JBQ2hDLCtCQUErQixJQUFJLEVBQUUsTUFBTSxFQUFFLE1BQU07b0JBQy9DLEVBQUUsQ0FBQyxDQUFDLE1BQU0sS0FBSyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7d0JBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztvQkFBQyxDQUFDO29CQUMzQyxFQUFFLENBQUMsQ0FBQyxNQUFNLEtBQUssS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO3dCQUFDLE1BQU0sR0FBRyxPQUFPLENBQUM7b0JBQUMsQ0FBQztvQkFDNUMsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7b0JBQ2pCLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO29CQUNyQixJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztnQkFDekIsQ0FBQztnQkFDRDs7OzttQkFJRztnQkFDSCxxQkFBcUIsQ0FBQyxTQUFTLENBQUMsY0FBYyxHQUFHLFVBQVUsSUFBSTtvQkFDM0QsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLEdB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
$__System.register("b", [], function(exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var Parser;
    return {
        setters:[],
        execute: function() {
            exports_1("Parser", Parser = (function () {
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
                        if (target !== undefined && target[key] !== undefined && (typeof target[key] === 'object' || !keys.length)) {
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
            }()));
        }
    }
});

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNsYXRlLnBhcnNlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInRyYW5zbGF0ZS5wYXJzZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O1FBQVcsTUFBTTs7OztZQUFOLG9CQUFBLE1BQU0sR0FBRyxDQUFDO2dCQUNqQjtvQkFDSSxJQUFJLENBQUMsZUFBZSxHQUFHLHVCQUF1QixDQUFDO2dCQUNuRCxDQUFDO2dCQUNEOzs7Ozs7bUJBTUc7Z0JBQ0gsTUFBTSxDQUFDLFNBQVMsQ0FBQyxXQUFXLEdBQUcsVUFBVSxJQUFJLEVBQUUsTUFBTTtvQkFDakQsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDO29CQUNqQixFQUFFLENBQUMsQ0FBQyxPQUFPLElBQUksS0FBSyxRQUFRLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO3dCQUN0QyxNQUFNLENBQUMsSUFBSSxDQUFDO29CQUNoQixDQUFDO29CQUNELE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsVUFBVSxTQUFTLEVBQUUsQ0FBQzt3QkFDNUQsSUFBSSxDQUFDLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7d0JBQ2xDLE1BQU0sQ0FBQyxPQUFPLENBQUMsS0FBSyxXQUFXLEdBQUcsQ0FBQyxHQUFHLFNBQVMsQ0FBQztvQkFDcEQsQ0FBQyxDQUFDLENBQUM7Z0JBQ1AsQ0FBQyxDQUFDO2dCQUNGOzs7Ozs7bUJBTUc7Z0JBQ0gsTUFBTSxDQUFDLFNBQVMsQ0FBQyxRQUFRLEdBQUcsVUFBVSxNQUFNLEVBQUUsR0FBRztvQkFDN0MsSUFBSSxJQUFJLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztvQkFDMUIsR0FBRyxHQUFHLEVBQUUsQ0FBQztvQkFDVCxHQUFHLENBQUM7d0JBQ0EsR0FBRyxJQUFJLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQzt3QkFDcEIsRUFBRSxDQUFDLENBQUMsTUFBTSxLQUFLLFNBQVMsSUFBSSxNQUFNLENBQUMsR0FBRyxDQUFDLEtBQUssU0FBUyxJQUFJLENBQUMsT0FBTyxNQUFNLENBQUMsR0FBRyxDQUFDLEtBQUssUUFBUSxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQzs0QkFDekcsTUFBTSxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQzs0QkFDckIsR0FBRyxHQUFHLEVBQUUsQ0FBQzt3QkFDYixDQUFDO3dCQUNELElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDOzRCQUNwQixNQUFNLEdBQUcsU0FBUyxDQUFDO3dCQUN2QixDQUFDO3dCQUNELElBQUksQ0FBQyxDQUFDOzRCQUNGLEdBQUcsSUFBSSxHQUFHLENBQUM7d0JBQ2YsQ0FBQztvQkFDTCxDQUFDLFFBQVEsSUFBSSxDQUFDLE1BQU0sRUFBRTtvQkFDdEIsTUFBTSxDQUFDLE1BQU0sQ0FBQztnQkFDbEIsQ0FBQyxDQUFDO2dCQUNGLE1BQU0sQ0FBQyxNQUFNLENBQUM7WUFDbEIsQ0FBQyxFQUFFLENBQUMsQ0FBQSxDQUFDOzs7O0FBQ0wsczNIQUFzM0gifQ==
$__System.register("1", ["3", "c", "2", "4", "b"], function(exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var core_1, http_1, translate_pipe_1, translate_service_1;
    var TranslateModule;
    function translateLoaderFactory(http) {
        return new translate_service_1.TranslateStaticLoader(http);
    }
    exports_1("translateLoaderFactory", translateLoaderFactory);
    var exportedNames_1 = {
        'TranslateModule': true,
        'translateLoaderFactory': true
    };
    function exportStar_1(m) {
        var exports = {};
        for(var n in m) {
            if (n !== "default"&& !exportedNames_1.hasOwnProperty(n)) exports[n] = m[n];
        }
        exports_1(exports);
    }
    return {
        setters:[
            function (core_1_1) {
                core_1 = core_1_1;
            },
            function (http_1_1) {
                http_1 = http_1_1;
            },
            function (translate_pipe_1_1) {
                translate_pipe_1 = translate_pipe_1_1;
                exportStar_1(translate_pipe_1_1);
            },
            function (translate_service_1_1) {
                translate_service_1 = translate_service_1_1;
                exportStar_1(translate_service_1_1);
            },
            function (translate_parser_1_1) {
                exportStar_1(translate_parser_1_1);
            }],
        execute: function() {
            exports_1("TranslateModule", TranslateModule = (function () {
                function TranslateModule() {
                }
                TranslateModule.forRoot = function (providedLoader) {
                    if (providedLoader === void 0) {
                        providedLoader = {
                            provide: translate_service_1.TranslateLoader,
                            useFactory: translateLoaderFactory,
                            deps: [http_1.Http]
                        };
                    }
                    return {
                        ngModule: TranslateModule,
                        providers: [providedLoader, translate_service_1.TranslateService]
                    };
                };
                TranslateModule.decorators = [
                    { type: core_1.NgModule, args: [{
                                imports: [http_1.HttpModule],
                                declarations: [
                                    translate_pipe_1.TranslatePipe
                                ],
                                exports: [
                                    http_1.HttpModule,
                                    translate_pipe_1.TranslatePipe
                                ]
                            },] },
                ];
                /** @nocollapse */
                TranslateModule.ctorParameters = [];
                return TranslateModule;
            }()));
        }
    }
});

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmcyLXRyYW5zbGF0ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm5nMi10cmFuc2xhdGUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztRQVVXLGVBQWU7SUFIMUIsZ0NBQXVDLElBQUk7UUFDdkMsTUFBTSxDQUFDLElBQUkseUNBQXFCLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDM0MsQ0FBQztJQUZELDJEQUVDLENBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O1lBQ1UsNkJBQUEsZUFBZSxHQUFHLENBQUM7Z0JBQzFCO2dCQUNBLENBQUM7Z0JBQ0QsZUFBZSxDQUFDLE9BQU8sR0FBRyxVQUFVLGNBQWM7b0JBQzlDLEVBQUUsQ0FBQyxDQUFDLGNBQWMsS0FBSyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7d0JBQUMsY0FBYyxHQUFHOzRCQUM5QyxPQUFPLEVBQUUsbUNBQWU7NEJBQ3hCLFVBQVUsRUFBRSxzQkFBc0I7NEJBQ2xDLElBQUksRUFBRSxDQUFDLFdBQUksQ0FBQzt5QkFDZixDQUFDO29CQUFDLENBQUM7b0JBQ0osTUFBTSxDQUFDO3dCQUNILFFBQVEsRUFBRSxlQUFlO3dCQUN6QixTQUFTLEVBQUUsQ0FBQyxjQUFjLEVBQUUsb0NBQWdCLENBQUM7cUJBQ2hELENBQUM7Z0JBQ04sQ0FBQyxDQUFDO2dCQUNGLGVBQWUsQ0FBQyxVQUFVLEdBQUc7b0JBQ3pCLEVBQUUsSUFBSSxFQUFFLGVBQVEsRUFBRSxJQUFJLEVBQUUsQ0FBQztnQ0FDYixPQUFPLEVBQUUsQ0FBQyxpQkFBVSxDQUFDO2dDQUNyQixZQUFZLEVBQUU7b0NBQ1YsOEJBQWE7aUNBQ2hCO2dDQUNELE9BQU8sRUFBRTtvQ0FDTCxpQkFBVTtvQ0FDViw4QkFBYTtpQ0FDaEI7NkJBQ0osRUFBRSxFQUFFO2lCQUNoQixDQUFDO2dCQUNGLGtCQUFrQjtnQkFDbEIsZUFBZSxDQUFDLGNBQWMsR0FBRyxFQUFFLENBQUM7Z0JBQ3BDLE1BQU0sQ0FBQyxlQUFlLENBQUM7WUFDM0IsQ0FBQyxFQUFFLENBQUMsQ0FBQSxDQUFDOzs7O0FBQ0wsc25HQUFzbkcifQ==
})
(function(factory) {
  if (typeof define == 'function' && define.amd)
    define(["@angular/core","@angular/http","rxjs/Observable","rxjs/add/observable/of","rxjs/add/operator/map","rxjs/add/operator/merge","rxjs/add/operator/share","rxjs/add/operator/toArray"], factory);
  else if (typeof module == 'object' && module.exports && typeof require == 'function')
    module.exports = factory(require("@angular/core"), require("@angular/http"), require("rxjs/Observable"), require("rxjs/add/observable/of"), require("rxjs/add/operator/map"), require("rxjs/add/operator/merge"), require("rxjs/add/operator/share"), require("rxjs/add/operator/toArray"));
  else
    throw new Error("Module must be loaded as AMD or CommonJS");
});
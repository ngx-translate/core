var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") return Reflect.decorate(decorators, target, key, desc);
    switch (arguments.length) {
        case 2: return decorators.reduceRight(function(o, d) { return (d && d(o)) || o; }, target);
        case 3: return decorators.reduceRight(function(o, d) { return (d && d(target, key)), void 0; }, void 0);
        case 4: return decorators.reduceRight(function(o, d) { return (d && d(target, key, o)) || o; }, desc);
    }
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var angular2_1 = require('angular2/angular2');
var http_1 = require('angular2/http');
// doc: https://github.com/ReactiveX/RxJS/blob/master/doc/operator-creation.md
var Rx = require('@reactivex/rxjs/dist/cjs/Rx');
var TranslateStaticLoader = (function () {
    function TranslateStaticLoader(http) {
        this.onLanguageChange = new angular2_1.EventEmitter();
        this.sfLoaderParams = { prefix: 'i18n/', suffix: '.json' };
        this.http = http;
    }
    TranslateStaticLoader.prototype.useStaticFilesLoader = function (prefix, suffix) {
        this.sfLoaderParams.prefix = prefix;
        this.sfLoaderParams.suffix = suffix;
    };
    TranslateStaticLoader.prototype.getTranslation = function (language) {
        return this.http.get(this.sfLoaderParams.prefix + "/" + language + this.sfLoaderParams.suffix)
            .map(function (res) { return res.json(); });
    };
    TranslateStaticLoader = __decorate([
        angular2_1.Injectable(), 
        __metadata('design:paramtypes', [http_1.Http])
    ], TranslateStaticLoader);
    return TranslateStaticLoader;
})();
var TranslateService = (function () {
    function TranslateService(http) {
        this.translations = {};
        this.defaultLanguage = 'en';
        this.method = 'static';
        this.staticLoader = new TranslateStaticLoader(http);
        this.currentLoader = this.staticLoader;
    }
    TranslateService.prototype.setDefault = function (language) {
        this.defaultLanguage = language;
    };
    TranslateService.prototype.use = function (language) {
        var _this = this;
        // check if this language is available
        if (typeof this.translations[language] === "undefined") {
            // not available, ask for it
            this.pending = this.getTranslation(language);
            this.pending.toPromise().then(function () {
                _this.currentLanguage = language;
            });
            return this.pending;
        }
        else {
            this.currentLanguage = language;
            return Rx.Observable.create(function (observer) {
                observer.next();
                observer.complete();
            });
        }
    };
    TranslateService.prototype.getTranslation = function (language) {
        var _this = this;
        var observable = this.currentLoader.getTranslation(language);
        observable.toPromise().then(function (res) {
            _this.translations[language] = res;
            _this.pending = undefined;
            if (_this.currentLoader.onLanguageChange) {
                _this.currentLoader.onLanguageChange.next(res);
            }
        });
        return observable;
    };
    TranslateService.prototype.setTranslation = function (language, translation) {
        this.translations[language] = translation;
    };
    TranslateService.prototype.get = function (key) {
        var _this = this;
        // check if we are loading a new translation to use
        if (this.pending) {
            return Rx.Observable.create(function (observer) {
                _this.pending.toPromise().then(function (res) {
                    observer.next(res[key] || '');
                    observer.complete();
                });
            });
        }
        else {
            return Rx.Observable.create(function (observer) {
                observer.next(_this.translations[_this.currentLanguage][key] || key);
                observer.complete();
            });
        }
    };
    TranslateService.prototype.set = function (key, value, language) {
        if (language === void 0) { language = this.currentLanguage; }
        this.translations[language][key] = value;
    };
    TranslateService = __decorate([
        angular2_1.Injectable(), 
        __metadata('design:paramtypes', [http_1.Http])
    ], TranslateService);
    return TranslateService;
})();
exports.TranslateService = TranslateService;

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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var angular2_1 = require('angular2/angular2');
var http_1 = require('angular2/http');
var TranslateService = (function () {
    function TranslateService(http) {
        this.defaultLanguage = 'en';
        this.translations = {};
        this.method = 'static';
        this.sfLoaderParams = { prefix: 'i18n/', suffix: '.json' };
        this.http = http;
    }
    TranslateService.prototype.setDefault = function (language) {
        this.defaultLanguage = language;
    };
    //todo use RxJS
    TranslateService.prototype.use = function (language) {
        var _this = this;
        if (typeof this.translations[language] === "undefined") {
            return this.getTranslations(language).then(function () {
                return _this.currentLanguage = language;
            });
        }
        else {
            return Promise.resolve(this.currentLanguage = language);
        }
    };
    TranslateService.prototype.useStaticFilesLoader = function (prefix, suffix) {
        this.sfLoaderParams.prefix = prefix;
        this.sfLoaderParams.suffix = suffix;
    };
    TranslateService.prototype.getTranslations = function (language) {
        var _this = this;
        if (this.method === 'static') {
            this.pending = this.http.get(this.sfLoaderParams.prefix + "/" + language + this.sfLoaderParams.suffix)
                .map(function (res) { return res.json(); }).toPromise().then(function (res) {
                _this.translations[language] = res;
                _this.pending = undefined;
                return res;
            });
        }
        return this.pending;
    };
    //todo use RxJS
    TranslateService.prototype.get = function (key) {
        if (this.pending) {
            return this.pending.then(function (res) {
                return res[key] || '';
            });
        }
        else {
            return Promise.resolve(this.translations[this.currentLanguage][key] || key);
        }
    };
    TranslateService = __decorate([
        __param(0, angular2_1.Inject(http_1.Http)), 
        __metadata('design:paramtypes', [http_1.Http])
    ], TranslateService);
    return TranslateService;
})();
exports.TranslateService = TranslateService;

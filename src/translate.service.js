System.register(['angular2/angular2', 'angular2/http'], function(exports_1) {
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
    var angular2_1, http_1;
    var TranslateService;
    return {
        setters:[
            function (angular2_1_1) {
                angular2_1 = angular2_1_1;
            },
            function (http_1_1) {
                http_1 = http_1_1;
            }],
        execute: function() {
            TranslateService = (function () {
                function TranslateService(http) {
                    this.translations = {};
                    this.http = http;
                    var userLang = navigator.language.split('-')[0]; // use navigator lang if available
                    this.language = /(fr|en)/gi.test(userLang) ? userLang : 'en';
                    this.getTranslations(this.language);
                }
                TranslateService.prototype.getTranslations = function (language) {
                    var _this = this;
                    this.pending = this.http.get("i18n/" + language + ".json")
                        .map(function (res) { return res.json(); }).toPromise().then(function (res) {
                        _this.translations = res;
                        _this.pending = undefined;
                        return res;
                    });
                    return this.pending;
                };
                TranslateService.prototype.get = function (key) {
                    if (this.pending) {
                        return this.pending.then(function (res) {
                            return res[key] || '';
                        });
                    }
                    else {
                        return Promise.resolve(this.translations[key] || key);
                    }
                };
                TranslateService = __decorate([
                    __param(0, angular2_1.Inject(http_1.Http)), 
                    __metadata('design:paramtypes', [http_1.Http])
                ], TranslateService);
                return TranslateService;
            })();
            exports_1("TranslateService", TranslateService);
        }
    }
});

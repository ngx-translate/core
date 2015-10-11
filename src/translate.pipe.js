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
var translate_service_1 = require("./translate.service");
var TranslatePipe = (function () {
    function TranslatePipe(translate) {
        this.value = '';
        this.translate = translate;
    }
    TranslatePipe.prototype.transform = function (query, args) {
        var _this = this;
        if (query.length === 0) {
            return query;
        }
        if (this.lastKey && query === this.lastKey) {
            return this.value;
        }
        this.lastKey = query;
        this.translate.get(query).then(function (res) {
            _this.value = res;
        });
        return this.value;
    };
    TranslatePipe = __decorate([
        angular2_1.Injectable(),
        angular2_1.Pipe({
            name: 'translate',
            pure: false // required to update the value when the promise is resolved
        }), 
        __metadata('design:paramtypes', [translate_service_1.TranslateService])
    ], TranslatePipe);
    return TranslatePipe;
})();
exports.TranslatePipe = TranslatePipe;

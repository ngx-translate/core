System.registerDynamic("src/translate.pipe", ["@angular/core", "./translate.service", "@angular/core/src/facade/lang"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var __decorate = (this && this.__decorate) || function(decorators, target, key, desc) {
    var c = arguments.length,
        r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
        d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
      r = Reflect.decorate(decorators, target, key, desc);
    else
      for (var i = decorators.length - 1; i >= 0; i--)
        if (d = decorators[i])
          r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
  };
  var __metadata = (this && this.__metadata) || function(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function")
      return Reflect.metadata(k, v);
  };
  var core_1 = $__require('@angular/core');
  var translate_service_1 = $__require('./translate.service');
  var lang_1 = $__require('@angular/core/src/facade/lang');
  var TranslatePipe = (function() {
    function TranslatePipe(translate, _ref) {
      this.translate = translate;
      this._ref = _ref;
      this.value = '';
    }
    TranslatePipe.prototype.equals = function(o1, o2) {
      if (o1 === o2)
        return true;
      if (o1 === null || o2 === null)
        return false;
      if (o1 !== o1 && o2 !== o2)
        return true;
      var t1 = typeof o1,
          t2 = typeof o2,
          length,
          key,
          keySet;
      if (t1 == t2 && t1 == 'object') {
        if (lang_1.isArray(o1)) {
          if (!lang_1.isArray(o2))
            return false;
          if ((length = o1.length) == o2.length) {
            for (key = 0; key < length; key++) {
              if (!this.equals(o1[key], o2[key]))
                return false;
            }
            return true;
          }
        } else {
          if (lang_1.isArray(o2)) {
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
    TranslatePipe.prototype.updateValue = function(key, interpolateParams) {
      var _this = this;
      this.translate.get(key, interpolateParams).subscribe(function(res) {
        _this.value = res ? res : key;
        _this.lastKey = key;
        _this._ref.markForCheck();
      });
    };
    TranslatePipe.prototype.transform = function(query) {
      var _this = this;
      var args = [];
      for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
      }
      if (!query || query.length === 0) {
        return query;
      }
      if (this.equals(query, this.lastKey) && this.equals(args, this.lastParams)) {
        return this.value;
      }
      var interpolateParams;
      if (args.length && args[0] !== null) {
        if (typeof args[0] === 'string' && args[0].length) {
          try {
            interpolateParams = JSON.parse(args[0].replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2": '));
          } catch (e) {
            throw new SyntaxError("Wrong parameter in TranslatePipe. Expected a valid Object, received: " + args[0]);
          }
        } else if (typeof args[0] === 'object' && !Array.isArray(args[0])) {
          interpolateParams = args[0];
        }
      }
      this.lastKey = query;
      this.lastParams = args;
      this.updateValue(query, interpolateParams);
      this._dispose();
      if (!this.onLangChange) {
        this.onLangChange = this.translate.onLangChange.subscribe(function(event) {
          _this.lastKey = null;
          _this.updateValue(query, interpolateParams);
        });
      }
      return this.value;
    };
    TranslatePipe.prototype._dispose = function() {
      if (lang_1.isPresent(this.onLangChange)) {
        this.onLangChange.unsubscribe();
        this.onLangChange = undefined;
      }
    };
    TranslatePipe.prototype.ngOnDestroy = function() {
      this._dispose();
    };
    TranslatePipe = __decorate([core_1.Injectable(), core_1.Pipe({
      name: 'translate',
      pure: false
    }), __metadata('design:paramtypes', [translate_service_1.TranslateService, core_1.ChangeDetectorRef])], TranslatePipe);
    return TranslatePipe;
  }());
  exports.TranslatePipe = TranslatePipe;
  return module.exports;
});

System.registerDynamic("src/translate.service", ["@angular/core", "rxjs/Observable", "rxjs/add/observable/of", "rxjs/add/operator/share", "rxjs/add/operator/map", "rxjs/add/operator/merge", "rxjs/add/operator/toArray", "./translate.parser"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var __decorate = (this && this.__decorate) || function(decorators, target, key, desc) {
    var c = arguments.length,
        r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
        d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
      r = Reflect.decorate(decorators, target, key, desc);
    else
      for (var i = decorators.length - 1; i >= 0; i--)
        if (d = decorators[i])
          r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
  };
  var __metadata = (this && this.__metadata) || function(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function")
      return Reflect.metadata(k, v);
  };
  var __param = (this && this.__param) || function(paramIndex, decorator) {
    return function(target, key) {
      decorator(target, key, paramIndex);
    };
  };
  var core_1 = $__require('@angular/core');
  var Observable_1 = $__require('rxjs/Observable');
  $__require('rxjs/add/observable/of');
  $__require('rxjs/add/operator/share');
  $__require('rxjs/add/operator/map');
  $__require('rxjs/add/operator/merge');
  $__require('rxjs/add/operator/toArray');
  var translate_parser_1 = $__require('./translate.parser');
  var MissingTranslationHandler = (function() {
    function MissingTranslationHandler() {}
    return MissingTranslationHandler;
  }());
  exports.MissingTranslationHandler = MissingTranslationHandler;
  var TranslateLoader = (function() {
    function TranslateLoader() {}
    return TranslateLoader;
  }());
  exports.TranslateLoader = TranslateLoader;
  var TranslateStaticLoader = (function() {
    function TranslateStaticLoader(http, prefix, suffix) {
      if (prefix === void 0) {
        prefix = 'i18n';
      }
      if (suffix === void 0) {
        suffix = '.json';
      }
      this.http = http;
      this.prefix = prefix;
      this.suffix = suffix;
    }
    TranslateStaticLoader.prototype.getTranslation = function(lang) {
      return this.http.get(this.prefix + "/" + lang + this.suffix).map(function(res) {
        return res.json();
      });
    };
    return TranslateStaticLoader;
  }());
  exports.TranslateStaticLoader = TranslateStaticLoader;
  var TranslateService = (function() {
    function TranslateService(currentLoader, missingTranslationHandler) {
      this.currentLoader = currentLoader;
      this.missingTranslationHandler = missingTranslationHandler;
      this.currentLang = this.defaultLang;
      this.onLangChange = new core_1.EventEmitter();
      this.translations = {};
      this.parser = new translate_parser_1.Parser();
    }
    TranslateService.prototype.setDefaultLang = function(lang) {
      this.defaultLang = lang;
    };
    TranslateService.prototype.use = function(lang) {
      var _this = this;
      var pending;
      if (typeof this.translations[lang] === 'undefined') {
        pending = this.getTranslation(lang);
      }
      if (typeof pending !== 'undefined') {
        pending.subscribe(function(res) {
          _this.changeLang(lang);
        });
        return pending;
      } else {
        this.changeLang(lang);
        return Observable_1.Observable.of(this.translations[lang]);
      }
    };
    TranslateService.prototype.getTranslation = function(lang) {
      var _this = this;
      this.pending = this.currentLoader.getTranslation(lang).share();
      this.pending.subscribe(function(res) {
        _this.translations[lang] = res;
        _this.updateLangs();
      }, function(err) {
        throw err;
      }, function() {
        _this.pending = undefined;
      });
      return this.pending;
    };
    TranslateService.prototype.setTranslation = function(lang, translations) {
      this.translations[lang] = translations;
      this.updateLangs();
    };
    TranslateService.prototype.getLangs = function() {
      return this.langs;
    };
    TranslateService.prototype.updateLangs = function() {
      this.langs = Object.keys(this.translations);
    };
    TranslateService.prototype.getParsedResult = function(translations, key, interpolateParams) {
      var res;
      if (key instanceof Array) {
        var result = {},
            observables = false;
        for (var _i = 0,
            key_1 = key; _i < key_1.length; _i++) {
          var k = key_1[_i];
          result[k] = this.getParsedResult(translations, k, interpolateParams);
          if (typeof result[k].subscribe === 'function') {
            observables = true;
          }
        }
        if (observables) {
          var mergedObs;
          for (var _a = 0,
              key_2 = key; _a < key_2.length; _a++) {
            var k = key_2[_a];
            var obs = typeof result[k].subscribe === 'function' ? result[k] : Observable_1.Observable.of(result[k]);
            if (typeof mergedObs === 'undefined') {
              mergedObs = obs;
            } else {
              mergedObs = mergedObs.merge(obs);
            }
          }
          return mergedObs.toArray().map(function(arr) {
            var obj = {};
            arr.forEach(function(value, index) {
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
      if (typeof res === 'undefined' && this.defaultLang && this.defaultLang !== this.currentLang) {
        res = this.parser.interpolate(this.parser.getValue(this.translations[this.defaultLang], key), interpolateParams);
      }
      if (!res && this.missingTranslationHandler) {
        res = this.missingTranslationHandler.handle(key);
      }
      return res || key;
    };
    TranslateService.prototype.get = function(key, interpolateParams) {
      var _this = this;
      if (!key) {
        throw new Error('Parameter "key" required');
      }
      if (this.pending) {
        return Observable_1.Observable.create(function(observer) {
          var onComplete = function(res) {
            observer.next(res);
            observer.complete();
          };
          _this.pending.subscribe(function(res) {
            var res = _this.getParsedResult(res, key, interpolateParams);
            if (typeof res.subscribe === 'function') {
              res.subscribe(onComplete);
            } else {
              onComplete(res);
            }
          });
        });
      } else {
        var res = this.getParsedResult(this.translations[this.currentLang], key, interpolateParams);
        if (typeof res.subscribe === 'function') {
          return res;
        } else {
          return Observable_1.Observable.of(res);
        }
      }
    };
    TranslateService.prototype.instant = function(key, interpolateParams) {
      if (!key) {
        throw new Error('Parameter "key" required');
      }
      var res = this.getParsedResult(this.translations[this.currentLang], key, interpolateParams);
      if (typeof res.subscribe !== 'undefined') {
        if (key instanceof Array) {
          var obj = {};
          key.forEach(function(value, index) {
            obj[key[index]] = key[index];
          });
          return obj;
        }
        return key;
      } else {
        return res;
      }
    };
    TranslateService.prototype.set = function(key, value, lang) {
      if (lang === void 0) {
        lang = this.currentLang;
      }
      this.translations[lang][key] = value;
      this.updateLangs();
    };
    TranslateService.prototype.changeLang = function(lang) {
      this.currentLang = lang;
      this.onLangChange.emit({
        lang: lang,
        translations: this.translations[lang]
      });
    };
    TranslateService.prototype.reloadLang = function(lang) {
      this.resetLang(lang);
      return this.getTranslation(lang);
    };
    TranslateService.prototype.resetLang = function(lang) {
      this.translations[lang] = undefined;
    };
    TranslateService = __decorate([core_1.Injectable(), __param(1, core_1.Optional()), __metadata('design:paramtypes', [TranslateLoader, MissingTranslationHandler])], TranslateService);
    return TranslateService;
  }());
  exports.TranslateService = TranslateService;
  return module.exports;
});

System.registerDynamic("src/translate.parser", [], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var Parser = (function() {
    function Parser() {
      this.templateMatcher = /{{\s?([^{}\s]*)\s?}}/g;
    }
    Parser.prototype.interpolate = function(expr, params) {
      var _this = this;
      if (typeof expr !== 'string' || !params) {
        return expr;
      }
      return expr.replace(this.templateMatcher, function(substring, b) {
        var r = _this.getValue(params, b);
        return typeof r !== 'undefined' ? r : substring;
      });
    };
    Parser.prototype.getValue = function(target, key) {
      var keys = key.split('.');
      key = '';
      do {
        key += keys.shift();
        if (target !== undefined && target[key] !== undefined && (typeof target[key] === 'object' || !keys.length)) {
          target = target[key];
          key = '';
        } else if (!keys.length) {
          target = undefined;
        } else {
          key += '.';
        }
      } while (keys.length);
      return target;
    };
    return Parser;
  }());
  exports.Parser = Parser;
  return module.exports;
});

System.registerDynamic("ng2-translate", ["@angular/http", "./src/translate.pipe", "./src/translate.service", "./src/translate.parser"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  function __export(m) {
    for (var p in m)
      if (!exports.hasOwnProperty(p))
        exports[p] = m[p];
  }
  var http_1 = $__require('@angular/http');
  var translate_pipe_1 = $__require('./src/translate.pipe');
  var translate_service_1 = $__require('./src/translate.service');
  __export($__require('./src/translate.pipe'));
  __export($__require('./src/translate.service'));
  __export($__require('./src/translate.parser'));
  exports.TRANSLATE_PROVIDERS = [{
    provide: translate_service_1.TranslateLoader,
    useFactory: function(http) {
      return new translate_service_1.TranslateStaticLoader(http);
    },
    deps: [http_1.Http]
  }, translate_service_1.TranslateService];
  Object.defineProperty(exports, "__esModule", {value: true});
  exports.default = {
    pipes: [translate_pipe_1.TranslatePipe],
    providers: [translate_service_1.TranslateService]
  };
  return module.exports;
});

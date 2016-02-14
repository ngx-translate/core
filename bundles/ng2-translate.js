System.registerDynamic("src/translate.pipe", ["angular2/core", "./translate.service"], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
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
  var core_1 = $__require('angular2/core');
  var translate_service_1 = $__require('./translate.service');
  var TranslatePipe = (function() {
    function TranslatePipe(translate) {
      this.value = '';
      this.translate = translate;
    }
    TranslatePipe.prototype.updateValue = function(key, interpolateParams) {
      var _this = this;
      this.translate.get(key, interpolateParams).subscribe(function(res) {
        _this.value = res ? res : key;
      });
    };
    TranslatePipe.prototype.transform = function(query, args) {
      var _this = this;
      if (query.length === 0) {
        return query;
      }
      if (this.lastKey && query === this.lastKey) {
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
      this.updateValue(query, interpolateParams);
      this.translate.onLangChange.subscribe(function(params) {
        _this.updateValue(query, interpolateParams);
      });
      return this.value;
    };
    TranslatePipe = __decorate([core_1.Injectable(), core_1.Pipe({
      name: 'translate',
      pure: false
    }), __metadata('design:paramtypes', [translate_service_1.TranslateService])], TranslatePipe);
    return TranslatePipe;
  })();
  exports.TranslatePipe = TranslatePipe;
  global.define = __define;
  return module.exports;
});

System.registerDynamic("src/translate.service", ["angular2/core", "angular2/http", "rxjs/Observable", "rxjs/add/observable/fromArray", "rxjs/add/operator/share", "rxjs/add/operator/map", "./translate.parser"], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
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
  var core_1 = $__require('angular2/core');
  var http_1 = $__require('angular2/http');
  var Observable_1 = $__require('rxjs/Observable');
  $__require('rxjs/add/observable/fromArray');
  $__require('rxjs/add/operator/share');
  $__require('rxjs/add/operator/map');
  var translate_parser_1 = $__require('./translate.parser');
  var TranslateStaticLoader = (function() {
    function TranslateStaticLoader(http, prefix, suffix) {
      this.sfLoaderParams = {
        prefix: 'i18n',
        suffix: '.json'
      };
      this.http = http;
      this.configure(prefix, suffix);
    }
    TranslateStaticLoader.prototype.configure = function(prefix, suffix) {
      this.sfLoaderParams.prefix = prefix ? prefix : this.sfLoaderParams.prefix;
      this.sfLoaderParams.suffix = suffix ? suffix : this.sfLoaderParams.suffix;
    };
    TranslateStaticLoader.prototype.getTranslation = function(lang) {
      return this.http.get(this.sfLoaderParams.prefix + "/" + lang + this.sfLoaderParams.suffix).map(function(res) {
        return res.json();
      });
    };
    TranslateStaticLoader = __decorate([core_1.Injectable(), __metadata('design:paramtypes', [http_1.Http, String, String])], TranslateStaticLoader);
    return TranslateStaticLoader;
  })();
  var TranslateService = (function() {
    function TranslateService(http) {
      this.http = http;
      this.currentLang = this.defaultLang;
      this.onLangChange = new core_1.EventEmitter();
      this.translations = {};
      this.parser = new translate_parser_1.Parser();
      this.useStaticFilesLoader();
    }
    TranslateService.prototype.useStaticFilesLoader = function(prefix, suffix) {
      this.currentLoader = new TranslateStaticLoader(this.http, prefix, suffix);
    };
    TranslateService.prototype.setDefaultLang = function(lang) {
      this.defaultLang = lang;
    };
    TranslateService.prototype.use = function(lang) {
      var _this = this;
      if (typeof this.translations[lang] === 'undefined') {
        var pending = this.getTranslation(lang);
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
    TranslateService.prototype.get = function(key, interpolateParams) {
      var _this = this;
      if (!key) {
        throw new Error('Parameter "key" required');
      }
      var getParsedResult = function(translations, key) {
        var res;
        if (key instanceof Array) {
          var result = {};
          for (var _i = 0; _i < key.length; _i++) {
            var k = key[_i];
            result[k] = getParsedResult(translations, k);
          }
          return result;
        }
        if (translations) {
          res = _this.parser.interpolate(translations[key], interpolateParams);
        }
        if (typeof res === 'undefined' && _this.defaultLang && _this.defaultLang !== _this.currentLang) {
          var translations_1 = _this.parser.flattenObject(_this.translations[_this.defaultLang]);
          res = _this.parser.interpolate(translations_1[key], interpolateParams);
        }
        if (!res && _this.missingTranslationHandler) {
          _this.missingTranslationHandler.handle(key);
        }
        return res || key;
      };
      if (this.pending) {
        return this.pending.map(function(res) {
          return getParsedResult(_this.parser.flattenObject(res), key);
        });
      } else {
        var translations;
        if (this.translations[this.currentLang]) {
          translations = this.parser.flattenObject(this.translations[this.currentLang]);
        }
        return Observable_1.Observable.of(getParsedResult(translations, key));
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
    TranslateService.prototype.setMissingTranslationHandler = function(handler) {
      this.missingTranslationHandler = handler;
    };
    TranslateService = __decorate([core_1.Injectable(), __metadata('design:paramtypes', [http_1.Http])], TranslateService);
    return TranslateService;
  })();
  exports.TranslateService = TranslateService;
  global.define = __define;
  return module.exports;
});

System.registerDynamic("src/translate.parser", [], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var Parser = (function() {
    function Parser() {
      this.templateMatcher = /{{\s?([^{}\s]*)\s?}}/g;
    }
    Parser.prototype.interpolate = function(expr, params) {
      if (!params) {
        return expr;
      } else {
        params = this.flattenObject(params);
      }
      return expr.replace(this.templateMatcher, function(substring, b) {
        var r = params[b];
        return typeof r !== 'undefined' ? r : substring;
      });
    };
    Parser.prototype.flattenObject = function(target) {
      var delimiter = '.';
      var maxDepth;
      var currentDepth = 1;
      var output = {};
      function step(object, prev) {
        Object.keys(object).forEach(function(key) {
          var value = object[key];
          var newKey = prev ? prev + delimiter + key : key;
          maxDepth = currentDepth + 1;
          if (!Array.isArray(value) && typeof value === 'object' && Object.keys(value).length && currentDepth < maxDepth) {
            ++currentDepth;
            return step(value, newKey);
          }
          output[newKey] = value;
        });
      }
      step(target);
      return output;
    };
    return Parser;
  })();
  exports.Parser = Parser;
  global.define = __define;
  return module.exports;
});

System.registerDynamic("ng2-translate", ["./src/translate.pipe", "./src/translate.service", "./src/translate.parser"], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  function __export(m) {
    for (var p in m)
      if (!exports.hasOwnProperty(p))
        exports[p] = m[p];
  }
  var translate_pipe_1 = $__require('./src/translate.pipe');
  var translate_service_1 = $__require('./src/translate.service');
  __export($__require('./src/translate.pipe'));
  __export($__require('./src/translate.service'));
  __export($__require('./src/translate.parser'));
  Object.defineProperty(exports, "__esModule", {value: true});
  exports.default = {
    pipes: [translate_pipe_1.TranslatePipe],
    providers: [translate_service_1.TranslateService]
  };
  global.define = __define;
  return module.exports;
});

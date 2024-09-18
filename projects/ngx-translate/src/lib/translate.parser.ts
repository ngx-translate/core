import {Injectable} from "@angular/core";
import {isDefined} from "./util";

export type InterpolateFunction = (params:any) => string;


export abstract class TranslateParser {
  /**
   * Interpolates a string to replace parameters
   * "This is a {{ key }}" ==> "This is a value", with params = { key: "value" }
   * @param expr
   * @param params
   */
  abstract interpolate(expr: string | InterpolateFunction, params?: any): string | undefined;

  /**
   * Gets a value from an object by composed key
   * parser.getValue({ key1: { keyA: 'valueI' }}, 'key1.keyA') ==> 'valueI'
   * @param target
   * @param key
   */
  abstract getValue(target: any, key: string): any
}

@Injectable()
export class TranslateDefaultParser extends TranslateParser {
  templateMatcher = /{{\s?([^{}\s]*)\s?}}/g;

  public interpolate(expr: string | InterpolateFunction, params?: any): string {
    let result: string;

    if (typeof expr === 'string') {
      result = this.interpolateString(expr, params);
    } else if (typeof expr === 'function') {
      result = this.interpolateFunction(expr, params);
    } else {
      // this should not happen, but an unrelated TranslateService test depends on it
      result = expr as string;
    }

    return result;
  }

  getValue(target: any, key: string): any {

    const keys = key.split('.');

    key = '';
    do {
      key += keys.shift();
      if (isDefined(target) && isDefined(target[key]) && (typeof target[key] === 'object' || !keys.length)) {
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

  private interpolateFunction(fn: InterpolateFunction, params?: any): string {
    return fn(params);
  }

  private interpolateString(expr: string, params?: any): string {
    if (!params) {
      return expr;
    }

    return expr.replace(this.templateMatcher, (substring: string, b: string) => {
      const r = this.getValue(params, b);
      return isDefined(r) ? r : substring;
    });
  }
}

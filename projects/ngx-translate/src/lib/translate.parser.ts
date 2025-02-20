import {Injectable} from "@angular/core";
import {InterpolationParameters} from "./translate.service";
import {getValue, isDefined, isString, isFunction} from "./util";


export type InterpolateFunction = (params?: InterpolationParameters) => string;


export abstract class TranslateParser
{
  /**
   * Interpolates a string to replace parameters
   * "This is a {{ key }}" ==> "This is a value", with params = { key: "value" }
   * @param expr
   * @param params
   */
  abstract interpolate(expr: InterpolateFunction|string, params?: InterpolationParameters): string|undefined;
}


@Injectable()
export class TranslateDefaultParser extends TranslateParser
{
  templateMatcher = /{{\s?([^{}\s]*)\s?}}/g;

  public interpolate(expr: InterpolateFunction|string, params?: InterpolationParameters): string|undefined
  {
    if (isString(expr))
    {
      return this.interpolateString(expr as string, params);
    }
    else if (isFunction(expr))
    {
      return this.interpolateFunction(expr as InterpolateFunction, params);
    }
    return undefined;
  }

  protected interpolateFunction(fn: InterpolateFunction, params?: InterpolationParameters): string
  {
    return fn(params);
  }

  protected interpolateString(expr: string, params?: InterpolationParameters): string
  {
    if (!params)
    {
      return expr;
    }

    return expr.replace(this.templateMatcher, (substring: string, b: string) =>
    {
      const r = getValue(params, b);
      return isDefined(r)
             ? r
             : substring;
    });
  }
}

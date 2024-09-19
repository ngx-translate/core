import {Injectable} from "@angular/core";
import {getValue, isDefined, isObject} from "./util";
import {
  InterpolatableTranslation,
  InterpolatableTranslationObject, Translation,
  TranslationObject
} from "./translate.service";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type InterpolationParameters = any;

export type InterpolateFunction = (params: InterpolationParameters) => string;


export abstract class TranslateParser
{
  /**
   * Interpolates a string to replace parameters
   * "This is a {{ key }}" ==> "This is a value", with params = { key: "value" }
   * @param expr
   * @param params
   */
  abstract interpolate(expr: InterpolatableTranslation, params?: InterpolationParameters): Translation;
}


@Injectable()
export class TranslateDefaultParser extends TranslateParser
{
  templateMatcher = /{{\s?([^{}\s]*)\s?}}/g;

  public interpolate(expr: InterpolatableTranslation, params?: InterpolationParameters): Translation
  {
    if (typeof expr === "string")
    {
      return this.interpolateString(expr, params);
    }
    else if (typeof expr === "function")
    {
      return this.interpolateFunction(expr, params);
    }
    else if (Array.isArray(expr))
    {
      return expr.map((item) => this.interpolate(item, params));
    }
    else if (isObject(expr)) {
      const exprObject = expr as InterpolatableTranslationObject;
      return Object.keys(exprObject).reduce((acc, key) => {
        const value  = this.interpolate(exprObject[key], params);
        if(value !== undefined)
        {
          acc[key] = value;
        }
        return acc;
      }, {} as TranslationObject);
    }
  }

  private interpolateFunction(fn: InterpolateFunction, params?: InterpolationParameters): string
  {
    return fn(params);
  }

  private interpolateString(expr: string, params?: InterpolationParameters): string
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

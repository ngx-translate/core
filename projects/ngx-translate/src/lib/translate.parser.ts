import {Injectable} from "@angular/core";
import {InterpolationParameters} from "./translate.service";
import {getValue, isString, isFunction, isArray, isObject} from "./util";


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

    return expr.replace(this.templateMatcher, (_substring: string, key: string) =>
    {
      return this.getInterpolationReplacement(params, key);
    });
  }

  /**
   * Returns the replacement for an interpolation parameter
   * @params:
   */
  protected getInterpolationReplacement(params: InterpolationParameters, key: string): string
  {
    return this.formatValue(getValue(params, key), key);
  }

  /**
   * Converts a value into a useful string representation.
   * @param value The value to format.
   * @param fallback the value to return in case value is undefined
   * @returns A string representation of the value.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected formatValue(value: any, fallback:string): string
  {
    if (isString(value)) {
      return value;
    }
    if (typeof value === "number" || typeof value === "boolean") {
      return value.toString();
    }
    if (value === null) {
      return "null";
    }
    if (isArray(value)) {
      return value.join(", ");
    }
    if (isObject(value))
    {
      if (typeof value.toString === "function" && value.toString !== Object.prototype.toString)
      {
        return value.toString();
      }
      return JSON.stringify(value); // Pretty-print JSON if no meaningful toString()
    }

    return fallback;
  }
}

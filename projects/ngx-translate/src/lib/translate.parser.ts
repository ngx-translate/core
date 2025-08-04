import { Injectable } from "@angular/core";
import { InterpolationParameters } from "./translate.service";
import { getValue, isArray, isFunction, isObject, isString } from "./util";

export type InterpolateFunction = (params?: InterpolationParameters) => string;

export abstract class TranslateParser {
    /**
     * Interpolates a string to replace parameters
     * "This is a {{ key }}" ==> "This is a value", with params = { key: "value" }
     * @param expr
     * @param params
     */
    abstract interpolate(
        expr: InterpolateFunction | string,
        params?: InterpolationParameters,
    ): string | undefined;
}

@Injectable()
export class TranslateDefaultParser extends TranslateParser {
    templateMatcher = /{{\s?([^{}\s]*)\s?}}/g;

    public interpolate(
        expr: InterpolateFunction | string,
        params?: InterpolationParameters,
    ): string | undefined {
        if (isString(expr)) {
            return this.interpolateString(expr as string, params);
        } else if (isFunction(expr)) {
            return this.interpolateFunction(expr as InterpolateFunction, params);
        }
        return undefined;
    }

    protected interpolateFunction(
        fn: InterpolateFunction,
        params?: InterpolationParameters,
    ): string {
        return fn(params);
    }

    protected interpolateString(expr: string, params?: InterpolationParameters): string {
        if (!params) {
            return expr;
        }

        return expr.replace(this.templateMatcher, (substring: string, key: string) => {
            const replacement = this.getInterpolationReplacement(params, key);
            return replacement !== undefined ? replacement : substring;
        });
    }

    /**
     * Returns the replacement for an interpolation parameter
     * @params:
     */
    protected getInterpolationReplacement(
        params: InterpolationParameters,
        key: string,
    ): string | undefined {
        return this.formatValue(getValue(params, key));
    }

    /**
     * Converts a value into a useful string representation.
     * @param value The value to format.
     * @returns A string representation of the value.
     */
    protected formatValue(value: unknown): string | undefined {
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
        if (isObject(value)) {
            if (
                typeof value.toString === "function" &&
                value.toString !== Object.prototype.toString
            ) {
                return value.toString();
            }
            return JSON.stringify(value); // Pretty-print JSON if no meaningful toString()
        }

        return undefined;
    }
}

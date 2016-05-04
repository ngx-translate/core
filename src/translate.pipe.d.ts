import { PipeTransform, EventEmitter, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { TranslateService, LangChangeEvent } from './translate.service';
export declare class TranslatePipe implements PipeTransform, OnDestroy {
    private translate;
    private _ref;
    value: string;
    lastKey: string;
    lastParams: any[];
    onLangChange: EventEmitter<LangChangeEvent>;
    constructor(translate: TranslateService, _ref: ChangeDetectorRef);
    /**
     * @name equals
     *
     * @description
     * Determines if two objects or two values are equivalent.
     *
     * Two objects or values are considered equivalent if at least one of the following is true:
     *
     * * Both objects or values pass `===` comparison.
     * * Both objects or values are of the same type and all of their properties are equal by
     *   comparing them with `equals`.
     *
     * @param {*} o1 Object or value to compare.
     * @param {*} o2 Object or value to compare.
     * @returns {boolean} True if arguments are equal.
     */
    private equals(o1, o2);
    updateValue(key: string, interpolateParams?: Object): void;
    transform(query: string, ...args: any[]): any;
    /**
     * Clean any existing subscription to onLangChange events
     * @private
     */
    _dispose(): void;
    ngOnDestroy(): void;
}

import {PipeTransform, Pipe, Injectable} from 'angular2/core';
import {TranslateService} from './translate.service';

@Injectable()
@Pipe({
    name: 'translate',
    pure: false // required to update the value when the promise is resolved
})
export class TranslatePipe implements PipeTransform {
    translate: TranslateService;
    value: string = '';
    lastKey: string;

    constructor(translate: TranslateService) {
        this.translate = translate;
    }

    updateValue(key: string, interpolateParams?: Object) {
        this.translate.get(key, interpolateParams).subscribe((res: string) => {
            this.value = res ? res : key;
        });
    }

    transform(query: string, args: any[]): any {
        if (query.length === 0) {
            return query;
        }
        // if we ask another time for the same key, return the last value
        if (this.lastKey && query === this.lastKey) {
            return this.value;
        }

        var interpolateParams: Object;
        if(args.length && args[0] !== null) {
            if(typeof args[0] === 'string' && args[0].length) {
                // we accept objects written in the template such as {n:1},
                // which is why we might need to change it to real JSON objects such as {"n":1}
                try {
                    interpolateParams = JSON.parse(args[0].replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2": '));
                } catch(e) {
                    throw new SyntaxError(`Wrong parameter in TranslatePipe. Expected a valid Object, received: ${args[0]}`);
                }
            } else if(typeof args[0] === 'object' && !Array.isArray(args[0])) {
                interpolateParams = args[0];
            }
        }

        // store the query, in case it changes
        this.lastKey = query;

        // set the value
        this.updateValue(query, interpolateParams);

        // subscribe to onLangChange event, in case the language changes
        this.translate.onLangChange.subscribe((params: {lang: string, translations: any}) => {
            this.updateValue(query, interpolateParams);
        });

        return this.value;
    }
}

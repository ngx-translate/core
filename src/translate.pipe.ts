import {PipeTransform, Pipe, Injectable} from 'angular2/angular2';
import {TranslateService} from "./translate.service";

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

    updateValue(key) {
        this.translate.get(key).toPromise().then((res: string) => {
            this.value = res;
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
        // store the query, in case it changes
        this.lastKey = query;

        // set the value
        this.updateValue(query);

        // subscribe to onLanguageChange event, in case the language changes
        this.translate.currentLoader.onLanguageChange.observer({
            next: res => {
                this.updateValue(query);
            }
        });

        return this.value;
    }
}

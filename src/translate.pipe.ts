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

    transform(query: string, args: any[]): any {
        if (query.length === 0) {
            return query;
        }
        if (this.lastKey && query === this.lastKey) {
            return this.value;
        }
        this.lastKey = query;
        this.translate.get(query).then((res: string) => {
            this.value = res;
        });

        return this.value;
    }
}

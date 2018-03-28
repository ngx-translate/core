import {Injectable} from "@angular/core";
import {Observable, of} from "rxjs";

export abstract class TranslateLoader {
  abstract getTranslation(lang: string): Observable<any>;
}

/**
 * This loader is just a placeholder that does nothing, in case you don't need a loader at all
 */
@Injectable()
export class TranslateFakeLoader extends TranslateLoader {
  getTranslation(lang: string): Observable<any> {
    return of({});
  }
}

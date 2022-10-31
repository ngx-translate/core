import { Injectable } from "@angular/core";
import { TranslateService } from "./translate.service";
import { Observable, zip } from "rxjs";
import { map } from "rxjs/operators";
 
@Injectable()
export class TranslateContextService extends TranslateService {
 
  params = {};
  namespace: string | null = null;
 
  parentContext!: TranslateContextService | TranslateService;
 
  public override get(key: string | Array<string>, interpolateParams?: any | undefined): Observable<any> {
 
    const paramsWithContext = {...this.params, ...interpolateParams};
 
    let result$ = this.parentContext.get(key, paramsWithContext);
 
    if(this.namespace) {
      const namespacedKey = `${this.namespace}.${key}`;
 
      result$ = zip(result$, this.parentContext.get(namespacedKey, paramsWithContext)).pipe(
        map( ([label, namespacedLabel]) => namespacedLabel === namespacedKey ? label : namespacedLabel )
      );
    }
 
    return result$;
  }
 
}

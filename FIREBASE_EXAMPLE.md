## Example: Custom loader for translations stored in Firebase Real-time Database

Dependency: [angularfire2](https://github.com/angular/angularfire2)

## FirebaseTransLoader

```ts
import { TranslateLoader } from '@ngx-translate/core';
import { Observable } from 'rxjs/Observable';
import { AngularFireDatabase} from 'angularfire2/database';

export class FirebaseTransLoader implements TranslateLoader {
	constructor(private db: AngularFireDatabase) {}
	public getTranslation(lang: string, prefix: string = 'translations/'): any {
		return this.db.object(`${prefix}${lang}`) as Observable<any>;
	}
}
```

## app.module
```ts
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { AngularFireModule } from 'angularfire2';
import { environment } from '../environments/environment';
import { AngularFireDatabaseModule } from 'angularfire2/database';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { FirebaseTransLoader } from './shared/firebase-trans-loader';
import { AngularFireDatabase, FirebaseObjectObservable } from 'angularfire2/database';

export function FbTransLoaderFactory(db: AngularFireDatabase) {
  return new FirebaseTransLoader(db);
}

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireDatabaseModule, 
    TranslateModule.forRoot({ 
      loader: { provide: TranslateLoader, useFactory: FbTransLoaderFactory, deps: [AngularFireDatabase] }
    })
  ],
  providers: [],
	bootstrap: [AppComponent]
})
export class AppModule { }
```

In this example `FirebaseTransLoader`  has an optional parameter:
- prefix: string = "translations/"


By using the default parameter, it will load your translations for the lang "en" from the Firebase database path: `translations/en`.

You can change the prefix in the `FbTransLoaderFactory` method that we just defined. For example if you want to load the "en" translations from `config/locales/en` you would use:

```ts
export function FbTransLoaderFactory(db: AngularFireDatabase) {
  return new FirebaseTransLoader(db, "config/locales/");
}
```

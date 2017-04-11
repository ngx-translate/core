import {Component, ChangeDetectionStrategy} from '@angular/core';
import {TranslateService} from 'ng2-translate/ng2-translate';

@Component({
    selector: 'my-app',
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <a [routerLink]="['']">Home</a>
        <a [routerLink]="['lazy']">Lazy loaded view</a>
        <router-outlet></router-outlet>
  `,
})
export class AppComponent {
    constructor(private translate: TranslateService) {
        translate.addLangs(["en", "fr"]);
        translate.setDefaultLang('en');

        let browserLang: string = translate.getBrowserLang();
        translate.use(browserLang.match(/en|fr/) ? browserLang : 'en');
    }
}

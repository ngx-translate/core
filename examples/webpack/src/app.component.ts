import {Component, ChangeDetectionStrategy} from '@angular/core';
import {TranslateService} from 'ng2-translate/ng2-translate';

@Component({
    selector: 'my-app',
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <div>
      <h2>{{ 'HOME.TITLE' | translate }}</h2>
      <label>
        {{ 'HOME.SELECT' | translate }}
        <select #langSelect (change)="translate.use(langSelect.value)">
          <option *ngFor="let lang of translate.getLangs()" [value]="lang" [selected]="lang === translate.currentLang">{{ lang }}</option>
        </select>
      </label>
    </div>
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

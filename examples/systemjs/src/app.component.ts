import {Component, OnInit} from '@angular/core';
import {TranslateService} from 'ng2-translate';

@Component({
    selector: 'my-app',
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
export class AppComponent implements OnInit {
    constructor(private translate: TranslateService) { }
  
    ngOnInit() {
        this.translate.addLangs(["en", "fr"]);
        this.translate.setDefaultLang('en');

        const browserLang = this.translate.getBrowserLang();
        this.translate.use(browserLang.match(/en|fr/) ? browserLang : 'en');
    }
}

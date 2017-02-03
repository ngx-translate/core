import {Component, ChangeDetectionStrategy} from '@angular/core';
import {TranslateService} from 'ng2-translate/ng2-translate';

@Component({
    selector: 'home',
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <h2>{{ 'HOME.TITLE' | translate }}</h2>
        <label>
            {{ 'HOME.SELECT' | translate }}
            <select #langSelect (change)="translate.use(langSelect.value)">
                <option *ngFor="let lang of translate.getLangs()" [value]="lang" [selected]="lang === translate.currentLang">{{ lang }}</option>
            </select>
        </label>
    `,
})
export class HomeComponent {
    constructor(public translate: TranslateService) {
    }
}

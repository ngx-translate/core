import { Component } from '@angular/core';
import { TranslateService, LangChangeEvent } from '@ngx-translate/core';
import { IonicPage, NavController } from 'ionic-angular';

@IonicPage()
@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  langs = ['en', 'fr', 'es'];

  constructor(public navCtrl: NavController, public translate: TranslateService) {
    this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      console.log('Language changed to ' + this.translate.currentLang);
    });
  }

}

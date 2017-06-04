import { Component } from '@angular/core';
import { IonicPage, NavController } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';

@IonicPage()
@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  langs = ['en', 'fr', 'es'];

  constructor(public navCtrl: NavController, public translate: TranslateService) {

  }

}

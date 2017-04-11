import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  langs = ['en', 'fr', 'es'];

  constructor(public navCtrl: NavController, public translate: TranslateService) {

  }

}

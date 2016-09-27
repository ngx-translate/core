import {Component} from '@angular/core';
import {NavController} from 'ionic-angular';
import {TranslatePipe, TranslateService} from "ng2-translate";

@Component({
  templateUrl: 'build/pages/home/home.html',
  pipes: [TranslatePipe]
})
export class HomePage {
  langs = ['en', 'fr'];

  constructor(private navCtrl: NavController, private translate: TranslateService) {

  }
}

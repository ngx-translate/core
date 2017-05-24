import { Component } from '@angular/core';
import { Platform } from 'ionic-angular';
import { StatusBar, Splashscreen } from 'ionic-native';
import { TranslateService } from 'ng2-translate';

import { TabsPage } from '../pages/tabs/tabs';


@Component({
  template: `<ion-nav [root]="rootPage"></ion-nav>`
})
export class MyApp {

  rootPage = TabsPage;

  constructor(platform: Platform, translate: TranslateService) {
    platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      StatusBar.styleDefault();
      Splashscreen.hide();
      // this language will be used as a fallback when a translation isn't found in the current language
      translate.setDefaultLang('en');
      
      // Set Platform Language
       let userLang = navigator.language.split('-')[0]; // use navigator lang if available
       userLang = /(de|en|fr|es)/gi.test(userLang) ? userLang : 'en'; // Set default do en if no other language could be found
       translate.use(userLang);
    });
  }

}

import {Component} from '@angular/core';
import {Platform, ionicBootstrap} from 'ionic-angular';
import {StatusBar} from 'ionic-native';
import {TabsPage} from './pages/tabs/tabs';
import {TranslateService, TranslateLoader, TranslateStaticLoader} from "ng2-translate";
import {Http} from "@angular/http";


@Component({
  template: '<ion-nav [root]="rootPage"></ion-nav>',
  providers: [
    {
      provide: TranslateLoader,
      useFactory: (http: Http) => new TranslateStaticLoader(http, 'i18n', '.json'),
      deps: [Http]
    },
    TranslateService
  ]
})
export class MyApp {

  private rootPage: any;

  constructor(private platform: Platform, private translate: TranslateService) {
    this.rootPage = TabsPage;

    platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      StatusBar.styleDefault();

      translate.setDefaultLang('en');

      translate.use('en');
    });
  }
}

ionicBootstrap(MyApp);

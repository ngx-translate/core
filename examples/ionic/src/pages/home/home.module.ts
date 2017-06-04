import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { HomePage } from './home';

import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  declarations: [
    HomePage,
  ],
  imports: [
    IonicPageModule.forChild(HomePage),
    TranslateModule.forChild()
  ],
  exports: [
    HomePage
  ]
})
export class AboutPageModule { }

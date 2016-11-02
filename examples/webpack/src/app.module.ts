import {HttpModule} from '@angular/http';
import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {TranslateModule} from 'ng2-translate';
import {AppComponent} from './app.component';

@NgModule({
    imports: [
        BrowserModule,
        HttpModule,
        TranslateModule.forRoot()
    ],
    declarations: [AppComponent],
    bootstrap: [AppComponent]
})
export class AppModule {
}

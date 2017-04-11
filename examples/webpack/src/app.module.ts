import {HttpModule} from "@angular/http";
import {BrowserModule} from "@angular/platform-browser";
import {NgModule} from "@angular/core";
import {TranslateModule} from "ng2-translate/ng2-translate";
import {AppComponent} from "./app.component";
import {RouterModule} from "@angular/router";
import {HomeComponent} from "./home.component";

@NgModule({
    imports: [
        BrowserModule,
        HttpModule,
        RouterModule.forRoot([
            {path: '', component: HomeComponent},
            {path: 'lazy', loadChildren: './lazy/lazy.module#LazyModule'}
        ]),
        TranslateModule.forRoot()
    ],
    declarations: [AppComponent, HomeComponent],
    bootstrap: [AppComponent]
})
export class AppModule {
}

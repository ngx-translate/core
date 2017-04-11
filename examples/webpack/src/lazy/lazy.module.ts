import {HttpModule} from "@angular/http";
import {NgModule} from "@angular/core";
import {TranslateModule} from "ng2-translate/ng2-translate";
import {RouterModule} from "@angular/router";
import {LazyComponent} from "./lazy.component";
import {CommonModule} from "@angular/common";

@NgModule({
    imports: [
        CommonModule,
        HttpModule,
        RouterModule.forChild([
            { path: '', children: [
                { path: '', component: LazyComponent }
            ]},
        ]),
        TranslateModule
    ],
    declarations: [LazyComponent]
})
export class LazyModule {
}

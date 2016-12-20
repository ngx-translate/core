import {Component, ViewChild, ElementRef} from '@angular/core';
import {TestBed, ComponentFixture, getTestBed} from '@angular/core/testing';
import {HttpModule} from '@angular/http';
import {Injector, Injectable, ChangeDetectionStrategy, ViewContainerRef} from '@angular/core';
import {TranslateService} from '../src/translate.service';
import {TranslateModule} from '../index';

@Injectable()
@Component({
    selector: 'hmx-app',
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div #noKey translate>TEST</div>
        <div #withKey [translate]="'TEST'">Some init content</div>
        <div #withOtherElements translate>TEST1 <span>Hey</span> TEST2</div>
        <div #withParams [translate]="'TEST'" [translateParams]="{value: 'ok'}">Some init content</div>
        <div #withParamsNoKey translate [translateParams]="{value: 'ok'}">TEST</div>
    `
})
class App {
    viewContainerRef: ViewContainerRef;
    @ViewChild('noKey') noKey: ElementRef;
    @ViewChild('withKey') withKey: ElementRef;
    @ViewChild('withOtherElements') withOtherElements: ElementRef;
    @ViewChild('withParams') withParams: ElementRef;
    @ViewChild('withParamsNoKey') withParamsNoKey: ElementRef;

    constructor(viewContainerRef: ViewContainerRef) {
        this.viewContainerRef = viewContainerRef;
    }
}

describe('TranslateDirective', () => {
    let injector: Injector;
    let translate: TranslateService;
    let fixture: ComponentFixture<App>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpModule, TranslateModule.forRoot()],
            declarations: [App]
        });
        injector = getTestBed();
        translate = injector.get(TranslateService);

        fixture = (<any>TestBed).createComponent(App);
        fixture.detectChanges();
    });

    afterEach(() => {
        injector = undefined;
        translate = undefined;
        fixture = undefined;
    });

    it('should translate a string using the container value', () => {
        expect(fixture.componentInstance.noKey.nativeElement.innerHTML).toEqual('TEST');

        translate.setTranslation('en', {"TEST": "This is a test"});
        translate.use('en');

        expect(fixture.componentInstance.noKey.nativeElement.innerHTML).toEqual('This is a test');
    });

    it('should translate a string using the key value', () => {
        // replace the content with the key
        expect(fixture.componentInstance.withKey.nativeElement.innerHTML).toEqual('TEST');

        translate.setTranslation('en', {"TEST": "This is a test"});
        translate.use('en');

        expect(fixture.componentInstance.withKey.nativeElement.innerHTML).toEqual('This is a test');
    });

    it('should translate first child strings with elements in the middle', () => {
        // replace the content with the key
        expect(fixture.componentInstance.withOtherElements.nativeElement.innerHTML).toEqual('TEST1 <span>Hey</span> TEST2');

        translate.setTranslation('en', {"TEST1": "Awesome", "TEST2": "it works"});
        translate.use('en');

        expect(fixture.componentInstance.withOtherElements.nativeElement.innerHTML).toEqual('Awesome <span>Hey</span> it works');
    });

    it('should translate a string with params and a key', () => {
        // replace the content with the key
        expect(fixture.componentInstance.withParams.nativeElement.innerHTML).toEqual('TEST');

        translate.setTranslation('en', {"TEST": "It is {{value}}"});
        translate.use('en');

        expect(fixture.componentInstance.withParams.nativeElement.innerHTML).toEqual('It is ok');
    });

    it('should translate a string with params and no key', () => {
        // replace the content with the key
        expect(fixture.componentInstance.withParamsNoKey.nativeElement.innerHTML).toEqual('TEST');

        translate.setTranslation('en', {"TEST": "It is {{value}}"});
        translate.use('en');

        expect(fixture.componentInstance.withParamsNoKey.nativeElement.innerHTML).toEqual('It is ok');
    });

    it('should update the DOM when the lang changes', () => {
        expect(fixture.componentInstance.noKey.nativeElement.innerHTML).toEqual('TEST');

        translate.setTranslation('en', {"TEST": "This is a test"});
        translate.setTranslation('fr', {"TEST": "C'est un test"});

        translate.use('en');
        expect(fixture.componentInstance.noKey.nativeElement.innerHTML).toEqual('This is a test');

        translate.use('fr');
        expect(fixture.componentInstance.noKey.nativeElement.innerHTML).toEqual("C'est un test");
    });

    // Test (temporarily) disabled as the directive tests manipulate the DOM manually which breaks this test.
    // https://github.com/ocombe/ng2-translate/pull/336
    it('should update the DOM when the default lang changes', () => {
        expect(fixture.componentInstance.noKey.nativeElement.innerHTML).toEqual('TEST');

        translate.setTranslation('en', {"TEST": "This is a test"});
        translate.setTranslation('fr', {"TEST": "C'est un test"});
        translate.setDefaultLang('en');
        expect(fixture.componentInstance.noKey.nativeElement.innerHTML).toEqual('This is a test');

        translate.setDefaultLang('fr');
        expect(fixture.componentInstance.noKey.nativeElement.innerHTML).toEqual("C'est un test");
    });

    it('should unsubscribe from lang change subscription on destroy', () => {
        expect(fixture.componentInstance.withParamsNoKey.nativeElement.innerHTML).toEqual('TEST');

        fixture.destroy();

        translate.setTranslation('en', {"TEST": "This is a test"});
        translate.use('en');

        expect(fixture.componentInstance.withParamsNoKey.nativeElement.innerHTML).toEqual('TEST');
    });

    it('should unsubscribe from default lang change subscription on destroy', () => {
        expect(fixture.componentInstance.withParamsNoKey.nativeElement.innerHTML).toEqual('TEST');

        fixture.destroy();

        translate.setTranslation('en', {"TEST": "This is a test"});
        translate.setDefaultLang('en');

        expect(fixture.componentInstance.withParamsNoKey.nativeElement.innerHTML).toEqual('TEST');
    });
});

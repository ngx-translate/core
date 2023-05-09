import {ChangeDetectionStrategy, Component, ElementRef, Injectable, ViewChild, ViewContainerRef} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {TranslateModule, TranslateService} from '../public-api';

@Injectable()
@Component({
  selector: 'hmx-app',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div #noKey translate>TEST</div>
    <div #contentAsKey translate>TEST.VALUE</div>
    <div #withKey [translate]="'TEST'">Some init content</div>
    <div #noContent [translate]="'TEST'"></div>
    <div #withOtherElements translate>TEST1 <span>Hey</span> TEST2</div>
    <div #withParams [translate]="'TEST'" [translateParams]="value">Some init content</div>
    <div #withParamsNoKey translate [translateParams]="value">TEST</div>
    <div #leadingSpaceNoKeyNoParams translate> TEST</div>
    <div #trailingSpaceNoKeyNoParams translate>TEST </div>
    <div #withSpaceAndLineBreakNoKeyNoParams translate>
      TEST
    </div>
  `
})
class AppComponent {
  viewContainerRef: ViewContainerRef;
  @ViewChild('noKey', {static: true}) noKey!: ElementRef;
  @ViewChild('contentAsKey', {static: true}) contentAsKey!: ElementRef;
  @ViewChild('withKey', {static: true}) withKey!: ElementRef;
  @ViewChild('withOtherElements', {static: true}) withOtherElements!: ElementRef;
  @ViewChild('withParams', {static: true}) withParams!: ElementRef;
  @ViewChild('withParamsNoKey', {static: true}) withParamsNoKey!: ElementRef;
  @ViewChild('noContent', {static: true}) noContent!: ElementRef;
  @ViewChild('leadingSpaceNoKeyNoParams') leadingSpaceNoKeyNoParams!: ElementRef;
  @ViewChild('trailingSpaceNoKeyNoParams') trailingSpaceNoKeyNoParams!: ElementRef;
  @ViewChild('withSpaceAndLineBreakNoKeyNoParams') withSpaceAndLineBreakNoKeyNoParams!: ElementRef;
  value = {value: 'ok'};

  constructor(viewContainerRef: ViewContainerRef) {
    this.viewContainerRef = viewContainerRef;
  }
}

describe('TranslateDirective', () => {
  let translate: TranslateService;
  let fixture: ComponentFixture<AppComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot()
      ],
      declarations: [AppComponent]
    });
    translate = TestBed.inject(TranslateService);

    fixture = (<any>TestBed).createComponent(AppComponent);
    fixture.detectChanges();
  });

  it('should translate a string using the container value', () => {
    expect(fixture.componentInstance.noKey.nativeElement.innerHTML).toEqual('TEST');

    translate.setTranslation('en', {"TEST": "This is a test"});
    translate.use('en');

    expect(fixture.componentInstance.noKey.nativeElement.innerHTML).toEqual('This is a test');
  });

  it('should translate a string using the container value as a key', () => {
    expect(fixture.componentInstance.contentAsKey.nativeElement.innerHTML).toEqual('TEST.VALUE');

    translate.setTranslation('en', {"TEST": {"VALUE": "This is a test"}});
    translate.use('en');

    expect(fixture.componentInstance.contentAsKey.nativeElement.innerHTML).toEqual('This is a test');
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

  it('should translate first child strings without recursion', () => {
    // replace the content with the key
    expect(fixture.componentInstance.withOtherElements.nativeElement.innerHTML).toEqual('TEST1 <span>Hey</span> TEST2');

    translate.setTranslation('en', {"TEST1": "TEST2", "TEST2": "it works"});
    translate.use('en');

    expect(fixture.componentInstance.withOtherElements.nativeElement.innerHTML).toEqual('TEST2 <span>Hey</span> it works');
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

  it('should update the translation when params change', () => {
    // replace the content with the key
    expect(fixture.componentInstance.withParams.nativeElement.innerHTML).toEqual('TEST');
    expect(fixture.componentInstance.withParamsNoKey.nativeElement.innerHTML).toEqual('TEST');

    translate.setTranslation('en', {"TEST": "It is {{value}}"});
    translate.use('en');

    expect(fixture.componentInstance.withParams.nativeElement.innerHTML).toEqual('It is ok');
    expect(fixture.componentInstance.withParamsNoKey.nativeElement.innerHTML).toEqual('It is ok');
    fixture.componentInstance.value = {value: 'changed'};
    fixture.detectChanges();

    expect(fixture.componentInstance.withParams.nativeElement.innerHTML).toEqual('It is changed');
    expect(fixture.componentInstance.withParamsNoKey.nativeElement.innerHTML).toEqual('It is changed');
  });

  it('should update the DOM when the lang changes and the translation key starts with space', () => {
    expect(fixture.componentInstance.leadingSpaceNoKeyNoParams.nativeElement.innerHTML).toEqual(' TEST');

    const en = "This is a test - with leading spaces in translation key";
    const fr = "C'est un test - avec un espace de tête dans la clé de traduction";
    const leadingSpaceFromKey = ' ';
    translate.setTranslation('en', {"TEST": en});
    translate.setTranslation('fr', {"TEST": fr});

    translate.use('en');
    expect(fixture.componentInstance.leadingSpaceNoKeyNoParams.nativeElement.innerHTML).toEqual(leadingSpaceFromKey + en);

    translate.use('fr');
    expect(fixture.componentInstance.leadingSpaceNoKeyNoParams.nativeElement.innerHTML).toEqual(leadingSpaceFromKey + fr);
  });

  it('should update the DOM when the lang changes and the translation key has line breaks and spaces', () => {
    expect(fixture.componentInstance.withSpaceAndLineBreakNoKeyNoParams.nativeElement.innerHTML).toEqual(' TEST ');

    const en = "This is a test - with trailing spaces in translation key";
    const fr = "C'est un test - avec un espace de fuite dans la clé de traduction";
    const whiteSpaceFromKey = ' ';
    translate.setTranslation('en', {"TEST": en});
    translate.setTranslation('fr', {"TEST": fr});

    translate.use('en');
    expect(fixture.componentInstance.withSpaceAndLineBreakNoKeyNoParams.nativeElement.innerHTML).toEqual(whiteSpaceFromKey + en + whiteSpaceFromKey);

    translate.use('fr');
    expect(fixture.componentInstance.withSpaceAndLineBreakNoKeyNoParams.nativeElement.innerHTML).toEqual(whiteSpaceFromKey + fr + whiteSpaceFromKey);
  });

  it('should update the DOM when the lang changes and the translation key ends with space', () => {
    expect(fixture.componentInstance.trailingSpaceNoKeyNoParams.nativeElement.innerHTML).toEqual('TEST ');

    const en = "This is a test - with spaces and line breaks in translation key";
    const fr = "C'est un test - avec des espaces et sauts de lignes dans la clé de traduction";
    const trailingSpaceFromKey = ' ';
    translate.setTranslation('en', {"TEST": en});
    translate.setTranslation('fr', {"TEST": fr});

    translate.use('en');
    expect(fixture.componentInstance.trailingSpaceNoKeyNoParams.nativeElement.innerHTML).toEqual(en + trailingSpaceFromKey);

    translate.use('fr');
    expect(fixture.componentInstance.trailingSpaceNoKeyNoParams.nativeElement.innerHTML).toEqual(fr + trailingSpaceFromKey);
  });

  it('should update the DOM when the lang changes', () => {
    expect(fixture.componentInstance.noKey.nativeElement.innerHTML).toEqual('TEST');
    expect(fixture.componentInstance.withParams.nativeElement.innerHTML).toEqual('TEST');
    expect(fixture.componentInstance.noContent.nativeElement.innerHTML).toEqual('TEST');

    translate.setTranslation('en', {"TEST": "This is a test"});
    translate.setTranslation('fr', {"TEST": "C'est un test"});

    translate.use('en');
    expect(fixture.componentInstance.noKey.nativeElement.innerHTML).toEqual('This is a test');
    expect(fixture.componentInstance.withParams.nativeElement.innerHTML).toEqual('This is a test');
    expect(fixture.componentInstance.noContent.nativeElement.innerHTML).toEqual('This is a test');

    translate.use('fr');
    expect(fixture.componentInstance.noKey.nativeElement.innerHTML).toEqual("C'est un test");
    expect(fixture.componentInstance.withParams.nativeElement.innerHTML).toEqual("C'est un test");
    expect(fixture.componentInstance.noContent.nativeElement.innerHTML).toEqual("C'est un test");
  });

  it('should update the DOM when the lang changes and the translation ends with space', () => {
    expect(fixture.componentInstance.noKey.nativeElement.innerHTML).toEqual('TEST');
    expect(fixture.componentInstance.withParams.nativeElement.innerHTML).toEqual('TEST');
    expect(fixture.componentInstance.noContent.nativeElement.innerHTML).toEqual('TEST');

    const en = "  This is a test - with spaces ";
    const fr = "  C'est un test - avec espaces ";

    translate.setTranslation('en', {"TEST": en});
    translate.setTranslation('fr', {"TEST": fr});

    translate.use('en');
    expect(fixture.componentInstance.noKey.nativeElement.innerHTML).toEqual(`${en}`);
    expect(fixture.componentInstance.withParams.nativeElement.innerHTML).toEqual(en);
    expect(fixture.componentInstance.noContent.nativeElement.innerHTML).toEqual(en);

    translate.use('fr');
    expect(fixture.componentInstance.noKey.nativeElement.innerHTML).toEqual(`${fr}`);
    expect(fixture.componentInstance.withParams.nativeElement.innerHTML).toEqual(fr);
    expect(fixture.componentInstance.noContent.nativeElement.innerHTML).toEqual(fr);
  });

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

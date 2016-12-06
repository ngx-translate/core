import {TranslatePipe} from '../src/translate.pipe';
import {TranslateService, TranslateModule} from "./../ng2-translate";
import {ResponseOptions, Response, XHRBackend, HttpModule} from "@angular/http";
import {
    Component, Injector, ChangeDetectorRef, ChangeDetectionStrategy, Injectable,
    ViewContainerRef
} from "@angular/core";
import {LangChangeEvent, TranslationChangeEvent, DefaultLangChangeEvent} from "../src/translate.service";
import {getTestBed, TestBed} from "@angular/core/testing";
import {MockConnection, MockBackend} from "@angular/http/testing";

class FakeChangeDetectorRef extends ChangeDetectorRef {
    markForCheck(): void {}

    detach(): void {}

    detectChanges(): void {}

    checkNoChanges(): void {}

    reattach(): void {}
}

@Injectable()
@Component({
    selector: 'hmx-app',
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `{{'TEST' | translate}}`
})
class App {
    viewContainerRef: ViewContainerRef;

    constructor(viewContainerRef: ViewContainerRef) {
        this.viewContainerRef = viewContainerRef;
    }
}

const mockBackendResponse = (connection: MockConnection, response: string) => {
    connection.mockRespond(new Response(new ResponseOptions({body: response})));
};

describe('TranslatePipe', () => {
    let injector: Injector;
    let backend: MockBackend;
    let translate: TranslateService;
    let connection: MockConnection; // this will be set when a new connection is emitted from the backend.
    let translatePipe: TranslatePipe;
    let ref: any;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpModule, TranslateModule.forRoot()],
            declarations: [App],
            providers: [
                {provide: XHRBackend, useClass: MockBackend}
            ]
        });
        injector = getTestBed();
        backend = injector.get(XHRBackend);
        translate = injector.get(TranslateService);
        // sets the connection when someone tries to access the backend with an xhr request
        backend.connections.subscribe((c: MockConnection) => connection = c);

        ref = new FakeChangeDetectorRef();
        translatePipe = new TranslatePipe(translate, ref);
    });

    afterEach(() => {
        injector = undefined;
        backend = undefined;
        translate = undefined;
        connection = undefined;
        translatePipe = undefined;
        ref = undefined;
    });

    it('is defined', () => {
        expect(TranslatePipe).toBeDefined();
        expect(translatePipe).toBeDefined();
        expect(translatePipe instanceof TranslatePipe).toBeTruthy();
    });

    it('should translate a string', () => {
        translate.setTranslation('en', {"TEST": "This is a test"});
        translate.use('en');

        expect(translatePipe.transform('TEST')).toEqual("This is a test");
    });

    it('should call markForChanges when it translates a string', () => {
        translate.setTranslation('en', {"TEST": "This is a test"});
        translate.use('en');
        spyOn(ref, 'markForCheck').and.callThrough();

        translatePipe.transform('TEST');
        expect(ref.markForCheck).toHaveBeenCalled();
    });

    it('should translate a string with object parameters', () => {
        translate.setTranslation('en', {"TEST": "This is a test {{param}}"});
        translate.use('en');

        expect(translatePipe.transform('TEST', {param: "with param"})).toEqual("This is a test with param");
    });

    it('should translate a string with object as string parameters', () => {
        translate.setTranslation('en', {"TEST": "This is a test {{param}}"});
        translate.use('en');

        expect(translatePipe.transform('TEST', '{param: "with param"}')).toEqual("This is a test with param");
        expect(translatePipe.transform('TEST', '{"param": "with param"}')).toEqual("This is a test with param");
        expect(translatePipe.transform('TEST', "{param: 'with param'}")).toEqual("This is a test with param");
        expect(translatePipe.transform('TEST', "{'param' : 'with param'}")).toEqual("This is a test with param");
    });

    it('should translate a string with object as multiple string parameters', () => {
        translate.setTranslation('en', {"TEST": "This is a test {{param1}} {{param2}}"});
        translate.use('en');

        expect(translatePipe.transform('TEST', '{param1: "with param-1", param2: "and param-2"}'))
            .toEqual("This is a test with param-1 and param-2");
        expect(translatePipe.transform('TEST', '{"param1": "with param-1", "param2": "and param-2"}'))
            .toEqual("This is a test with param-1 and param-2");
        expect(translatePipe.transform('TEST', "{param1: 'with param-1', param2: 'and param-2'}"))
            .toEqual("This is a test with param-1 and param-2");
        expect(translatePipe.transform('TEST', "{'param1' : 'with param-1', 'param2': 'and param-2'}"))
            .toEqual("This is a test with param-1 and param-2");
    });

    it('should translate a string with object as nested string parameters', () => {
        translate.setTranslation('en', {"TEST": "This is a test {{param.one}} {{param.two}}"});
        translate.use('en');

        expect(translatePipe.transform('TEST', '{param: {one: "with param-1", two: "and param-2"}}'))
            .toEqual("This is a test with param-1 and param-2");
        expect(translatePipe.transform('TEST', '{"param": {"one": "with param-1", "two": "and param-2"}}'))
            .toEqual("This is a test with param-1 and param-2");
        expect(translatePipe.transform('TEST', "{param: {one: 'with param-1', two: 'and param-2'}}"))
            .toEqual("This is a test with param-1 and param-2");
        expect(translatePipe.transform('TEST', "{'param' : {'one': 'with param-1', 'two': 'and param-2'}}"))
            .toEqual("This is a test with param-1 and param-2");
    });

    it('should update the value when the parameters change', () => {
        translate.setTranslation('en', {"TEST": "This is a test {{param}}"});
        translate.use('en');

        spyOn(translatePipe, 'updateValue').and.callThrough();
        spyOn(ref, 'markForCheck').and.callThrough();

        expect(translatePipe.transform('TEST', {param: "with param"})).toEqual("This is a test with param");
        // same value, shouldn't call 'updateValue' again
        expect(translatePipe.transform('TEST', {param: "with param"})).toEqual("This is a test with param");
        // different param, should call 'updateValue'
        expect(translatePipe.transform('TEST', {param: "with param2"})).toEqual("This is a test with param2");
        expect(translatePipe.updateValue).toHaveBeenCalledTimes(2);
        expect(ref.markForCheck).toHaveBeenCalledTimes(2);
    });

    it("should throw if you don't give an object parameter", () => {
        translate.setTranslation('en', {"TEST": "This is a test {{param}}"});
        translate.use('en');
        let param = 'param: "with param"';

        expect(() => {
            translatePipe.transform('TEST', param);
        }).toThrowError(`Wrong parameter in TranslatePipe. Expected a valid Object, received: ${param}`);
    });

    describe('should update translations on translation by key change', () => {
        it('with static loader', (done) => {
            translate.setTranslation('en', {"TEST": "This is a test"});
            translate.use('en');

            expect(translatePipe.transform('TEST')).toEqual("This is a test");

            // this will be resolved at the next key's translation change
            let subscription = translate.onTranslationChange.subscribe(
                (res: TranslationChangeEvent) => {
                    expect(res.translations['TEST']).toBeDefined();
                    expect(res.translations['TEST']).toEqual("This is new test value");
                    expect(translatePipe.transform('TEST')).toEqual("This is new test value");
                    subscription.unsubscribe();
                    done();
                });

            translate.set('TEST', 'This is new test value', 'en');
        });
    });

    describe('should update translations on lang change', () => {
        it('with static loader', (done) => {
            translate.setTranslation('en', {"TEST": "This is a test"});
            translate.setTranslation('fr', {"TEST": "C'est un test"});
            translate.use('en');

            expect(translatePipe.transform('TEST')).toEqual("This is a test");

            // this will be resolved at the next lang change
            let subscription = translate.onLangChange.subscribe((res: LangChangeEvent) => {
                expect(res.lang).toEqual('fr');
                expect(translatePipe.transform('TEST')).toEqual("C'est un test");
                subscription.unsubscribe();
                done();
            });

            translate.use('fr');
        });

        it('with file loader', (done) => {
            translate.use('en');
            mockBackendResponse(connection, '{"TEST": "This is a test"}');
            expect(translatePipe.transform('TEST')).toEqual("This is a test");

            // this will be resolved at the next lang change
            let subscription = translate.onLangChange.subscribe((res: LangChangeEvent) => {
                // let it update the translations
                setTimeout(() => {
                    expect(res.lang).toEqual('fr');
                    expect(translatePipe.transform('TEST')).toEqual("C'est un test");
                    subscription.unsubscribe();
                    done();
                });
            });

            translate.use('fr');
            mockBackendResponse(connection, `{"TEST": "C'est un test"}`);
        });

        it('should detect changes with OnPush', () => {
            let fixture = (<any>TestBed).createComponent(App);
            fixture.detectChanges();
            expect(fixture.debugElement.nativeElement.innerHTML).toEqual("TEST");
            translate.use('en');
            mockBackendResponse(connection, '{"TEST": "This is a test"}');
            fixture.detectChanges();
            expect(fixture.debugElement.nativeElement.innerHTML).toEqual("This is a test");
        });
    });

    describe('should update translations on default lang change', () => {
        it('with static loader', (done) => {
            translate.setTranslation('en', {"TEST": "This is a test"});
            translate.setTranslation('fr', {"TEST": "C'est un test"});
            translate.setDefaultLang('en');

            expect(translatePipe.transform('TEST')).toEqual("This is a test");

            // this will be resolved at the next lang change
            let subscription = translate.onDefaultLangChange.subscribe((res: DefaultLangChangeEvent) => {
                expect(res.lang).toEqual('fr');
                expect(translatePipe.transform('TEST')).toEqual("C'est un test");
                subscription.unsubscribe();
                done();
            });

            translate.setDefaultLang('fr');
        });

        it('with file loader', (done) => {
            translate.setDefaultLang('en');
            mockBackendResponse(connection, '{"TEST": "This is a test"}');
            expect(translatePipe.transform('TEST')).toEqual("This is a test");

            // this will be resolved at the next lang change
            let subscription = translate.onDefaultLangChange.subscribe((res: DefaultLangChangeEvent) => {
                // let it update the translations
                setTimeout(() => {
                    expect(res.lang).toEqual('fr');
                    expect(translatePipe.transform('TEST')).toEqual("C'est un test");
                    subscription.unsubscribe();
                    done();
                });
            });

            translate.setDefaultLang('fr');
            mockBackendResponse(connection, `{"TEST": "C'est un test"}`);
        });

        it('should detect changes with OnPush', () => {
            let fixture = (<any>TestBed).createComponent(App);
            fixture.detectChanges();
            expect(fixture.debugElement.nativeElement.innerHTML).toEqual("TEST");
            translate.setDefaultLang('en');
            mockBackendResponse(connection, '{"TEST": "This is a test"}');
            fixture.detectChanges();
            expect(fixture.debugElement.nativeElement.innerHTML).toEqual("This is a test");
        });
    });
});

import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateContextDirective } from '../src/lib/translate-context.directive';
import { TranslateModule, TranslateService } from '../src/public_api';


const labels = {
  LABEL: 'context: {{param1}} {{param2}} {{param3}}',

  gc: {
    key1: 'gc.k1',
    key2: 'gc.k2',
    key3: 'gc.k3'
  },

  overrides: {
    gc: {
      key1: 'root.k1',
      key2: 'root.k2'
    }
  }

};

@Component({
  selector: 'root-component',
  template: `
    <div *translateContext="rootContext; namespace 'overrides'">
      <div class="root-with-context" translate="LABEL"></div>
      <child-component></child-component>
    </div>

  `
})
class RootComponent {
  rootContext = { param1: 'r1', param2: 'r2', param3: 'r3' };
}

@Component({
  selector: 'child-component',
  template: `
    <div class="child-no-context" translate="LABEL"></div>

    <div *translateContext="childContext">
      <div class="child-with-context" translate="LABEL"></div>
      <grandchild-component></grandchild-component>
    </div>
  `
})
class ChildComponent {
  childContext = { param2: 'c2' }
}

@Component({
  selector: 'grandchild-component',
  template: `
    <div class="grandchild-no-context" translate="LABEL"></div>

    <div *translateContext="grandchildContext">
      <div class="grandchild-with-context" translate="LABEL"></div>
    </div>


    <div class="grandchild-key1" translate="gc.key1"></div>

    <div *translateContext="{}; namespace 'gc'">
      <div class="grandchild-key2" translate="key2"></div>
      <div class="grandchild-key3" translate="key3"></div>
    </div>
  `
})
class GrandChildComponent {
  grandchildContext = { param3: 'gc3' }
}


describe('TranslateContextDirective', () => {
  let fixture: ComponentFixture<RootComponent>;
  let nativeElement: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RootComponent, ChildComponent, GrandChildComponent, TranslateContextDirective],
      imports: [TranslateModule.forRoot()]
    })
      .compileComponents();
  });

  beforeEach(() => {
    const translateService = TestBed.inject(TranslateService);
    translateService.setTranslation('en', labels);
    translateService.currentLang = 'en';

    fixture = TestBed.createComponent(RootComponent);
    fixture.detectChanges();
    nativeElement = fixture.nativeElement;
  });



  it('should provide context params for immediate view children', () => {
    expect(nativeElement.getElementsByClassName('root-with-context')[0].innerHTML).toBe('context: r1 r2 r3');
  });

  it('should inherit context params from parent component', () => {
    expect(nativeElement.getElementsByClassName('child-no-context')[0].innerHTML).toBe('context: r1 r2 r3');
  });

  it('should merge context params over inherited context', () => {
    expect(nativeElement.getElementsByClassName('child-with-context')[0].innerHTML).toBe('context: r1 c2 r3');
  });

  it('should inherit context params from parent and grand parent components', () => {
    expect(nativeElement.getElementsByClassName('grandchild-no-context')[0].innerHTML).toBe('context: r1 c2 r3');
  });

  it('should merge context params over parent and grand parent context', () => {
    expect(nativeElement.getElementsByClassName('grandchild-with-context')[0].innerHTML).toBe('context: r1 c2 gc3');
  });

  it('should prefix the key with the context namespace', () => {
    expect(nativeElement.getElementsByClassName('grandchild-key1')[0].innerHTML).toBe('root.k1');
    expect(nativeElement.getElementsByClassName('grandchild-key2')[0].innerHTML).toBe('root.k2');
    expect(nativeElement.getElementsByClassName('grandchild-key3')[0].innerHTML).toBe('gc.k3');
  });

});

import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateNamespaceDirective } from '../src/lib/translate-namespace.directive';
import { TranslateModule, TranslateService } from '../src/public_api';


const labels = {
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
    <div *translateNamespace="'overrides'">
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
    <grandchild-component></grandchild-component>
  `
})
class ChildComponent {
  childContext = { param2: 'c2' }
}

@Component({
  selector: 'grandchild-component',
  template: `
    <div class="grandchild-key1" translate="gc.key1"></div>

    <div *translateNamespace="'gc'">
      <div class="grandchild-key2" translate="key2"></div>
      <div class="grandchild-key3" translate="key3"></div>
    </div>
  `
})
class GrandChildComponent {
  grandchildContext = { param3: 'gc3' }
}


describe('TranslateNamespaceDirective', () => {
  let fixture: ComponentFixture<RootComponent>;
  let nativeElement: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RootComponent, ChildComponent, GrandChildComponent, TranslateNamespaceDirective],
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


  it('should prefix the key with the context namespace', () => {
    expect(nativeElement.getElementsByClassName('grandchild-key1')[0].innerHTML).toBe('root.k1');
    expect(nativeElement.getElementsByClassName('grandchild-key2')[0].innerHTML).toBe('root.k2');
    expect(nativeElement.getElementsByClassName('grandchild-key3')[0].innerHTML).toBe('gc.k3');
  });

});

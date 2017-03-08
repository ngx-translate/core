import {Component, ChangeDetectionStrategy} from '@angular/core';

@Component({
    selector: 'lazy',
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <h2>{{ 'LAZY' | translate }}</h2>
    `,
})
export class LazyComponent {
}

import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from "@angular/core";
import { toObservable, toSignal } from "@angular/core/rxjs-interop";
import { switchMap } from "rxjs";
import {
    TranslateService,
    TranslatePipe,
    TranslateDirective,
    TranslateBlockDirective,
} from "@ngx-translate/core";

@Component({
    selector: "app-methods-comparison",
    imports: [TranslatePipe, TranslateDirective, TranslateBlockDirective],
    template: `
        <h4><span>🔬</span> Translation Methods Comparison</h4>
        <p style="font-size: 0.875rem; color: var(--text-muted); margin-bottom: 1rem;">
            Type a name below — all five methods translate <code>{{ key() }}</code> with it.
        </p>
        <input
            type="text"
            [value]="name()"
            (input)="name.set($any($event.target).value)"
            placeholder="Enter a name..."
            class="demo-input"
        />
        <div class="method-grid">
            <div class="method-item">
                <span class="method-label pipe">Pipe</span>
                <span class="method-value">{{ key() | translate: { name: name() } }}</span>
            </div>
            <div class="method-item">
                <span class="method-label directive">Directive</span>
                <span
                    class="method-value"
                    [translate]="key()"
                    [translateParams]="{ name: name() }"
                ></span>
            </div>
            <div class="method-item">
                <span class="method-label observable">Observable</span>
                <span class="method-value">{{ greetingObs() }}</span>
            </div>
            <div class="method-item">
                <span class="method-label signal">Signal (translate)</span>
                <span class="method-value">{{ greetingSignal() }}</span>
            </div>
            <ng-container *translateBlock="let t">
                <div class="method-item">
                    <span class="method-label block">Block (*translateBlock)</span>
                    <span class="method-value">{{ t(key(), { name: name() }) }}</span>
                </div>
            </ng-container>
        </div>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MethodsComparisonComponent {
    private translate = inject(TranslateService);

    key = input("demo.greeting");
    name = signal("World");

    greetingObs = toSignal(
        toObservable(this.name).pipe(
            switchMap((name) => this.translate.getStreamOnTranslationChange(this.key(), { name })),
        ),
    );

    greetingSignal = this.translate.translate(
        this.key,
        computed(() => ({ name: this.name() })),
    );
}

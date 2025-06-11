import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { TranslateDirective, TranslatePipe, TranslateService } from "@ngx-translate/core";


@Component({
    selector: "app-standalone-component",
    standalone: true,
    imports: [TranslateDirective, TranslatePipe],
    styleUrl: "./standalone.component.scss",
    templateUrl: "./standalone.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StandaloneComponent
{
  readonly #translateService = inject(TranslateService);

  constructor() {
    this.#translateService.setTranslation('en', {'from-set-translation': 'Text from setTranslation'}, true);
  }
}

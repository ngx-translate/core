import { Component, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-language-switch',
  standalone: true,
  styleUrl: './language-switch.component.scss',
  templateUrl: './language-switch.component.html',
})
export class LanguageSwitchComponent {
  translateService = inject(TranslateService);
}
